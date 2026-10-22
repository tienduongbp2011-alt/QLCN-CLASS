import * as XLSX from 'xlsx';
import { Student, StudentRole, GradeEntry, ClassInfo, THPT_SUBJECTS, EmulationCriterion } from '../types';

export interface ParsedStudentResult {
  students: Student[];
  errors: string[];
  totalRows: number;
}

const VALID_ROLES: StudentRole[] = [
  'Thành viên',
  'Lớp trưởng',
  'Lớp phó học tập',
  'Lớp phó lao động',
  'Tổ trưởng',
  'Tổ phó',
  'Thủ quỹ',
  'Ủy viên'
];

/**
 * Format Excel date (serial number or string) to YYYY-MM-DD
 */
function normalizeBirthDate(rawVal: any): string {
  if (!rawVal) return '2010-01-01';

  // If number (Excel serial date)
  if (typeof rawVal === 'number') {
    // Excel base date is Dec 30 1899
    const dateObj = new Date(Math.round((rawVal - 25569) * 86400 * 1000));
    if (!isNaN(dateObj.getTime())) {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const str = String(rawVal).trim();
  // Check dd/mm/yyyy or dd-mm-yyyy
  const dmyMatch = str.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Check yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  return '2010-01-01';
}

/**
 * Clean & match role
 */
function normalizeRole(rawVal: any): StudentRole {
  if (!rawVal) return 'Thành viên';
  const str = String(rawVal).trim().toLowerCase();
  for (const r of VALID_ROLES) {
    if (r.toLowerCase() === str) return r;
  }
  if (str.includes('lớp trưởng') || str.includes('lop truong')) return 'Lớp trưởng';
  if (str.includes('học tập') || str.includes('hoc tap')) return 'Lớp phó học tập';
  if (str.includes('lao động') || str.includes('lao dong')) return 'Lớp phó lao động';
  if (str.includes('tổ trưởng') || str.includes('to truong')) return 'Tổ trưởng';
  if (str.includes('tổ phó') || str.includes('to pho')) return 'Tổ phó';
  if (str.includes('thủ quỹ') || str.includes('thu quy')) return 'Thủ quỹ';
  if (str.includes('ủy viên') || str.includes('uy vien')) return 'Ủy viên';
  return 'Thành viên';
}

/**
 * Parse team number 1..4
 */
function normalizeTeam(rawVal: any): number {
  if (!rawVal) return 1;
  const match = String(rawVal).match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    if (num >= 1 && num <= 4) return num;
  }
  return 1;
}

/**
 * Parse gender
 */
function normalizeGender(rawVal: any): 'Nam' | 'Nữ' {
  if (!rawVal) return 'Nam';
  const str = String(rawVal).trim().toLowerCase();
  if (str.includes('nữ') || str.includes('nu') || str === 'f' || str === 'female') {
    return 'Nữ';
  }
  return 'Nam';
}

/**
 * Parse Excel file (.xlsx, .xls) or CSV file buffer
 */
export async function parseStudentsExcelFile(
  file: File,
  classId: string,
  existingStudentsCount: number = 0
): Promise<ParsedStudentResult> {
  const errors: string[] = [];
  const students: Student[] = [];

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  // Use first worksheet
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return { students: [], errors: ['Tệp Excel rỗng hoặc không tìm thấy Sheet dữ liệu.'], totalRows: 0 };
  }

  const worksheet = workbook.Sheets[firstSheetName];
  // Convert sheet to JSON rows as array of arrays or array of objects
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (rawRows.length < 2) {
    return { students: [], errors: ['Tệp Excel cần có ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu học sinh.'], totalRows: 0 };
  }

  // Find header row (it could be row 0, 1, or 2 if there are title rows)
  let headerIndex = -1;
  for (let r = 0; r < Math.min(6, rawRows.length); r++) {
    const rowStr = rawRows[r].map(c => String(c).toLowerCase()).join(' ');
    if (rowStr.includes('tên') || rowStr.includes('họ') || rowStr.includes('mã hs') || rowStr.includes('student')) {
      headerIndex = r;
      break;
    }
  }

  // Fallback to row 0 if no header found
  if (headerIndex === -1) {
    headerIndex = 0;
  }

  const headers = rawRows[headerIndex].map(h => String(h).trim().toLowerCase());

  // Map header column indices
  let colStt = headers.findIndex(h => h.includes('stt') || h === 'no' || h === '#');
  let colCode = headers.findIndex(h => h.includes('mã') || h.includes('code') || h.includes('id') || h.includes('sbd'));
  let colName = headers.findIndex(h => (h.includes('họ') && h.includes('tên')) || h.includes('họ tên') || h.includes('tên học sinh') || h === 'tên' || h.includes('name'));
  let colDob = headers.findIndex(h => h.includes('ngày sinh') || h.includes('sinh nhật') || h.includes('dob') || h.includes('birth'));
  let colGender = headers.findIndex(h => h.includes('giới tính') || h.includes('phái') || h.includes('gender') || h.includes('nam/nữ'));
  let colTeam = headers.findIndex(h => h.includes('tổ') || h.includes('nhóm') || h.includes('team') || h.includes('group'));
  let colRole = headers.findIndex(h => h.includes('chức vụ') || h.includes('vai trò') || h.includes('role'));
  let colPhone = headers.findIndex(h => (h.includes('sđt') || h.includes('điện thoại') || h.includes('phone')) && !h.includes('phụ huynh') && !h.includes('ph'));
  let colParentPhone = headers.findIndex(h => (h.includes('phụ huynh') || h.includes('bố') || h.includes('mẹ') || h.includes('ph')) && (h.includes('sđt') || h.includes('phone') || h.includes('điện thoại')));
  let colNotes = headers.findIndex(h => h.includes('ghi chú') || h.includes('lưu ý') || h.includes('note'));

  // If colName is still -1, try finding any column with "tên"
  if (colName === -1) {
    colName = headers.findIndex(h => h.includes('tên'));
  }

  // If colName is still -1, fallback to column 1 or 2
  if (colName === -1) {
    colName = headers.length > 2 && colStt === 0 ? 2 : 1;
  }

  const existingCodes = new Set<string>();
  let currentCodeCounter = existingStudentsCount + 1;

  for (let r = headerIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    // Check if empty row
    const rowText = row.map(c => String(c).trim()).join('');
    if (!rowText) continue;

    // Name
    const fullName = colName !== -1 && row[colName] ? String(row[colName]).trim() : '';
    if (!fullName) {
      // Row might be a footer / summary or empty
      continue;
    }

    // Code
    let code = colCode !== -1 && row[colCode] ? String(row[colCode]).trim() : '';
    if (!code) {
      code = `HS${String(currentCodeCounter).padStart(2, '0')}`;
      currentCodeCounter++;
    }

    // Ensure code uniqueness
    if (existingCodes.has(code.toUpperCase())) {
      code = `${code}_${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    }
    existingCodes.add(code.toUpperCase());

    // Dob
    const rawDob = colDob !== -1 ? row[colDob] : '';
    const birthDate = normalizeBirthDate(rawDob);

    // Gender
    const rawGender = colGender !== -1 ? row[colGender] : '';
    const gender = normalizeGender(rawGender);

    // Team
    const rawTeam = colTeam !== -1 ? row[colTeam] : '';
    const team = normalizeTeam(rawTeam);

    // Role
    const rawRole = colRole !== -1 ? row[colRole] : '';
    const role = normalizeRole(rawRole);

    // Phones & notes
    const phone = colPhone !== -1 && row[colPhone] ? String(row[colPhone]).trim() : '';
    const parentPhone = colParentPhone !== -1 && row[colParentPhone] ? String(row[colParentPhone]).trim() : '';
    const notes = colNotes !== -1 && row[colNotes] ? String(row[colNotes]).trim() : '';

    students.push({
      id: 'std_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      classId,
      code,
      fullName,
      birthDate,
      gender,
      team,
      role,
      phone,
      parentPhone,
      notes,
      coins: 0,
      status: 'active'
    });
  }

  return {
    students,
    errors,
    totalRows: rawRows.length - (headerIndex + 1)
  };
}

/**
 * Export students to styled Excel .xlsx file
 */
export function exportStudentsToExcel(students: Student[], className: string): void {
  const data: any[][] = [
    [`DANH SÁCH HỌC SINH LỚP ${className.toUpperCase()}`],
    [`Ngày kết xuất: ${new Date().toLocaleDateString('vi-VN')} · Tổng số: ${students.length} học sinh`],
    [],
    ['STT', 'Mã HS', 'Họ và tên', 'Ngày sinh', 'Giới tính', 'Tổ', 'Chức vụ', 'SĐT học sinh', 'SĐT phụ huynh', 'Ghi chú', 'Xu thi đua']
  ];

  students.forEach((s, idx) => {
    data.push([
      idx + 1,
      s.code,
      s.fullName,
      s.birthDate,
      s.gender,
      `Tổ ${s.team}`,
      s.role,
      s.phone || '',
      s.parentPhone || '',
      s.notes || '',
      s.coins || 0
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 10 }, // Mã HS
    { wch: 25 }, // Họ tên
    { wch: 14 }, // Ngày sinh
    { wch: 10 }, // Giới tính
    { wch: 8 },  // Tổ
    { wch: 18 }, // Chức vụ
    { wch: 14 }, // SĐT
    { wch: 14 }, // SĐT PH
    { wch: 25 }, // Ghi chú
    { wch: 12 }  // Xu
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Học sinh');

  const fileName = `Danh_sach_hoc_sinh_${className.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Download sample Excel template for teachers to import students
 */
export function downloadStudentTemplateExcel(): void {
  const data = [
    ['MẪU NHẬP DANH SÁCH HỌC SINH (CLASS PRO)'],
    ['* Thầy cô chỉ cần điền đầy đủ Họ và tên; Mã HS và Tổ nếu để trống hệ thống sẽ tự sinh tự động.'],
    [],
    ['STT', 'Mã HS', 'Họ và tên', 'Ngày sinh', 'Giới tính', 'Tổ', 'Chức vụ', 'SĐT học sinh', 'SĐT phụ huynh', 'Ghi chú'],
    [1, 'HS01', 'Nguyễn Văn An', '2010-03-15', 'Nam', 1, 'Lớp trưởng', '0912345601', '0987654301', 'Học giỏi Toán, gương mẫu'],
    [2, 'HS02', 'Trần Thị Bình', '2010-07-20', 'Nữ', 1, 'Lớp phó học tập', '0912345602', '0987654302', 'Chăm chỉ, tích cực'],
    [3, 'HS03', 'Lê Hoàng Cường', '2010-11-05', 'Nam', 2, 'Tổ trưởng', '0912345603', '0987654303', 'Nhiệt tình'],
    [4, 'HS04', 'Phạm Ngọc Diệp', '2010-05-18', 'Nữ', 2, 'Thủ quỹ', '0912345604', '0987654304', 'Cẩn thận, minh bạch'],
    [5, 'HS05', 'Vũ Quốc Đạt', '2010-09-09', 'Nam', 3, 'Thành viên', '0912345605', '0987654305', '']
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 10 },
    { wch: 22 },
    { wch: 14 },
    { wch: 10 },
    { wch: 8 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 25 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Mau_Nhap_Hoc_Sinh');

  XLSX.writeFile(workbook, 'Mau_Nhap_Danh_Sach_Hoc_Sinh.xlsx');
}

/**
 * Export full Class Fund (Quỹ lớp) report to Excel
 */
export function exportFundReportToExcel(
  className: string,
  teacherName: string,
  campaignTitle: string,
  contributions: { code?: string; studentName: string; team: number; amountPaid: number; paidDate: string; status: string; paymentMethod: string; note?: string }[],
  incomes: { title: string; amount: number; date: string; category: string; payerOrReceiver: string; notes?: string }[],
  expenses: { title: string; amount: number; date: string; category: string; payerOrReceiver: string; notes?: string }[]
): void {
  const workbook = XLSX.utils.book_new();

  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  const balance = totalIncome - totalExpense;

  // Sheet 1: Báo cáo tổng hợp
  const summaryData: any[][] = [
    [`BÁO CÁO THU CHI QUỸ LỚP ${className.toUpperCase()}`],
    [`Giáo viên chủ nhiệm: ${teacherName} · Ngày lập: ${new Date().toLocaleDateString('vi-VN')}`],
    [],
    ['I. TỔNG QUAN TÀI CHÍNH QUỸ LỚP', 'SỐ TIỀN (VNĐ)'],
    ['1. Tổng nguồn thu', totalIncome],
    ['2. Tổng nguồn chi', totalExpense],
    ['3. TỒN QUỸ HIỆN TẠI', balance],
    [],
    ['II. NGUỒN THU THEO KHOẢN MỤC'],
    ['STT', 'Tên khoản thu', 'Số tiền (VNĐ)', 'Ngày thu', 'Danh mục', 'Người nộp/nguồn thu', 'Ghi chú']
  ];

  incomes.forEach((inc, idx) => {
    summaryData.push([
      idx + 1,
      inc.title,
      inc.amount,
      inc.date,
      inc.category,
      inc.payerOrReceiver,
      inc.notes || ''
    ]);
  });

  summaryData.push(
    [],
    ['III. NGUỒN CHI THEO KHOẢN MỤC'],
    ['STT', 'Tên khoản chi', 'Số tiền (VNĐ)', 'Ngày chi', 'Danh mục chi', 'Người nhận/phụ trách', 'Ghi chú']
  );

  expenses.forEach((exp, idx) => {
    summaryData.push([
      idx + 1,
      exp.title,
      exp.amount,
      exp.date,
      exp.category,
      exp.payerOrReceiver,
      exp.notes || ''
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 6 },
    { wch: 35 },
    { wch: 18 },
    { wch: 14 },
    { wch: 20 },
    { wch: 22 },
    { wch: 25 }
  ];
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'Bao_Cao_Thu_Chi');

  // Sheet 2: Danh sách đóng tiền quỹ
  if (contributions.length > 0) {
    const contribData: any[][] = [
      [`DANH SÁCH ĐÓNG TIỀN QUỸ: ${campaignTitle.toUpperCase()}`],
      [`Lớp: ${className} · Tổng số: ${contributions.length} học sinh`],
      [],
      ['STT', 'Họ và tên học sinh', 'Tổ', 'Số tiền đã đóng (VNĐ)', 'Ngày nộp', 'Hình thức', 'Trạng thái', 'Ghi chú']
    ];

    contributions.forEach((c, idx) => {
      contribData.push([
        idx + 1,
        c.studentName,
        `Tổ ${c.team}`,
        c.amountPaid,
        c.paidDate || '—',
        c.paymentMethod || 'Tiền mặt',
        c.status === 'paid' ? 'Đã đóng đủ' : c.status === 'partial' ? 'Đóng một phần' : 'Chưa đóng',
        c.note || ''
      ]);
    });

    const wsContrib = XLSX.utils.aoa_to_sheet(contribData);
    wsContrib['!cols'] = [
      { wch: 6 },
      { wch: 24 },
      { wch: 8 },
      { wch: 20 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(workbook, wsContrib, 'Danh_Sach_Dong_Quy');
  }

  const fileName = `Bao_cao_thu_chi_quy_lop_${className.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Normalizes subject name to standard Vietnamese High School (THPT) subject
 */
export function normalizeTHPTSubject(raw: any): string {
  if (!raw) return 'Toán';
  const str = String(raw).trim();
  const lower = str.toLowerCase();

  if (lower === 'toán' || lower === 'toan' || lower.includes('toán học')) return 'Toán';
  if (lower === 'ngữ văn' || lower === 'van' || lower === 'văn' || lower.includes('ngữ văn')) return 'Ngữ văn';
  if (lower.includes('tiếng anh') || lower.includes('tieng anh') || lower === 'anh' || lower === 'english') return 'Tiếng Anh';
  if (lower.includes('vật lí') || lower.includes('vật lý') || lower === 'lí' || lower === 'lý' || lower === 'physics') return 'Vật lí';
  if (lower.includes('hóa học') || lower.includes('hóa') || lower === 'hoa' || lower === 'chemistry') return 'Hóa học';
  if (lower.includes('sinh học') || lower.includes('sinh') || lower === 'biology') return 'Sinh học';
  if (lower.includes('lịch sử') || lower === 'sử' || lower === 'history') return 'Lịch sử';
  if (lower.includes('địa lí') || lower.includes('địa lý') || lower === 'địa' || lower === 'geography') return 'Địa lí';
  if (lower.includes('kinh tế') || lower.includes('pháp luật') || lower.includes('gdkt') || lower.includes('gktpl')) return 'Giáo dục kinh tế và pháp luật (GDKT&PL)';
  if (lower.includes('tin học') || lower === 'tin' || lower.includes('it') || lower.includes('computer')) return 'Tin học';
  if (lower.includes('công nghệ') || lower === 'cn') return 'Công nghệ';
  if (lower.includes('quốc phòng') || lower.includes('an ninh') || lower.includes('gdqp')) return 'Giáo dục quốc phòng và an ninh (GDQP-AN)';
  if (lower.includes('thể chất') || lower.includes('thể dục') || lower.includes('gdtc')) return 'Giáo dục thể chất (GDTC)';
  if (lower.includes('trải nghiệm') || lower.includes('hướng nghiệp') || lower.includes('hdtn')) return 'Hoạt động trải nghiệm, hướng nghiệp';
  if (lower.includes('âm nhạc') || lower === 'nhạc') return 'Âm nhạc';
  if (lower.includes('mỹ thuật') || lower.includes('hội họa')) return 'Mỹ thuật';
  if (lower.includes('địa phương')) return 'Giáo dục địa phương';

  // Return original capitalized string if not matched
  return str;
}

/**
 * Normalizes grade type
 */
export function normalizeGradeType(raw: any): GradeEntry['gradeType'] {
  if (!raw) return 'ĐGTX 1';
  const str = String(raw).trim().toLowerCase();
  if (str.includes('1') && (str.includes('tx') || str.includes('dgtx') || str.includes('đgtx') || str.includes('miệng') || str.includes('15'))) return 'ĐGTX 1';
  if (str.includes('2') && (str.includes('tx') || str.includes('dgtx') || str.includes('đgtx'))) return 'ĐGTX 2';
  if (str.includes('3') && (str.includes('tx') || str.includes('dgtx') || str.includes('đgtx'))) return 'ĐGTX 3';
  if (str.includes('4') && (str.includes('tx') || str.includes('dgtx') || str.includes('đgtx'))) return 'ĐGTX 4';
  if (str.includes('giữa') || str.includes('giua') || str.includes('gk') || str.includes('đgđk 1') || str.includes('1 tiết')) return 'Giữa kỳ';
  if (str.includes('cuối') || str.includes('cuoi') || str.includes('ck') || str.includes('học kỳ') || str.includes('thi')) return 'Cuối kỳ';
  return 'ĐGTX 1';
}

export interface ParsedGradesResult {
  grades: Omit<GradeEntry, 'id'>[];
  errors: string[];
  warnings: string[];
  totalRows: number;
  matchedStudentsCount: number;
}

/**
 * Parse Excel file for Grades (supports both single-subject matrix format and general multi-subject list format)
 */
export async function parseGradesExcelFile(
  file: File,
  classId: string,
  students: Student[],
  defaultSubject: string = 'Toán'
): Promise<ParsedGradesResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const grades: Omit<GradeEntry, 'id'>[] = [];
  const matchedStudentIds = new Set<string>();

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { grades: [], errors: ['Tệp Excel rỗng hoặc không có trang tính (Sheet).'], warnings: [], totalRows: 0, matchedStudentsCount: 0 };
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (rawRows.length < 2) {
    return { grades: [], errors: ['Tệp Excel cần có ít nhất 1 dòng tiêu đề cột và 1 dòng dữ liệu điểm.'], warnings: [], totalRows: 0, matchedStudentsCount: 0 };
  }

  // Find header row: look for row with student identification or grade columns
  let headerIndex = -1;
  for (let r = 0; r < Math.min(10, rawRows.length); r++) {
    const rowStr = rawRows[r].map(c => String(c).toLowerCase()).join(' ');
    if (
      rowStr.includes('họ') || 
      rowStr.includes('tên') || 
      rowStr.includes('mã hs') || 
      rowStr.includes('đgtx') || 
      rowStr.includes('giữa kỳ') ||
      rowStr.includes('môn') ||
      rowStr.includes('điểm')
    ) {
      headerIndex = r;
      break;
    }
  }

  if (headerIndex === -1) headerIndex = 0;

  const headers = rawRows[headerIndex].map(h => String(h).trim().toLowerCase());

  // Check if Matrix format (columns for ĐGTX 1..4, Giữa kỳ, Cuối kỳ)
  const matrixCols: { colIndex: number; gradeType: GradeEntry['gradeType'] }[] = [];
  headers.forEach((h, idx) => {
    if (h.includes('đgtx 1') || h.includes('tx1') || h.includes('đgtx1') || h.includes('miệng')) {
      matrixCols.push({ colIndex: idx, gradeType: 'ĐGTX 1' });
    } else if (h.includes('đgtx 2') || h.includes('tx2') || h.includes('đgtx2')) {
      matrixCols.push({ colIndex: idx, gradeType: 'ĐGTX 2' });
    } else if (h.includes('đgtx 3') || h.includes('tx3') || h.includes('đgtx3')) {
      matrixCols.push({ colIndex: idx, gradeType: 'ĐGTX 3' });
    } else if (h.includes('đgtx 4') || h.includes('tx4') || h.includes('đgtx4')) {
      matrixCols.push({ colIndex: idx, gradeType: 'ĐGTX 4' });
    } else if (h.includes('giữa kỳ') || h.includes('giua ky') || h.includes('gk') || h.includes('đgđk 1') || h.includes('1 tiết')) {
      matrixCols.push({ colIndex: idx, gradeType: 'Giữa kỳ' });
    } else if (h.includes('cuối kỳ') || h.includes('cuoi ky') || h.includes('ck') || h.includes('thi')) {
      matrixCols.push({ colIndex: idx, gradeType: 'Cuối kỳ' });
    }
  });

  const colCode = headers.findIndex(h => h.includes('mã') || h.includes('code') || h.includes('id') || h.includes('sbd'));
  const colName = headers.findIndex(h => (h.includes('họ') && h.includes('tên')) || h.includes('họ tên') || h.includes('tên học sinh') || h === 'tên' || h.includes('name'));
  const colSubject = headers.findIndex(h => h.includes('môn') || h.includes('subject'));
  const colScore = headers.findIndex((h, idx) => (h.includes('điểm') || h.includes('score')) && !matrixCols.some(mc => mc.colIndex === idx));
  const colGradeType = headers.findIndex(h => h.includes('loại') || h.includes('cột') || h.includes('hình thức'));
  const colDate = headers.findIndex(h => h.includes('ngày') || h.includes('date'));
  const colNote = headers.findIndex(h => h.includes('ghi chú') || h.includes('note') || h.includes('nhận xét'));

  const isMatrix = matrixCols.length > 0;
  const todayStr = new Date().toISOString().slice(0, 10);

  // Student matcher by code or name
  const findStudent = (codeVal: string, nameVal: string): Student | undefined => {
    const cClean = codeVal.trim().toUpperCase();
    if (cClean) {
      const foundByCode = students.find(s => s.code.trim().toUpperCase() === cClean);
      if (foundByCode) return foundByCode;
    }
    const nClean = nameVal.trim().toLowerCase().replace(/\s+/g, ' ');
    if (nClean) {
      const foundByName = students.find(s => s.fullName.trim().toLowerCase().replace(/\s+/g, ' ') === nClean);
      if (foundByName) return foundByName;
    }
    return undefined;
  };

  const parseScoreValue = (raw: any): number | null => {
    if (raw === '' || raw === null || raw === undefined) return null;
    const str = String(raw).trim().replace(',', '.');
    const num = parseFloat(str);
    if (isNaN(num)) return null;
    if (num < 0 || num > 10) return null;
    return Math.round(num * 10) / 10;
  };

  for (let r = headerIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.every(cell => String(cell).trim() === '')) continue;

    const rawCode = colCode !== -1 ? String(row[colCode] || '').trim() : '';
    const rawName = colName !== -1 ? String(row[colName] || '').trim() : '';
    const student = findStudent(rawCode, rawName);

    if (!student) {
      if (rawCode || rawName) {
        warnings.push(`Dòng ${r + 1}: Không tìm thấy học sinh với mã "${rawCode}" hoặc họ tên "${rawName}" trong danh sách lớp.`);
      }
      continue;
    }

    matchedStudentIds.add(student.id);
    const rowSubject = colSubject !== -1 && row[colSubject] 
      ? normalizeTHPTSubject(row[colSubject]) 
      : defaultSubject;
    const noteVal = colNote !== -1 && row[colNote] ? String(row[colNote]).trim() : '';
    const dateVal = colDate !== -1 && row[colDate] ? String(row[colDate]).trim() : todayStr;

    if (isMatrix) {
      // Matrix format: each grade column is a separate grade
      for (const m of matrixCols) {
        const val = row[m.colIndex];
        if (val === '' || val === null || val === undefined) continue;

        const score = parseScoreValue(val);
        if (score === null) {
          warnings.push(`Dòng ${r + 1} (${student.fullName}): Điểm "${val}" ở cột ${m.gradeType} không hợp lệ (cần là số từ 0 đến 10).`);
          continue;
        }

        grades.push({
          classId,
          studentId: student.id,
          subject: rowSubject,
          gradeType: m.gradeType,
          score,
          date: dateVal,
          note: noteVal
        });
      }
    } else {
      // List format
      const val = colScore !== -1 ? row[colScore] : '';
      if (val === '' || val === null || val === undefined) continue;

      const score = parseScoreValue(val);
      if (score === null) {
        warnings.push(`Dòng ${r + 1} (${student.fullName}): Điểm "${val}" không hợp lệ (cần là số từ 0 đến 10).`);
        continue;
      }

      const gType = colGradeType !== -1 && row[colGradeType] 
        ? normalizeGradeType(row[colGradeType]) 
        : 'ĐGTX 1';

      grades.push({
        classId,
        studentId: student.id,
        subject: rowSubject,
        gradeType: gType,
        score,
        date: dateVal,
        note: noteVal
      });
    }
  }

  return {
    grades,
    errors,
    warnings,
    totalRows: rawRows.length - (headerIndex + 1),
    matchedStudentsCount: matchedStudentIds.size
  };
}

/**
 * Downloads a pre-formatted Excel template for entering THPT grades
 */
export function downloadGradeTemplateExcel(
  currentClass: ClassInfo,
  students: Student[],
  defaultSubject: string = 'Toán'
): void {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Matrix format (Ma trận điểm môn học - thuận tiện nhất cho GV)
  const matrixData: any[][] = [
    [`BẢNG ĐIỂM MÔN ${defaultSubject.toUpperCase()} - LỚP ${currentClass.name.toUpperCase()} (BẬC THPT)`],
    ['* Hướng dẫn: Thầy/Cô chỉ cần nhập điểm số (từ 0.0 đến 10.0) vào các cột ĐGTX 1-4, Giữa kỳ, Cuối kỳ. Ô trống sẽ được bỏ qua.'],
    [],
    ['STT', 'Mã HS', 'Họ và tên', 'Môn học', 'ĐGTX 1', 'ĐGTX 2', 'ĐGTX 3', 'ĐGTX 4', 'Giữa kỳ', 'Cuối kỳ', 'Ghi chú']
  ];

  if (students.length > 0) {
    students.forEach((s, idx) => {
      matrixData.push([
        idx + 1,
        s.code,
        s.fullName,
        defaultSubject,
        '', // ĐGTX 1
        '', // ĐGTX 2
        '', // ĐGTX 3
        '', // ĐGTX 4
        '', // Giữa kỳ
        '', // Cuối kỳ
        ''  // Ghi chú
      ]);
    });
  } else {
    matrixData.push(
      [1, 'HS01', 'Nguyễn Hoàng Minh', defaultSubject, 9.0, 8.5, '', '', 9.0, 8.5, 'Bài làm tốt'],
      [2, 'HS02', 'Trần Lê Bảo Ngọc', defaultSubject, 10.0, 9.5, '', '', 9.5, 10.0, 'Xuất sắc']
    );
  }

  const wsMatrix = XLSX.utils.aoa_to_sheet(matrixData);
  wsMatrix['!cols'] = [
    { wch: 6 },
    { wch: 10 },
    { wch: 24 },
    { wch: 22 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 25 }
  ];
  XLSX.utils.book_append_sheet(workbook, wsMatrix, 'Nhap_Theo_Mon');

  // Sheet 2: Danh sách tổng hợp nhiều môn
  const listData: any[][] = [
    ['MẪU NHẬP ĐIỂM DANH SÁCH TỔNG HỢP (NHIỀU MÔN THPT)'],
    ['* Danh sách các môn THPT: Toán, Ngữ văn, Tiếng Anh, Vật lí, Hóa học, Sinh học, Lịch sử, Địa lí, GDKT&PL, Tin học, Công nghệ, GDQP-AN, GDTC, HĐTN-HN.'],
    [],
    ['STT', 'Mã HS', 'Họ và tên', 'Môn học', 'Loại điểm', 'Điểm số', 'Ngày kiểm tra', 'Ghi chú'],
    [1, 'HS01', 'Nguyễn Hoàng Minh', 'Toán', 'ĐGTX 1', 9.0, '2024-10-15', 'Kiểm tra 15 phút'],
    [2, 'HS01', 'Nguyễn Hoàng Minh', 'Ngữ văn', 'Giữa kỳ', 8.5, '2024-10-20', 'Làm văn tốt'],
    [3, 'HS02', 'Trần Lê Bảo Ngọc', 'Vật lí', 'ĐGTX 1', 9.5, '2024-10-15', ''],
    [4, 'HS02', 'Trần Lê Bảo Ngọc', 'Tiếng Anh', 'Cuối kỳ', 10.0, '2024-10-25', ''],
    [5, 'HS03', 'Lê Quốc Anh', 'Hóa học', 'ĐGTX 1', 8.0, '2024-10-15', ''],
    [6, 'HS04', 'Phạm Thị Quỳnh Mai', 'Lịch sử', 'ĐGTX 1', 9.0, '2024-10-15', ''],
    [7, 'HS05', 'Vũ Gia Huy', 'Giáo dục quốc phòng và an ninh (GDQP-AN)', 'ĐGTX 1', 8.5, '2024-10-15', ''],
    [8, 'HS06', 'Đặng Thùy Dương', 'Giáo dục kinh tế và pháp luật (GDKT&PL)', 'ĐGTX 1', 9.0, '2024-10-15', '']
  ];
  const wsList = XLSX.utils.aoa_to_sheet(listData);
  wsList['!cols'] = [
    { wch: 6 },
    { wch: 10 },
    { wch: 24 },
    { wch: 28 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
    { wch: 25 }
  ];
  XLSX.utils.book_append_sheet(workbook, wsList, 'Nhap_Danh_Sach');

  const fileName = `Mau_nhap_diem_THPT_${currentClass.name.replace(/\s+/g, '_')}_${defaultSubject.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export full Gradebook to styled Excel .xlsx file with statistics
 */
export function exportGradesToExcel(
  className: string,
  teacherName: string,
  grades: GradeEntry[],
  students: Student[],
  subjectFilter: string = 'all'
): void {
  const workbook = XLSX.utils.book_new();
  const subjectTitle = subjectFilter === 'all' ? 'TẤT CẢ CÁC MÔN' : subjectFilter.toUpperCase();

  const scores = grades.map(g => g.score);
  const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : '0';
  const max = scores.length > 0 ? Math.max(...scores).toFixed(1) : '0';
  const min = scores.length > 0 ? Math.min(...scores).toFixed(1) : '0';
  const passCount = scores.filter(s => s >= 5.0).length;
  const goodCount = scores.filter(s => s >= 8.0).length;

  const data: any[][] = [
    [`SỔ ĐIỂM CÁ NHÂN THEO DÕI HỌC SINH THPT - LỚP ${className.toUpperCase()}`],
    [`Môn học: ${subjectTitle} · Giáo viên: ${teacherName} · Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`],
    [],
    ['THỐNG KÊ CHUNG', 'SỐ LƯỢNG / TỶ LỆ'],
    ['Tổng số đầu điểm đã ghi', scores.length],
    ['Điểm trung bình toàn lớp', Number(avg)],
    ['Điểm cao nhất', Number(max)],
    ['Điểm thấp nhất', Number(min)],
    ['Tỷ lệ Đạt (≥ 5.0)', `${passCount}/${scores.length} (${scores.length ? Math.round((passCount / scores.length) * 100) : 0}%)`],
    ['Tỷ lệ Giỏi (≥ 8.0)', `${goodCount}/${scores.length} (${scores.length ? Math.round((goodCount / scores.length) * 100) : 0}%)`],
    [],
    ['CHI TIẾT ĐIỂM SỐ CÁC HỌC SINH'],
    ['STT', 'Mã HS', 'Họ và tên', 'Tổ', 'Môn học (THPT)', 'Loại điểm', 'Điểm số', 'Đánh giá', 'Ngày kiểm tra', 'Ghi chú']
  ];

  grades.forEach((g, idx) => {
    const st = students.find(s => s.id === g.studentId);
    const evalStr = g.score >= 8.0 ? 'Giỏi' : g.score >= 6.5 ? 'Khá' : g.score >= 5.0 ? 'Đạt' : 'Chưa đạt';
    data.push([
      idx + 1,
      st?.code || '',
      st?.fullName || 'Học sinh',
      st ? `Tổ ${st.team}` : '',
      g.subject,
      g.gradeType,
      g.score,
      evalStr,
      g.date,
      g.note || ''
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 10 },
    { wch: 24 },
    { wch: 8 },
    { wch: 28 },
    { wch: 14 },
    { wch: 10 },
    { wch: 12 },
    { wch: 14 },
    { wch: 30 }
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'So_Diem_THPT');
  const fileName = `So_diem_THPT_${className.replace(/\s+/g, '_')}_${subjectFilter === 'all' ? 'TongHop' : subjectFilter.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Normalizes emulation criterion category
 */
export function normalizeCriterionCategory(raw: any): EmulationCriterion['category'] {
  if (!raw) return 'Học tập';
  const str = String(raw).trim().toLowerCase();
  if (str.includes('kỷ luật') || str.includes('ky luat') || str.includes('nề nếp') || str.includes('ne nep') || str.includes('đồng phục')) {
    return 'Kỷ luật';
  }
  if (str.includes('chuyên cần') || str.includes('chuyen can') || str.includes('đi học') || str.includes('vắng') || str.includes('muộn')) {
    return 'Chuyên cần';
  }
  if (str.includes('phong trào') || str.includes('phong trao') || str.includes('lao động') || str.includes('lao dong') || str.includes('trực nhật') || str.includes('vệ sinh') || str.includes('đoàn')) {
    return 'Phong trào & Lao động';
  }
  if (str.includes('đạo đức') || str.includes('dao duc') || str.includes('hành vi') || str.includes('thái độ') || str.includes('lễ phép')) {
    return 'Đạo đức';
  }
  return 'Học tập';
}

/**
 * Normalizes emulation criterion target type
 */
export function normalizeCriterionTargetType(raw: any): EmulationCriterion['targetType'] {
  if (!raw) return 'individual';
  const str = String(raw).trim().toLowerCase();
  if (str.includes('tổ') || str.includes('to') || str.includes('nhóm') || str.includes('team')) {
    return 'team';
  }
  if (str.includes('lớp') || str.includes('lop') || str.includes('cả lớp') || str.includes('class') || str.includes('tập thể')) {
    return 'class';
  }
  return 'individual';
}

export interface ParsedCriteriaResult {
  criteria: Omit<EmulationCriterion, 'id'>[];
  errors: string[];
  warnings: string[];
  totalRows: number;
}

/**
 * Parses Excel file (.xlsx, .xls, .csv) containing emulation criteria
 */
export async function parseCriteriaExcelFile(file: File): Promise<ParsedCriteriaResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const criteria: Omit<EmulationCriterion, 'id'>[] = [];

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { criteria: [], errors: ['Tệp Excel rỗng hoặc không có trang tính.'], warnings: [], totalRows: 0 };
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (rawRows.length < 2) {
    return { criteria: [], errors: ['Tệp Excel cần có ít nhất 1 dòng tiêu đề cột và 1 dòng tiêu chí.'], warnings: [], totalRows: 0 };
  }

  // Find header row
  let headerIndex = -1;
  for (let r = 0; r < Math.min(8, rawRows.length); r++) {
    const rowStr = rawRows[r].map(c => String(c).toLowerCase()).join(' ');
    if (
      rowStr.includes('tiêu chí') || 
      rowStr.includes('nội dung') || 
      rowStr.includes('tên') || 
      rowStr.includes('điểm') || 
      rowStr.includes('lĩnh vực')
    ) {
      headerIndex = r;
      break;
    }
  }

  if (headerIndex === -1) headerIndex = 0;

  const headers = rawRows[headerIndex].map(h => String(h).trim().toLowerCase());

  const colName = headers.findIndex(h => h.includes('tiêu chí') || h.includes('nội dung') || (h.includes('tên') && !h.includes('học sinh')) || h.includes('name'));
  const colType = headers.findIndex(h => h.includes('loại') || h.includes('cộng') || h.includes('trừ') || h.includes('type') || h.includes('+/-'));
  const colPoints = headers.findIndex(h => h.includes('điểm') || h.includes('points') || h.includes('mức điểm') || h.includes('score'));
  const colCategory = headers.findIndex(h => h.includes('lĩnh vực') || h.includes('danh mục') || h.includes('nhóm') || h.includes('category'));
  const colTarget = headers.findIndex(h => h.includes('đối tượng') || h.includes('áp dụng') || h.includes('target'));

  if (colName === -1 && colPoints === -1) {
    return { 
      criteria: [], 
      errors: ['Không nhận diện được cột "Tên tiêu chí" hoặc "Số điểm". Vui lòng kiểm tra lại dòng tiêu đề cột hoặc tải tệp mẫu.'], 
      warnings: [], 
      totalRows: 0 
    };
  }

  const finalNameCol = colName !== -1 ? colName : 1;
  const finalPointsCol = colPoints !== -1 ? colPoints : 2;

  for (let r = headerIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.every(cell => String(cell).trim() === '')) continue;

    const rawName = row[finalNameCol] ? String(row[finalNameCol]).trim() : '';
    if (!rawName) continue;

    const rawPointsVal = row[finalPointsCol];
    const rawTypeVal = colType !== -1 && row[colType] ? String(row[colType]).trim() : '';
    const rawCatVal = colCategory !== -1 && row[colCategory] ? String(row[colCategory]).trim() : '';
    const rawTargetVal = colTarget !== -1 && row[colTarget] ? String(row[colTarget]).trim() : '';

    // Determine points and type
    let points = 5;
    let type: 'plus' | 'minus' = 'plus';

    if (rawPointsVal !== undefined && rawPointsVal !== '') {
      const parsedNum = parseFloat(String(rawPointsVal).replace(',', '.').replace(/[^0-9.-]/g, ''));
      if (!isNaN(parsedNum)) {
        if (parsedNum < 0) {
          type = 'minus';
          points = Math.abs(parsedNum);
        } else {
          points = parsedNum;
        }
      }
    }

    // Type text override
    const typeStr = rawTypeVal.toLowerCase();
    if (typeStr.includes('trừ') || typeStr.includes('-') || typeStr.includes('minus') || typeStr.includes('phạt')) {
      type = 'minus';
    } else if (typeStr.includes('cộng') || typeStr.includes('+') || typeStr.includes('plus') || typeStr.includes('thưởng')) {
      type = 'plus';
    }

    // Category
    const category = normalizeCriterionCategory(rawCatVal);

    // Target type
    const targetType = normalizeCriterionTargetType(rawTargetVal);

    criteria.push({
      name: rawName,
      type,
      points,
      category,
      targetType
    });
  }

  return {
    criteria,
    errors,
    warnings,
    totalRows: rawRows.length - (headerIndex + 1)
  };
}

/**
 * Downloads a pre-formatted Excel template for entering Emulation Criteria
 */
export function downloadCriteriaTemplateExcel(): void {
  const data: any[][] = [
    ['MẪU NHẬP TIÊU CHÍ THI ĐUA LỚP HỌC (CLASS PRO)'],
    ['* Hướng dẫn: Thầy/Cô điền tên tiêu chí, loại điểm (+ hoặc -), số điểm và lĩnh vực. Cột đối tượng có thể là: Cá nhân, Tổ hoặc Cả lớp.'],
    [],
    ['STT', 'Tên tiêu chí thi đua', 'Loại điểm (+ / -)', 'Số điểm', 'Lĩnh vực', 'Đối tượng áp dụng'],
    [1, 'Phát biểu xây dựng bài xuất sắc', 'Cộng điểm', 5, 'Học tập', 'Cá nhân'],
    [2, 'Đạt điểm 9, 10 trong các bài kiểm tra', 'Cộng điểm', 10, 'Học tập', 'Cá nhân'],
    [3, 'Không chuẩn bị bài hoặc quên sách vở', 'Trừ điểm', 5, 'Học tập', 'Cá nhân'],
    [4, 'Đi học muộn không có lý do chính đáng', 'Trừ điểm', 5, 'Chuyên cần', 'Cá nhân'],
    [5, 'Nghỉ học không phép', 'Trừ điểm', 10, 'Chuyên cần', 'Cá nhân'],
    [6, 'Mặc đồng phục, tác phong đúng quy định', 'Cộng điểm', 5, 'Kỷ luật', 'Cá nhân'],
    [7, 'Sử dụng điện thoại trong giờ học khi chưa được phép', 'Trừ điểm', 10, 'Kỷ luật', 'Cá nhân'],
    [8, 'Trực nhật lớp sạch sẽ, đúng giờ, đổ rác đúng nơi', 'Cộng điểm', 5, 'Phong trào & Lao động', 'Tổ'],
    [9, 'Trực nhật muộn hoặc lớp còn bẩn', 'Trừ điểm', 5, 'Phong trào & Lao động', 'Tổ'],
    [10, 'Tích cực tham gia hoạt động Đoàn / Phong trào trường', 'Cộng điểm', 10, 'Phong trào & Lao động', 'Cá nhân'],
    [11, 'Giúp đỡ bạn tiến bộ trong học tập', 'Cộng điểm', 5, 'Đạo đức', 'Cá nhân'],
    [12, 'Nói tục, gây mất đoàn kết nội bộ', 'Trừ điểm', 15, 'Đạo đức', 'Cá nhân'],
    [13, 'Tập thể Tổ xếp thứ nhất phong trào tuần', 'Cộng điểm', 20, 'Phong trào & Lao động', 'Tổ']
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 45 }, // Tên tiêu chí
    { wch: 18 }, // Loại điểm
    { wch: 12 }, // Số điểm
    { wch: 25 }, // Lĩnh vực
    { wch: 20 }  // Đối tượng
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Mau_Tieu_Chi');

  XLSX.writeFile(workbook, 'Mau_Nhap_Tieu_Chi_Thi_Dua.xlsx');
}

/**
 * Export current emulation criteria to styled Excel file
 */
export function exportCriteriaToExcel(criteria: EmulationCriterion[], className: string): void {
  const data: any[][] = [
    [`DANH MỤC TIÊU CHÍ THI ĐUA - LỚP ${className.toUpperCase()}`],
    [`Ngày kết xuất: ${new Date().toLocaleDateString('vi-VN')} · Tổng số: ${criteria.length} tiêu chí`],
    [],
    ['STT', 'Tên tiêu chí thi đua', 'Loại điểm', 'Mức điểm', 'Lĩnh vực', 'Đối tượng áp dụng']
  ];

  criteria.forEach((crit, idx) => {
    data.push([
      idx + 1,
      crit.name,
      crit.type === 'plus' ? 'Cộng điểm (+)' : 'Trừ điểm (-)',
      crit.type === 'plus' ? `+${crit.points}` : `-${crit.points}`,
      crit.category,
      crit.targetType === 'individual' ? 'Cá nhân' : crit.targetType === 'team' ? 'Tổ' : 'Cả lớp'
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 45 },
    { wch: 18 },
    { wch: 14 },
    { wch: 25 },
    { wch: 20 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh_Muc_Tieu_Chi');

  const fileName = `Danh_muc_tieu_chi_thi_dua_${className.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}


