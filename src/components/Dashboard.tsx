import React from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Coins, 
  Award, 
  MessageSquare, 
  CalendarCheck, 
  UserPlus, 
  Disc, 
  UsersRound, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  Lock
} from 'lucide-react';
import { 
  ClassInfo, 
  Student, 
  AttendanceRecord, 
  EmulationLog, 
  Announcement, 
  StudentRemark 
} from '../types';
import { NavItemKey } from './Sidebar';
import { sound } from '../utils/audio';

interface DashboardProps {
  currentClass: ClassInfo;
  students: Student[];
  attendance: AttendanceRecord[];
  emulationLogs: EmulationLog[];
  announcements: Announcement[];
  remarks: StudentRemark[];
  onNavigate: (view: NavItemKey) => void;
  onOpenQuickAddStudent: () => void;
  onClearSampleDataAndStartFresh: () => void;
  onOpenLogin?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentClass,
  students,
  attendance,
  emulationLogs,
  announcements,
  remarks,
  onNavigate,
  onOpenQuickAddStudent,
  onClearSampleDataAndStartFresh,
  onOpenLogin
}) => {
  const classStudents = students.filter(s => s.classId === currentClass.id);
  const totalStudents = classStudents.length;

  // Find today's attendance record
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAttendance = attendance.find(a => a.classId === currentClass.id && a.date === todayStr);

  let presentCount = 0;
  let excusedCount = 0;
  let unexcusedCount = 0;
  let lateCount = 0;

  if (todayAttendance) {
    Object.values(todayAttendance.records).forEach(rec => {
      if (rec.status === 'present') presentCount++;
      else if (rec.status === 'excused') excusedCount++;
      else if (rec.status === 'unexcused') unexcusedCount++;
      else if (rec.status === 'late') lateCount++;
    });
  } else {
    // If not marked today yet, default present for overview if students exist
    presentCount = totalStudents;
  }

  // Total emulation points / coins
  const totalCoins = classStudents.reduce((sum, s) => sum + (s.coins || 0), 0);

  // Commended students (Remarks with 'Tuyên dương' or high score)
  const commendedCount = remarks.filter(r => r.classId === currentClass.id && r.category === 'Tuyên dương').length;

  // Pending notes
  const pendingNotesCount = remarks.filter(r => r.classId === currentClass.id && !r.isResolved).length;

  // Ongoing activities
  const ongoingActivitiesCount = announcements.filter(a => a.classId === currentClass.id).length;

  // Top students by coins / points
  const topStudents = [...classStudents].sort((a, b) => (b.coins || 0) - (a.coins || 0)).slice(0, 5);

  // Emulation history points for chart: last 5 logs or points summary
  const recentLogs = emulationLogs.filter(l => l.classId === currentClass.id).slice(-6);

  // Recent remarks
  const recentRemarks = remarks.filter(r => r.classId === currentClass.id).slice(-3);

  return (
    <div className="space-y-6">
      {/* Sample Data Notice Banner if applicable */}
      {currentClass.isSampleData && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-800 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Đang hiển thị dữ liệu mẫu minh họa ({currentClass.name} - {totalStudents} học sinh)
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Bạn có thể trải nghiệm tất cả tính năng, chỉnh sửa dữ liệu mẫu này, hoặc nhấn nút bên phải để xóa mẫu và khởi tạo lớp trống của bạn.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearSampleDataAndStartFresh}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shadow-xs"
          >
            Khởi tạo lớp trống mới
          </button>
        </div>
      )}

      {/* Hero Welcome & Quick Actions */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 rounded-2xl p-5 lg:p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-md text-white/95">
              Phần mềm QLCN lớp
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Xin chào, {currentClass.teacherName || 'Thầy/Cô giáo'}!
          </h2>
          <p className="text-sm text-teal-100 mt-1 max-w-xl">
            Lớp {currentClass.name} hiện có {totalStudents} học sinh. Chúc Thầy/Cô một ngày giảng dạy hiệu quả và tràn đầy năng lượng!
          </p>
        </div>

        {/* Quick Actions buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              onNavigate('attendance');
              sound.playClick();
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white text-teal-800 hover:bg-teal-50 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <CalendarCheck className="w-4 h-4 text-teal-600" />
            <span>Điểm danh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenQuickAddStudent();
              sound.playClick();
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-teal-800/60 hover:bg-teal-800/80 text-white border border-white/20 rounded-xl text-xs font-bold transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm HS</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onNavigate('wheel');
              sound.playClick();
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-cyan-500/80 hover:bg-cyan-500 text-white border border-white/20 rounded-xl text-xs font-bold transition-all"
          >
            <Disc className="w-4 h-4" />
            <span>Vòng quay</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onNavigate('groups');
              sound.playClick();
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-teal-800/60 hover:bg-teal-800/80 text-white border border-white/20 rounded-xl text-xs font-bold transition-all"
          >
            <UsersRound className="w-4 h-4" />
            <span>Chia nhóm</span>
          </button>
        </div>
      </div>

      {/* Team Leader Cross-Evaluation Entry Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-yellow-500/10 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-amber-950">
                Cổng Đăng Nhập Dành Cho Tổ Trưởng (Chấm Thi Đua Chéo)
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 uppercase">
                Bảo mật PIN
              </span>
            </div>
            <p className="text-xs text-amber-800 mt-1 max-w-xl leading-relaxed">
              Tổ trưởng chỉ cần chọn Tổ của mình và nhập mật khẩu để <strong>vào thẳng giao diện chấm điểm chéo các tổ</strong>. Hệ thống tự động khóa các phân hệ quản lý khác để bảo mật dữ liệu lớp.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onOpenLogin) onOpenLogin();
            sound.playClick();
          }}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-center"
        >
          <KeyRound className="w-4 h-4" />
          <span>Đăng nhập Tổ trưởng ➔</span>
        </button>
      </div>

      {/* 8 Primary Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
        {/* Card 1: Sĩ số */}
        <div 
          onClick={() => onNavigate('students')}
          className="cursor-pointer bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-teal-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Sĩ số học sinh</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {totalStudents}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Đang hoạt động trong lớp</div>
        </div>

        {/* Card 2: Có mặt hôm nay */}
        <div 
          onClick={() => onNavigate('attendance')}
          className="cursor-pointer bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Có mặt hôm nay</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 tabular-nums">
            {presentCount} <span className="text-xs font-normal text-slate-500">/{totalStudents}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalStudents > 0 ? `${Math.round((presentCount / totalStudents) * 100)}% sĩ số` : '0%'}
          </div>
        </div>

        {/* Card 3: Vắng có phép */}
        <div 
          onClick={() => onNavigate('attendance')}
          className="cursor-pointer bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-amber-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Vắng có phép</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 tabular-nums">
            {excusedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Đã có phụ huynh báo trước</div>
        </div>

        {/* Card 4: Vắng không phép */}
        <div 
          onClick={() => onNavigate('attendance')}
          className="cursor-pointer bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-rose-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Vắng không phép</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 tabular-nums">
            {unexcusedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Cần liên hệ gia đình</div>
        </div>

        {/* Card 5: Tổng điểm / Xu thi đua */}
        <div 
          onClick={() => onNavigate('emulation')}
          className="cursor-pointer bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-cyan-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Tổng xu / Điểm thi đua</span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-cyan-700 tabular-nums">
            {totalCoins}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Tích lũy toàn lớp</div>
        </div>

        {/* Card 6: Học sinh được tuyên dương */}
        <div 
          onClick={() => onNavigate('remarks')}
          className="cursor-pointer bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Tuyên dương</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-700 tabular-nums">
            {commendedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Gương tốt trong tuần/tháng</div>
        </div>

        {/* Card 7: Nhắc nhở / Cần hỗ trợ */}
        <div 
          onClick={() => onNavigate('remarks')}
          className="cursor-pointer bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Việc cần theo dõi</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-700 tabular-nums">
            {pendingNotesCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Ghi chú chưa hoàn tất</div>
        </div>

        {/* Card 8: Hoạt động lớp */}
        <div 
          onClick={() => onNavigate('remarks')}
          className="cursor-pointer bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-teal-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Hoạt động & Dặn dò</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {ongoingActivitiesCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Thông báo đang có hiệu lực</div>
        </div>
      </div>

      {/* Grid: Charts & Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1 & 2: Emulation & Attendance Real-data charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart 1: Emulation Activity */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  Diễn biến sự kiện thi đua gần đây
                </h3>
                <p className="text-xs text-slate-500">Các lượt cộng/trừ điểm nề nếp thực tế của lớp</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('emulation')}
                className="text-xs text-teal-600 font-semibold hover:text-teal-700 flex items-center gap-1"
              >
                Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentLogs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Chưa có sự kiện thi đua nào được ghi nhận. Hãy vào mục "Thi đua lớp" để cộng/trừ điểm.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        log.points > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {log.points > 0 ? `+${log.points}` : log.points}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {log.targetName} · <span className="font-normal text-slate-500">{log.criterionName}</span>
                        </div>
                        {log.note && (
                          <div className="text-[11px] text-slate-500">{log.note}</div>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">
                      {log.date}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attendance Breakdown Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900">
                Tỷ lệ chuyên cần ngày {todayStr}
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('attendance')}
                className="text-xs text-teal-600 font-semibold hover:text-teal-700 flex items-center gap-1"
              >
                Vào sổ điểm danh <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {totalStudents > 0 ? (
              <div>
                <div className="h-4 rounded-full bg-slate-100 flex overflow-hidden mb-3">
                  <div 
                    style={{ width: `${(presentCount / totalStudents) * 100}%` }} 
                    className="bg-emerald-500 transition-all duration-500" 
                    title={`Có mặt: ${presentCount}`}
                  />
                  <div 
                    style={{ width: `${(lateCount / totalStudents) * 100}%` }} 
                    className="bg-amber-400 transition-all duration-500" 
                    title={`Đi muộn: ${lateCount}`}
                  />
                  <div 
                    style={{ width: `${(excusedCount / totalStudents) * 100}%` }} 
                    className="bg-sky-400 transition-all duration-500" 
                    title={`Có phép: ${excusedCount}`}
                  />
                  <div 
                    style={{ width: `${(unexcusedCount / totalStudents) * 100}%` }} 
                    className="bg-rose-500 transition-all duration-500" 
                    title={`Không phép: ${unexcusedCount}`}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">Có mặt: <strong className="text-slate-900 tabular-nums">{presentCount}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="text-slate-600">Đi muộn: <strong className="text-slate-900 tabular-nums">{lateCount}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                    <span className="text-slate-600">Có phép: <strong className="text-slate-900 tabular-nums">{excusedCount}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-slate-600">Không phép: <strong className="text-slate-900 tabular-nums">{unexcusedCount}</strong></span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-3">Lớp chưa có học sinh nào.</div>
            )}
          </div>
        </div>

        {/* Col 3: Leaderboard & Quick Notices */}
        <div className="space-y-6">
          {/* Top Students */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Bảng xếp hạng thi đua
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('emulation')}
                className="text-xs text-teal-600 font-semibold hover:text-teal-700"
              >
                Chi tiết
              </button>
            </div>

            {topStudents.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-6">
                Chưa có dữ liệu học sinh.
              </div>
            ) : (
              <div className="space-y-3">
                {topStudents.map((st, idx) => (
                  <div 
                    key={st.id} 
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        idx === 0 
                          ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300' 
                          : idx === 1 
                          ? 'bg-slate-200 text-slate-700' 
                          : idx === 2 
                          ? 'bg-amber-50 text-amber-700' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{st.fullName}</div>
                        <div className="text-[11px] text-slate-500">Tổ {st.team} · {st.role}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-teal-700 tabular-nums">
                        {st.coins} xu
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Notes / Remarks */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                Ghi chú & Nhận xét mới
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('remarks')}
                className="text-xs text-teal-600 font-semibold hover:text-teal-700"
              >
                Xem sổ
              </button>
            </div>

            {recentRemarks.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-6">
                Chưa có nhận xét nào được ghi.
              </div>
            ) : (
              <div className="space-y-3">
                {recentRemarks.map(rem => (
                  <div key={rem.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800">{rem.studentName}</span>
                      <span className="text-[11px] text-teal-700 font-medium bg-teal-50 px-2 py-0.5 rounded">
                        {rem.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {rem.strengths || rem.improvements || rem.supportPlan}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
