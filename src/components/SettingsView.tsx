import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  Trash2, 
  Volume2, 
  VolumeX, 
  FileCode, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle,
  KeyRound,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  LogOut,
  GraduationCap
} from 'lucide-react';
import { FullClassDataStore, ClassInfo, AppSettings } from '../types';
import { exportSingleFileHtml } from '../utils/exportHtml';
import { sound } from '../utils/audio';

interface SettingsViewProps {
  currentClass: ClassInfo;
  allStore: FullClassDataStore;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onImportBackup: (importedStore: FullClassDataStore) => void;
  onRestoreSampleData: () => void;
  onClearAllData: () => void;
  onLogout?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentClass,
  allStore,
  onUpdateSettings,
  onImportBackup,
  onRestoreSampleData,
  onClearAllData,
  onLogout
}) => {
  const { settings } = allStore;

  // Import JSON error / success status
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Clear data confirm modal
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  // Password management states
  const [gvcnPasswordInput, setGvcnPasswordInput] = useState<string>(() => {
    try {
      return localStorage.getItem('classpro_gvcn_password') || '123456';
    } catch {
      return '123456';
    }
  });

  const [teamPasswordInput, setTeamPasswordInput] = useState<string>(() => {
    try {
      return localStorage.getItem('classpro_team_password') || '123456';
    } catch {
      return '123456';
    }
  });

  const [showGvcnPass, setShowGvcnPass] = useState(false);
  const [showTeamPass, setShowTeamPass] = useState(false);
  const [passSaveSuccess, setPassSaveSuccess] = useState<string | null>(null);

  const handleSavePasswords = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (gvcnPasswordInput.trim()) {
        localStorage.setItem('classpro_gvcn_password', gvcnPasswordInput.trim());
      }
      if (teamPasswordInput.trim()) {
        localStorage.setItem('classpro_team_password', teamPasswordInput.trim());
      }
      setPassSaveSuccess('Đã cập nhật mật khẩu đăng nhập thành công!');
      sound.playSuccess();
      setTimeout(() => setPassSaveSuccess(null), 3500);
    } catch {
      // ignore
    }
  };

  const handleResetDefaultPasswords = () => {
    if (confirm('Đặt lại mật khẩu mặc định (123456) cho cả Giáo viên và Tổ trưởng?')) {
      try {
        localStorage.setItem('classpro_gvcn_password', '123456');
        localStorage.setItem('classpro_team_password', '123456');
        setGvcnPasswordInput('123456');
        setTeamPasswordInput('123456');
        setPassSaveSuccess('Đã khôi phục mật khẩu mặc định (123456)!');
        sound.playSuccess();
        setTimeout(() => setPassSaveSuccess(null), 3500);
      } catch {}
    }
  };

  // Export JSON backup
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allStore, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `ClassPro_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
    sound.playSuccess();
  };

  // Import JSON backup
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.classes || !parsed.students || !parsed.criteria) {
          throw new Error('Cấu trúc tệp sao lưu không hợp lệ hoặc bị thiếu trường dữ liệu cốt lõi.');
        }

        onImportBackup(parsed);
        setImportStatus({ type: 'success', msg: 'Đã nhập lại toàn bộ bản sao lưu thành công!' });
        sound.playFanfare();
      } catch (err: any) {
        setImportStatus({ type: 'error', msg: `Lỗi tệp sao lưu: ${err.message || 'Không thể đọc tệp JSON'}` });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Download Standalone Offline HTML File
  const handleExportOfflineHtml = () => {
    exportSingleFileHtml(allStore);
    sound.playFanfare();
  };

  // Handle Clear All Data
  const handleExecuteClear = () => {
    if (confirmInput.trim().toUpperCase() === 'XOA TAT CA') {
      onClearAllData();
      setShowClearConfirm(false);
      setConfirmInput('');
      sound.playSuccess();
    } else {
      alert('Vui lòng gõ chính xác cụm từ: XOA TAT CA để xác nhận.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-600" />
            Cài Đặt Hệ Thống & Sao Lưu Dữ Liệu
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý quyền lưu trữ cục bộ, xuất nhập bản sao lưu JSON, tải bản chạy ngoại tuyến và tùy biến ứng dụng
          </p>
        </div>
      </div>

      {importStatus && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs ${
          importStatus.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {importStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{importStatus.msg}</span>
        </div>
      )}

      {/* Section 1: Offline Single-File HTML Download */}
      <div className="bg-gradient-to-r from-teal-50 via-cyan-50 to-sky-50 border border-teal-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-xs shrink-0">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tải về tệp HTML đơn lẻ (Chạy Ngoại Tuyến 100%)
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 max-w-xl leading-relaxed">
                Xuất toàn bộ hệ thống lớp học của bạn thành một tệp <strong className="text-teal-900">.html</strong> duy nhất. Bạn có thể chép vào USB, mở trực tiếp bằng bất kỳ trình duyệt nào mà không cần kết nối internet hay máy chủ.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportOfflineHtml}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs whitespace-nowrap transition-all"
          >
            <Download className="w-4 h-4" />
            Tải tệp HTML offline
          </button>
        </div>
      </div>

      {/* Section 2: General System Preferences */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Tùy chọn hiển thị & Tương tác
        </h3>

        <div className="space-y-3 text-xs divide-y divide-slate-100">
          {/* Sound toggle */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="font-bold text-slate-800 block">Hiệu ứng âm thanh (Web Audio API)</span>
              <span className="text-slate-400">Âm thanh vui tươi khi quay vòng quay, ghi điểm thi đua và đổi quà</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onUpdateSettings({ soundEnabled: !settings.soundEnabled });
                sound.playClick();
              }}
              className={`p-2 rounded-xl border text-xs font-medium transition-colors ${
                settings.soundEnabled
                  ? 'bg-teal-50 border-teal-200 text-teal-700'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {/* Emulation Coin link */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <span className="font-bold text-slate-800 block">Đồng bộ điểm thi đua với xu đổi quà</span>
              <span className="text-slate-400">Khi cộng điểm thi đua cho học sinh, tự động tăng số xu đổi quà tương ứng</span>
            </div>
            <input
              type="checkbox"
              checked={settings.linkEmulationWithCoins}
              onChange={(e) => onUpdateSettings({ linkEmulationWithCoins: e.target.checked })}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Section 2.5: Password Management for Teacher & Team Leaders */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-teal-600" />
              Bảo Mật & Mật Khẩu Đăng Nhập (Giáo Viên & Tổ Trưởng)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Thiết lập mật khẩu bảo vệ khi đăng nhập hệ thống cho Giáo viên chủ nhiệm và các Tổ trưởng
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaultPasswords}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Mật khẩu mặc định (123456)
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors flex items-center gap-1"
                title="Khóa hệ thống và quay lại màn hình đăng nhập"
              >
                <LogOut className="w-3.5 h-3.5" />
                Khóa & Đăng xuất
              </button>
            )}
          </div>
        </div>

        {passSaveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{passSaveSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSavePasswords} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Teacher Password */}
            <div className="p-4 bg-teal-50/60 border border-teal-200/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-teal-950 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-teal-700" />
                  Mật khẩu Giáo viên chủ nhiệm
                </span>
                <button
                  type="button"
                  onClick={() => setShowGvcnPass(!showGvcnPass)}
                  className="text-teal-700 hover:text-teal-900 text-[11px] font-semibold flex items-center gap-1"
                >
                  {showGvcnPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showGvcnPass ? 'Ẩn' : 'Hiện'}</span>
                </button>
              </div>
              <p className="text-[11px] text-teal-800">
                Dùng khi chọn đăng nhập là <strong>Giáo viên</strong>. Mặc định: <code className="bg-teal-100 px-1 rounded font-bold">123456</code> hoặc <code className="bg-teal-100 px-1 rounded font-bold">gvcn123</code>.
              </p>
              <input
                type={showGvcnPass ? 'text' : 'password'}
                value={gvcnPasswordInput}
                onChange={(e) => setGvcnPasswordInput(e.target.value)}
                placeholder="Nhập mật khẩu Giáo viên..."
                className="w-full bg-white border border-teal-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-hidden focus:ring-2 focus:ring-teal-200"
              />
            </div>

            {/* Team Leader Password */}
            <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-amber-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  Mật khẩu chung cho các Tổ trưởng
                </span>
                <button
                  type="button"
                  onClick={() => setShowTeamPass(!showTeamPass)}
                  className="text-amber-800 hover:text-amber-950 text-[11px] font-semibold flex items-center gap-1"
                >
                  {showTeamPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showTeamPass ? 'Ẩn' : 'Hiện'}</span>
                </button>
              </div>
              <p className="text-[11px] text-amber-900">
                Dùng khi chọn đăng nhập là <strong>Tổ trưởng</strong> (Tổ 1..4). Mặc định: <code className="bg-amber-100 px-1 rounded font-bold">123456</code> hoặc phím tắt <code className="bg-amber-100 px-1 rounded font-bold">to1..to4</code>.
              </p>
              <input
                type={showTeamPass ? 'text' : 'password'}
                value={teamPasswordInput}
                onChange={(e) => setTeamPasswordInput(e.target.value)}
                placeholder="Nhập mật khẩu Tổ trưởng..."
                className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-hidden focus:ring-2 focus:ring-amber-200"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              Lưu thay đổi mật khẩu
            </button>
          </div>
        </form>
      </div>

      {/* Section 3: Backup & Restore JSON */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-teal-600" />
          Sao Lưu & Khôi Phục Dữ Liệu (JSON)
        </h3>

        <p className="text-xs text-slate-500 leading-relaxed">
          Toàn bộ dữ liệu của bạn được lưu trữ an toàn trong bộ nhớ máy (localStorage). Hãy thường xuyên xuất bản sao lưu ra tệp JSON để tránh mất mát khi đổi máy tính hoặc xóa cache trình duyệt.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            Tải bản sao lưu (.JSON)
          </button>

          <label className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>Khôi phục từ tệp .JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Section 4: Sample Data & Danger Zone */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Quản Lý Trạng Thái & Khởi Tạo
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Restore sample data */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Khôi phục dữ liệu mẫu minh họa
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                Đặt lại lớp 10A1 (THPT) với 15 học sinh mẫu, điểm danh, tiêu chí và thời khóa biểu môn THPT minh họa ban đầu.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm('Khôi phục lại bộ dữ liệu mẫu lớp 10A1 (THPT)? Các dữ liệu hiện tại có thể bị ghi đè.')) {
                  onRestoreSampleData();
                  sound.playSuccess();
                }
              }}
              className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Tải lại dữ liệu mẫu
            </button>
          </div>

          {/* Clear all data */}
          <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-200 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-rose-900 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Xóa sạch toàn bộ dữ liệu
              </h4>
              <p className="text-[11px] text-rose-700 leading-relaxed mb-3">
                Xóa tất cả các lớp, danh sách học sinh, điểm danh và nề nếp. Dữ liệu sẽ trở về trạng thái trống hoàn toàn.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
            >
              Xóa toàn bộ dữ liệu...
            </button>
          </div>
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Cảnh báo nghiêm trọng: Xóa toàn bộ dữ liệu!
            </h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              Hành động này sẽ xóa sạch vĩnh viễn tất cả học sinh, bản ghi điểm danh, thi đua và thời khóa biểu đã lưu trên máy tính này.
            </p>

            <div className="mb-4">
              <label className="block font-semibold text-slate-700 mb-1">
                Gõ chính xác cụm từ <span className="text-rose-600 font-mono font-bold">XOA TAT CA</span> vào ô bên dưới:
              </label>
              <input
                type="text"
                placeholder="XOA TAT CA"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-rose-500 outline-hidden font-mono uppercase"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowClearConfirm(false);
                  setConfirmInput('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteClear}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-xs"
              >
                Tôi chắc chắn, xóa sạch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
