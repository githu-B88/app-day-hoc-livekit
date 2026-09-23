import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Hand,
  PhoneOff,
  Volume2,
  Sparkles,
  Award
} from 'lucide-react';
import { useLocalParticipant } from '@livekit/components-react';
import { Participant } from '../types';

interface AudioVideoControlsProps {
  currentUser: Participant;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onRaiseHand: () => void;
  onEndClass: () => void;
}

export const AudioVideoControls: React.FC<AudioVideoControlsProps> = ({
  currentUser,
  onToggleMic,
  onToggleVideo,
  onRaiseHand,
  onEndClass,
}) => {
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  let localPart: any = null;
  try {
    localPart = useLocalParticipant();
  } catch (_) {
    // Rendered outside LiveKitRoom
  }

  const handleMicClick = async () => {
    if (localPart?.localParticipant) {
      try {
        await localPart.localParticipant.setMicrophoneEnabled(Boolean(currentUser.isMuted));
      } catch (e) {
        console.warn('Lỗi bật/tắt Micro LiveKit:', e);
      }
    }
    onToggleMic();
  };

  const handleVideoClick = async () => {
    if (localPart?.localParticipant) {
      try {
        await localPart.localParticipant.setCameraEnabled(Boolean(currentUser.isVideoOff));
      } catch (e) {
        console.warn('Lỗi bật/tắt Camera LiveKit:', e);
      }
    }
    onToggleVideo();
  };

  const handleScreenShareClick = async () => {
    if (localPart?.localParticipant) {
      try {
        await localPart.localParticipant.setScreenShareEnabled(!isScreenSharing);
      } catch (e) {
        console.warn('Lỗi chia sẻ màn hình LiveKit:', e);
      }
    }
    setIsScreenSharing((prev) => !prev);
  };

  return (
    <div className="h-16 bg-slate-900/90 border-t border-slate-800 px-6 flex items-center justify-between z-20 shrink-0 backdrop-blur-md">
      {/* Left: Current User Mini Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${currentUser.avatarColor} flex items-center justify-center text-white text-xs font-bold shadow`}>
              {currentUser.name.charAt(0)}
            </div>
            {!currentUser.isMuted && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-200">{currentUser.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                {currentUser.role === 'teacher' ? 'Giáo viên' : currentUser.canDraw ? 'Lên bảng' : 'Học sinh'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              {currentUser.isMuted ? 'Micro đang tắt' : 'Micro đang hoạt động'}
            </p>
          </div>
        </div>
      </div>

      {/* Center: Main Media Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mic Button */}
        <button
          onClick={handleMicClick}
          title={currentUser.isMuted ? 'Mở Micro' : 'Tắt Micro'}
          className={`p-3 rounded-2xl transition duration-150 flex items-center gap-1.5 ${
            currentUser.isMuted
              ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
              : 'bg-slate-800 text-emerald-400 hover:bg-slate-700 border border-slate-700 shadow-md shadow-emerald-950/20'
          }`}
        >
          {currentUser.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Video Button */}
        <button
          onClick={handleVideoClick}
          title={currentUser.isVideoOff ? 'Bật Camera' : 'Tắt Camera'}
          className={`p-3 rounded-2xl transition duration-150 flex items-center gap-1.5 ${
            currentUser.isVideoOff
              ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          {currentUser.isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Screen Share (1080p detail) */}
        <button
          onClick={handleScreenShareClick}
          title={isScreenSharing ? 'Dừng chia sẻ màn hình' : 'Chia sẻ màn hình 1080p sắc nét'}
          className={`p-3 rounded-2xl transition duration-150 flex items-center gap-1.5 ${
            isScreenSharing
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        </button>

        {/* Hand Raise (especially for students) */}
        {currentUser.role === 'student' && (
          <button
            onClick={onRaiseHand}
            title={currentUser.isHandRaised ? 'Hạ tay xuống' : 'Giơ tay phát biểu để xin lên bảng'}
            className={`px-4 py-2.5 rounded-2xl transition duration-150 flex items-center gap-2 text-xs font-semibold ${
              currentUser.isHandRaised
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-950/50 animate-bounce'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
            }`}
          >
            <Hand className="w-4 h-4" />
            <span>{currentUser.isHandRaised ? 'Đang giơ tay ✋' : 'Giơ tay'}</span>
          </button>
        )}
      </div>

      {/* Right: Leave / End Class */}
      <div className="flex items-center gap-2">
        <button
          onClick={onEndClass}
          title="Rời khỏi lớp học"
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/30 text-xs font-semibold transition"
        >
          <PhoneOff className="w-4 h-4" />
          <span className="hidden sm:inline">Rời phòng</span>
        </button>
      </div>
    </div>
  );
};
