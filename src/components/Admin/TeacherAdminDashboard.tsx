import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  Video,
  Plus,
  Lock,
  Unlock,
  Trash2,
  Edit,
  ExternalLink,
  ShieldCheck,
  Search,
  Check,
  X,
  BookOpen,
  Atom,
  Zap,
  Calculator,
  LogOut,
  RefreshCw,
  AlertCircle,
  KeyRound,
  UserPlus
} from 'lucide-react';
import { ClassroomRoom, SubjectType, UserAccount } from '../../types';
import { livekitService } from '../../services/livekitService';

interface TeacherAdminDashboardProps {
  currentUser: UserAccount;
  onEnterRoom: (room: ClassroomRoom) => void;
  onLogout: () => void;
  onOpenLiveKitConfig: () => void;
  onOpenDocs: () => void;
}

export const TeacherAdminDashboard: React.FC<TeacherAdminDashboardProps> = ({
  currentUser,
  onEnterRoom,
  onLogout,
  onOpenLiveKitConfig,
  onOpenDocs,
}) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'students'>('rooms');
  const [rooms, setRooms] = useState<ClassroomRoom[]>([]);
  const [students, setStudents] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusActionLoading, setStatusActionLoading] = useState<string | null>(null);

  // Modal tạo phòng
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomSubject, setNewRoomSubject] = useState<SubjectType>('math');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomSelectedStudents, setNewRoomSelectedStudents] = useState<string[]>([]);

  // Modal tạo học sinh
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('123456');
  const [studentError, setStudentError] = useState<string | null>(null);
  const [studentSuccess, setStudentSuccess] = useState<string | null>(null);

  // Modal gán học sinh vào phòng
  const [editingRoom, setEditingRoom] = useState<ClassroomRoom | null>(null);
  const [editAssignedStudents, setEditAssignedStudents] = useState<string[]>([]);

  // Tải dữ liệu từ DB
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedRooms, fetchedStudents] = await Promise.all([
        livekitService.fetchRooms(),
        livekitService.fetchStudents(),
      ]);
      setRooms(fetchedRooms);
      setStudents(fetchedStudents);
    } catch (err: any) {
      console.error('Lỗi tải dữ liệu phòng & học sinh:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Thay đổi trạng thái Mở / Đóng phòng
  const handleToggleRoomStatus = async (room: ClassroomRoom) => {
    const nextStatus = room.status === 'open' ? 'closed' : 'open';
    setStatusActionLoading(room.id);

    try {
      await livekitService.updateRoomStatus(room.id, nextStatus);
      await loadData();
    } catch (err: any) {
      alert(`Không thể thay đổi trạng thái phòng: ${err.message}`);
    } finally {
      setStatusActionLoading(null);
    }
  };

  // Tạo phòng mới
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      await livekitService.createRoom({
        name: newRoomName.trim(),
        subject: newRoomSubject,
        teacherId: currentUser.id,
        assignedStudentIds: newRoomSelectedStudents,
        description: newRoomDescription.trim(),
      });

      setIsCreateRoomOpen(false);
      setNewRoomName('');
      setNewRoomDescription('');
      setNewRoomSelectedStudents([]);
      await loadData();
    } catch (err: any) {
      alert(`Lỗi tạo phòng: ${err.message}`);
    }
  };

  // Lưu chỉnh sửa gán học sinh
  const handleSaveAssignedStudents = async () => {
    if (!editingRoom) return;

    try {
      await livekitService.updateRoom(editingRoom.id, {
        assignedStudentIds: editAssignedStudents,
      });
      setEditingRoom(null);
      await loadData();
    } catch (err: any) {
      alert(`Lỗi cập nhật học sinh cho phòng: ${err.message}`);
    }
  };

  // Xóa phòng
  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa phòng học "${roomName}"?`)) return;

    try {
      await livekitService.deleteRoom(roomId);
      await loadData();
    } catch (err: any) {
      alert(`Lỗi xóa phòng: ${err.message}`);
    }
  };

  // Tạo tài khoản học sinh
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError(null);
    setStudentSuccess(null);

    if (!newStudentName.trim() || !newStudentUsername.trim() || !newStudentPassword.trim()) {
      setStudentError('Vui lòng điền đủ Họ tên, Tên đăng nhập và Mật khẩu/PIN');
      return;
    }

    try {
      await livekitService.createStudent({
        name: newStudentName.trim(),
        username: newStudentUsername.trim(),
        password: newStudentPassword.trim(),
      });

      setStudentSuccess(`Đã tạo thành công tài khoản cho học sinh ${newStudentName}!`);
      setNewStudentName('');
      setNewStudentUsername('');
      setNewStudentPassword('123456');
      await loadData();
    } catch (err: any) {
      setStudentError(err.message || 'Lỗi khi tạo học sinh');
    }
  };

  // Xóa học sinh
  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa học sinh "${studentName}" khỏi hệ thống?`)) return;

    try {
      await livekitService.deleteStudent(studentId);
      await loadData();
    } catch (err: any) {
      alert(`Lỗi xóa học sinh: ${err.message}`);
    }
  };

  const getSubjectBadge = (subject: SubjectType) => {
    switch (subject) {
      case 'math':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Calculator className="w-3 h-3" /> Toán Học
          </span>
        );
      case 'physics':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Zap className="w-3 h-3" /> Vật Lý
          </span>
        );
      case 'chemistry':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Atom className="w-3 h-3" /> Hóa Học
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm sm:text-base text-slate-100">
                Trung Tâm Quản Trị Lớp Học STEM
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                Giáo Viên
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Quản lý tài khoản học sinh, phòng học LiveKit và rào chắn bảo mật
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenLiveKitConfig}
            title="Cấu hình LiveKit Cloud/Server"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cấu hình LiveKit</span>
          </button>

          <button
            onClick={onOpenDocs}
            title="Tài liệu Kiến trúc WebRTC"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Nguyên lý</span>
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* User profile & logout */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white shadow">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-200 leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 font-mono">@{currentUser.username}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Đăng xuất khỏi hệ thống"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 overflow-y-auto">
        {/* Navigation Tabs & Metrics */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('rooms')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'rooms'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Quản Lý Phòng Học ({rooms.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'students'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Quản Lý Học Sinh ({students.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              title="Làm mới dữ liệu"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {activeTab === 'rooms' && (
              <button
                onClick={() => setIsCreateRoomOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Phòng Học Mới</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: QUẢN LÝ PHÒNG HỌC */}
        {activeTab === 'rooms' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => {
                const isOpen = room.status === 'open';
                const assignedCount = room.assignedStudentIds?.length || 0;

                return (
                  <div
                    key={room.id}
                    className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 ${
                      isOpen
                        ? 'bg-slate-900/90 border-emerald-500/40 shadow-xl shadow-emerald-950/20'
                        : 'bg-slate-900/50 border-slate-800 opacity-90'
                    }`}
                  >
                    <div>
                      {/* Card Header: Subject + Status */}
                      <div className="flex items-center justify-between mb-3">
                        {getSubjectBadge(room.subject)}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isOpen
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 animate-pulse'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOpen ? 'bg-emerald-400' : 'bg-slate-500'
                            }`}
                          />
                          {isOpen ? 'Đang Mở' : 'Đã Đóng'}
                        </span>
                      </div>

                      {/* Room Code & Title */}
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {room.code}
                      </span>
                      <h3 className="font-bold text-base text-slate-100 mt-2 mb-1 leading-snug">
                        {room.name}
                      </h3>
                      {room.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                          {room.description}
                        </p>
                      )}

                      {/* Assigned Students Summary */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            Được gán: <strong>{assignedCount} học sinh</strong>
                          </span>
                          <button
                            onClick={() => {
                              setEditingRoom(room);
                              setEditAssignedStudents(room.assignedStudentIds || []);
                            }}
                            className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline"
                          >
                            Phân quyền
                          </button>
                        </div>

                        {/* Avatars */}
                        <div className="flex items-center -space-x-1.5 overflow-hidden py-1">
                          {room.assignedStudentIds?.map((sid) => {
                            const st = students.find((s) => s.id === sid);
                            return (
                              <div
                                key={sid}
                                title={st ? st.name : sid}
                                className={`w-6 h-6 rounded-full bg-gradient-to-tr ${
                                  st?.avatarColor || 'from-slate-600 to-slate-700'
                                } border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow`}
                              >
                                {st ? st.name.charAt(0) : '?'}
                              </div>
                            );
                          })}
                          {assignedCount === 0 && (
                            <span className="text-[11px] text-slate-400 italic">
                              Chưa gán học sinh nào
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-5 pt-3 border-t border-slate-800 flex items-center gap-2">
                      {/* Mở / Tắt phòng */}
                      <button
                        onClick={() => handleToggleRoomStatus(room)}
                        disabled={statusActionLoading === room.id}
                        title={
                          isOpen
                            ? 'Tắt phòng (Ngắt kết nối học sinh bằng LiveKit RoomService)'
                            : 'Mở phòng học'
                        }
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                          isOpen
                            ? 'bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/80'
                            : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-600/40'
                        }`}
                      >
                        {statusActionLoading === room.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : isOpen ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Tắt Phòng</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Mở Phòng</span>
                          </>
                        )}
                      </button>

                      {/* Vào giảng dạy */}
                      <button
                        onClick={() => onEnterRoom(room)}
                        title="Vào bảng trắng và phòng học LiveKit"
                        className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Vào Lớp</span>
                      </button>

                      {/* Xóa phòng */}
                      <button
                        onClick={() => handleDeleteRoom(room.id, room.name)}
                        title="Xóa phòng học"
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 border border-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {rooms.length === 0 && !isLoading && (
              <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 p-6">
                <Video className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-300">Chưa có phòng học nào</h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Bấm nút bên dưới để tạo phòng học Toán, Lý hoặc Hóa đầu tiên
                </p>
                <button
                  onClick={() => setIsCreateRoomOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                >
                  Tạo Phòng Học Ngay
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: QUẢN LÝ TÀI KHOẢN HỌC SINH */}
        {activeTab === 'students' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form tạo học sinh mới (1 Cột) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 text-emerald-400 mb-4">
                <UserPlus className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-100">Tạo Tài Khoản Học Sinh Mới</h3>
              </div>

              <form onSubmit={handleCreateStudent} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Họ và tên học sinh:
                  </label>
                  <input
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Ví dụ: Hoàng Minh Đức"
                    required
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tên đăng nhập (Username):
                  </label>
                  <input
                    type="text"
                    value={newStudentUsername}
                    onChange={(e) => setNewStudentUsername(e.target.value)}
                    placeholder="minhduc"
                    required
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-amber-400" />
                    Mật khẩu / Mã PIN:
                  </label>
                  <input
                    type="text"
                    value={newStudentPassword}
                    onChange={(e) => setNewStudentPassword(e.target.value)}
                    placeholder="123456"
                    required
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono transition"
                  />
                </div>

                {studentError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{studentError}</span>
                  </div>
                )}

                {studentSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{studentSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-1.5 transition"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Tạo Tài Khoản Học Sinh</span>
                </button>
              </form>
            </div>

            {/* Danh sách học sinh (2 Cột) */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-blue-400">
                  <Users className="w-5 h-5" />
                  <h3 className="font-bold text-sm text-slate-100">
                    Danh Sách Tài Khoản Học Sinh ({students.length})
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  Mật khẩu hiển thị để Thầy/Cô dễ dàng hỗ trợ học sinh
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 px-3 font-semibold">Học sinh</th>
                      <th className="py-2.5 px-3 font-semibold">Username</th>
                      <th className="py-2.5 px-3 font-semibold">Mật khẩu / PIN</th>
                      <th className="py-2.5 px-3 font-semibold">Lớp được gán</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {students.map((st) => {
                      // Tìm các phòng học sinh này được gán
                      const assignedRooms = rooms.filter((r) =>
                        r.assignedStudentIds?.includes(st.id)
                      );

                      return (
                        <tr key={st.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-full bg-gradient-to-tr ${st.avatarColor} flex items-center justify-center text-xs font-bold text-white shadow`}
                              >
                                {st.name.charAt(0)}
                              </div>
                              <span className="font-medium text-slate-200">{st.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-300">{st.username}</td>
                          <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold">
                            {st.password || '123456'}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap gap-1">
                              {assignedRooms.map((r) => (
                                <span
                                  key={r.id}
                                  className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-mono"
                                >
                                  {r.code}
                                </span>
                              ))}
                              {assignedRooms.length === 0 && (
                                <span className="text-slate-400 text-[11px] italic">
                                  Chưa gán
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleDeleteStudent(st.id, st.name)}
                              title="Xóa học sinh này"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL TẠO PHÒNG HỌC MỚI */}
      {isCreateRoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2 text-emerald-400">
                <Video className="w-5 h-5" />
                <h3 className="font-semibold text-slate-100 text-sm">Tạo Phòng Học STEM Mới</h3>
              </div>
              <button
                onClick={() => setIsCreateRoomOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tên phòng học:
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Ví dụ: Chuyên đề Luyện Thi Tích Phân 12"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setNewRoomSubject('math')}
                  className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                    newRoomSubject === 'math'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Toán Học</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewRoomSubject('physics')}
                  className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                    newRoomSubject === 'physics'
                      ? 'bg-amber-600 text-white border-amber-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Vật Lý</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewRoomSubject('chemistry')}
                  className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                    newRoomSubject === 'chemistry'
                      ? 'bg-cyan-600 text-white border-cyan-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Atom className="w-3.5 h-3.5" />
                  <span>Hóa Học</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Mô tả bài giảng:</label>
                <textarea
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  placeholder="Nội dung tóm tắt buổi học..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* Gán học sinh */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2 flex items-center justify-between">
                  <span>Gán học sinh được phép vào phòng ({newRoomSelectedStudents.length}):</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (newRoomSelectedStudents.length === students.length) {
                        setNewRoomSelectedStudents([]);
                      } else {
                        setNewRoomSelectedStudents(students.map((s) => s.id));
                      }
                    }}
                    className="text-emerald-400 text-[11px] hover:underline"
                  >
                    {newRoomSelectedStudents.length === students.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </label>

                <div className="max-h-40 overflow-y-auto space-y-1.5 bg-slate-950 p-2 rounded-xl border border-slate-800">
                  {students.map((st) => {
                    const isChecked = newRoomSelectedStudents.includes(st.id);
                    return (
                      <label
                        key={st.id}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs cursor-pointer transition ${
                          isChecked ? 'bg-emerald-950/40 text-emerald-300' : 'text-slate-300 hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewRoomSelectedStudents([...newRoomSelectedStudents, st.id]);
                              } else {
                                setNewRoomSelectedStudents(
                                  newRoomSelectedStudents.filter((id) => id !== st.id)
                                );
                              }
                            }}
                            className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                          />
                          <span>{st.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">(@{st.username})</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateRoomOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/40"
                >
                  Tạo Phòng Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GÁN HỌC SINH VÀO PHÒNG ĐÃ CÓ */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">Gán Học Sinh Vào Phòng</h3>
                <p className="text-xs text-slate-400">{editingRoom.name}</p>
              </div>
              <button onClick={() => setEditingRoom(null)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                Chỉ những học sinh được đánh dấu tick dưới đây mới có thể nhận LiveKit Token khi bấm vào phòng này.
              </p>

              <div className="max-h-60 overflow-y-auto space-y-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                {students.map((st) => {
                  const isChecked = editAssignedStudents.includes(st.id);
                  return (
                    <label
                      key={st.id}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition ${
                        isChecked ? 'bg-emerald-950/50 text-emerald-300 font-medium' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditAssignedStudents([...editAssignedStudents, st.id]);
                            } else {
                              setEditAssignedStudents(editAssignedStudents.filter((id) => id !== st.id));
                            }
                          }}
                          className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                        />
                        <span>{st.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">(@{st.username})</span>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveAssignedStudents}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/40"
                >
                  Lưu Phân Quyền
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
