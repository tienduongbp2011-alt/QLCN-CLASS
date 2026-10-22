import React, { useState } from 'react';
import { 
  Clock, 
  Edit3, 
  Printer, 
  Save, 
  Check, 
  Sun, 
  Moon, 
  Sparkles,
  X 
} from 'lucide-react';
import { TimetableSchedule, TimetablePeriod, ClassInfo, THPT_SUBJECTS } from '../types';
import { sound } from '../utils/audio';

interface TimetableProps {
  currentClass: ClassInfo;
  schedule: TimetableSchedule;
  onSaveSchedule: (schedule: TimetableSchedule) => void;
}

const DAYS = [
  { day: 2, label: 'Thứ Hai' },
  { day: 3, label: 'Thứ Ba' },
  { day: 4, label: 'Thứ Tư' },
  { day: 5, label: 'Thứ Năm' },
  { day: 6, label: 'Thứ Sáu' },
  { day: 7, label: 'Thứ Bảy' },
];

export const Timetable: React.FC<TimetableProps> = ({
  currentClass,
  schedule,
  onSaveSchedule
}) => {
  const [workingSchedule, setWorkingSchedule] = useState<TimetableSchedule>(schedule);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit period modal
  const [editingPeriod, setEditingPeriod] = useState<{
    isMorning: boolean;
    day: number;
    period: number;
    subject: string;
    teacher: string;
    room: string;
  } | null>(null);

  const getPeriod = (isMorning: boolean, day: number, period: number): TimetablePeriod => {
    const list = isMorning ? workingSchedule.morning[day] : workingSchedule.afternoon[day];
    return list?.find(p => p.period === period) || { period, subject: '', teacher: '', room: '' };
  };

  const openEdit = (isMorning: boolean, day: number, period: number) => {
    const p = getPeriod(isMorning, day, period);
    setEditingPeriod({
      isMorning,
      day,
      period,
      subject: p.subject || '',
      teacher: p.teacher || '',
      room: p.room || ''
    });
    sound.playClick();
  };

  const handleSavePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPeriod) return;

    const { isMorning, day, period, subject, teacher, room } = editingPeriod;
    const targetKey = isMorning ? 'morning' : 'afternoon';

    const dayList = [...(workingSchedule[targetKey][day] || [])].filter(p => p.period !== period);
    if (subject.trim()) {
      dayList.push({
        period,
        subject: subject.trim(),
        teacher: teacher.trim(),
        room: room.trim()
      });
    }

    const updated: TimetableSchedule = {
      ...workingSchedule,
      [targetKey]: {
        ...workingSchedule[targetKey],
        [day]: dayList
      }
    };

    setWorkingSchedule(updated);
    onSaveSchedule(updated);
    setEditingPeriod(null);
    sound.playSuccess();
  };

  const handleSaveAll = () => {
    onSaveSchedule(workingSchedule);
    setSaveSuccess(true);
    sound.playSuccess();
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            Thời Khóa Biểu Lớp Học
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lịch học chi tiết buổi sáng và buổi chiều từ Thứ 2 đến Thứ 7, chạm vào từng tiết để chỉnh sửa môn học
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveAll}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            Lưu thời khóa biểu
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors no-print"
            title="In thời khóa biểu"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600" />
          Đã lưu thời khóa biểu thành công!
        </div>
      )}

      {/* Morning Schedule */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-teal-50/60 border-b border-teal-100 flex items-center gap-2 font-bold text-xs text-teal-900">
          <Sun className="w-4 h-4 text-amber-500" />
          BUỔI SÁNG (Tiết 1 đến Tiết 5)
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
              <tr>
                <th className="py-3 px-3 w-16 border-r border-slate-200">Tiết</th>
                {DAYS.map(d => (
                  <th key={d.day} className="py-3 px-3 border-r border-slate-200 min-w-[120px]">
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[1, 2, 3, 4, 5].map(period => (
                <tr key={period} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-2 font-bold text-slate-400 bg-slate-50/50 border-r border-slate-200 tabular-nums">
                    Tiết {period}
                  </td>
                  {DAYS.map(d => {
                    const p = getPeriod(true, d.day, period);
                    return (
                      <td 
                        key={d.day}
                        onClick={() => openEdit(true, d.day, period)}
                        className="py-2.5 px-3 border-r border-slate-200 cursor-pointer hover:bg-teal-50/70 transition-colors text-left"
                      >
                        {p.subject ? (
                          <div>
                            <span className="font-bold text-slate-900 block">{p.subject}</span>
                            {p.teacher && (
                              <span className="text-[10px] text-slate-500 block truncate">{p.teacher}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 italic text-[11px]">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Afternoon Schedule */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-indigo-50/60 border-b border-indigo-100 flex items-center gap-2 font-bold text-xs text-indigo-900">
          <Moon className="w-4 h-4 text-indigo-500" />
          BUỔI CHIỀU (Bồi dưỡng / Hoạt động ngoại khóa / CLB)
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
              <tr>
                <th className="py-3 px-3 w-16 border-r border-slate-200">Tiết</th>
                {DAYS.map(d => (
                  <th key={d.day} className="py-3 px-3 border-r border-slate-200 min-w-[120px]">
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[1, 2, 3, 4].map(period => (
                <tr key={period} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-2 font-bold text-slate-400 bg-slate-50/50 border-r border-slate-200 tabular-nums">
                    Tiết {period}
                  </td>
                  {DAYS.map(d => {
                    const p = getPeriod(false, d.day, period);
                    return (
                      <td 
                        key={d.day}
                        onClick={() => openEdit(false, d.day, period)}
                        className="py-2.5 px-3 border-r border-slate-200 cursor-pointer hover:bg-indigo-50/70 transition-colors text-left"
                      >
                        {p.subject ? (
                          <div>
                            <span className="font-bold text-slate-900 block">{p.subject}</span>
                            {p.teacher && (
                              <span className="text-[10px] text-slate-500 block truncate">{p.teacher}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 italic text-[11px]">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Period Modal */}
      {editingPeriod && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Sửa môn học: {editingPeriod.isMorning ? 'Buổi sáng' : 'Buổi chiều'} · Tiết {editingPeriod.period}
              </h3>
              <button
                type="button"
                onClick={() => setEditingPeriod(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePeriod} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên môn học (THPT)</label>
                <input
                  type="text"
                  placeholder="VD: Toán, Ngữ văn, Vật lí, Tiếng Anh (hoặc để trống)..."
                  value={editingPeriod.subject}
                  onChange={(e) => setEditingPeriod({ ...editingPeriod, subject: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-semibold"
                  autoFocus
                />
                <div className="mt-1.5 flex flex-wrap gap-1 max-h-20 overflow-y-auto custom-scrollbar p-1 bg-slate-50 border border-slate-200 rounded-lg">
                  {['Chào cờ', ...THPT_SUBJECTS, 'Sinh hoạt lớp'].map(sub => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setEditingPeriod({ ...editingPeriod, subject: sub })}
                      className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                        editingPeriod.subject === sub 
                          ? 'bg-teal-600 text-white font-bold' 
                          : 'bg-white hover:bg-teal-50 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Giáo viên phụ trách</label>
                <input
                  type="text"
                  placeholder="VD: Thầy Nam, Cô Hương..."
                  value={editingPeriod.teacher}
                  onChange={(e) => setEditingPeriod({ ...editingPeriod, teacher: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phòng học (nếu có)</label>
                <input
                  type="text"
                  placeholder="VD: Lab Tin học, Nhà đa năng..."
                  value={editingPeriod.room}
                  onChange={(e) => setEditingPeriod({ ...editingPeriod, room: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPeriod({ ...editingPeriod, subject: '', teacher: '', room: '' })}
                  className="text-rose-600 hover:underline text-[11px]"
                >
                  Xóa tiết này
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPeriod(null)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-xs"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
