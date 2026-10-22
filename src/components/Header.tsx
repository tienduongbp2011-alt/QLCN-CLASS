import React, { useState } from 'react';
import { 
  GraduationCap, 
  Users, 
  Calendar, 
  Volume2, 
  VolumeX, 
  Database, 
  CheckCircle2, 
  ChevronDown, 
  Settings, 
  Edit3, 
  Layers,
  ShieldCheck,
  LogOut,
  KeyRound,
  UserCheck,
  Lock
} from 'lucide-react';
import { ClassInfo, UserRole, Student } from '../types';
import { sound } from '../utils/audio';

interface HeaderProps {
  currentClass: ClassInfo;
  allClasses: ClassInfo[];
  students: Student[];
  studentCount: number;
  onSelectClass: (id: string) => void;
  onOpenClassManager: () => void;
  onOpenSettings: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onUpdateTeacherName: (name: string) => void;
  currentUserRole: UserRole;
  onOpenLogin: () => void;
  onLogoutToGVCN: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentClass,
  allClasses,
  students,
  studentCount,
  onSelectClass,
  onOpenClassManager,
  onOpenSettings,
  soundEnabled,
  onToggleSound,
  onUpdateTeacherName,
  currentUserRole,
  onOpenLogin,
  onLogoutToGVCN,
  onLogout
}) => {
  const [isEditingTeacher, setIsEditingTeacher] = useState(false);
  const [teacherInput, setTeacherInput] = useState(currentClass.teacherName);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);

  // Format Vietnamese date
  const today = new Date();
  const dateStr = today.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const isTeamLeader = currentUserRole !== 'gvcn';
  const teamNum = isTeamLeader ? Number(currentUserRole.replace('to_', '')) : null;
  const currentLeader = teamNum ? students.find(s => s.classId === currentClass.id && s.team === teamNum && s.role === 'Tổ trưởng') : undefined;

  const handleSaveTeacher = () => {
    if (teacherInput.trim()) {
      onUpdateTeacherName(teacherInput.trim());
    }
    setIsEditingTeacher(false);
    sound.playClick();
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-6 py-2.5 shadow-xs transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Class identity & Quick stats */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${
              isTeamLeader ? 'bg-amber-500 text-slate-900' : 'bg-teal-600 text-white'
            }`}>
              {isTeamLeader ? <ShieldCheck className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
            </div>
            
            {/* Class info (Non-dropdown for team leader) */}
            {isTeamLeader ? (
              <div className="px-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-slate-900 tracking-tight">
                    {currentClass.name}
                  </span>
                  <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                    {currentClass.grade}
                  </span>
                </div>
                <span className="text-xs text-slate-500 block">
                  Năm học: {currentClass.schoolYear}
                </span>
              </div>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setClassDropdownOpen(!classDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors text-left"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-bold text-slate-900 tracking-tight">
                        {currentClass.name}
                      </span>
                      <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                        {currentClass.grade}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 block">
                      Năm học: {currentClass.schoolYear}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {classDropdownOpen && (
                  <div 
                    className="absolute left-0 top-full mt-1.5 w-60 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onMouseLeave={() => setClassDropdownOpen(false)}
                  >
                    <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Danh sách lớp học
                    </div>
                    {allClasses.map(cls => (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => {
                          onSelectClass(cls.id);
                          setClassDropdownOpen(false);
                          sound.playClick();
                        }}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          cls.id === currentClass.id ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        <span>{cls.name} ({cls.grade})</span>
                        {cls.id === currentClass.id && (
                          <CheckCircle2 className="w-4 h-4 text-teal-600" />
                        )}
                      </button>
                    ))}
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      type="button"
                      onClick={() => {
                        setClassDropdownOpen(false);
                        onOpenClassManager();
                        sound.playClick();
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-teal-600 hover:bg-teal-50 flex items-center gap-1.5"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Quản lý & Thêm lớp mới...
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="hidden sm:block h-6 w-px bg-slate-200" />

          {/* Sĩ số & Date info */}
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Sĩ số: <strong className="text-slate-900 tabular-nums">{studentCount}</strong></span>
            </div>

            <div className="hidden md:flex items-center gap-1 text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="capitalize">{dateStr}</span>
            </div>
          </div>
        </div>

        {/* Right: Account status, Role badge, Sound, Settings */}
        <div className="flex items-center justify-between lg:justify-end gap-2.5 flex-wrap">
          {/* USER ACCOUNT BADGE / SWITCHER */}
          {isTeamLeader ? (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-xl shadow-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <div className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                  <span>Tổ trưởng Tổ {teamNum}</span>
                  {currentLeader && <span className="text-amber-800 font-semibold">({currentLeader.fullName})</span>}
                </div>
                <div className="text-[10px] text-amber-700 font-medium flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Chỉ chấm điểm tổ được phân công trực
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout || onLogoutToGVCN}
                className="ml-2 px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                title="Đăng xuất khỏi tài khoản Tổ trưởng"
              >
                <LogOut className="w-3 h-3" />
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Homeroom teacher name (editable inline) */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
                <span className="text-slate-400">GVCN:</span>
                {isEditingTeacher ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={teacherInput}
                      onChange={(e) => setTeacherInput(e.target.value)}
                      className="bg-white border border-teal-500 rounded px-1.5 py-0.5 text-xs text-slate-800 outline-hidden w-36"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTeacher()}
                    />
                    <button
                      type="button"
                      onClick={handleSaveTeacher}
                      className="text-xs bg-teal-600 text-white px-2 py-0.5 rounded font-medium hover:bg-teal-700"
                    >
                      Lưu
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setTeacherInput(currentClass.teacherName);
                      setIsEditingTeacher(true);
                    }}
                    className="font-bold text-slate-800 hover:text-teal-700 flex items-center gap-1 group"
                    title="Nhấn để sửa tên giáo viên chủ nhiệm"
                  >
                    <span>{currentClass.teacherName || 'Cô Mai Hoa'}</span>
                    <Edit3 className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100" />
                  </button>
                )}
              </div>

              {/* Login / Switch Account Button for Team Leaders */}
              <button
                type="button"
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl text-xs font-extrabold transition-all shadow-2xs group"
                title="Đăng nhập mật khẩu cho Tổ trưởng vào thẳng mục thi đua lớp để chấm điểm chéo"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                <span>Đổi quyền Tổ trưởng</span>
              </button>

              {/* Logout button for Teacher */}
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 border border-slate-200 hover:border-rose-300 rounded-xl text-xs font-bold transition-all shadow-2xs"
                  title="Đăng xuất khỏi hệ thống"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              )}
            </div>
          )}

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              onToggleSound();
              sound.playClick();
            }}
            className={`p-2 rounded-xl border text-xs font-medium transition-colors ${
              soundEnabled 
                ? 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100' 
                : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
            }`}
            title={soundEnabled ? 'Đang bật âm thanh (Nhấn để tắt)' : 'Đang tắt âm thanh (Nhấn để bật)'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Settings & Backup (Only for GVCN) */}
          {!isTeamLeader && (
            <button
              type="button"
              onClick={() => {
                onOpenSettings();
                sound.playClick();
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              title="Cài đặt & Sao lưu dữ liệu"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Cài đặt</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
