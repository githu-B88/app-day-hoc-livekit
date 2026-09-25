/**
 * Bảng Trắng Tương Tác TLDraw LiveKit WebRTC
 * 
 * 1. Mặc định 3-7 học sinh ở chế độ "Chỉ xem" (Read-only).
 * 2. Cung cấp thuộc tính isReadonly={true} cho component <Tldraw /> khi là Học sinh.
 * 3. Ẩn hoàn toàn thanh công cụ (toolbar), không cho học sinh tùy chỉnh bảng.
 * 4. Chỉ Giáo viên mới được cấp công cụ viết nét mềm mại (soft strokes), xóa, vẽ hình, sửa.
 * 5. Đồng bộ nét vẽ qua LiveKit WebRTC Data Channel (SCTP Reliable).
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Tldraw, Editor, TLRecord, TLUiComponents } from 'tldraw';
import 'tldraw/tldraw.css';
import { Room } from 'livekit-client';
import { useRoomContext } from '@livekit/components-react';
import { livekitService } from '../../services/livekitService';
import { Participant, SubjectType } from '../../types';
import {
  Lock,
  Eye,
  PenTool,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  Hand,
  X
} from 'lucide-react';

interface TLDrawLiveKitSyncProps {
  currentUser: Participant;
  room?: Room | null;
  onRaiseHand?: () => void;
  subject?: SubjectType;
}

export const TLDrawLiveKitSync: React.FC<TLDrawLiveKitSyncProps> = ({
  currentUser,
  room: externalRoom,
  onRaiseHand,
  subject = 'math',
}) => {
  const [editor, setEditor] = useState<Editor | null>(null);
  const isSyncingFromRemoteRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showObservationToast, setShowObservationToast] = useState(false);
  const hideToastTimerRef = useRef<any>(null);

  // Dọn dẹp timer khi unmount
  useEffect(() => {
    return () => {
      if (hideToastTimerRef.current) clearTimeout(hideToastTimerRef.current);
    };
  }, []);

  let contextRoom: Room | null = null;
  try {
    contextRoom = useRoomContext();
  } catch (_) {
    // Rendered outside LiveKitRoom context
  }
  const activeRoom = externalRoom || contextRoom || livekitService.getRoom();

  const isTeacher = currentUser.role === 'teacher';
  // Quyền vẽ: Giáo viên luôn có quyền; Học sinh chỉ có khi được Giáo viên chỉ định lên bảng
  const canDraw = isTeacher || Boolean(currentUser.canDraw);
  // Chế độ chỉ xem: Mặc định học sinh chỉ xem (isReadonly = true)
  const isReadonly = !canDraw;

  // Tự động đóng toast quan sát ngay khi học sinh được giáo viên cấp quyền phấn
  useEffect(() => {
    if (canDraw) {
      setShowObservationToast(false);
      if (hideToastTimerRef.current) clearTimeout(hideToastTimerRef.current);
    }
  }, [canDraw]);

  // Cấu hình ẩn toàn bộ thanh công cụ và menu cho học sinh ở chế độ chỉ xem
  const studentComponents = useMemo<TLUiComponents>(
    () => ({
      Toolbar: null,
      MenuPanel: null,
      PageMenu: null,
      StylePanel: null,
      HelperButtons: null,
      NavigationPanel: null,
      SharePanel: null,
      HelpMenu: null,
      DebugPanel: null,
      DebugMenu: null,
      Minimap: null,
      ZoomMenu: null,
    }),
    []
  );

  // 1. Khi Editor khởi tạo (Mount)
  const handleMount = (mountEditor: Editor) => {
    setEditor(mountEditor);

    // Kích hoạt giao diện nền tối phù hợp với phòng học
    try {
      mountEditor.user.updateUserPreferences({ colorScheme: 'dark' });
    } catch (e) {
      console.warn('Không thể cài đặt theme dark cho tldraw:', e);
    }

    // Thiết lập trạng thái Readonly theo phân quyền
    mountEditor.updateInstanceState({ isReadonly });

    // Nếu là Giáo viên, mặc định chọn công cụ vẽ nét mềm (draw tool)
    if (isTeacher) {
      try {
        mountEditor.setCurrentTool('draw');
      } catch (e) {
        // ignore
      }
    }

    // Nếu là Học sinh mới tham gia, gửi yêu cầu xin snapshot toàn bộ bảng hiện tại từ Giáo viên
    if (!isTeacher) {
      setTimeout(() => {
        livekitService.broadcastData(
          'TLDRAW_SYNC',
          {
            type: 'SNAPSHOT_REQUEST',
            senderId: currentUser.id,
          },
          true
        );
      }, 500);
    }
  };

  // Cập nhật trạng thái isReadonly khi quyền thay đổi
  useEffect(() => {
    if (editor) {
      editor.updateInstanceState({ isReadonly });
      if (canDraw && !isTeacher) {
        try {
          editor.setCurrentTool('draw');
        } catch (e) {
          // ignore
        }
      }
    }
  }, [editor, isReadonly, canDraw, isTeacher]);

  // 2. LẮNG NGHE VÀ PHÁT NÉT VẼ QUA LIVEKIT DATA CHANNEL
  useEffect(() => {
    if (!editor) return;

    const cleanupListener = editor.store.listen(
      (entry) => {
        // Bỏ qua các thay đổi do remote cập nhật về máy (tránh vòng lặp phản hồi)
        if (isSyncingFromRemoteRef.current) return;

        // Chỉ thành viên được cấp quyền mới được phát dữ liệu
        if (!canDraw) return;

        const hasChanges =
          Object.keys(entry.changes.added).length > 0 ||
          Object.keys(entry.changes.updated).length > 0 ||
          Object.keys(entry.changes.removed).length > 0;

        if (!hasChanges) return;

        const message = {
          type: 'TLDRAW_DIFF',
          added: entry.changes.added,
          updated: entry.changes.updated,
          removed: entry.changes.removed,
          senderId: activeRoom?.localParticipant?.identity || currentUser.id,
          timestamp: Date.now(),
        };

        // Phát qua LiveKit WebRTC Data Channel (SCTP Reliable)
        livekitService.broadcastData('TLDRAW_SYNC', message, true);
      },
      { source: 'user', scope: 'document' }
    );

    return () => {
      cleanupListener();
    };
  }, [editor, canDraw, currentUser.id, activeRoom]);

  // 3. NHẬN DỮ LIỆU ĐỒNG BỘ TỪ CÁC THÀNH VIÊN KHÁC
  useEffect(() => {
    if (!editor) return;

    const unsubSync = livekitService.on('TLDRAW_SYNC', (data: any, senderId: string) => {
      if (!data || typeof data !== 'object') return;

      // Bỏ qua gói tin do chính máy mình gửi đi
      if (
        data.senderId &&
        (data.senderId === currentUser.id ||
          data.senderId === activeRoom?.localParticipant?.identity)
      ) {
        return;
      }

      if (data.type === 'TLDRAW_DIFF') {
        isSyncingFromRemoteRef.current = true;
        try {
          editor.store.mergeRemoteChanges(() => {
            // Thêm nét vẽ/hình học mới
            if (data.added && typeof data.added === 'object') {
              const addedRecords = Object.values(data.added) as TLRecord[];
              if (addedRecords.length > 0) {
                editor.store.put(addedRecords);
              }
            }

            // Cập nhật nét vẽ/vị trí hình
            if (data.updated && typeof data.updated === 'object') {
              const updatedRecords: TLRecord[] = [];
              for (const key of Object.keys(data.updated)) {
                const pair = data.updated[key];
                if (pair && pair[1]) {
                  updatedRecords.push(pair[1]);
                }
              }
              if (updatedRecords.length > 0) {
                editor.store.put(updatedRecords);
              }
            }

            // Xóa nét vẽ
            if (data.removed && typeof data.removed === 'object') {
              const removedIds = Object.keys(data.removed) as any[];
              if (removedIds.length > 0) {
                editor.store.remove(removedIds);
              }
            }
          });
        } catch (err) {
          console.warn('[TLDraw] Lỗi khi hòa trộn nét vẽ remote:', err);
        } finally {
          isSyncingFromRemoteRef.current = false;
        }
      } else if (data.type === 'SNAPSHOT_REQUEST' && isTeacher) {
        // Giáo viên gửi toàn bộ bản ghi cho học sinh mới vào
        const records = editor.store.allRecords();
        livekitService.broadcastData(
          'TLDRAW_SYNC',
          {
            type: 'SNAPSHOT_RESPONSE',
            records,
            senderId: currentUser.id,
          },
          true
        );
      } else if (data.type === 'SNAPSHOT_RESPONSE' && !isTeacher) {
        // Học sinh nhận và nạp snapshot từ Giáo viên
        if (data.records && Array.isArray(data.records)) {
          isSyncingFromRemoteRef.current = true;
          try {
            editor.store.mergeRemoteChanges(() => {
              editor.store.put(data.records);
            });
          } catch (err) {
            console.warn('[TLDraw] Lỗi nạp snapshot tldraw:', err);
          } finally {
            isSyncingFromRemoteRef.current = false;
          }
        }
      } else if (data.type === 'CLEAR_BOARD') {
        // Xóa sạch bảng khi Giáo viên bấm nút dọn bảng
        isSyncingFromRemoteRef.current = true;
        try {
          const allShapes = editor.getCurrentPageShapeIds();
          if (allShapes && allShapes.size > 0) {
            editor.deleteShapes([...allShapes]);
          }
        } finally {
          isSyncingFromRemoteRef.current = false;
        }
      }
    });

    return () => {
      unsubSync();
    };
  }, [editor, isTeacher, currentUser.id, activeRoom]);

  // Hành động xóa sạch bảng (dành cho Giáo viên)
  const handleClearBoard = () => {
    if (!editor || !isTeacher) return;
    const confirmClear = window.confirm('Thầy/Cô có chắc chắn muốn xóa toàn bộ nội dung trên bảng tldraw?');
    if (!confirmClear) return;

    const allShapes = editor.getCurrentPageShapeIds();
    if (allShapes && allShapes.size > 0) {
      editor.deleteShapes([...allShapes]);
    }

    livekitService.broadcastData(
      'TLDRAW_SYNC',
      {
        type: 'CLEAR_BOARD',
        senderId: currentUser.id,
      },
      true
    );
  };

  // Theo dõi thay đổi kích thước container (khi ẩn/hiện camera strip hoặc xoay màn hình thiết bị)
  useEffect(() => {
    if (!containerRef.current || !window.ResizeObserver) return;
    const ro = new ResizeObserver(() => {
      if (editor) {
        try {
          (editor as any).updateViewportPageBounds?.();
        } catch (_) {
          // ignore
        }
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [editor]);

  // Xử lý khi học sinh click/chạm vào bảng khi chưa được cấp quyền phấn:
  // Hiển thị toast thông báo thoáng qua (2.5 giây) và có nút đóng [x], không hiển thị liên tục làm mất không gian xem bảng
  const handleBoardPointerDown = () => {
    if (isReadonly) {
      setShowObservationToast(true);
      if (hideToastTimerRef.current) clearTimeout(hideToastTimerRef.current);
      hideToastTimerRef.current = setTimeout(() => {
        setShowObservationToast(false);
      }, 2500);
    }
  };

  // Ép kiểu Tldraw để truyền thuộc tính isReadonly={true} và hideUi theo yêu cầu
  const TldrawComponent = Tldraw as any;

  return (
    <div
      ref={containerRef}
      onPointerDownCapture={handleBoardPointerDown}
      className={`relative w-full h-full bg-slate-950 overflow-hidden ${isReadonly ? 'tldraw-student-readonly' : ''}`}
    >
      {/* 1. THANH TRẠNG THÁI & PHÂN QUYỀN TRÊN ĐẦU BẢNG */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-2 pointer-events-auto">
        {isTeacher ? (
          <div className="flex items-center gap-2 bg-slate-900/90 border border-emerald-500/40 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-300">
              Bảng Trắng TLDraw (Giáo viên - Toàn quyền)
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              | Nét vẽ Vector Mềm mại
            </span>
            <button
              onClick={handleClearBoard}
              title="Xóa trắng toàn bộ bảng"
              className="ml-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-medium transition cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Xóa bảng</span>
            </button>
          </div>
        ) : canDraw ? (
          <div className="flex items-center gap-2 bg-emerald-950/90 border border-emerald-500 px-3.5 py-1.5 rounded-xl shadow-2xl backdrop-blur-md text-xs text-emerald-200 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>
              <strong>Được cấp quyền cầm phấn:</strong> Thầy/Cô đã cho phép bạn viết lên bảng TLDraw!
            </span>
          </div>
        ) : null}
      </div>

      {/* Thông báo Chế độ quan sát dạng Toast nổi: CHỈ hiển thị thoáng qua khi học sinh chạm vào bảng mà chưa được cấp quyền, có nút đóng X */}
      {isReadonly && showObservationToast && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 bg-slate-900/95 border border-amber-500/60 px-3.5 py-1.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs text-amber-200 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-auto max-w-[90vw]">
          <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">
            <strong>Chế độ Quan sát:</strong> Chưa được cấp quyền phấn.
          </span>
          {onRaiseHand && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRaiseHand();
                setShowObservationToast(false);
              }}
              className="ml-1 flex items-center gap-1 px-2 py-0.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[11px] font-bold transition cursor-pointer shadow active:scale-95 shrink-0"
            >
              <Hand className="w-3 h-3 text-amber-300 animate-bounce" />
              <span>Giơ tay ✋</span>
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowObservationToast(false);
            }}
            title="Đóng thông báo"
            className="p-1 rounded-lg text-slate-400 hover:text-amber-200 hover:bg-amber-500/10 transition shrink-0 ml-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. COMPONENT TLDraw VỚI PHÂN QUYỀN isReadonly={true} VÀ ẨN TOOLBAR CHO HỌC SINH */}
      <div className="w-full h-full select-none">
        <TldrawComponent
          isReadonly={isReadonly}
          hideUi={isReadonly}
          components={isReadonly ? studentComponents : undefined}
          onMount={handleMount}
          autoFocus={false}
        />
      </div>
    </div>
  );
};
