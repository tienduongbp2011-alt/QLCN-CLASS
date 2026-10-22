import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  X, 
  Sparkles, 
  GraduationCap, 
  Users, 
  Check, 
  ArrowRight,
  Plus
} from 'lucide-react';
import { 
  FullClassDataStore, 
  ClassInfo, 
  Student, 
  AttendanceRecord, 
  AttendanceItem, 
  EmulationCriterion, 
  EmulationLog, 
  Announcement, 
  StudentRemark, 
  StudyGroupPlan, 
  GradeEntry, 
  SeatingChartConfig, 
  TimetableSchedule, 
  RewardItem, 
  RewardRedemption, 
  WheelHistory,
  FundCampaign,
  FundContribution,
  FundTransaction,
  AppSettings,
  UserRole
} from './types';
import { 
  loadStore, 
  saveStore, 
  generateSampleStore, 
  createBlankClass 
} from './utils/storage';
import { sound } from './utils/audio';

import { Header } from './components/Header';
import { Sidebar, NavItemKey } from './components/Sidebar';
import { LoginModal } from './components/LoginModal';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { ClassManager } from './components/ClassManager';
import { StudentManager } from './components/StudentManager';
import { AttendanceView } from './components/AttendanceView';
import { RemarksView } from './components/RemarksView';
import { GroupDivision } from './components/GroupDivision';
import { TeamManager } from './components/TeamManager';
import { EmulationView } from './components/EmulationView';
import { GradebookView } from './components/GradebookView';
import { SeatingPlan } from './components/SeatingPlan';
import { Timetable } from './components/Timetable';
import { ClassFundView } from './components/ClassFundView';
import { LuckyWheel } from './components/LuckyWheel';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';

export default function App() {
  // Master Store state loaded from localStorage
  const [store, setStore] = useState<FullClassDataStore>(() => loadStore());

  // Current view
  const [currentView, setCurrentView] = useState<NavItemKey>('dashboard');

  // User Authentication Gate: Both Teacher and Team Leader must enter password to enter system
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('classpro_authenticated') === 'true';
    } catch {
      return false;
    }
  });

  // User Role Authentication (GVCN vs Team Leaders to_1..to_4)
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem('classpro_user_role');
      if (saved && ['gvcn', 'to_1', 'to_2', 'to_3', 'to_4'].includes(saved)) {
        return saved as UserRole;
      }
    } catch (e) {}
    return 'gvcn';
  });

  const [showLoginModal, setShowLoginModal] = useState(false);

  // Sync role to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('classpro_user_role', currentUserRole);
    } catch (e) {}
  }, [currentUserRole]);

  // View guard: If team leader is logged in, ONLY allow 'emulation' view!
  useEffect(() => {
    if (currentUserRole !== 'gvcn' && currentView !== 'emulation') {
      setCurrentView('emulation');
    }
  }, [currentUserRole, currentView]);

  const handleSelectRole = (role: UserRole) => {
    setCurrentUserRole(role);
    if (role !== 'gvcn') {
      setCurrentView('emulation');
    }
  };

  const handleLoginSuccess = (role: UserRole) => {
    setIsAuthenticated(true);
    try {
      localStorage.setItem('classpro_authenticated', 'true');
    } catch (e) {}
    handleSelectRole(role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('classpro_authenticated');
    } catch (e) {}
    sound.playClick();
  };

  const handleLogoutToGVCN = () => {
    handleLogout();
  };

  // Sidebar collapse & mobile drawer
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Quick Add Student Modal from Dashboard
  const [showQuickAddStudent, setShowQuickAddStudent] = useState(false);
  const [quickStudentName, setQuickStudentName] = useState('');
  const [quickStudentCode, setQuickStudentCode] = useState('');
  const [quickStudentTeam, setQuickStudentTeam] = useState(1);

  // Sync sound engine enabled state with store
  useEffect(() => {
    sound.setEnabled(store.settings.soundEnabled);
  }, [store.settings.soundEnabled]);

  // Persist store to localStorage on changes
  useEffect(() => {
    saveStore(store);
  }, [store]);

  // Active class lookup
  const currentClass = store.classes.find(c => c.id === store.settings.activeClassId) || store.classes[0] || {
    id: 'default',
    name: 'Lớp học',
    grade: 'Khối 6',
    schoolYear: '2024 - 2025',
    teacherName: 'Giáo viên',
    roomNumber: ''
  };

  const currentClassStudents = store.students.filter(s => s.classId === currentClass.id);

  // Helpers to update store immutably
  const updateSettings = (partial: Partial<AppSettings>) => {
    setStore(prev => ({
      ...prev,
      settings: { ...prev.settings, ...partial }
    }));
  };

  // Class Actions
  const handleSelectClass = (classId: string) => {
    updateSettings({ activeClassId: classId });
  };

  const handleCreateClass = (clsData: { name: string; grade: string; schoolYear: string; teacherName: string; roomNumber: string }) => {
    const newCls = createBlankClass(clsData.name, clsData.grade, clsData.schoolYear, clsData.teacherName);
    newCls.roomNumber = clsData.roomNumber;

    setStore(prev => ({
      ...prev,
      classes: [...prev.classes, newCls],
      settings: { ...prev.settings, activeClassId: newCls.id }
    }));
  };

  const handleUpdateClass = (id: string, updates: Partial<ClassInfo>) => {
    setStore(prev => ({
      ...prev,
      classes: prev.classes.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const handleDeleteClass = (id: string) => {
    setStore(prev => {
      const remainingClasses = prev.classes.filter(c => c.id !== id);
      const nextActiveId = remainingClasses[0]?.id || '';
      return {
        ...prev,
        classes: remainingClasses,
        students: prev.students.filter(s => s.classId !== id),
        attendance: prev.attendance.filter(a => a.classId !== id),
        emulationLogs: prev.emulationLogs.filter(l => l.classId !== id),
        announcements: prev.announcements.filter(a => a.classId !== id),
        remarks: prev.remarks.filter(r => r.classId !== id),
        settings: { ...prev.settings, activeClassId: nextActiveId }
      };
    });
  };

  // Student Actions
  const handleAddStudent = (studentData: Omit<Student, 'id' | 'classId'>) => {
    const newStudent: Student = {
      ...studentData,
      id: 'std_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      classId: currentClass.id
    };

    setStore(prev => ({
      ...prev,
      students: [...prev.students, newStudent]
    }));
  };

  const handleBulkAddStudents = (newStudents: Student[]) => {
    setStore(prev => ({
      ...prev,
      students: [...prev.students, ...newStudents]
    }));
  };

  const handleUpdateStudent = (id: string, updates: Partial<Student>) => {
    setStore(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  };

  const handleDeleteStudent = (id: string) => {
    setStore(prev => ({
      ...prev,
      students: prev.students.filter(s => s.id !== id)
    }));
  };

  // Quick add from modal
  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickStudentName.trim()) return;

    const count = currentClassStudents.length + 1;
    const finalCode = quickStudentCode.trim() || `HS${String(count).padStart(2, '0')}`;

    handleAddStudent({
      code: finalCode,
      fullName: quickStudentName.trim(),
      birthDate: '2010-01-01',
      gender: 'Nam',
      team: quickStudentTeam,
      role: 'Thành viên',
      phone: '',
      parentPhone: '',
      notes: '',
      coins: 0,
      status: 'active'
    });

    sound.playSuccess();
    setShowQuickAddStudent(false);
    setQuickStudentName('');
    setQuickStudentCode('');
  };

  // Attendance Actions
  const handleSaveAttendance = (date: string, records: Record<string, AttendanceItem>) => {
    setStore(prev => {
      const filtered = prev.attendance.filter(a => !(a.classId === currentClass.id && a.date === date));
      const newRecord: AttendanceRecord = {
        id: `${currentClass.id}_${date}`,
        classId: currentClass.id,
        date,
        records,
        updatedAt: new Date().toISOString()
      };
      return {
        ...prev,
        attendance: [...filtered, newRecord]
      };
    });
  };

  // Emulation Actions
  const handleAddEmulationLog = (logData: Omit<EmulationLog, 'id'>) => {
    const newLog: EmulationLog = {
      ...logData,
      id: 'log_' + Date.now().toString(36)
    };

    setStore(prev => {
      // If linked with coins, update student coin wallets
      let updatedStudents = [...prev.students];
      if (prev.settings.linkEmulationWithCoins) {
        if (logData.targetType === 'individual') {
          updatedStudents = updatedStudents.map(s => {
            if (s.id === logData.targetId) {
              return { ...s, coins: Math.max(0, (s.coins || 0) + logData.points) };
            }
            return s;
          });
        } else if (logData.targetType === 'team') {
          updatedStudents = updatedStudents.map(s => {
            if (s.classId === currentClass.id && s.team === Number(logData.targetId)) {
              return { ...s, coins: Math.max(0, (s.coins || 0) + logData.points) };
            }
            return s;
          });
        }
      }

      return {
        ...prev,
        students: updatedStudents,
        emulationLogs: [...prev.emulationLogs, newLog]
      };
    });
  };

  const handleDeleteEmulationLog = (logId: string) => {
    setStore(prev => {
      const log = prev.emulationLogs.find(l => l.id === logId);
      if (!log) return prev;

      // Revert coins if linked
      let updatedStudents = [...prev.students];
      if (prev.settings.linkEmulationWithCoins) {
        if (log.targetType === 'individual') {
          updatedStudents = updatedStudents.map(s => {
            if (s.id === log.targetId) {
              return { ...s, coins: Math.max(0, (s.coins || 0) - log.points) };
            }
            return s;
          });
        } else if (log.targetType === 'team') {
          updatedStudents = updatedStudents.map(s => {
            if (s.classId === currentClass.id && s.team === Number(log.targetId)) {
              return { ...s, coins: Math.max(0, (s.coins || 0) - log.points) };
            }
            return s;
          });
        }
      }

      return {
        ...prev,
        students: updatedStudents,
        emulationLogs: prev.emulationLogs.filter(l => l.id !== logId)
      };
    });
  };

  const handleAddCriterion = (crit: Omit<EmulationCriterion, 'id'>) => {
    const newCrit: EmulationCriterion = {
      ...crit,
      id: 'crit_' + Date.now().toString(36)
    };
    setStore(prev => ({ ...prev, criteria: [...prev.criteria, newCrit] }));
  };

  const handleBatchAddCriteria = (newCriteria: Omit<EmulationCriterion, 'id'>[], replaceExisting: boolean = false) => {
    const prepared: EmulationCriterion[] = newCriteria.map((c, idx) => ({
      ...c,
      id: 'crit_' + Date.now().toString(36) + '_' + idx + '_' + Math.random().toString(36).slice(2, 5)
    }));
    setStore(prev => ({
      ...prev,
      criteria: replaceExisting ? prepared : [...prev.criteria, ...prepared]
    }));
  };

  const handleDeleteCriterion = (critId: string) => {
    setStore(prev => ({
      ...prev,
      criteria: prev.criteria.filter(c => c.id !== critId)
    }));
  };

  // Announcements Actions
  const handleAddAnnouncement = (ann: Omit<Announcement, 'id' | 'classId'>) => {
    const newAnn: Announcement = {
      ...ann,
      id: 'ann_' + Date.now().toString(36),
      classId: currentClass.id
    };
    setStore(prev => ({ ...prev, announcements: [...prev.announcements, newAnn] }));
  };

  const handleUpdateAnnouncement = (id: string, updates: Partial<Announcement>) => {
    setStore(prev => ({
      ...prev,
      announcements: prev.announcements.map(a => a.id === id ? { ...a, ...updates } : a)
    }));
  };

  const handleDeleteAnnouncement = (id: string) => {
    setStore(prev => ({
      ...prev,
      announcements: prev.announcements.filter(a => a.id !== id)
    }));
  };

  // Remarks Actions
  const handleAddRemark = (rem: Omit<StudentRemark, 'id' | 'classId'>) => {
    const newRem: StudentRemark = {
      ...rem,
      id: 'rem_' + Date.now().toString(36),
      classId: currentClass.id
    };
    setStore(prev => ({ ...prev, remarks: [...prev.remarks, newRem] }));
  };

  const handleUpdateRemark = (id: string, updates: Partial<StudentRemark>) => {
    setStore(prev => ({
      ...prev,
      remarks: prev.remarks.map(r => r.id === id ? { ...r, ...updates } : r)
    }));
  };

  const handleDeleteRemark = (id: string) => {
    setStore(prev => ({
      ...prev,
      remarks: prev.remarks.filter(r => r.id !== id)
    }));
  };

  // Group Plans Actions
  const handleSaveGroupPlan = (plan: StudyGroupPlan) => {
    setStore(prev => ({
      ...prev,
      groupPlans: [...prev.groupPlans.filter(p => p.id !== plan.id), plan]
    }));
  };

  const handleDeleteGroupPlan = (planId: string) => {
    setStore(prev => ({
      ...prev,
      groupPlans: prev.groupPlans.filter(p => p.id !== planId)
    }));
  };

  // Grade Entries Actions
  const handleAddGrade = (grade: Omit<GradeEntry, 'id'>) => {
    const newGrade: GradeEntry = {
      ...grade,
      id: 'gr_' + Date.now().toString(36)
    };
    setStore(prev => ({ ...prev, grades: [...prev.grades, newGrade] }));
  };

  const handleBatchAddGrades = (newGrades: Omit<GradeEntry, 'id'>[]) => {
    const prepared: GradeEntry[] = newGrades.map((g, idx) => ({
      ...g,
      id: 'gr_' + Date.now().toString(36) + '_' + idx + '_' + Math.random().toString(36).slice(2, 5)
    }));
    setStore(prev => ({ ...prev, grades: [...prev.grades, ...prepared] }));
  };

  const handleDeleteGrade = (id: string) => {
    setStore(prev => ({
      ...prev,
      grades: prev.grades.filter(g => g.id !== id)
    }));
  };

  // Seating Chart Config
  const handleSaveSeatingConfig = (cfg: SeatingChartConfig) => {
    setStore(prev => ({
      ...prev,
      seatingCharts: {
        ...prev.seatingCharts,
        [currentClass.id]: cfg
      }
    }));
  };

  // Timetable Schedule
  const handleSaveTimetable = (timetable: TimetableSchedule) => {
    setStore(prev => ({
      ...prev,
      timetables: {
        ...prev.timetables,
        [currentClass.id]: timetable
      }
    }));
  };

  // Class Fund Actions
  const handleAddFundCampaign = (campaign: Omit<FundCampaign, 'id'>) => {
    const newCamp: FundCampaign = {
      ...campaign,
      id: 'camp_' + Date.now().toString(36)
    };
    setStore(prev => ({
      ...prev,
      fundCampaigns: [...(prev.fundCampaigns || []), newCamp]
    }));
  };

  const handleUpdateFundCampaign = (id: string, updates: Partial<FundCampaign>) => {
    setStore(prev => ({
      ...prev,
      fundCampaigns: (prev.fundCampaigns || []).map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const handleDeleteFundCampaign = (id: string) => {
    setStore(prev => ({
      ...prev,
      fundCampaigns: (prev.fundCampaigns || []).filter(c => c.id !== id),
      fundContributions: (prev.fundContributions || []).filter(c => c.campaignId !== id)
    }));
  };

  const handleUpdateFundContribution = (id: string, updates: Partial<FundContribution>) => {
    setStore(prev => {
      const existing = (prev.fundContributions || []).find(c => c.id === id);
      let updatedContribs: FundContribution[];
      if (existing) {
        updatedContribs = (prev.fundContributions || []).map(c => c.id === id ? { ...c, ...updates } : c);
      } else {
        const parts = id.split('_');
        const studentId = parts[1] || '';
        const campaignId = parts[2] || '';
        const st = prev.students.find(s => s.id === studentId);
        const newContrib: FundContribution = {
          id,
          classId: currentClass.id,
          campaignId,
          studentId,
          studentName: st?.fullName || '',
          team: st?.team || 1,
          amountPaid: updates.amountPaid || 0,
          paidDate: updates.paidDate || new Date().toISOString().slice(0, 10),
          status: updates.status || 'paid',
          paymentMethod: updates.paymentMethod || 'Tiền mặt',
          ...updates
        };
        updatedContribs = [...(prev.fundContributions || []), newContrib];
      }

      return {
        ...prev,
        fundContributions: updatedContribs
      };
    });
  };

  const handleBatchMarkPaid = (campaignId: string, studentIds: string[], amount: number) => {
    const today = new Date().toISOString().slice(0, 10);
    setStore(prev => {
      let contribs = [...(prev.fundContributions || [])];
      studentIds.forEach(stId => {
        const student = prev.students.find(s => s.id === stId);
        const idx = contribs.findIndex(c => c.campaignId === campaignId && c.studentId === stId);
        if (idx !== -1) {
          contribs[idx] = {
            ...contribs[idx],
            amountPaid: amount,
            paidDate: today,
            status: 'paid'
          };
        } else if (student) {
          contribs.push({
            id: `contrib_${stId}_${campaignId}`,
            classId: currentClass.id,
            campaignId,
            studentId: stId,
            studentName: student.fullName,
            team: student.team,
            amountPaid: amount,
            paidDate: today,
            status: 'paid',
            paymentMethod: 'Tiền mặt'
          });
        }
      });

      return {
        ...prev,
        fundContributions: contribs
      };
    });
  };

  const handleAddFundTransaction = (tx: Omit<FundTransaction, 'id'>) => {
    const newTx: FundTransaction = {
      ...tx,
      id: 'tx_' + Date.now().toString(36)
    };
    setStore(prev => ({
      ...prev,
      fundTransactions: [...(prev.fundTransactions || []), newTx]
    }));
  };

  const handleDeleteFundTransaction = (id: string) => {
    setStore(prev => ({
      ...prev,
      fundTransactions: (prev.fundTransactions || []).filter(t => t.id !== id)
    }));
  };

  // Lucky Wheel Actions
  const handleAddWheelHistory = (rec: Omit<WheelHistory, 'id'>) => {
    const newRec: WheelHistory = {
      ...rec,
      id: 'wh_' + Date.now().toString(36)
    };
    setStore(prev => ({ ...prev, wheelHistory: [...prev.wheelHistory, newRec] }));
  };

  const handleClearWheelHistory = () => {
    setStore(prev => ({
      ...prev,
      wheelHistory: prev.wheelHistory.filter(h => h.classId !== currentClass.id)
    }));
    sound.playClick();
  };

  // System Resets & Restores
  const handleRestoreSampleData = () => {
    const sample = generateSampleStore();
    setStore(sample);
  };

  const handleClearSampleDataAndStartFresh = () => {
    const blank = createBlankClass('Lớp mới', 'Khối 6', '2024 - 2025', currentClass.teacherName || 'Giáo viên');
    setStore({
      classes: [blank],
      students: [],
      attendance: [],
      criteria: store.criteria,
      emulationLogs: [],
      announcements: [],
      remarks: [],
      groupPlans: [],
      grades: [],
      seatingCharts: {
        [blank.id]: { classId: blank.id, rows: 4, cols: 4, seats: [] }
      },
      timetables: {
        [blank.id]: { classId: blank.id, morning: {}, afternoon: {} }
      },
      rewards: store.rewards,
      redemptions: [],
      wheelHistory: [],
      fundCampaigns: [],
      fundContributions: [],
      fundTransactions: [],
      settings: {
        ...store.settings,
        activeClassId: blank.id
      },
      version: '1.0.0'
    });
    sound.playSuccess();
  };

  const handleClearAllData = () => {
    const blank = createBlankClass('Lớp của tôi', 'Khối 6', '2024 - 2025', 'Thầy/Cô giáo');
    const freshStore: FullClassDataStore = {
      classes: [blank],
      students: [],
      attendance: [],
      criteria: store.criteria,
      emulationLogs: [],
      announcements: [],
      remarks: [],
      groupPlans: [],
      grades: [],
      seatingCharts: {
        [blank.id]: { classId: blank.id, rows: 4, cols: 4, seats: [] }
      },
      timetables: {
        [blank.id]: { classId: blank.id, morning: {}, afternoon: {} }
      },
      rewards: store.rewards,
      redemptions: [],
      wheelHistory: [],
      fundCampaigns: [],
      fundContributions: [],
      fundTransactions: [],
      settings: {
        ...store.settings,
        activeClassId: blank.id
      },
      version: '1.0.0'
    };
    setStore(freshStore);
  };

  const currentSeatingConfig = store.seatingCharts[currentClass.id] || {
    classId: currentClass.id,
    rows: 4,
    cols: 4,
    seats: []
  };

  const currentTimetable = store.timetables[currentClass.id] || {
    classId: currentClass.id,
    morning: {},
    afternoon: {}
  };

  // Dedicated Login Screen Gate: Requires password for both Teacher and Team Leader
  if (!isAuthenticated) {
    return (
      <LoginScreen
        currentClass={currentClass}
        students={store.students}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-teal-100 selection:text-teal-900">
      {/* Top Header */}
      <Header
        currentClass={currentClass}
        allClasses={store.classes}
        students={store.students}
        studentCount={currentClassStudents.length}
        onSelectClass={handleSelectClass}
        onOpenClassManager={() => setCurrentView('classes')}
        onOpenSettings={() => setCurrentView('settings')}
        soundEnabled={store.settings.soundEnabled}
        onToggleSound={() => updateSettings({ soundEnabled: !store.settings.soundEnabled })}
        onUpdateTeacherName={(teacherName) => handleUpdateClass(currentClass.id, { teacherName })}
        currentUserRole={currentUserRole}
        onOpenLogin={() => setShowLoginModal(true)}
        onLogoutToGVCN={handleLogoutToGVCN}
        onLogout={handleLogout}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          currentUserRole={currentUserRole}
          onLogoutToGVCN={handleLogoutToGVCN}
          onLogout={handleLogout}
        />

        {/* Content Area */}
        <main 
          className={`flex-1 transition-all duration-300 p-4 lg:p-6 pb-20 custom-scrollbar overflow-y-auto ${
            sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          }`}
        >
          {/* Mobile hamburger row */}
          <div className="lg:hidden flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-xs"
            >
              <Menu className="w-5 h-5" />
              <span className="text-xs font-bold">Danh mục menu (15 chức năng)</span>
            </button>

            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg">
              {currentClass.name}
            </span>
          </div>

          {/* Render Active View */}
          {currentView === 'dashboard' && (
            <Dashboard
              currentClass={currentClass}
              students={store.students}
              attendance={store.attendance}
              emulationLogs={store.emulationLogs}
              announcements={store.announcements}
              remarks={store.remarks}
              onNavigate={setCurrentView}
              onOpenQuickAddStudent={() => {
                const count = currentClassStudents.length + 1;
                setQuickStudentCode(`HS${String(count).padStart(2, '0')}`);
                setQuickStudentName('');
                setQuickStudentTeam(1);
                setShowQuickAddStudent(true);
              }}
              onClearSampleDataAndStartFresh={handleClearSampleDataAndStartFresh}
              onOpenLogin={() => setShowLoginModal(true)}
            />
          )}

          {currentView === 'classes' && (
            <ClassManager
              classes={store.classes}
              activeClassId={currentClass.id}
              students={store.students}
              onSelectClass={handleSelectClass}
              onCreateClass={handleCreateClass}
              onUpdateClass={handleUpdateClass}
              onDeleteClass={handleDeleteClass}
              onLoadSampleData={handleRestoreSampleData}
            />
          )}

          {currentView === 'students' && (
            <StudentManager
              currentClass={currentClass}
              students={store.students}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onBulkAddStudents={handleBulkAddStudents}
            />
          )}

          {currentView === 'attendance' && (
            <AttendanceView
              currentClass={currentClass}
              students={store.students}
              attendance={store.attendance}
              onSaveAttendance={handleSaveAttendance}
            />
          )}

          {currentView === 'remarks' && (
            <RemarksView
              currentClass={currentClass}
              students={store.students}
              announcements={store.announcements}
              remarks={store.remarks}
              onAddAnnouncement={handleAddAnnouncement}
              onUpdateAnnouncement={handleUpdateAnnouncement}
              onDeleteAnnouncement={handleDeleteAnnouncement}
              onAddRemark={handleAddRemark}
              onUpdateRemark={handleUpdateRemark}
              onDeleteRemark={handleDeleteRemark}
            />
          )}

          {currentView === 'groups' && (
            <GroupDivision
              currentClass={currentClass}
              students={store.students}
              savedPlans={store.groupPlans}
              onSavePlan={handleSaveGroupPlan}
              onDeletePlan={handleDeleteGroupPlan}
            />
          )}

          {currentView === 'teams' && (
            <TeamManager
              currentClass={currentClass}
              students={store.students}
              onUpdateStudent={handleUpdateStudent}
            />
          )}

          {currentView === 'emulation' && (
            <EmulationView
              currentClass={currentClass}
              students={store.students}
              criteria={store.criteria}
              logs={store.emulationLogs}
              onAddLog={handleAddEmulationLog}
              onDeleteLog={handleDeleteEmulationLog}
              onAddCriterion={handleAddCriterion}
              onDeleteCriterion={handleDeleteCriterion}
              currentUserRole={currentUserRole}
              onOpenLogin={() => setShowLoginModal(true)}
              onLogoutToGVCN={handleLogoutToGVCN}
              onBatchAddCriteria={handleBatchAddCriteria}
            />
          )}

          {currentView === 'grades' && (
            <GradebookView
              currentClass={currentClass}
              students={store.students}
              grades={store.grades}
              onAddGrade={handleAddGrade}
              onBatchAddGrades={handleBatchAddGrades}
              onDeleteGrade={handleDeleteGrade}
            />
          )}

          {currentView === 'seating' && (
            <SeatingPlan
              currentClass={currentClass}
              students={store.students}
              config={currentSeatingConfig}
              onSaveConfig={handleSaveSeatingConfig}
            />
          )}

          {currentView === 'timetable' && (
            <Timetable
              currentClass={currentClass}
              schedule={currentTimetable}
              onSaveSchedule={handleSaveTimetable}
            />
          )}

          {currentView === 'fund' && (
            <ClassFundView
              currentClass={currentClass}
              students={store.students}
              campaigns={store.fundCampaigns || []}
              contributions={store.fundContributions || []}
              transactions={store.fundTransactions || []}
              onAddCampaign={handleAddFundCampaign}
              onUpdateCampaign={handleUpdateFundCampaign}
              onDeleteCampaign={handleDeleteFundCampaign}
              onUpdateContribution={handleUpdateFundContribution}
              onBatchMarkPaid={handleBatchMarkPaid}
              onAddTransaction={handleAddFundTransaction}
              onDeleteTransaction={handleDeleteFundTransaction}
            />
          )}

          {currentView === 'wheel' && (
            <LuckyWheel
              currentClass={currentClass}
              students={store.students}
              rewards={store.rewards || []}
              history={store.wheelHistory}
              onAddHistory={handleAddWheelHistory}
              onClearHistory={handleClearWheelHistory}
              soundEnabled={store.settings.soundEnabled}
            />
          )}

          {currentView === 'reports' && (
            <ReportsView
              currentClass={currentClass}
              students={store.students}
              attendance={store.attendance}
              emulationLogs={store.emulationLogs}
              remarks={store.remarks}
              redemptions={store.redemptions || []}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              currentClass={currentClass}
              allStore={store}
              onUpdateSettings={updateSettings}
              onImportBackup={(importedStore) => setStore(importedStore)}
              onRestoreSampleData={handleRestoreSampleData}
              onClearAllData={handleClearAllData}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* Quick Add Student Modal */}
      {showQuickAddStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-600" />
                Thêm nhanh học sinh vào {currentClass.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickAddStudent(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mã học sinh</label>
                <input
                  type="text"
                  required
                  value={quickStudentCode}
                  onChange={(e) => setQuickStudentCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-mono uppercase font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và tên học sinh <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="VD: Trần Văn Bình"
                  value={quickStudentName}
                  onChange={(e) => setQuickStudentName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phân vào tổ</label>
                <select
                  value={quickStudentTeam}
                  onChange={(e) => setQuickStudentTeam(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-semibold"
                >
                  <option value={1}>Tổ 1</option>
                  <option value={2}>Tổ 2</option>
                  <option value={3}>Tổ 3</option>
                  <option value={4}>Tổ 4</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuickAddStudent(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Thêm học sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Login & Role Switcher Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        currentUserRole={currentUserRole}
        onSelectRole={handleLoginSuccess}
        students={store.students}
        currentClass={currentClass}
      />
    </div>
  );
}
