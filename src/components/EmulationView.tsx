import React, { useState, useMemo, useEffect } from 'react';
import { 
  Trophy, 
  Plus, 
  Minus, 
  Award, 
  CheckCircle, 
  RotateCcw, 
  Search, 
  Filter, 
  Lock, 
  Unlock, 
  Settings2, 
  Sparkles,
  Calendar,
  AlertCircle,
  Coins,
  Trash2,
  X,
  UserCheck,
  ShieldCheck,
  Zap,
  Printer,
  ChevronRight,
  Medal,
  Star,
  Flame,
  Check,
  Eye,
  ArrowRight,
  ArrowLeftRight,
  UsersRound,
  CheckSquare,
  Square,
  BookOpen,
  HelpCircle,
  Clock,
  Layers,
  LogOut,
  KeyRound,
  Upload,
  Download,
  FileSpreadsheet,
  FileDown
} from 'lucide-react';
import { 
  Student, 
  EmulationCriterion, 
  EmulationLog, 
  ClassInfo,
  UserRole
} from '../types';
import { sound } from '../utils/audio';
import { 
  parseCriteriaExcelFile, 
  downloadCriteriaTemplateExcel, 
  exportCriteriaToExcel,
  ParsedCriteriaResult 
} from '../utils/excel';

interface EmulationViewProps {
  currentClass: ClassInfo;
  students: Student[];
  criteria: EmulationCriterion[];
  logs: EmulationLog[];
  onAddLog: (log: Omit<EmulationLog, 'id'>) => void;
  onDeleteLog: (logId: string) => void;
  onAddCriterion: (crit: Omit<EmulationCriterion, 'id'>) => void;
  onDeleteCriterion: (critId: string) => void;
  currentUserRole?: UserRole;
  onOpenLogin?: () => void;
  onLogoutToGVCN?: () => void;
  onBatchAddCriteria?: (criteria: Omit<EmulationCriterion, 'id'>[], replaceExisting?: boolean) => void;
}

export type EvaluatorRoleId = 'gvcn' | 'to_1' | 'to_2' | 'to_3' | 'to_4';
export type RankingPeriod = 'week' | 'month' | 'semester' | 'year';
export type CrossEvalMode = 'weekly_rotation' | 'fixed' | 'custom';

export const EmulationView: React.FC<EmulationViewProps> = ({
  currentClass,
  students,
  criteria,
  logs,
  onAddLog,
  onDeleteLog,
  onAddCriterion,
  onDeleteCriterion,
  currentUserRole,
  onOpenLogin,
  onLogoutToGVCN,
  onBatchAddCriteria
}) => {
  const classStudents = useMemo(() => students.filter(s => s.classId === currentClass.id), [students, currentClass.id]);
  const classLogs = useMemo(() => logs.filter(l => l.classId === currentClass.id), [logs, currentClass.id]);

  // Find team leaders for teams 1, 2, 3, 4
  const teamLeaders = useMemo(() => {
    const map: Record<number, Student | undefined> = {
      1: classStudents.find(s => s.team === 1 && s.role === 'Tổ trưởng'),
      2: classStudents.find(s => s.team === 2 && s.role === 'Tổ trưởng'),
      3: classStudents.find(s => s.team === 3 && s.role === 'Tổ trưởng'),
      4: classStudents.find(s => s.team === 4 && s.role === 'Tổ trưởng'),
    };
    return map;
  }, [classStudents]);

  // Current Evaluator Account
  const [evaluatorRole, setEvaluatorRole] = useState<EvaluatorRoleId>(() => {
    return currentUserRole || 'gvcn';
  });

  // Keep evaluatorRole in sync if currentUserRole prop changes & jump straight to cross_eval for team leaders
  useEffect(() => {
    if (currentUserRole) {
      setEvaluatorRole(currentUserRole);
      if (currentUserRole !== 'gvcn') {
        setActiveTab('cross_eval');
      }
    }
  }, [currentUserRole]);

  // Active Tab: Default to cross_eval for team leaders, or record
  const [activeTab, setActiveTab] = useState<'cross_eval' | 'record' | 'quick_tap' | 'rankings' | 'rewards' | 'history' | 'criteria'>('cross_eval');

  // Period Lock
  const [isLocked, setIsLocked] = useState(false);

  // Common Date
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [successAlert, setSuccessAlert] = useState<string | null>(null);

  // -------------------------------------------------------------
  // CROSS-EVALUATION PLAN (PHƯƠNG ÁN CHẤM CHÉO)
  // -------------------------------------------------------------
  const [crossEvalMode, setCrossEvalMode] = useState<CrossEvalMode>('weekly_rotation');
  const [customPlan, setCustomPlan] = useState<Record<number, number>>({
    1: 2, // Tổ 1 chấm Tổ 2
    2: 3, // Tổ 2 chấm Tổ 3
    3: 4, // Tổ 3 chấm Tổ 4
    4: 1  // Tổ 4 chấm Tổ 1
  });
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Approximate current school week (1 to 35)
  const currentSchoolWeek = useMemo(() => {
    const now = new Date();
    const startOfSchool = new Date(now.getFullYear(), 8, 5); // Sep 5
    const diff = Math.max(0, now.getTime() - startOfSchool.getTime());
    const weekNum = Math.min(35, Math.max(1, Math.ceil(diff / (7 * 24 * 3600 * 1000))));
    return weekNum;
  }, []);

  const [selectedWeek, setSelectedWeek] = useState<number>(currentSchoolWeek);

  // Calculate assigned target team for a given team in the chosen mode & week
  const getAssignedTargetTeam = (sourceTeam: number, week: number): number => {
    if (crossEvalMode === 'fixed') {
      return sourceTeam === 4 ? 1 : sourceTeam + 1;
    }
    if (crossEvalMode === 'custom') {
      return customPlan[sourceTeam] || (sourceTeam === 4 ? 1 : sourceTeam + 1);
    }
    // 'weekly_rotation':
    // Offset shifts every week: 1, 2, 3
    const offset = ((week - 1) % 3) + 1;
    return ((sourceTeam - 1 + offset) % 4) + 1;
  };

  // Evaluator's team number if they are a team leader (null if GVCN)
  const evaluatorTeamNumber: number | null = useMemo(() => {
    if (evaluatorRole === 'to_1') return 1;
    if (evaluatorRole === 'to_2') return 2;
    if (evaluatorRole === 'to_3') return 3;
    if (evaluatorRole === 'to_4') return 4;
    return null;
  }, [evaluatorRole]);

  // Active assigned team for current evaluator (Tổ được phân công trực)
  const assignedTeamForCurrentEvaluator = useMemo(() => {
    if (evaluatorTeamNumber === null) return null;
    return getAssignedTargetTeam(evaluatorTeamNumber, selectedWeek);
  }, [evaluatorTeamNumber, selectedWeek, crossEvalMode, customPlan]);

  // Evaluator Display Label
  const evaluatorDisplayLabel = useMemo(() => {
    if (evaluatorRole === 'gvcn') return 'Giáo viên chủ nhiệm (Cô Mai Hoa)';
    const teamNum = evaluatorTeamNumber;
    if (teamNum) {
      const leader = teamLeaders[teamNum];
      return `Tổ trưởng Tổ ${teamNum} ${leader ? `(${leader.fullName})` : ''}`;
    }
    return 'Giáo viên';
  }, [evaluatorRole, evaluatorTeamNumber, teamLeaders]);

  // Currently selected target team in Cross Evaluation workspace (Tổ được chấm)
  const [crossTargetTeam, setCrossTargetTeam] = useState<number>(() => {
    if (evaluatorTeamNumber !== null) {
      return getAssignedTargetTeam(evaluatorTeamNumber, currentSchoolWeek);
    }
    return 2;
  });

  // Automatically update and strictly lock crossTargetTeam to assigned team for team leaders
  useEffect(() => {
    if (evaluatorTeamNumber !== null && assignedTeamForCurrentEvaluator !== null) {
      setCrossTargetTeam(assignedTeamForCurrentEvaluator);
    }
  }, [evaluatorRole, evaluatorTeamNumber, assignedTeamForCurrentEvaluator]);

  // Guard active tab: Team leaders are restricted to cross_eval, rankings, and history
  useEffect(() => {
    if (evaluatorTeamNumber !== null && !['cross_eval', 'rankings', 'history'].includes(activeTab)) {
      setActiveTab('cross_eval');
    }
  }, [evaluatorTeamNumber, activeTab]);

  // Eligible target teams for evaluation (cannot evaluate own team)
  const eligibleTargetTeams = useMemo(() => {
    if (evaluatorTeamNumber === null) {
      return [1, 2, 3, 4];
    }
    return [assignedTeamForCurrentEvaluator || 2];
  }, [evaluatorTeamNumber, assignedTeamForCurrentEvaluator]);

  // Students belonging to the currently evaluated team (TOÀN BỘ THÀNH VIÊN CỦA TỔ ĐƯỢC CHẤM)
  const targetTeamMembers = useMemo(() => {
    return classStudents.filter(s => s.team === crossTargetTeam);
  }, [classStudents, crossTargetTeam]);

  // Selected criterion in cross eval workspace
  const [crossCriterionId, setCrossCriterionId] = useState<string>(() => {
    return criteria.find(c => c.name.includes('phát biểu') || c.type === 'plus')?.id || criteria[0]?.id || '';
  });

  // Multiplier for cross eval (1x, 2x, 3x...)
  const [crossMultiplier, setCrossMultiplier] = useState<number>(1);
  const [crossNote, setCrossNote] = useState<string>('');

  // Selected members for batch action in cross eval
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Detailed Modal for a single student in cross-eval
  const [studentDetailModal, setStudentDetailModal] = useState<Student | null>(null);
  const [detailModalCritId, setDetailModalCritId] = useState<string>(criteria[0]?.id || '');
  const [detailModalMultiplier, setDetailModalMultiplier] = useState<number>(1);
  const [detailModalNote, setDetailModalNote] = useState<string>('');

  // Whole-team scoring modal in cross eval
  const [showTeamScoreModal, setShowTeamScoreModal] = useState<boolean>(false);
  const [teamScoreCritId, setTeamScoreCritId] = useState<string>(() => {
    return criteria.find(c => c.targetType === 'team')?.id || criteria[0]?.id || '';
  });
  const [teamScoreMultiplier, setTeamScoreMultiplier] = useState<number>(1);
  const [teamScoreNote, setTeamScoreNote] = useState<string>('');

  // Calculate today's cross-evaluated points for a specific student
  const getTodayPointsForStudent = (studentId: string): number => {
    return classLogs
      .filter(l => l.targetType === 'individual' && l.targetId === studentId && l.date === eventDate)
      .reduce((sum, l) => sum + l.points, 0);
  };

  // Recent logs for the currently selected target team
  const targetTeamRecentLogs = useMemo(() => {
    const memberIdSet = new Set(targetTeamMembers.map(m => m.id));
    return classLogs
      .filter(l => {
        if (l.targetType === 'individual' && memberIdSet.has(l.targetId)) return true;
        if (l.targetType === 'team' && l.targetId === String(crossTargetTeam)) return true;
        return false;
      })
      .slice(-15)
      .reverse();
  }, [classLogs, targetTeamMembers, crossTargetTeam]);

  // Helper: Apply score for an individual student in cross eval
  const handleScoreStudentCross = (
    student: Student, 
    customCrit?: EmulationCriterion, 
    customMult?: number, 
    customNt?: string
  ) => {
    if (isLocked) {
      alert('Kỳ thi đua hiện đang được khóa để tổng kết.');
      return;
    }

    if (evaluatorTeamNumber !== null && student.team === evaluatorTeamNumber) {
      alert(`Quy định chấm thi đua chéo: Tổ trưởng Tổ ${evaluatorTeamNumber} không được tự chấm cho thành viên cùng tổ!`);
      return;
    }

    if (evaluatorTeamNumber !== null && assignedTeamForCurrentEvaluator !== null && student.team !== assignedTeamForCurrentEvaluator) {
      alert(`Chức năng đã khóa: Bạn là Tổ trưởng Tổ ${evaluatorTeamNumber}, chỉ được phép chấm điểm cho học sinh thuộc Tổ ${assignedTeamForCurrentEvaluator} được phân công trực!`);
      return;
    }

    const crit = customCrit || criteria.find(c => c.id === crossCriterionId);
    if (!crit) return;

    const mult = customMult || crossMultiplier;
    const basePoints = crit.type === 'plus' ? Math.abs(crit.points) : -Math.abs(crit.points);
    const finalPoints = basePoints * mult;
    const noteText = customNt !== undefined ? customNt : crossNote;

    onAddLog({
      classId: currentClass.id,
      date: eventDate,
      criterionId: crit.id,
      criterionName: crit.name,
      points: finalPoints,
      multiplier: mult > 1 ? mult : undefined,
      targetType: 'individual',
      targetId: student.id,
      targetName: student.fullName,
      note: noteText.trim() ? `${noteText.trim()} (${evaluatorDisplayLabel})` : `Chấm chéo (${evaluatorDisplayLabel})`,
      evaluatorRole: evaluatorDisplayLabel,
      timestamp: Date.now()
    });

    if (finalPoints > 0) {
      sound.playFanfare();
    } else {
      sound.playSuccess();
    }

    setSuccessAlert(`Đã ghi nhận (${mult}x): ${student.fullName} (${finalPoints > 0 ? `+${finalPoints}` : finalPoints} điểm) - [${crit.name}]`);
    setTimeout(() => setSuccessAlert(null), 3500);
  };

  // Helper: Apply batch score to selected students
  const handleApplyBatchCrossScore = () => {
    if (isLocked) return;
    if (selectedMemberIds.length === 0) {
      alert('Vui lòng chọn ít nhất một học sinh trong tổ để chấm điểm!');
      return;
    }

    if (evaluatorTeamNumber !== null && assignedTeamForCurrentEvaluator !== null && crossTargetTeam !== assignedTeamForCurrentEvaluator) {
      alert(`Chức năng đã khóa: Bạn chỉ được phân công trực và chấm điểm cho Tổ ${assignedTeamForCurrentEvaluator}!`);
      return;
    }

    const crit = criteria.find(c => c.id === crossCriterionId);
    if (!crit) return;

    const basePoints = crit.type === 'plus' ? Math.abs(crit.points) : -Math.abs(crit.points);
    const finalPoints = basePoints * crossMultiplier;

    let countSuccess = 0;
    selectedMemberIds.forEach(stId => {
      const student = targetTeamMembers.find(s => s.id === stId);
      if (!student) return;

      onAddLog({
        classId: currentClass.id,
        date: eventDate,
        criterionId: crit.id,
        criterionName: crit.name,
        points: finalPoints,
        multiplier: crossMultiplier > 1 ? crossMultiplier : undefined,
        targetType: 'individual',
        targetId: student.id,
        targetName: student.fullName,
        note: crossNote.trim() ? `${crossNote.trim()} (${evaluatorDisplayLabel})` : `Chấm chéo hàng loạt (${evaluatorDisplayLabel})`,
        evaluatorRole: evaluatorDisplayLabel,
        timestamp: Date.now()
      });
      countSuccess++;
    });

    sound.playFanfare();
    setSuccessAlert(`Đã chấm điểm thành công cho ${countSuccess} học sinh Tổ ${crossTargetTeam} (${finalPoints > 0 ? `+${finalPoints}` : finalPoints} điểm)!`);
    setSelectedMemberIds([]);
    setTimeout(() => setSuccessAlert(null), 3500);
  };

  // Helper: Score whole team
  const handleScoreWholeTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    if (evaluatorTeamNumber !== null && crossTargetTeam === evaluatorTeamNumber) {
      alert(`Quy định chấm thi đua chéo: Tổ trưởng Tổ ${evaluatorTeamNumber} không được tự chấm cho Tổ của mình!`);
      return;
    }

    if (evaluatorTeamNumber !== null && assignedTeamForCurrentEvaluator !== null && crossTargetTeam !== assignedTeamForCurrentEvaluator) {
      alert(`Chức năng đã khóa: Bạn chỉ được phân công trực và chấm điểm cho Tổ ${assignedTeamForCurrentEvaluator}!`);
      return;
    }

    const crit = criteria.find(c => c.id === teamScoreCritId);
    if (!crit) return;

    const basePoints = crit.type === 'plus' ? Math.abs(crit.points) : -Math.abs(crit.points);
    const finalPoints = basePoints * teamScoreMultiplier;

    onAddLog({
      classId: currentClass.id,
      date: eventDate,
      criterionId: crit.id,
      criterionName: crit.name,
      points: finalPoints,
      multiplier: teamScoreMultiplier > 1 ? teamScoreMultiplier : undefined,
      targetType: 'team',
      targetId: String(crossTargetTeam),
      targetName: `Tổ ${crossTargetTeam}`,
      note: teamScoreNote.trim() ? `${teamScoreNote.trim()} (${evaluatorDisplayLabel})` : `Chấm chéo tập thể tổ (${evaluatorDisplayLabel})`,
      evaluatorRole: evaluatorDisplayLabel,
      timestamp: Date.now()
    });

    sound.playFanfare();
    setSuccessAlert(`Đã ghi nhận điểm tập thể Tổ ${crossTargetTeam} (${finalPoints > 0 ? `+${finalPoints}` : finalPoints} điểm) do [${evaluatorDisplayLabel}] thực hiện`);
    setShowTeamScoreModal(false);
    setTeamScoreNote('');
    setTeamScoreMultiplier(1);
    setTimeout(() => setSuccessAlert(null), 3500);
  };

  // -------------------------------------------------------------
  // STANDARD RECORD FORM STATE
  // -------------------------------------------------------------
  const [targetType, setTargetType] = useState<'individual' | 'team' | 'class'>('individual');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(classStudents[0]?.id || '');
  const [selectedTeam, setSelectedTeam] = useState<number>(1);
  const [selectedCriterionId, setSelectedCriterionId] = useState<string>(criteria[0]?.id || '');
  const [multiplier, setMultiplier] = useState<number>(1);
  const [eventNote, setEventNote] = useState('');

  // Quick Tap Multiplier Scoring State (studentId -> count)
  const [quickCriterionId, setQuickCriterionId] = useState<string>(criteria[1]?.id || criteria[0]?.id || '');
  const [quickFilterTeam, setQuickFilterTeam] = useState<number | 'all'>('all');
  const [quickTapCounters, setQuickTapCounters] = useState<Record<string, number>>({});

  // Ranking Period State
  const [rankingPeriod, setRankingPeriod] = useState<RankingPeriod>('week');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedSemester, setSelectedSemester] = useState<'HK1' | 'HK2'>('HK1');

  // Certificate Modal State
  const [certificateStudent, setCertificateStudent] = useState<{
    name: string;
    team: number;
    score: number;
    title: string;
    periodName: string;
  } | null>(null);

  // Criterion Editor Modal
  const [showCritModal, setShowCritModal] = useState(false);
  const [critName, setCritName] = useState('');
  const [critType, setCritType] = useState<'plus' | 'minus'>('plus');
  const [critPoints, setCritPoints] = useState<number>(5);
  const [critCategory, setCritCategory] = useState<any>('Học tập');
  const [critTargetType, setCritTargetType] = useState<'individual' | 'team' | 'class'>('individual');

  // Criteria Excel Import / Export State
  const [showImportCriteriaModal, setShowImportCriteriaModal] = useState(false);
  const [isProcessingCriteriaFile, setIsProcessingCriteriaFile] = useState(false);
  const [parsedCriteriaResult, setParsedCriteriaResult] = useState<ParsedCriteriaResult | null>(null);
  const [replaceExistingCriteria, setReplaceExistingCriteria] = useState(false);
  const [criteriaImportSuccessBanner, setCriteriaImportSuccessBanner] = useState<string | null>(null);

  // Criteria Excel Handlers
  const handleDownloadCriteriaTemplate = () => {
    downloadCriteriaTemplateExcel();
    sound.playClick();
  };

  const handleExportCriteriaExcel = () => {
    exportCriteriaToExcel(criteria, currentClass.name);
    sound.playClick();
  };

  const handleUploadCriteriaFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingCriteriaFile(true);
    try {
      const result = await parseCriteriaExcelFile(file);
      setParsedCriteriaResult(result);
      if (result.criteria.length > 0) {
        sound.playSuccess();
      } else {
        sound.playError();
      }
    } catch (err: any) {
      console.error('Error reading criteria file:', err);
      alert('Không thể đọc file: ' + (err.message || 'Lỗi không xác định'));
      sound.playError();
    } finally {
      setIsProcessingCriteriaFile(false);
      e.target.value = '';
    }
  };

  const handleConfirmImportCriteria = () => {
    if (!parsedCriteriaResult || parsedCriteriaResult.criteria.length === 0) return;

    if (onBatchAddCriteria) {
      onBatchAddCriteria(parsedCriteriaResult.criteria, replaceExistingCriteria);
    } else {
      parsedCriteriaResult.criteria.forEach(c => onAddCriterion(c));
    }

    sound.playFanfare();
    const count = parsedCriteriaResult.criteria.length;
    setCriteriaImportSuccessBanner(
      `Đã ${replaceExistingCriteria ? 'thay thế toàn bộ và ' : ''}nhập thành công ${count} tiêu chí thi đua từ file Excel!`
    );
    setShowImportCriteriaModal(false);
    setParsedCriteriaResult(null);

    setTimeout(() => {
      setCriteriaImportSuccessBanner(null);
    }, 6000);
  };

  // Filter students eligible for general form under cross-evaluation rules:
  const eligibleStudents = useMemo(() => {
    if (evaluatorTeamNumber === null) {
      return classStudents;
    }
    return classStudents.filter(s => s.team !== evaluatorTeamNumber);
  }, [classStudents, evaluatorTeamNumber]);

  // Standard Record Submit
  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      alert('Kỳ thi đua hiện đang được khóa để tổng kết.');
      return;
    }

    const crit = criteria.find(c => c.id === selectedCriterionId);
    if (!crit) return;

    let targetId = '';
    let targetName = '';

    if (targetType === 'individual') {
      const st = classStudents.find(s => s.id === selectedStudentId);
      if (!st) return;
      if (evaluatorTeamNumber !== null && st.team === evaluatorTeamNumber) {
        alert(`Quy định chấm thi đua chéo: Tổ trưởng Tổ ${evaluatorTeamNumber} không được tự chấm cho thành viên tổ mình! Vui lòng chọn học sinh tổ khác.`);
        return;
      }
      targetId = st.id;
      targetName = st.fullName;
    } else if (targetType === 'team') {
      if (evaluatorTeamNumber !== null && selectedTeam === evaluatorTeamNumber) {
        alert(`Quy định chấm thi đua chéo: Tổ trưởng Tổ ${evaluatorTeamNumber} không được tự chấm cho Tổ ${evaluatorTeamNumber}! Vui lòng chấm tổ khác.`);
        return;
      }
      targetId = String(selectedTeam);
      targetName = `Tổ ${selectedTeam}`;
    } else {
      if (evaluatorTeamNumber !== null) {
        alert('Tổ trưởng chỉ có quyền chấm thi đua chéo cá nhân hoặc tổ khác, không áp dụng cho toàn lớp.');
        return;
      }
      targetId = 'all';
      targetName = `Toàn bộ ${currentClass.name}`;
    }

    const basePoints = crit.type === 'plus' ? Math.abs(crit.points) : -Math.abs(crit.points);
    const finalPoints = basePoints * Math.max(1, multiplier);

    onAddLog({
      classId: currentClass.id,
      date: eventDate,
      criterionId: crit.id,
      criterionName: crit.name,
      points: finalPoints,
      multiplier: multiplier > 1 ? multiplier : undefined,
      targetType,
      targetId,
      targetName,
      note: eventNote.trim(),
      evaluatorRole: evaluatorDisplayLabel,
      timestamp: Date.now()
    });

    if (finalPoints > 0) {
      sound.playFanfare();
    } else {
      sound.playSuccess();
    }

    setSuccessAlert(`Đã ghi nhận (${multiplier}x): ${targetName} (${finalPoints > 0 ? `+${finalPoints}` : finalPoints} điểm) do [${evaluatorDisplayLabel}] thực hiện`);
    setEventNote('');
    setMultiplier(1);
    setTimeout(() => setSuccessAlert(null), 3500);
  };

  // Quick Tap Handlers
  const handleTapStudent = (studentId: string) => {
    if (isLocked) return;
    const student = classStudents.find(s => s.id === studentId);
    if (!student) return;

    if (evaluatorTeamNumber !== null && student.team === evaluatorTeamNumber) {
      alert(`Chấm chéo: Bạn là Tổ trưởng Tổ ${evaluatorTeamNumber}, không thể chấm điểm cho học sinh cùng tổ!`);
      return;
    }

    setQuickTapCounters(prev => {
      const current = prev[studentId] || 0;
      return {
        ...prev,
        [studentId]: current + 1
      };
    });
    sound.playCoin();
  };

  const handleResetStudentTap = (studentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickTapCounters(prev => {
      const updated = { ...prev };
      delete updated[studentId];
      return updated;
    });
  };

  const handleSaveAllQuickTaps = () => {
    const crit = criteria.find(c => c.id === quickCriterionId);
    if (!crit) return;

    const entries = Object.entries(quickTapCounters).filter(([_, count]) => count > 0);
    if (entries.length === 0) {
      alert('Vui lòng bấm vào học sinh để ghi nhận số lần (1x, 2x, 3x...) trước khi lưu!');
      return;
    }

    let recordedCount = 0;
    entries.forEach(([studentId, count]) => {
      const st = classStudents.find(s => s.id === studentId);
      if (!st) return;

      const basePoints = crit.type === 'plus' ? Math.abs(crit.points) : -Math.abs(crit.points);
      const points = basePoints * count;

      onAddLog({
        classId: currentClass.id,
        date: new Date().toISOString().slice(0, 10),
        criterionId: crit.id,
        criterionName: crit.name,
        points,
        multiplier: count > 1 ? count : undefined,
        targetType: 'individual',
        targetId: st.id,
        targetName: st.fullName,
        note: `Chấm nhanh ${count}x (${evaluatorDisplayLabel})`,
        evaluatorRole: evaluatorDisplayLabel,
        timestamp: Date.now()
      });
      recordedCount++;
    });

    sound.playFanfare();
    setSuccessAlert(`Đã ghi nhận điểm thi đua nhanh cho ${recordedCount} học sinh thành công!`);
    setQuickTapCounters({});
    setTimeout(() => setSuccessAlert(null), 3500);
  };

  // Add new criterion
  const handleSaveCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!critName.trim()) return;

    onAddCriterion({
      name: critName.trim(),
      type: critType,
      points: Math.abs(critPoints),
      category: critCategory,
      targetType: critTargetType
    });

    sound.playSuccess();
    setShowCritModal(false);
    setCritName('');
  };

  // Filter logs based on chosen period
  const filteredPeriodLogs = useMemo(() => {
    return classLogs.filter(log => {
      if (!log.date) return true;
      const logDate = new Date(log.date);

      if (rankingPeriod === 'month') {
        const m = logDate.getMonth() + 1;
        return m === selectedMonth;
      }

      if (rankingPeriod === 'semester') {
        const m = logDate.getMonth() + 1;
        if (selectedSemester === 'HK1') {
          return [9, 10, 11, 12, 1].includes(m);
        } else {
          return [2, 3, 4, 5].includes(m);
        }
      }

      if (rankingPeriod === 'week') {
        const startOfSchool = new Date(logDate.getFullYear(), 8, 5);
        const diff = Math.max(0, logDate.getTime() - startOfSchool.getTime());
        const weekNum = Math.ceil(diff / (7 * 24 * 3600 * 1000)) || 1;
        return weekNum === selectedWeek;
      }

      return true;
    });
  }, [classLogs, rankingPeriod, selectedWeek, selectedMonth, selectedSemester]);

  // Aggregate Team Scores in Period
  const periodicTeamScores = useMemo(() => {
    return [1, 2, 3, 4].map(teamNum => {
      const teamMembers = classStudents.filter(s => s.team === teamNum);
      const memberIds = new Set(teamMembers.map(m => m.id));

      let plusPoints = 0;
      let minusPoints = 0;
      let praiseCount = 0;
      let penaltyCount = 0;

      filteredPeriodLogs.forEach(l => {
        let isForThisTeam = false;
        if (l.targetType === 'team' && l.targetId === String(teamNum)) {
          isForThisTeam = true;
        } else if (l.targetType === 'individual' && memberIds.has(l.targetId)) {
          isForThisTeam = true;
        }

        if (isForThisTeam) {
          if (l.points > 0) {
            plusPoints += l.points;
            praiseCount++;
          } else {
            minusPoints += Math.abs(l.points);
            penaltyCount++;
          }
        }
      });

      const totalScore = plusPoints - minusPoints;

      return {
        team: teamNum,
        plusPoints,
        minusPoints,
        totalScore,
        praiseCount,
        penaltyCount,
        memberCount: teamMembers.length
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }, [classStudents, filteredPeriodLogs]);

  // Aggregate Student Scores in Period
  const periodicStudentScores = useMemo(() => {
    return classStudents.map(st => {
      let plusPoints = 0;
      let minusPoints = 0;
      let praiseCount = 0;
      let penaltyCount = 0;

      filteredPeriodLogs.forEach(l => {
        if (l.targetType === 'individual' && l.targetId === st.id) {
          if (l.points > 0) {
            plusPoints += l.points;
            praiseCount++;
          } else {
            minusPoints += Math.abs(l.points);
            penaltyCount++;
          }
        }
      });

      const totalScore = plusPoints - minusPoints;

      return {
        student: st,
        plusPoints,
        minusPoints,
        totalScore,
        praiseCount,
        penaltyCount
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }, [classStudents, filteredPeriodLogs]);

  // Period label for certificates
  const periodLabelText = useMemo(() => {
    if (rankingPeriod === 'week') return `Tuần ${selectedWeek}`;
    if (rankingPeriod === 'month') return `Tháng ${selectedMonth}`;
    if (rankingPeriod === 'semester') return `Học kỳ ${selectedSemester === 'HK1' ? 'I' : 'II'}`;
    return `Năm học ${currentClass.schoolYear}`;
  }, [rankingPeriod, selectedWeek, selectedMonth, selectedSemester, currentClass.schoolYear]);


  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Hệ Thống Thi Đua & Chấm Điểm Chéo Lớp Học
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấp quyền tài khoản cho Tổ trưởng tham gia chấm thi đua chéo giữa các tổ, hiển thị danh sách toàn bộ thành viên tổ được chấm
          </p>
        </div>

        {/* Action button: Cross-Eval Plan info & Lock toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {currentUserRole && currentUserRole !== 'gvcn' ? (
            onLogoutToGVCN && (
              <button
                type="button"
                onClick={onLogoutToGVCN}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-200 hover:bg-amber-300 text-amber-950 flex items-center gap-1.5 shadow-xs transition-colors"
                title="Đăng xuất khỏi tài khoản Tổ trưởng để trở về GVCN"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất (Về GVCN)</span>
              </button>
            )
          ) : (
            onOpenLogin && (
              <button
                type="button"
                onClick={onOpenLogin}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 flex items-center gap-1.5 shadow-xs transition-colors"
                title="Mở cửa sổ đăng nhập mật khẩu cho Tổ trưởng chấm chéo"
              >
                <KeyRound className="w-4 h-4" />
                <span>Đăng nhập mật khẩu Tổ trưởng</span>
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => setShowPlanModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Layers className="w-4 h-4 text-teal-600" />
            {evaluatorTeamNumber !== null ? 'Lịch Phân Công Trực' : 'Phương Án Chấm Chéo'}
          </button>

          {evaluatorTeamNumber === null && (
            <button
              type="button"
              onClick={() => {
                setIsLocked(!isLocked);
                sound.playClick();
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isLocked
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-rose-500" />
                  Đang khóa sổ thi đua
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-slate-500" />
                  Khóa sổ thi đua
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Account / Role Switcher Bar for Cross-Evaluation */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-cyan-900 text-white rounded-2xl p-4 shadow-sm border border-teal-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700/80 text-white flex items-center justify-center shrink-0 shadow-inner">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-teal-200 uppercase tracking-wider">
                  Tài khoản chấm thi đua:
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-teal-700/80 text-xs font-bold text-amber-300 border border-teal-500/40">
                  {evaluatorDisplayLabel}
                </span>
              </div>
              <p className="text-[11px] text-teal-100/90 mt-0.5">
                {evaluatorTeamNumber 
                  ? `🔒 Bạn là Tổ trưởng Tổ ${evaluatorTeamNumber}. Quyền hạn đã khóa: Bạn chỉ được phân công trực và thao tác chấm điểm cho danh sách thành viên TỔ ${assignedTeamForCurrentEvaluator} (Tuần ${selectedWeek}). Các chức năng khác đã được khóa theo quy định.`
                  : '⭐ Chế độ GVCN: Toàn quyền chấm thi đua cá nhân, tổ và cả lớp; cấu hình phương án chấm chéo.'
                }
              </p>
            </div>
          </div>

          {/* Role selector dropdown & buttons */}
          {currentUserRole && currentUserRole !== 'gvcn' ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-800/80 border border-teal-600/50 text-xs font-bold text-amber-300">
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>Quyền cố định: Tổ trưởng {evaluatorTeamNumber}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-teal-200 hidden sm:inline">Chuyển tài khoản:</span>
              <button
                type="button"
                onClick={() => {
                  setEvaluatorRole('gvcn');
                  sound.playClick();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  evaluatorRole === 'gvcn'
                    ? 'bg-amber-400 text-slate-900 shadow-md ring-2 ring-white/20'
                    : 'bg-teal-800/80 text-teal-100 hover:bg-teal-700'
                }`}
              >
                GVCN
              </button>

              {[1, 2, 3, 4].map(tNum => {
                const roleKey = `to_${tNum}` as EvaluatorRoleId;
                const leader = teamLeaders[tNum];
                const isCurrent = evaluatorRole === roleKey;
                return (
                  <button
                    key={tNum}
                    type="button"
                    onClick={() => {
                      setEvaluatorRole(roleKey);
                      setActiveTab('cross_eval');
                      sound.playClick();
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-amber-400 text-slate-900 shadow-md ring-2 ring-white/20'
                        : 'bg-teal-800/80 text-teal-100 hover:bg-teal-700'
                    }`}
                    title={leader ? `Tổ trưởng: ${leader.fullName}` : `Tổ trưởng Tổ ${tNum}`}
                  >
                    Tổ trưởng {tNum} {leader ? `(${leader.fullName.split(' ').pop()})` : ''}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => {
            setActiveTab('cross_eval');
            sound.playClick();
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'cross_eval'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-amber-300" />
          {evaluatorTeamNumber !== null 
            ? `Chấm điểm Tổ ${assignedTeamForCurrentEvaluator} (Phân công trực)`
            : 'Chấm chéo các tổ (Tổ trưởng)'}
        </button>

        {evaluatorTeamNumber === null && (
          <>
            <button
              type="button"
              onClick={() => {
                setActiveTab('record');
                sound.playClick();
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'record'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ghi nhận tự do & Hệ số
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('quick_tap');
                sound.playClick();
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'quick_tap'
                  ? 'bg-white text-slate-900 shadow-xs text-teal-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Chấm nhanh 1x, 2x...
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => {
            setActiveTab('rankings');
            sound.playClick();
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'rankings'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Xếp hạng (Tuần / Tháng / Kỳ / Năm)
        </button>

        {evaluatorTeamNumber === null && (
          <button
            type="button"
            onClick={() => {
              setActiveTab('rewards');
              sound.playClick();
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'rewards'
                ? 'bg-white text-slate-900 shadow-xs text-amber-700'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-500" />
            Khen thưởng & Giấy khen
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setActiveTab('history');
            sound.playClick();
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {evaluatorTeamNumber !== null 
            ? `Lịch sử Tổ ${assignedTeamForCurrentEvaluator}` 
            : `Lịch sử (${classLogs.length})`}
        </button>

        {evaluatorTeamNumber === null && (
          <button
            type="button"
            onClick={() => {
              setActiveTab('criteria');
              sound.playClick();
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'criteria'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tiêu chí ({criteria.length})
          </button>
        )}
      </div>

      {/* Success Alert */}
      {successAlert && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successAlert}</span>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 0: CROSS EVALUATION WORKSPACE (PHƯƠNG ÁN CHẤM CHÉO CÁC TỔ) */}
      {/* ============================================================= */}
      {activeTab === 'cross_eval' && (
        <div className="space-y-6">
          {/* Step 1: Select Target Team Cards */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-teal-600" />
                  Khu Vực Chấm Thi Đua Chéo Giữa Các Tổ
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chọn tổ được chấm để hiển thị danh sách toàn bộ thành viên của tổ đó và tiến hành chấm điểm / trừ điểm
                </p>
              </div>

              {/* Week selector badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Áp dụng phân công:</span>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-teal-800 outline-hidden"
                >
                  {Array.from({ length: 35 }, (_, i) => i + 1).map(w => (
                    <option key={w} value={w}>Tuần {w}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Team Selection Grid */}
            <div>
              {/* Alert banner for team leaders */}
              {evaluatorTeamNumber !== null && (
                <div className="mb-3.5 p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start gap-3 shadow-xs animate-in fade-in">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-black">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-extrabold text-amber-950 text-xs sm:text-sm flex items-center gap-2 flex-wrap">
                      <span>PHÂN CÔNG TRỰC: TỔ TRƯỞNG TỔ {evaluatorTeamNumber} ➔ CHẤM ĐIỂM TỔ {assignedTeamForCurrentEvaluator}</span>
                      <span className="bg-amber-200 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Chức năng đã khóa
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-amber-900 mt-1 leading-relaxed">
                      Bạn chỉ được phép thao tác chấm điểm (cộng/trừ điểm) cho các thành viên thuộc <strong>Tổ {assignedTeamForCurrentEvaluator}</strong> theo lịch phân công trực tuần {selectedWeek}. Danh sách các tổ khác và các mục quản lý riêng tư của lớp đã được khóa an toàn.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  1. {evaluatorTeamNumber !== null ? `Tổ được phân công trực (Tổ ${assignedTeamForCurrentEvaluator}):` : 'Chọn Tổ Được Chấm Điểm:'}
                </label>
                {evaluatorTeamNumber !== null && (
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Cố định theo phân công trực
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(teamNum => {
                  const isMyTeam = evaluatorTeamNumber !== null && evaluatorTeamNumber === teamNum;
                  const isAssigned = evaluatorTeamNumber !== null && assignedTeamForCurrentEvaluator === teamNum;
                  const isSelected = crossTargetTeam === teamNum;
                  const isLockedForLeader = evaluatorTeamNumber !== null && !isAssigned;
                  const leader = teamLeaders[teamNum];
                  const memberCount = classStudents.filter(s => s.team === teamNum).length;

                  return (
                    <button
                      key={teamNum}
                      type="button"
                      disabled={isLockedForLeader || isMyTeam}
                      onClick={() => {
                        if (isLockedForLeader || isMyTeam) return;
                        setCrossTargetTeam(teamNum);
                        setSelectedMemberIds([]);
                        sound.playClick();
                      }}
                      className={`relative p-4 rounded-2xl border text-left transition-all ${
                        isLockedForLeader
                          ? 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed text-slate-400'
                          : isSelected
                          ? 'bg-teal-50/90 border-teal-500 ring-2 ring-teal-400 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-teal-300 hover:shadow-xs'
                      }`}
                    >
                      {/* Assigned badge */}
                      {isAssigned && (
                        <div className="absolute top-2.5 right-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-900 flex items-center gap-1 shadow-xs animate-pulse">
                            <Sparkles className="w-2.5 h-2.5" />
                            Phân công trực
                          </span>
                        </div>
                      )}

                      {/* Locked badge for unassigned teams */}
                      {isLockedForLeader && (
                        <div className="absolute top-2.5 right-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            Đã khóa
                          </span>
                        </div>
                      )}

                      {/* Header with Team number & Name */}
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-sm ${
                          isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {teamNum}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">
                            Tổ {teamNum}
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            {memberCount} học sinh
                          </span>
                        </div>
                      </div>

                      {/* Team Leader Name */}
                      <div className="text-xs text-slate-600 mb-2 truncate">
                        Tổ trưởng: <strong className="text-slate-800">{leader ? leader.fullName : 'Chưa phân'}</strong>
                      </div>

                      {/* Status indicator */}
                      <div className="pt-2 border-t border-slate-100 text-[11px] flex items-center justify-between">
                        {isMyTeam ? (
                          <span className="text-rose-600 font-semibold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Tổ của bạn (không tự chấm)
                          </span>
                        ) : isLockedForLeader ? (
                          <span className="text-slate-500 font-semibold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Đã khóa (Không thuộc phân công)
                          </span>
                        ) : isSelected ? (
                          <span className="text-teal-700 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Đang chấm điểm
                          </span>
                        ) : (
                          <span className="text-slate-400 hover:text-slate-600">
                            Bấm để chọn tổ này
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 2: Tooling bar for Scoring Criteria & Multiplier */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  2. Chọn Tiêu Chí Chấm Điểm & Hệ Số Lặp:
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={crossCriterionId}
                    onChange={(e) => setCrossCriterionId(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-hidden min-w-[280px]"
                  >
                    <optgroup label="⭐ Tiêu chí cộng điểm (+)">
                      {criteria.filter(c => c.type === 'plus').map(c => (
                        <option key={c.id} value={c.id}>
                          [+{c.points}đ] {c.name} ({c.category})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="⚠️ Tiêu chí trừ điểm (-)">
                      {criteria.filter(c => c.type === 'minus').map(c => (
                        <option key={c.id} value={c.id}>
                          [-{c.points}đ] {c.name} ({c.category})
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  {/* Multiplier buttons (1x, 2x, 3x...) */}
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-xl">
                    <span className="text-xs font-bold text-amber-900 mr-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      Số lần:
                    </span>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          setCrossMultiplier(n);
                          sound.playClick();
                        }}
                        className={`w-7 h-7 rounded-lg text-xs font-extrabold transition-all ${
                          crossMultiplier === n
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-amber-100'
                        }`}
                      >
                        {n}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Date & Quick Note */}
              <div className="flex items-center gap-2 flex-wrap">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Ngày chấm:</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Ghi chú (tiết học/nội dung):</label>
                  <input
                    type="text"
                    placeholder="VD: Tiết Toán, 15p đầu giờ..."
                    value={crossNote}
                    onChange={(e) => setCrossNote(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-hidden w-48"
                  />
                </div>

                {/* Score whole team button */}
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTeamScoreModal(true)}
                    className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                  >
                    <Trophy className="w-3.5 h-3.5 text-indigo-600" />
                    Chấm cả Tổ {crossTargetTeam}
                  </button>
                </div>
              </div>
            </div>

            {/* Batch actions bar if members are selected */}
            {selectedMemberIds.length > 0 && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                <div className="text-xs font-bold text-teal-900 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-teal-600" />
                  Đã chọn {selectedMemberIds.length} học sinh của Tổ {crossTargetTeam}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMemberIds([])}
                    className="px-3 py-1.5 bg-white text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold border border-slate-200"
                  >
                    Bỏ chọn tất cả
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyBatchCrossScore}
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Áp dụng tiêu chí cho {selectedMemberIds.length} bạn ({crossMultiplier}x)
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: TOÀN BỘ THÀNH VIÊN CỦA TỔ ĐƯỢC CHẤM */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <UsersRound className="w-4 h-4 text-teal-600" />
                    Danh Sách Toàn Bộ Thành Viên Tổ {crossTargetTeam} ({targetTeamMembers.length} bạn)
                  </h4>
                  <span className="text-xs text-slate-500">
                    · Bấm trực tiếp nút cộng/trừ hoặc số lần để chấm ngay
                  </span>
                </div>

                {/* Select All Checkbox */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedMemberIds.length === targetTeamMembers.length) {
                      setSelectedMemberIds([]);
                    } else {
                      setSelectedMemberIds(targetTeamMembers.map(m => m.id));
                    }
                  }}
                  className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
                >
                  {selectedMemberIds.length === targetTeamMembers.length ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-teal-600" /> Bỏ chọn tất cả
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5 text-slate-400" /> Chọn tất cả thành viên
                    </>
                  )}
                </button>
              </div>

              {/* Members Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="py-3 px-3 w-10 text-center">
                          #
                        </th>
                        <th className="py-3 px-3 w-16">Mã HS</th>
                        <th className="py-3 px-4">Họ và tên</th>
                        <th className="py-3 px-3 w-28">Chức vụ tổ</th>
                        <th className="py-3 px-3 w-24 text-center">Xu / Điểm</th>
                        <th className="py-3 px-3 w-28 text-center">Điểm hôm nay</th>
                        <th className="py-3 px-4 text-right">Thao tác chấm điểm theo tiêu chí</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {targetTeamMembers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-slate-400">
                            Tổ {crossTargetTeam} chưa có học sinh nào.
                          </td>
                        </tr>
                      ) : (
                        targetTeamMembers.map((student, idx) => {
                          const isChecked = selectedMemberIds.includes(student.id);
                          const todayPts = getTodayPointsForStudent(student.id);
                          const activeCrit = criteria.find(c => c.id === crossCriterionId);
                          const stepPoints = activeCrit ? (activeCrit.type === 'plus' ? activeCrit.points : -activeCrit.points) : 0;
                          const calculatedPoints = stepPoints * crossMultiplier;

                          return (
                            <tr 
                              key={student.id} 
                              className={`transition-colors ${
                                isChecked ? 'bg-teal-50/50' : 'hover:bg-slate-50/70'
                              }`}
                            >
                              {/* Checkbox */}
                              <td className="py-3 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedMemberIds(prev => prev.filter(id => id !== student.id));
                                    } else {
                                      setSelectedMemberIds(prev => [...prev, student.id]);
                                    }
                                  }}
                                  className="rounded-md border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                                />
                              </td>

                              {/* Student Code */}
                              <td className="py-3 px-3 font-mono text-slate-500 font-medium">
                                {student.code}
                              </td>

                              {/* Full Name & Avatar */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                    student.gender === 'Nữ' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {student.fullName.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                      {student.fullName}
                                      {student.role === 'Tổ trưởng' && (
                                        <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                                          Tổ trưởng
                                        </span>
                                      )}
                                      {student.role === 'Tổ phó' && (
                                        <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                                          Tổ phó
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                      {student.birthDate ? new Date(student.birthDate).toLocaleDateString('vi-VN') : ''}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Role in Team */}
                              <td className="py-3 px-3">
                                <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                                  student.role === 'Tổ trưởng' 
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : student.role === 'Tổ phó'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'text-slate-600'
                                }`}>
                                  {student.role}
                                </span>
                              </td>

                              {/* Current Coins / Emulation points */}
                              <td className="py-3 px-3 text-center">
                                <span className="font-bold text-slate-800 tabular-nums">
                                  {student.coins || 0}
                                </span>
                                <span className="text-[10px] text-slate-400 ml-1">xu</span>
                              </td>

                              {/* Today's cross-evaluated points */}
                              <td className="py-3 px-3 text-center">
                                {todayPts !== 0 ? (
                                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold tabular-nums ${
                                    todayPts > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {todayPts > 0 ? `+${todayPts}` : todayPts}đ
                                  </span>
                                ) : (
                                  <span className="text-slate-300 text-[11px]">0đ</span>
                                )}
                              </td>

                              {/* Quick scoring action buttons */}
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  {/* Quick Apply Button with multiplier */}
                                  <button
                                    type="button"
                                    onClick={() => handleScoreStudentCross(student)}
                                    className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1 ${
                                      stepPoints >= 0
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                                    }`}
                                    title={`Chấm tiêu chí đang chọn: ${activeCrit?.name}`}
                                  >
                                    {stepPoints >= 0 ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                                    <span>
                                      {calculatedPoints >= 0 ? `+${calculatedPoints}` : calculatedPoints}đ ({crossMultiplier}x)
                                    </span>
                                  </button>

                                  {/* Quick 1x Speak / Build lesson increment */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const speakCrit = criteria.find(c => c.name.toLowerCase().includes('phát biểu')) || criteria[0];
                                      handleScoreStudentCross(student, speakCrit, 1, 'Phát biểu xây dựng bài');
                                    }}
                                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl font-bold text-xs transition-all flex items-center gap-1"
                                    title="Chấm nhanh 1x: Phát biểu xây dựng bài"
                                  >
                                    <Zap className="w-3 h-3 text-amber-600" />
                                    +1x Phát biểu
                                  </button>

                                  {/* Detailed criteria menu modal */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setStudentDetailModal(student);
                                      setDetailModalCritId(crossCriterionId);
                                      setDetailModalMultiplier(1);
                                      setDetailModalNote('');
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200"
                                    title="Chọn tiêu chí khác cho học sinh này"
                                  >
                                    <Settings2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Step 4: Recent cross-evaluated logs for this target team */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Nhật Ký Chấm Thi Đua Gần Nhất Của Tổ {crossTargetTeam} ({targetTeamRecentLogs.length} lượt ghi)
                </h4>
                <span className="text-[11px] text-slate-400">
                  Có thể xóa / hoàn tác nếu ghi nhầm
                </span>
              </div>

              {targetTeamRecentLogs.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                  Chưa có lượt chấm thi đua nào cho Tổ {crossTargetTeam} trong danh sách hiện tại.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {targetTeamRecentLogs.map(log => (
                    <div 
                      key={log.id} 
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between gap-2 shadow-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 truncate">
                          <span className={log.points > 0 ? 'text-emerald-700' : 'text-rose-600'}>
                            {log.points > 0 ? `+${log.points}` : log.points}đ
                          </span>
                          <span className="truncate">· {log.targetName}</span>
                          {log.multiplier && log.multiplier > 1 && (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] rounded-md font-extrabold">
                              {log.multiplier}x
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600 truncate mt-0.5">
                          {log.criterionName}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {log.evaluatorRole || 'Chấm chéo'} · {log.date}
                        </div>
                      </div>

                      {evaluatorTeamNumber === null && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xóa lượt chấm này của ${log.targetName}?`)) {
                              onDeleteLog(log.id);
                              sound.playClick();
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                          title="Xóa lượt ghi này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 1: STANDARD RECORD FORM (GHI NHẬN TỰ DO & HỆ SỐ) */}
      {/* ============================================================= */}
      {activeTab === 'record' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-teal-600" />
                Ghi nhận điểm thi đua (Hỗ trợ hệ số nhân 1x, 2x, 3x...)
              </h3>
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                Người ghi: {evaluatorDisplayLabel}
              </span>
            </div>

            <form onSubmit={handleRecordSubmit} className="space-y-4 text-xs">
              {/* Target Type Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Đối tượng chấm điểm
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetType('individual')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                      targetType === 'individual'
                        ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Cá nhân học sinh
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('team')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                      targetType === 'team'
                        ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Tổ sinh hoạt
                  </button>

                  <button
                    type="button"
                    disabled={evaluatorTeamNumber !== null}
                    onClick={() => setTargetType('class')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                      targetType === 'class'
                        ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-xs'
                        : evaluatorTeamNumber !== null
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                    title={evaluatorTeamNumber !== null ? 'Chỉ GVCN mới có quyền chấm cả lớp' : ''}
                  >
                    Cả lớp {currentClass.name}
                  </button>
                </div>
              </div>

              {/* Target Chooser */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {targetType === 'individual' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Chọn học sinh <span className="text-rose-500">*</span>
                      {evaluatorTeamNumber && (
                        <span className="text-rose-500 font-normal ml-1">
                          (Chấm chéo: Đã loại trừ học sinh Tổ {evaluatorTeamNumber})
                        </span>
                      )}
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-semibold"
                    >
                      {eligibleStudents.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.code} - {s.fullName} (Tổ {s.team} - {s.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {targetType === 'team' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Chọn tổ chấm điểm <span className="text-rose-500">*</span>
                      {evaluatorTeamNumber && (
                        <span className="text-rose-500 font-normal ml-1">
                          (Không chấm Tổ {evaluatorTeamNumber})
                        </span>
                      )}
                    </label>
                    <select
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-semibold"
                    >
                      {eligibleTargetTeams.map(tNum => (
                        <option key={tNum} value={tNum}>Tổ {tNum}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ngày xảy ra sự kiện
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Criterion Chooser */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chọn tiêu chí thi đua <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedCriterionId}
                  onChange={(e) => setSelectedCriterionId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-semibold"
                >
                  <optgroup label="Tiêu chí cộng điểm (+)">
                    {criteria.filter(c => c.type === 'plus').map(c => (
                      <option key={c.id} value={c.id}>
                        [+{c.points}đ] {c.name} ({c.category})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Tiêu chí trừ điểm (-)">
                    {criteria.filter(c => c.type === 'minus').map(c => (
                      <option key={c.id} value={c.id}>
                        [-{c.points}đ] {c.name} ({c.category})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Multiplier / Counter: 1x, 2x, 3x, 4x... */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Hệ số số lần lặp (Ví dụ: Phát biểu 1 lần = 1x, 2 lần = 2x, 3 lần = 3x...):
                  </label>
                  <span className="font-extrabold text-sm text-amber-800 tabular-nums">
                    {multiplier}x
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        setMultiplier(n);
                        sound.playClick();
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                        multiplier === n
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-amber-100 border border-amber-200'
                      }`}
                    >
                      {n}x
                    </button>
                  ))}

                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      type="button"
                      onClick={() => setMultiplier(m => Math.max(1, m - 1))}
                      className="p-1.5 bg-white border border-amber-300 rounded-lg text-amber-900 hover:bg-amber-100"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMultiplier(m => m + 1)}
                      className="p-1.5 bg-white border border-amber-300 rounded-lg text-amber-900 hover:bg-amber-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Event Note */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ghi chú chi tiết (Không bắt buộc)
                </label>
                <input
                  type="text"
                  placeholder="VD: Phát biểu tốt trong tiết Toán; Vệ sinh khu vực bàn cuối..."
                  value={eventNote}
                  onChange={(e) => setEventNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLocked}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  Xác nhận ghi điểm thi đua ({multiplier}x)
                </button>
              </div>
            </form>
          </div>

          {/* Quick Criteria Reference Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Bảng quy định điểm chuẩn
            </h3>

            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {criteria.map(crit => (
                <div
                  key={crit.id}
                  onClick={() => {
                    setSelectedCriterionId(crit.id);
                    sound.playClick();
                  }}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedCriterionId === crit.id
                      ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-400'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">{crit.name}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      crit.type === 'plus' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {crit.type === 'plus' ? `+${crit.points}` : `-${crit.points}`}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">{crit.category} · {crit.targetType === 'individual' ? 'Cá nhân' : crit.targetType === 'team' ? 'Tổ' : 'Cả lớp'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: QUICK TAP MULTIPLIER SCORING (CHẤM NHANH 1X, 2X, 3X...) */}
      {/* ============================================================= */}
      {activeTab === 'quick_tap' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Chấm Nhanh Hệ Số (1 Click = 1x, 2 Clicks = 2x, 3 Clicks = 3x...)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhấn trực tiếp lên thẻ học sinh để cộng số lần (1x, 2x, 3x). Rất nhanh khi chấm trong tiết học hoặc sinh hoạt lớp.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuickTapCounters({})}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Đặt lại lượt bấm
              </button>
              <button
                type="button"
                onClick={handleSaveAllQuickTaps}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Lưu tất cả điểm đã bấm
              </button>
            </div>
          </div>

          {/* Quick Criterion Chooser & Team Filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Chọn tiêu chí đang chấm nhanh:
              </label>
              <select
                value={quickCriterionId}
                onChange={(e) => setQuickCriterionId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-hidden"
              >
                {criteria.map(c => (
                  <option key={c.id} value={c.id}>
                    [{c.type === 'plus' ? `+${c.points}` : `-${c.points}`}đ] {c.name} ({c.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Lọc theo tổ:
              </label>
              <select
                value={quickFilterTeam}
                onChange={(e) => setQuickFilterTeam(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-hidden"
              >
                <option value="all">Tất cả các tổ</option>
                <option value={1}>Tổ 1</option>
                <option value={2}>Tổ 2</option>
                <option value={3}>Tổ 3</option>
                <option value={4}>Tổ 4</option>
              </select>
            </div>
          </div>

          {/* Students Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {classStudents
              .filter(s => quickFilterTeam === 'all' || s.team === quickFilterTeam)
              .map(st => {
                const count = quickTapCounters[st.id] || 0;
                const isMyTeam = evaluatorTeamNumber !== null && st.team === evaluatorTeamNumber;
                const crit = criteria.find(c => c.id === quickCriterionId);
                const stepPoints = crit ? (crit.type === 'plus' ? crit.points : -crit.points) : 0;
                const totalPoints = stepPoints * count;

                return (
                  <div
                    key={st.id}
                    onClick={() => !isMyTeam && handleTapStudent(st.id)}
                    className={`p-3 rounded-2xl border transition-all text-left relative select-none ${
                      isMyTeam
                        ? 'opacity-40 bg-slate-100 border-slate-200 cursor-not-allowed'
                        : count > 0
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300/60 cursor-pointer shadow-xs'
                        : 'bg-white border-slate-200 hover:border-teal-400 hover:shadow-xs cursor-pointer'
                    }`}
                  >
                    {/* Badge Count if tapped */}
                    {count > 0 && (
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        <span className="px-2 py-0.5 bg-amber-500 text-white rounded-lg text-xs font-extrabold animate-in zoom-in-75">
                          {count}x
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleResetStudentTap(st.id, e)}
                          className="p-1 hover:bg-amber-200 rounded-md text-amber-900"
                          title="Hủy lượt bấm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 font-mono">{st.code} · Tổ {st.team}</div>
                    <div className="text-xs font-bold text-slate-900 truncate mt-0.5">
                      {st.fullName}
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      {count > 0 ? (
                        <span className={`font-extrabold ${totalPoints >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {totalPoints >= 0 ? `+${totalPoints}` : totalPoints} điểm
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Nhấn để ghi 1x</span>
                      )}
                      <span className="text-[10px] text-teal-700 font-semibold">{st.coins} xu</span>
                    </div>

                    {isMyTeam && (
                      <div className="text-[9px] text-rose-600 mt-1 font-semibold">
                        Tổ của bạn (không chấm chéo)
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: PERIODIC RANKINGS (TUẦN / THÁNG / HỌC KỲ / NĂM) */}
      {/* ============================================================= */}
      {activeTab === 'rankings' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Khung thời gian xếp hạng:</span>
              <div className="flex items-center bg-slate-100 p-1 rounded-xl font-bold">
                <button
                  type="button"
                  onClick={() => setRankingPeriod('week')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    rankingPeriod === 'week' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Theo Tuần
                </button>
                <button
                  type="button"
                  onClick={() => setRankingPeriod('month')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    rankingPeriod === 'month' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Theo Tháng
                </button>
                <button
                  type="button"
                  onClick={() => setRankingPeriod('semester')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    rankingPeriod === 'semester' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Học Kỳ
                </button>
                <button
                  type="button"
                  onClick={() => setRankingPeriod('year')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    rankingPeriod === 'year' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Cả Năm
                </button>
              </div>
            </div>

            {/* Context Dropdown */}
            <div className="flex items-center gap-2">
              {rankingPeriod === 'week' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-semibold">Chọn tuần:</span>
                  <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-teal-800 outline-hidden"
                  >
                    {Array.from({ length: 35 }, (_, i) => i + 1).map(w => (
                      <option key={w} value={w}>Tuần {w}</option>
                    ))}
                  </select>
                </div>
              )}

              {rankingPeriod === 'month' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-semibold">Chọn tháng:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-teal-800 outline-hidden"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>Tháng {m}</option>
                    ))}
                  </select>
                </div>
              )}

              {rankingPeriod === 'semester' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-semibold">Học kỳ:</span>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-teal-800 outline-hidden"
                  >
                    <option value="HK1">Học kỳ I (Tháng 9 - 1)</option>
                    <option value="HK2">Học kỳ II (Tháng 2 - 5)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Section 1: Team Rankings */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Bảng Tổng Hợp Xếp Hạng Thi Đua Các Tổ ({periodLabelText})
              </h3>
              <span className="text-xs text-slate-400">
                Tổng điểm = Điểm cộng - Điểm trừ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {periodicTeamScores.map((t, idx) => {
                const rankColor = 
                  idx === 0 ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300' :
                  idx === 1 ? 'bg-slate-50 border-slate-300' :
                  idx === 2 ? 'bg-orange-50 border-orange-300' : 'bg-white border-slate-200';

                return (
                  <div key={t.team} className={`p-4 rounded-2xl border ${rankColor} transition-all shadow-xs`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-base text-slate-900">
                        Tổ {t.team}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                        idx === 0 ? 'bg-amber-400 text-slate-900' :
                        idx === 1 ? 'bg-slate-200 text-slate-700' :
                        idx === 2 ? 'bg-orange-200 text-orange-900' : 'bg-slate-100 text-slate-600'
                      }`}>
                        Hạng {idx + 1}
                      </span>
                    </div>

                    <div className="text-2xl font-black text-slate-900 tabular-nums my-1">
                      {t.totalScore >= 0 ? `+${t.totalScore}` : t.totalScore}
                      <span className="text-xs font-normal text-slate-400 ml-1">điểm</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-slate-200/60 mt-2">
                      <div className="text-emerald-700 font-semibold">
                        Cộng: +{t.plusPoints} ({t.praiseCount} lần)
                      </div>
                      <div className="text-rose-600 font-semibold text-right">
                        Trừ: -{t.minusPoints} ({t.penaltyCount} lần)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Student Rankings */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Medal className="w-4 h-4 text-teal-600" />
                Bảng Xếp Hạng Cá Nhân Học Sinh ({periodLabelText})
              </h3>
              <span className="text-xs text-slate-400">
                Top học sinh xuất sắc để tuyên dương và khen thưởng
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-2.5 px-3 w-16 text-center">Hạng</th>
                      <th className="py-2.5 px-3">Mã HS</th>
                      <th className="py-2.5 px-3">Họ và tên</th>
                      <th className="py-2.5 px-3">Tổ</th>
                      <th className="py-2.5 px-3 text-emerald-700">Điểm cộng (+)</th>
                      <th className="py-2.5 px-3 text-rose-600">Điểm trừ (-)</th>
                      <th className="py-2.5 px-3 font-bold text-right">Tổng điểm thi đua</th>
                      <th className="py-2.5 px-3 text-center">Khen thưởng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {periodicStudentScores.map((item, idx) => (
                      <tr key={item.student.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 text-center font-bold">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{item.student.code}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{item.student.fullName}</td>
                        <td className="py-2.5 px-3">Tổ {item.student.team}</td>
                        <td className="py-2.5 px-3 text-emerald-700 font-semibold">+{item.plusPoints}</td>
                        <td className="py-2.5 px-3 text-rose-600 font-semibold">-{item.minusPoints}</td>
                        <td className="py-2.5 px-3 font-black text-right tabular-nums text-slate-900">
                          {item.totalScore >= 0 ? `+${item.totalScore}` : item.totalScore}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setCertificateStudent({
                                name: item.student.fullName,
                                team: item.student.team,
                                score: item.totalScore,
                                title: idx === 0 ? 'Học sinh Tiêu biểu Nhất' : idx < 3 ? 'Học sinh Xuất sắc' : 'Học sinh Tiến bộ',
                                periodName: periodLabelText
                              });
                            }}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-[11px] font-bold border border-amber-200 transition-all flex items-center gap-1 mx-auto"
                          >
                            <Award className="w-3 h-3 text-amber-600" />
                            Giấy khen
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 4: REWARDS & CERTIFICATES (KHEN THƯỞNG & GIẤY KHEN) */}
      {/* ============================================================= */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 rounded-2xl p-6 text-slate-900 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-slate-900/10 font-black text-xs uppercase tracking-wider">
                  Khen thưởng thi đua {periodLabelText}
                </span>
                <h3 className="text-2xl font-black mt-2">
                  Vinh Danh & Trao Thưởng Cá Nhân, Tập Thể Xuất Sắc
                </h3>
                <p className="text-xs font-semibold text-slate-800 mt-1">
                  In giấy khen trang trọng, tuyên dương trước lớp trong các tiết sinh hoạt lớp, đầu tuần và tổng kết.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md hover:bg-slate-800 flex items-center gap-1.5 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  In toàn bộ danh sách khen thưởng
                </button>
              </div>
            </div>
          </div>

          {/* Top 3 Students Highlight Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {periodicStudentScores.slice(0, 3).map((st, i) => (
              <div
                key={st.student.id}
                className="bg-white border-2 border-amber-300 rounded-2xl p-5 text-center shadow-xs space-y-3 relative overflow-hidden"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-2xl shadow-inner">
                  {i === 0 ? '👑' : i === 1 ? '🥈' : '🥉'}
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {i === 0 ? 'Quán quân thi đua' : i === 1 ? 'Á quân thi đua' : 'Hạng 3 thi đua'}
                  </span>
                  <h4 className="text-base font-black text-slate-900 mt-1.5">
                    {st.student.fullName}
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold">
                    {st.student.code} · Tổ {st.student.team}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs flex items-center justify-around font-bold">
                  <div>
                    <div className="text-[10px] text-slate-400">Tổng điểm</div>
                    <div className="text-sm text-teal-700 font-black">+{st.totalScore}</div>
                  </div>
                  <div className="h-6 w-px bg-slate-200" />
                  <div>
                    <div className="text-[10px] text-slate-400">Xu thưởng</div>
                    <div className="text-sm text-amber-600 font-black">{st.student.coins} xu</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCertificateStudent({
                      name: st.student.fullName,
                      team: st.student.team,
                      score: st.totalScore,
                      title: i === 0 ? 'Học sinh Xuất sắc Nhất Lớp' : 'Học sinh Xuất sắc',
                      periodName: periodLabelText
                    });
                  }}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Award className="w-4 h-4" />
                  Xem & In Giấy Khen
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 5: HISTORY (LỊCH SỬ CHẤM THI ĐUA) */}
      {/* ============================================================= */}
      {activeTab === 'history' && (() => {
        const historyLogs = evaluatorTeamNumber !== null
          ? classLogs.filter(l => {
              if (l.targetType === 'team' && l.targetId === String(assignedTeamForCurrentEvaluator)) return true;
              if (l.targetType === 'individual' && targetTeamMembers.some(m => m.id === l.targetId)) return true;
              if (l.evaluatorRole?.includes(`Tổ ${evaluatorTeamNumber}`)) return true;
              return false;
            })
          : classLogs;

        return (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                {evaluatorTeamNumber !== null 
                  ? `Nhật ký chấm thi đua Tổ ${assignedTeamForCurrentEvaluator} (${historyLogs.length} lượt ghi)`
                  : `Toàn bộ Lịch sử ghi nhận điểm thi đua (${classLogs.length} sự kiện)`}
              </h3>
              <span className="text-xs text-slate-400">
                {evaluatorTeamNumber !== null 
                  ? `Phân công trực: Tổ trưởng Tổ ${evaluatorTeamNumber}` 
                  : 'Sắp xếp theo thời gian mới nhất'}
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-2.5 px-3">Thời gian</th>
                      <th className="py-2.5 px-3">Đối tượng</th>
                      <th className="py-2.5 px-3">Tiêu chí thi đua</th>
                      <th className="py-2.5 px-3 text-center">Hệ số</th>
                      <th className="py-2.5 px-3 text-right">Điểm</th>
                      <th className="py-2.5 px-3">Người ghi nhận</th>
                      <th className="py-2.5 px-3">Ghi chú</th>
                      <th className="py-2.5 px-3 text-center">
                        {evaluatorTeamNumber !== null ? 'Trạng thái' : 'Thao tác'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyLogs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-slate-400">
                          Chưa có lượt chấm thi đua nào được ghi nhận.
                        </td>
                      </tr>
                    ) : (
                      historyLogs.slice().reverse().map(l => (
                        <tr key={l.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">{l.date}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{l.targetName}</td>
                          <td className="py-2.5 px-3 text-slate-700">{l.criterionName}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                              {l.multiplier || 1}x
                            </span>
                          </td>
                          <td className={`py-2.5 px-3 font-bold text-right tabular-nums ${
                            l.points > 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}>
                            {l.points > 0 ? `+${l.points}` : l.points}đ
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium">{l.evaluatorRole || 'GVCN'}</td>
                          <td className="py-2.5 px-3 text-slate-500 italic">{l.note || '-'}</td>
                          <td className="py-2.5 px-3 text-center">
                            {evaluatorTeamNumber === null ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Bạn có chắc muốn xóa bản ghi thi đua này của "${l.targetName}"?`)) {
                                    onDeleteLog(l.id);
                                    sound.playClick();
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Xóa bản ghi này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                Đã ghi
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================= */}
      {/* TAB 6: CRITERIA MANAGEMENT (CẤU HÌNH TIÊU CHÍ) */}
      {/* ============================================================= */}
      {activeTab === 'criteria' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-teal-600" />
                Danh mục Tiêu chí Chấm thi đua ({criteria.length} tiêu chí)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Quy định khung điểm chuẩn để các tổ trưởng và giáo viên chủ nhiệm áp dụng chấm chéo
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadCriteriaTemplate}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all"
                title="Tải file Excel mẫu chuẩn bậc THPT về máy"
              >
                <FileDown className="w-3.5 h-3.5 text-teal-600" />
                <span>Tải mẫu Excel</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setParsedCriteriaResult(null);
                  setShowImportCriteriaModal(true);
                  sound.playClick();
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                title="Nhập danh sách tiêu chí nhanh từ file Excel"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Nhập từ Excel</span>
              </button>

              <button
                type="button"
                onClick={handleExportCriteriaExcel}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all"
                title="Xuất danh mục tiêu chí hiện có ra file Excel"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Xuất Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCritModal(true)}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm tiêu chí</span>
              </button>
            </div>
          </div>

          {/* Success Banner if criteria imported */}
          {criteriaImportSuccessBanner && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{criteriaImportSuccessBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setCriteriaImportSuccessBanner(null)}
                className="text-emerald-600 hover:text-emerald-900 font-bold p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {criteria.map(crit => (
              <div 
                key={crit.id} 
                className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/60 flex items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md font-black text-xs ${
                      crit.type === 'plus' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {crit.type === 'plus' ? `+${crit.points}đ` : `-${crit.points}đ`}
                    </span>
                    <span className="font-bold text-slate-800">{crit.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                    <span>Lĩnh vực: <strong>{crit.category}</strong></span>
                    <span>·</span>
                    <span>Đối tượng: <strong>{crit.targetType === 'individual' ? 'Cá nhân' : crit.targetType === 'team' ? 'Tổ' : 'Cả lớp'}</strong></span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Bạn có chắc muốn xóa tiêu chí "${crit.name}"?`)) {
                      onDeleteCriterion(crit.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                  title="Xóa tiêu chí"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 1: SƠ ĐỒ & CẤU HÌNH PHƯƠNG ÁN CHẤM CHÉO (CROSS-EVAL PLAN) */}
      {/* ============================================================= */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-600" />
                Phương Án Phân Công Chấm Thi Đua Chéo Giữa Các Tổ
              </h3>
              <button
                type="button"
                onClick={() => setShowPlanModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Plan Mode Selection */}
            {evaluatorTeamNumber === null ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Chọn chế độ phân công chấm chéo:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setCrossEvalMode('weekly_rotation')}
                    className={`p-3 rounded-xl border text-left font-bold transition-all ${
                      crossEvalMode === 'weekly_rotation'
                        ? 'bg-teal-50 border-teal-500 text-teal-900 ring-1 ring-teal-400 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span>Xoay vòng theo tuần</span>
                      {crossEvalMode === 'weekly_rotation' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                    </div>
                    <p className="text-[11px] font-normal text-slate-500">
                      Mỗi tuần tự động luân phiên đổi tổ chấm theo chu kỳ 3 tuần để công bằng, khách quan.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCrossEvalMode('fixed')}
                    className={`p-3 rounded-xl border text-left font-bold transition-all ${
                      crossEvalMode === 'fixed'
                        ? 'bg-teal-50 border-teal-500 text-teal-900 ring-1 ring-teal-400 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span>Phân công cố định</span>
                      {crossEvalMode === 'fixed' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                    </div>
                    <p className="text-[11px] font-normal text-slate-500">
                      Cố định xuyên suốt: Tổ 1 ➔ Tổ 2, Tổ 2 ➔ Tổ 3, Tổ 3 ➔ Tổ 4, Tổ 4 ➔ Tổ 1.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCrossEvalMode('custom')}
                    className={`p-3 rounded-xl border text-left font-bold transition-all ${
                      crossEvalMode === 'custom'
                        ? 'bg-teal-50 border-teal-500 text-teal-900 ring-1 ring-teal-400 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span>Tùy chỉnh phân công</span>
                      {crossEvalMode === 'custom' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                    </div>
                    <p className="text-[11px] font-normal text-slate-500">
                      GVCN tự do cấu hình cặp tổ nào chấm chéo tổ nào tùy theo tình hình thực tế lớp học.
                    </p>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-teal-700 shrink-0" />
                <span>
                  Lịch phân công trực do Giáo viên chủ nhiệm ban hành. Bạn là Tổ trưởng Tổ <strong>{evaluatorTeamNumber}</strong>, được phân công trực chấm điểm cho <strong>Tổ {assignedTeamForCurrentEvaluator}</strong>.
                </span>
              </div>
            )}

            {/* Visual Scheme Flow Chart */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowRight className="w-4 h-4 text-teal-600" />
                  Sơ Đồ Phân Công Áp Dụng (Tuần {selectedWeek})
                </h4>
                <span className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  {crossEvalMode === 'weekly_rotation' ? `Xoay vòng Tuần ${selectedWeek}` : crossEvalMode === 'fixed' ? 'Cố định' : 'Tùy chỉnh'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[1, 2, 3, 4].map(sTeam => {
                  const targetTeam = getAssignedTargetTeam(sTeam, selectedWeek);
                  const sLeader = teamLeaders[sTeam];
                  const tLeader = teamLeaders[targetTeam];

                  return (
                    <div key={sTeam} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-teal-600 text-white font-extrabold flex items-center justify-center text-xs">
                          {sTeam}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">Tổ {sTeam}</div>
                          <div className="text-[10px] text-slate-400">
                            {sLeader ? sLeader.fullName : 'Chưa có TT'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-teal-600 font-bold text-xs">
                        <span>chấm</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>

                      {crossEvalMode === 'custom' && evaluatorTeamNumber === null ? (
                        <select
                          value={customPlan[sTeam] || 2}
                          onChange={(e) => {
                            const newTarget = Number(e.target.value);
                            setCustomPlan(prev => ({ ...prev, [sTeam]: newTarget }));
                          }}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 outline-hidden"
                        >
                          {[1, 2, 3, 4].filter(t => t !== sTeam).map(t => (
                            <option key={t} value={t}>Tổ {t}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-900 font-extrabold flex items-center justify-center text-xs shadow-xs">
                            {targetTeam}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">Tổ {targetTeam}</div>
                            <div className="text-[10px] text-slate-400">
                              {tLeader ? tLeader.fullName : 'Chưa có TT'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Note & Close button */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400 italic">
                * Quy định: Tuyệt đối không được tự chấm điểm tổ của chính mình để đảm bảo công bằng.
              </span>
              <button
                type="button"
                onClick={() => setShowPlanModal(false)}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                Đồng ý & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: CHẤM TIÊU CHÍ RIÊNG CHO MỘT HỌC SINH */}
      {/* ============================================================= */}
      {studentDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-teal-600" />
                  Chấm Thi Đua Chi Tiết
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                  Học sinh: <strong className="text-slate-800">{studentDetailModal.fullName}</strong> ({studentDetailModal.code} - Tổ {studentDetailModal.team})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStudentDetailModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Select Criterion */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Chọn tiêu chí thi đua:
              </label>
              <select
                value={detailModalCritId}
                onChange={(e) => setDetailModalCritId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-hidden"
              >
                <optgroup label="Cộng điểm (+)">
                  {criteria.filter(c => c.type === 'plus').map(c => (
                    <option key={c.id} value={c.id}>
                      [+{c.points}đ] {c.name} ({c.category})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Trừ điểm (-)">
                  {criteria.filter(c => c.type === 'minus').map(c => (
                    <option key={c.id} value={c.id}>
                      [-{c.points}đ] {c.name} ({c.category})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Multiplier */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Số lần lặp (1x, 2x, 3x...):</label>
                <span className="font-bold text-amber-800">{detailModalMultiplier}x</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDetailModalMultiplier(n)}
                    className={`flex-1 py-1.5 rounded-lg font-bold border transition-all ${
                      detailModalMultiplier === n
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {n}x
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ghi chú chi tiết:
              </label>
              <input
                type="text"
                placeholder="VD: Trả lời đúng câu hỏi khó tiết Hóa..."
                value={detailModalNote}
                onChange={(e) => setDetailModalNote(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-hidden"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStudentDetailModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  const crit = criteria.find(c => c.id === detailModalCritId);
                  if (crit && studentDetailModal) {
                    handleScoreStudentCross(
                      studentDetailModal, 
                      crit, 
                      detailModalMultiplier, 
                      detailModalNote
                    );
                    setStudentDetailModal(null);
                  }
                }}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-xs"
              >
                Xác nhận ghi điểm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 3: CHẤM ĐIỂM TẬP THỂ CHO CẢ TỔ */}
      {/* ============================================================= */}
      {showTeamScoreModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-indigo-600" />
                  Chấm Điểm Tập Thể Cả Tổ {crossTargetTeam}
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                  Áp dụng cho toàn thể thành viên Tổ {crossTargetTeam} ({targetTeamMembers.length} bạn)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTeamScoreModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScoreWholeTeam} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chọn tiêu chí thi đua tập thể:
                </label>
                <select
                  value={teamScoreCritId}
                  onChange={(e) => setTeamScoreCritId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-hidden"
                >
                  <optgroup label="Cộng điểm tập thể (+)">
                    {criteria.filter(c => c.type === 'plus').map(c => (
                      <option key={c.id} value={c.id}>
                        [+{c.points}đ] {c.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Trừ điểm tập thể (-)">
                    {criteria.filter(c => c.type === 'minus').map(c => (
                      <option key={c.id} value={c.id}>
                        [-{c.points}đ] {c.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số lần lặp (1x, 2x...):
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setTeamScoreMultiplier(n)}
                      className={`flex-1 py-1.5 rounded-lg font-bold border transition-all ${
                        teamScoreMultiplier === n
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {n}x
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ghi chú nội dung:
                </label>
                <input
                  type="text"
                  placeholder="VD: Trực nhật sạch sẽ, xếp hàng ngay ngắn..."
                  value={teamScoreNote}
                  onChange={(e) => setTeamScoreNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTeamScoreModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Ghi điểm tập thể
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 4: CERTIFICATE MODAL (GIẤY KHEN TRANG TRỌNG) */}
      {/* ============================================================= */}
      {certificateStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl border-4 border-amber-300 space-y-6 relative animate-in zoom-in-95 text-center">
            <button
              type="button"
              onClick={() => setCertificateStudent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </div>
              <div className="text-[11px] text-slate-500 font-semibold">
                Độc lập - Tự do - Hạnh phúc
              </div>
              <div className="w-24 h-0.5 bg-amber-400 mx-auto my-2" />
            </div>

            <div className="space-y-2">
              <div className="text-3xl">🏅</div>
              <h2 className="text-2xl font-black text-amber-700 uppercase tracking-wider">
                GIẤY KHEN THI ĐUA
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                BAN THI ĐUA LỚP {currentClass.name.toUpperCase()} - NĂM HỌC {currentClass.schoolYear}
              </p>
            </div>

            <div className="space-y-2 py-2">
              <p className="text-xs text-slate-500">Trao tặng cho học sinh:</p>
              <h3 className="text-2xl font-black text-slate-900">
                {certificateStudent.name}
              </h3>
              <p className="text-xs text-slate-600 font-bold">
                Thành viên Tổ {certificateStudent.team} · Lớp {currentClass.name}
              </p>
              <div className="inline-block px-4 py-1.5 bg-amber-100 text-amber-900 rounded-full font-black text-sm my-2 border border-amber-300">
                ⭐ {certificateStudent.title} ({certificateStudent.periodName}) ⭐
              </div>
              <p className="text-xs text-slate-600 italic">
                Đã đạt thành tích thi đua xuất sắc với tổng số điểm: <strong>+{certificateStudent.score} điểm</strong>
              </p>
            </div>

            <div className="flex justify-between items-end pt-6 border-t border-slate-100 text-xs px-4">
              <div className="text-center">
                <div className="text-slate-400 text-[10px]">TỔ TRƯỞNG</div>
                <div className="font-bold text-slate-800 mt-6">(Đã ký xác nhận)</div>
              </div>
              <div className="text-center">
                <div className="text-slate-400 text-[10px]">GIÁO VIÊN CHỦ NHIỆM</div>
                <div className="font-bold text-teal-800 mt-6">Cô Mai Hoa</div>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl font-black text-xs shadow-md flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                In Giấy Khen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 5: CRITERION EDITOR MODAL */}
      {/* ============================================================= */}
      {showCritModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Thêm tiêu chí thi đua mới
              </h3>
              <button
                type="button"
                onClick={() => setShowCritModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCriterion} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên tiêu chí <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tham gia dọn vệ sinh khuôn viên trường..."
                  value={critName}
                  onChange={(e) => setCritName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại tiêu chí</label>
                  <select
                    value={critType}
                    onChange={(e) => setCritType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                  >
                    <option value="plus">Cộng điểm (+)</option>
                    <option value="minus">Trừ điểm (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số điểm cơ bản</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={critPoints}
                    onChange={(e) => setCritPoints(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-bold tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lĩnh vực</label>
                  <select
                    value={critCategory}
                    onChange={(e) => setCritCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                  >
                    <option value="Học tập">Học tập</option>
                    <option value="Kỷ luật">Kỷ luật</option>
                    <option value="Chuyên cần">Chuyên cần</option>
                    <option value="Phong trào & Lao động">Phong trào & Lao động</option>
                    <option value="Đạo đức">Đạo đức</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đối tượng</label>
                  <select
                    value={critTargetType}
                    onChange={(e) => setCritTargetType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                  >
                    <option value="individual">Cá nhân</option>
                    <option value="team">Tổ</option>
                    <option value="class">Cả lớp</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCritModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Lưu tiêu chí
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: NHẬP TIÊU CHÍ THI ĐUA TỪ EXCEL */}
      {/* ============================================================= */}
      {showImportCriteriaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 text-xs">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Nhập Danh Mục Tiêu Chí Thi Đua Từ File Excel
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hỗ trợ định dạng file .xlsx, .xls hoặc .csv tiêu chuẩn với tự động nhận diện cột
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowImportCriteriaModal(false);
                  setParsedCriteriaResult(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 grow">
              {/* Step 1: Download template reminder */}
              <div className="p-4 bg-teal-50 border border-teal-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <BookOpen className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-teal-900 text-xs">
                      Chưa có mẫu Excel chuẩn?
                    </h4>
                    <p className="text-[11px] text-teal-700 mt-0.5 leading-relaxed">
                      Tải mẫu file Excel đã chuẩn hóa danh mục tiêu chí THPT (Học tập, Kỷ luật, Chuyên cần, Phong trào & Lao động, Đạo đức).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadCriteriaTemplate}
                  className="px-3.5 py-2 bg-white hover:bg-teal-100/60 text-teal-800 font-bold rounded-xl border border-teal-300 text-xs shadow-2xs flex items-center gap-1.5 shrink-0 transition-all self-start sm:self-center"
                >
                  <FileDown className="w-3.5 h-3.5 text-teal-600" />
                  <span>Tải file Excel mẫu (.xlsx)</span>
                </button>
              </div>

              {/* Step 2: File Upload Box */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">
                  Chọn file Excel từ máy tính của bạn:
                </label>
                <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/30 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-slate-800 mt-3 text-xs">
                    Nhấp vào đây để chọn file (.xlsx, .xls, .csv)
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">
                    Hệ thống tự động phân tích các cột: Tiêu chí, Loại (+/-), Số điểm, Lĩnh vực, Đối tượng
                  </span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleUploadCriteriaFile}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Processing Spinner */}
              {isProcessingCriteriaFile && (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="font-bold text-slate-700">Đang đọc và phân tích cấu trúc bảng tính Excel...</p>
                </div>
              )}

              {/* Errors Display */}
              {parsedCriteriaResult && parsedCriteriaResult.errors.length > 0 && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-rose-800">
                  <div className="flex items-center gap-2 font-bold text-rose-900">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Lỗi khi đọc file ({parsedCriteriaResult.errors.length} lỗi):</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] pl-1 font-medium">
                    {parsedCriteriaResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings Display */}
              {parsedCriteriaResult && parsedCriteriaResult.warnings.length > 0 && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5 text-amber-900 text-[11px]">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Lưu ý ({parsedCriteriaResult.warnings.length}):</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 pl-1 font-medium text-amber-800">
                    {parsedCriteriaResult.warnings.slice(0, 5).map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                    {parsedCriteriaResult.warnings.length > 5 && (
                      <li className="italic">Và {parsedCriteriaResult.warnings.length - 5} cảnh báo khác...</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Parsed Result Preview */}
              {parsedCriteriaResult && parsedCriteriaResult.criteria.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-800">
                        Đã phát hiện hợp lệ: <strong className="text-emerald-700">{parsedCriteriaResult.criteria.length} tiêu chí</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        +{parsedCriteriaResult.criteria.filter(c => c.type === 'plus').length} Tiêu chí cộng (+)
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold text-[11px]">
                        -{parsedCriteriaResult.criteria.filter(c => c.type === 'minus').length} Tiêu chí trừ (-)
                      </span>
                    </div>
                  </div>

                  {/* Import Mode Options (Append vs Replace) */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className="block font-bold text-slate-800 text-xs">
                      Chế độ nhập vào danh mục:
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                        <input
                          type="radio"
                          name="importMode"
                          checked={!replaceExistingCriteria}
                          onChange={() => setReplaceExistingCriteria(false)}
                          className="mt-0.5 text-teal-600 focus:ring-teal-500"
                        />
                        <div>
                          <div className="font-bold text-slate-900">
                            Thêm vào danh sách hiện có (Khuyên dùng)
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Giữ lại {criteria.length} tiêu chí hiện tại của lớp và cộng thêm {parsedCriteriaResult.criteria.length} tiêu chí mới từ file Excel.
                          </div>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                        <input
                          type="radio"
                          name="importMode"
                          checked={replaceExistingCriteria}
                          onChange={() => setReplaceExistingCriteria(true)}
                          className="mt-0.5 text-rose-600 focus:ring-rose-500"
                        />
                        <div>
                          <div className="font-bold text-rose-700">
                            Xóa toàn bộ tiêu chí cũ và thay thế bằng danh mục mới
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Xóa sạch {criteria.length} tiêu chí hiện có và thiết lập lại theo đúng danh mục trong file Excel này.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div>
                    <h4 className="font-bold text-slate-800 mb-2 flex items-center justify-between">
                      <span>Xem trước dữ liệu tiêu chí sẽ nhập:</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        {parsedCriteriaResult.criteria.length} dòng
                      </span>
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                          <tr>
                            <th className="py-2 px-3 w-12 text-center">STT</th>
                            <th className="py-2 px-3">Tên tiêu chí thi đua</th>
                            <th className="py-2 px-3 w-28 text-center">Loại & Điểm</th>
                            <th className="py-2 px-3">Lĩnh vực</th>
                            <th className="py-2 px-3">Đối tượng</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {parsedCriteriaResult.criteria.map((c, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-900">
                                {c.name}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                  c.type === 'plus' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {c.type === 'plus' ? `+${c.points}đ` : `-${c.points}đ`}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-600">
                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-medium">
                                  {c.category}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-600">
                                {c.targetType === 'individual' ? 'Cá nhân' : c.targetType === 'team' ? 'Tổ' : 'Cả lớp'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0 rounded-b-2xl">
              <span className="text-[11px] text-slate-500">
                {parsedCriteriaResult && parsedCriteriaResult.criteria.length > 0 
                  ? `Sẵn sàng nạp ${parsedCriteriaResult.criteria.length} tiêu chí vào hệ thống`
                  : 'Vui lòng chọn file Excel để bắt đầu nhập'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportCriteriaModal(false);
                    setParsedCriteriaResult(null);
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={!parsedCriteriaResult || parsedCriteriaResult.criteria.length === 0}
                  onClick={handleConfirmImportCriteria}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    Xác nhận nhập {parsedCriteriaResult?.criteria?.length || ''} tiêu chí
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
