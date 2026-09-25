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
    id: 'by_parts',
    title: 'Tích phân từng phần',
    latex: '\\int u\\,dv = u\\cdot v - \\int v\\,du',
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

export const PHYSICS_FORMULAS: MathFormulaItem[] = [
  {
    id: 'rlc_impedance',
    title: 'Tổng trở mạch RLC nối tiếp',
    latex: 'Z = \\sqrt{R^2 + (Z_L - Z_C)^2}, \\quad \\tan\\varphi = \\frac{Z_L - Z_C}{R}',
    category: 'calculus',
  },
  {
    id: 'ohms_law',
    title: 'Định luật Ohm & Công suất',
    latex: 'I = \\frac{U}{R}, \\quad P = U \\cdot I = I^2 \\cdot R = \\frac{U^2}{R}',
    category: 'algebra',
  },
  {
    id: 'harmonic_oscillation',
    title: 'Phương trình dao động điều hòa',
    latex: 'x = A\\cos(\\omega t + \\varphi), \\quad v = -\\omega A\\sin(\\omega t + \\varphi), \\quad a = -\\omega^2 x',
    category: 'calculus',
  },
  {
    id: 'newtons_second_law',
    title: 'Định luật II Newton',
    latex: '\\sum \\vec{F} = m \\cdot \\vec{a}, \\quad \\vec{F}_{dh} = -k\\vec{x}',
    category: 'geometry',
  },
  {
    id: 'mechanical_energy',
    title: 'Bảo toàn cơ năng',
    latex: 'W = W_d + W_t = \\frac{1}{2}mv^2 + mgh = \\text{hằng số}',
    category: 'algebra',
  },
  {
    id: 'standing_wave',
    title: 'Điều kiện sóng dừng (2 đầu cố định)',
    latex: '\\ell = k\\frac{\\lambda}{2} = k\\frac{v}{2f} \\quad (k \\in \\mathbb{N}^*)',
    category: 'trigonometry',
  },
  {
    id: 'photoelectric_effect',
    title: 'Hệ thức Anhxtanh về quang điện',
    latex: '\\varepsilon = hf = \\frac{hc}{\\lambda} = A + \\frac{1}{2}m v_{0\\max}^2',
    category: 'algebra',
  },
  {
    id: 'nuclear_decay',
    title: 'Định luật phóng xạ hạt nhân',
    latex: 'N(t) = N_0 \\cdot 2^{-\\frac{t}{T}} = N_0 \\cdot e^{-\\lambda t}',
    category: 'calculus',
  },
];

export const CHEM_FORMULAS: MathFormulaItem[] = [
  {
    id: 'esterification',
    title: 'Phản ứng Este hóa',
    latex: 'RCOOH + R\'OH \\overset{H_2SO_4, t^\\circ}{\\rightleftharpoons} RCOOR\' + H_2O',
    category: 'algebra',
  },
  {
    id: 'fermentation',
    title: 'Lên men glucozo thành ancol',
    latex: 'C_6H_{12}O_6 \\xrightarrow{\\text{men, } 30-35^\\circ C} 2C_2H_5OH + 2CO_2\\uparrow',
    category: 'algebra',
  },
  {
    id: 'silver_mirror',
    title: 'Phản ứng tráng bạc (Anđehit)',
    latex: 'RCHO + 2[Ag(NH_3)_2]OH \\xrightarrow{t^\\circ} RCOONH_4 + 2Ag\\downarrow + 3NH_3 + H_2O',
    category: 'algebra',
  },
  {
    id: 'alkene_bromine',
    title: 'Phản ứng cộng Brom làm mất màu',
    latex: 'CH_2=CH_2 + Br_2 \\longrightarrow CH_2Br-CH_2Br',
    category: 'algebra',
  },
  {
    id: 'copper_nitric',
    title: 'Oxi hóa - khử (Cu + HNO3 loãng)',
    latex: '3Cu + 8HNO_3 \\longrightarrow 3Cu(NO_3)_2 + 2NO\\uparrow + 4H_2O',
    category: 'algebra',
  },
  {
    id: 'equilibrium_lechatelier',
    title: 'Tổng hợp Amoniac (Haber)',
    latex: 'N_2(k) + 3H_2(k) \\overset{Fe, t^\\circ, p}{\\rightleftharpoons} 2NH_3(k) \\quad (\\Delta H < 0)',
    category: 'algebra',
  },
  {
    id: 'ph_formula',
    title: 'Nồng độ pH & Tích số ion nước',
    latex: '\\text{pH} = -\\log[H^+], \\quad [H^+][OH^-] = 10^{-14} \\text{ (ở } 25^\\circ\\text{C)}',
    category: 'calculus',
  },
  {
    id: 'ideal_gas',
    title: 'Phương trình Clapeyron - Mendeleev',
    latex: 'P \\cdot V = n \\cdot R \\cdot T, \\quad R \\approx 0.082 \\text{ atm.l/mol.K}',
    category: 'algebra',
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
