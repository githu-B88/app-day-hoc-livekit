/**
 * LiveKit WebRTC Service & Data Channel Synchronization Manager
 *
 * Quản lý kết nối WebRTC với LiveKit Server (Cloud hoặc Self-hosted),
 * cấu hình băng thông ưu tiên 1080p cho Bảng trắng / Chia sẻ màn hình,
 * và truyền nhận dữ liệu thời gian thực (Data Channel) giữa Giáo viên và Học sinh.
 */

import { Room, RoomEvent, DataPacket_Kind, VideoPresets, LocalTrackPublication } from 'livekit-client';
import { Participant, UserRole, BoardShape, BoardCursor, LiveKitTokenResponse, ClassroomRoom, UserAccount } from '../types';

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

  // Danh sách phòng học dự phòng chất lượng cao (Toán, Lý, Hóa)
  private defaultRooms: ClassroomRoom[] = [
    {
      id: 'room_math_12',
      code: 'TOAN12-CHUYENDE',
      name: 'Chuyên đề Khảo Sát Hàm Số & Tích Phân 12',
      subject: 'math',
      teacherId: 'teacher_1',
      teacherName: 'Thầy Nguyễn Minh',
      status: 'open',
      assignedStudentIds: ['student_1', 'student_2', 'student_3'],
      description: 'Lớp ôn thi Tích phân từng phần và bài toán thực tế',
      createdAt: '2025-01-01T00:00:00.000Z',
      assignedStudents: [
        { id: 'student_1', name: 'Nguyễn Văn An', username: 'vanan', password: '', role: 'student', avatarColor: 'from-blue-500 to-cyan-500', createdAt: '' },
        { id: 'student_2', name: 'Trần Thị Mai', username: 'thimai', password: '', role: 'student', avatarColor: 'from-pink-500 to-rose-500', createdAt: '' },
        { id: 'student_3', name: 'Lê Hoàng', username: 'lehoang', password: '', role: 'student', avatarColor: 'from-emerald-500 to-teal-500', createdAt: '' }
      ]
    },
    {
      id: 'room_phys_11',
      code: 'VATLY-RLC',
      name: 'Luyện Thi Dao Động Cơ & Mạch RLC Nâng Cao',
      subject: 'physics',
      teacherId: 'teacher_1',
      teacherName: 'Thầy Nguyễn Minh',
      status: 'closed',
      assignedStudentIds: ['student_1', 'student_4', 'student_5'],
      description: 'Phương pháp giản đồ vectơ và linh kiện xoay chiều',
      createdAt: '2025-01-01T00:00:00.000Z',
      assignedStudents: [
        { id: 'student_1', name: 'Nguyễn Văn An', username: 'vanan', password: '', role: 'student', avatarColor: 'from-blue-500 to-cyan-500', createdAt: '' },
        { id: 'student_4', name: 'Phạm Quỳnh Anh', username: 'quynhanh', password: '', role: 'student', avatarColor: 'from-violet-500 to-purple-500', createdAt: '' },
        { id: 'student_5', name: 'Vũ Minh Trí', username: 'minhtri', password: '', role: 'student', avatarColor: 'from-amber-500 to-yellow-500', createdAt: '' }
      ]
    },
    {
      id: 'room_chem_10',
      code: 'HOAHOC-BENZEN',
      name: 'Hóa Hữu Cơ: Vòng Benzen & Dẫn Xuất Thơm',
      subject: 'chemistry',
      teacherId: 'teacher_1',
      teacherName: 'Thầy Nguyễn Minh',
      status: 'closed',
      assignedStudentIds: ['student_2', 'student_3', 'student_5'],
      description: 'Cơ chế thế electrophil vòng thơm & đồng đẳng benzen',
      createdAt: '2025-01-01T00:00:00.000Z',
      assignedStudents: [
        { id: 'student_2', name: 'Trần Thị Mai', username: 'thimai', password: '', role: 'student', avatarColor: 'from-pink-500 to-rose-500', createdAt: '' },
        { id: 'student_3', name: 'Lê Hoàng', username: 'lehoang', password: '', role: 'student', avatarColor: 'from-emerald-500 to-teal-500', createdAt: '' },
        { id: 'student_5', name: 'Vũ Minh Trí', username: 'minhtri', password: '', role: 'student', avatarColor: 'from-amber-500 to-yellow-500', createdAt: '' }
      ]
    },
  ];

  // Danh sách học sinh dự phòng
  private defaultStudents: UserAccount[] = [
    { id: 'student_1', name: 'Nguyễn Văn An', username: 'vanan', password: '', role: 'student', avatarColor: 'from-blue-500 to-cyan-500', createdAt: '' },
    { id: 'student_2', name: 'Trần Thị Mai', username: 'thimai', password: '', role: 'student', avatarColor: 'from-pink-500 to-rose-500', createdAt: '' },
    { id: 'student_3', name: 'Lê Hoàng', username: 'lehoang', password: '', role: 'student', avatarColor: 'from-emerald-500 to-teal-500', createdAt: '' },
    { id: 'student_4', name: 'Phạm Quỳnh Anh', username: 'quynhanh', password: '', role: 'student', avatarColor: 'from-violet-500 to-purple-500', createdAt: '' },
    { id: 'student_5', name: 'Vũ Minh Trí', username: 'minhtri', password: '', role: 'student', avatarColor: 'from-amber-500 to-yellow-500', createdAt: '' },
  ];

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

  public getInitialRooms(): ClassroomRoom[] {
    return JSON.parse(JSON.stringify(this.defaultRooms));
  }

  public getDefaultStudents(): UserAccount[] {
    return JSON.parse(JSON.stringify(this.defaultStudents));
  }

  // API: Quản lý Phòng học (Được bọc try/catch và fallback an toàn chống lỗi mạng/JSON pattern)
  public async fetchRooms(): Promise<ClassroomRoom[]> {
    try {
      const res = await fetch('/api/rooms');
      if (!res.ok) {
        return this.getInitialRooms();
      }
      const data = await res.json();
      if (Array.isArray(data?.rooms) && data.rooms.length > 0) {
        return data.rooms;
      }
      return this.getInitialRooms();
    } catch (err: any) {
      console.warn('[LiveKit] Không thể tải phòng từ /api/rooms, dùng dữ liệu dự phòng:', err?.message || err);
      return this.getInitialRooms();
    }
  }

  public async createRoom(payload: {
    name: string;
    code?: string;
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
    return data.room;
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

  // API: Quản lý Học sinh (Được bọc an toàn chống lỗi)
  public async fetchStudents(): Promise<UserAccount[]> {
    try {
      const res = await fetch('/api/students');
      if (!res.ok) {
        return this.getDefaultStudents();
      }
      const data = await res.json();
      if (Array.isArray(data?.students) && data.students.length > 0) {
        return data.students;
      }
      return this.getDefaultStudents();
    } catch (err: any) {
      console.warn('[LiveKit] Không thể tải học sinh từ /api/students, dùng dữ liệu dự phòng:', err?.message || err);
      return this.getDefaultStudents();
    }
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
   * Gắn kết instance Room từ LiveKitRoom vào livekitService
   * Đảm bảo chỉ có DUY NHẤT 1 kết nối WebRTC hoạt động, triệt tiêu hoàn toàn lỗi SCTP Failure / DataChannel Abort
   */
  public attachRoom(room: Room): void {
    if (!room) return;
    if (this.room === room) return;

    if (this.room && this.room !== room) {
      try {
        this.room.removeAllListeners();
      } catch (_) {}
    }

    this.room = room;
    this.isConnected = room.state === 'connected';

    room.on(RoomEvent.Connected, () => {
      this.isConnected = true;
      console.log('✅ [LiveKit] WebRTC Room đã kết nối thành công:', room.name);
    });

    room.on(RoomEvent.Disconnected, (reason) => {
      this.isConnected = false;
      console.log('[LiveKit] WebRTC Room ngắt kết nối:', reason);
    });

    // Lắng nghe dữ liệu Data Channel (Nét vẽ, tọa độ con trỏ, phân quyền, mute)
    room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant, kind, topic) => {
      try {
        const str = new TextDecoder().decode(payload);
        const data = JSON.parse(str);
        this.emit(topic || 'default', data, participant?.identity || 'unknown');
      } catch (e) {
        console.error('Lỗi giải mã LiveKit Data Channel payload:', e);
      }
    });

    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      this.emit('track_subscribed', { track, publication, participantId: participant.identity }, participant.identity);
    });

    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      this.emit('track_unsubscribed', { track, publication, participantId: participant.identity }, participant.identity);
    });
  }

  /**
   * Khởi tạo kết nối WebRTC với LiveKit Server thực tế (Dùng cho Modal cấu hình hoặc kết nối độc lập)
   */
  public async connectToLiveKitRoom(serverUrl: string, token: string): Promise<boolean> {
    try {
      this.serverUrl = serverUrl;
      this.token = token;

      // Nếu đang có room kết nối từ trước, ngắt trước khi tạo room mới
      if (this.room) {
        try {
          this.room.disconnect();
        } catch (_) {}
        this.room = null;
        this.isConnected = false;
      }

      // Khởi tạo LiveKit Room instance với cấu hình tối ưu hóa băng thông cho bảng vẽ
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: VideoPresets.h720.resolution,
        },
        publishDefaults: {
          simulcast: true,
          screenShareEncoding: VideoPresets.h1080.encoding,
          dtx: true,
          red: true,
        },
      });

      this.attachRoom(newRoom);

      // Kết nối vào server
      await newRoom.connect(serverUrl, token);
      this.isConnected = true;
      console.log('Đã kết nối thành công tới LiveKit Server:', serverUrl);

      try {
        await newRoom.localParticipant.enableCameraAndMicrophone();
      } catch (mediaErr: any) {
        console.warn('[LiveKit] Không thể tự động bật Camera/Mic:', mediaErr.message);
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
   * @param topic Chủ đề (TLDRAW_SYNC, remote_mute_control, whiteboard_draw, whiteboard_clear, v.v.)
   * @param data Dữ liệu JSON
   * @param reliable Chọn true (SCTP Reliable) cho nét vẽ/quyền; false (Unreliable) cho tọa độ chuột
   */
  public async broadcastData(topic: string, data: any, reliable: boolean = true): Promise<void> {
    const jsonStr = JSON.stringify(data);
    const encoded = new TextEncoder().encode(jsonStr);

    if (this.room && this.room.localParticipant && this.room.state === 'connected') {
      try {
        await this.room.localParticipant.publishData(encoded, {
          reliable,
          topic,
        });
      } catch (err: any) {
        // Bắt và xử lý êm xuôi các trạng thái DataChannel/SCTP đang chuyển tiếp
        const msg = err?.message || String(err);
        if (
          msg.includes('closed') ||
          msg.includes('Abort') ||
          msg.includes('sctp') ||
          msg.includes('PC manager') ||
          msg.includes('DataChannel')
        ) {
          console.debug('[LiveKit DataChannel] Kênh đang reset hoặc phòng đang chuyển trạng thái:', msg);
        } else {
          console.warn('[LiveKit DataChannel] Cảnh báo gửi dữ liệu:', msg);
        }
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
    this.isConnected = false;
    if (this.room) {
      try {
        this.room.disconnect();
      } catch (e) {
        // ignore disconnect cleanup errors
      }
      this.room = null;
    }
  }

  public isRealLiveKitConnected(): boolean {
    return this.isConnected && this.room !== null;
  }

  public getRoom(): Room | null {
    return this.room;
  }
}

export const livekitService = new LiveKitService();
