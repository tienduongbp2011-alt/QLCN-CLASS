import React, { useState, useMemo } from 'react';
import { 
  BookOpenCheck, 
  Plus, 
  Trash2, 
  Printer, 
  FileDown, 
  FileSpreadsheet,
  Upload,
  Search, 
  Filter, 
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Download,
  X
} from 'lucide-react';
import { GradeEntry, Student, ClassInfo, THPT_SUBJECTS, THPTSubject } from '../types';
import { sound } from '../utils/audio';
import { 
  parseGradesExcelFile, 
  downloadGradeTemplateExcel, 
  exportGradesToExcel,
  ParsedGradesResult 
} from '../utils/excel';

interface GradebookViewProps {
  currentClass: ClassInfo;
  students: Student[];
  grades: GradeEntry[];
  onAddGrade: (grade: Omit<GradeEntry, 'id'>) => void;
  onBatchAddGrades?: (grades: Omit<GradeEntry, 'id'>[]) => void;
  onDeleteGrade: (id: string) => void;
}

const GRADE_TYPES: GradeEntry['gradeType'][] = [
  'ĐGTX 1',
  'ĐGTX 2',
  'ĐGTX 3',
  'ĐGTX 4',
  'Giữa kỳ',
  'Cuối kỳ'
];

export const GradebookView: React.FC<GradebookViewProps> = ({
  currentClass,
  students,
  grades,
  onAddGrade,
  onBatchAddGrades,
  onDeleteGrade
}) => {
  const classStudents = useMemo(() => {
    return students.filter(s => s.classId === currentClass.id);
  }, [students, currentClass.id]);

  const classGrades = useMemo(() => {
    return grades.filter(g => g.classId === currentClass.id);
  }, [grades, currentClass.id]);

  // Filters & Search
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('all');
  const [selectedGradeType, setSelectedGradeType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add Single Grade Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentId, setStudentId] = useState<string>(classStudents[0]?.id || '');
  const [subject, setSubject] = useState<string>('Toán');
  const [gradeType, setGradeType] = useState<GradeEntry['gradeType']>('ĐGTX 1');
  const [score, setScore] = useState<number>(8.5);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState<string>('');

  // Import Excel Modal States
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTemplateSubject, setImportTemplateSubject] = useState<string>('Toán');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedGradesResult | null>(null);
  const [importSuccessBanner, setImportSuccessBanner] = useState<string | null>(null);

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;

    onAddGrade({
      classId: currentClass.id,
      studentId,
      subject,
      gradeType,
      score: Math.min(10, Math.max(0, Number(score))),
      date,
      note: note.trim()
    });

    sound.playSuccess();
    setShowAddModal(false);
    setNote('');
  };

  // Filtered grades
  const filteredGrades = useMemo(() => {
    return classGrades.filter(g => {
      const matchSubject = selectedSubject === 'all' || g.subject === selectedSubject;
      const matchStudent = selectedStudentFilter === 'all' || g.studentId === selectedStudentFilter;
      const matchType = selectedGradeType === 'all' || g.gradeType === selectedGradeType;

      const student = classStudents.find(s => s.id === g.studentId);
      const studentName = student?.fullName?.toLowerCase() || '';
      const studentCode = student?.code?.toLowerCase() || '';
      const query = searchQuery.trim().toLowerCase();
      const matchSearch = !query || studentName.includes(query) || studentCode.includes(query) || (g.note || '').toLowerCase().includes(query);

      return matchSubject && matchStudent && matchType && matchSearch;
    });
  }, [classGrades, selectedSubject, selectedStudentFilter, selectedGradeType, searchQuery, classStudents]);

  // Overall Statistics
  const stats = useMemo(() => {
    const scores = filteredGrades.map(g => g.score);
    const count = scores.length;
    if (count === 0) {
      return { count: 0, avg: 0, max: 0, min: 0, passCount: 0, passRate: 0, goodCount: 0, goodRate: 0 };
    }
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = Math.round((sum / count) * 10) / 10;
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const passCount = scores.filter(s => s >= 5.0).length;
    const goodCount = scores.filter(s => s >= 8.0).length;
    return {
      count,
      avg,
      max,
      min,
      passCount,
      passRate: Math.round((passCount / count) * 100),
      goodCount,
      goodRate: Math.round((goodCount / count) * 100)
    };
  }, [filteredGrades]);

  // Handle Excel file selection
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setParsedResult(null);

    try {
      const result = await parseGradesExcelFile(file, currentClass.id, classStudents, importTemplateSubject);
      setParsedResult(result);
      if (result.grades.length > 0) {
        sound.playSuccess();
      } else {
        sound.playClick();
      }
    } catch (err: any) {
      setParsedResult({
        grades: [],
        errors: [`Lỗi khi đọc tệp Excel: ${err?.message || 'Định dạng tệp không hợp lệ'}`],
        warnings: [],
        totalRows: 0,
        matchedStudentsCount: 0
      });
    } finally {
      setIsProcessingFile(false);
      e.target.value = '';
    }
  };

  // Confirm import parsed grades
  const handleConfirmImport = () => {
    if (!parsedResult || parsedResult.grades.length === 0) return;

    if (onBatchAddGrades) {
      onBatchAddGrades(parsedResult.grades);
    } else {
      parsedResult.grades.forEach(g => onAddGrade(g));
    }

    sound.playFanfare();
    setImportSuccessBanner(`Đã nhập thành công ${parsedResult.grades.length} điểm số vào sổ cá nhân.`);
    setShowImportModal(false);
    setParsedResult(null);

    setTimeout(() => {
      setImportSuccessBanner(null);
    }, 6000);
  };

  // Download template
  const handleDownloadTemplate = () => {
    downloadGradeTemplateExcel(currentClass, classStudents, importTemplateSubject);
    sound.playClick();
  };

  // Export to Excel
  const handleExportExcel = () => {
    exportGradesToExcel(
      currentClass.name,
      currentClass.teacherName,
      filteredGrades,
      classStudents,
      selectedSubject
    );
    sound.playClick();
  };

  // Export to CSV fallback
  const handleExportCSV = () => {
    const BOM = '\uFEFF';
    const headers = ['STT', 'Mã HS', 'Họ và tên', 'Môn học (THPT)', 'Loại điểm', 'Điểm số', 'Ngày ghi', 'Ghi chú'];
    const rows = filteredGrades.map((g, idx) => {
      const st = classStudents.find(s => s.id === g.studentId);
      return [
        idx + 1,
        `"${st?.code || ''}"`,
        `"${st?.fullName || ''}"`,
        `"${g.subject}"`,
        `"${g.gradeType}"`,
        g.score,
        `"${g.date}"`,
        `"${(g.note || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = BOM + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `So_diem_THPT_${currentClass.name.replace(/\s+/g, '_')}_${selectedSubject === 'all' ? 'TongHop' : selectedSubject}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    sound.playClick();
  };

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {importSuccessBanner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importSuccessBanner}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setImportSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpenCheck className="w-5 h-5 text-teal-600" />
              Sổ Điểm Cá Nhân – Bậc THPT
            </h2>
            <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-bold px-2 py-0.5 rounded-md">
              Chương trình GDPT THPT
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Sổ ghi chép nội bộ giúp GVCN theo dõi điểm ĐGTX và định kỳ theo đúng danh mục môn học Trung học Phổ thông
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Import Excel Button */}
          <button
            type="button"
            onClick={() => {
              setShowImportModal(true);
              sound.playClick();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            title="Nhập điểm từ tệp Excel (.xlsx, .xls)"
          >
            <Upload className="w-4 h-4" />
            Nhập từ Excel
          </button>

          {/* Add Manual Grade */}
          <button
            type="button"
            onClick={() => {
              setShowAddModal(true);
              sound.playClick();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ghi điểm thủ công
          </button>

          {/* Export to Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
            title="Xuất bảng điểm ra Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Xuất Excel
          </button>

          {/* Export CSV Fallback */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            title="Xuất CSV"
          >
            <FileDown className="w-4 h-4" />
          </button>

          {/* Print */}
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors no-print"
            title="In bảng điểm"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Tổng đầu điểm</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {stats.count}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Lớp {currentClass.name} · {classStudents.length} học sinh
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Điểm trung bình</div>
          <div className="text-2xl font-bold text-teal-700 mt-1 tabular-nums">
            {stats.count > 0 ? stats.avg.toFixed(1) : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Cao nhất: {stats.max || '—'} · Thấp nhất: {stats.min || '—'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Tỷ lệ Đạt (≥ 5.0)</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">
            {stats.count > 0 ? `${stats.passRate}%` : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {stats.passCount} / {stats.count} lượt kiểm tra
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Tỷ lệ Giỏi (≥ 8.0)</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1 tabular-nums">
            {stats.count > 0 ? `${stats.goodRate}%` : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {stats.goodCount} / {stats.count} lượt kiểm tra
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Môn học THPT filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <span className="text-slate-400 font-medium">Môn học THPT:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 outline-hidden cursor-pointer max-w-[200px]"
            >
              <option value="all">Tất cả môn THPT</option>
              {THPT_SUBJECTS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Loại kiểm tra */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <span className="text-slate-400 font-medium">Loại điểm:</span>
            <select
              value={selectedGradeType}
              onChange={(e) => setSelectedGradeType(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="all">Tất cả loại điểm</option>
              {GRADE_TYPES.map(gt => (
                <option key={gt} value={gt}>{gt}</option>
              ))}
            </select>
          </div>

          {/* Học sinh filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <span className="text-slate-400 font-medium">Học sinh:</span>
            <select
              value={selectedStudentFilter}
              onChange={(e) => setSelectedStudentFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 outline-hidden cursor-pointer max-w-[180px]"
            >
              <option value="all">Tất cả học sinh</option>
              {classStudents.map(s => (
                <option key={s.id} value={s.id}>{s.code} - {s.fullName}</option>
              ))}
            </select>
          </div>

          {/* Text search */}
          <div className="flex-1 min-w-[160px] relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên học sinh, mã HS, ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 outline-hidden focus:bg-white focus:border-teal-500"
            />
          </div>

          {(selectedSubject !== 'all' || selectedStudentFilter !== 'all' || selectedGradeType !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedSubject('all');
                setSelectedStudentFilter('all');
                setSelectedGradeType('all');
                setSearchQuery('');
                sound.playClick();
              }}
              className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-100">
          <span>
            Đang hiển thị <strong>{filteredGrades.length}</strong> / <strong>{classGrades.length}</strong> bản ghi điểm
          </span>
          <span className="text-slate-400">
            {selectedSubject !== 'all' ? `Đang lọc môn: ${selectedSubject}` : 'Đầy đủ các môn học theo chuẩn THPT'}
          </span>
        </div>
      </div>

      {/* Grades Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-4">Học sinh</th>
                <th className="py-3 px-3">Môn học (THPT)</th>
                <th className="py-3 px-3">Loại điểm</th>
                <th className="py-3 px-3 text-center w-24">Điểm số</th>
                <th className="py-3 px-3 w-28">Ngày ghi</th>
                <th className="py-3 px-4">Ghi chú</th>
                <th className="py-3 px-3 text-center w-20">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGrades.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <BookOpenCheck className="w-8 h-8 mx-auto mb-2 opacity-30 text-teal-600" />
                    <p className="font-medium text-slate-500">Chưa có kết quả điểm nào phù hợp.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Thầy/Cô có thể nhấn "Nhập từ Excel" để nhập bảng điểm cả lớp, hoặc "Ghi điểm thủ công".
                    </p>
                  </td>
                </tr>
              ) : (
                filteredGrades.map((g, idx) => {
                  const st = classStudents.find(s => s.id === g.studentId);
                  return (
                    <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {st?.fullName || 'Học sinh đã xóa'}
                        <span className="block text-[11px] text-slate-400 font-normal">
                          {st?.code} · Tổ {st?.team}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800">
                          {g.subject}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                          {g.gradeType}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg font-extrabold tabular-nums text-xs ${
                          g.score >= 8.0 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : g.score >= 6.5 
                            ? 'bg-teal-100 text-teal-800' 
                            : g.score >= 5.0 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {g.score.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 tabular-nums">
                        {g.date}
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                        {g.note || '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteGrade(g.id);
                            sound.playClick();
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                          title="Xóa cột điểm này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nhập từ file Excel */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Nhập Bảng Điểm Từ Tệp Excel (Bậc THPT)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Hỗ trợ file ma trận điểm một môn hoặc danh sách điểm tổng hợp (.xlsx, .xls)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setParsedResult(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
              {/* Step 1: Download Template */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-700" />
                    Bước 1: Tải tệp Excel mẫu với danh sách HS lớp {currentClass.name}
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Tệp mẫu đã điền sẵn danh sách học sinh của lớp. Thầy/Cô chỉ cần nhập điểm số vào các cột.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] font-semibold text-emerald-900">Môn học mẫu:</span>
                    <select
                      value={importTemplateSubject}
                      onChange={(e) => setImportTemplateSubject(e.target.value)}
                      className="bg-white border border-emerald-300 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-900 outline-hidden"
                    >
                      {THPT_SUBJECTS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold whitespace-nowrap shadow-xs transition-colors self-start sm:self-center"
                >
                  Tải tệp mẫu .xlsx
                </button>
              </div>

              {/* Step 2: Upload Excel File */}
              <div className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
                <input
                  type="file"
                  id="grade-excel-upload"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="grade-excel-upload" className="cursor-pointer block">
                  <Upload className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                  <span className="font-bold text-slate-800 block text-sm">
                    Nhấn vào đây để chọn tệp Excel bảng điểm
                  </span>
                  <span className="text-slate-500 text-[11px] block mt-1">
                    Định dạng hỗ trợ: .xlsx, .xls, .csv (Tối đa 10MB)
                  </span>
                </label>
              </div>

              {isProcessingFile && (
                <div className="p-4 text-center text-slate-500">
                  <div className="inline-block w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-2" />
                  <p>Đang phân tích bảng điểm Excel...</p>
                </div>
              )}

              {/* Errors & Warnings Preview */}
              {parsedResult && parsedResult.errors.length > 0 && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-rose-900">
                  <div className="font-bold flex items-center gap-1.5 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    Lỗi khi xử lý tệp:
                  </div>
                  {parsedResult.errors.map((err, i) => (
                    <div key={i} className="text-[11px] text-rose-700">• {err}</div>
                  ))}
                </div>
              )}

              {parsedResult && parsedResult.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-amber-900">
                  <div className="font-bold flex items-center gap-1.5 text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Cảnh báo ({parsedResult.warnings.length} dòng được lưu ý):
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-0.5 custom-scrollbar">
                    {parsedResult.warnings.slice(0, 5).map((w, i) => (
                      <div key={i} className="text-[11px] text-amber-800">• {w}</div>
                    ))}
                    {parsedResult.warnings.length > 5 && (
                      <div className="text-[11px] italic text-amber-700">
                        ... và {parsedResult.warnings.length - 5} cảnh báo khác.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Parsed Result Preview Table */}
              {parsedResult && parsedResult.grades.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      Tìm thấy {parsedResult.grades.length} kết quả điểm hợp lệ ({parsedResult.matchedStudentsCount} học sinh)
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Xem trước 10 bản ghi đầu tiên
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                        <tr>
                          <th className="py-2 px-3">Học sinh</th>
                          <th className="py-2 px-3">Môn học</th>
                          <th className="py-2 px-3">Loại điểm</th>
                          <th className="py-2 px-3 text-center">Điểm</th>
                          <th className="py-2 px-3">Ngày</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedResult.grades.slice(0, 10).map((g, idx) => {
                          const st = classStudents.find(s => s.id === g.studentId);
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-1.5 px-3 font-semibold text-slate-800">
                                {st?.fullName} <span className="text-slate-400 font-normal">({st?.code})</span>
                              </td>
                              <td className="py-1.5 px-3 text-slate-700">{g.subject}</td>
                              <td className="py-1.5 px-3">{g.gradeType}</td>
                              <td className="py-1.5 px-3 text-center font-bold text-teal-700">
                                {g.score.toFixed(1)}
                              </td>
                              <td className="py-1.5 px-3 text-slate-400">{g.date}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4 shrink-0">
              <span className="text-[11px] text-slate-400">
                {parsedResult ? `Sẵn sàng lưu ${parsedResult.grades.length} điểm` : 'Chưa tải lên tệp'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setParsedResult(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={!parsedResult || parsedResult.grades.length === 0}
                  onClick={handleConfirmImport}
                  className={`px-5 py-2 rounded-xl font-semibold shadow-xs transition-colors flex items-center gap-1.5 ${
                    parsedResult && parsedResult.grades.length > 0
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Xác nhận lưu {parsedResult?.grades.length || 0} điểm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Single Grade Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpenCheck className="w-4 h-4 text-teal-600" />
                Ghi điểm kiểm tra học sinh THPT
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chọn học sinh <span className="text-rose-500">*</span>
                </label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-semibold"
                >
                  {classStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.fullName} (Tổ {s.team})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Môn học (THPT)</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-semibold"
                  >
                    {THPT_SUBJECTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại kiểm tra</label>
                  <select
                    value={gradeType}
                    onChange={(e) => setGradeType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-semibold"
                  >
                    {GRADE_TYPES.map(gt => (
                      <option key={gt} value={gt}>{gt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Điểm số (Thang 10) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    required
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-extrabold text-teal-800 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày kiểm tra</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú của giáo viên</label>
                <input
                  type="text"
                  placeholder="VD: Kiểm tra 15 phút, giải tốt bài khó..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Lưu điểm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
