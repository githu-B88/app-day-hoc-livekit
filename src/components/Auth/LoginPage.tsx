import React, { useState } from 'react';
import {
  GraduationCap,
  KeyRound,
  User,
  LogIn,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { UserAccount, UserRole } from '../../types';
import { livekitService } from '../../services/livekitService';

interface LoginPageProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<UserRole>('teacher');
  const [username, setUsername] = useState('thayminh');
  const [password, setPassword] = useState('123456');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTabChange = (role: UserRole) => {
    setActiveTab(role);
    setErrorMessage(null);
    if (role === 'teacher') {
      setUsername('thayminh');
      setPassword('123456');
    } else {
      setUsername('vanan');
      setPassword('123456');
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await livekitService.login(username, password, activeTab);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Đăng nhập không thành công');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (uname: string, pass: string, role: UserRole) => {
    setUsername(uname);
    setPassword(pass);
    setActiveTab(role);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await livekitService.login(uname, pass, role);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Đăng nhập nhanh thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-x-hidden overflow-y-auto font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl p-6 sm:p-8 z-10 flex flex-col">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3 shadow-inner">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Lớp Học STEM Toán - Lý - Hóa
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Nền tảng dạy học nhóm nhỏ WebRTC LiveKit & Bảng xanh tương tác
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => handleTabChange('teacher')}
            className={`py-2 text-xs font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 ${
              activeTab === 'teacher'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Giáo Viên (Admin)</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('student')}
            className={`py-2 text-xs font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 ${
              activeTab === 'student'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Học Sinh</span>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Tên đăng nhập:
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={activeTab === 'teacher' ? 'thayminh' : 'vanan'}
              required
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              Mật khẩu / Mã PIN:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mã PIN hoặc mật khẩu"
              required
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition duration-150"
          >
            <LogIn className="w-4 h-4" />
            {isLoading ? 'Đang xác thực...' : `Đăng Nhập (${activeTab === 'teacher' ? 'Giáo Viên' : 'Học Sinh'})`}
          </button>
        </form>

        {/* Quick Test Accounts */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Tài khoản thử nghiệm nhanh (1-Click):</span>
          </div>

          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => quickLogin('thayminh', '123456', 'teacher')}
              className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-xs text-slate-300 flex items-center justify-between group transition"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-semibold text-slate-200">Thầy Minh</span>
                <span className="text-slate-500 font-mono">(Giáo viên - Quản trị)</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition" />
            </button>

            <button
              type="button"
              onClick={() => quickLogin('vanan', '123456', 'student')}
              className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-xs text-slate-300 flex items-center justify-between group transition"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="font-semibold text-slate-200">Nguyễn Văn An</span>
                <span className="text-slate-500 font-mono">(Học sinh - Có gán phòng)</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition" />
            </button>

            <button
              type="button"
              onClick={() => quickLogin('minhtri', '123456', 'student')}
              className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-xs text-slate-300 flex items-center justify-between group transition"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="font-semibold text-slate-200">Vũ Minh Trí</span>
                <span className="text-slate-500 font-mono">(Học sinh - Lớp đóng để test)</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
