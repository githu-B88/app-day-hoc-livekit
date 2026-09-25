/**
 * Lớp Học Trực Tuyến Toán - Lý - Hóa (WebRTC LiveKit & Whiteboard)
 * @license Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ClassroomHeader } from './components/ClassroomHeader';
import { StudentVideoStrip } from './components/StudentVideoStrip';
import { ChalkboardCanvas } from './components/Whiteboard/ChalkboardCanvas';
import { TLDrawLiveKitSync } from './components/Whiteboard/TLDrawLiveKitSync';
import { AudioVideoControls } from './components/AudioVideoControls';
import { LiveKitConfigModal } from './components/LiveKitConfigModal';
import { TechDocsModal } from './components/TechDocsModal';
import { LoginPage } from './components/Auth/LoginPage';
import { TeacherAdminDashboard } from './components/Admin/TeacherAdminDashboard';
import { StudentPortal } from './components/Student/StudentPortal';
import { SubjectType, Participant, UserAccount, ClassroomRoom, AppViewMode } from './types';
import { livekitService } from './services/livekitService';
import { LiveKitRoom, RoomAudioRenderer, useRoomContext } from '@livekit/components-react';
import '@livekit/components-styles';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Tự động gắn kết LiveKit Room instance vào livekitService khi kết nối thành công,
 * đảm bảo bảng trắng, mic control và video strip đều chia sẻ DUY NHẤT 1 kết nối WebRTC.
 */
function LiveKitRoomAttachment() {
  const room = useRoomContext();
  useEffect(() => {
    if (room) {
      livekitService.attachRoom(room);
    }
  }, [room]);
  return null;
}

export default function App() {
  // Authentication & Navigation State
  const [authAccount, setAuthAccount] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('eduwhite_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Mặc định sử dụng Bảng trắng TLDraw
  const [whiteboardType, setWhiteboardType] = useState<'tldraw' | 'chalkboard'>('tldraw');
  // Trạng thái thu gọn/mở rộng thanh camera bên phải để tối đa hóa không gian bảng trắng
  const [isVideoStripCollapsed, setIsVideoStripCollapsed] = useState(false);

  const [viewMode, setViewMode] = useState<AppViewMode>(() => {
    try {
      const saved = localStorage.getItem('eduwhite_user');
      if (saved) {
        const user: UserAccount = JSON.parse(saved);
        return user.role === 'teacher' ? 'admin_dashboard' : 'student_portal';
      }
    } catch {
      // fallback
    }
    return 'login';
  });

  const [activeRoom, setActiveRoom] = useState<ClassroomRoom | null>(null);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [tokenErrorMessage, setTokenErrorMessage] = useState<string | null>(null);
  const [livekitServerUrl, setLivekitServerUrl] = useState<string>(() => {
    return (
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LIVEKIT_URL) ||
      (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_LIVEKIT_URL || process.env?.LIVEKIT_URL)) ||
      'wss://eduwhite-i0qhtq4t.livekit.cloud'
    );
  });
  const [isRoomConnecting, setIsRoomConnecting] = useState<boolean>(false);
  const [roomConnectionError, setRoomConnectionError] = useState<string | null>(null);

  // Classroom States
  const [subject, setSubject] = useState<SubjectType>('math');
  const [participants, setParticipants] = useState<Participant[]>(() =>
    livekitService.getInitialParticipants()
  );
  const [currentUserId, setCurrentUserId] = useState<string>('teacher_1');
  const [isLiveKitModalOpen, setIsLiveKitModalOpen] = useState<boolean>(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState<boolean>(false);
  const [isRealLiveKitConnected, setIsRealLiveKitConnected] = useState<boolean>(false);

  // Active current user object in classroom
  const currentUser = participants.find((p) => p.id === currentUserId) || participants[0];

  // Sync auth account to classroom participant when entered
  useEffect(() => {
    if (authAccount) {
      if (authAccount.role === 'teacher') {
        setCurrentUserId('teacher_1');
      } else {
        // Find or map student
        const existing = participants.find((p) => p.id === authAccount.id || p.name === authAccount.name);
        if (existing) {
          setCurrentUserId(existing.id);
        } else {
          // Add student to participants
          const newStudent: Participant = {
            id: authAccount.id,
            name: authAccount.name,
            role: 'student',
            avatarColor: authAccount.avatarColor || '#38bdf8',
            isMuted: false,
            isVideoOff: false,
            isHandRaised: false,
            canDraw: false,
            isSpeaking: false,
            cameraStreamQuality: '720p',
          };
          setParticipants((prev) => [...prev, newStudent]);
          setCurrentUserId(newStudent.id);
        }
      }
    }
  }, [authAccount]);

  // Listen for permission updates and hand raise events via LiveKit Data Channel
  useEffect(() => {
    const unsubPerm = livekitService.on('whiteboard_permission', (data: any) => {
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.id === data.studentId) {
            return {
              ...p,
              canDraw: data.canDraw,
              isHandRaised: data.canDraw ? false : p.isHandRaised,
            };
          }
          if (data.canDraw && data.lowerAllHands && p.role === 'student') {
            return {
              ...p,
              isHandRaised: false,
              canDraw: false,
            };
          }
          return p;
        })
      );
    });

    const unsubHand = livekitService.on('hand_raise', (data: any) => {
      setParticipants((prev) =>
        prev.map((p) => (p.id === data.studentId ? { ...p, isHandRaised: data.isHandRaised } : p))
      );
    });

    // Lắng nghe tín hiệu điều khiển Micro từ xa (Mute All hoặc Mute cá nhân)
    const unsubMute = livekitService.on('remote_mute_control', async (data: any) => {
      if (!data || typeof data !== 'object') return;

      // 1. Cập nhật danh sách participants trên giao diện
      if (data.action === 'mute_all') {
        setParticipants((prev) =>
          prev.map((p) => (p.role === 'student' ? { ...p, isMuted: true } : p))
        );
      } else if (data.targetId) {
        setParticipants((prev) =>
          prev.map((p) => (p.id === data.targetId ? { ...p, isMuted: Boolean(data.mute) } : p))
        );
      }

      // 2. Nếu máy hiện tại là học sinh và là đối tượng bị điều khiển:
      // Tự động kích hoạt hàm tắt/bật mic cục bộ của WebRTC LiveKit
      const isTarget = data.targetId === 'all' || (authAccount && data.targetId === authAccount.id);
      if (authAccount?.role === 'student' && isTarget) {
        const shouldMute = data.action === 'mute_all' ? true : Boolean(data.mute);
        const lkRoom = livekitService.getRoom();
        if (lkRoom?.localParticipant) {
          try {
            await lkRoom.localParticipant.setMicrophoneEnabled(!shouldMute);
            console.log(
              `[LiveKit Mic] Máy học sinh đã tự động ${shouldMute ? 'TẮT' : 'BẬT'} mic theo lệnh từ Giáo viên`
            );
          } catch (err) {
            console.warn('[LiveKit Mic] Lỗi khi setMicrophoneEnabled:', err);
          }
        }
      }
    });

    return () => {
      unsubPerm();
      unsubHand();
      unsubMute();
    };
  }, [authAccount]);

  // Auth Handlers
  const handleLoginSuccess = (user: UserAccount) => {
    setAuthAccount(user);
    try {
      localStorage.setItem('eduwhite_user', JSON.stringify(user));
    } catch (err) {
      console.error(err);
    }
    if (user.role === 'teacher') {
      setViewMode('admin_dashboard');
    } else {
      setViewMode('student_portal');
    }
  };

  const handleLogout = () => {
    livekitService.disconnect();
    setIsRealLiveKitConnected(false);
    setAuthAccount(null);
    setActiveRoom(null);
    try {
      localStorage.removeItem('eduwhite_user');
    } catch (err) {
      console.error(err);
    }
    setViewMode('login');
  };

  const handleEnterRoom = async (room: ClassroomRoom) => {
    setActiveRoom(room);
    setSubject(room.subject);
    setViewMode('classroom');
    setIsRoomConnecting(true);
    setTokenErrorMessage(null);
    setRoomConnectionError(null);

    // Tự động cấp Token Production và kết nối LiveKit với cùng một roomName duy nhất (room.id)
    try {
      const user = authAccount;
      if (user) {
        const tokenData = await livekitService.getLiveKitToken(
          room.id,
          user.name,
          user.role,
          user.id
        );
        if (tokenData && tokenData.token) {
          setLivekitToken(tokenData.token);
          setTokenErrorMessage(null);
          if (tokenData.serverUrl) {
            setLivekitServerUrl(tokenData.serverUrl);
          }
          // LƯU Ý: Thẻ <LiveKitRoom connect={true}> bên dưới sẽ đảm nhiệm kết nối WebRTC duy nhất.
          // Không gọi livekitService.connectToLiveKitRoom() đồng thời để tránh kết nối trùng lặp
          // gây ra lỗi SCTP Failure / DataChannel User-Initiated Abort do server kick session cũ.
          setIsRealLiveKitConnected(true);
        } else {
          setLivekitToken(null);
          setTokenErrorMessage('API trả về phản hồi nhưng không có JWT Token hợp lệ.');
        }
      } else {
        setLivekitToken(null);
        setTokenErrorMessage('Chưa xác thực người dùng. Vui lòng đăng nhập lại.');
      }
    } catch (err: any) {
      console.error('Lỗi kết nối LiveKit Production:', err.message);
      setLivekitToken(null);
      setTokenErrorMessage(err.message || 'Lỗi kết nối máy chủ LiveKit');
    } finally {
      setIsRoomConnecting(false);
    }
  };

  const handleBackToDashboard = () => {
    setLivekitToken(null);
    setTokenErrorMessage(null);
    setRoomConnectionError(null);
    livekitService.disconnect();
    setIsRealLiveKitConnected(false);
    if (authAccount?.role === 'teacher') {
      setViewMode('admin_dashboard');
    } else {
      setViewMode('student_portal');
    }
  };

  // Teacher grants or revokes board writing access
  const handleToggleGrantBoard = (studentId: string) => {
    if (currentUser.role !== 'teacher') return;

    setParticipants((prev) => {
      const target = prev.find((p) => p.id === studentId);
      if (!target) return prev;
      const nextCanDraw = !target.canDraw;

      // Broadcast permission change to all peers via LiveKit Data Channel
      livekitService.broadcastData(
        'whiteboard_permission',
        {
          studentId,
          canDraw: nextCanDraw,
          by: currentUser.name,
          lowerAllHands: nextCanDraw, // Khi giáo viên cho phép cầm phấn, hạ tất cả các tay giơ
        },
        true
      );

      return prev.map((p) => {
        if (p.id === studentId) {
          return {
            ...p,
            canDraw: nextCanDraw,
            // Học sinh này tự động bỏ tay xuống khi được cấp phấn
            isHandRaised: nextCanDraw ? false : p.isHandRaised,
          };
        }
        // Khi cho phép học sinh này cầm phấn:
        // Mặc định tất cả học sinh khác sẽ bỏ tay xuống và không có quyền viết
        if (nextCanDraw && p.role === 'student') {
          return {
            ...p,
            isHandRaised: false,
            canDraw: false,
          };
        }
        return p;
      });
    });
  };

  // Teacher awards student
  const handleAwardStudent = (studentId: string) => {
    if (currentUser.role !== 'teacher') return;

    const student = participants.find((p) => p.id === studentId);
    if (student) {
      livekitService.broadcastData(
        'whiteboard_reward',
        { studentId, studentName: student.name, teacherName: currentUser.name },
        true
      );
    }
  };

  // Mute specific participant (Teacher toggles individual student mic via LiveKit Data Channel)
  const handleMuteParticipant = async (id: string) => {
    if (currentUser.role !== 'teacher') return;

    const targetStudent = participants.find((p) => p.id === id);
    if (!targetStudent) return;
    const nextMuteState = !targetStudent.isMuted;

    // Cập nhật trạng thái cục bộ
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isMuted: nextMuteState } : p))
    );

    // Gửi tín hiệu Data Channel ép máy học sinh tự động kích hoạt hàm tắt/bật mic
    await livekitService.broadcastData(
      'remote_mute_control',
      {
        action: 'toggle_student_mic',
        targetId: id,
        mute: nextMuteState,
        by: currentUser.name,
      },
      true
    );
  };

  // Mute all students (Teacher tool - broadcasts signal to all students)
  const handleMuteAllStudents = async () => {
    if (currentUser.role !== 'teacher') return;

    // Cập nhật trạng thái cục bộ
    setParticipants((prev) =>
      prev.map((p) => (p.role === 'student' ? { ...p, isMuted: true } : p))
    );

    // Gửi tín hiệu Data Channel ép tất cả học sinh tự động tắt mic
    await livekitService.broadcastData(
      'remote_mute_control',
      {
        action: 'mute_all',
        targetId: 'all',
        mute: true,
        by: currentUser.name,
      },
      true
    );
  };

  // Toggle local mic
  const handleToggleMic = () => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === currentUser.id ? { ...p, isMuted: !p.isMuted } : p))
    );
  };

  // Toggle local video
  const handleToggleVideo = () => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === currentUser.id ? { ...p, isVideoOff: !p.isVideoOff } : p))
    );
  };

  // Student raises hand
  const handleRaiseHand = () => {
    setParticipants((prev) => {
      const cur = prev.find((p) => p.id === currentUser.id);
      const nextRaised = cur ? !cur.isHandRaised : true;
      livekitService.broadcastData(
        'hand_raise',
        { studentId: currentUser.id, isHandRaised: nextRaised, name: currentUser.name },
        true
      );
      return prev.map((p) =>
        p.id === currentUser.id ? { ...p, isHandRaised: nextRaised } : p
      );
    });
  };

  // Switch perspective (Teacher / Student simulation)
  const handleSelectUser = (p: Participant) => {
    setCurrentUserId(p.id);
  };

  // 1. View: Login Page
  if (viewMode === 'login' || !authAccount) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // 2. View: Teacher Admin Dashboard
  if (viewMode === 'admin_dashboard') {
    return (
      <div className="h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
        <TeacherAdminDashboard
          currentUser={authAccount}
          onEnterRoom={handleEnterRoom}
          onLogout={handleLogout}
          onOpenLiveKitConfig={() => setIsLiveKitModalOpen(true)}
          onOpenDocs={() => setIsDocsModalOpen(true)}
        />
        <LiveKitConfigModal
          isOpen={isLiveKitModalOpen}
          onClose={() => setIsLiveKitModalOpen(false)}
          onConnectedStatusChange={setIsRealLiveKitConnected}
        />
        <TechDocsModal
          isOpen={isDocsModalOpen}
          onClose={() => setIsDocsModalOpen(false)}
        />
      </div>
    );
  }

  // 3. View: Student Portal
  if (viewMode === 'student_portal') {
    return (
      <div className="h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
        <StudentPortal
          currentUser={authAccount}
          onEnterRoom={handleEnterRoom}
          onLogout={handleLogout}
          onOpenLiveKitConfig={() => setIsLiveKitModalOpen(true)}
        />
        <LiveKitConfigModal
          isOpen={isLiveKitModalOpen}
          onClose={() => setIsLiveKitModalOpen(false)}
          onConnectedStatusChange={setIsRealLiveKitConnected}
        />
      </div>
    );
  }

  // 4. View: Classroom (Whiteboard + Video Strip)
  // Nếu đang trong quá trình lấy token từ máy chủ
  if (isRoomConnecting) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-950 text-slate-100 p-6">
        <div className="flex flex-col items-center p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl max-w-md text-center backdrop-blur-md">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-slate-100 mb-2">Đang kết nối phòng học LiveKit...</h3>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            Đang yêu cầu Backend tạo JWT Token WebRTC và chuẩn bị kết nối LiveKit Cloud với serverUrl: {livekitServerUrl}
          </p>
          <button
            onClick={handleBackToDashboard}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition border border-slate-700"
          >
            Quay lại Bảng điều khiển
          </button>
        </div>
      </div>
    );
  }

  // Kiểm tra nếu token bị rỗng (null/undefined/empty string) hoặc không có serverUrl
  if (!livekitToken || !livekitServerUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-950 text-slate-100 p-6">
        <div className="max-w-lg w-full bg-rose-950/40 border-2 border-rose-500/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4 animate-bounce">
            <AlertCircle className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-rose-300 mb-2">
            Chưa nhận được Token từ máy chủ!
          </h2>

          <p className="text-sm text-slate-300 mb-5 leading-relaxed">
            {tokenErrorMessage || 'Không thể tạo phiên kết nối WebRTC với máy chủ LiveKit. Vui lòng kiểm tra cấu hình LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET trong file .env.local của bạn.'}
          </p>

          <div className="w-full bg-slate-900/90 rounded-xl p-3 text-left font-mono text-xs text-rose-300/90 border border-rose-900/50 mb-6 overflow-x-auto">
            <div>• Server URL: {livekitServerUrl || '(Trống)'}</div>
            <div>• Token: {livekitToken ? `${livekitToken.substring(0, 15)}...` : '(null / undefined)'}</div>
            {tokenErrorMessage && <div className="mt-1.5 text-rose-400 font-semibold">• Chi tiết lỗi: {tokenErrorMessage}</div>}
          </div>

          <div className="flex items-center gap-3 w-full justify-center">
            <button
              onClick={() => {
                if (activeRoom) {
                  handleEnterRoom(activeRoom);
                }
              }}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-xl text-xs transition shadow-lg shadow-rose-950/40 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Thử kết nối lại
            </button>
            <button
              onClick={handleBackToDashboard}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs transition border border-slate-700"
            >
              Quay lại Bảng điều khiển
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Khi có token hợp lệ, bọc LiveKitRoom với connect={true}, video={true}, audio={true}
  return (
    <LiveKitRoom
      serverUrl={livekitServerUrl}
      token={livekitToken}
      connect={true}
      video={true}
      audio={true}
      data-lk-theme="default"
      onConnected={() => {
        setIsRealLiveKitConnected(true);
        console.log('✅ Đã kết nối LiveKit Cloud Production thành công:', livekitServerUrl);
      }}
      onDisconnected={() => {
        setIsRealLiveKitConnected(false);
        console.log('LiveKit disconnected');
      }}
      onError={(error) => {
        console.error("LiveKit Room Error:", error);
        setRoomConnectionError(error?.message || 'Không thể thiết lập kết nối WebRTC với máy chủ LiveKit Cloud');
      }}
      className="fixed inset-0 h-screen w-screen max-w-full overflow-x-hidden overflow-hidden bg-slate-950 font-sans text-slate-100 flex flex-col select-none"
    >
      <LiveKitRoomAttachment />
      <RoomAudioRenderer />

      {/* Thông báo lỗi tín hiệu LiveKit (invalid token / connection failure) */}
      {roomConnectionError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-6">
          <div className="max-w-lg w-full bg-rose-950/60 border-2 border-rose-500/80 rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto mb-4 animate-bounce">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-rose-300 mb-2">
              Lỗi kết nối tín hiệu LiveKit Cloud
            </h3>
            <p className="text-xs text-rose-300 mb-4 font-mono bg-slate-900/90 p-3 rounded-xl border border-rose-900/60 break-all text-left">
              • Lỗi: {roomConnectionError}
            </p>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed text-left">
              {roomConnectionError.includes('invalid token') ? (
                <span>
                  Máy chủ LiveKit Cloud từ chối token (invalid token).
                  Vui lòng kiểm tra lại cặp LiveKit API Key và API Secret trong file <code className="text-amber-400 font-mono">.env.local</code> hoặc bấm <strong>Cập nhật cấu hình LiveKit</strong> bên dưới để kiểm tra và lưu lại.
                </span>
              ) : (
                <span>Không thể kết nối tới máy chủ LiveKit Cloud WebRTC. Vui lòng kiểm tra lại kết nối mạng hoặc cấu hình máy chủ.</span>
              )}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setRoomConnectionError(null);
                  setIsLiveKitModalOpen(true);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-xs transition shadow-lg shadow-emerald-950/50"
              >
                Cập nhật cấu hình LiveKit
              </button>
              <button
                onClick={() => {
                  setRoomConnectionError(null);
                  handleBackToDashboard();
                }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs transition border border-slate-700"
              >
                Quay lại Bảng điều khiển
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Header (Room ID, Fixed Subject Badge, LiveKit Status, Role Switcher) */}
      <ClassroomHeader
        subject={subject}
        currentUser={currentUser}
        participants={participants}
        onSelectUser={handleSelectUser}
        onOpenLiveKitModal={() => setIsLiveKitModalOpen(true)}
        onOpenDocsModal={() => setIsDocsModalOpen(true)}
        isRealLiveKit={isRealLiveKitConnected}
        roomName={activeRoom?.name}
        roomCode={activeRoom?.code}
        onNavigateBack={handleBackToDashboard}
        onLogout={handleLogout}
      />

      {/* 2. Main Classroom Layout: TLDraw Interactive Whiteboard (80%) + Video Strip (20%) */}
      <main className="flex-1 min-h-0 flex w-full max-w-full overflow-x-hidden overflow-hidden relative">
        {/* TLDraw Whiteboard Canvas Area (Mặc định cho phòng học, nét vẽ vector mềm mại) */}
        <div className="flex-1 min-w-0 h-full relative overflow-hidden select-none transition-all duration-300">
          {whiteboardType === 'tldraw' ? (
            <TLDrawLiveKitSync
              currentUser={currentUser}
              onRaiseHand={handleRaiseHand}
              subject={subject}
            />
          ) : (
            <ChalkboardCanvas
              subject={subject}
              currentUser={currentUser}
              participants={participants}
              onRaiseHand={handleRaiseHand}
              onClearBoard={() => {}}
              onAwardStudent={handleAwardStudent}
            />
          )}
        </div>

        {/* Video Strip (Teacher + 3-7 Students) - Hỗ trợ thu gọn/mở rộng */}
        <StudentVideoStrip
          participants={participants}
          currentUser={currentUser}
          isCollapsed={isVideoStripCollapsed}
          onToggleCollapse={() => {
            setIsVideoStripCollapsed((prev) => !prev);
            window.dispatchEvent(new Event('resize'));
            setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
            setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
            setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
            setTimeout(() => window.dispatchEvent(new Event('resize')), 450);
          }}
          onToggleGrantBoard={handleToggleGrantBoard}
          onAwardStudent={handleAwardStudent}
          onMuteParticipant={handleMuteParticipant}
          onMuteAllStudents={handleMuteAllStudents}
          onSelectActiveParticipantView={handleSelectUser}
        />
      </main>

      {/* 3. Audio & Video Bottom Controls Bar */}
      <AudioVideoControls
        currentUser={currentUser}
        onToggleMic={handleToggleMic}
        onToggleVideo={handleToggleVideo}
        onRaiseHand={handleRaiseHand}
        onMuteAllStudents={handleMuteAllStudents}
        onEndClass={() => {
          if (confirm('Bạn có chắc chắn muốn rời phòng học?')) {
            handleBackToDashboard();
          }
        }}
      />

      {/* 4. LiveKit Server Configuration Modal */}
      <LiveKitConfigModal
        isOpen={isLiveKitModalOpen}
        onClose={() => setIsLiveKitModalOpen(false)}
        onConnectedStatusChange={setIsRealLiveKitConnected}
      />

      {/* 5. Technical Principles & Implementation Guide Modal */}
      <TechDocsModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
      />
    </LiveKitRoom>
  );
}
