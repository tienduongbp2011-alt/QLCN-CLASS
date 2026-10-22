export interface ClassInfo {
  id: string;
  name: string;
  grade: string;
  schoolYear: string;
  teacherName: string;
  roomNumber: string;
  isSampleData?: boolean;
}

export type StudentRole = 
  | 'Lớp trưởng'
  | 'Lớp phó học tập'
  | 'Lớp phó lao động'
  | 'Tổ trưởng'
  | 'Tổ phó'
  | 'Thủ quỹ'
  | 'Ủy viên'
  | 'Thành viên';

export interface Student {
  id: string;
  classId: string;
  code: string; // Mã HS (HS01, HS02...)
  fullName: string;
  birthDate: string; // YYYY-MM-DD
  gender: 'Nam' | 'Nữ';
  team: number; // 1, 2, 3, 4 (Tổ)
  role: StudentRole;
  phone: string;
  parentPhone: string;
  notes: string;
  coins: number;
  status: 'active' | 'transferred' | 'leave';
}

export type AttendanceStatus = 'present' | 'excused' | 'unexcused' | 'late' | 'other';

export interface AttendanceItem {
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceRecord {
  id: string; // classId_YYYY-MM-DD
  classId: string;
  date: string; // YYYY-MM-DD
  records: Record<string, AttendanceItem>; // studentId -> status
  updatedAt: string;
}

export interface EmulationCriterion {
  id: string;
  name: string;
  type: 'plus' | 'minus';
  points: number;
  category: 'Học tập' | 'Kỷ luật' | 'Chuyên cần' | 'Phong trào & Lao động' | 'Đạo đức';
  targetType: 'individual' | 'team' | 'class';
}

export interface EmulationLog {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  criterionId: string;
  criterionName: string;
  points: number;
  multiplier?: number; // 1, 2, 3...
  targetType: 'individual' | 'team' | 'class';
  targetId: string; // studentId or teamNumber string or 'all'
  targetName: string;
  note: string;
  evaluatorRole?: string; // 'GVCN' | 'Tổ trưởng Tổ 1' | 'Tổ trưởng Tổ 2' ...
  timestamp: number;
}

export interface Announcement {
  id: string;
  classId: string;
  title: string;
  content: string;
  date: string;
  priority: 'normal' | 'important' | 'urgent';
  isPinned: boolean;
}

export type RemarkCategory = 'Tuyên dương' | 'Cần nhắc nhở' | 'Tiến bộ' | 'Kế hoạch hỗ trợ' | 'Trao đổi phụ huynh';

export interface StudentRemark {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  date: string;
  category: RemarkCategory;
  strengths: string;
  improvements: string;
  supportPlan: string;
  isResolved: boolean;
}

export interface StudyGroupPlan {
  id: string;
  classId: string;
  name: string;
  date: string;
  groups: {
    id: string;
    name: string;
    studentIds: string[];
  }[];
}

export const THPT_SUBJECTS = [
  'Toán',
  'Ngữ văn',
  'Tiếng Anh',
  'Vật lí',
  'Hóa học',
  'Sinh học',
  'Lịch sử',
  'Địa lí',
  'Giáo dục kinh tế và pháp luật (GDKT&PL)',
  'Tin học',
  'Công nghệ',
  'Giáo dục quốc phòng và an ninh (GDQP-AN)',
  'Giáo dục thể chất (GDTC)',
  'Hoạt động trải nghiệm, hướng nghiệp',
  'Âm nhạc',
  'Mỹ thuật',
  'Giáo dục địa phương'
] as const;

export type THPTSubject = typeof THPT_SUBJECTS[number];

export interface GradeEntry {
  id: string;
  classId: string;
  studentId: string;
  subject: string;
  gradeType: 'ĐGTX 1' | 'ĐGTX 2' | 'ĐGTX 3' | 'ĐGTX 4' | 'Giữa kỳ' | 'Cuối kỳ';
  score: number; // 0 - 10
  date: string;
  note?: string;
}

export interface SeatPosition {
  row: number;
  col: number;
  studentId: string | null;
}

export interface SeatingChartConfig {
  classId: string;
  rows: number;
  cols: number;
  seats: SeatPosition[];
}

export interface TimetablePeriod {
  period: number; // 1..5 for morning, 1..4 for afternoon
  subject: string;
  teacher?: string;
  room?: string;
}

export interface TimetableSchedule {
  classId: string;
  // day: 2 (Thứ 2), 3 (Thứ 3), 4, 5, 6, 7
  morning: Record<number, TimetablePeriod[]>;
  afternoon: Record<number, TimetablePeriod[]>;
}

export interface RewardItem {
  id: string;
  name: string;
  description: string;
  coinCost: number;
  stock: number;
  icon: string;
  isHidden?: boolean;
}

export interface RewardRedemption {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  rewardId: string;
  rewardName: string;
  coinsSpent: number;
  date: string;
  timestamp: number;
  status: 'completed' | 'cancelled';
}

export interface WheelHistory {
  id: string;
  classId: string;
  timestamp: number;
  type: 'students' | 'teams' | 'rewards';
  winner: string;
}

export type FundCategoryType = 'income' | 'expense';

export interface FundCampaign {
  id: string;
  classId: string;
  title: string; // VD: Quỹ lớp Học kỳ I, Quỹ liên hoan Trung thu, Quỹ hoạt động 20/11
  targetAmountPerStudent: number; // Mức thu theo đầu học sinh (VNĐ)
  startDate: string;
  endDate?: string;
  description?: string;
  status: 'active' | 'completed';
}

export type UserRole = 'gvcn' | 'to_1' | 'to_2' | 'to_3' | 'to_4';

export interface FundContribution {
  id: string;
  classId: string;
  campaignId: string;
  studentId: string;
  studentName: string;
  team: number;
  amountPaid: number; // Số tiền đã nộp (VNĐ), có thể nhập tay tự do kể cả vượt mức
  paidDate: string; // Ngày nộp
  status: 'paid' | 'partial' | 'unpaid';
  paymentMethod: 'Tiền mặt' | 'Chuyển khoản';
  transferReference?: string; // Mã tham chiếu / Ngân hàng chuyển khoản
  collector?: string; // Người thu (Thủ quỹ / GVCN)
  note?: string;
}

export interface FundTransaction {
  id: string;
  classId: string;
  type: FundCategoryType; // 'income' | 'expense'
  campaignId?: string; // Liên kết với đợt thu nếu là thu quỹ học sinh
  category: string; // 'Thu đóng góp học sinh' | 'Tài trợ PHHS' | 'Thưởng thi đua' | 'In tài liệu học tập' | 'Khen thưởng thi đua' | 'Liên hoan & Sự kiện' | 'Cơ sở vật chất lớp' | 'Thăm hỏi hiếu hỉ' | 'Khác'
  title: string; // Tên khoản thu / chi
  amount: number; // Số tiền (VNĐ)
  date: string; // YYYY-MM-DD
  payerOrReceiver: string; // Người nộp / Người nhận tiền
  receiptNumber?: string; // Số phiếu thu / hóa đơn chứng từ
  notes?: string;
  createdBy: string; // 'Thủ quỹ' | 'GVCN'
}

export interface AppSettings {
  soundEnabled: boolean;
  animationEnabled: boolean;
  linkEmulationWithCoins: boolean;
  activeClassId: string;
  defaultView: string;
}

export interface FullClassDataStore {
  classes: ClassInfo[];
  students: Student[];
  attendance: AttendanceRecord[];
  criteria: EmulationCriterion[];
  emulationLogs: EmulationLog[];
  announcements: Announcement[];
  remarks: StudentRemark[];
  groupPlans: StudyGroupPlan[];
  grades: GradeEntry[];
  seatingCharts: Record<string, SeatingChartConfig>;
  timetables: Record<string, TimetableSchedule>;
  rewards?: RewardItem[];
  redemptions?: RewardRedemption[];
  wheelHistory: WheelHistory[];
  fundCampaigns: FundCampaign[];
  fundContributions: FundContribution[];
  fundTransactions: FundTransaction[];
  settings: AppSettings;
  version: string;
}
