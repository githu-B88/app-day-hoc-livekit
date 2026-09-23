/**
 * LiveKit WebRTC Service & Data Channel Synchronization Manager
 *
 * Quản lý kết nối WebRTC với LiveKit Server (Cloud hoặc Self-hosted),
 * cấu hình băng thông ưu tiên 1080p cho Bảng trắng / Chia sẻ màn hình,
 * và truyền nhận dữ liệu thời gian thực (Data Channel) giữa Giáo viên và Học sinh.
 */

import { Room, RoomEvent, DataPacket_Kind, VideoPresets, LocalTrackPublication } from 'livekit-client';
import { Participant, UserRole, BoardShape, BoardCursor, LiveKitTokenResponse } from '../types';

export type DataChannelCallback = (data: any, participantId: string, topic?: string) => void;

class LiveKitService {
  private room: Room | null = null;
  private isConnected: boolean = false;
  private token: string | null = null;
  private serverUrl: string =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LIVEKIT_URL) ||
    (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_LIVEKIT_URL || process.env?.LIVEKIT_URL)) ||
    'wss://eduwhite-i0qhtq4t.livekit.cloud';
  private currentRole: UserRole = 'teacher';
  private currentUserId: string = 'teacher_1';
  private currentUserName: string = 'Thầy Minh (Giáo viên)';
  private listeners: Map<string, Set<DataChannelCallback>> = new Map();

  // Danh sách học sinh mẫu cho lớp học nhóm nhỏ (3-7 người)
  private defaultParticipants: Participant[] = [
    {
      id: 'teacher_1',
      name: 'Thầy Minh',
      role: 'teacher',
      avatarColor: 'from-emerald-500 to-teal-700',
      isMuted: false,
      isVideoOff: false,
      isHandRaised: false,
      canDraw: true,
      isSpeaking: true,
      cameraStreamQuality: '1080p',
    },
    {
      id: 'student_1',
      name: 'Nguyễn An (Toán)',
      role: 'student',
      avatarColor: 'from-blue-500 to-indigo-700',
      isMuted: true,
      isVideoOff: false,
      isHandRaised: true,
      canDraw: false,
      isSpeaking: false,
      cameraStreamQuality: '360p',
    },
    {
      id: 'student_2',
      name: 'Trần Bình (Lý)',
      role: 'student',
      avatarColor: 'from-amber-500 to-orange-700',
      isMuted: false,
      isVideoOff: false,
      isHandRaised: false,
      canDraw: false,
      isSpeaking: false,
      cameraStreamQuality: '360p',
    },
    {
      id: 'student_3',
      name: 'Lê Mai (Hóa)',
      role: 'student',
      avatarColor: 'from-rose-500 to-pink-700',
      isMuted: true,
      isVideoOff: false,
      isHandRaised: false,
      canDraw: false,
      isSpeaking: false,
      cameraStreamQuality: '360p',
    },
    {
      id: 'student_4',
      name: 'Phạm Dũng',
      role: 'student',
      avatarColor: 'from-cyan-500 to-blue-700',
      isMuted: true,
      isVideoOff: false,
      isHandRaised: false,
      canDraw: false,
      isSpeaking: false,
      cameraStreamQuality: '360p',
    },
    {
      id: 'student_5',
      name: 'Hoàng Yến',
      role: 'student',
      avatarColor: 'from-purple-500 to-violet-700',
      isMuted: true,
      isVideoOff: true,
      isHandRaised: false,
      canDraw: false,
      isSpeaking: false,
      cameraStreamQuality: '360p',
    },
  ];

  public getInitialParticipants(): Participant[] {
    return JSON.parse(JSON.stringify(this.defaultParticipants));
  }

  /**
   * Gọi Backend API để lấy LiveKit Access Token (áp dụng rào chắn bảo mật 3 điều kiện)
   */
  public async getLiveKitToken(
    roomName: string,
    participantName: string,
    role: UserRole,
    userId?: string,
    identity?: string
  ): Promise<LiveKitTokenResponse> {
    const response = await fetch('/api/livekit/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: roomName,
        roomName,
        participantName,
        role,
        userId,
        identity,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || `Lỗi truy cập (${response.status})`);
    }

    return data;
  }

  // API: Đăng nhập
  public async login(username: string, password: string, role?: UserRole) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Đăng nhập thất bại');
    }
    return data.user;
  }

  // API: Quản lý Phòng học
  public async fetchRooms() {
    const res = await fetch('/api/rooms');
    const data = await res.json();
    return data.rooms || [];
  }

  public async createRoom(payload: {
    name: string;
    subject: 'math' | 'physics' | 'chemistry';
    teacherId: string;
    assignedStudentIds: string[];
    description?: string;
  }) {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Không thể tạo phòng học');
    }
    return data.room;
  }

  public async updateRoomStatus(roomId: string, status: 'open' | 'closed') {
    const res = await fetch(`/api/rooms/${roomId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Không thể cập nhật trạng thái phòng');
    }
    return data;
  }

  public async updateRoom(roomId: string, payload: any) {
    const res = await fetch(`/api/rooms/${roomId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Không thể cập nhật phòng');
    }
    return data.room;
  }

  public async deleteRoom(roomId: string) {
    const res = await fetch(`/api/rooms/${roomId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Không thể xóa phòng học');
    }
    return true;
  }

  // API: Quản lý Học sinh
  public async fetchStudents() {
    const res = await fetch('/api/students');
    const data = await res.json();
    return data.students || [];
  }

  public async createStudent(payload: { name: string; username: string; password: string }) {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Không thể tạo tài khoản học sinh');
    }
    return data.student;
  }

  public async deleteStudent(studentId: string) {
    const res = await fetch(`/api/students/${studentId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Không thể xóa học sinh');
    }
    return true;
  }

  /**
   * Khởi tạo kết nối WebRTC với LiveKit Server thực tế
   */
  public async connectToLiveKitRoom(serverUrl: string, token: string): Promise<boolean> {
    try {
      this.serverUrl = serverUrl;
      this.token = token;

      // Khởi tạo LiveKit Room instance với cấu hình tối ưu hóa băng thông cho bảng vẽ
      this.room = new Room({
        // Tối ưu hóa WebRTC cho học tập trực tuyến
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: VideoPresets.h720.resolution,
        },
        publishDefaults: {
          simulcast: true,
          // Ưu tiên màn hình và bảng trắng với contentHint detail để công thức Toán/Lý/Hóa sắc nét
          screenShareEncoding: VideoPresets.h1080.encoding,
          dtx: true, // Tiết kiệm băng thông audio khi không nói
          red: true,
        },
      });

      // Lắng nghe dữ liệu Data Channel (Nét vẽ, tọa độ con trỏ, phân quyền)
      this.room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant, kind, topic) => {
        try {
          const str = new TextDecoder().decode(payload);
          const data = JSON.parse(str);
          this.emit(topic || 'default', data, participant?.identity || 'unknown');
        } catch (e) {
          console.error('Lỗi giải mã LiveKit Data Channel payload:', e);
        }
      });

      // Lắng nghe Track Subscribed từ các thành viên khác
      this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log(`[LiveKit] Track ${track.kind} subscribed từ ${participant.identity}`);
        this.emit('track_subscribed', { track, publication, participantId: participant.identity }, participant.identity);
      });

      this.room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        this.emit('track_unsubscribed', { track, publication, participantId: participant.identity }, participant.identity);
      });

      // Kết nối vào server
      await this.room.connect(serverUrl, token);
      this.isConnected = true;
      console.log('Đã kết nối thành công tới LiveKit Server:', serverUrl);

      // Tự động bật camera và micro nếu trình duyệt cho phép
      try {
        await this.room.localParticipant.enableCameraAndMicrophone();
        console.log('[LiveKit] Đã publish camera và mic cục bộ thành công');
      } catch (mediaErr: any) {
        console.warn('[LiveKit] Không thể tự động bật Camera/Mic (có thể do chưa cấp quyền):', mediaErr.message);
      }

      return true;
    } catch (err) {
      console.warn('Lỗi kết nối LiveKit Server Production:', err);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Phát dữ liệu nét vẽ hoặc sự kiện qua LiveKit Data Channel
   * @param topic Chủ đề (whiteboard_stroke, whiteboard_cursor, permissions)
   * @param data Dữ liệu JSON
   * @param reliable Chọn true (SCTP Reliable) cho nét vẽ/quyền; false (Unreliable) cho tọa độ chuột cực nhanh
   */
  public async broadcastData(topic: string, data: any, reliable: boolean = true): Promise<void> {
    const jsonStr = JSON.stringify(data);
    const encoded = new TextEncoder().encode(jsonStr);

    if (this.room && this.isConnected && this.room.localParticipant) {
      try {
        await this.room.localParticipant.publishData(encoded, {
          reliable,
          topic,
        });
      } catch (err) {
        console.error('Lỗi gửi LiveKit Data Channel:', err);
      }
    }

    // Luôn phát nội bộ cho các listener trong ứng dụng
    this.emit(topic, data, this.currentUserId);
  }

  /**
   * Đăng ký lắng nghe sự kiện từ Data Channel
   */
  public on(topic: string, callback: DataChannelCallback): () => void {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set());
    }
    this.listeners.get(topic)!.add(callback);

    return () => {
      this.listeners.get(topic)?.delete(callback);
    };
  }

  private emit(topic: string, data: any, participantId: string): void {
    const topicListeners = this.listeners.get(topic);
    if (topicListeners) {
      topicListeners.forEach((cb) => {
        try {
          cb(data, participantId, topic);
        } catch (e) {
          console.error(e);
        }
      });
    }
  }

  public disconnect(): void {
    if (this.room) {
      this.room.disconnect();
      this.room = null;
    }
    this.isConnected = false;
  }

  public isRealLiveKitConnected(): boolean {
    return this.isConnected && this.room !== null;
  }

  public getRoom(): Room | null {
    return this.room;
  }
}

export const livekitService = new LiveKitService();
