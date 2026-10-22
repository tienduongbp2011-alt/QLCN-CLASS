import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  Check, 
  UserCheck, 
  UserX, 
  Clock, 
  HelpCircle, 
  Save, 
  FileDown, 
  Printer, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Users
} from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus, AttendanceItem, ClassInfo } from '../types';
import { sound } from '../utils/audio';

interface AttendanceViewProps {
  currentClass: ClassInfo;
  students: Student[];
  attendance: AttendanceRecord[];
  onSaveAttendance: (date: string, records: Record<string, AttendanceItem>) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  currentClass,
  students,
  attendance,
  onSaveAttendance
}) => {
  const classStudents = students.filter(s => s.classId === currentClass.id);
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Current working records for the selected date: studentId -> AttendanceItem
  const [records, setRecords] = useState<Record<string, AttendanceItem>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing records when date or class changes
  useEffect(() => {
    const existing = attendance.find(a => a.classId === currentClass.id && a.date === selectedDate);
    const initialMap: Record<string, AttendanceItem> = {};
    
    classStudents.forEach(st => {
      if (existing?.records?.[st.id]) {
        initialMap[st.id] = { ...existing.records[st.id] };
      } else {
        // Default to 'present'
        initialMap[st.id] = { status: 'present' };
      }
    });
    setRecords(initialMap);
    setSaveSuccess(false);
  }, [selectedDate, currentClass.id, attendance, classStudents]);

  const updateStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
    sound.playClick();
  };

  const updateStudentNote = (studentId: string, note: string) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: prev[studentId]?.status || 'present',
        note
      }
    }));
  };

  const handleMarkAllPresent = () => {
    const allPresent: Record<string, AttendanceItem> = {};
    classStudents.forEach(st => {
      allPresent[st.id] = { status: 'present', note: '' };
    });
    setRecords(allPresent);
    sound.playSuccess();
  };

  const handleSave = () => {
    onSaveAttendance(selectedDate, records);
    setSaveSuccess(true);
    sound.playSuccess();
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Quick day navigation
  const changeDateBy = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
    sound.playClick();
  };

  // Stats calculation
  const stats = {
    present: Object.values(records).filter(r => r.status === 'present').length,
    late: Object.values(records).filter(r => r.status === 'late').length,
    excused: Object.values(records).filter(r => r.status === 'excused').length,
    unexcused: Object.values(records).filter(r => r.status === 'unexcused').length,
    other: Object.values(records).filter(r => r.status === 'other').length,
  };

  // Export report to CSV
  const handleExportCSV = () => {
    const BOM = '\uFEFF';
    const headers = ['STT', 'Mã HS', 'Họ và tên', 'Tổ', 'Trạng thái điểm danh', 'Ghi chú / Lý do'];
    const rows = classStudents.map((st, idx) => {
      const rec = records[st.id] || { status: 'present' };
      const statusText = 
        rec.status === 'present' ? 'Có mặt' :
        rec.status === 'late' ? 'Đi muộn' :
        rec.status === 'excused' ? 'Vắng có phép' :
        rec.status === 'unexcused' ? 'Vắng không phép' : 'Lý do khác';
      return [
        idx + 1,
        `"${st.code}"`,
        `"${st.fullName}"`,
        `"Tổ ${st.team}"`,
        `"${statusText}"`,
        `"${(rec.note || '').replace(/"/g, '""')}"`
      ];
    });

    const csv = BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Diem_danh_${currentClass.name}_${selectedDate}.csv`;
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
            <CalendarCheck className="w-5 h-5 text-teal-600" />
            Sổ Điểm Danh Lớp Học
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Điểm danh đầu buổi nhanh chóng, ghi nhận lý do vắng và tổng hợp báo cáo chuyên cần
          </p>
        </div>

        {/* Date Selector and Fast Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Day prev/next picker */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => changeDateBy(-1)}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
              title="Ngày hôm trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 px-2 outline-hidden cursor-pointer"
            />
            <button
              type="button"
              onClick={() => changeDateBy(1)}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
              title="Ngày hôm sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleMarkAllPresent}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors"
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Cả lớp có mặt
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            Lưu điểm danh
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            title="Xuất danh sách điểm danh ra CSV"
          >
            <FileDown className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors no-print"
            title="In sổ điểm danh"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          Đã lưu thành công dữ liệu điểm danh ngày {selectedDate}!
        </div>
      )}

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-emerald-100 p-3.5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-emerald-700">Có mặt</div>
            <div className="text-xl font-extrabold text-emerald-800 tabular-nums">{stats.present}</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-amber-100 p-3.5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-amber-700">Đi muộn</div>
            <div className="text-xl font-extrabold text-amber-800 tabular-nums">{stats.late}</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-sky-100 p-3.5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-sky-700">Vắng có phép</div>
            <div className="text-xl font-extrabold text-sky-800 tabular-nums">{stats.excused}</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <UserX className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-rose-100 p-3.5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-rose-700">Vắng không phép</div>
            <div className="text-xl font-extrabold text-rose-800 tabular-nums">{stats.unexcused}</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <UserX className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-600">Lý do khác</div>
            <div className="text-xl font-extrabold text-slate-800 tabular-nums">{stats.other}</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Attendance Student List (Touch friendly cards / rows) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700">
            Danh sách học sinh điểm danh ({classStudents.length} em)
          </div>
          <div className="text-xs text-slate-400">
            Nhấn vào các nút trạng thái hoặc ghi chú trực tiếp
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {classStudents.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Lớp chưa có học sinh nào. Vui lòng thêm học sinh trước.
            </div>
          ) : (
            classStudents.map((st, idx) => {
              const curItem = records[st.id] || { status: 'present' };

              return (
                <div 
                  key={st.id} 
                  className="p-3.5 sm:px-5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  {/* Left: Info */}
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-slate-400 font-mono text-xs tabular-nums">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{st.fullName}</span>
                        <span className="text-[11px] font-mono text-slate-400">({st.code})</span>
                        <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          Tổ {st.team}
                        </span>
                      </div>
                      {st.parentPhone && (
                        <div className="text-[11px] text-slate-400">SĐT PH: {st.parentPhone}</div>
                      )}
                    </div>
                  </div>

                  {/* Right: Touch status buttons & Note input */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                    {/* Status Buttons Segment */}
                    <div className="grid grid-cols-5 gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => updateStudentStatus(st.id, 'present')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          curItem.status === 'present'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Có mặt
                      </button>

                      <button
                        type="button"
                        onClick={() => updateStudentStatus(st.id, 'late')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          curItem.status === 'late'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Muộn
                      </button>

                      <button
                        type="button"
                        onClick={() => updateStudentStatus(st.id, 'excused')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          curItem.status === 'excused'
                            ? 'bg-sky-500 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Có phép
                      </button>

                      <button
                        type="button"
                        onClick={() => updateStudentStatus(st.id, 'unexcused')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          curItem.status === 'unexcused'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        K.Phép
                      </button>

                      <button
                        type="button"
                        onClick={() => updateStudentStatus(st.id, 'other')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          curItem.status === 'other'
                            ? 'bg-slate-700 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Khác
                      </button>
                    </div>

                    {/* Note input */}
                    <input
                      type="text"
                      placeholder="Lý do / Ghi chú..."
                      value={curItem.note || ''}
                      onChange={(e) => updateStudentNote(st.id, e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-500 outline-hidden w-full sm:w-44"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Đừng quên bấm nút <strong>Lưu điểm danh</strong> sau khi hoàn thành.
          </span>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            Lưu điểm danh
          </button>
        </div>
      </div>
    </div>
  );
};
