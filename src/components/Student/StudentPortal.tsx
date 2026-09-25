import React, { useState, useEffect } from 'react';
import {
  User,
  Users,
  Video,
  Lock,
  Unlock,
  LogOut,
  AlertCircle,
  RefreshCw,
  Calculator,
  Zap,
  Atom,
  CheckCircle,
  BookOpen,
  ArrowRight,
  GraduationCap
} from 'lucide-react';
import { ClassroomRoom, SubjectType, UserAccount } from '../../types';
import { livekitService } from '../../services/livekitService';

interface StudentPortalProps {
  currentUser: UserAccount;
  onEnterRoom: (room: ClassroomRoom) => void;
  onLogout: () => void;
  onOpenLiveKitConfig: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentUser,
  onEnterRoom,
  onLogout,
  onOpenLiveKitConfig,
}) => {
  const [rooms, setRooms] = useState<ClassroomRoom[]>([]);
  const [students, setStudents] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRooms = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [allRooms, allStudents] = await Promise.all([
        livekitService.fetchRooms(),
        livekitService.fetchStudents(),
      ]);
      setRooms(allRooms);
      setStudents(allStudents);
    } catch (err: any) {
      console.warn('Lỗi khi tải danh sách phòng và học sinh, sử dụng danh sách dự phòng:', err?.message || err);
      setRooms(livekitService.getInitialRooms());
      setStudents(livekitService.getDefaultStudents());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  // Lọc ra các phòng mà học sinh này ĐƯỢC PHÉP THAM GIA
  const assignedRooms = rooms.filter((r) => r.assignedStudentIds?.includes(currentUser.id));
  const otherRooms = rooms.filter((r) => !r.assignedStudentIds?.includes(currentUser.id));

  const handleJoinRoom = async (room: ClassroomRoom) => {
    setJoiningRoomId(room.id);
    setErrorMessage(null);

    try {
      // Gọi API Token kiểm tra rào chắn 3 điều kiện:
      // 1. Đã đăng nhập
      // 2. Có tên trong danh sách phòng
      // 3. Phòng đang ở trạng thái 'open'
      await livekitService.getLiveKitToken(
        room.id,
        currentUser.name,
        'student',
        currentUser.id
      );

      // Nếu API thông qua -> Vào phòng học
      onEnterRoom(room);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể tham gia phòng học');
    } finally {
      setJoiningRoomId(null);
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
    <div className="min-h-screen h-screen w-full max-w-full bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden overflow-hidden">
      {/* Header */}
      <header className="h-16 w-full max-w-full bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between z-10 shrink-0 overflow-x-hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm sm:text-base text-slate-100">
                Cổng Học Sinh - Lớp Học Trực Tuyến
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                Học Sinh
              </span>
            </div>
            <p className="text-xs text-slate-400">Chọn lớp học được phân công để vào học</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${currentUser.avatarColor} flex items-center justify-center text-xs font-bold text-white shadow`}>
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-200 leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 font-mono">@{currentUser.username}</p>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800" />

          <button
            onClick={onLogout}
            title="Đăng xuất"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-slate-800 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 min-h-0 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6 overflow-x-hidden overflow-y-auto pb-16">
        {/* Error Alert if blocked by Token Security Gate */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-700/80 text-rose-200 text-xs sm:text-sm flex items-start gap-3 shadow-lg shadow-rose-950/40 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-100">Truy cập bị từ chối bởi Rào chắn Bảo mật:</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Section 1: Lớp học được phân quyền */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-base text-slate-100">
                Các Lớp Học Của Bạn ({assignedRooms.length})
              </h3>
            </div>
            <button
              onClick={loadRooms}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Cập nhật</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedRooms.map((room) => {
              const isOpen = room.status === 'open';
              const isJoining = joiningRoomId === room.id;

              return (
                <div
                  key={room.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 ${
                    isOpen
                      ? 'bg-slate-900/90 border-emerald-500/60 shadow-xl shadow-emerald-950/30 ring-1 ring-emerald-500/20'
                      : 'bg-slate-900/40 border-slate-800 opacity-75'
                  }`}
                >
                  <div>
                    {/* Header: Subject + Status */}
                    <div className="flex items-center justify-between mb-2.5">
                      {getSubjectBadge(room.subject)}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isOpen
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/60'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                        {isOpen ? '🟢 Đang Mở' : '🔴 Đã Đóng'}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {room.code}
                    </span>

                    <h4 className="font-bold text-base text-slate-100 mt-2 mb-1.5">
                      {room.name}
                    </h4>

                    {room.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                        {room.description}
                      </p>
                    )}

                    <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Giáo viên phụ trách:</span>
                      <strong className="text-slate-200">{room.teacherName || 'Thầy Nguyễn Minh'}</strong>
                    </div>

                    {/* Hàng dưới Giáo viên phụ trách: Học sinh tham gia lớp: Cụm avatar tròn xếp lấn lên nhau đặt sát dấu hai chấm, cách 1 dấu cách */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap min-h-[30px]">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Học sinh tham gia lớp:</span>
                      </div>

                      {/* Cụm avatar tròn xếp lấn lên nhau đặt ngay gần dấu : cách đúng 1 space (gap-1.5) */}
                      <div className="flex items-center -space-x-1.5 py-0.5">
                        {room.assignedStudentIds?.slice(0, 6).map((sid) => {
                          const st = students.find((s) => s.id === sid);
                          const isCurrent = sid === currentUser.id;
                          return (
                            <div
                              key={sid}
                              title={st ? `${st.name}${isCurrent ? ' (Bạn)' : ''}` : sid}
                              className={`w-6 h-6 rounded-full bg-gradient-to-tr ${
                                st?.avatarColor || 'from-slate-600 to-slate-700'
                              } border-2 ${
                                isCurrent
                                  ? 'border-emerald-400 ring-2 ring-emerald-500/40 z-10 scale-105'
                                  : 'border-slate-900'
                              } flex items-center justify-center text-[10px] font-bold text-white shadow transition hover:scale-110 hover:z-20 cursor-default`}
                            >
                              {st ? st.name.charAt(0) : '?'}
                            </div>
                          );
                        })}
                        {(room.assignedStudentIds?.length || 0) > 6 && (
                          <div
                            title={`Còn ${(room.assignedStudentIds?.length || 0) - 6} học sinh khác`}
                            className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold text-slate-300 shadow cursor-default"
                          >
                            +{(room.assignedStudentIds?.length || 0) - 6}
                          </div>
                        )}
                        {(!room.assignedStudentIds || room.assignedStudentIds.length === 0) && (
                          <span className="text-[11px] text-slate-500 italic">
                            Chưa có học sinh
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Join Action */}
                  <div className="mt-5 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => handleJoinRoom(room)}
                      disabled={!isOpen || isJoining}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition duration-150 ${
                        isOpen
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 cursor-pointer'
                          : 'bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      {isJoining ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Đang kiểm tra rào chắn & kết nối...</span>
                        </>
                      ) : isOpen ? (
                        <>
                          <Video className="w-4 h-4" />
                          <span>VÀO LỚP HỌC NGAY</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Chưa mở / Đã kết thúc (Vui lòng đợi Thầy/Cô)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {assignedRooms.length === 0 && !isLoading && (
            <div className="text-center py-12 bg-slate-900/40 rounded-3xl border border-slate-800 p-6">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">Bạn chưa được gán vào lớp học nào</p>
              <p className="text-xs text-slate-400 mt-1">
                Vui lòng liên hệ Thầy/Cô giáo để được thêm vào danh sách lớp học Toán, Lý hoặc Hóa.
              </p>
            </div>
          )}
        </div>

        {/* Section 2: Lớp học khác (Chưa được gán - Minh họa rào chắn) */}
        {otherRooms.length > 0 && (
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Các phòng học khác (Yêu cầu được phân quyền để vào):</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-60">
              {otherRooms.map((room) => (
                <div
                  key={room.id}
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/30 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-300">{room.name}</span>
                      {getSubjectBadge(room.subject)}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{room.code}</p>
                  </div>
                  <button
                    onClick={() => handleJoinRoom(room)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[11px] font-medium transition"
                  >
                    Thử vào (Test Rào Chắn)
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
