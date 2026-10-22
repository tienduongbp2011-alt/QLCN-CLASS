import React, { useState } from 'react';
import { 
  School, 
  Plus, 
  Edit2, 
  Check, 
  CheckCircle2, 
  Sparkles, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';
import { ClassInfo, Student } from '../types';
import { sound } from '../utils/audio';

interface ClassManagerProps {
  classes: ClassInfo[];
  activeClassId: string;
  students: Student[];
  onSelectClass: (id: string) => void;
  onCreateClass: (cls: { name: string; grade: string; schoolYear: string; teacherName: string; roomNumber: string }) => void;
  onUpdateClass: (id: string, updates: Partial<ClassInfo>) => void;
  onDeleteClass: (id: string) => void;
  onLoadSampleData: () => void;
}

export const ClassManager: React.FC<ClassManagerProps> = ({
  classes,
  activeClassId,
  students,
  onSelectClass,
  onCreateClass,
  onUpdateClass,
  onDeleteClass,
  onLoadSampleData
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('Khối 10');
  const [schoolYear, setSchoolYear] = useState('2024 - 2025');
  const [teacherName, setTeacherName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  // Delete modal confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const startCreate = () => {
    setName('');
    setGrade('Khối 10');
    setSchoolYear('2024 - 2025');
    setTeacherName('');
    setRoomNumber('');
    setIsCreating(true);
    setEditingId(null);
    sound.playClick();
  };

  const startEdit = (cls: ClassInfo) => {
    setEditingId(cls.id);
    setName(cls.name);
    setGrade(cls.grade);
    setSchoolYear(cls.schoolYear);
    setTeacherName(cls.teacherName);
    setRoomNumber(cls.roomNumber || '');
    setIsCreating(false);
    sound.playClick();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isCreating) {
      onCreateClass({
        name: name.trim(),
        grade: grade.trim(),
        schoolYear: schoolYear.trim(),
        teacherName: teacherName.trim(),
        roomNumber: roomNumber.trim()
      });
      setIsCreating(false);
      sound.playSuccess();
    } else if (editingId) {
      onUpdateClass(editingId, {
        name: name.trim(),
        grade: grade.trim(),
        schoolYear: schoolYear.trim(),
        teacherName: teacherName.trim(),
        roomNumber: roomNumber.trim()
      });
      setEditingId(null);
      sound.playSuccess();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <School className="w-5 h-5 text-teal-600" />
            Quản Lý Lớp Học
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tạo mới, chỉnh sửa thông tin lớp, phân công GVCN và chuyển đổi giữa các lớp đang phụ trách
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tạo lớp mới
          </button>

          <button
            type="button"
            onClick={() => {
              onLoadSampleData();
              sound.playSuccess();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            title="Tải lại bộ dữ liệu mẫu lớp 9/1 (15 học sinh)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Tải dữ liệu mẫu
          </button>
        </div>
      </div>

      {/* Create / Edit Form */}
      {(isCreating || editingId) && (
        <form onSubmit={handleSave} className="bg-teal-50/50 border border-teal-200 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-teal-900">
              {isCreating ? 'Tạo lớp học mới' : 'Chỉnh sửa thông tin lớp học'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingId(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Hủy bỏ
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên lớp <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: Lớp 9/1, Lớp 7A2..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:border-teal-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Khối lớp
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:border-teal-500 outline-hidden"
              >
                <option value="Khối 10">Khối 10</option>
                <option value="Khối 11">Khối 11</option>
                <option value="Khối 12">Khối 12</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Năm học
              </label>
              <input
                type="text"
                placeholder="VD: 2024 - 2025"
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:border-teal-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Giáo viên chủ nhiệm (GVCN)
              </label>
              <input
                type="text"
                placeholder="Họ và tên giáo viên"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:border-teal-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phòng học
              </label>
              <input
                type="text"
                placeholder="VD: Phòng 204 (Dãy A)"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:border-teal-500 outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingId(null);
              }}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              {isCreating ? 'Tạo lớp' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      )}

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => {
          const isCurrent = cls.id === activeClassId;
          const classStudentsCount = students.filter(s => s.classId === cls.id).length;

          return (
            <div
              key={cls.id}
              className={`bg-white border rounded-2xl p-5 shadow-xs transition-all relative ${
                isCurrent 
                  ? 'border-teal-500 ring-2 ring-teal-500/20' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Sample badge */}
              {cls.isSampleData && (
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md mb-2">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Dữ liệu mẫu minh họa
                </div>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    {cls.name}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {cls.grade} · Năm học {cls.schoolYear}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xl font-extrabold text-teal-700 tabular-nums">
                    {classStudentsCount}
                  </span>
                  <span className="block text-[11px] text-slate-400">học sinh</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                <div>
                  <span className="text-slate-400">GVCN: </span>
                  <strong>{cls.teacherName || 'Chưa thiết lập'}</strong>
                </div>
                {cls.roomNumber && (
                  <div>
                    <span className="text-slate-400">Phòng học: </span>
                    <span>{cls.roomNumber}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectClass(cls.id);
                    sound.playClick();
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    isCurrent
                      ? 'bg-teal-50 text-teal-700 border border-teal-200 cursor-default'
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                  }`}
                >
                  {isCurrent ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      Đang chọn làm việc
                    </>
                  ) : (
                    'Chọn lớp này'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => startEdit(cls)}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                  title="Chỉnh sửa thông tin lớp"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {classes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(cls.id)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200"
                    title="Xóa lớp học này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Xác nhận xóa lớp học?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Hành động này sẽ xóa vĩnh viễn lớp học cùng tất cả học sinh và bản ghi liên quan thuộc lớp này. Hành động này không thể hoàn tác!
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteClass(confirmDeleteId);
                  setConfirmDeleteId(null);
                  sound.playSuccess();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
