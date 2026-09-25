import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import { X, Check, Calculator, Sparkles, BookOpen, Zap, Atom } from 'lucide-react';
import { MATH_FORMULAS, PHYSICS_FORMULAS, CHEM_FORMULAS } from '../../data/stemTools';
import { MathFormulaItem, SubjectType } from '../../types';

interface MathFormulaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertFormula: (latex: string, title: string) => void;
  subject?: SubjectType;
}

export const MathFormulaDialog: React.FC<MathFormulaDialogProps> = ({
  isOpen,
  onClose,
  onInsertFormula,
  subject = 'math',
}) => {
  // Determine formula templates and initial defaults based on subject
  const formulas: MathFormulaItem[] =
    subject === 'physics'
      ? PHYSICS_FORMULAS
      : subject === 'chemistry'
      ? CHEM_FORMULAS
      : MATH_FORMULAS;

  const defaultLatex =
    subject === 'physics'
      ? 'Z = \\sqrt{R^2 + (Z_L - Z_C)^2}, \\quad \\tan\\varphi = \\frac{Z_L - Z_C}{R}'
      : subject === 'chemistry'
      ? 'RCOOH + R\'OH \\overset{H_2SO_4, t^\\circ}{\\rightleftharpoons} RCOOR\' + H_2O'
      : '\\int_{0}^{\\pi} \\sin(x)\\,dx = 2';

  const defaultTitle =
    subject === 'physics'
      ? 'Tổng trở mạch RLC nối tiếp'
      : subject === 'chemistry'
      ? 'Phản ứng Este hóa'
      : 'Tích phân lượng giác';

  const [latexInput, setLatexInput] = useState<string>(defaultLatex);
  const [selectedFormulaTitle, setSelectedFormulaTitle] = useState<string>(defaultTitle);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Reset defaults when opening for a specific subject
  useEffect(() => {
    if (isOpen) {
      setLatexInput(defaultLatex);
      setSelectedFormulaTitle(defaultTitle);
    }
  }, [isOpen, subject]);

  useEffect(() => {
    if (previewRef.current && isOpen) {
      try {
        katex.render(latexInput, previewRef.current, {
          displayMode: true,
          throwOnError: true,
        });
        setPreviewError(null);
      } catch (err: any) {
        setPreviewError(err.message || 'Cú pháp LaTeX chưa hợp lệ');
      }
    }
  }, [latexInput, isOpen]);

  if (!isOpen) return null;

  const handleSelectTemplate = (item: MathFormulaItem) => {
    setLatexInput(item.latex);
    setSelectedFormulaTitle(item.title);
  };

  const handleInsert = () => {
    if (!previewError && latexInput.trim()) {
      onInsertFormula(latexInput, selectedFormulaTitle);
      onClose();
    }
  };

  const getSubjectConfig = () => {
    switch (subject) {
      case 'physics':
        return {
          icon: <Zap className="w-5 h-5 text-amber-400" />,
          title: 'Chèn Công Thức Vật Lý (LaTeX / KaTeX)',
          desc: 'Điện xoay chiều, Dao động, Cơ học, Sóng dừng, Hạt nhân',
          templateTitle: 'Mẫu công thức Vật Lý phổ biến (Lớp 10 - 11 - 12):',
          color: 'amber',
        };
      case 'chemistry':
        return {
          icon: <Atom className="w-5 h-5 text-cyan-400" />,
          title: 'Chèn Phương Trình & Công Thức Hóa Học',
          desc: 'Phản ứng hữu cơ, Vô cơ, Oxi hóa - khử, Cân bằng Le Chatelier',
          templateTitle: 'Mẫu phản ứng & công thức Hóa học (Lớp 10 - 11 - 12):',
          color: 'cyan',
        };
      default:
        return {
          icon: <Calculator className="w-5 h-5 text-emerald-400" />,
          title: 'Chèn Công Thức Toán Học (LaTeX / KaTeX)',
          desc: 'Đại số, Giải tích, Đạo hàm, Tích phân, Lượng giác, Hình học Oxyz',
          templateTitle: 'Mẫu công thức Toán học phổ biến (Lớp 10 - 11 - 12):',
          color: 'emerald',
        };
    }
  };

  const config = getSubjectConfig();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5 text-slate-100">
            <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
              {config.icon}
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-base">{config.title}</h3>
              <p className="text-xs text-slate-400">{config.desc}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Formula Templates */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                {config.templateTitle}
              </label>
              <span className="text-[11px] text-slate-400">Bấm để chọn nhanh</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {formulas.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleSelectTemplate(f)}
                  className={`text-left p-2.5 rounded-xl border text-xs transition duration-150 flex flex-col justify-between h-20 ${
                    latexInput === f.latex
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <span className="font-medium text-slate-200 truncate w-full">{f.title}</span>
                  <span className="text-[10px] text-slate-400 truncate w-full font-mono bg-slate-900/60 px-1 py-0.5 rounded">
                    {f.latex}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* LaTeX Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Mã nguồn LaTeX tùy chỉnh:
            </label>
            <textarea
              value={latexInput}
              onChange={(e) => setLatexInput(e.target.value)}
              rows={3}
              placeholder="Nhập mã LaTeX..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-emerald-300 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Live Chalkboard Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Xem trước như chữ viết phấn trên bảng:
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Độ phân giải cao 1080p</span>
            </div>

            <div className="rounded-xl border border-emerald-900/60 bg-[#133023] p-5 text-center min-h-[100px] flex items-center justify-center relative overflow-hidden shadow-inner">
              {/* Subtle chalkboard grid background */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, #f8fafc 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
              <div
                ref={previewRef}
                className="text-white text-xl sm:text-2xl font-serif text-shadow-sm transition"
                style={{
                  filter: 'drop-shadow(0 0 1px rgba(255,255,255,0.7))',
                }}
              />
              {previewError && (
                <div className="absolute inset-x-2 bottom-2 bg-rose-950/80 border border-rose-700 text-rose-300 text-xs px-3 py-1 rounded-lg">
                  {previewError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium transition"
          >
            Hủy
          </button>
          <button
            onClick={handleInsert}
            disabled={!!previewError || !latexInput.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none text-white text-sm font-medium shadow-lg shadow-emerald-900/30 transition duration-150"
          >
            <Check className="w-4 h-4" />
            Chèn lên Bảng Phấn
          </button>
        </div>
      </div>
    </div>
  );
};
