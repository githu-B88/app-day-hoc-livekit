/**
 * Bảng Trắng Tương Tác TLDraw LiveKit WebRTC
 * 
 * 1. Mặc định 3-7 học sinh ở chế độ "Chỉ xem" (Read-only).
 * 2. Cung cấp thuộc tính isReadonly={true} cho component <Tldraw /> khi là Học sinh.
 * 3. Ẩn hoàn toàn thanh công cụ (toolbar), không cho học sinh tùy chỉnh bảng.
 * 4. Chỉ Giáo viên mới được cấp công cụ viết nét mềm mại (soft strokes), xóa, vẽ hình, sửa.
 * 5. Đồng bộ nét vẽ qua LiveKit WebRTC Data Channel (SCTP Reliable).
 */

import React, { useEffect, useRef, useState, useMemo, memo } from 'react';
import {
  Tldraw,
  Editor,
  TLRecord,
  TLUiComponents,
  DefaultToolbar,
  DefaultStylePanel,
  TLUiStylePanelProps,
  DefaultToolbarProps,
} from 'tldraw';
import 'tldraw/tldraw.css';
import { Room } from 'livekit-client';
import { useRoomContext } from '@livekit/components-react';
import { livekitService } from '../../services/livekitService';
import { Participant, SubjectType } from '../../types';
import {
  Eye,
  PenTool,
  Sparkles,
  Trash2,
  Hand,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';

interface ClearBoardContextType {
  isTeacher: boolean;
  onClearBoard?: () => void;
}

const ClearBoardContext = React.createContext<ClearBoardContextType>({
  isTeacher: false,
});

/**
 * Dropdown chọn màu và nét vẽ ở góc trên bên phải bảng
 * Thu gọn thành 1 nút bấm nhỏ gọn, không che nút mở camera strip bên phải
 */
const CollapsibleStylePanel: React.FC<TLUiStylePanelProps> = memo((props) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-auto mr-3 mt-3 relative flex flex-col items-end z-30 select-none"
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/95 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-emerald-500/50 shadow-xl backdrop-blur-md text-xs font-semibold transition cursor-pointer group active:scale-95"
        title="Bảng màu sắc & kiểu nét vẽ (Nhấp để mở/đóng)"
      >
        <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-400 shadow-xs ring-1 ring-white/30 group-hover:scale-110 transition shrink-0" />
        <span className="text-xs font-medium">Bảng màu & Nét</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[164px] bg-slate-900/95 border border-slate-700/90 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 z-40">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-800/60">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-400" />
              <span>Màu & Nét vẽ</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition cursor-pointer"
              title="Đóng bảng màu"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-1 max-h-[360px] overflow-y-auto [&_.tlui-style-panel]:m-0 [&_.tlui-style-panel__wrapper]:m-0">
            <DefaultStylePanel {...props} />
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * Hàng công cụ phía dưới bảng (Select, Hand, Draw, Eraser...)
 * Bọc lại vào dropdown/nút thu gọn cho gọn gàng, tối ưu không gian vẽ
 */
const CollapsibleToolbar: React.FC<DefaultToolbarProps> = memo((props) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isTeacher, onClearBoard } = React.useContext(ClearBoardContext);

  return (
    <div className="pointer-events-auto flex flex-col items-center mb-2 z-30 select-none">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/95 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-emerald-500/50 shadow-2xl backdrop-blur-md text-xs font-semibold transition cursor-pointer group active:scale-95 animate-in fade-in duration-150"
          title="Mở hàng công cụ vẽ (Select, Bút vẽ, Tẩy, Hình học...)"
        >
          <div className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
            <PenTool className="w-3.5 h-3.5" />
          </div>
          <span>Hàng công cụ vẽ (Select, Bút, Tẩy...)</span>
          <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition" />
        </button>
      ) : (
        <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between w-full max-w-xl px-3 py-1 bg-slate-900/95 border border-slate-700/80 rounded-t-xl text-xs text-slate-300 backdrop-blur-md mb-0.5 shadow-lg">
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              <PenTool className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hàng công cụ vẽ</span>
            </div>
            <div className="flex items-center gap-2">
              {isTeacher && onClearBoard && (
                <button
                  type="button"
                  onClick={onClearBoard}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-medium transition cursor-pointer"
                  title="Xóa trắng bảng vẽ"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa bảng</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-600/50 transition cursor-pointer"
                title="Thu gọn hàng công cụ để tối đa không gian bảng trắng"
              >
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                <span>Thu gọn</span>
              </button>
            </div>
          </div>
          <DefaultToolbar {...props} />
        </div>
      )}
    </div>
  );
});

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

  // Cấu hình ẩn toàn bộ thanh công cụ và menu cho học sinh ở chế độ chỉ xem
  const studentComponents = useMemo<TLUiComponents>(
    () => ({
      Toolbar: null,
      MenuPanel: null,
      MainMenu: null,
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

  // Cấu hình thanh công cụ tinh giản cho Giáo viên & Học sinh được cấp phấn:
  // - Ẩn nút 3 gạch ngang (MainMenu, MenuPanel, PageMenu)
  // - Bọc bảng màu & nét vào dropdown góc trên bên phải
  // - Bọc hàng công cụ phía dưới vào dropdown/nút thu gọn
  // - Ẩn navigation panel, help menu không quan trọng
  const activeComponents = useMemo<TLUiComponents>(
    () => ({
      MainMenu: null,
      MenuPanel: null,
      PageMenu: null,
      StylePanel: CollapsibleStylePanel,
      Toolbar: CollapsibleToolbar,
      NavigationPanel: null,
      HelpMenu: null,
      DebugPanel: null,
      DebugMenu: null,
      SharePanel: null,
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

  // Xử lý khi học sinh click/chạm vào bảng khi chưa được cấp quyền phấn
  const handleBoardPointerDown = () => {
    if (isReadonly) {
      setShowObservationToast(true);
      if (hideToastTimerRef.current) clearTimeout(hideToastTimerRef.current);
      hideToastTimerRef.current = setTimeout(() => {
        setShowObservationToast(false);
      }, 4000);
    }
  };

  // Ép kiểu Tldraw để truyền thuộc tính isReadonly={true} và hideUi theo yêu cầu
  const TldrawComponent = Tldraw as any;

  return (
    <ClearBoardContext.Provider value={{ isTeacher, onClearBoard: handleClearBoard }}>
      <div
        ref={containerRef}
        onPointerDownCapture={handleBoardPointerDown}
        className={`relative w-full h-full bg-slate-950 overflow-hidden ${isReadonly ? 'tldraw-student-readonly' : ''}`}
      >
        {/* 1. THANH TRẠNG THÁI PHÂN QUYỀN TRÊN ĐẦU BẢNG (Đã ẩn thông báo giáo viên và nút xóa bảng ở góc trên bên trái để giải phóng không gian học tập) */}
        <div className="absolute top-3 left-3 z-30 flex items-center gap-2 pointer-events-auto">
          {canDraw && !isTeacher ? (
            <div className="flex items-center gap-2 bg-emerald-950/90 border border-emerald-500 px-3.5 py-1.5 rounded-xl shadow-2xl backdrop-blur-md text-xs text-emerald-200 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>
                <strong>Được cấp quyền cầm phấn:</strong> Thầy/Cô đã cho phép bạn viết lên bảng TLDraw!
              </span>
            </div>
          ) : null}
        </div>

        {/* Thông báo Chế độ quan sát dạng Toast nổi: CHỈ hiển thị khi học sinh click vào bảng mà chưa được cấp quyền */}
        {isReadonly && showObservationToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-slate-900/95 border border-amber-500/60 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs sm:text-sm text-amber-200 animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-auto">
            <Eye className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Chế độ Quan sát:</strong> Bạn chưa được cấp quyền phấn của giáo viên.
            </span>
            {onRaiseHand && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRaiseHand();
                  setShowObservationToast(false);
                }}
                className="ml-1 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-bold transition cursor-pointer shadow active:scale-95 shrink-0"
              >
                <Hand className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                <span>Giơ tay lên bảng ✋</span>
              </button>
            )}
          </div>
        )}

        {/* 2. COMPONENT TLDraw VỚI THANH CÔNG CỤ TINH GIẢN & PHÂN QUYỀN */}
        <div className="w-full h-full select-none">
          <TldrawComponent
            isReadonly={isReadonly}
            hideUi={isReadonly}
            components={isReadonly ? studentComponents : activeComponents}
            onMount={handleMount}
            autoFocus={false}
          />
        </div>
      </div>
    </ClearBoardContext.Provider>
  );
};
