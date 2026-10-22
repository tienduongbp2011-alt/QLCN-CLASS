import React from 'react';
import { 
  LayoutDashboard, 
  School, 
  Users, 
  CalendarCheck, 
  MessageSquareQuote, 
  UsersRound, 
  Network, 
  Trophy, 
  BookOpenCheck, 
  Grid3X3, 
  Clock, 
  Wallet, 
  Disc, 
  BarChart3, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  GraduationCap,
  Lock,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { UserRole } from '../types';
import { sound } from '../utils/audio';

export type NavItemKey = 
  | 'dashboard'
  | 'classes'
  | 'students'
  | 'attendance'
  | 'remarks'
  | 'groups'
  | 'teams'
  | 'emulation'
  | 'grades'
  | 'seating'
  | 'timetable'
  | 'fund'
  | 'wheel'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentView: NavItemKey;
  onSelectView: (view: NavItemKey) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  currentUserRole?: UserRole;
  onLogoutToGVCN?: () => void;
  onLogout?: () => void;
}

export const NAV_ITEMS: { key: NavItemKey; label: string; icon: React.ElementType }[] = [
  { key: 'dashboard', label: 'Trang chủ', icon: LayoutDashboard },
  { key: 'classes', label: 'Lớp học', icon: School },
  { key: 'students', label: 'Học sinh', icon: Users },
  { key: 'attendance', label: 'Điểm danh', icon: CalendarCheck },
  { key: 'remarks', label: 'Thông báo & Nhận xét', icon: MessageSquareQuote },
  { key: 'groups', label: 'Chia nhóm học tập', icon: UsersRound },
  { key: 'teams', label: 'Chia tổ học sinh', icon: Network },
  { key: 'emulation', label: 'Thi đua lớp', icon: Trophy },
  { key: 'grades', label: 'Sổ điểm cá nhân', icon: BookOpenCheck },
  { key: 'seating', label: 'Sơ đồ lớp', icon: Grid3X3 },
  { key: 'timetable', label: 'Thời khóa biểu', icon: Clock },
  { key: 'fund', label: 'Quỹ lớp', icon: Wallet },
  { key: 'wheel', label: 'Vòng quay may mắn', icon: Disc },
  { key: 'reports', label: 'Báo cáo thống kê', icon: BarChart3 },
  { key: 'settings', label: 'Cài đặt và dữ liệu', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  currentUserRole = 'gvcn',
  onLogoutToGVCN,
  onLogout
}) => {
  const isTeamLeader = currentUserRole !== 'gvcn';
  const teamNum = isTeamLeader ? currentUserRole.replace('to_', '') : null;

  // Filter items: If team leader, ONLY show emulation!
  const visibleItems = isTeamLeader 
    ? NAV_ITEMS.filter(item => item.key === 'emulation') 
    : NAV_ITEMS;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Bar */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
              isTeamLeader ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-900' : 'bg-gradient-to-tr from-teal-600 to-cyan-500 text-white'
            }`}>
              {isTeamLeader ? <ShieldCheck className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />}
            </div>
            {!collapsed && (
              <div className="whitespace-nowrap overflow-hidden">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight block leading-tight">
                  CLASS PRO
                </span>
                <span className="text-[11px] font-bold text-teal-700 block tracking-wide">
                  {isTeamLeader ? `TỔ TRƯỞNG TỔ ${teamNum}` : 'PHẦN MỀM QLCN LỚP'}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleCollapsed}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={collapsed ? 'Mở rộng thanh menu' : 'Thu gọn thanh menu'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Notice for Team Leader */}
        {isTeamLeader && !collapsed && (
          <div className="mx-2 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1 animate-in fade-in">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              Tài khoản Tổ trưởng {teamNum}
            </div>
            <p className="text-[11px] text-amber-800">
              Đã khóa chức năng: Bạn chỉ được thao tác chấm điểm với danh sách tổ mình được phân công trực.
            </p>
          </div>
        )}

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-3 px-2 custom-scrollbar space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  onSelectView(item.key);
                  onCloseMobile();
                  sound.playClick();
                }}
                title={collapsed ? (isTeamLeader ? 'Chấm thi đua lớp (Tổ trưởng)' : item.label) : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                } ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                {!collapsed && (
                  <span className="whitespace-nowrap truncate font-bold">
                    {isTeamLeader ? 'Chấm thi đua lớp' : item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info in sidebar / Logout button */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60 space-y-2">
          {isTeamLeader ? (
            <button
              type="button"
              onClick={onLogout || onLogoutToGVCN}
              className={`w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs ${
                collapsed ? 'px-0' : 'px-3'
              }`}
              title="Đăng xuất khỏi tài khoản Tổ trưởng"
            >
              <LogOut className="w-4 h-4" />
              {!collapsed && <span>Đăng xuất hệ thống</span>}
            </button>
          ) : (
            <>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className={`w-full py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs ${
                    collapsed ? 'px-0' : 'px-3'
                  }`}
                  title="Đăng xuất khỏi tài khoản Giáo viên"
                >
                  <LogOut className="w-4 h-4" />
                  {!collapsed && <span>Đăng xuất hệ thống</span>}
                </button>
              )}
              {!collapsed && (
                <div className="text-[11px] text-slate-400 text-center leading-relaxed">
                  Class Pro · Trợ lý THPT
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
};
