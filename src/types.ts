/**
 * Types and interfaces for the LiveKit STEM Online Classroom
 */

export type SubjectType = 'math' | 'physics' | 'chemistry';

export type UserRole = 'teacher' | 'student';

export type BlackboardTheme = 'green' | 'dark' | 'white';

export type GridType = 'grid-notebook' | 'grid-cartesian' | 'grid-millimeter' | 'none';

export interface Participant {
  id: string;
  name: string;
  role: UserRole;
  avatarColor: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isHandRaised: boolean;
  canDraw: boolean; // Granted by teacher to write on the board
  isSpeaking: boolean;
  cameraStreamQuality: '1080p' | '720p' | '360p';
}

export interface ChalkStyle {
  color: string;
  name: string;
  size: number;
}

export interface StrokePoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface BoardShape {
  id: string;
  type:
    | 'freehand'
    | 'line'
    | 'arrow'
    | 'rect'
    | 'circle'
    | 'math'
    | 'chem'
    | 'physics'
    | 'axes'
    | 'parabola'
    | 'benzene'
    | 'resistor'
    | 'capacitor'
    | 'text';
  points?: StrokePoint[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color: string;
  size: number;
  content?: string;
  latex?: string;
  authorId: string;
  authorName: string;
  createdAt: number;
}

export interface BoardCursor {
  userId: string;
  userName: string;
  color: string;
  x: number;
  y: number;
  role: UserRole;
  lastUpdated: number;
}

export interface LiveKitTokenResponse {
  success: boolean;
  token: string;
  serverUrl: string;
  identity: string;
  participantName: string;
  role: UserRole;
  roomName: string;
  error?: string;
}

export interface MathFormulaItem {
  id: string;
  title: string;
  latex: string;
  category: 'algebra' | 'calculus' | 'geometry' | 'trigonometry';
}

export interface PhysicsComponentItem {
  id: string;
  title: string;
  iconName: string;
  type: 'resistor' | 'capacitor' | 'inductor' | 'battery' | 'lamp' | 'ac_source' | 'force_vector' | 'lens';
  description: string;
}

export interface ChemItem {
  id: string;
  title: string;
  formula: string;
  type: 'benzene' | 'bond_single' | 'bond_double' | 'bond_triple' | 'hydroxyl' | 'carboxyl' | 'flask' | 'test_tube';
  description: string;
}

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  avatarColor: string;
  createdAt?: string;
}

export interface ClassroomRoom {
  id: string;
  code: string;
  name: string;
  subject: SubjectType;
  teacherId: string;
  teacherName?: string;
  status: 'open' | 'closed';
  assignedStudentIds: string[];
  assignedStudents?: UserAccount[];
  description?: string;
  createdAt: string;
  closedAt?: string;
}

export type AppViewMode = 'classroom' | 'admin_dashboard' | 'student_portal' | 'login';
