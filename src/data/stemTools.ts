import { MathFormulaItem, PhysicsComponentItem, ChemItem } from '../types';

export const MATH_FORMULAS: MathFormulaItem[] = [
  {
    id: 'quad_eq',
    title: 'Phương trình bậc 2',
    latex: 'ax^2 + bx + c = 0 \\implies x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
    category: 'algebra',
  },
  {
    id: 'integral_def',
    title: 'Tích phân Newton-Leibniz',
    latex: '\\int_{a}^{b} f(x)\\,dx = F(b) - F(a)',
    category: 'calculus',
  },
  {
    id: 'derivative_quotient',
    title: 'Đạo hàm phân thức',
    latex: '\\left(\\frac{u}{v}\\right)\' = \\frac{u\'v - uv\'}{v^2}',
    category: 'calculus',
  },
  {
    id: 'trig_pythagoras',
    title: 'Hằng đẳng thức lượng giác',
    latex: '\\sin^2(x) + \\cos^2(x) = 1, \\quad 1 + \\tan^2(x) = \\frac{1}{\\cos^2(x)}',
    category: 'trigonometry',
  },
  {
    id: 'eulers_formula',
    title: 'Công thức Euler',
    latex: 'e^{i\\pi} + 1 = 0 \\quad \\text{hoặc} \\quad e^{ix} = \\cos x + i\\sin x',
    category: 'algebra',
  },
  {
    id: 'volume_cone',
    title: 'Thể tích khối nón',
    latex: 'V = \\frac{1}{3}\\pi r^2 h, \\quad S_{xq} = \\pi r l',
    category: 'geometry',
  },
  {
    id: 'vector_dot',
    title: 'Tích vô hướng 2 vector',
    latex: '\\vec{u} \\cdot \\vec{v} = |\\vec{u}| \\cdot |\\vec{v}| \\cdot \\cos(\\vec{u}, \\vec{v})',
    category: 'geometry',
  },
];

export const PHYSICS_COMPONENTS: PhysicsComponentItem[] = [
  {
    id: 'resistor',
    title: 'Điện trở R',
    iconName: 'resistor',
    type: 'resistor',
    description: 'Đoản mạch, định luật Ohm U = I.R',
  },
  {
    id: 'capacitor',
    title: 'Tụ điện C',
    iconName: 'capacitor',
    type: 'capacitor',
    description: 'Tích trữ điện tích q = C.U',
  },
  {
    id: 'inductor',
    title: 'Cuộn cảm L',
    iconName: 'inductor',
    type: 'inductor',
    description: 'Hiện tượng tự cảm e_tc = -L(di/dt)',
  },
  {
    id: 'battery',
    title: 'Nguồn điện 1 chiều (Pin)',
    iconName: 'battery',
    type: 'battery',
    description: 'Suất điện động E và điện trở trong r',
  },
  {
    id: 'ac_source',
    title: 'Nguồn điện xoay chiều (~)',
    iconName: 'ac_source',
    type: 'ac_source',
    description: 'u = U0.cos(ωt + φ)',
  },
  {
    id: 'lamp',
    title: 'Bóng đèn',
    iconName: 'lamp',
    type: 'lamp',
    description: 'Chỉ thị dòng điện tải tiêu thụ',
  },
  {
    id: 'force_vector',
    title: 'Hệ vector lực (F, P, N, Fms)',
    iconName: 'force_vector',
    type: 'force_vector',
    description: 'Định luật II Newton ΣF = m.a',
  },
  {
    id: 'lens',
    title: 'Thấu kính hội tụ / phân kỳ',
    iconName: 'lens',
    type: 'lens',
    description: 'Công thức thấu kính 1/f = 1/d + 1/d\'',
  },
];

export const CHEM_ITEMS: ChemItem[] = [
  {
    id: 'benzene',
    title: 'Vòng Benzen',
    formula: 'C6H6',
    type: 'benzene',
    description: 'Nhân thơm 6 cạnh đều với liên kết liên hợp',
  },
  {
    id: 'bond_single',
    title: 'Liên kết đơn (—)',
    formula: '—',
    type: 'bond_single',
    description: 'Liên kết σ bền vững (Alkane, alcohol)',
  },
  {
    id: 'bond_double',
    title: 'Liên kết đôi (=)',
    formula: '=',
    type: 'bond_double',
    description: 'Gồm 1 liên kết σ và 1 liên kết π (Alkene)',
  },
  {
    id: 'bond_triple',
    title: 'Liên kết ba (≡)',
    formula: '≡',
    type: 'bond_triple',
    description: 'Gồm 1 liên kết σ và 2 liên kết π (Alkyne)',
  },
  {
    id: 'hydroxyl',
    title: 'Nhóm chức Hydroxyl (-OH)',
    formula: '-OH',
    type: 'hydroxyl',
    description: 'Nhóm định chức Ancol, Phenol',
  },
  {
    id: 'carboxyl',
    title: 'Nhóm chức Carboxyl (-COOH)',
    formula: '-COOH',
    type: 'carboxyl',
    description: 'Axit cacboxylic, phản ứng este hóa',
  },
  {
    id: 'test_tube',
    title: 'Ống nghiệm phản ứng',
    formula: '[Thí nghiệm]',
    type: 'test_tube',
    description: 'Dụng cụ chứa dung dịch thử màu, kết tủa',
  },
  {
    id: 'flask',
    title: 'Bình nón Erlenmeyer',
    formula: '[Chuẩn độ]',
    type: 'flask',
    description: 'Dụng cụ pha chế và chuẩn độ axit-bazo',
  },
];

export interface PeriodicElement {
  number: number;
  symbol: string;
  name: string;
  mass: number;
  category: string;
  electronegativity: number;
}

export const QUICK_PERIODIC_ELEMENTS: PeriodicElement[] = [
  { number: 1, symbol: 'H', name: 'Hydrogen', mass: 1.008, category: 'Phi kim', electronegativity: 2.20 },
  { number: 2, symbol: 'He', name: 'Helium', mass: 4.0026, category: 'Khí hiếm', electronegativity: 0 },
  { number: 6, symbol: 'C', name: 'Carbon', mass: 12.011, category: 'Phi kim', electronegativity: 2.55 },
  { number: 7, symbol: 'N', name: 'Nitrogen', mass: 14.007, category: 'Phi kim', electronegativity: 3.04 },
  { number: 8, symbol: 'O', name: 'Oxygen', mass: 15.999, category: 'Phi kim', electronegativity: 3.44 },
  { number: 11, symbol: 'Na', name: 'Natri', mass: 22.990, category: 'Kim loại kiềm', electronegativity: 0.93 },
  { number: 12, symbol: 'Mg', name: 'Magie', mass: 24.305, category: 'Kim loại kiềm thổ', electronegativity: 1.31 },
  { number: 13, symbol: 'Al', name: 'Nhôm', mass: 26.982, category: 'Kim loại', electronegativity: 1.61 },
  { number: 16, symbol: 'S', name: 'Lưu huỳnh', mass: 32.06, category: 'Phi kim', electronegativity: 2.58 },
  { number: 17, symbol: 'Cl', name: 'Clo', mass: 35.45, category: 'Halogen', electronegativity: 3.16 },
  { number: 19, symbol: 'K', name: 'Kali', mass: 39.098, category: 'Kim loại kiềm', electronegativity: 0.82 },
  { number: 20, symbol: 'Ca', name: 'Canxi', mass: 40.078, category: 'Kim loại kiềm thổ', electronegativity: 1.00 },
  { number: 26, symbol: 'Fe', name: 'Sắt', mass: 55.845, category: 'Kim loại chuyển tiếp', electronegativity: 1.83 },
  { number: 29, symbol: 'Cu', name: 'Đồng', mass: 63.546, category: 'Kim loại chuyển tiếp', electronegativity: 1.90 },
  { number: 30, symbol: 'Zn', name: 'Kẽm', mass: 65.38, category: 'Kim loại chuyển tiếp', electronegativity: 1.65 },
  { number: 35, symbol: 'Br', name: 'Brom', mass: 79.904, category: 'Halogen', electronegativity: 2.96 },
  { number: 47, symbol: 'Ag', name: 'Bạc', mass: 107.87, category: 'Kim loại chuyển tiếp', electronegativity: 1.93 },
  { number: 56, symbol: 'Ba', name: 'Bari', mass: 137.33, category: 'Kim loại kiềm thổ', electronegativity: 0.89 },
];
