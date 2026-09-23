import React, { useState } from 'react';
import { X, Server, Key, Globe, Check, AlertCircle, Wifi, RefreshCw } from 'lucide-react';
import { livekitService } from '../services/livekitService';

interface LiveKitConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectedStatusChange: (connected: boolean) => void;
}

export const LiveKitConfigModal: React.FC<LiveKitConfigModalProps> = ({
  isOpen,
  onClose,
  onConnectedStatusChange,
}) => {
  const [serverUrl, setServerUrl] = useState('wss://your-project.livekit.cloud');
  const [apiKey, setApiKey] = useState('devkey');
  const [apiSecret, setApiSecret] = useState('secret');
  const [roomName, setRoomName] = useState('lop-stem-toan-ly-hoa');
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsConnecting(true);
    setStatusMessage('Đang gọi Backend /api/livekit/token và kết nối WebRTC...');
    setIsError(false);

    try {
      // 1. Get token from backend
      const res = await livekitService.getLiveKitToken(roomName, 'Thầy Minh', 'teacher');

      if (res && res.token) {
        // 2. Connect to LiveKit Room
        const success = await livekitService.connectToLiveKitRoom(serverUrl, res.token);
        if (success) {
          setStatusMessage('✅ Kết nối thành công tới LiveKit Cloud Production! Kênh Data Channel và Audio/Video 1080p đã sẵn sàng.');
          setIsError(false);
          onConnectedStatusChange(true);
        } else {
          setStatusMessage('❌ Không thể kết nối tới LiveKit Server. Vui lòng kiểm tra lại URL wss:// và API Key/Secret.');
          setIsError(true);
          onConnectedStatusChange(false);
        }
      }
    } catch (err: any) {
      setStatusMessage(`Lỗi kết nối LiveKit: ${err.message}. Vui lòng kiểm tra lại cấu hình.`);
      setIsError(true);
      onConnectedStatusChange(false);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5 text-emerald-400">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-base">Cấu Hình Máy Chủ LiveKit (WebRTC)</h3>
              <p className="text-xs text-slate-400">Kết nối LiveKit Cloud hoặc Self-hosted LiveKit Server</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Server URL */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              LiveKit WebSocket URL (wss://):
            </label>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="wss://your-project.livekit.cloud"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono transition"
            />
          </div>

          {/* API Key & Secret */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                LiveKit API Key:
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="devkey"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                LiveKit API Secret:
              </label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="secret"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono transition"
              />
            </div>
          </div>

          {/* Room Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Tên phòng học (Room Name):
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono transition"
            />
          </div>

          {/* Bandwidth Priority Policy */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Wifi className="w-4 h-4 text-emerald-400" />
              Chính sách phân bổ băng thông (Bandwidth Allocation):
            </h4>
            <div className="text-xs text-slate-400 space-y-1 leading-relaxed">
              <p>• <strong>Bảng trắng & Chia sẻ màn hình:</strong> 1080p Full HD @ 30fps (Bitrate ưu tiên cao nhất, contentHint: &apos;detail&apos; đảm bảo chữ viết phấn và công thức Toán học không bị vỡ hạt).</p>
              <p>• <strong>Camera học sinh:</strong> 360p / 180p @ 15fps (Tự động hạ độ phân giải khi mạng yếu qua Simulcast & Dynacast).</p>
              <p>• <strong>Đồng bộ nét vẽ:</strong> LiveKit Data Channel SCTP Reliable (TCP-like, không bao giờ rơi nét).</p>
            </div>
          </div>

          {/* Status Alert */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                isError
                  ? 'bg-rose-950/50 border-rose-800/80 text-rose-300'
                  : 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300'
              }`}
            >
              {statusMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium transition"
          >
            Đóng
          </button>
          <button
            onClick={handleTestConnection}
            disabled={isConnecting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium shadow-lg shadow-emerald-900/30 transition duration-150"
          >
            <RefreshCw className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
            {isConnecting ? 'Đang kết nối...' : 'Kiểm tra & Kết nối LiveKit'}
          </button>
        </div>
      </div>
    </div>
  );
};
