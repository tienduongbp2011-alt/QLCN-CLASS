import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  GraduationCap, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Delete, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sparkles, 
  Users, 
  School, 
  Check, 
  X,
  RefreshCw,
  Sliders,
  ChevronRight,
  Info
} from 'lucide-react';
import { UserRole, Student, ClassInfo } from '../types';
import { sound } from '../utils/audio';

interface LoginScreenProps {
  currentClass: ClassInfo;
  students: Student[];
  onLoginSuccess: (role: UserRole) => void;
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  currentClass,
  students,
  onLoginSuccess,
  isModal = false,
  onCloseModal
}) => {
  // Choice selection: 'gvcn' | 'team_leader'
  const [selectedRoleType, setSelectedRoleType] = useState<'gvcn' | 'team_leader'>('gvcn');

  // Selected team for team leader: 1, 2, 3, 4
  const [selectedTeam, setSelectedTeam] = useState<number>(1);

  // Password inputs
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  // Stored passwords
  const [gvcnPassword, setGvcnPassword] = useState<string>(() => {
    try {
      return localStorage.getItem('classpro_gvcn_password') || '123456';
    } catch {
      return '123456';
    }
  });

  const [teamPassword, setTeamPassword] = useState<string>(() => {
    try {
      return localStorage.getItem('classpro_team_password') || '123456';
    } catch {
      return '123456';
    }
  });

  // Change password drawer state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [changeSuccessMsg, setChangeSuccessMsg] = useState<string | null>(null);

  // Touch keypad visibility toggle (expanded on mobile/tablet)
  const [showKeypad, setShowKeypad] = useState(true);

  // Reset errors when switching role or team
  useEffect(() => {
    setPasswordInput('');
    setErrorMessage(null);
    setShowChangePassword(false);
    setChangeSuccessMsg(null);
  }, [selectedRoleType, selectedTeam]);

  // Find team leaders from student list
  const classStudents = students.filter(s => s.classId === currentClass.id);
  const leaders: Record<number, Student | undefined> = {
    1: classStudents.find(s => s.team === 1 && s.role === 'Tổ trưởng'),
    2: classStudents.find(s => s.team === 2 && s.role === 'Tổ trưởng'),
    3: classStudents.find(s => s.team === 3 && s.role === 'Tổ trưởng'),
    4: classStudents.find(s => s.team === 4 && s.role === 'Tổ trưởng'),
  };

  const nextTeam = selectedTeam === 4 ? 1 : selectedTeam + 1;

  // Keypad button click
  const handleKeypadPress = (val: string) => {
    sound.playClick();
    setErrorMessage(null);
    if (val === 'C') {
      setPasswordInput('');
    } else if (val === 'BACK') {
      setPasswordInput(prev => prev.slice(0, -1));
    } else {
      if (passwordInput.length < 20) {
        setPasswordInput(prev => prev + val);
      }
    }
  };

  // Submit login
  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const entered = passwordInput.trim();

    if (!entered) {
      setErrorMessage('Vui lòng nhập mật khẩu để vào hệ thống!');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      sound.playError();
      return;
    }

    if (selectedRoleType === 'gvcn') {
      // Validate Teacher password:
      // Accepts saved password, default '123456', or 'gvcn123'
      const validGvcn = gvcnPassword.trim();
      const isGvcnValid = 
        entered === validGvcn || 
        entered.toLowerCase() === validGvcn.toLowerCase() ||
        entered === '123456' || 
        entered.toLowerCase() === 'gvcn123';

      if (!isGvcnValid) {
        setErrorMessage('Mật khẩu Giáo viên không chính xác. Vui lòng kiểm tra lại!');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        sound.playError();
        return;
      }

      sound.playSuccess();
      onLoginSuccess('gvcn');
      if (onCloseModal) onCloseModal();
    } else {
      // Validate Team Leader password:
      // Accepts saved team password, default '123456', 'totruong123', or team shortcuts 'to1', 'to2', etc.
      const validTeam = teamPassword.trim();
      const teamSpecific = `to${selectedTeam}`;
      const isTeamValid = 
        entered === validTeam || 
        entered.toLowerCase() === validTeam.toLowerCase() ||
        entered === '123456' || 
        entered.toLowerCase() === 'totruong123' ||
        entered.toLowerCase() === teamSpecific;

      if (!isTeamValid) {
        setErrorMessage('Mật khẩu Tổ trưởng không chính xác. Vui lòng kiểm tra lại!');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        sound.playError();
        return;
      }

      sound.playFanfare();
      const roleKey = `to_${selectedTeam}` as UserRole;
      onLoginSuccess(roleKey);
      if (onCloseModal) onCloseModal();
    }
  };

  // Save new password
  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordVal.trim()) return;

    try {
      if (selectedRoleType === 'gvcn') {
        localStorage.setItem('classpro_gvcn_password', newPasswordVal.trim());
        setGvcnPassword(newPasswordVal.trim());
        setChangeSuccessMsg('Đã đổi mật khẩu Giáo viên chủ nhiệm thành công!');
      } else {
        localStorage.setItem('classpro_team_password', newPasswordVal.trim());
        setTeamPassword(newPasswordVal.trim());
        setChangeSuccessMsg('Đã đổi mật khẩu Tổ trưởng thành công!');
      }
      setShowChangePassword(false);
      setNewPasswordVal('');
      sound.playSuccess();
      setTimeout(() => setChangeSuccessMsg(null), 4000);
    } catch {
      // ignore
    }
  };

  return (
    <div className={isModal ? "fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto" : "min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex items-center justify-center p-3 sm:p-6"}>
      {/* Container Card */}
      <div className={`w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto transition-all ${
        isShaking ? 'animate-shake' : 'animate-in zoom-in-95 duration-200'
      }`}>
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white p-5 sm:p-6 relative">
          {isModal && onCloseModal && (
            <button
              type="button"
              onClick={onCloseModal}
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <School className="w-7 h-7 text-amber-300" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black tracking-widest uppercase bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-2xs">
                  CỔNG ĐĂNG NHẬP HỆ THỐNG
                </span>
                <span className="text-xs font-semibold text-teal-200">
                  {currentClass.schoolYear}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-1 truncate">
                Phần mềm QLCN lớp
              </h1>
              <p className="text-xs text-teal-100/90 truncate">
                Lớp: <strong className="text-white">{currentClass.name}</strong> {currentClass.grade ? `(${currentClass.grade})` : ''} · GVCN: <strong className="text-white">{currentClass.teacherName || 'Chưa cập nhật'}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Instructions banner */}
        <div className="bg-amber-50/90 border-b border-amber-200/80 px-5 py-2.5 text-xs text-amber-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold">
              Hệ thống yêu cầu xác thực mật khẩu đối với cả <strong>Giáo viên</strong> và <strong>Tổ trưởng</strong> để đảm bảo tính bảo mật và khách quan.
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 space-y-6">
          {/* STEP 1: Two Big Choices */}
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Lựa chọn vai trò đăng nhập (1 trong 2 lựa chọn)</span>
              <span className="text-[11px] text-teal-700 font-extrabold">BƯỚC 1</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Choice 1: Giáo viên chủ nhiệm */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRoleType('gvcn');
                  sound.playClick();
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                  selectedRoleType === 'gvcn'
                    ? 'border-teal-600 bg-teal-50/80 shadow-md ring-2 ring-teal-500/30'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      selectedRoleType === 'gvcn' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    {selectedRoleType === 'gvcn' ? (
                      <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border-2 border-slate-300" />
                    )}
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                    1. Giáo viên chủ nhiệm
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Toàn quyền quản trị lớp học: Hồ sơ học sinh, điểm danh, sổ điểm, quỹ lớp, sơ đồ lớp, báo cáo...
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Phân quyền:</span>
                  <span className="bg-teal-100 text-teal-900 font-bold px-2 py-0.5 rounded-md">
                    Toàn diện (Admin)
                  </span>
                </div>
              </button>

              {/* Choice 2: Tổ trưởng chấm thi đua chéo */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRoleType('team_leader');
                  sound.playClick();
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                  selectedRoleType === 'team_leader'
                    ? 'border-amber-500 bg-amber-50/80 shadow-md ring-2 ring-amber-400/40'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      selectedRoleType === 'team_leader' ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-xs' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    {selectedRoleType === 'team_leader' ? (
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border-2 border-slate-300" />
                    )}
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                    2. Tổ trưởng chấm chéo
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Vào thẳng mục thi đua lớp để chấm điểm chéo các tổ. Các mục quản lý riêng tư khác của lớp được khóa lại.
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Phân quyền:</span>
                  <span className="bg-amber-100 text-amber-950 font-bold px-2 py-0.5 rounded-md">
                    Vào thẳng Thi đua
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Sub-step if Team Leader is selected: Select Team (Tổ 1..4) */}
          {selectedRoleType === 'team_leader' && (
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-700" />
                  Bạn là Tổ trưởng của Tổ nào?
                </label>
                <span className="text-[11px] text-amber-800 font-medium">
                  Chọn 1 trong 4 tổ
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(tNum => {
                  const isSelected = selectedTeam === tNum;
                  const leader = leaders[tNum];
                  const crossTarget = tNum === 4 ? 1 : tNum + 1;

                  return (
                    <button
                      key={tNum}
                      type="button"
                      onClick={() => {
                        setSelectedTeam(tNum);
                        sound.playClick();
                      }}
                      className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'bg-amber-100 border-amber-600 shadow-xs ring-2 ring-amber-300'
                          : 'bg-white border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs text-slate-900 flex items-center gap-1">
                          <span className="w-5 h-5 rounded bg-amber-400 text-slate-950 flex items-center justify-center text-[11px] font-extrabold">
                            {tNum}
                          </span>
                          Tổ {tNum}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-800 stroke-[3]" />}
                      </div>

                      <div className="text-[11px] font-bold text-slate-800 truncate" title={leader?.fullName}>
                        {leader ? leader.fullName : `Tổ trưởng ${tNum}`}
                      </div>

                      <div className="mt-1 pt-1 border-t border-slate-200/60 text-[10px] text-amber-900 font-semibold flex items-center justify-between">
                        <span>Chấm chéo:</span>
                        <span className="bg-amber-200 px-1 rounded font-extrabold text-amber-950">
                          Tổ {crossTarget}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Password Input Form (Mandatory for both) */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-teal-600" />
                  <span>
                    BƯỚC 2: Nhập mật khẩu {selectedRoleType === 'gvcn' ? 'Giáo viên chủ nhiệm' : `Tổ trưởng Tổ ${selectedTeam}`}
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Ẩn' : 'Hiện'}</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={
                    selectedRoleType === 'gvcn' 
                      ? 'Nhập mật khẩu Giáo viên...' 
                      : `Nhập mật khẩu Tổ trưởng Tổ ${selectedTeam}...`
                  }
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setErrorMessage(null);
                  }}
                  className={`w-full bg-slate-50 border rounded-2xl px-4 py-3 text-sm font-mono tracking-wider text-slate-900 focus:bg-white focus:ring-3 outline-hidden transition-all ${
                    errorMessage 
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100 bg-rose-50/50' 
                      : selectedRoleType === 'gvcn' 
                        ? 'border-slate-300 focus:border-teal-500 focus:ring-teal-100' 
                        : 'border-slate-300 focus:border-amber-500 focus:ring-amber-100'
                  }`}
                  autoFocus
                />
              </div>

              {/* Password Helper Actions */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 mt-2 gap-2">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-medium">Bảo mật hệ thống Class Pro</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowKeypad(!showKeypad)}
                    className="text-slate-500 hover:text-slate-700 font-medium text-[11px] underline"
                  >
                    {showKeypad ? 'Ẩn bàn phím số' : 'Hiện bàn phím số'}
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setShowChangePassword(!showChangePassword)}
                    className="text-amber-800 hover:text-amber-950 font-bold text-[11px] underline"
                  >
                    Đổi mật khẩu
                  </button>
                </div>
              </div>
            </div>

            {/* Numeric Keypad for fast touch input */}
            {showKeypad && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 animate-in fade-in">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Bàn phím số nhanh (Phù hợp máy tính bảng & điện thoại)
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Đã nhập: {passwordInput.length} ký tự
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'BACK'].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleKeypadPress(k)}
                      className={`py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-2xs ${
                        k === 'C'
                          ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 font-black'
                          : k === 'BACK'
                          ? 'bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center'
                          : 'bg-white hover:bg-teal-50 hover:border-teal-300 text-slate-800 border border-slate-200'
                      }`}
                    >
                      {k === 'BACK' ? <Delete className="w-4 h-4" /> : k}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message Alert for password change */}
            {changeSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{changeSuccessMsg}</span>
              </div>
            )}

            {/* Change Password Drawer */}
            {showChangePassword && (
              <div className="p-3.5 bg-slate-100 border border-slate-300 rounded-2xl space-y-2 animate-in fade-in text-xs">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>
                    Đặt mật khẩu mới cho{' '}
                    <strong>{selectedRoleType === 'gvcn' ? 'Giáo viên chủ nhiệm' : 'Tổ trưởng'}</strong>:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowChangePassword(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập mật khẩu mới..."
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono outline-hidden focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveNewPassword}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs transition-colors shrink-0"
                  >
                    Lưu mật khẩu mới
                  </button>
                </div>
              </div>
            )}

            {/* Big Action Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm tracking-wide shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2.5 ${
                  selectedRoleType === 'gvcn'
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-teal-700/20'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 shadow-amber-600/25'
                }`}
              >
                {selectedRoleType === 'gvcn' ? (
                  <>
                    <GraduationCap className="w-5 h-5 stroke-[2.5]" />
                    <span>ĐĂNG NHẬP VỚI QUYỀN GIÁO VIÊN</span>
                    <ArrowRight className="w-5 h-5 stroke-[3]" />
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                    <span>VÀO THẲNG MỤC THI ĐUA CHÉO (TỔ {selectedTeam})</span>
                    <ArrowRight className="w-5 h-5 stroke-[3]" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 text-center text-[11px] text-slate-500 flex items-center justify-between">
          <span>Class Pro · Hệ thống quản lý & thi đua học sinh</span>
          <span className="font-semibold text-slate-600">Bảo mật đa cấp độ</span>
        </div>
      </div>
    </div>
  );
};
