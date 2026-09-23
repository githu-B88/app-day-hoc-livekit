/**
 * Lớp Học Trực Tuyến Toán - Lý - Hóa (WebRTC LiveKit & Whiteboard)
 * @license Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ClassroomHeader } from './components/ClassroomHeader';
import { StudentVideoStrip } from './components/StudentVideoStrip';
import { ChalkboardCanvas } from './components/Whiteboard/ChalkboardCanvas';
import { AudioVideoControls } from './components/AudioVideoControls';
import { LiveKitConfigModal } from './components/LiveKitConfigModal';
import { TechDocsModal } from './components/TechDocsModal';
import { LoginPage } from './components/Auth/LoginPage';
import { TeacherAdminDashboard } from './components/Admin/TeacherAdminDashboard';
import { StudentPortal } from './components/Student/StudentPortal';
import { SubjectType, Participant, UserAccount, ClassroomRoom, AppViewMode } from './types';
import { livekitService } from './services/livekitService';
import { TLDrawLiveKitSync } from './components/Whiteboard/TLDrawLiveKitSync';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';

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
  const [livekitServerUrl, setLivekitServerUrl] = useState<string>(() => {
    return (
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LIVEKIT_URL) ||
      (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_LIVEKIT_URL || process.env?.LIVEKIT_URL)) ||
      'wss://eduwhite-i0qhtq4t.livekit.cloud'
    );
  });
  const [isRoomConnecting, setIsRoomConnecting] = useState<boolean>(false);

  // Classroom States
  const [subject, setSubject] = useState<SubjectType>('math');
  const [participants, setParticipants] = useState<Participant[]>(() =>
    livekitService.getInitialParticipants()
  );
  const [currentUserId, setCurrentUserId] = useState<string>('teacher_1');
  const [isLiveKitModalOpen, setIsLiveKitModalOpen] = useState<boolean>(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState<boolean>(false);
  const [isRealLiveKitConnected, setIsRealLiveKitConnected] = useState<boolean>(false);
  const [boardEngine, setBoardEngine] = useState<'tldraw' | 'chalkboard'>('tldraw');

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

  // Listen for permission updates and audio events via LiveKit Data Channel
  useEffect(() => {
    const unsubPerm = livekitService.on('whiteboard_permission', (data: any) => {
      setParticipants((prev) =>
        prev.map((p) => (p.id === data.studentId ? { ...p, canDraw: data.canDraw } : p))
      );
    });

    return () => {
      unsubPerm();
    };
  }, []);

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
          if (tokenData.serverUrl) {
            setLivekitServerUrl(tokenData.serverUrl);
          }
          const success = await livekitService.connectToLiveKitRoom(
            tokenData.serverUrl || livekitServerUrl,
            tokenData.token
          );
          setIsRealLiveKitConnected(success);
        }
      }
    } catch (err: any) {
      console.error('Lỗi kết nối LiveKit Production:', err.message);
    } finally {
      setIsRoomConnecting(false);
    }
  };

  const handleBackToDashboard = () => {
    setLivekitToken(null);
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

    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === studentId) {
          const nextCanDraw = !p.canDraw;
          livekitService.broadcastData(
            'whiteboard_permission',
            { studentId, canDraw: nextCanDraw, by: currentUser.name },
            true
          );
          return { ...p, canDraw: nextCanDraw };
        }
        return p;
      })
    );
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

  // Mute specific participant
  const handleMuteParticipant = (id: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isMuted: !p.isMuted } : p))
    );
  };

  // Mute all students (Teacher tool)
  const handleMuteAllStudents = () => {
    setParticipants((prev) =>
      prev.map((p) => (p.role === 'student' ? { ...p, isMuted: true } : p))
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
    setParticipants((prev) =>
      prev.map((p) => (p.id === currentUser.id ? { ...p, isHandRaised: !p.isHandRaised } : p))
    );
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
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
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
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
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
  return (
    <LiveKitRoom
      serverUrl={livekitServerUrl}
      token={livekitToken || ''}
      connect={Boolean(livekitToken && livekitServerUrl)}
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
      onError={(err) => {
        console.error('LiveKit connection error:', err);
      }}
      className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100"
    >
      <RoomAudioRenderer />
      {/* 1. Header (Subject Switcher, Room ID, LiveKit Status, Role Switcher) */}
      <ClassroomHeader
        subject={subject}
        onSubjectChange={setSubject}
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

      {/* 2. Main Classroom Layout: Whiteboard (80%) + Video Strip (20%) */}
      <main className="flex-1 flex w-full h-[calc(100vh-8rem)] overflow-hidden relative">
        {/* Whiteboard Engine Switcher Tab */}
        <div className="absolute top-3 left-4 z-40 flex items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 shadow-xl text-xs">
          <button
            onClick={() => setBoardEngine('tldraw')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              boardEngine === 'tldraw'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>✏️ Bảng tldraw (LiveKit Sync)</span>
          </button>
          <button
            onClick={() => setBoardEngine('chalkboard')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              boardEngine === 'chalkboard'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📐 Bảng Phấn STEM (Toán-Lý-Hóa)</span>
          </button>
        </div>

        {/* Whiteboard Area */}
        <div className="flex-1 h-full relative overflow-hidden">
          {boardEngine === 'tldraw' ? (
            <TLDrawLiveKitSync
              currentUser={currentUser}
              onRaiseHand={handleRaiseHand}
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

        {/* Video Strip (Teacher + 3-7 Students) */}
        <StudentVideoStrip
          participants={participants}
          currentUser={currentUser}
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
