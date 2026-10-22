import React, { useState } from 'react';
import { 
  UsersRound, 
  Shuffle, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Printer, 
  FileDown, 
  ArrowRightLeft, 
  Sparkles,
  Check,
  CheckCircle2
} from 'lucide-react';
import { Student, StudyGroupPlan, ClassInfo } from '../types';
import { sound } from '../utils/audio';

interface GroupDivisionProps {
  currentClass: ClassInfo;
  students: Student[];
  savedPlans: StudyGroupPlan[];
  onSavePlan: (plan: StudyGroupPlan) => void;
  onDeletePlan: (planId: string) => void;
}

interface WorkingGroup {
  id: string;
  name: string;
  studentIds: string[];
}

export const GroupDivision: React.FC<GroupDivisionProps> = ({
  currentClass,
  students,
  savedPlans,
  onSavePlan,
  onDeletePlan
}) => {
  const classStudents = students.filter(s => s.classId === currentClass.id);
  const classPlans = savedPlans.filter(p => p.classId === currentClass.id);

  // Group config options
  const [splitMode, setSplitMode] = useState<'byGroups' | 'bySize'>('byGroups');
  const [groupCount, setGroupCount] = useState<number>(4);
  const [groupSize, setGroupSize] = useState<number>(4);
  const [method, setMethod] = useState<'random' | 'sequential'>('random');
  const [planTitle, setPlanTitle] = useState('Phương án chia nhóm hoạt động mới');

  // Active working groups
  const [workingGroups, setWorkingGroups] = useState<WorkingGroup[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Move student modal state
  const [movingStudentId, setMovingStudentId] = useState<string | null>(null);

  // Perform split
  const runDivision = () => {
    if (classStudents.length === 0) return;

    let targetNumGroups = 4;
    if (splitMode === 'byGroups') {
      targetNumGroups = Math.max(2, Math.min(groupCount, classStudents.length));
    } else {
      targetNumGroups = Math.max(2, Math.ceil(classStudents.length / Math.max(2, groupSize)));
    }

    let orderedStudents = [...classStudents];
    if (method === 'random') {
      // Fisher-Yates shuffle
      for (let i = orderedStudents.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [orderedStudents[i], orderedStudents[j]] = [orderedStudents[j], orderedStudents[i]];
      }
    }

    const defaultNames = [
      'Nhóm 1 - Khám phá',
      'Nhóm 2 - Sáng tạo',
      'Nhóm 3 - Năng động',
      'Nhóm 4 - Tỏa sáng',
      'Nhóm 5 - Vươn xa',
      'Nhóm 6 - Bứt phá',
      'Nhóm 7 - Đoàn kết',
      'Nhóm 8 - Trí tuệ'
    ];

    const groups: WorkingGroup[] = Array.from({ length: targetNumGroups }, (_, i) => ({
      id: `grp_${Date.now()}_${i}`,
      name: defaultNames[i] || `Nhóm ${i + 1}`,
      studentIds: []
    }));

    // Round-robin distribution so size is balanced
    orderedStudents.forEach((st, idx) => {
      const gIndex = idx % targetNumGroups;
      groups[gIndex].studentIds.push(st.id);
    });

    setWorkingGroups(groups);
    sound.playSuccess();
  };

  // Move student from current group to another group
  const handleMoveStudent = (studentId: string, targetGroupId: string) => {
    setWorkingGroups(prev => {
      return prev.map(g => {
        if (g.studentIds.includes(studentId)) {
          return { ...g, studentIds: g.studentIds.filter(id => id !== studentId) };
        }
        if (g.id === targetGroupId) {
          return { ...g, studentIds: [...g.studentIds, studentId] };
        }
        return g;
      });
    });
    setMovingStudentId(null);
    sound.playClick();
  };

  // Rename a group
  const handleRenameGroup = (groupId: string, newName: string) => {
    setWorkingGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: newName } : g));
  };

  // Save current plan
  const handleSaveCurrentPlan = () => {
    if (workingGroups.length === 0) return;

    const plan: StudyGroupPlan = {
      id: 'plan_' + Date.now().toString(36),
      classId: currentClass.id,
      name: planTitle.trim() || 'Phương án chia nhóm',
      date: new Date().toISOString().slice(0, 10),
      groups: workingGroups.map(g => ({
        id: g.id,
        name: g.name,
        studentIds: g.studentIds
      }))
    };

    onSavePlan(plan);
    setSavedSuccess(true);
    sound.playFanfare();
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Load an existing saved plan
  const handleLoadPlan = (plan: StudyGroupPlan) => {
    setPlanTitle(plan.name);
    setWorkingGroups(plan.groups.map(g => ({
      id: g.id,
      name: g.name,
      studentIds: [...g.studentIds]
    })));
    sound.playClick();
  };

  // Export group list to CSV
  const handleExportCSV = () => {
    if (workingGroups.length === 0) return;

    const BOM = '\uFEFF';
    const headers = ['STT', 'Tên nhóm', 'Mã HS', 'Họ và tên', 'Tổ ban đầu', 'Chức vụ'];
    const rows: string[] = [];

    let counter = 1;
    workingGroups.forEach(g => {
      g.studentIds.forEach(stId => {
        const st = classStudents.find(s => s.id === stId);
        if (st) {
          rows.push([
            counter++,
            `"${g.name}"`,
            `"${st.code}"`,
            `"${st.fullName}"`,
            `"Tổ ${st.team}"`,
            `"${st.role}"`
          ].join(','));
        }
      });
    });

    const csvContent = BOM + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Danh_sach_chia_nhom_${currentClass.name}.csv`;
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
            <UsersRound className="w-5 h-5 text-teal-600" />
            Chia Nhóm Học Tập & Hoạt Động
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Công cụ phân nhóm tự động ngẫu nhiên hoặc theo thứ tự, hỗ trợ di chuyển học sinh và lưu trữ nhiều phương án
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {workingGroups.length > 0 && (
            <>
              <button
                type="button"
                onClick={runDivision}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                title="Trộn lại ngẫu nhiên"
              >
                <Shuffle className="w-3.5 h-3.5 text-slate-600" />
                Trộn lại
              </button>

              <button
                type="button"
                onClick={handleSaveCurrentPlan}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Lưu phương án này
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                title="Xuất danh sách nhóm ra CSV"
              >
                <FileDown className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors no-print"
                title="In danh sách các nhóm"
              >
                <Printer className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600" />
          Đã lưu phương án chia nhóm thành công vào bộ nhớ của lớp!
        </div>
      )}

      {/* Configuration Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-teal-600" />
          Thiết lập tiêu chí phân nhóm ({classStudents.length} học sinh)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tên hoạt động / Phương án</label>
            <input
              type="text"
              value={planTitle}
              onChange={(e) => setPlanTitle(e.target.value)}
              placeholder="VD: Thảo luận bài học, Dự án Stem..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cách thức phân nhóm</label>
            <select
              value={splitMode}
              onChange={(e) => setSplitMode(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-medium"
            >
              <option value="byGroups">Chia theo số lượng nhóm</option>
              <option value="bySize">Chia theo số học sinh / nhóm</option>
            </select>
          </div>

          {splitMode === 'byGroups' ? (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số nhóm mong muốn</label>
              <input
                type="number"
                min="2"
                max={Math.max(2, classStudents.length)}
                value={groupCount}
                onChange={(e) => setGroupCount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-medium tabular-nums"
              />
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số học sinh mỗi nhóm</label>
              <input
                type="number"
                min="2"
                max={Math.max(2, classStudents.length)}
                value={groupSize}
                onChange={(e) => setGroupSize(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-medium tabular-nums"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phương pháp chia</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-medium"
            >
              <option value="random">Trộn ngẫu nhiên (Fair Random)</option>
              <option value="sequential">Lần lượt theo danh sách lớp</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={runDivision}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Shuffle className="w-4 h-4" />
            Tiến hành chia nhóm
          </button>
        </div>
      </div>

      {/* Render Current Working Groups */}
      {workingGroups.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Kết quả: Đã chia thành <strong>{workingGroups.length}</strong> nhóm ({classStudents.length} học sinh)
            </span>
            <span>Mỗi học sinh chỉ thuộc 1 nhóm duy nhất</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {workingGroups.map((group, gIdx) => (
              <div 
                key={group.id} 
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-teal-300 transition-all"
              >
                <div>
                  {/* Group Header (editable name) */}
                  <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b border-slate-100">
                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) => handleRenameGroup(group.id, e.target.value)}
                      className="font-bold text-sm text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white focus:border-teal-400 border border-transparent rounded-lg px-1.5 py-0.5 outline-hidden truncate"
                    />
                    <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full shrink-0 tabular-nums">
                      {group.studentIds.length} em
                    </span>
                  </div>

                  {/* Member cards */}
                  <div className="space-y-1.5">
                    {group.studentIds.map((stId, mIdx) => {
                      const st = classStudents.find(s => s.id === stId);
                      if (!st) return null;

                      return (
                        <div
                          key={st.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="w-4 text-[10px] text-slate-400 font-mono text-center tabular-nums">
                              {mIdx + 1}
                            </span>
                            <div className="truncate">
                              <span className="font-semibold text-slate-800">{st.fullName}</span>
                              <span className="text-[10px] text-slate-400 block">
                                {st.code} · Tổ {st.team}
                              </span>
                            </div>
                          </div>

                          {/* Move to another group button */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setMovingStudentId(movingStudentId === st.id ? null : st.id)}
                              className="p-1 text-slate-400 hover:text-teal-600 rounded-md transition-colors"
                              title="Chuyển sang nhóm khác"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>

                            {movingStudentId === st.id && (
                              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30 animate-in fade-in zoom-in-95">
                                <div className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1">
                                  Chuyển sang nhóm:
                                </div>
                                {workingGroups
                                  .filter(other => other.id !== group.id)
                                  .map(other => (
                                    <button
                                      key={other.id}
                                      type="button"
                                      onClick={() => handleMoveStudent(st.id, other.id)}
                                      className="w-full text-left px-2 py-1 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-800 rounded-lg transition-colors truncate"
                                    >
                                      {other.name} ({other.studentIds.length})
                                    </button>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved Plans History */}
      {classPlans.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            Các phương án chia nhóm đã lưu trước đó ({classPlans.length})
          </h3>

          <div className="space-y-2">
            {classPlans.map(plan => (
              <div 
                key={plan.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{plan.name}</h4>
                  <div className="text-[11px] text-slate-400">
                    Ngày tạo: {plan.date} · Gồm {plan.groups.length} nhóm
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadPlan(plan)}
                    className="px-3 py-1 bg-white border border-slate-200 hover:bg-teal-50 hover:text-teal-700 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                  >
                    Mở lại
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeletePlan(plan.id);
                      sound.playSuccess();
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Xóa phương án này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
