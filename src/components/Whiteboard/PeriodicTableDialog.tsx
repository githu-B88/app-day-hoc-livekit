import React, { useState } from 'react';
import { X, Atom, Search, Plus } from 'lucide-react';
import { QUICK_PERIODIC_ELEMENTS, PeriodicElement } from '../../data/stemTools';

interface PeriodicTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertElement: (element: PeriodicElement) => void;
}

export const PeriodicTableDialog: React.FC<PeriodicTableDialogProps> = ({
  isOpen,
  onClose,
  onInsertElement,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = QUICK_PERIODIC_ELEMENTS.filter(
    (el) =>
      el.symbol.toLowerCase().includes(search.toLowerCase()) ||
      el.name.toLowerCase().includes(search.toLowerCase()) ||
      el.number.toString().includes(search)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5 text-cyan-400">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Atom className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-base">Bảng Tuần Hoàn Nguyên Tố Hóa Học</h3>
              <p className="text-xs text-slate-400">Tra cứu nhanh Số hiệu (Z), Nguyên tử khối (M) và Độ âm điện (χ)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo ký hiệu (H, Fe, Cu), tên nguyên tố hoặc số Z..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>
        </div>

        {/* Elements Grid */}
        <div className="p-5 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map((el) => (
            <div
              key={el.number}
              className="group p-3 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-cyan-950/30 hover:border-cyan-500/50 transition duration-150 flex flex-col justify-between relative cursor-pointer"
              onClick={() => {
                onInsertElement(el);
                onClose();
              }}
            >
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-mono font-bold text-slate-500 group-hover:text-cyan-400">
                  {el.number}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  M: {el.mass.toFixed(1)}
                </span>
              </div>
              <div className="my-1 text-center">
                <span className="text-2xl font-bold text-white group-hover:text-cyan-300 font-serif">
                  {el.symbol}
                </span>
                <p className="text-xs text-slate-300 truncate">{el.name}</p>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 mt-1">
                <span>χ: {el.electronegativity || '-'}</span>
                <span className="text-cyan-400 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition">
                  <Plus className="w-3 h-3" /> Chèn
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Mẹo: Nhấp vào nguyên tố để chèn thẳng ký hiệu và ô nguyên tố lên bảng xanh.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
