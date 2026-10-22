import { 
  FullClassDataStore, 
  ClassInfo, 
  Student, 
  EmulationCriterion, 
  EmulationLog, 
  AttendanceRecord, 
  Announcement, 
  StudentRemark, 
  RewardItem, 
  TimetableSchedule, 
  SeatingChartConfig,
  GradeEntry
} from '../types';

const STORAGE_KEY = 'class_pro_master_store_v1';

export const SAMPLE_CLASS_ID = 'cls_10_a1_sample';

export const INITIAL_SAMPLE_STUDENTS: Student[] = [
  {
    id: 'std_01',
    classId: SAMPLE_CLASS_ID,
    code: 'HS01',
    fullName: 'Nguyễn Hoàng Minh',
    birthDate: '2010-03-15',
    gender: 'Nam',
    team: 1,
    role: 'Lớp trưởng',
    phone: '0912345601',
    parentPhone: '0987654301',
    notes: 'Nhanh nhẹn, có tinh thần trách nhiệm cao, quản lý lớp tốt.',
    coins: 45,
    status: 'active'
  },
  {
    id: 'std_02',
    classId: SAMPLE_CLASS_ID,
    code: 'HS02',
    fullName: 'Trần Lê Bảo Ngọc',
    birthDate: '2010-07-22',
    gender: 'Nữ',
    team: 1,
    role: 'Lớp phó học tập',
    phone: '0912345602',
    parentPhone: '0987654302',
    notes: 'Học lực xuất sắc, thường xuyên hỗ trợ các bạn ôn tập nhóm.',
    coins: 52,
    status: 'active'
  },
  {
    id: 'std_03',
    classId: SAMPLE_CLASS_ID,
    code: 'HS03',
    fullName: 'Lê Quốc Anh',
    birthDate: '2010-11-04',
    gender: 'Nam',
    team: 1,
    role: 'Tổ trưởng',
    phone: '0912345603',
    parentPhone: '0987654303',
    notes: 'Nhiệt tình, điều hành tổ 1 nghiêm túc.',
    coins: 38,
    status: 'active'
  },
  {
    id: 'std_04',
    classId: SAMPLE_CLASS_ID,
    code: 'HS04',
    fullName: 'Phạm Thị Quỳnh Mai',
    birthDate: '2010-05-18',
    gender: 'Nữ',
    team: 1,
    role: 'Thành viên',
    phone: '0912345604',
    parentPhone: '0987654304',
    notes: 'Chăm chỉ, chữ viết đẹp, cẩn thận.',
    coins: 30,
    status: 'active'
  },
  {
    id: 'std_05',
    classId: SAMPLE_CLASS_ID,
    code: 'HS05',
    fullName: 'Vũ Gia Huy',
    birthDate: '2010-09-09',
    gender: 'Nam',
    team: 2,
    role: 'Tổ trưởng',
    phone: '0912345605',
    parentPhone: '0987654305',
    notes: 'Có năng khiếu thể thao, tích cực tham gia phong trào trường.',
    coins: 40,
    status: 'active'
  },
  {
    id: 'std_06',
    classId: SAMPLE_CLASS_ID,
    code: 'HS06',
    fullName: 'Đặng Thùy Dương',
    birthDate: '2010-02-28',
    gender: 'Nữ',
    team: 2,
    role: 'Thủ quỹ',
    phone: '0912345606',
    parentPhone: '0987654306',
    notes: 'Trung thực, tính toán cẩn thận, quản lý quỹ minh bạch.',
    coins: 35,
    status: 'active'
  },
  {
    id: 'std_07',
    classId: SAMPLE_CLASS_ID,
    code: 'HS07',
    fullName: 'Bùi Tuấn Kiệt',
    birthDate: '2010-08-14',
    gender: 'Nam',
    team: 2,
    role: 'Lớp phó lao động',
    phone: '0912345607',
    parentPhone: '0987654307',
    notes: 'Phân công và đôn đốc trực nhật rất sạch sẽ và đúng giờ.',
    coins: 32,
    status: 'active'
  },
  {
    id: 'std_08',
    classId: SAMPLE_CLASS_ID,
    code: 'HS08',
    fullName: 'Đỗ Khánh Linh',
    birthDate: '2010-12-01',
    gender: 'Nữ',
    team: 2,
    role: 'Thành viên',
    phone: '0912345608',
    parentPhone: '0987654308',
    notes: 'Hơi rụt rè khi phát biểu, đang có nhiều tiến bộ trong môn Văn.',
    coins: 28,
    status: 'active'
  },
  {
    id: 'std_09',
    classId: SAMPLE_CLASS_ID,
    code: 'HS09',
    fullName: 'Hoàng Nhật Nam',
    birthDate: '2010-04-10',
    gender: 'Nam',
    team: 3,
    role: 'Tổ trưởng',
    phone: '0912345609',
    parentPhone: '0987654309',
    notes: 'Thông minh, tư duy logic tốt môn Toán và KHTN.',
    coins: 48,
    status: 'active'
  },
  {
    id: 'std_10',
    classId: SAMPLE_CLASS_ID,
    code: 'HS10',
    fullName: 'Ngô Phương Anh',
    birthDate: '2010-10-25',
    gender: 'Nữ',
    team: 3,
    role: 'Tổ phó',
    phone: '0912345610',
    parentPhone: '0987654310',
    notes: 'Khéo tay, đóng góp nhiều cho trang trí báo tường và bảng tin.',
    coins: 34,
    status: 'active'
  },
  {
    id: 'std_11',
    classId: SAMPLE_CLASS_ID,
    code: 'HS11',
    fullName: 'Trịnh Bảo Lâm',
    birthDate: '2010-06-12',
    gender: 'Nam',
    team: 3,
    role: 'Thành viên',
    phone: '0912345611',
    parentPhone: '0987654311',
    notes: 'Đôi lúc còn quên đem tập bài tập, cần nhắc nhở đầu buổi.',
    coins: 22,
    status: 'active'
  },
  {
    id: 'std_12',
    classId: SAMPLE_CLASS_ID,
    code: 'HS12',
    fullName: 'Đinh Ngọc Diệp',
    birthDate: '2010-01-19',
    gender: 'Nữ',
    team: 4,
    role: 'Tổ trưởng',
    phone: '0912345612',
    parentPhone: '0987654312',
    notes: 'Giọng đọc truyền cảm, thường xuyên dẫn chương trình sinh hoạt lớp.',
    coins: 42,
    status: 'active'
  },
  {
    id: 'std_13',
    classId: SAMPLE_CLASS_ID,
    code: 'HS13',
    fullName: 'Lý Hải Đăng',
    birthDate: '2010-07-05',
    gender: 'Nam',
    team: 4,
    role: 'Tổ phó',
    phone: '0912345613',
    parentPhone: '0987654313',
    notes: 'Say mê Tin học và công nghệ, hỗ trợ máy chiếu của lớp.',
    coins: 37,
    status: 'active'
  },
  {
    id: 'std_14',
    classId: SAMPLE_CLASS_ID,
    code: 'HS14',
    fullName: 'Phan Thảo My',
    birthDate: '2010-09-30',
    gender: 'Nữ',
    team: 4,
    role: 'Thành viên',
    phone: '0912345614',
    parentPhone: '0987654314',
    notes: 'Tích cực tham gia các tiết thảo luận văn học, phát biểu hay.',
    coins: 36,
    status: 'active'
  },
  {
    id: 'std_15',
    classId: SAMPLE_CLASS_ID,
    code: 'HS15',
    fullName: 'Nguyễn Tuấn Khang',
    birthDate: '2010-12-18',
    gender: 'Nam',
    team: 4,
    role: 'Thành viên',
    phone: '0912345615',
    parentPhone: '0987654315',
    notes: 'Cởi mở, hòa đồng, hay giúp đỡ các bạn trực nhật.',
    coins: 31,
    status: 'active'
  }
];

export const INITIAL_CRITERIA: EmulationCriterion[] = [
  { id: 'crit_01', name: 'Chuẩn bị bài đầy đủ & chu đáo', type: 'plus', points: 5, category: 'Học tập', targetType: 'individual' },
  { id: 'crit_02', name: 'Tích cực phát biểu xây dựng bài', type: 'plus', points: 3, category: 'Học tập', targetType: 'individual' },
  { id: 'crit_03', name: 'Đạt điểm 9-10 kiểm tra miệng/15p', type: 'plus', points: 10, category: 'Học tập', targetType: 'individual' },
  { id: 'crit_04', name: 'Giúp đỡ bạn tiến bộ trong học tập', type: 'plus', points: 8, category: 'Đạo đức', targetType: 'individual' },
  { id: 'crit_05', name: 'Thực hiện tốt nhiệm vụ trực nhật vệ sinh', type: 'plus', points: 5, category: 'Phong trào & Lao động', targetType: 'team' },
  { id: 'crit_06', name: 'Tổ đạt tuần học tốt không ai vi phạm', type: 'plus', points: 15, category: 'Kỷ luật', targetType: 'team' },
  { id: 'crit_07', name: 'Tham gia phong trào văn nghệ / thể thao', type: 'plus', points: 10, category: 'Phong trào & Lao động', targetType: 'individual' },
  { id: 'crit_08', name: 'Nhặt được của rơi trả người đánh mất', type: 'plus', points: 20, category: 'Đạo đức', targetType: 'individual' },
  { id: 'crit_09', name: 'Đi học muộn không có lý do chính đáng', type: 'minus', points: 5, category: 'Chuyên cần', targetType: 'individual' },
  { id: 'crit_10', name: 'Quên sách vở hoặc đồ dùng học tập', type: 'minus', points: 3, category: 'Học tập', targetType: 'individual' },
  { id: 'crit_11', name: 'Làm việc riêng / mất trật tự trong giờ học', type: 'minus', points: 5, category: 'Kỷ luật', targetType: 'individual' },
  { id: 'crit_12', name: 'Trực nhật chưa sạch hoặc hoàn thành muộn', type: 'minus', points: 5, category: 'Phong trào & Lao động', targetType: 'team' },
];

export const INITIAL_REWARDS: RewardItem[] = [
  {
    id: 'rew_01',
    name: 'Vở ghi bài Campus 120 trang cao cấp',
    description: 'Vở kẻ ngang chất lượng cao, chống lóa mắt, giấy dày dặn.',
    coinCost: 25,
    stock: 12,
    icon: 'book-open'
  },
  {
    id: 'rew_02',
    name: 'Bộ bút highlight pastel 6 màu',
    description: 'Bút dạ quang màu sắc nhẹ nhàng, tô điểm tập ghi chép.',
    coinCost: 35,
    stock: 8,
    icon: 'pen-tool'
  },
  {
    id: 'rew_03',
    name: 'Huy hiệu Ngôi Sao Thi Đua Tuần',
    description: 'Huy hiệu danh dự vinh danh học sinh tích cực trước toàn lớp.',
    coinCost: 20,
    stock: 15,
    icon: 'award'
  },
  {
    id: 'rew_04',
    name: 'Thẻ đặc quyền: Miễn trực nhật 1 buổi',
    description: 'Được chuyển giao nhiệm vụ trực nhật cho nhóm dự phòng 1 lần.',
    coinCost: 50,
    stock: 4,
    icon: 'sparkles'
  },
  {
    id: 'rew_05',
    name: 'Thẻ chọn chỗ ngồi yêu thích trong 1 tuần',
    description: 'Được ưu tiên chọn bàn ngồi cùng bạn trong tuần sau.',
    coinCost: 60,
    stock: 3,
    icon: 'star'
  },
  {
    id: 'rew_06',
    name: 'Bộ thước kẻ hình học đa năng',
    description: 'Thước đo độ, thước kẻ 20cm, ê ke phục vụ môn Toán.',
    coinCost: 15,
    stock: 10,
    icon: 'compass'
  }
];

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateSampleStore(): FullClassDataStore {
  const today = getTodayDateString();

  const sampleClass: ClassInfo = {
    id: SAMPLE_CLASS_ID,
    name: 'Lớp 10A1',
    grade: 'Khối 10',
    schoolYear: '2024 - 2025',
    teacherName: 'Cô Nguyễn Thị Mai Hoa',
    roomNumber: 'Phòng học 302 (Dãy nhà B)',
    isSampleData: true
  };

  // Sample attendance for today
  const sampleAttendance: AttendanceRecord[] = [
    {
      id: `${SAMPLE_CLASS_ID}_${today}`,
      classId: SAMPLE_CLASS_ID,
      date: today,
      records: {
        'std_01': { status: 'present' },
        'std_02': { status: 'present' },
        'std_03': { status: 'present' },
        'std_04': { status: 'present' },
        'std_05': { status: 'late', note: 'Kẹt xe ngã tư' },
        'std_06': { status: 'present' },
        'std_07': { status: 'present' },
        'std_08': { status: 'excused', note: 'Gia đình có việc xin phép trước' },
        'std_09': { status: 'present' },
        'std_10': { status: 'present' },
        'std_11': { status: 'present' },
        'std_12': { status: 'present' },
        'std_13': { status: 'present' },
        'std_14': { status: 'present' },
        'std_15': { status: 'present' },
      },
      updatedAt: new Date().toISOString()
    }
  ];

  // Emulation logs
  const sampleEmulationLogs: EmulationLog[] = [
    {
      id: 'log_01',
      classId: SAMPLE_CLASS_ID,
      date: today,
      criterionId: 'crit_02',
      criterionName: 'Tích cực phát biểu xây dựng bài',
      points: 3,
      targetType: 'individual',
      targetId: 'std_02',
      targetName: 'Trần Lê Bảo Ngọc',
      note: 'Phát biểu đúng 3 câu khó trong tiết Toán',
      timestamp: Date.now() - 3600000 * 4
    },
    {
      id: 'log_02',
      classId: SAMPLE_CLASS_ID,
      date: today,
      criterionId: 'crit_05',
      criterionName: 'Thực hiện tốt nhiệm vụ trực nhật vệ sinh',
      points: 5,
      targetType: 'team',
      targetId: '1',
      targetName: 'Tổ 1',
      note: 'Trực nhật bảng sạch, đổ rác đúng nơi quy định',
      timestamp: Date.now() - 3600000 * 3
    },
    {
      id: 'log_03',
      classId: SAMPLE_CLASS_ID,
      date: today,
      criterionId: 'crit_01',
      criterionName: 'Chuẩn bị bài đầy đủ & chu đáo',
      points: 5,
      targetType: 'individual',
      targetId: 'std_01',
      targetName: 'Nguyễn Hoàng Minh',
      note: 'Soạn bài Văn chi tiết',
      timestamp: Date.now() - 3600000 * 2
    },
    {
      id: 'log_04',
      classId: SAMPLE_CLASS_ID,
      date: today,
      criterionId: 'crit_04',
      criterionName: 'Giúp đỡ bạn tiến bộ trong học tập',
      points: 8,
      targetType: 'individual',
      targetId: 'std_09',
      targetName: 'Hoàng Nhật Nam',
      note: 'Hướng dẫn bạn Lâm giải bài tập hình học',
      timestamp: Date.now() - 3600000
    }
  ];

  // Announcements
  const sampleAnnouncements: Announcement[] = [
    {
      id: 'ann_01',
      classId: SAMPLE_CLASS_ID,
      title: 'Kế hoạch kiểm tra giữa kỳ I và phân công ôn tập',
      content: 'Tuần sau lớp sẽ tiến hành kiểm tra giữa kỳ môn Toán và Ngữ văn. Ban cán sự lớp phối hợp các tổ trưởng lập đôi bạn cùng tiến để ôn tập hiệu quả.',
      date: today,
      priority: 'important',
      isPinned: true
    },
    {
      id: 'ann_02',
      classId: SAMPLE_CLASS_ID,
      title: 'Hội thi làm thiệp chào mừng ngày Nhà giáo Việt Nam 20/11',
      content: 'Mỗi tổ chuẩn bị 1 tác phẩm dự thi trước ngày 15/11. Lớp phó văn thể mỹ phụ trách tổng hợp vật liệu trang trí.',
      date: today,
      priority: 'normal',
      isPinned: false
    }
  ];

  // Remarks
  const sampleRemarks: StudentRemark[] = [
    {
      id: 'rem_01',
      classId: SAMPLE_CLASS_ID,
      studentId: 'std_02',
      studentName: 'Trần Lê Bảo Ngọc',
      date: today,
      category: 'Tuyên dương',
      strengths: 'Chăm chỉ, tư duy mạch lạc, luôn sẵn sàng giải thích bài cho các bạn.',
      improvements: 'Tiếp tục phát huy vai trò hỗ trợ tổ học tập.',
      supportPlan: 'Giao nhiệm vụ phụ trách nhóm bồi dưỡng học sinh giỏi môn Toán.',
      isResolved: true
    },
    {
      id: 'rem_02',
      classId: SAMPLE_CLASS_ID,
      studentId: 'std_11',
      studentName: 'Trịnh Bảo Lâm',
      date: today,
      category: 'Kế hoạch hỗ trợ',
      strengths: 'Ý thức đạo đức tốt, lễ phép, hòa đồng với bạn bè.',
      improvements: 'Cần chú ý chuẩn bị đầy đủ bài tập về nhà môn Tiếng Anh.',
      supportPlan: 'Xếp ngồi cùng bạn Nhật Nam để nhắc nhở và kiểm tra chéo vở bài tập.',
      isResolved: false
    }
  ];

  // Sample Seating Chart: 4 rows x 4 cols
  const defaultSeats: SeatingChartConfig = {
    classId: SAMPLE_CLASS_ID,
    rows: 4,
    cols: 4,
    seats: [
      { row: 0, col: 0, studentId: 'std_01' },
      { row: 0, col: 1, studentId: 'std_02' },
      { row: 0, col: 2, studentId: 'std_03' },
      { row: 0, col: 3, studentId: 'std_04' },

      { row: 1, col: 0, studentId: 'std_05' },
      { row: 1, col: 1, studentId: 'std_06' },
      { row: 1, col: 2, studentId: 'std_07' },
      { row: 1, col: 3, studentId: 'std_08' },

      { row: 2, col: 0, studentId: 'std_09' },
      { row: 2, col: 1, studentId: 'std_10' },
      { row: 2, col: 2, studentId: 'std_11' },
      { row: 2, col: 3, studentId: 'std_12' },

      { row: 3, col: 0, studentId: 'std_13' },
      { row: 3, col: 1, studentId: 'std_14' },
      { row: 3, col: 2, studentId: 'std_15' },
      { row: 3, col: 3, studentId: null },
    ]
  };

  // Sample Timetable
  const defaultTimetable: TimetableSchedule = {
    classId: SAMPLE_CLASS_ID,
    morning: {
      2: [
        { period: 1, subject: 'Chào cờ', teacher: 'Toàn trường' },
        { period: 2, subject: 'Toán', teacher: 'Thầy Hưng' },
        { period: 3, subject: 'Toán', teacher: 'Thầy Hưng' },
        { period: 4, subject: 'Ngữ văn', teacher: 'Cô Mai Hoa' },
        { period: 5, subject: 'Lịch sử', teacher: 'Thầy Tuấn' }
      ],
      3: [
        { period: 1, subject: 'Vật lí', teacher: 'Thầy Phúc' },
        { period: 2, subject: 'Hóa học', teacher: 'Cô Lan' },
        { period: 3, subject: 'Tiếng Anh', teacher: 'Cô Emily' },
        { period: 4, subject: 'Tin học', teacher: 'Thầy Minh' },
        { period: 5, subject: 'GDTC', teacher: 'Thầy Dũng' }
      ],
      4: [
        { period: 1, subject: 'Ngữ văn', teacher: 'Cô Mai Hoa' },
        { period: 2, subject: 'Ngữ văn', teacher: 'Cô Mai Hoa' },
        { period: 3, subject: 'Toán', teacher: 'Thầy Hưng' },
        { period: 4, subject: 'Sinh học', teacher: 'Cô Bình' },
        { period: 5, subject: 'GDKT&PL', teacher: 'Cô Nga' }
      ],
      5: [
        { period: 1, subject: 'Tiếng Anh', teacher: 'Cô Emily' },
        { period: 2, subject: 'Tiếng Anh', teacher: 'Cô Emily' },
        { period: 3, subject: 'Công nghệ', teacher: 'Thầy Trực' },
        { period: 4, subject: 'Địa lí', teacher: 'Thầy Tuấn' },
        { period: 5, subject: 'GDQP-AN', teacher: 'Thầy Hoàng' }
      ],
      6: [
        { period: 1, subject: 'Toán', teacher: 'Thầy Hưng' },
        { period: 2, subject: 'Vật lí', teacher: 'Thầy Phúc' },
        { period: 3, subject: 'Ngữ văn', teacher: 'Cô Mai Hoa' },
        { period: 4, subject: 'Nghệ thuật', teacher: 'Cô Oanh' },
        { period: 5, subject: 'HĐTN, HN', teacher: 'Cô Mai Hoa' }
      ],
      7: [
        { period: 1, subject: 'Hóa học', teacher: 'Cô Lan' },
        { period: 2, subject: 'Lịch sử', teacher: 'Thầy Tuấn' },
        { period: 3, subject: 'GDTC', teacher: 'Thầy Dũng' },
        { period: 4, subject: 'Sinh hoạt lớp', teacher: 'Cô Mai Hoa' },
        { period: 5, subject: 'Hoạt động Đoàn trường', teacher: 'Đoàn trường' }
      ]
    },
    afternoon: {
      2: [],
      3: [
        { period: 1, subject: 'Bồi dưỡng HSG', teacher: 'GVBM' },
        { period: 2, subject: 'Bồi dưỡng HSG', teacher: 'GVBM' }
      ],
      4: [],
      5: [
        { period: 1, subject: 'CLB Tiếng Anh', teacher: 'Cô Emily' },
        { period: 2, subject: 'CLB Bóng rổ', teacher: 'Thầy Dũng' }
      ],
      6: [],
      7: []
    }
  };

  // Sample Grades
  const sampleGrades: GradeEntry[] = [
    { id: 'gr_01', classId: SAMPLE_CLASS_ID, studentId: 'std_01', subject: 'Toán', gradeType: 'ĐGTX 1', score: 9.0, date: today },
    { id: 'gr_02', classId: SAMPLE_CLASS_ID, studentId: 'std_02', subject: 'Toán', gradeType: 'ĐGTX 1', score: 10.0, date: today },
    { id: 'gr_03', classId: SAMPLE_CLASS_ID, studentId: 'std_03', subject: 'Vật lí', gradeType: 'ĐGTX 1', score: 8.5, date: today },
    { id: 'gr_04', classId: SAMPLE_CLASS_ID, studentId: 'std_01', subject: 'Ngữ văn', gradeType: 'ĐGTX 1', score: 8.5, date: today },
    { id: 'gr_05', classId: SAMPLE_CLASS_ID, studentId: 'std_02', subject: 'Tiếng Anh', gradeType: 'ĐGTX 1', score: 9.5, date: today },
    { id: 'gr_06', classId: SAMPLE_CLASS_ID, studentId: 'std_03', subject: 'Hóa học', gradeType: 'ĐGTX 1', score: 9.0, date: today },
    { id: 'gr_07', classId: SAMPLE_CLASS_ID, studentId: 'std_04', subject: 'Giáo dục kinh tế và pháp luật (GDKT&PL)', gradeType: 'ĐGTX 1', score: 8.5, date: today },
  ];

  // Sample Fund Data
  const sampleFundCampaigns = [
    {
      id: 'camp_01',
      classId: SAMPLE_CLASS_ID,
      title: 'Quỹ hoạt động lớp Học kỳ I (2024 - 2025)',
      targetAmountPerStudent: 150000,
      startDate: '2024-09-05',
      endDate: '2025-01-15',
      description: 'Chi phí in tài liệu học tập, quỹ khen thưởng thi đua tuần/tháng, nước uống và vệ sinh lớp học.',
      status: 'active' as const
    },
    {
      id: 'camp_02',
      classId: SAMPLE_CLASS_ID,
      title: 'Quỹ liên hoan Trung thu 2024',
      targetAmountPerStudent: 50000,
      startDate: '2024-09-10',
      endDate: '2024-09-17',
      description: 'Mua bánh trung thu, đèn ông sao và đồ uống liên hoan cho 40 học sinh.',
      status: 'completed' as const
    }
  ];

  const sampleFundContributions = INITIAL_SAMPLE_STUDENTS.map((s, idx) => {
    // Mostly paid
    const isPaid = idx < 12;
    const isPartial = idx === 12 || idx === 13;
    const amount = isPaid ? 150000 : isPartial ? 100000 : 0;
    return {
      id: `contrib_${s.id}_camp_01`,
      classId: SAMPLE_CLASS_ID,
      campaignId: 'camp_01',
      studentId: s.id,
      studentName: s.fullName,
      team: s.team,
      amountPaid: amount,
      paidDate: isPaid || isPartial ? '2024-09-10' : '',
      status: isPaid ? ('paid' as const) : isPartial ? ('partial' as const) : ('unpaid' as const),
      paymentMethod: (idx % 3 === 0 ? 'Chuyển khoản' : 'Tiền mặt') as any,
      collector: 'Đặng Thùy Dương (Thủ quỹ)',
      note: isPartial ? 'Còn thiếu 50.000đ hẹn tuần sau' : ''
    };
  });

  const sampleFundTransactions = [
    {
      id: 'tx_01',
      classId: SAMPLE_CLASS_ID,
      type: 'income' as const,
      campaignId: 'camp_01',
      category: 'Thu đóng góp học sinh',
      title: 'Thu đợt 1: Quỹ hoạt động lớp Học kỳ I (14 HS nộp)',
      amount: 2000000,
      date: '2024-09-10',
      payerOrReceiver: 'Tập thể học sinh lớp 9/1',
      receiptNumber: 'PT-01/HK1',
      notes: 'Thủ quỹ Đặng Thùy Dương đã kiểm đếm và ghi sổ',
      createdBy: 'Thủ quỹ'
    },
    {
      id: 'tx_02',
      classId: SAMPLE_CLASS_ID,
      type: 'income' as const,
      category: 'Tài trợ PHHS',
      title: 'Bác Trần Lê Minh (PH em Bảo Ngọc) ủng hộ quỹ phong trào',
      amount: 500000,
      date: '2024-09-15',
      payerOrReceiver: 'PH em Trần Lê Bảo Ngọc',
      receiptNumber: 'PT-02',
      notes: 'Ủng hộ tổ chức các hoạt động học tập ngoại khóa',
      createdBy: 'GVCN'
    },
    {
      id: 'tx_03',
      classId: SAMPLE_CLASS_ID,
      type: 'income' as const,
      category: 'Thưởng thi đua',
      title: 'Tiền thưởng giải Nhất giải bóng đá mini cấp trường',
      amount: 300000,
      date: '2024-10-02',
      payerOrReceiver: 'Đoàn trường trao tặng',
      receiptNumber: 'TT-01',
      notes: 'Nhập vào quỹ lớp để liên hoan chúc mừng',
      createdBy: 'Thủ quỹ'
    },
    {
      id: 'tx_04',
      classId: SAMPLE_CLASS_ID,
      type: 'expense' as const,
      category: 'Khen thưởng thi đua',
      title: 'Mua vở Campus và bút dạ quang khen thưởng thi đua tháng 9',
      amount: 380000,
      date: '2024-09-30',
      payerOrReceiver: 'Nhà sách Fahasa (Cô Mai Hoa mua)',
      receiptNumber: 'PC-01',
      notes: 'Khen thưởng Top 5 học sinh và Tổ 1 dẫn đầu tháng 9',
      createdBy: 'GVCN'
    },
    {
      id: 'tx_05',
      classId: SAMPLE_CLASS_ID,
      type: 'expense' as const,
      category: 'In tài liệu học tập',
      title: 'In đề cương ôn tập giữa học kỳ I môn Toán và Ngữ văn',
      amount: 240000,
      date: '2024-10-05',
      payerOrReceiver: 'Hiệu photocopy cổng trường',
      receiptNumber: 'PC-02',
      notes: 'Phát cho toàn bộ 15 học sinh trong lớp ôn tập',
      createdBy: 'Thủ quỹ'
    },
    {
      id: 'tx_06',
      classId: SAMPLE_CLASS_ID,
      type: 'expense' as const,
      category: 'Cơ sở vật chất lớp',
      title: 'Mua dụng cụ trực nhật: 2 chổi quét, nước lau sàn, khăn lau bảng',
      amount: 115000,
      date: '2024-09-08',
      payerOrReceiver: 'Bùi Tuấn Kiệt (Lớp phó lao động)',
      receiptNumber: 'PC-03',
      notes: 'Phục vụ trực nhật phòng học sạch sẽ',
      createdBy: 'Thủ quỹ'
    },
    {
      id: 'tx_07',
      classId: SAMPLE_CLASS_ID,
      type: 'expense' as const,
      category: 'Thăm hỏi hiếu hỉ',
      title: 'Thăm hỏi bạn Trịnh Bảo Lâm ốm sốt nằm viện',
      amount: 200000,
      date: '2024-10-12',
      payerOrReceiver: 'Ban cán sự lớp đến thăm',
      receiptNumber: 'PC-04',
      notes: 'Mua sữa và hoa quả động viên bạn sớm bình phục',
      createdBy: 'GVCN'
    }
  ];

  return {
    classes: [sampleClass],
    students: INITIAL_SAMPLE_STUDENTS,
    attendance: sampleAttendance,
    criteria: INITIAL_CRITERIA,
    emulationLogs: sampleEmulationLogs,
    announcements: sampleAnnouncements,
    remarks: sampleRemarks,
    groupPlans: [
      {
        id: 'grp_01',
        classId: SAMPLE_CLASS_ID,
        name: 'Dự án thảo luận Văn học - Bài thơ Bếp Lửa',
        date: today,
        groups: [
          { id: 'g1', name: 'Nhóm 1 - Khám phá', studentIds: ['std_01', 'std_02', 'std_03', 'std_04'] },
          { id: 'g2', name: 'Nhóm 2 - Cảm thụ', studentIds: ['std_05', 'std_06', 'std_07', 'std_08'] },
          { id: 'g3', name: 'Nhóm 3 - Sáng tạo', studentIds: ['std_09', 'std_10', 'std_11'] },
          { id: 'g4', name: 'Nhóm 4 - Kết nối', studentIds: ['std_12', 'std_13', 'std_14', 'std_15'] },
        ]
      }
    ],
    grades: sampleGrades,
    seatingCharts: {
      [SAMPLE_CLASS_ID]: defaultSeats
    },
    timetables: {
      [SAMPLE_CLASS_ID]: defaultTimetable
    },
    rewards: INITIAL_REWARDS,
    redemptions: [
      {
        id: 'red_01',
        classId: SAMPLE_CLASS_ID,
        studentId: 'std_02',
        studentName: 'Trần Lê Bảo Ngọc',
        rewardId: 'rew_01',
        rewardName: 'Vở ghi bài Campus 120 trang cao cấp',
        coinsSpent: 25,
        date: today,
        timestamp: Date.now() - 7200000,
        status: 'completed'
      }
    ],
    wheelHistory: [],
    fundCampaigns: sampleFundCampaigns,
    fundContributions: sampleFundContributions,
    fundTransactions: sampleFundTransactions,
    settings: {
      soundEnabled: true,
      animationEnabled: true,
      linkEmulationWithCoins: true,
      activeClassId: SAMPLE_CLASS_ID,
      defaultView: 'dashboard'
    },
    version: '1.0.0'
  };
}

export function loadStore(): FullClassDataStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = generateSampleStore();
      saveStore(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as FullClassDataStore;
    // ensure version check or minimum fields
    if (!parsed.classes || !parsed.students || !parsed.settings) {
      const initial = generateSampleStore();
      saveStore(initial);
      return initial;
    }
    // Ensure Fund arrays exist
    if (!parsed.fundCampaigns) parsed.fundCampaigns = [];
    if (!parsed.fundContributions) parsed.fundContributions = [];
    if (!parsed.fundTransactions) parsed.fundTransactions = [];

    // Seamless migration: upgrade sample class from THCS (9/1) to THPT (10A1)
    if (Array.isArray(parsed.classes)) {
      parsed.classes = parsed.classes.map(c => {
        if (c.isSampleData && (c.name === 'Lớp 9/1' || c.grade === 'Khối 9')) {
          return { ...c, name: 'Lớp 10A1', grade: 'Khối 10' };
        }
        return c;
      });
    }

    return parsed;
  } catch (e) {
    console.error('Failed to load storage, initializing fresh sample data', e);
    const initial = generateSampleStore();
    saveStore(initial);
    return initial;
  }
}

export function saveStore(store: FullClassDataStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

export function createBlankClass(name: string, grade: string, schoolYear: string, teacherName: string): ClassInfo {
  return {
    id: 'cls_' + Date.now().toString(36),
    name: name.trim() || 'Lớp mới',
    grade: grade.trim() || 'Khối 10',
    schoolYear: schoolYear.trim() || '2024 - 2025',
    teacherName: teacherName.trim() || 'Giáo viên chủ nhiệm',
    roomNumber: '',
    isSampleData: false
  };
}
