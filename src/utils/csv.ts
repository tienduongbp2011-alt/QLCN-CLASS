import { Student } from '../types';

export function exportStudentsToCSV(students: Student[], className: string): void {
  // UTF-8 BOM for Excel Vietnamese compatibility
  const BOM = '\uFEFF';
  const headers = ['STT', 'Mã HS', 'Họ và tên', 'Ngày sinh', 'Giới tính', 'Tổ', 'Chức vụ', 'SĐT học sinh', 'SĐT phụ huynh', 'Ghi chú', 'Xu'];
  
  const rows = students.map((s, idx) => [
    idx + 1,
    `"${s.code.replace(/"/g, '""')}"`,
    `"${s.fullName.replace(/"/g, '""')}"`,
    `"${s.birthDate}"`,
    `"${s.gender}"`,
    `"${s.team}"`,
    `"${s.role}"`,
    `"${s.phone || ''}"`,
    `"${s.parentPhone || ''}"`,
    `"${(s.notes || '').replace(/"/g, '""')}"`,
    s.coins || 0
  ]);

  const csvContent = BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Danh_sach_hoc_sinh_${className.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseStudentsCSV(csvText: string, classId: string): { students: Student[]; errors: string[] } {
  const errors: string[] = [];
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) {
    return { students: [], errors: ['Tệp CSV không có dữ liệu học sinh hợp lệ (cần ít nhất dòng tiêu đề và 1 dòng dữ liệu).'] };
  }

  // Remove BOM if present
  let headerLine = lines[0];
  if (headerLine.charCodeAt(0) === 0xFEFF) {
    headerLine = headerLine.substr(1);
  }

  // Parse lines considering quotes
  const parseCSVLine = (text: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const parsedStudents: Student[] = [];
  const existingCodes = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 2) continue;

    // We can accept: STT, Mã HS, Họ và tên, Ngày sinh, Giới tính, Tổ, Chức vụ, SĐT, SĐT PH, Ghi chú, Xu
    // or just: Mã HS, Họ tên, ...
    let code = '';
    let name = '';
    let dob = '';
    let gender: 'Nam' | 'Nữ' = 'Nam';
    let team = 1;
    let role = 'Thành viên';
    let phone = '';
    let parentPhone = '';
    let notes = '';

    if (cols.length >= 3 && /^\d+$/.test(cols[0])) {
      // With STT index column
      code = cols[1] || `HS${String(i).padStart(2, '0')}`;
      name = cols[2] || '';
      dob = cols[3] || '2010-01-01';
      gender = cols[4]?.toLowerCase().includes('nữ') ? 'Nữ' : 'Nam';
      team = parseInt(cols[5], 10) || 1;
      role = (cols[6] as any) || 'Thành viên';
      phone = cols[7] || '';
      parentPhone = cols[8] || '';
      notes = cols[9] || '';
    } else {
      code = cols[0] || `HS${String(i).padStart(2, '0')}`;
      name = cols[1] || '';
      dob = cols[2] || '2010-01-01';
      gender = cols[3]?.toLowerCase().includes('nữ') ? 'Nữ' : 'Nam';
      team = parseInt(cols[4], 10) || 1;
      role = (cols[5] as any) || 'Thành viên';
      phone = cols[6] || '';
      parentPhone = cols[7] || '';
      notes = cols[8] || '';
    }

    if (!name.trim()) {
      errors.push(`Dòng ${i + 1}: Thiếu họ và tên học sinh.`);
      continue;
    }

    if (existingCodes.has(code.toUpperCase())) {
      errors.push(`Dòng ${i + 1}: Trùng mã học sinh '${code}'. Tự động tạo mã mới.`);
      code = `HS${Date.now().toString(36).slice(-4).toUpperCase()}`;
    }
    existingCodes.add(code.toUpperCase());

    parsedStudents.push({
      id: 'std_' + Math.random().toString(36).slice(2, 9),
      classId,
      code,
      fullName: name,
      birthDate: dob,
      gender,
      team: Math.min(Math.max(team, 1), 4),
      role: role as any,
      phone,
      parentPhone,
      notes,
      coins: 0,
      status: 'active'
    });
  }

  return { students: parsedStudents, errors };
}
