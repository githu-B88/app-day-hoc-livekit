import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// ==========================================
// 1. AUTHENTICATION APIS
// ==========================================

// Đăng nhập (Học sinh & Giáo viên)
app.post('/api/auth/login', (req: Request, res: Response): void => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu/mã PIN',
      });
      return;
    }

    const user = db.findUserByUsername(username);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Tài khoản không tồn tại. Vui lòng kiểm tra lại!',
      });
      return;
    }

    if (user.password !== password) {
      res.status(401).json({
        success: false,
        message: 'Mật khẩu hoặc mã PIN không chính xác!',
      });
      return;
    }

    if (role && user.role !== role) {
      res.status(403).json({
        success: false,
        message: `Tài khoản này thuộc vai trò ${user.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}. Vui lòng chọn đúng vai trò để đăng nhập.`,
      });
      return;
    }

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        avatarColor: user.avatarColor,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lấy thông tin user hiện tại qua ID
app.get('/api/auth/me/:id', (req: Request, res: Response): void => {
  try {
    const user = db.findUserById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
      return;
    }
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        avatarColor: user.avatarColor,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 2. STUDENT MANAGEMENT APIS (ADMIN / TEACHER)
// ==========================================

// Lấy danh sách tất cả học sinh
app.get('/api/students', (req: Request, res: Response): void => {
  try {
    const students = db.getStudents();
    res.json({ success: true, students });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Tạo tài khoản học sinh mới
app.post('/api/students', (req: Request, res: Response): void => {
  try {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập Họ tên, Tên đăng nhập và Mật khẩu/Mã PIN',
      });
      return;
    }

    const newStudent = db.createStudent(name, username, password);
    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản học sinh thành công',
      student: newStudent,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Cập nhật thông tin học sinh
app.put('/api/students/:id', (req: Request, res: Response): void => {
  try {
    const { name, password } = req.body;
    const updated = db.updateStudent(req.params.id, { name, password });
    if (!updated) {
      res.status(404).json({ success: false, message: 'Không tìm thấy học sinh cần sửa' });
      return;
    }
    res.json({ success: true, message: 'Cập nhật thành công', student: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xóa tài khoản học sinh
app.delete('/api/students/:id', (req: Request, res: Response): void => {
  try {
    const deleted = db.deleteStudent(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Không tìm thấy học sinh cần xóa' });
      return;
    }
    res.json({ success: true, message: 'Đã xóa tài khoản học sinh thành công' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 3. ROOM MANAGEMENT APIS & ACCESS CONTROL
// ==========================================

// Lấy danh sách tất cả phòng học
app.get('/api/rooms', (req: Request, res: Response): void => {
  try {
    const rooms = db.getRooms();
    const students = db.getStudents();
    const users = db.getUsers();

    // Map chi tiết danh sách học sinh được gán
    const populated = rooms.map((room) => {
      const teacher = users.find((u) => u.id === room.teacherId);
      const assignedList = room.assignedStudentIds
        .map((sid) => students.find((s) => s.id === sid))
        .filter(Boolean);
      return {
        ...room,
        teacherName: teacher ? teacher.name : 'Thầy Minh',
        assignedStudents: assignedList,
      };
    });

    res.json({ success: true, rooms: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lấy thông tin chi tiết một phòng học
app.get('/api/rooms/:id', (req: Request, res: Response): void => {
  try {
    const room = db.findRoomById(req.params.id);
    if (!room) {
      res.status(404).json({ success: false, message: 'Không tìm thấy phòng học' });
      return;
    }
    res.json({ success: true, room });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Tạo phòng học mới
app.post('/api/rooms', (req: Request, res: Response): void => {
  try {
    const { name, subject, teacherId = 'teacher_1', assignedStudentIds = [], description } = req.body;

    if (!name || !subject) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp Tên phòng học và Môn học (Toán/Lý/Hóa)',
      });
      return;
    }

    const newRoom = db.createRoom(name, subject, teacherId, assignedStudentIds, description);
    res.status(201).json({
      success: true,
      message: 'Tạo phòng học mới thành công',
      room: newRoom,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Cập nhật thông tin phòng học (gán học sinh, đổi tên)
app.put('/api/rooms/:id', (req: Request, res: Response): void => {
  try {
    const { name, subject, assignedStudentIds, description } = req.body;
    const updated = db.updateRoom(req.params.id, {
      name,
      subject,
      assignedStudentIds,
      description,
    });
    if (!updated) {
      res.status(404).json({ success: false, message: 'Không tìm thấy phòng học' });
      return;
    }
    res.json({ success: true, message: 'Cập nhật phòng học thành công', room: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Thay đổi trạng thái phòng (MỞ / ĐÓNG PHÒNG)
// Khi TẮT PHÒNG, gọi LiveKit RoomService API để ngắt kết nối và đóng phòng
app.put('/api/rooms/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (status !== 'open' && status !== 'closed') {
      res.status(400).json({ success: false, message: 'Trạng thái phòng phải là "open" hoặc "closed"' });
      return;
    }

    const room = db.findRoomById(req.params.id);
    if (!room) {
      res.status(404).json({ success: false, message: 'Không tìm thấy phòng học' });
      return;
    }

    // Nếu Giáo viên bấm "Tắt/Khóa phòng", gọi LiveKit RoomService API để giải phóng phòng
    if (status === 'closed') {
      const serverUrl = process.env.LIVEKIT_URL || 'wss://eduwhite-i0qhtq4t.livekit.cloud';
      const apiKey = process.env.LIVEKIT_API_KEY || 'API8cRmvzzhjfCq';
      const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';

      try {
        const httpHost = serverUrl.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://');
        const roomService = new RoomServiceClient(httpHost, apiKey, apiSecret);
        // Ngắt kết nối toàn bộ thành viên và đóng phòng trên máy chủ LiveKit
        await roomService.deleteRoom(room.id);
        console.log(`[LiveKit RoomService] Đã đóng và xóa phòng ${room.id} trên LiveKit Server thành công.`);
      } catch (liveKitErr: any) {
        console.warn('[LiveKit RoomService] Lưu ý khi đóng phòng LiveKit:', liveKitErr.message);
      }
    }

    const updated = db.updateRoomStatus(room.id, status);
    res.json({
      success: true,
      message: status === 'open' ? 'Phòng học đã được MỞ THÀNH CÔNG!' : 'Phòng học đã được ĐÓNG và ngắt kết nối học sinh.',
      room: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xóa phòng học
app.delete('/api/rooms/:id', (req: Request, res: Response): void => {
  try {
    const deleted = db.deleteRoom(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Không tìm thấy phòng học để xóa' });
      return;
    }
    res.json({ success: true, message: 'Đã xóa phòng học' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 4. LIVEKIT TOKEN API VỚI RÀO CHẮN PHÂN QUYỀN
// ==========================================
// Đảm bảo cùng một biến roomName thống nhất cho cả Giáo viên và Học sinh,
// đồng thời cấp đủ 3 quyền canPublish, canSubscribe, canPublishData.
app.post('/api/livekit/token', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      roomId,
      roomName: rawRoomName,
      userId,
      role = 'student',
      participantName,
    } = req.body;

    const apiKey = process.env.LIVEKIT_API_KEY || 'API8cRmvzzhjfCq';
    const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
    const serverUrl =
      process.env.LIVEKIT_URL ||
      process.env.NEXT_PUBLIC_LIVEKIT_URL ||
      process.env.VITE_LIVEKIT_URL ||
      'wss://eduwhite-i0qhtq4t.livekit.cloud';

    // 1. Chuẩn hóa biến roomName duy nhất đảm bảo cả Giáo viên và Học sinh vào CHÍNH XÁC cùng 1 phòng
    const candidateRoom = rawRoomName || roomId || 'room_math_12';
    let targetRoom = db.findRoomById(candidateRoom);
    if (!targetRoom) {
      // Nếu candidateRoom là room code hoặc tìm qua id
      const rooms = db.getRooms();
      targetRoom = rooms.find((r) => r.id === candidateRoom || r.name === candidateRoom) || rooms[0];
    }

    // Biến roomName duy nhất dùng cho cả hai vai trò:
    const roomName = (targetRoom ? targetRoom.id : candidateRoom).toString().trim();

    // 2. Kiểm tra thông tin User
    const user = userId ? db.findUserById(userId) : null;
    const finalRole = user ? user.role : role;
    const finalName = user ? user.name : (participantName || (finalRole === 'teacher' ? 'Thầy Minh' : 'Học sinh'));
    const finalIdentity = user ? `${user.role}_${user.id}` : `${finalRole}_${Date.now()}`;

    // 3. RÀO CHẮN BẢO MẬT DÀNH CHO HỌC SINH
    if (finalRole === 'student') {
      // Điều kiện (1): Học sinh phải có tài khoản hợp lệ
      if (!user) {
        res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: 'Vui lòng đăng nhập bằng tài khoản Học sinh để tham gia lớp học.',
        });
        return;
      }

      // Điều kiện (3): Phòng phải ở trạng thái "Mở"
      if (targetRoom && targetRoom.status !== 'open') {
        res.status(403).json({
          success: false,
          code: 'ROOM_CLOSED',
          message: `Phòng học "${targetRoom.name}" hiện đang ĐÓNG hoặc chưa được Thầy/Cô bắt đầu. Vui lòng đợi giáo viên mở phòng!`,
        });
        return;
      }

      // Điều kiện (2): Học sinh phải có tên trong danh sách được gán của phòng
      if (targetRoom && targetRoom.assignedStudentIds && !targetRoom.assignedStudentIds.includes(user.id)) {
        res.status(403).json({
          success: false,
          code: 'NOT_ASSIGNED',
          message: `Bạn chưa được cấp quyền tham gia lớp học "${targetRoom.name}". Vui lòng liên hệ Thầy/Cô để được gán vào danh sách!`,
        });
        return;
      }
    }

    // Nếu là Giáo viên, tự động mở phòng nếu phòng chưa mở khi Thầy bấm vào giảng dạy
    if (finalRole === 'teacher' && targetRoom && targetRoom.status === 'closed') {
      db.updateRoomStatus(targetRoom.id, 'open');
      targetRoom.status = 'open';
    }

    // 4. Tạo LiveKit AccessToken chuẩn với roomName đồng nhất
    const at = new AccessToken(apiKey, apiSecret, {
      identity: finalIdentity,
      name: finalName,
      ttl: '6h',
      metadata: JSON.stringify({
        userId: user ? user.id : 'guest',
        role: finalRole,
        roomId: roomName,
        roomName: roomName,
        subject: targetRoom ? targetRoom.subject : 'math',
        canDraw: finalRole === 'teacher',
        joinedAt: new Date().toISOString(),
      }),
    });

    // CẤP ĐỦ CẢ 3 QUYỀN: canPublish, canSubscribe, canPublishData VỚI CÙNG roomName
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    console.log(`[Token API] Cấp token thành công: user=${finalName} (${finalRole}) -> room=${roomName}`);

    res.json({
      success: true,
      token,
      serverUrl,
      roomName,
      identity: finalIdentity,
      participantName: finalName,
      role: finalRole,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomInfo: targetRoom,
    });
  } catch (error: any) {
    console.error('Lỗi cấp LiveKit Token:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cấp LiveKit token',
      error: error.message,
    });
  }
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'LiveKit Classroom Token & Signaling Gateway',
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Classroom Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
