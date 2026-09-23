import React from 'react';
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
  Wifi
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
}

export const StudentVideoStrip: React.FC<StudentVideoStripProps> = ({
  participants,
  currentUser,
  onToggleGrantBoard,
  onAwardStudent,
  onMuteParticipant,
  onMuteAllStudents,
  onSelectActiveParticipantView,
}) => {
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

  return (
    <div className="w-72 xl:w-80 h-full border-l border-slate-800 bg-slate-950 flex flex-col shrink-0 overflow-hidden">
      {/* Strip Header */}
      <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200 text-sm">Lớp Học Nhóm Nhỏ</span>
            <span className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {participants.length} người
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span>WebRTC 1080p ưu tiên bảng</span>
          </div>
        </div>

        {isTeacher && (
          <button
            onClick={onMuteAllStudents}
            title="Tắt micro tất cả học sinh để giữ trật tự"
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition border border-slate-700"
          >
            <VolumeX className="w-3 h-3 text-amber-400" />
            <span>Tắt mic tất cả</span>
          </button>
        )}
      </div>

      {/* Participants Video List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
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
            <div className="w-full h-28 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-center relative overflow-hidden group">
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
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-200 truncate max-w-[130px]">
                    {student.name}
                  </span>
                  {isCurrent && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Bạn
                    </span>
                  )}
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-1">
                  {student.isHandRaised && (
                    <span
                      title="Học sinh đang giơ tay phát biểu"
                      className="p-1 rounded-md bg-amber-500/20 text-amber-300 animate-bounce"
                    >
                      <Hand className="w-3 h-3" />
                    </span>
                  )}
                  {student.isMuted ? (
                    <span className="p-1 rounded-md bg-slate-800 text-slate-500">
                      <MicOff className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
                      <Mic className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>

              {/* Real WebRTC Video Tile Box */}
              <div className="w-full h-24 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-center relative overflow-hidden group">
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
                    className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-xl text-xs font-semibold transition ${
                      student.canDraw
                        ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-950'
                    }`}
                  >
                    <PenTool className="w-3 h-3" />
                    <span>{student.canDraw ? 'Thu hồi quyền' : 'Gọi lên bảng'}</span>
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
