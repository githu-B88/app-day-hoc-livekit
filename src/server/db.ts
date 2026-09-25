import fs from 'fs';
import path from 'path';

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  password: string; // Mật khẩu hoặc mã PIN
  role: 'teacher' | 'student';
  avatarColor: string;
  createdAt: string;
}

export interface ClassroomRoom {
  id: string;
  code: string;
  name: string;
  subject: 'math' | 'physics' | 'chemistry';
  teacherId: string;
  status: 'open' | 'closed';
  assignedStudentIds: string[];
  description?: string;
  createdAt: string;
  closedAt?: string;
}

export interface DatabaseSchema {
  users: UserAccount[];
  rooms: ClassroomRoom[];
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'classroom_db.json');

// Dữ liệu mẫu khởi tạo ban đầu
const initialData: DatabaseSchema = {
  users: [
    {
      id: 'teacher_1',
      name: 'Thầy Nguyễn Minh',
      username: 'thayminh',
      password: '123456',
      role: 'teacher',
      avatarColor: 'from-amber-500 to-orange-600',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'student_1',
      name: 'Nguyễn Văn An',
      username: 'vanan',
      password: '123456',
      role: 'student',
      avatarColor: 'from-blue-500 to-cyan-500',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'student_2',
      name: 'Trần Thị Mai',
      username: 'thimai',
      password: '123456',
      role: 'student',
      avatarColor: 'from-pink-500 to-rose-500',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'student_3',
      name: 'Lê Hoàng',
      username: 'lehoang',
      password: '123456',
      role: 'student',
      avatarColor: 'from-emerald-500 to-teal-500',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'student_4',
      name: 'Phạm Quỳnh Anh',
      username: 'quynhanh',
      password: '123456',
      role: 'student',
      avatarColor: 'from-violet-500 to-purple-500',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'student_5',
      name: 'Vũ Minh Trí',
      username: 'minhtri',
      password: '123456',
      role: 'student',
      avatarColor: 'from-amber-500 to-yellow-500',
      createdAt: new Date().toISOString(),
    },
  ],
  rooms: [
    {
      id: 'room_math_12',
      code: 'TOAN12-CHUYENDE',
      name: 'Chuyên đề Khảo Sát Hàm Số & Tích Phân 12',
      subject: 'math',
      teacherId: 'teacher_1',
      status: 'open',
      assignedStudentIds: ['student_1', 'student_2', 'student_3'],
      description: 'Lớp ôn thi Tích phân từng phần và bài toán thực tế',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'room_phys_11',
      code: 'VATLY-RLC',
      name: 'Luyện Thi Dao Động Cơ & Mạch RLC Nâng Cao',
      subject: 'physics',
      teacherId: 'teacher_1',
      status: 'closed',
      assignedStudentIds: ['student_1', 'student_4', 'student_5'],
      description: 'Phương pháp giản đồ vectơ và linh kiện xoay chiều',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'room_chem_10',
      code: 'HOAHOC-BENZEN',
      name: 'Hóa Hữu Cơ: Vòng Benzen & Dẫn Xuất Thơm',
      subject: 'chemistry',
      teacherId: 'teacher_1',
      status: 'closed',
      assignedStudentIds: ['student_2', 'student_3', 'student_5'],
      description: 'Cơ chế thế electrophil vòng thơm & đồng đẳng benzen',
      createdAt: new Date().toISOString(),
    },
  ],
};

function ensureDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Lỗi khi đọc file DB, khởi tạo mặc định:', err);
    return initialData;
  }
}

function writeDb(data: DatabaseSchema) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Lỗi khi ghi file DB:', err);
  }
}

export const db = {
  // Users
  getUsers(): UserAccount[] {
    const data = ensureDb();
    return data.users;
  },

  getStudents(): UserAccount[] {
    const data = ensureDb();
    return data.users.filter((u) => u.role === 'student');
  },

  findUserByUsername(username: string): UserAccount | undefined {
    const data = ensureDb();
    return data.users.find(
      (u) => u.username.toLowerCase().trim() === username.toLowerCase().trim()
    );
  },

  findUserById(id: string): UserAccount | undefined {
    const data = ensureDb();
    return data.users.find((u) => u.id === id);
  },

  createStudent(name: string, username: string, password: string): UserAccount {
    const data = ensureDb();
    const existing = data.users.find(
      (u) => u.username.toLowerCase().trim() === username.toLowerCase().trim()
    );
    if (existing) {
      throw new Error(`Tên đăng nhập "${username}" đã tồn tại! Vui lòng chọn tên khác.`);
    }

    const colors = [
      'from-blue-500 to-cyan-500',
      'from-pink-500 to-rose-500',
      'from-emerald-500 to-teal-500',
      'from-violet-500 to-purple-500',
      'from-amber-500 to-yellow-500',
      'from-indigo-500 to-blue-600',
    ];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const newStudent: UserAccount = {
      id: `student_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      username: username.trim(),
      password: password.trim(),
      role: 'student',
      avatarColor,
      createdAt: new Date().toISOString(),
    };

    data.users.push(newStudent);
    writeDb(data);
    return newStudent;
  },

  deleteStudent(id: string): boolean {
    const data = ensureDb();
    const initialLen = data.users.length;
    data.users = data.users.filter((u) => u.id !== id || u.role !== 'student');
    if (data.users.length < initialLen) {
      // Remove student from any rooms
      data.rooms.forEach((r) => {
        r.assignedStudentIds = r.assignedStudentIds.filter((sid) => sid !== id);
      });
      writeDb(data);
      return true;
    }
    return false;
  },

  updateStudent(id: string, updates: Partial<Pick<UserAccount, 'name' | 'password'>>): UserAccount | null {
    const data = ensureDb();
    const student = data.users.find((u) => u.id === id && u.role === 'student');
    if (!student) return null;

    if (updates.name) student.name = updates.name.trim();
    if (updates.password) student.password = updates.password.trim();

    writeDb(data);
    return student;
  },

  // Rooms
  getRooms(): ClassroomRoom[] {
    const data = ensureDb();
    return data.rooms;
  },

  findRoomById(id: string): ClassroomRoom | undefined {
    const data = ensureDb();
    return data.rooms.find((r) => r.id === id || r.code === id);
  },

  createRoom(
    name: string,
    subject: 'math' | 'physics' | 'chemistry',
    teacherId: string,
    assignedStudentIds: string[],
    description?: string,
    customCode?: string
  ): ClassroomRoom {
    const data = ensureDb();
    const id = `room_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const prefix = subject === 'math' ? 'TOAN' : subject === 'physics' ? 'LY' : 'HOA';
    const code = customCode && customCode.trim()
      ? customCode.trim().toUpperCase()
      : `${prefix}-${Math.floor(100 + Math.random() * 900)}`;

    const newRoom: ClassroomRoom = {
      id,
      code,
      name: name.trim(),
      subject,
      teacherId,
      status: 'closed', // Mặc định tạo mới ở trạng thái đóng, Thầy/Cô bấm "Mở phòng" khi bắt đầu
      assignedStudentIds,
      description: description?.trim() || '',
      createdAt: new Date().toISOString(),
    };

    data.rooms.unshift(newRoom);
    writeDb(data);
    return newRoom;
  },

  updateRoomStatus(roomId: string, status: 'open' | 'closed'): ClassroomRoom | null {
    const data = ensureDb();
    const room = data.rooms.find((r) => r.id === roomId || r.code === roomId);
    if (!room) return null;

    room.status = status;
    if (status === 'closed') {
      room.closedAt = new Date().toISOString();
    }
    writeDb(data);
    return room;
  },

  updateRoom(
    roomId: string,
    updates: Partial<Pick<ClassroomRoom, 'code' | 'name' | 'subject' | 'assignedStudentIds' | 'description'>>
  ): ClassroomRoom | null {
    const data = ensureDb();
    const room = data.rooms.find((r) => r.id === roomId || r.code === roomId);
    if (!room) return null;

    if (updates.code !== undefined && updates.code.trim()) {
      room.code = updates.code.trim();
    }
    if (updates.name !== undefined && updates.name.trim()) {
      room.name = updates.name.trim();
    }
    if (updates.subject !== undefined) {
      room.subject = updates.subject;
    }
    if (updates.assignedStudentIds !== undefined) {
      room.assignedStudentIds = updates.assignedStudentIds;
    }
    if (updates.description !== undefined) {
      room.description = updates.description.trim();
    }

    writeDb(data);
    return room;
  },

  deleteRoom(roomId: string): boolean {
    const data = ensureDb();
    const initialLen = data.rooms.length;
    data.rooms = data.rooms.filter((r) => r.id !== roomId && r.code !== roomId);
    if (data.rooms.length < initialLen) {
      writeDb(data);
      return true;
    }
    return false;
  },
};
