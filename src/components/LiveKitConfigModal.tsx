import React, { useState, useEffect } from 'react';
import { X, Server, Key, Globe, Check, AlertCircle, Wifi, RefreshCw, AlertTriangle } from 'lucide-react';
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
  const [serverUrl, setServerUrl] = useState('wss://eduwhite-i0qhtq4t.livekit.cloud');
  const [apiKey, setApiKey] = useState('APIFeqeHEDjairy');
  const [apiSecret, setApiSecret] = useState('');
  const [roomName, setRoomName] = useState('room_math_12');
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isCurrentSecretJwt, setIsCurrentSecretJwt] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/livekit/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.serverUrl) setServerUrl(data.serverUrl);
        if (data.apiKey) setApiKey(data.apiKey);
        if (data.isSecretJwt) {
          setIsCurrentSecretJwt(true);
        } else {
          setIsCurrentSecretJwt(false);
        }
      })
      .catch((err) => console.warn('Không thể tải cấu hình LiveKit hiện tại:', err));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsConnecting(true);
    setStatusMessage('Đang kiểm tra và xác thực API Key/Secret với máy chủ LiveKit Cloud...');
    setIsError(false);

    try {
      // 1. Lưu và kiểm tra cấu hình trên Backend
      if (apiSecret) {
        if (apiSecret.startsWith('eyJ')) {
          throw new Error('API Secret không thể là một chuỗi JWT Token (bắt đầu bằng eyJ...). Vui lòng vào cloud.livekit.io -> Settings -> Keys -> Copy mục Secret thật.');
        }

        const configRes = await fetch('/api/livekit/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serverUrl, apiKey, apiSecret }),
        });
        const configData = await configRes.json();
        if (!configRes.ok || !configData.success) {
          throw new Error(configData.message || 'Xác thực cấu hình thất bại');
        }
        setIsCurrentSecretJwt(false);
      }

      // 2. Yêu cầu Backend cấp token thử nghiệm
      setStatusMessage('Cấu hình hợp lệ! Đang tạo token thử nghiệm và kết nối WebRTC...');
      const res = await livekitService.getLiveKitToken(roomName, 'Thầy Minh', 'teacher');

      if (res && res.token) {
        // 3. Kết nối LiveKit Room thực tế
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
      setStatusMessage(`Lỗi: ${err.message}`);
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
              <p className="text-xs text-slate-400">Kết nối LiveKit Cloud Production hoặc Self-hosted Server</p>
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
          {isCurrentSecretJwt && (
            <div className="p-4 rounded-xl border border-amber-500/50 bg-amber-950/40 text-amber-200 text-xs leading-relaxed flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 block mb-1">Cảnh báo: Secret Key hiện tại không hợp lệ!</strong>
                Khóa <code className="bg-amber-950 px-1 py-0.5 rounded border border-amber-700 font-mono">LIVEKIT_API_SECRET</code> hiện tại là một chuỗi JWT Token (bắt đầu bằng <code className="font-mono">eyJ...</code>) do tạo thử trong tab Generate Token.
                Vui lòng vào <strong>cloud.livekit.io &gt; Settings &gt; Keys</strong>, bấm nút <strong>Copy Secret</strong> thật cho API Key <code className="font-mono">{apiKey}</code> và dán vào ô bên dưới!
              </div>
            </div>
          )}

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
                placeholder="APIFeqeHEDjairy"
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
                placeholder="Dán Secret từ cloud.livekit.io..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono transition"
              />
            </div>
          </div>

          {/* Room Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Tên phòng học thử nghiệm (Room Name):
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
              Chính sách băng thông &amp; Mã hóa bảo mật:
            </h4>
            <div className="text-xs text-slate-400 space-y-1 leading-relaxed">
              <p>• <strong>Bảng trắng &amp; Chia sẻ màn hình:</strong> 1080p Full HD @ 30fps (Bitrate ưu tiên cao nhất, contentHint: &apos;detail&apos;).</p>
              <p>• <strong>Camera học sinh &amp; giáo viên:</strong> Chuẩn WebRTC Web Video Track tự động thích ứng băng thông.</p>
              <p>• <strong>Đồng bộ nét vẽ tldraw:</strong> LiveKit Data Channel SCTP Reliable (TCP-like, độ trễ &lt; 50ms).</p>
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
            {isConnecting ? 'Đang kiểm tra...' : 'Xác thực & Lưu cấu hình LiveKit'}
          </button>
        </div>
      </div>
    </div>
  );
};
