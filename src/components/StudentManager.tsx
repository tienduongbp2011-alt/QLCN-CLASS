import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  Eye, 
  Coins, 
  AlertCircle,
  FileSpreadsheet,
  X,
  Phone,
  Calendar,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { Student, StudentRole, ClassInfo } from '../types';
import { exportStudentsToCSV, parseStudentsCSV } from '../utils/csv';
import { 
  parseStudentsExcelFile, 
  exportStudentsToExcel, 
  downloadStudentTemplateExcel 
} from '../utils/excel';
import { sound } from '../utils/audio';

interface StudentManagerProps {
  currentClass: ClassInfo;
  students: Student[];
  onAddStudent: (student: Omit<Student, 'id' | 'classId'>) => void;
  onUpdateStudent: (id: string, updates: Partial<Student>) => void;
  onDeleteStudent: (id: string) => void;
  onBulkAddStudents: (students: Student[]) => void;
}

const ROLES: StudentRole[] = [
  'Thành viên',
  'Lớp trưởng',
  'Lớp phó học tập',
  'Lớp phó lao động',
  'Tổ trưởng',
  'Tổ phó',
  'Thủ quỹ',
  'Ủy viên'
];

export const StudentManager: React.FC<StudentManagerProps> = ({
  currentClass,
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onBulkAddStudents
}) => {
  const classStudents = useMemo(() => {
    return students.filter(s => s.classId === currentClass.id);
  }, [students, currentClass.id]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'coins'>('code');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [confirmDeleteStudent, setConfirmDeleteStudent] = useState<Student | null>(null);

  // Excel / CSV Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [previewStudents, setPreviewStudents] = useState<Student[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Handle Excel (.xlsx, .xls) & CSV file selection
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setImportErrors([]);
    setImportSuccessCount(null);
    setPreviewStudents([]);

    try {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const result = await parseStudentsExcelFile(file, currentClass.id, classStudents.length);
        setImportErrors(result.errors);
        if (result.students.length > 0) {
          setPreviewStudents(result.students);
          sound.playSuccess();
        } else {
          setImportErrors(prev => [...prev, 'Không tìm thấy dữ liệu học sinh nào trong tệp Excel. Vui lòng kiểm tra lại cấu trúc cột hoặc tải tệp mẫu.']);
        }
      } else {
        // CSV fallback
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
            const { students: parsed, errors } = parseStudentsCSV(content, currentClass.id);
            setImportErrors(errors);
            if (parsed.length > 0) {
              setPreviewStudents(parsed);
              sound.playSuccess();
            } else {
              setImportErrors(prev => [...prev, 'Không tìm thấy dữ liệu học sinh hợp lệ trong tệp CSV.']);
            }
          }
          setIsProcessingFile(false);
        };
        reader.readAsText(file, 'utf-8');
        return;
      }
    } catch (err: any) {
      console.error('Error importing file:', err);
      setImportErrors(['Lỗi khi đọc tệp: ' + (err?.message || 'Định dạng tệp không được hỗ trợ hoặc bị lỗi.')]);
    } finally {
      setIsProcessingFile(false);
      e.target.value = '';
    }
  };

  const confirmImportPreview = () => {
    if (previewStudents.length === 0) return;
    onBulkAddStudents(previewStudents);
    setImportSuccessCount(previewStudents.length);
    setPreviewStudents([]);
    sound.playFanfare();
  };

  // Form State for Add / Edit
  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('2010-01-01');
  const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [team, setTeam] = useState<number>(1);
  const [role, setRole] = useState<StudentRole>('Thành viên');
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [coins, setCoins] = useState<number>(0);

  // Pre-fill next code
  const getNextStudentCode = () => {
    const count = classStudents.length + 1;
    return `HS${String(count).padStart(2, '0')}`;
  };

  const openAddModal = () => {
    setCode(getNextStudentCode());
    setFullName('');
    setBirthDate('2010-01-01');
    setGender('Nam');
    setTeam(1);
    setRole('Thành viên');
    setPhone('');
    setParentPhone('');
    setNotes('');
    setCoins(0);
    setEditingStudent(null);
    setShowAddModal(true);
    sound.playClick();
  };

  const openEditModal = (s: Student) => {
    setEditingStudent(s);
    setCode(s.code);
    setFullName(s.fullName);
    setBirthDate(s.birthDate);
    setGender(s.gender);
    setTeam(s.team);
    setRole(s.role);
    setPhone(s.phone);
    setParentPhone(s.parentPhone);
    setNotes(s.notes);
    setCoins(s.coins || 0);
    setShowAddModal(true);
    sound.playClick();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    if (editingStudent) {
      onUpdateStudent(editingStudent.id, {
        code: code.trim(),
        fullName: fullName.trim(),
        birthDate,
        gender,
        team,
        role,
        phone: phone.trim(),
        parentPhone: parentPhone.trim(),
        notes: notes.trim(),
        coins: Number(coins) || 0
      });
      sound.playSuccess();
    } else {
      // Check duplicate code
      const duplicate = classStudents.some(s => s.code.toLowerCase() === code.trim().toLowerCase());
      const finalCode = duplicate ? `${code.trim()}_${Date.now().toString(36).slice(-3)}` : code.trim();

      onAddStudent({
        code: finalCode,
        fullName: fullName.trim(),
        birthDate,
        gender,
        team,
        role,
        phone: phone.trim(),
        parentPhone: parentPhone.trim(),
        notes: notes.trim(),
        coins: Number(coins) || 0,
        status: 'active'
      });
      sound.playSuccess();
    }
    setShowAddModal(false);
  };

  // Filter & Sort Logic
  const filteredStudents = useMemo(() => {
    return classStudents.filter(s => {
      const matchSearch = 
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTeam = filterTeam === 'all' || s.team === Number(filterTeam);
      const matchGender = filterGender === 'all' || s.gender === filterGender;
      return matchSearch && matchTeam && matchGender;
    }).sort((a, b) => {
      if (sortBy === 'name') {
        const getLastName = (name: string) => name.trim().split(' ').pop() || '';
        return getLastName(a.fullName).localeCompare(getLastName(b.fullName), 'vi');
      }
      if (sortBy === 'coins') {
        return (b.coins || 0) - (a.coins || 0);
      }
      return a.code.localeCompare(b.code, undefined, { numeric: true });
    });
  }, [classStudents, searchQuery, filterTeam, filterGender, sortBy]);

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Hồ Sơ & Danh Sách Học Sinh
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý thông tin cá nhân, phân tổ, chức vụ và theo dõi tiến trình của từng học sinh trong lớp {currentClass.name}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Thêm học sinh
          </button>

          <button
            type="button"
            onClick={() => {
              setShowImportModal(true);
              setImportErrors([]);
              setImportSuccessCount(null);
              setPreviewStudents([]);
              sound.playClick();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition-colors"
            title="Nhập danh sách học sinh từ tệp Excel (.xlsx, .xls) hoặc CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Nhập Excel / CSV
          </button>

          <button
            type="button"
            onClick={() => {
              downloadStudentTemplateExcel();
              sound.playSuccess();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            title="Tải tệp mẫu Excel có sẵn các cột chuẩn để điền dữ liệu"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Tải mẫu Excel
          </button>

          <button
            type="button"
            onClick={() => {
              exportStudentsToExcel(classStudents, currentClass.name);
              sound.playSuccess();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-semibold transition-colors"
            title="Xuất danh sách học sinh ra file Excel định dạng .xlsx"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh hoặc mã HS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-500 outline-hidden"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Team Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <span className="text-slate-400 font-medium">Tổ:</span>
            <select
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="all">Tất cả</option>
              <option value="1">Tổ 1</option>
              <option value="2">Tổ 2</option>
              <option value="3">Tổ 3</option>
              <option value="4">Tổ 4</option>
            </select>
          </div>

          {/* Gender Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <span className="text-slate-400 font-medium">Giới tính:</span>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="all">Tất cả</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <span className="text-slate-400 font-medium">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="code">Mã HS</option>
              <option value="name">Tên (A-Z)</option>
              <option value="coins">Xu thi đua (Cao - Thấp)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-3 w-20">Mã HS</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-3 w-24">Ngày sinh</th>
                <th className="py-3 px-3 text-center w-16">Giới tính</th>
                <th className="py-3 px-3 text-center w-16">Tổ</th>
                <th className="py-3 px-3 w-28">Chức vụ</th>
                <th className="py-3 px-3 text-right w-20">Xu thi đua</th>
                <th className="py-3 px-4">Ghi chú</th>
                <th className="py-3 px-3 text-center w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Không tìm thấy học sinh nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3 px-3 text-center text-slate-400 font-mono tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800 font-mono">
                      {student.code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                        {student.fullName}
                      </div>
                      {student.parentPhone && (
                        <div className="text-[11px] text-slate-400">PH: {student.parentPhone}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600 tabular-nums">
                      {student.birthDate}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={student.gender === 'Nữ' ? 'text-pink-600 font-medium' : 'text-blue-600 font-medium'}>
                        {student.gender}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700">
                        Tổ {student.team}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-medium text-[11px]">
                        {student.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-extrabold text-teal-700 tabular-nums">
                        {student.coins}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={student.notes}>
                      {student.notes || '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setViewingStudent(student);
                            sound.playClick();
                          }}
                          className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Xem hồ sơ chi tiết"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(student)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Chỉnh sửa thông tin"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteStudent(student)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa học sinh"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Table summary footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Tổng số hiển thị: <strong className="text-slate-800 tabular-nums">{filteredStudents.length}</strong> / {classStudents.length} học sinh</span>
          <span>Dữ liệu được cập nhật theo thời gian thực</span>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-teal-600" />
                {editingStudent ? 'Chỉnh sửa thông tin học sinh' : 'Thêm học sinh mới vào lớp'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã học sinh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Giới tính
                  </label>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        checked={gender === 'Nam'}
                        onChange={() => setGender('Nam')}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <span>Nam</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        checked={gender === 'Nữ'}
                        onChange={() => setGender('Nữ')}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <span>Nữ</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phân tổ
                  </label>
                  <select
                    value={team}
                    onChange={(e) => setTeam(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                  >
                    <option value={1}>Tổ 1</option>
                    <option value={2}>Tổ 2</option>
                    <option value={3}>Tổ 3</option>
                    <option value={4}>Tổ 4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chức vụ trong lớp
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as StudentRole)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SĐT học sinh (nếu có)
                  </label>
                  <input
                    type="tel"
                    placeholder="0912..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SĐT phụ huynh
                  </label>
                  <input
                    type="tel"
                    placeholder="0987..."
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số xu thi đua khởi tạo
                </label>
                <input
                  type="number"
                  min="0"
                  value={coins}
                  onChange={(e) => setCoins(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú riêng của giáo viên
                </label>
                <textarea
                  rows={2}
                  placeholder="Tính cách, hoàn cảnh, lưu ý học tập..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  {editingStudent ? 'Cập nhật' : 'Thêm vào lớp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Student Profile Detail Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Hồ sơ chi tiết học sinh
              </span>
              <button
                type="button"
                onClick={() => setViewingStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center pb-4 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center text-xl font-extrabold mb-2">
                {viewingStudent.fullName.charAt(0)}
              </div>
              <h3 className="text-lg font-bold text-slate-900">{viewingStudent.fullName}</h3>
              <div className="text-xs text-slate-500 mt-0.5">
                Mã: {viewingStudent.code} · Lớp {currentClass.name}
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100/70 text-teal-800 rounded-lg text-xs font-semibold">
                <Coins className="w-3.5 h-3.5 text-teal-600" />
                <span>{viewingStudent.coins} xu thi đua</span>
              </div>
            </div>

            <div className="py-4 space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Ngày sinh:</span>
                <span className="font-medium">{viewingStudent.birthDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Giới tính:</span>
                <span className="font-medium">{viewingStudent.gender}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Tổ sinh hoạt:</span>
                <span className="font-bold text-slate-800">Tổ {viewingStudent.team}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Chức vụ trong lớp:</span>
                <span className="font-bold text-teal-700">{viewingStudent.role}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">SĐT học sinh:</span>
                <span className="font-mono">{viewingStudent.phone || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">SĐT phụ huynh:</span>
                <span className="font-mono">{viewingStudent.parentPhone || 'Chưa cập nhật'}</span>
              </div>
              <div className="pt-2">
                <span className="text-slate-400 block mb-1">Ghi chú giáo viên:</span>
                <div className="p-3 bg-slate-50 rounded-xl text-slate-700 italic">
                  {viewingStudent.notes || 'Không có ghi chú đặc biệt.'}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const s = viewingStudent;
                  setViewingStudent(null);
                  openEditModal(s);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => setViewingStudent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel / CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Thêm Học Sinh Từ File Excel / CSV
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setPreviewStudents([]);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Chưa có tệp mẫu hoặc muốn định dạng chuẩn?</span>
                  <span className="text-[11px] text-slate-500">Tải tệp mẫu Excel có sẵn các cột (STT, Mã HS, Họ và tên, Ngày sinh, Giới tính, Tổ, Chức vụ, SĐT PH...)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    downloadStudentTemplateExcel();
                    sound.playSuccess();
                  }}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-500 text-emerald-700 rounded-lg font-semibold shadow-2xs text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải mẫu Excel (.xlsx)
                </button>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-file-input"
                />
                <label htmlFor="excel-file-input" className="cursor-pointer block">
                  <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                  <span className="font-bold text-slate-800 block text-sm">
                    {isProcessingFile ? 'Đang đọc và phân tích tệp...' : 'Bấm để chọn tệp Excel (.xlsx, .xls) hoặc CSV từ máy'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Tự động nhận diện cột Họ và tên, Mã học sinh, Ngày sinh, Giới tính, Phân tổ 1-4
                  </span>
                </label>
              </div>

              {/* Success Notification */}
              {importSuccessCount !== null && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Đã nhập thành công <strong>{importSuccessCount}</strong> học sinh vào lớp {currentClass.name}!</span>
                </div>
              )}

              {/* Preview table if parsed */}
              {previewStudents.length > 0 && (
                <div className="space-y-2 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">
                      Xem trước dữ liệu ({previewStudents.length} học sinh sẵn sàng thêm)
                    </span>
                    <span className="text-[11px] text-teal-700 font-medium">
                      Kiểm tra lại trước khi lưu
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 text-slate-600 font-semibold text-[11px]">
                        <tr>
                          <th className="py-2 px-2 text-center w-10">#</th>
                          <th className="py-2 px-2 w-16">Mã HS</th>
                          <th className="py-2 px-3">Họ và tên</th>
                          <th className="py-2 px-2 text-center w-14">Tổ</th>
                          <th className="py-2 px-2 w-24">Chức vụ</th>
                          <th className="py-2 px-2 w-24">SĐT PH</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewStudents.slice(0, 15).map((st, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1.5 px-2 text-center text-slate-400">{idx + 1}</td>
                            <td className="py-1.5 px-2 font-mono font-semibold">{st.code}</td>
                            <td className="py-1.5 px-3 font-bold text-slate-800">{st.fullName}</td>
                            <td className="py-1.5 px-2 text-center">Tổ {st.team}</td>
                            <td className="py-1.5 px-2 text-slate-600">{st.role}</td>
                            <td className="py-1.5 px-2 font-mono text-slate-500">{st.parentPhone || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {previewStudents.length > 15 && (
                    <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-50 border-t border-slate-100">
                      và {previewStudents.length - 15} học sinh khác...
                    </div>
                  )}

                  <div className="p-3 bg-emerald-50/70 border-t border-emerald-100 flex items-center justify-between">
                    <span className="text-xs text-emerald-800 font-semibold">
                      Sẵn sàng nhập {previewStudents.length} học sinh vào lớp {currentClass.name}
                    </span>
                    <button
                      type="button"
                      onClick={confirmImportPreview}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                    >
                      Xác nhận nhập vào lớp
                    </button>
                  </div>
                </div>
              )}

              {/* Errors list */}
              {importErrors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs space-y-1 max-h-36 overflow-y-auto custom-scrollbar">
                  <div className="font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Cảnh báo / Lỗi xử lý dữ liệu:
                  </div>
                  {importErrors.map((err, i) => (
                    <div key={i} className="text-[11px]">{err}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setPreviewStudents([]);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDeleteStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Xóa học sinh khỏi lớp?
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Bạn có chắc chắn muốn xóa học sinh <strong>{confirmDeleteStudent.fullName}</strong> ({confirmDeleteStudent.code})?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteStudent(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteStudent(confirmDeleteStudent.id);
                  setConfirmDeleteStudent(null);
                  sound.playSuccess();
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs"
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
