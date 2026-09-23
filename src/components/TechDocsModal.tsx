import React from 'react';
import { X, BookOpen, Layers, Cpu, ShieldCheck, Terminal, FolderTree, Network } from 'lucide-react';

interface TechDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechDocsModal: React.FC<TechDocsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5 text-emerald-400">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-base">Kiến Trúc WebRTC LiveKit & Đồng Bộ Bảng Trắng</h3>
              <p className="text-xs text-slate-400">Nguyên lý kỹ thuật, so sánh công nghệ và hướng dẫn triển khai 5 bước</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* Section 1: So sánh LiveKit Data Channel vs WebSocket */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-3">
            <h4 className="font-bold text-emerald-300 flex items-center gap-2 text-sm">
              <Network className="w-4 h-4 text-emerald-400" />
              1. Tại sao dùng LiveKit Data Channel thay vì WebSocket truyền thống?
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-1">✅ LiveKit Data Channel (WebRTC SCTP)</span>
                <p className="text-slate-300 mb-1.5">• <strong>Không cần mở thêm kết nối TCP:</strong> Nét vẽ được ghép kênh (multiplex) trực tiếp trên cùng phiên mã hóa DTLS/ICE của WebRTC Media.</p>
                <p className="text-slate-300 mb-1.5">• <strong>Hỗ trợ 2 chế độ linh hoạt:</strong></p>
                <p className="text-slate-400 pl-2">- <code>reliable: true</code>: Đảm bảo dữ liệu nét vẽ, phân quyền, công thức không bao giờ bị mất gói.</p>
                <p className="text-slate-400 pl-2">- <code>reliable: false</code>: Truyền tọa độ con trỏ (laser pointer) với độ trễ siêu thấp (&lt;30ms) mà không bị Head-of-Line blocking.</p>
                <p className="text-slate-300">• <strong>Đồng bộ hoàn hảo với Audio/Video:</strong> Không bị hiện tượng &quot;tiếng nói trước, nét vẽ hiện sau&quot;.</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-amber-400 block mb-1">⚠️ WebSocket thông thường</span>
                <p className="text-slate-300 mb-1.5">• Phải thiết lập thêm một kết nối TCP riêng biệt song song với luồng WebRTC.</p>
                <p className="text-slate-300 mb-1.5">• Bị hiện tượng <strong>Head-of-Line Blocking</strong>: Nếu mất một gói tin mạng, toàn bộ dữ liệu tọa độ chuột phía sau bị ứ đọng chờ gửi lại.</p>
                <p className="text-slate-300">• Tốn thêm tài nguyên socket server riêng và khó đồng bộ timestamp với luồng video SFU.</p>
              </div>
            </div>
          </div>

          {/* Section 2: Ưu tiên băng thông 1080p cho Bảng trắng & Toán Lý Hóa */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2">
            <h4 className="font-bold text-blue-300 flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4 text-blue-400" />
              2. Chiến lược Ưu Tiên Băng Thông (Bandwidth Allocation):
            </h4>
            <p className="text-slate-300 text-xs">
              Trong lớp học nhóm nhỏ (3-7 học sinh) chuyên Toán, Lý, Hóa, điểm cốt lõi quyết định chất lượng buổi học là <strong>độ sắc nét của chỉ số dưới, số mũ, công thức tích phân và ký hiệu mạch điện</strong>:
            </p>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1.5 text-xs font-mono">
              <p className="text-emerald-400">• Whiteboard / Screen Share: VideoPresets.h1080 (1920x1080 @ 3000kbps, contentHint: &apos;detail&apos;)</p>
              <p className="text-slate-400">• Camera Giáo viên: VideoPresets.h720 (1280x720 @ 1000kbps)</p>
              <p className="text-slate-500">• Camera Học sinh: VideoPresets.h360 (640x360 @ 300kbps hoặc 180p khi mạng yếu)</p>
              <p className="text-cyan-400">• Cơ chế Simulcast & Dynacast: Tự động dừng nhận video chất lượng cao từ học sinh khi đang tập trung xem bảng.</p>
            </div>
          </div>

          {/* Section 3: Logic Phân Quyền Role-based & Gọi lên bảng */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2">
            <h4 className="font-bold text-teal-300 flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              3. Cơ chế Phân quyền (Role-Based) & Gọi học sinh lên bảng:
            </h4>
            <ul className="text-xs space-y-1 list-disc pl-4 text-slate-300">
              <li><strong>Giáo viên (Teacher):</strong> Có quyền viết mặc định, xóa bảng, tải bài giảng, cấp/thu hồi quyền viết của bất kỳ học sinh nào.</li>
              <li><strong>Học sinh (Student):</strong> Mặc định ở chế độ <code>READ_ONLY</code> (thanh công cụ bị khóa, có nút Giơ tay ✋).</li>
              <li>Khi Thầy/Cô bấm <strong>&quot;Gọi lên bảng&quot;</strong>: Giáo viên phát tin nhắn Data Channel <code>whiteboard_permission</code>. Màn hình học sinh lập tức hiển thị hiệu ứng chúc mừng, mở khóa thanh phấn và cho phép tương tác trực tiếp lên bài tập.</li>
            </ul>
          </div>

          {/* Section 4: Hướng dẫn chạy và triển khai (Terminal Commands) */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2">
            <h4 className="font-bold text-amber-300 flex items-center gap-2 text-sm">
              <Terminal className="w-4 h-4 text-amber-400" />
              4. Lệnh Terminal cài đặt & khởi động dự án:
            </h4>
            <pre className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-emerald-400 font-mono text-xs overflow-x-auto">
{`# 1. Cài đặt các thư viện LiveKit, tldraw, KaTeX
npm install livekit-server-sdk livekit-client tldraw katex motion lucide-react

# 2. Cấu hình biến môi trường trong .env
LIVEKIT_URL="wss://your-project.livekit.cloud"
LIVEKIT_API_KEY="your_api_key"
LIVEKIT_API_SECRET="your_api_secret"

# 3. Chạy môi trường phát triển (Full-stack Express + Vite)
npm run dev
# Server lắng nghe tại http://localhost:3000`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition"
          >
            Đã hiểu, quay lại Lớp Học
          </button>
        </div>
      </div>
    </div>
  );
};
