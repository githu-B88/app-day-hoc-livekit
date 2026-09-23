/**
 * Đồng bộ Bảng trắng tldraw qua LiveKit WebRTC Data Channel
 * 
 * Sử dụng:
 * 1. room.localParticipant.publishData để gửi nét vẽ và thay đổi hình học (SCTP reliable).
 * 2. RoomEvent.DataReceived để nhận nét vẽ từ các thành viên khác và cập nhật store.
 * 3. Hỗ trợ rào chắn phân quyền: Học sinh ở chế độ chỉ đọc (Readonly) cho đến khi được Giáo viên cấp quyền.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Tldraw, Editor, TLRecord } from 'tldraw';
import 'tldraw/tldraw.css';
import { Room, RoomEvent, RemoteParticipant } from 'livekit-client';
import { useRoomContext } from '@livekit/components-react';
import { livekitService } from '../../services/livekitService';
import { Participant } from '../../types';

interface TLDrawLiveKitSyncProps {
  currentUser: Participant;
  room?: Room | null;
  onRaiseHand?: () => void;
}

export const TLDrawLiveKitSync: React.FC<TLDrawLiveKitSyncProps> = ({
  currentUser,
  room: externalRoom,
  onRaiseHand,
}) => {
  const [editor, setEditor] = useState<Editor | null>(null);
  let contextRoom: Room | null = null;
  try {
    contextRoom = useRoomContext();
  } catch (_) {
    // Fallback if rendered outside LiveKitRoom
  }
  const activeRoom = externalRoom || contextRoom || livekitService.getRoom();
  const isTeacher = currentUser.role === 'teacher';
  const canDraw = isTeacher || currentUser.canDraw;
  const isSyncingFromRemoteRef = useRef(false);

  // 1. Khởi tạo Editor và thiết lập quyền ghi/chỉ đọc
  const handleMount = (mountEditor: Editor) => {
    setEditor(mountEditor);

    // Khóa quyền vẽ nếu là học sinh chưa được cấp quyền
    mountEditor.updateInstanceState({ isReadonly: !canDraw });

    // Yêu cầu snapshot toàn bộ bảng nếu là học sinh mới tham gia phòng
    if (!isTeacher && activeRoom?.localParticipant) {
      try {
        const reqMsg = {
          type: 'SNAPSHOT_REQUEST',
          senderId: activeRoom.localParticipant.identity,
        };
        activeRoom.localParticipant.publishData(
          new TextEncoder().encode(JSON.stringify(reqMsg)),
          { reliable: true, topic: 'TLDRAW_SYNC' }
        );
      } catch (err) {
        console.warn('Không thể gửi SNAPSHOT_REQUEST qua LiveKit:', err);
      }
    }
  };

  // Cập nhật trạng thái chỉ đọc khi quyền canDraw thay đổi
  useEffect(() => {
    if (editor) {
      editor.updateInstanceState({ isReadonly: !canDraw });
    }
  }, [canDraw, editor]);

  // 2. GỬI NÉT VẼ QUA LIVEKIT: Lắng nghe thay đổi cục bộ và gọi room.localParticipant.publishData
  useEffect(() => {
    if (!editor || !activeRoom) return;

    const cleanupListener = editor.store.listen(
      (entry) => {
        // Bỏ qua nếu thay đổi đến từ remote nhận được qua mạng (tránh lặp vòng lặp echo vô tận)
        if (isSyncingFromRemoteRef.current) return;

        // Chỉ người có quyền mới được phát dữ liệu nét vẽ
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
          senderId: activeRoom.localParticipant?.identity || currentUser.id,
          timestamp: Date.now(),
        };

        const payload = new TextEncoder().encode(JSON.stringify(message));

        // Phát qua LiveKit Data Channel chế độ Reliable (SCTP)
        if (activeRoom.localParticipant) {
          activeRoom.localParticipant
            .publishData(payload, {
              reliable: true,
              topic: 'TLDRAW_SYNC',
            })
            .catch((err) => console.error('Lỗi khi publishData tldraw qua LiveKit:', err));
        }
      },
      { source: 'user', scope: 'document' }
    );

    return () => {
      cleanupListener();
    };
  }, [editor, activeRoom, canDraw, currentUser.id]);

  // 3. NHẬN NÉT VẼ QUA LIVEKIT: Lắng nghe RoomEvent.DataReceived và cập nhật editor.store
  useEffect(() => {
    if (!editor || !activeRoom) return;

    const handleDataReceived = (
      payload: Uint8Array,
      participant?: RemoteParticipant,
      kind?: any,
      topic?: string
    ) => {
      if (topic !== 'TLDRAW_SYNC') return;

      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);

        // Bỏ qua gói tin do chính bản thân gửi đi
        if (data.senderId && data.senderId === activeRoom.localParticipant?.identity) {
          return;
        }

        if (data.type === 'TLDRAW_DIFF') {
          isSyncingFromRemoteRef.current = true;
          try {
            editor.store.mergeRemoteChanges(() => {
              // Thêm các shape / nét vẽ mới
              if (data.added && typeof data.added === 'object') {
                const addedRecords = Object.values(data.added) as TLRecord[];
                if (addedRecords.length > 0) {
                  editor.store.put(addedRecords);
                }
              }

              // Cập nhật các shape đang di chuyển hoặc chỉnh sửa
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

              // Xóa các shape bị tẩy/xóa
              if (data.removed && typeof data.removed === 'object') {
                const removedIds = Object.keys(data.removed) as any[];
                if (removedIds.length > 0) {
                  editor.store.remove(removedIds);
                }
              }
            });
          } finally {
            isSyncingFromRemoteRef.current = false;
          }
        } else if (data.type === 'SNAPSHOT_REQUEST' && isTeacher) {
          // Khi học sinh mới vào yêu cầu dữ liệu, Giáo viên gửi toàn bộ records hiện tại cho học sinh
          const records = editor.store.allRecords();
          const responseMsg = {
            type: 'SNAPSHOT_RESPONSE',
            records,
            senderId: activeRoom.localParticipant?.identity,
          };
          activeRoom.localParticipant?.publishData(
            new TextEncoder().encode(JSON.stringify(responseMsg)),
            { reliable: true, topic: 'TLDRAW_SYNC' }
          );
        } else if (data.type === 'SNAPSHOT_RESPONSE' && !isTeacher) {
          // Nạp danh sách records từ Giáo viên vào bảng của Học sinh
          if (data.records && Array.isArray(data.records)) {
            isSyncingFromRemoteRef.current = true;
            try {
              editor.store.mergeRemoteChanges(() => {
                editor.store.put(data.records);
              });
            } finally {
              isSyncingFromRemoteRef.current = false;
            }
          }
        }
      } catch (err) {
        console.error('Lỗi khi phân tích dữ liệu tldraw từ LiveKit:', err);
      }
    };

    activeRoom.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      activeRoom.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [editor, activeRoom, isTeacher]);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden">
      {/* Khung cảnh báo khi học sinh chưa được cấp quyền cầm phấn */}
      {!canDraw && (
        <div className="absolute top-3 left-3 z-50 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-amber-500/40 text-amber-200 text-xs shadow-2xl backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>
            <strong>Chế độ Quan sát:</strong> Bạn đang theo dõi bài giảng của Thầy cô.
          </span>
          {onRaiseHand && (
            <button
              onClick={onRaiseHand}
              className="ml-2 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold transition"
            >
              Giơ tay lên bảng ✋
            </button>
          )}
        </div>
      )}

      {/* Component tldraw */}
      <div className="w-full h-full">
        <Tldraw onMount={handleMount} autoFocus={false} />
      </div>
    </div>
  );
};
