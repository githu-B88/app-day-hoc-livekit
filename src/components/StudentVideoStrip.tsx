import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  Award,
  PenTool,
  Lock,
  Volume2,
  CheckCircle,
  MoreVertical,
  VolumeX,
  Sparkles,
  Wifi,
  ChevronRight,
  ChevronLeft,
  Users
} from 'lucide-react';
import { useTracks, VideoTrack } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Participant, UserRole } from '../types';

interface StudentVideoStripProps {
  participants: Participant[];
  currentUser: Participant;
  onToggleGrantBoard: (studentId: string) => void;
  onAwardStudent: (studentId: string) => void;
  onMuteParticipant: (id: string) => void;
  onMuteAllStudents: () => void;
  onSelectActiveParticipantView: (participant: Participant) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const StudentVideoStrip: React.FC<StudentVideoStripProps> = ({
  participants,
  currentUser,
  onToggleGrantBoard,
  onAwardStudent,
  onMuteParticipant,
  onMuteAllStudents,
  onSelectActiveParticipantView,
  isCollapsed: propIsCollapsed,
  onToggleCollapse: propOnToggleCollapse,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : internalCollapsed;

  const handleToggleCollapse = () => {
    if (propOnToggleCollapse) {
      propOnToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
    // Gửi sự kiện resize nhiều lần theo tiến trình transition để TLDraw / Canvas tính toán lại mượt mà
    window.dispatchEvent(new Event('resize'));
    setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 450);
  };

  const isTeacher = currentUser.role === 'teacher';
  const teacher = participants.find((p) => p.role === 'teacher');
  const students = participants.filter((p) => p.role === 'student');

  let cameraTracks: any[] = [];
  try {
    cameraTracks = useTracks([Track.Source.Camera]);
  } catch (_) {
    // If rendered outside LiveKitRoom context
  }

  const findCameraTrack = (participantId: string, role?: string) => {
    return cameraTracks.find((t) => {
      const identity = t.participant?.identity || '';
      return (
        identity === participantId ||
        identity.includes(participantId) ||
        (role === 'teacher' && (identity.includes('teacher') || t.participant?.name?.includes('Minh')))
      );
    });
  };

  // KHI ĐANG THU GỌN: Hiển thị tab nút có mũi tên mở ra (ChevronLeft) cố định sát mép phải
  if (isCollapsed) {
    return (
      <div className="relative shrink-0 z-30">
        <button
          type="button"
          onClick={handleToggleCollapse}
          title="Mở danh sách camera Giáo viên & Học sinh (Nhấn để hiện camera)"
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-slate-900/95 hover:bg-slate-800 text-slate-200 hover:text-white border-l border-y border-slate-700/80 rounded-l-2xl py-3 px-2 shadow-2xl backdrop-blur-md flex flex-col items-center gap-2.5 group transition cursor-pointer hover:border-emerald-500/50 hover:shadow-emerald-950/40"
        >
          <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30 group-hover:scale-110 transition">
            <ChevronLeft className="w-4 h-4" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <Users className="w-4 h-4 text-slate-300 group-hover:text-emerald-300 transition" />
            <span className="text-[10px] font-bold text-emerald-400 font-mono bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">
              {participants.length}
            </span>
          </div>
          <span className="[writing-mode:vertical-lr] text-[10px] font-bold tracking-widest text-slate-400 group-hover:text-slate-100 rotate-180 uppercase select-none">
            Camera
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-48 xs:w-52 sm:w-56 md:w-64 lg:w-72 xl:w-80 h-full border-l border-slate-800 bg-slate-950 flex flex-col shrink-0 overflow-hidden relative transition-all duration-300 ease-in-out">
      {/* Nút có mũi tên thu vào nằm ở cạnh trái thanh cuộn (giữa màn hình) */}
      <button
        type="button"
        onClick={handleToggleCollapse}
        title="Thu gọn danh sách camera để tối đa diện tích bảng trắng"
        className="absolute -left-3.5 top-1/2 -translate-y-1/2 z-30 w-7 h-12 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-l-lg flex items-center justify-center text-slate-300 hover:text-emerald-400 shadow-xl cursor-pointer transition group"
      >
        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Strip Header */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-200 text-sm truncate">Lớp Học Trực Tuyến</span>
            <span className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {participants.length} người
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
            <Wifi className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">WebRTC 1080p ưu tiên bảng</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isTeacher && (
            <button
              onClick={onMuteAllStudents}
              title="Tắt micro tất cả học sinh để giữ trật tự lớp"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-semibold transition border border-amber-500/40 cursor-pointer shadow-sm"
            >
              <VolumeX className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Tắt mic cả lớp</span>
            </button>
          )}

          {/* Nút mũi tên thu gọn trong Header */}
          <button
            type="button"
            onClick={handleToggleCollapse}
            title="Thu gọn danh sách camera (Phóng to bảng trắng)"
            className="p-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/80 flex items-center justify-center cursor-pointer shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Participants Video List: Cuộn độc lập khi di chuột vào phần bên phải */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-3">
        {/* 1. Teacher Tile */}
        {teacher && (
          <div
            className={`rounded-2xl border transition duration-200 p-2.5 relative overflow-hidden ${
              currentUser.id === teacher.id
                ? 'bg-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/40'
                : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
            }`}
          >
            {/* Top info */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  👨‍🏫 GIÁO VIÊN
                </span>
                <span className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                  {teacher.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                {teacher.isMuted ? (
                  <span className="p-1 rounded-md bg-rose-500/20 text-rose-300">
                    <MicOff className="w-3 h-3" />
                  </span>
                ) : (
                  <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-300 animate-pulse">
                    <Mic className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>

            {/* Real WebRTC Video or Avatar Tile */}
            <div className="w-full h-20 sm:h-24 md:h-28 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-center relative overflow-hidden group">
              {(() => {
                const tTrack = findCameraTrack(teacher.id, 'teacher');
                if (tTrack && tTrack.publication && !tTrack.publication.isMuted) {
                  return <VideoTrack trackRef={tTrack} className="w-full h-full object-cover" />;
                }
                return (
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${teacher.avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                    TM
                  </div>
                );
              })()}

              {/* Live speaking wave */}
              {!teacher.isMuted && (
                <div className="absolute bottom-2 left-2 flex items-center gap-0.5 bg-black/50 px-2 py-1 rounded-md backdrop-blur-sm z-10">
                  <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce" />
                  <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                  <span className="text-[10px] text-emerald-300 ml-1 font-mono">1080p</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1 pt-1">
          <span>HỌC SINH ({students.length})</span>
          <span className="text-[10px] text-slate-500">Ưu tiên băng thông 360p</span>
        </div>

        {/* 2. Students Tiles (3-7 students) */}
        {students.map((student) => {
          const isCurrent = currentUser.id === student.id;

          return (
            <div
              key={student.id}
              className={`rounded-2xl border transition duration-200 p-2.5 relative ${
                isCurrent
                  ? 'bg-slate-900 border-blue-500/60 shadow-md ring-1 ring-blue-500/30'
                  : student.canDraw
                  ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md shadow-emerald-950/20'
                  : 'bg-slate-900/60 border-slate-800/90 hover:border-slate-700'
              }`}
            >
              {/* Header inside tile */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="text-xs font-medium text-slate-200 truncate max-w-[105px]">
                    {student.name}
                  </span>
                  {isCurrent && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                      Bạn
                    </span>
                  )}
                  {/* Icon micro nhỏ cạnh tên từng em để Giáo viên có thể bấm vào tắt/bật mic */}
                  {isTeacher ? (
                    <button
                      type="button"
                      onClick={() => onMuteParticipant(student.id)}
                      title={
                        student.isMuted
                          ? `Bấm để BẬT micro của ${student.name}`
                          : `Bấm để TẮT micro của ${student.name}`
                      }
                      className={`p-1 rounded-md transition cursor-pointer flex items-center justify-center shrink-0 ${
                        student.isMuted
                          ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
                      }`}
                    >
                      {student.isMuted ? (
                        <MicOff className="w-3 h-3 text-rose-400" />
                      ) : (
                        <Mic className="w-3 h-3 text-emerald-400" />
                      )}
                    </button>
                  ) : (
                    <span
                      title={student.isMuted ? 'Micro đang tắt' : 'Micro đang bật'}
                      className={`p-1 rounded-md shrink-0 ${
                        student.isMuted
                          ? 'bg-slate-800 text-slate-500'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {student.isMuted ? (
                        <MicOff className="w-3 h-3" />
                      ) : (
                        <Mic className="w-3 h-3" />
                      )}
                    </span>
                  )}
                </div>

                {/* Right status: Hand raise indicator */}
                <div className="flex items-center gap-1 shrink-0">
                  {student.isHandRaised && (
                    <span
                      title="Học sinh đang giơ tay phát biểu"
                      className="p-1 rounded-md bg-amber-500/20 text-amber-300 animate-bounce"
                    >
                      <Hand className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>

              {/* Real WebRTC Video Tile Box */}
              <div className="w-full h-18 sm:h-20 md:h-24 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-center relative overflow-hidden group">
                {(() => {
                  const sTrack = findCameraTrack(student.id, 'student');
                  if (sTrack && sTrack.publication && !sTrack.publication.isMuted) {
                    return <VideoTrack trackRef={sTrack} className="w-full h-full object-cover" />;
                  }
                  return (
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-tr ${student.avatarColor} flex items-center justify-center text-white font-bold text-sm shadow`}
                    >
                      {student.name.charAt(0)}
                    </div>
                  );
                })()}

                {/* Board Drawing Status Overlay */}
                <div className="absolute bottom-1.5 left-2 flex items-center gap-1 z-10">
                  {student.canDraw ? (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/90 border border-emerald-500 text-emerald-300 backdrop-blur-sm animate-pulse">
                      <PenTool className="w-2.5 h-2.5" /> LÊN BẢNG
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-900/80 text-slate-400 border border-slate-800">
                      <Lock className="w-2.5 h-2.5" /> Chỉ xem
                    </span>
                  )}
                </div>
              </div>

              {/* Teacher Management Controls for each student */}
              {isTeacher && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                  {/* Grant / Revoke Board Access Button */}
                  <button
                    onClick={() => onToggleGrantBoard(student.id)}
                    className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      student.canDraw
                        ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30'
                        : student.isHandRaised
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-950/40 animate-pulse'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-950'
                    }`}
                  >
                    <PenTool className="w-3 h-3" />
                    <span>
                      {student.canDraw
                        ? 'Thu hồi quyền'
                        : student.isHandRaised
                        ? 'Mời lên bảng ✋'
                        : 'Gọi lên bảng'}
                    </span>
                  </button>

                  {/* Award Star / Praise */}
                  <button
                    onClick={() => onAwardStudent(student.id)}
                    title="Khen ngợi / Chấm điểm 10"
                    className="p-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition"
                  >
                    <Award className="w-3.5 h-3.5" />
                  </button>

                  {/* Mute toggle */}
                  <button
                    onClick={() => onMuteParticipant(student.id)}
                    title={student.isMuted ? 'Yêu cầu mở mic' : 'Tắt mic học sinh này'}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                  >
                    {student.isMuted ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
