import React, { useState } from 'react';
import { 
  Network, 
  Crown, 
  ShieldCheck, 
  Printer, 
  UserCheck, 
  ArrowRightLeft, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Student, StudentRole, ClassInfo } from '../types';
import { sound } from '../utils/audio';

interface TeamManagerProps {
  currentClass: ClassInfo;
  students: Student[];
  onUpdateStudent: (id: string, updates: Partial<Student>) => void;
}

export const TeamManager: React.FC<TeamManagerProps> = ({
  currentClass,
  students,
  onUpdateStudent
}) => {
  const classStudents = students.filter(s => s.classId === currentClass.id);

  // 4 Standard teams
  const teams = [1, 2, 3, 4];
  const [movingStudentId, setMovingStudentId] = useState<string | null>(null);

  // Unassigned students check
  const unassigned = classStudents.filter(s => !s.team || s.team < 1 || s.team > 4);

  const handleSetRole = (student: Student, newRole: StudentRole) => {
    onUpdateStudent(student.id, { role: newRole });
    sound.playSuccess();
  };

  const handleMoveToTeam = (studentId: string, newTeam: number) => {
    onUpdateStudent(studentId, { team: newTeam });
    setMovingStudentId(null);
    sound.playClick();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Network className="w-5 h-5 text-teal-600" />
            Quản Lý 4 Tổ Học Sinh
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân bổ thành viên vào các tổ, bổ nhiệm Tổ trưởng, Tổ phó và cân bằng sĩ số giữa các tổ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors no-print"
          >
            <Printer className="w-4 h-4" />
            In danh sách các tổ
          </button>
        </div>
      </div>

      {/* Warning for unassigned students if any */}
      {unassigned.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <strong>Có {unassigned.length} học sinh chưa được phân vào tổ nào: </strong>
            {unassigned.map(u => u.fullName).join(', ')}.
          </div>
        </div>
      )}

      {/* 4 Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {teams.map((tNum) => {
          const members = classStudents.filter(s => s.team === tNum);
          const leader = members.find(s => s.role === 'Tổ trưởng');
          const deputy = members.find(s => s.role === 'Tổ phó');
          const totalTeamCoins = members.reduce((sum, s) => sum + (s.coins || 0), 0);

          return (
            <div 
              key={tNum} 
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-teal-300 transition-all"
            >
              <div>
                {/* Team Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Tổ {tNum}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {members.length} thành viên · {totalTeamCoins} xu
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 font-extrabold flex items-center justify-center text-sm">
                    {tNum}
                  </div>
                </div>

                {/* Team Leaders highlight */}
                <div className="space-y-1.5 mb-3 bg-slate-50 p-2.5 rounded-xl text-xs border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-700 font-semibold flex items-center gap-1 text-[11px]">
                      <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      Tổ trưởng:
                    </span>
                    <span className="font-bold text-slate-800 truncate max-w-[120px]">
                      {leader ? leader.fullName : <span className="text-slate-400 italic font-normal">Chưa gán</span>}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sky-700 font-semibold flex items-center gap-1 text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
                      Tổ phó:
                    </span>
                    <span className="font-bold text-slate-800 truncate max-w-[120px]">
                      {deputy ? deputy.fullName : <span className="text-slate-400 italic font-normal">Chưa gán</span>}
                    </span>
                  </div>
                </div>

                {/* Member List */}
                <div className="space-y-1.5">
                  {members.map((st, idx) => (
                    <div 
                      key={st.id}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-100/80 hover:bg-slate-100/80 flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="truncate flex-1 pr-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 truncate">{st.fullName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <span>{st.code}</span>
                          {st.role !== 'Thành viên' && (
                            <span className="font-medium text-teal-700 bg-teal-50 px-1 rounded">
                              {st.role}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Move / Role options */}
                      <div className="flex items-center gap-1 shrink-0 relative">
                        {/* Switch team dropdown */}
                        <button
                          type="button"
                          onClick={() => setMovingStudentId(movingStudentId === st.id ? null : st.id)}
                          className="p-1 text-slate-400 hover:text-teal-600 rounded-md transition-colors"
                          title="Đổi tổ hoặc bổ nhiệm chức vụ"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>

                        {movingStudentId === st.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-30 animate-in fade-in zoom-in-95 text-xs">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Chuyển sang:</div>
                            {teams.filter(num => num !== tNum).map(targetTeam => (
                              <button
                                key={targetTeam}
                                type="button"
                                onClick={() => handleMoveToTeam(st.id, targetTeam)}
                                className="w-full text-left px-2 py-1 hover:bg-teal-50 rounded-lg text-slate-700 transition-colors"
                              >
                                Sang Tổ {targetTeam}
                              </button>
                            ))}
                            <div className="border-t border-slate-100 my-1"></div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Gán chức vụ:</div>
                            <button
                              type="button"
                              onClick={() => {
                                handleSetRole(st, 'Tổ trưởng');
                                setMovingStudentId(null);
                              }}
                              className="w-full text-left px-2 py-1 hover:bg-amber-50 text-amber-900 rounded-lg transition-colors font-medium"
                            >
                              Đặt làm Tổ trưởng
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleSetRole(st, 'Tổ phó');
                                setMovingStudentId(null);
                              }}
                              className="w-full text-left px-2 py-1 hover:bg-sky-50 text-sky-900 rounded-lg transition-colors font-medium"
                            >
                              Đặt làm Tổ phó
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleSetRole(st, 'Thành viên');
                                setMovingStudentId(null);
                              }}
                              className="w-full text-left px-2 py-1 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                            >
                              Hạ làm Thành viên
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer team summary */}
              <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                {members.length === 0 ? 'Tổ chưa có học sinh' : `Chiếm ${Math.round((members.length / Math.max(1, classStudents.length)) * 100)}% sĩ số lớp`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
