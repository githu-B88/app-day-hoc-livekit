import React from 'react';
import {
  BookOpen,
  Wifi,
  Settings,
  HelpCircle,
  Users,
  CheckCircle2,
  Shield,
  Layers,
  ChevronDown,
  LayoutDashboard,
  ArrowLeft,
  LogOut
} from 'lucide-react';
import { SubjectType, Participant } from '../types';

interface ClassroomHeaderProps {
  subject: SubjectType;
  onSubjectChange: (sub: SubjectType) => void;
  currentUser: Participant;
  participants: Participant[];
  onSelectUser: (p: Participant) => void;
  onOpenLiveKitModal: () => void;
  onOpenDocsModal: () => void;
  isRealLiveKit: boolean;
  roomName?: string;
  roomCode?: string;
  onNavigateBack?: () => void;
  onLogout?: () => void;
}

export const ClassroomHeader: React.FC<ClassroomHeaderProps> = ({
  subject,
  onSubjectChange,
  currentUser,
  participants,
  onSelectUser,
  onOpenLiveKitModal,
  onOpenDocsModal,
  isRealLiveKit,
  roomName,
  roomCode,
  onNavigateBack,
  onLogout,
}) => {
  return (
    <header className="h-16 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-20 shrink-0">
      {/* Left: Brand & Room Tag */}
      <div className="flex items-center gap-3">
        {onNavigateBack && (
          <button
            onClick={onNavigateBack}
            title={currentUser.role === 'teacher' ? 'Quay lại Trang Quản Trị' : 'Quay lại Cổng Học Sinh'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {currentUser.role === 'teacher' ? 'Bảng Quản Trị' : 'Danh Sách Lớp'}
            </span>
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-100 text-sm sm:text-base leading-tight truncate max-w-[200px] sm:max-w-none">
                {roomName || 'Lớp Học Trực Tuyến STEM'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                {roomCode || 'PHÒNG 12-STEM'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Nhóm nhỏ 3-7 học sinh • WebRTC LiveKit 1080p Bảng xanh
            </p>
          </div>
        </div>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-slate-800 hidden md:block mx-1" />

        {/* Subject Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onSubjectChange('math')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
              subject === 'math'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📐</span>
            <span className="hidden sm:inline">Toán Học</span>
          </button>
          <button
            onClick={() => onSubjectChange('physics')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
              subject === 'physics'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>⚡</span>
            <span className="hidden sm:inline">Vật Lý</span>
          </button>
          <button
            onClick={() => onSubjectChange('chemistry')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
              subject === 'chemistry'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🧪</span>
            <span className="hidden sm:inline">Hóa Học</span>
          </button>
        </div>
      </div>

      {/* Right: Network Quality, Role Selector, Config & Help */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Network & Bandwidth Priority Badge */}
        <div
          title="Băng thông WebRTC ưu tiên bảng vẽ và chữ viết 1080p"
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-emerald-400 font-mono font-medium">1080p Bảng Vẽ</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 font-mono">18ms</span>
        </div>

        {/* User Identity & Role Badge (Khóa quyền học sinh, không cho phép đổi vai trò) */}
        {currentUser.role === 'student' ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                currentUser.canDraw ? 'bg-emerald-400 ring-2 ring-emerald-950 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-mono font-medium">
                {currentUser.canDraw ? (
                  <span className="text-emerald-400">✍️ ĐƯỢC PHÉP LÊN BẢNG</span>
                ) : (
                  <span className="text-slate-400">👁️ CHẾ ĐỘ QUAN SÁT</span>
                )}
              </span>
              <span className="font-semibold text-slate-200 truncate max-w-[120px]">
                {currentUser.name}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-950" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-emerald-400 font-mono font-medium">
                👨‍🏫 GIÁO VIÊN (CẦM PHẤN)
              </span>
              <span className="font-semibold text-slate-200 truncate max-w-[120px]">
                {currentUser.name}
              </span>
            </div>
          </div>
        )}

        {/* LiveKit Settings Modal Button */}
        <button
          onClick={onOpenLiveKitModal}
          title="Cài đặt kết nối LiveKit Cloud / Server"
          className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
        >
          <Settings className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Help / Docs Modal Button */}
        <button
          onClick={onOpenDocsModal}
          title="Xem Giải thích Nguyên lý & Hướng dẫn triển khai"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden md:inline">Nguyên lý WebRTC</span>
        </button>

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Đăng xuất khỏi hệ thống"
            className="p-2 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/40 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
