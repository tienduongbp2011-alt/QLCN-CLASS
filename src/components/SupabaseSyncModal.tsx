import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudCheck, 
  CloudOff, 
  CloudUpload, 
  CloudDownload, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertTriangle, 
  Key, 
  Database, 
  Zap, 
  Info,
  ShieldCheck,
  X
} from 'lucide-react';
import { 
  getSupabaseCredentials, 
  saveSupabaseCredentials, 
  clearCustomSupabaseCredentials,
  testSupabaseConnection, 
  uploadStoreToSupabase, 
  fetchStoreFromSupabase, 
  SUPABASE_SQL_SETUP_SCRIPT,
  SUPABASE_TABLE_NAME,
  getAutoSyncEnabled,
  setAutoSyncEnabled,
  SupabaseConnectionStatus
} from '../utils/supabase';
import { FullClassDataStore } from '../types';
import { sound } from '../utils/audio';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: FullClassDataStore;
  onApplyStore: (newStore: FullClassDataStore) => void;
}

export function SupabaseSyncModal({ isOpen, onClose, store, onApplyStore }: SupabaseSyncModalProps) {
  const [creds, setCreds] = useState(() => getSupabaseCredentials());
  const [urlInput, setUrlInput] = useState(creds.url);
  const [keyInput, setKeyInput] = useState(creds.anonKey);
  const [isEditingCreds, setIsEditingCreds] = useState(false);

  const [connectionStatus, setConnectionStatus] = useState<SupabaseConnectionStatus | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [copiedSql, setCopiedSql] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [autoSync, setAutoSync] = useState(() => getAutoSyncEnabled());

  useEffect(() => {
    if (isOpen) {
      checkStatus();
      setCreds(getSupabaseCredentials());
    }
  }, [isOpen]);

  const checkStatus = async () => {
    setIsTesting(true);
    setActionMessage(null);
    try {
      const res = await testSupabaseConnection();
      setConnectionStatus(res);
    } catch (e: any) {
      setConnectionStatus({
        connected: false,
        tableExists: false,
        message: 'Lỗi khi kiểm tra kết nối'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP_SCRIPT);
    setCopiedSql(true);
    sound.playSuccess();
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSaveCredentials = () => {
    if (!urlInput.trim() || !keyInput.trim()) {
      setActionMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ URL và Anon Key' });
      return;
    }
    saveSupabaseCredentials(urlInput.trim(), keyInput.trim());
    setCreds(getSupabaseCredentials());
    setIsEditingCreds(false);
    setActionMessage({ type: 'success', text: 'Đã lưu cấu hình Supabase mới!' });
    sound.playSuccess();
    checkStatus();
  };

  const handleResetCredentials = () => {
    clearCustomSupabaseCredentials();
    const defaults = getSupabaseCredentials();
    setCreds(defaults);
    setUrlInput(defaults.url);
    setKeyInput(defaults.anonKey);
    setIsEditingCreds(false);
    setActionMessage({ type: 'info', text: 'Đã khôi phục thông tin Supabase mặc định' });
    sound.playClick();
    checkStatus();
  };

  const handleUpload = async () => {
    setIsUploading(true);
    setActionMessage(null);
    try {
      const res = await uploadStoreToSupabase(store);
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        sound.playSuccess();
        checkStatus();
      } else {
        setActionMessage({ type: 'error', text: res.message });
        sound.playError();
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message || 'Lỗi không xác định' });
      sound.playError();
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!confirm('Tải dữ liệu từ Supabase sẽ thay thế toàn bộ dữ liệu hiện tại trên trình duyệt này. Bạn có chắc chắn muốn tiếp tục?')) {
      return;
    }
    setIsDownloading(true);
    setActionMessage(null);
    try {
      const res = await fetchStoreFromSupabase();
      if (res.success && res.data) {
        onApplyStore(res.data);
        setActionMessage({ type: 'success', text: res.message });
        sound.playSuccess();
      } else {
        setActionMessage({ type: 'error', text: res.message });
        sound.playError();
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message || 'Lỗi không xác định' });
      sound.playError();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSync(enabled);
    setAutoSyncEnabled(enabled);
    sound.playClick();
    if (enabled) {
      setActionMessage({ type: 'info', text: 'Đã bật chế độ tự động đồng bộ lên đám mây khi có thay đổi dữ liệu.' });
    } else {
      setActionMessage({ type: 'info', text: 'Đã tắt tự động đồng bộ. Bạn cần bấm nút Đẩy dữ liệu thủ công.' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">Kết Nối Cơ Sở Dữ Liệu Supabase</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-white/20 text-white">
                  PostgreSQL Cloud
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Đồng bộ trực tuyến dữ liệu học sinh, điểm danh, thi đua và sổ điểm lên máy chủ đám mây
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Action Alert Banner */}
        {actionMessage && (
          <div className={`px-6 py-3 text-sm font-medium flex items-center justify-between transition-all ${
            actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' :
            actionMessage.type === 'error' ? 'bg-rose-50 text-rose-800 border-b border-rose-200' :
            'bg-blue-50 text-blue-800 border-b border-blue-200'
          }`}>
            <span>{actionMessage.text}</span>
            <button onClick={() => setActionMessage(null)} className="text-xs underline opacity-70 hover:opacity-100">
              Đóng
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Connection Status Box */}
          <div className="rounded-xl border p-4 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                connectionStatus?.connected && connectionStatus?.tableExists 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : connectionStatus?.connected
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-rose-100 text-rose-700'
              }`}>
                {connectionStatus?.connected && connectionStatus?.tableExists ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : connectionStatus?.connected ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <CloudOff className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">Trạng thái kết nối:</span>
                  {isTesting ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 animate-pulse">
                      Đang kiểm tra...
                    </span>
                  ) : connectionStatus?.connected && connectionStatus?.tableExists ? (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      Sẵn sàng hoạt động (Online)
                    </span>
                  ) : connectionStatus?.connected ? (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Đã kết nối, chờ tạo bảng
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      Chưa kết nối
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {connectionStatus?.message || 'Đang xác định trạng thái...'}
                </p>
                {connectionStatus?.lastChecked && (
                  <span className="text-[11px] text-slate-400">
                    Kiểm tra lúc: {connectionStatus.lastChecked}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={checkStatus}
              disabled={isTesting}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition flex items-center gap-1.5 shadow-sm shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              Kiểm tra lại
            </button>
          </div>

          {/* Step 1: SQL Setup Guidance if table does not exist or user wants to verify */}
          <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="font-semibold text-slate-800">
                  Khởi tạo bảng trên Supabase (Chỉ cần làm 1 lần)
                </h3>
              </div>
              <button
                onClick={handleCopySql}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition flex items-center gap-1.5"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Đã sao chép!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Sao chép mã SQL
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Để lưu trữ dữ liệu, bạn chỉ cần mở bảng điều khiển Supabase của dự án và chạy đoạn script SQL dưới đây:
            </p>

            <ol className="text-xs text-slate-600 space-y-1.5 list-decimal pl-5">
              <li>
                Truy cập <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-600 font-semibold underline inline-flex items-center gap-0.5">
                  Supabase Dashboard <ExternalLink className="w-3 h-3" />
                </a> và chọn dự án của bạn (<strong>gdoxbonoiumnpiswqris</strong>).
              </li>
              <li>
                Chọn menu <strong>SQL Editor</strong> ở thanh bên trái &rarr; Bấm <strong>New Query</strong>.
              </li>
              <li>
                Dán toàn bộ mã SQL (nhấn nút sao chép ở trên) vào khung soạn thảo &rarr; Bấm nút <strong>Run</strong> (hoặc nhấn Ctrl+Enter).
              </li>
            </ol>

            <div className="relative">
              <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto max-h-36 border border-slate-800">
                {SUPABASE_SQL_SETUP_SCRIPT}
              </pre>
            </div>
          </div>

          {/* Step 2: Data Synchronization Controls */}
          <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h3 className="font-semibold text-slate-800">
                  Thao tác Đồng Bộ Dữ Liệu
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => handleToggleAutoSync(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span>Tự động đồng bộ đám mây</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Upload */}
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CloudUpload className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">Đẩy lên Supabase</h4>
                    <p className="text-[11px] text-slate-500">Lưu dữ liệu hiện tại lên đám mây</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600">
                  Sao lưu toàn bộ danh sách {store.students.length} học sinh, sổ điểm, thi đua và điểm danh lên máy chủ Supabase.
                </p>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CloudUpload className={`w-4 h-4 ${isUploading ? 'animate-bounce' : ''}`} />
                  {isUploading ? 'Đang tải lên Supabase...' : 'Đẩy dữ liệu lên Đám Mây ngay'}
                </button>
              </div>

              {/* Download */}
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <CloudDownload className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">Tải về từ Supabase</h4>
                    <p className="text-[11px] text-slate-500">Cập nhật dữ liệu từ đám mây về máy</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600">
                  Lấy dữ liệu mới nhất được giáo viên hoặc các thiết bị khác đồng bộ lên để hiển thị trên trình duyệt này.
                </p>
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CloudDownload className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
                  {isDownloading ? 'Đang tải từ Supabase...' : 'Tải dữ liệu từ Đám Mây'}
                </button>
              </div>
            </div>
          </div>

          {/* Credentials Display & Configuration */}
          <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-slate-600" />
                <h3 className="font-semibold text-slate-800 text-sm">
                  Thông tin kết nối Supabase hiện tại
                </h3>
              </div>
              {!isEditingCreds ? (
                <button
                  onClick={() => setIsEditingCreds(true)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  Chỉnh sửa
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetCredentials}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Khôi phục gốc
                  </button>
                  <button
                    onClick={() => setIsEditingCreds(false)}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>

            {!isEditingCreds ? (
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Project URL:</span>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200 font-mono text-slate-700 break-all select-all mt-0.5">
                    {creds.url}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Anon Key (Public):</span>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200 font-mono text-slate-700 break-all select-all mt-0.5">
                    {creds.anonKey.slice(0, 20)}•••••••••••••••••••••{creds.anonKey.slice(-8)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    VITE_SUPABASE_URL
                  </label>
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://xxxxxxxx.supabase.co"
                    className="w-full text-xs font-mono p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    VITE_SUPABASE_ANON_KEY
                  </label>
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="eyJhbGciOi..."
                    className="w-full text-xs font-mono p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleSaveCredentials}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  Lưu cấu hình kết nối mới
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Mẹo: Dữ liệu được mã hóa và truyền tải bảo mật qua giao thức HTTPS của Supabase.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition shadow-sm"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
