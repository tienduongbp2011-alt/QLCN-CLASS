import React, { useState } from 'react';
import { 
  BarChart3, 
  Printer, 
  FileDown, 
  Calendar, 
  Award, 
  UserCheck, 
  Gift, 
  MessageSquare, 
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { 
  ClassInfo, 
  Student, 
  AttendanceRecord, 
  EmulationLog, 
  StudentRemark, 
  RewardRedemption 
} from '../types';
import { sound } from '../utils/audio';

interface ReportsViewProps {
  currentClass: ClassInfo;
  students: Student[];
  attendance: AttendanceRecord[];
  emulationLogs: EmulationLog[];
  remarks: StudentRemark[];
  redemptions: RewardRedemption[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  currentClass,
  students,
  attendance,
  emulationLogs,
  remarks,
  redemptions
}) => {
  const classStudents = students.filter(s => s.classId === currentClass.id);
  const classAttendance = attendance.filter(a => a.classId === currentClass.id);
  const classLogs = emulationLogs.filter(l => l.classId === currentClass.id);
  const classRemarks = remarks.filter(r => r.classId === currentClass.id);
  const classRedemptions = redemptions.filter(r => r.classId === currentClass.id);

  // Time scope filter
  const [timeScope, setTimeScope] = useState<'all' | 'thisMonth' | 'thisWeek'>('all');

  // Attendance stats aggregation
  let totalAttendanceDays = classAttendance.length;
  let totalPresentCount = 0;
  let totalLateCount = 0;
  let totalExcusedCount = 0;
  let totalUnexcusedCount = 0;

  classAttendance.forEach(rec => {
    Object.values(rec.records).forEach(item => {
      if (item.status === 'present') totalPresentCount++;
      else if (item.status === 'late') totalLateCount++;
      else if (item.status === 'excused') totalExcusedCount++;
      else if (item.status === 'unexcused') totalUnexcusedCount++;
    });
  });

  const totalEntries = totalPresentCount + totalLateCount + totalExcusedCount + totalUnexcusedCount;
  const attendanceRate = totalEntries > 0 ? Math.round(((totalPresentCount + totalLateCount) / totalEntries) * 100) : 100;

  // Emulation breakdown
  const plusPointsTotal = classLogs.filter(l => l.points > 0).reduce((sum, l) => sum + l.points, 0);
  const minusPointsTotal = classLogs.filter(l => l.points < 0).reduce((sum, l) => sum + Math.abs(l.points), 0);

  // Export full report to CSV
  const handleExportFullReport = () => {
    const BOM = '\uFEFF';
    const lines = [
      `BÁO CÁO TỔNG HỢP CÔNG TÁC CHỦ NHIỆM LỚP ${currentClass.name.toUpperCase()}`,
      `Năm học: ${currentClass.schoolYear} · GVCN: ${currentClass.teacherName}`,
      `Ngày kết xuất: ${new Date().toLocaleDateString('vi-VN')}`,
      '',
      '--- 1. BÁO CÁO CHUYÊN CẦN ---',
      `Số buổi đã điểm danh: ${totalAttendanceDays}`,
      `Tổng lượt có mặt: ${totalPresentCount}`,
      `Tổng lượt đi muộn: ${totalLateCount}`,
      `Tổng lượt vắng có phép: ${totalExcusedCount}`,
      `Tổng lượt vắng không phép: ${totalUnexcusedCount}`,
      `Tỷ lệ chuyên cần trung bình: ${attendanceRate}%`,
      '',
      '--- 2. TỔNG HỢP THI ĐUA HỌC SINH ---',
      'STT,Mã HS,Họ và tên,Tổ,Chức vụ,Xu thi đua tích lũy'
    ];

    classStudents
      .sort((a, b) => (b.coins || 0) - (a.coins || 0))
      .forEach((s, idx) => {
        lines.push(`${idx + 1},"${s.code}","${s.fullName}","Tổ ${s.team}","${s.role}",${s.coins || 0}`);
      });

    const csvContent = BOM + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_cao_tong_hop_${currentClass.name}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    sound.playClick();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            Báo Cáo & Thống Kê Tổng Hợp
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp dữ liệu chuyên cần, nề nếp thi đua, nhận xét định kỳ và phần thưởng cho giờ sinh hoạt lớp hoặc họp phụ huynh
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportFullReport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <FileDown className="w-4 h-4" />
            Xuất toàn bộ báo cáo CSV
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors no-print"
          >
            <Printer className="w-4 h-4" />
            In báo cáo
          </button>
        </div>
      </div>

      {/* Main KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span>Tỷ lệ chuyên cần</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 tabular-nums">
            {attendanceRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Trên tổng số {totalAttendanceDays} ngày ghi nhận
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span>Điểm khen thưởng (+)</span>
            <Award className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-700 tabular-nums">
            +{plusPointsTotal}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Tổng các lượt làm việc tốt
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span>Lượt cần nhắc nhở (-)</span>
            <TrendingUp className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 tabular-nums">
            -{minusPointsTotal}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Cần phối hợp gia đình
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span>Quà đã trao tặng</span>
            <Gift className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 tabular-nums">
            {classRedemptions.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Món quà đã đổi cho học sinh
          </div>
        </div>
      </div>

      {/* Attendance Summary Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-600" />
          Chi tiết chuyên cần theo các trạng thái
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <span className="text-emerald-800 font-semibold block">Có mặt:</span>
            <span className="text-xl font-bold text-emerald-900 tabular-nums">{totalPresentCount}</span> lượt
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
            <span className="text-amber-800 font-semibold block">Đi muộn:</span>
            <span className="text-xl font-bold text-amber-900 tabular-nums">{totalLateCount}</span> lượt
          </div>

          <div className="p-3 bg-sky-50 rounded-xl border border-sky-100">
            <span className="text-sky-800 font-semibold block">Vắng có phép:</span>
            <span className="text-xl font-bold text-sky-900 tabular-nums">{totalExcusedCount}</span> lượt
          </div>

          <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
            <span className="text-rose-800 font-semibold block">Vắng không phép:</span>
            <span className="text-xl font-bold text-rose-900 tabular-nums">{totalUnexcusedCount}</span> lượt
          </div>
        </div>
      </div>

      {/* Emulation & Leaderboard Breakdown */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            Bảng tổng hợp thi đua cả lớp ({classStudents.length} học sinh)
          </h3>
          <span className="text-xs text-slate-400">
            Sắp xếp theo xu tích lũy
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-3 text-center w-12">Hạng</th>
                <th className="py-2.5 px-3 w-20">Mã HS</th>
                <th className="py-2.5 px-4">Họ và tên</th>
                <th className="py-2.5 px-3 text-center w-16">Tổ</th>
                <th className="py-2.5 px-3 w-28">Chức vụ</th>
                <th className="py-2.5 px-3 text-right w-24">Xu thi đua</th>
                <th className="py-2.5 px-4">Đánh giá chung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classStudents
                .sort((a, b) => (b.coins || 0) - (a.coins || 0))
                .map((st, idx) => (
                  <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500 tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">
                      {st.code}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      {st.fullName}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      Tổ {st.team}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {st.role}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-teal-700 tabular-nums">
                      {st.coins} xu
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {st.coins >= 40 ? 'Rất tích cực, gương mẫu' : st.coins >= 25 ? 'Đạt yêu cầu thi đua' : 'Cần cố gắng thêm'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
