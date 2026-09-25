import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  PenTool,
  Eraser,
  Square,
  Circle,
  ArrowRight,
  Minus,
  Sparkles,
  RotateCcw,
  Download,
  Grid,
  Palette,
  Calculator,
  Atom,
  Zap,
  Lock,
  Hand,
  CheckCircle2,
  Trash2,
  Share2,
  MousePointer,
  Move,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  SubjectType,
  UserRole,
  BlackboardTheme,
  GridType,
  BoardShape,
  BoardCursor,
  StrokePoint,
  Participant
} from '../../types';
import { livekitService } from '../../services/livekitService';
import { MathFormulaDialog } from './MathFormulaDialog';
import { PeriodicTableDialog } from './PeriodicTableDialog';
import { PeriodicElement, PHYSICS_COMPONENTS, CHEM_ITEMS } from '../../data/stemTools';
import katex from 'katex';

// Helper to convert LaTeX to clean readable Unicode math for Canvas 2D fallback/export
export const formatLatexToUnicode = (latex: string): string => {
  if (!latex) return '';
  let s = latex;
  s = s.replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, '∫_{$1}^{$2} ');
  s = s.replace(/\\int/g, '∫ ');
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');
  s = s.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
  s = s.replace(/\\sqrt/g, '√');
  s = s.replace(/\\pi/g, 'π');
  s = s.replace(/\\cdot/g, ' · ');
  s = s.replace(/\\times/g, ' × ');
  s = s.replace(/\\pm/g, '±');
  s = s.replace(/\\mp/g, '∓');
  s = s.replace(/\\le/g, '≤');
  s = s.replace(/\\ge/g, '≥');
  s = s.replace(/\\neq/g, '≠');
  s = s.replace(/\\approx/g, '≈');
  s = s.replace(/\\infty/g, '∞');
  s = s.replace(/\\implies/g, ' ⟹ ');
  s = s.replace(/\\longrightarrow/g, ' ⟶ ');
  s = s.replace(/\\uparrow/g, ' ↑');
  s = s.replace(/\\downarrow/g, ' ↓');
  s = s.replace(/\\vec\{([^}]+)\}/g, 'vec($1)');
  s = s.replace(/\\tan/g, 'tan');
  s = s.replace(/\\sin/g, 'sin');
  s = s.replace(/\\cos/g, 'cos');
  s = s.replace(/\\left|\\right/g, '');
  s = s.replace(/\\text\{([^}]+)\}/g, '$1');
  s = s.replace(/\\quad/g, ' ');
  s = s.replace(/\\,|\\;|\\!/g, ' ');
  s = s.replace(/\\dx/g, ' dx');
  s = s.replace(/\\dy/g, ' dy');
  s = s.replace(/\\dt/g, ' dt');
  s = s.replace(/\\varphi/g, 'φ');
  s = s.replace(/\\theta/g, 'θ');
  s = s.replace(/\\alpha/g, 'α');
  s = s.replace(/\\beta/g, 'β');
  s = s.replace(/\\Delta/g, 'Δ');
  s = s.replace(/\\Omega/g, 'Ω');
  s = s.replace(/\\{1,2}/g, '');
  return s.trim();
};

// Helper to render KaTeX formula HTML cleanly without throwing uncaught errors
export const renderKaTeXHtml = (latex: string): string => {
  if (!latex) return '';
  try {
    return katex.renderToString(latex, {
      displayMode: true,
      throwOnError: false,
    });
  } catch (err: any) {
    return `<span style="color:#f87171;font-family:monospace;font-size:13px">${latex}</span>`;
  }
};

interface ChalkboardCanvasProps {
  subject: SubjectType;
  currentUser: Participant;
  participants: Participant[];
  onRaiseHand: () => void;
  onClearBoard: () => void;
  onAwardStudent?: (studentId: string) => void;
}

export const ChalkboardCanvas: React.FC<ChalkboardCanvasProps> = ({
  subject,
  currentUser,
  participants,
  onRaiseHand,
  onClearBoard,
  onAwardStudent,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Board settings
  const [boardTheme, setBoardTheme] = useState<BlackboardTheme>('green');
  const [gridType, setGridType] = useState<GridType>('grid-notebook');

  // Tool states
  const [activeTool, setActiveTool] = useState<
    'select' | 'chalk' | 'eraser' | 'line' | 'arrow' | 'rect' | 'circle' | 'axes' | 'parabola' | 'sine' | 'benzene' | 'resistor' | 'capacitor'
  >('chalk');
  const [chalkColor, setChalkColor] = useState<string>('#ffffff');
  const [chalkSize, setChalkSize] = useState<number>(3);

  // Selection & Move states
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [isDraggingShape, setIsDraggingShape] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);

  // Toolbar collapse state to maximize screen space
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState<boolean>(false);
  const [isTopBarOpen, setIsTopBarOpen] = useState<boolean>(false);

  // Drawing state
  const [shapes, setShapes] = useState<BoardShape[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<StrokePoint[]>([]);
  const [startPoint, setStartPoint] = useState<StrokePoint | null>(null);

  // Remote cursors
  const [remoteCursors, setRemoteCursors] = useState<Map<string, BoardCursor>>(new Map());

  // Modals
  const [isMathModalOpen, setIsMathModalOpen] = useState(false);
  const [isChemModalOpen, setIsChemModalOpen] = useState(false);

  // Status notification
  const [notification, setNotification] = useState<string | null>(null);

  // Can the current user write on the board?
  const canWrite = currentUser.role === 'teacher' || currentUser.canDraw;

  // Chalk Colors
  const CHALK_COLORS = [
    { name: 'Phấn Trắng', color: '#ffffff' },
    { name: 'Phấn Vàng', color: '#fef08a' },
    { name: 'Phấn Hồng', color: '#fbcfe8' },
    { name: 'Phấn Xanh Lam', color: '#7dd3fc' },
    { name: 'Phấn Xanh Lá', color: '#86efac' },
    { name: 'Phấn Cam', color: '#fed7aa' },
  ];

  // Initialize with initial lesson content based on subject
  useEffect(() => {
    const initialShapes: BoardShape[] = [];

    if (subject === 'math') {
      initialShapes.push(
        {
          id: 'init_title',
          type: 'text',
          x: 40,
          y: 60,
          color: '#fef08a',
          size: 20,
          content: 'CHUYÊN ĐỀ: KHẢO SÁT HÀM SỐ & TÍCH PHÂN 12',
          authorId: 'teacher_1',
          authorName: 'Thầy Minh',
          createdAt: Date.now(),
        },
        {
          id: 'init_formula',
          type: 'math',
          x: 40,
          y: 110,
          color: '#ffffff',
          size: 16,
          latex: 'I = \\int_{0}^{\\frac{\\pi}{2}} x \\cdot \\cos(x)\\,dx',
          content: 'Tích phân từng phần',
          authorId: 'teacher_1',
          authorName: 'Thầy Minh',
          createdAt: Date.now(),
        },
        {
          id: 'init_axes',
          type: 'axes',
          x: 480,
          y: 220,
          width: 320,
          height: 220,
          color: '#7dd3fc',
          size: 2,
          authorId: 'teacher_1',
          authorName: 'Thầy Minh',
          createdAt: Date.now(),
        },
        {
          id: 'init_parabola',
          type: 'parabola',
          x: 480,
          y: 220,
          width: 320,
          height: 220,
          color: '#fbcfe8',
          size: 2.5,
          authorId: 'teacher_1',
          authorName: 'Thầy Minh',
          createdAt: Date.now(),
        }
      );
    } else if (subject === 'physics') {
      initialShapes.push(
        {
          id: 'init_title_phys',
          type: 'text',
          x: 40,
          y: 60,
          color: '#7dd3fc',
          size: 20,
          content: 'VẬT LÝ 12: MẠCH DAO ĐỘNG R-L-C MẮC NỐI TIẾP',
          authorId: 'teacher_1',
          authorName: 'Thầy Minh',
          createdAt: Date.now(),
        },
        {
          id: 'init_formula_phys',
          type: 'math',
          x: 40,
          y: 110,
          color: '#ffffff',
          size: 16,
          latex: 'Z = \\sqrt{R^2 + (Z_L - Z_C)^2}, \\quad \\tan\\varphi = \\frac{Z_L - Z_C}{R}',
          content: 'Tổng trở mạch RLC',
          authorId: 'teacher_1',
          authorName: 'Thầy Minh',
          createdAt: Date.now(),
        },
        {
          id: 'init_circuit',
          type: 'resistor',
          x: 420,
          y: 180,
          width: 140,
          height: 40,
          color: '#fef08a',
          size: 2.5,
          authorId: 'teacher_1',
          authorName: 'Thầy Minh',
          createdAt: Date.now(),
        },
        {
          id: 'init_capacitor',
          type: 'capacitor',
          x: 600,
          y: 180,
          width: 80,
          height: 40,
          color: '#86efac',
          size: 2.5,
          authorId: 'teacher_1',
          authorName: 'Thầy Minh',
          createdAt: Date.now(),
        }
      );
    } else {
      initialShapes.push(
        {
          id: 'init_title_chem',
          type: 'text',
          x: 40,
          y: 60,
          color: '#86efac',
          size: 20,
          content: 'HÓA HỌC HỮU CƠ: DẪN XUẤT HYDROCARBON & ANCOL',
          authorId: 'teacher_1',
          authorName: 'Thầy Minh',
          createdAt: Date.now(),
        },
        {
          id: 'init_formula_chem',
          type: 'math',
          x: 40,
          y: 110,
          color: '#ffffff',
          size: 16,
          latex: 'C_2H_5OH + Na \\longrightarrow C_2H_5ONa + \\frac{1}{2}H_2\\uparrow',
          content: 'Phản ứng thế Natri',
          authorId: 'teacher_1',
          authorName: 'Thầy Minh',
          createdAt: Date.now(),
        },
        {
          id: 'init_benzene',
          type: 'benzene',
          x: 460,
          y: 190,
          width: 110,
          height: 110,
          color: '#fef08a',
          size: 2.5,
          authorId: 'teacher_1',
          authorName: 'Thầy Minh',
          createdAt: Date.now(),
        }
      );
    }

    setShapes(initialShapes);
  }, [subject]);

  // Handle LiveKit Data Channel synchronization
  useEffect(() => {
    const unsubDraw = livekitService.on('whiteboard_draw', (shape: BoardShape, senderId: string) => {
      // Avoid duplicate shapes if sent by self
      if (senderId !== currentUser.id) {
        setShapes((prev) => [...prev, shape]);
      }
    });

    const unsubClear = livekitService.on('whiteboard_clear', () => {
      setShapes([]);
      setNotification('Bảng đã được làm sạch bởi Giáo viên');
      setTimeout(() => setNotification(null), 3000);
    });

    const unsubCursor = livekitService.on('whiteboard_cursor', (cursor: BoardCursor, senderId: string) => {
      if (senderId !== currentUser.id) {
        setRemoteCursors((prev) => {
          const next = new Map(prev);
          next.set(senderId, cursor);
          return next;
        });
      }
    });

    const unsubReward = livekitService.on('whiteboard_reward', (reward: any) => {
      if (reward.studentId === currentUser.id) {
        setNotification(`🌟 Chúc mừng ${currentUser.name}! Thầy Minh đã khen ngợi bài làm của bạn trên bảng!`);
        setTimeout(() => setNotification(null), 5000);
      }
    });

    const unsubShapeUpdate = livekitService.on(
      'shape_update',
      (updated: { id: string; x?: number; y?: number; points?: StrokePoint[] }, senderId: string) => {
        if (senderId !== currentUser.id) {
          setShapes((prev) =>
            prev.map((s) => {
              if (s.id === updated.id) {
                return {
                  ...s,
                  x: updated.x !== undefined ? updated.x : s.x,
                  y: updated.y !== undefined ? updated.y : s.y,
                  points: updated.points || s.points,
                };
              }
              return s;
            })
          );
        }
      }
    );

    const unsubPerm = livekitService.on('whiteboard_permission', (data: any) => {
      if (data.studentId === currentUser.id) {
        if (data.canDraw) {
          setNotification(`🎉 Bạn đã được ${data.by || 'Giáo viên'} cho phép cầm phấn lên bảng!`);
        } else {
          setNotification(`🔒 Giáo viên đã thu hồi quyền cầm phấn. Bảng đã chuyển về chế độ chỉ xem.`);
        }
        setTimeout(() => setNotification(null), 4500);
      }
    });

    return () => {
      unsubDraw();
      unsubClear();
      unsubCursor();
      unsubReward();
      unsubShapeUpdate();
      unsubPerm();
    };
  }, [currentUser.id, currentUser.name]);

  // Khi bị thu hồi quyền cầm phấn, dừng ngay thao tác vẽ và hủy chọn
  useEffect(() => {
    if (!canWrite) {
      setIsDrawing(false);
      setIsDraggingShape(false);
      setSelectedShapeId(null);
      setCurrentPoints([]);
      setStartPoint(null);
    }
  }, [canWrite]);

  // Ngăn chặn cuộn trang khi di chuột trên bảng vẽ
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Chặn cuộn trang khi di chuột trên bảng vẽ, bảng vẽ luôn cố định
      e.preventDefault();
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Helper to determine bounding box for any shape
  const getShapeBounds = (shape: BoardShape): { x: number; y: number; w: number; h: number } => {
    if (shape.points && shape.points.length > 0) {
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (const p of shape.points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      return { x: minX, y: minY, w: Math.max(maxX - minX, 30), h: Math.max(maxY - minY, 30) };
    }

    const x = shape.x || 0;
    const y = shape.y || 0;

    switch (shape.type) {
      case 'rect':
        return { x, y, w: shape.width || 120, h: shape.height || 80 };
      case 'circle': {
        const r = Math.abs((shape.width || 80) / 2);
        return { x: x - r, y: y - r, w: r * 2, h: r * 2 };
      }
      case 'axes': {
        const w = shape.width || 280;
        const h = shape.height || 200;
        return { x: x - w / 2, y: y - h / 2, w, h };
      }
      case 'parabola':
        return { x: x - 110, y: y - 140, w: 220, h: 150 };
      case 'benzene': {
        const r = (shape.width || 80) / 2;
        return { x: x - r - 10, y: y - r - 10, w: (r + 10) * 2, h: (r + 10) * 2 + 25 };
      }
      case 'resistor':
        return { x, y: y - 24, w: shape.width || 120, h: 48 };
      case 'capacitor':
        return { x, y: y - 30, w: shape.width || 80, h: 60 };
      case 'math':
        return { x: x - 10, y: y - 25, w: 360, h: 65 };
      case 'text':
        return { x, y: y - 24, w: Math.max((shape.content?.length || 10) * 12, 140), h: 36 };
      default:
        return { x, y, w: 100, h: 60 };
    }
  };

  const isPointInShape = (px: number, py: number, shape: BoardShape): boolean => {
    const b = getShapeBounds(shape);
    return px >= b.x - 8 && px <= b.x + b.w + 8 && py >= b.y - 8 && py <= b.y + b.h + 8;
  };

  // Resize canvas according to container
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        drawBoard();
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Bổ sung ResizeObserver để bảng vẽ phản hồi co giãn ngay lập tức khi ẩn/hiện camera strip
    let ro: ResizeObserver | null = null;
    if (containerRef.current && window.ResizeObserver) {
      ro = new ResizeObserver(() => {
        updateCanvasSize();
      });
      ro.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (ro) ro.disconnect();
    };
  }, [boardTheme, gridType, shapes, remoteCursors]);

  // Core Render Engine: Drawing the blackboard and all shapes
  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    ctx.clearRect(0, 0, width, height);

    // 1. Background Fill
    if (boardTheme === 'green') {
      // Classic deep green chalkboard gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#163b2c');
      bgGrad.addColorStop(1, '#112b20');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle chalk dust vignette
      const dustGrad = ctx.createRadialGradient(width / 2, height / 2, width / 4, width / 2, height / 2, width);
      dustGrad.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
      dustGrad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
      ctx.fillStyle = dustGrad;
      ctx.fillRect(0, 0, width, height);
    } else if (boardTheme === 'dark') {
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. School Grid Overlay
    if (gridType === 'grid-notebook') {
      // 4-line notebook grid (Ô ly học sinh)
      ctx.save();
      ctx.strokeStyle = boardTheme === 'white' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 0.8;
      const step = 28;

      for (let y = step; y < height; y += step) {
        ctx.beginPath();
        // Major line every 4 steps
        if (Math.round(y / step) % 4 === 0) {
          ctx.strokeStyle = boardTheme === 'white' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.16)';
        } else {
          ctx.strokeStyle = boardTheme === 'white' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.05)';
        }
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Vertical line for margins
      ctx.strokeStyle = boardTheme === 'white' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(244, 63, 94, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(80, 0);
      ctx.lineTo(80, height);
      ctx.stroke();

      ctx.restore();
    } else if (gridType === 'grid-cartesian') {
      // Cartesian Coordinate Graph Paper
      ctx.save();
      const step = 32;
      ctx.strokeStyle = boardTheme === 'white' ? 'rgba(30, 41, 59, 0.1)' : 'rgba(255, 255, 255, 0.09)';
      ctx.lineWidth = 0.6;

      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();
    } else if (gridType === 'grid-millimeter') {
      ctx.save();
      ctx.strokeStyle = boardTheme === 'white' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 0.5;
      const step = 14;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Render all existing shapes with authentic chalk feel
    shapes.forEach((shape) => {
      renderShape(ctx, shape, boardTheme);
    });

    // 3.5 Render selection frame for selectedShapeId (Select & Move Tool)
    if (selectedShapeId) {
      const selShape = shapes.find((s) => s.id === selectedShapeId);
      if (selShape) {
        const b = getShapeBounds(selShape);
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12);

        // Badge pill
        ctx.setLineDash([]);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(b.x - 6, b.y - 24, 78, 17);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('✥ Di chuyển', b.x - 1, b.y - 12);
        ctx.restore();
      }
    }

    // 4. Render current stroke being drawn
    if (isDrawing && currentPoints.length > 1) {
      if (activeTool === 'chalk') {
        renderChalkStroke(ctx, currentPoints, chalkColor, chalkSize, boardTheme);
      } else if (activeTool === 'eraser') {
        // Eraser preview
        const last = currentPoints[currentPoints.length - 1];
        ctx.save();
        ctx.beginPath();
        ctx.arc(last.x, last.y, 22, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 5. Render Remote Cursors (Students & Teacher Laser / Chalk tip pointers)
    remoteCursors.forEach((cursor) => {
      // Only show if updated within last 10 seconds
      if (Date.now() - cursor.lastUpdated < 10000) {
        ctx.save();
        // Glow effect
        ctx.shadowColor = cursor.color;
        ctx.shadowBlur = 8;

        // Pointer dot / chalk tip
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = cursor.color;
        ctx.fill();

        // Outer ripple
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, 11, 0, Math.PI * 2);
        ctx.strokeStyle = cursor.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Name tag label
        ctx.shadowBlur = 0;
        ctx.font = '500 11px sans-serif';
        const label = `${cursor.role === 'teacher' ? '👨‍🏫' : '✍️'} ${cursor.userName}`;
        const textWidth = ctx.measureText(label).width;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = cursor.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cursor.x + 8, cursor.y - 18, textWidth + 12, 20, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, cursor.x + 14, cursor.y - 4);

        ctx.restore();
      }
    });
  }, [boardTheme, gridType, shapes, isDrawing, currentPoints, chalkColor, chalkSize, activeTool, remoteCursors]);

  // Helper to render custom STEM shapes with chalk style
  const renderShape = (ctx: CanvasRenderingContext2D, shape: BoardShape, theme: BlackboardTheme) => {
    ctx.save();

    // Authentic chalk texturing
    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.color;
    ctx.lineWidth = shape.size || 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Soft chalk glow
    if (theme !== 'white') {
      ctx.shadowColor = shape.color;
      ctx.shadowBlur = 2;
    }

    switch (shape.type) {
      case 'freehand':
        if (shape.points && shape.points.length > 1) {
          renderChalkStroke(ctx, shape.points, shape.color, shape.size, theme);
        }
        break;

      case 'line':
        if (shape.points && shape.points.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(shape.points[0].x, shape.points[0].y);
          ctx.lineTo(shape.points[1].x, shape.points[1].y);
          ctx.stroke();
        }
        break;

      case 'arrow':
        if (shape.points && shape.points.length >= 2) {
          const from = shape.points[0];
          const to = shape.points[1];
          const headlen = 14;
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const angle = Math.atan2(dy, dx);

          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();

          // Arrow head
          ctx.beginPath();
          ctx.moveTo(to.x, to.y);
          ctx.lineTo(to.x - headlen * Math.cos(angle - Math.PI / 6), to.y - headlen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(to.x - headlen * Math.cos(angle + Math.PI / 6), to.y - headlen * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fill();
        }
        break;

      case 'rect':
        if (shape.x !== undefined && shape.y !== undefined && shape.width && shape.height) {
          ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        }
        break;

      case 'circle':
        if (shape.x !== undefined && shape.y !== undefined && shape.width) {
          ctx.beginPath();
          ctx.arc(shape.x, shape.y, Math.abs(shape.width / 2), 0, Math.PI * 2);
          ctx.stroke();
        }
        break;

      case 'text':
        if (shape.x !== undefined && shape.y !== undefined && shape.content) {
          ctx.font = `600 ${shape.size || 18}px 'Caveat', cursive, sans-serif`;
          ctx.fillText(shape.content, shape.x, shape.y);
        }
        break;

      case 'math':
        // Math formula banner box on the chalkboard (for PNG export & Canvas layer)
        if (shape.x !== undefined && shape.y !== undefined) {
          ctx.save();
          // Draw subtle chalk bracket / border
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(shape.x - 10, shape.y - 25, 360, 65);

          // Formula title
          ctx.font = '500 12px sans-serif';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(`📐 ${shape.content || 'Công thức'}`, shape.x, shape.y - 8);

          // Render formatted clean math text (no raw LaTeX slashes)
          const cleanMath = formatLatexToUnicode(shape.latex || '');
          ctx.font = 'italic 600 17px "Cambria Math", "Times New Roman", serif';
          ctx.fillStyle = shape.color || '#ffffff';
          ctx.fillText(cleanMath, shape.x, shape.y + 22);
          ctx.restore();
        }
        break;

      case 'axes':
        // Môn Toán: Trục tọa độ Oxy
        if (shape.x !== undefined && shape.y !== undefined) {
          const cx = shape.x;
          const cy = shape.y;
          const w = shape.width || 280;
          const h = shape.height || 200;

          ctx.beginPath();
          // Ox
          ctx.moveTo(cx - w / 2, cy);
          ctx.lineTo(cx + w / 2, cy);
          // Oy
          ctx.moveTo(cx, cy + h / 2);
          ctx.lineTo(cx, cy - h / 2);
          ctx.stroke();

          // Arrow heads
          // Ox
          ctx.beginPath();
          ctx.moveTo(cx + w / 2, cy);
          ctx.lineTo(cx + w / 2 - 8, cy - 5);
          ctx.lineTo(cx + w / 2 - 8, cy + 5);
          ctx.closePath();
          ctx.fill();

          // Oy
          ctx.beginPath();
          ctx.moveTo(cx, cy - h / 2);
          ctx.lineTo(cx - 5, cy - h / 2 + 8);
          ctx.lineTo(cx + 5, cy - h / 2 + 8);
          ctx.closePath();
          ctx.fill();

          // Labels O, x, y
          ctx.font = 'italic bold 14px "Times New Roman", serif';
          ctx.fillText('x', cx + w / 2 + 5, cy + 4);
          ctx.fillText('y', cx - 4, cy - h / 2 - 6);
          ctx.fillText('O', cx - 14, cy + 14);

          // Tick marks
          for (let i = -3; i <= 3; i++) {
            if (i === 0) continue;
            const tx = cx + i * 35;
            const ty = cy - i * 30;
            ctx.beginPath();
            ctx.moveTo(tx, cy - 3);
            ctx.lineTo(tx, cy + 3);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(cx - 3, ty);
            ctx.lineTo(cx + 3, ty);
            ctx.stroke();
          }
        }
        break;

      case 'parabola':
        // Môn Toán: Đồ thị parabol y = ax^2
        if (shape.x !== undefined && shape.y !== undefined) {
          const cx = shape.x;
          const cy = shape.y;
          ctx.beginPath();
          for (let px = -110; px <= 110; px += 2) {
            const py = -0.012 * px * px;
            if (px === -110) {
              ctx.moveTo(cx + px, cy + py);
            } else {
              ctx.lineTo(cx + px, cy + py);
            }
          }
          ctx.stroke();
          ctx.font = 'italic 12px sans-serif';
          ctx.fillText('y = ax²', cx + 80, cy - 100);
        }
        break;

      case 'benzene':
        // Môn Hóa: Vòng Benzen 6 cạnh đều
        if (shape.x !== undefined && shape.y !== undefined) {
          const cx = shape.x;
          const cy = shape.y;
          const r = (shape.width || 80) / 2;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3 - Math.PI / 6;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();

          // Inner aromatic ring circle
          ctx.beginPath();
          ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
          ctx.stroke();

          ctx.font = 'bold 12px sans-serif';
          ctx.fillText('C₆H₆', cx - 16, cy + r + 20);
        }
        break;

      case 'resistor':
        // Môn Vật Lý: Ký hiệu Điện trở R
        if (shape.x !== undefined && shape.y !== undefined) {
          const x = shape.x;
          const y = shape.y;
          const w = shape.width || 120;
          ctx.beginPath();
          // Wire lead in
          ctx.moveTo(x, y);
          ctx.lineTo(x + 25, y);
          // Resistor body rectangle
          ctx.strokeRect(x + 25, y - 12, w - 50, 24);
          // Wire lead out
          ctx.moveTo(x + w - 25, y);
          ctx.lineTo(x + w, y);
          ctx.stroke();

          ctx.font = 'bold 13px sans-serif';
          ctx.fillText('R', x + w / 2 - 5, y - 18);
        }
        break;

      case 'capacitor':
        // Môn Vật Lý: Ký hiệu Tụ điện C
        if (shape.x !== undefined && shape.y !== undefined) {
          const x = shape.x;
          const y = shape.y;
          const w = shape.width || 80;
          ctx.beginPath();
          // Wire in
          ctx.moveTo(x, y);
          ctx.lineTo(x + w / 2 - 5, y);
          // Plate 1
          ctx.moveTo(x + w / 2 - 5, y - 20);
          ctx.lineTo(x + w / 2 - 5, y + 20);
          // Plate 2
          ctx.moveTo(x + w / 2 + 5, y - 20);
          ctx.lineTo(x + w / 2 + 5, y + 20);
          // Wire out
          ctx.moveTo(x + w / 2 + 5, y);
          ctx.lineTo(x + w, y);
          ctx.stroke();

          ctx.font = 'bold 13px sans-serif';
          ctx.fillText('C', x + w / 2 - 4, y - 26);
        }
        break;

      default:
        break;
    }

    ctx.restore();
  };

  // Helper to render textured chalk strokes
  const renderChalkStroke = (
    ctx: CanvasRenderingContext2D,
    points: StrokePoint[],
    color: string,
    size: number,
    theme: BlackboardTheme
  ) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (theme !== 'white') {
      ctx.shadowColor = color;
      ctx.shadowBlur = 1.5;
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      const midX = (points[i - 1].x + points[i].x) / 2;
      const midY = (points[i - 1].y + points[i].y) / 2;
      ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, midX, midY);
    }

    ctx.stroke();
    ctx.restore();
  };

  // Mouse & Touch interaction handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canWrite) {
      setNotification('🔒 Chế độ quan sát: Bạn chưa được Giáo viên cấp quyền phấn lên bảng. Hãy bấm "Giơ tay phát biểu"!');
      setTimeout(() => setNotification(null), 3500);
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'select') {
      // Find top-most shape clicked (reverse order)
      const clickedShape = [...shapes].reverse().find((s) => isPointInShape(x, y, s));
      if (clickedShape) {
        setSelectedShapeId(clickedShape.id);
        setIsDraggingShape(true);
        const originX =
          clickedShape.x !== undefined ? clickedShape.x : clickedShape.points?.[0]?.x || 0;
        const originY =
          clickedShape.y !== undefined ? clickedShape.y : clickedShape.points?.[0]?.y || 0;
        setDragOffset({ x: x - originX, y: y - originY });
      } else {
        setSelectedShapeId(null);
        setIsDraggingShape(false);
      }
      return;
    }

    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentPoints([{ x, y, pressure: e.pressure }]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Broadcast cursor position over LiveKit Data Channel (Unreliable / Fast mode)
    livekitService.broadcastData(
      'whiteboard_cursor',
      {
        userId: currentUser.id,
        userName: currentUser.name,
        color: currentUser.role === 'teacher' ? '#10b981' : chalkColor,
        role: currentUser.role,
        x,
        y,
        lastUpdated: Date.now(),
      },
      false
    );

    if (!canWrite) return;

    if (activeTool === 'select') {
      if (isDraggingShape && selectedShapeId && dragOffset) {
        const targetShape = shapes.find((s) => s.id === selectedShapeId);
        if (targetShape) {
          const newX = x - dragOffset.x;
          const newY = y - dragOffset.y;

          if (targetShape.points && targetShape.points.length > 0) {
            const prevOriginX = targetShape.points[0].x;
            const prevOriginY = targetShape.points[0].y;
            const dx = newX - prevOriginX;
            const dy = newY - prevOriginY;
            const updatedPoints = targetShape.points.map((p) => ({
              ...p,
              x: p.x + dx,
              y: p.y + dy,
            }));
            setShapes((prev) =>
              prev.map((s) => (s.id === selectedShapeId ? { ...s, points: updatedPoints } : s))
            );
          } else {
            setShapes((prev) =>
              prev.map((s) => (s.id === selectedShapeId ? { ...s, x: newX, y: newY } : s))
            );
          }
        }
      }
      return;
    }

    if (!isDrawing) return;

    if (activeTool === 'chalk') {
      setCurrentPoints((prev) => [...prev, { x, y, pressure: e.pressure }]);
    } else if (activeTool === 'eraser') {
      // Erase shapes near point
      const eraseRadius = 24;
      setShapes((prev) =>
        prev.filter((shape) => {
          if (shape.points) {
            return !shape.points.some(
              (p) => Math.hypot(p.x - x, p.y - y) < eraseRadius
            );
          }
          if (shape.x !== undefined && shape.y !== undefined) {
            return Math.hypot(shape.x - x, shape.y - y) >= eraseRadius * 1.5;
          }
          return true;
        })
      );
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool === 'select') {
      if (isDraggingShape && selectedShapeId) {
        setIsDraggingShape(false);
        const updated = shapes.find((s) => s.id === selectedShapeId);
        if (updated) {
          livekitService.broadcastData(
            'shape_update',
            { id: updated.id, x: updated.x, y: updated.y, points: updated.points },
            true
          );
        }
      }
      return;
    }

    if (!isDrawing || !canWrite) {
      setIsDrawing(false);
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !startPoint) {
      setIsDrawing(false);
      return;
    }

    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    let newShape: BoardShape | null = null;

    if (activeTool === 'chalk' && currentPoints.length > 1) {
      newShape = {
        id: `shape_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'freehand',
        points: currentPoints,
        color: chalkColor,
        size: chalkSize,
        authorId: currentUser.id,
        authorName: currentUser.name,
        createdAt: Date.now(),
      };
    } else if (activeTool === 'line') {
      newShape = {
        id: `line_${Date.now()}`,
        type: 'line',
        points: [startPoint, { x: endX, y: endY }],
        color: chalkColor,
        size: chalkSize,
        authorId: currentUser.id,
        authorName: currentUser.name,
        createdAt: Date.now(),
      };
    } else if (activeTool === 'arrow') {
      newShape = {
        id: `arrow_${Date.now()}`,
        type: 'arrow',
        points: [startPoint, { x: endX, y: endY }],
        color: chalkColor,
        size: chalkSize,
        authorId: currentUser.id,
        authorName: currentUser.name,
        createdAt: Date.now(),
      };
    } else if (activeTool === 'rect') {
      newShape = {
        id: `rect_${Date.now()}`,
        type: 'rect',
        x: Math.min(startPoint.x, endX),
        y: Math.min(startPoint.y, endY),
        width: Math.abs(endX - startPoint.x),
        height: Math.abs(endY - startPoint.y),
        color: chalkColor,
        size: chalkSize,
        authorId: currentUser.id,
        authorName: currentUser.name,
        createdAt: Date.now(),
      };
    } else if (activeTool === 'circle') {
      const radius = Math.hypot(endX - startPoint.x, endY - startPoint.y);
      newShape = {
        id: `circle_${Date.now()}`,
        type: 'circle',
        x: startPoint.x,
        y: startPoint.y,
        width: radius * 2,
        height: radius * 2,
        color: chalkColor,
        size: chalkSize,
        authorId: currentUser.id,
        authorName: currentUser.name,
        createdAt: Date.now(),
      };
    }

    if (newShape) {
      setShapes((prev) => [...prev, newShape!]);
      // Broadcast new shape via LiveKit Data Channel (Reliable mode)
      livekitService.broadcastData('whiteboard_draw', newShape, true);
    }

    setIsDrawing(false);
    setCurrentPoints([]);
    setStartPoint(null);
  };

  // STEM 1-Click shape inserter
  const insertStemShape = (type: BoardShape['type']) => {
    if (!canWrite) return;
    const canvas = canvasRef.current;
    const cx = canvas ? canvas.clientWidth / 2 : 400;
    const cy = canvas ? canvas.clientHeight / 2 : 300;

    const shape: BoardShape = {
      id: `${type}_${Date.now()}`,
      type,
      x: cx,
      y: cy,
      width: type === 'axes' ? 320 : type === 'benzene' ? 100 : 140,
      height: type === 'axes' ? 220 : type === 'benzene' ? 100 : 40,
      color: chalkColor,
      size: chalkSize,
      authorId: currentUser.id,
      authorName: currentUser.name,
      createdAt: Date.now(),
    };

    setShapes((prev) => [...prev, shape]);
    setSelectedShapeId(shape.id);
    setActiveTool('select');
    setNotification('✨ Đã chèn! Bạn có thể nhấn giữ và kéo rê để đặt vào vị trí mong muốn.');
    setTimeout(() => setNotification(null), 4000);
    livekitService.broadcastData('whiteboard_draw', shape, true);
  };

  // Insert LaTeX Formula
  const handleInsertFormula = (latex: string, title: string) => {
    if (!canWrite) return;
    const canvas = canvasRef.current;
    const cx = canvas ? canvas.clientWidth / 2 - 100 : 350;
    const cy = canvas ? canvas.clientHeight / 2 : 250;

    const shape: BoardShape = {
      id: `math_${Date.now()}`,
      type: 'math',
      x: cx,
      y: cy,
      latex,
      content: title,
      color: chalkColor,
      size: 16,
      authorId: currentUser.id,
      authorName: currentUser.name,
      createdAt: Date.now(),
    };

    setShapes((prev) => [...prev, shape]);
    setSelectedShapeId(shape.id);
    setActiveTool('select');
    setNotification('✨ Đã chèn công thức! Bạn có thể nhấn giữ và kéo rê để đặt vào vị trí mong muốn.');
    setTimeout(() => setNotification(null), 4000);
    livekitService.broadcastData('whiteboard_draw', shape, true);
  };

  // Insert Periodic Element
  const handleInsertElement = (el: PeriodicElement) => {
    if (!canWrite) return;
    const canvas = canvasRef.current;
    const cx = canvas ? canvas.clientWidth / 2 : 350;
    const cy = canvas ? canvas.clientHeight / 2 : 250;

    const shape: BoardShape = {
      id: `elem_${Date.now()}`,
      type: 'text',
      x: cx,
      y: cy,
      content: `[${el.number}] ${el.symbol} - ${el.name} (M=${el.mass.toFixed(1)})`,
      color: chalkColor,
      size: 20,
      authorId: currentUser.id,
      authorName: currentUser.name,
      createdAt: Date.now(),
    };

    setShapes((prev) => [...prev, shape]);
    setSelectedShapeId(shape.id);
    setActiveTool('select');
    setNotification('✨ Đã chèn nguyên tố! Bạn có thể nhấn giữ và kéo rê để đặt vào vị trí mong muốn.');
    setTimeout(() => setNotification(null), 4000);
    livekitService.broadcastData('whiteboard_draw', shape, true);
  };

  // Teacher Clears Board
  const handleClearBoardAction = () => {
    if (currentUser.role !== 'teacher') return;
    setShapes([]);
    livekitService.broadcastData('whiteboard_clear', { timestamp: Date.now() }, true);
    onClearBoard();
  };

  // Export board as high-res PNG
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `BangXanh_${subject.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full flex flex-col overflow-hidden bg-slate-950 select-none"
    >
      {/* Upper Status Notification / Permissions Notice */}
      {notification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-slate-900/90 border border-emerald-500/50 text-emerald-300 text-sm shadow-xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Granted Permission Badge when called to board */}
      {currentUser.role === 'student' && currentUser.canDraw && (
        <div className="absolute top-4 left-6 z-30 flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs sm:text-sm shadow-xl backdrop-blur-md animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>🎉 <strong>Bạn đang được gọi lên bảng!</strong> Hãy chọn phấn để làm bài.</span>
        </div>
      )}

      {/* Top-Right Collapsible Floating Control Bar (Màu bảng, Lưới tọa độ, Lưu bảng) */}
      <div className="absolute top-4 right-6 z-30 flex flex-col items-end">
        {/* Toggle Button */}
        <button
          onClick={() => setIsTopBarOpen(!isTopBarOpen)}
          title="Tùy chỉnh giao diện bảng & lưu bảng"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 shadow-xl backdrop-blur-md transition cursor-pointer"
        >
          <Palette className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tùy chỉnh bảng</span>
          {isTopBarOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {/* Dropdown panel when opened */}
        {isTopBarOpen && (
          <div className="mt-2 flex flex-wrap items-center gap-2 bg-slate-900/95 backdrop-blur-md p-2 rounded-2xl border border-slate-700 shadow-2xl animate-in fade-in slide-in-from-top-2">
            {/* Board Background Selector */}
            <div className="flex items-center bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
              <button
                title="Bảng xanh truyền thống"
                onClick={() => setBoardTheme('green')}
                className={`w-6 h-6 rounded-lg transition border ${
                  boardTheme === 'green'
                    ? 'bg-[#163b2c] border-emerald-400 scale-105'
                    : 'bg-[#163b2c]/60 border-transparent hover:scale-105'
                }`}
              />
              <button
                title="Bảng đen cổ điển"
                onClick={() => setBoardTheme('dark')}
                className={`w-6 h-6 rounded-lg ml-1.5 transition border ${
                  boardTheme === 'dark'
                    ? 'bg-slate-900 border-slate-300 scale-105'
                    : 'bg-slate-900/60 border-transparent hover:scale-105'
                }`}
              />
              <button
                title="Bảng trắng hiện đại"
                onClick={() => setBoardTheme('white')}
                className={`w-6 h-6 rounded-lg ml-1.5 transition border ${
                  boardTheme === 'white'
                    ? 'bg-white border-blue-500 scale-105'
                    : 'bg-white/70 border-transparent hover:scale-105'
                }`}
              />
            </div>

            {/* Grid Selector */}
            <div className="flex items-center gap-1 bg-slate-950/60 px-2 py-1 rounded-xl border border-slate-800/80 text-xs text-slate-300">
              <Grid className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={gridType}
                onChange={(e) => setGridType(e.target.value as GridType)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="grid-notebook" className="bg-slate-900 text-slate-200">Ô ly học sinh</option>
                <option value="grid-cartesian" className="bg-slate-900 text-slate-200">Lưới tọa độ Oxy</option>
                <option value="grid-millimeter" className="bg-slate-900 text-slate-200">Lưới milimet</option>
                <option value="none" className="bg-slate-900 text-slate-200">Bảng trơn</option>
              </select>
            </div>

            {/* Teacher Actions */}
            {currentUser.role === 'teacher' && (
              <button
                onClick={handleClearBoardAction}
                title="Xóa sạch bảng"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xóa bảng</span>
              </button>
            )}

            {/* Export Board */}
            <button
              onClick={handleExportPNG}
              title="Xuất bảng ảnh PNG 1080p sắc nét"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lưu bảng</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Interactive Chalkboard Canvas */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Rendered KaTeX Math Formulas Overlay with Drag & Drop */}
        {shapes
          .filter((s) => s.type === 'math' && s.x !== undefined && s.y !== undefined)
          .map((shape) => {
            const isSelected = selectedShapeId === shape.id;
            const renderedHtml = renderKaTeXHtml(shape.latex || '');

            return (
              <div
                key={shape.id}
                onPointerDown={(e) => {
                  if (!canWrite) return;
                  e.stopPropagation();
                  setSelectedShapeId(shape.id);
                  setActiveTool('select');
                  setIsDraggingShape(true);
                  const containerRect = containerRef.current?.getBoundingClientRect();
                  const curX = shape.x || 0;
                  const curY = shape.y || 0;
                  if (containerRect) {
                    setDragOffset({
                      x: e.clientX - containerRect.left - curX,
                      y: e.clientY - containerRect.top - curY,
                    });
                  }
                }}
                style={{
                  position: 'absolute',
                  left: `${shape.x}px`,
                  top: `${shape.y}px`,
                  zIndex: 20,
                }}
                className={`group cursor-${canWrite ? 'move' : 'default'} p-2.5 rounded-2xl transition shadow-xl select-none backdrop-blur-md ${
                  isSelected
                    ? 'bg-slate-900/95 border-2 border-sky-400 ring-2 ring-sky-400/30'
                    : 'bg-slate-950/80 border border-slate-700/70 hover:border-slate-500'
                }`}
              >
                {/* Title badge */}
                <div className="flex items-center justify-between gap-3 mb-1 text-[11px] font-semibold text-emerald-400 border-b border-slate-800/80 pb-1">
                  <span>📐 {shape.content || 'Công thức'}</span>
                  {isSelected && (
                    <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded border border-sky-500/30 font-sans">
                      ✥ Kéo để di chuyển
                    </span>
                  )}
                </div>

                {/* KaTeX mathematical typesetting */}
                <div
                  className="katex-math-render text-slate-100 text-base sm:text-lg leading-relaxed flex items-center justify-center min-w-[180px] max-w-xl overflow-x-auto py-0.5"
                  style={{ color: shape.color || '#ffffff' }}
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              </div>
            );
          })}

        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`w-full h-full touch-none ${
            canWrite
              ? activeTool === 'eraser'
                ? 'cursor-cell'
                : 'cursor-crosshair'
              : 'cursor-default'
          }`}
        />

        {/* Traditional Chalkboard Wooden & Aluminum Frame Borders */}
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-b from-stone-600 to-stone-800 pointer-events-none opacity-80" />
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-stone-600 to-stone-800 pointer-events-none opacity-80" />
        <div className="absolute inset-y-0 right-0 w-1.5 bg-gradient-to-l from-stone-600 to-stone-800 pointer-events-none opacity-80" />
        <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-t from-stone-500 to-stone-700 pointer-events-none border-t border-stone-400" />
      </div>

      {/* Floating Toggle Button to Expand / Collapse Whiteboard Tools */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/90 text-[11px] font-medium text-slate-300 hover:text-white shadow-xl backdrop-blur-md transition-all duration-200 cursor-pointer"
        >
          {isToolbarCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hiện thanh công cụ (Khay phấn)</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Thu gọn công cụ (Mở rộng toàn màn hình)</span>
            </>
          )}
        </button>
      </div>

      {/* Bottom Chalk Tray & Floating Tool Panel (Khay đựng phấn & Thanh công cụ) */}
      <div
        className={`absolute bottom-9 left-1/2 -translate-x-1/2 z-30 max-w-[95vw] overflow-x-auto flex items-center gap-2.5 bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-700 shadow-2xl transition-all duration-300 transform ${
          isToolbarCollapsed ? 'translate-y-28 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
      >
        {/* Basic Drawing Tools */}
        <div className="flex items-center gap-1 border-r border-slate-800 pr-2.5">
          {/* Nút Chọn & Di chuyển (Select & Move) */}
          <button
            onClick={() => setActiveTool('select')}
            disabled={!canWrite}
            title="Công cụ Chọn & Di chuyển (Kéo công thức, hình vẽ, đồ thị đến vị trí mong muốn)"
            className={`p-2 rounded-xl transition flex items-center gap-1 text-xs font-semibold ${
              activeTool === 'select'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-900/40 ring-1 ring-sky-300'
                : 'text-slate-300 hover:bg-slate-800 disabled:opacity-40'
            }`}
          >
            <Move className="w-4 h-4" />
            <span className="hidden xl:inline">Di chuyển</span>
          </button>

          <button
            onClick={() => setActiveTool('chalk')}
            disabled={!canWrite}
            title="Bút phấn viết tự do"
            className={`p-2 rounded-xl transition ${
              activeTool === 'chalk'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-300 hover:bg-slate-800 disabled:opacity-40'
            }`}
          >
            <PenTool className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool('eraser')}
            disabled={!canWrite}
            title="Khăn lau bảng / Tẩy phấn"
            className={`p-2 rounded-xl transition ${
              activeTool === 'eraser'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30'
                : 'text-slate-300 hover:bg-slate-800 disabled:opacity-40'
            }`}
          >
            <Eraser className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool('line')}
            disabled={!canWrite}
            title="Đường thẳng (Thước kẻ)"
            className={`p-2 rounded-xl transition ${
              activeTool === 'line'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 disabled:opacity-40'
            }`}
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool('arrow')}
            disabled={!canWrite}
            title="Vector / Tia mũi tên"
            className={`p-2 rounded-xl transition ${
              activeTool === 'arrow'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 disabled:opacity-40'
            }`}
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool('circle')}
            disabled={!canWrite}
            title="Đường tròn (Compa)"
            className={`p-2 rounded-xl transition ${
              activeTool === 'circle'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 disabled:opacity-40'
            }`}
          >
            <Circle className="w-4 h-4" />
          </button>
        </div>

        {/* Chalk Palette: Phấn viết bảng */}
        <div className="flex items-center gap-1.5 border-r border-slate-800 pr-2.5">
          {CHALK_COLORS.map((c) => (
            <button
              key={c.color}
              title={c.name}
              disabled={!canWrite}
              onClick={() => {
                setChalkColor(c.color);
                setActiveTool('chalk');
              }}
              className={`w-6 h-6 rounded-full transition-transform border-2 ${
                chalkColor === c.color && activeTool === 'chalk'
                  ? 'scale-125 border-white shadow-md'
                  : 'border-transparent hover:scale-110 disabled:opacity-40'
              }`}
              style={{ backgroundColor: c.color }}
            />
          ))}
        </div>

        {/* Chalk Thickness */}
        <div className="flex items-center gap-1 border-r border-slate-800 pr-2.5">
          {[2, 4, 8].map((size) => (
            <button
              key={size}
              disabled={!canWrite}
              onClick={() => setChalkSize(size)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition text-xs font-bold ${
                chalkSize === size
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:bg-slate-800 disabled:opacity-40'
              }`}
            >
              <div
                className="rounded-full bg-slate-200"
                style={{ width: size * 1.5, height: size * 1.5 }}
              />
            </button>
          ))}
        </div>

        {/* Specialized Subject Toolkits */}
        <div className="flex items-center gap-1.5">
          {subject === 'math' && (
            <>
              <button
                onClick={() => insertStemShape('axes')}
                disabled={!canWrite}
                title="Chèn Hệ trục tọa độ Oxy"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 text-xs font-medium transition disabled:opacity-40"
              >
                <span>Hệ Oxy</span>
              </button>
              <button
                onClick={() => insertStemShape('parabola')}
                disabled={!canWrite}
                title="Chèn Parabol y = ax²"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 text-xs font-medium transition disabled:opacity-40"
              >
                <span>Parabol</span>
              </button>
              <button
                onClick={() => setIsMathModalOpen(true)}
                disabled={!canWrite}
                title="Soạn thảo công thức Toán học KaTeX"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow-md shadow-emerald-900/30 disabled:opacity-40"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Gõ LaTeX</span>
              </button>
            </>
          )}

          {subject === 'physics' && (
            <>
              <button
                onClick={() => insertStemShape('resistor')}
                disabled={!canWrite}
                title="Chèn Điện trở R"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs font-medium transition disabled:opacity-40"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Điện trở R</span>
              </button>
              <button
                onClick={() => insertStemShape('capacitor')}
                disabled={!canWrite}
                title="Chèn Tụ điện C"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs font-medium transition disabled:opacity-40"
              >
                <span>Tụ điện C</span>
              </button>
              <button
                onClick={() => setIsMathModalOpen(true)}
                disabled={!canWrite}
                title="Công thức Vật Lý"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow-md shadow-emerald-900/30 disabled:opacity-40"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Công thức Lý</span>
              </button>
            </>
          )}

          {subject === 'chemistry' && (
            <>
              <button
                onClick={() => insertStemShape('benzene')}
                disabled={!canWrite}
                title="Chèn Vòng Benzen C6H6"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 text-xs font-medium transition disabled:opacity-40"
              >
                <span>Vòng Benzen</span>
              </button>
              <button
                onClick={() => setIsChemModalOpen(true)}
                disabled={!canWrite}
                title="Tra cứu Bảng tuần hoàn nguyên tố"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition shadow-md shadow-cyan-900/30 disabled:opacity-40"
              >
                <Atom className="w-3.5 h-3.5" />
                <span>Bảng tuần hoàn</span>
              </button>
              <button
                onClick={() => setIsMathModalOpen(true)}
                disabled={!canWrite}
                title="Phương trình phản ứng Hóa học"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow-md shadow-emerald-900/30 disabled:opacity-40"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Phản ứng Hóa</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* LaTeX Formula Dialog */}
      <MathFormulaDialog
        isOpen={isMathModalOpen}
        onClose={() => setIsMathModalOpen(false)}
        onInsertFormula={handleInsertFormula}
        subject={subject}
      />

      {/* Periodic Table Dialog */}
      <PeriodicTableDialog
        isOpen={isChemModalOpen}
        onClose={() => setIsChemModalOpen(false)}
        onInsertElement={handleInsertElement}
      />
    </div>
  );
};
