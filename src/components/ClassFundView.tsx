import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  ArrowDownRight, 
  ArrowUpRight, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileSpreadsheet, 
  Edit, 
  Trash2, 
  X, 
  Check, 
  ChevronRight,
  Sparkles,
  PieChart,
  Landmark,
  Receipt,
  UserCheck
} from 'lucide-react';
import { 
  ClassInfo, 
  Student, 
  FundCampaign, 
  FundContribution, 
  FundTransaction,
  FundCategoryType 
} from '../types';
import { sound } from '../utils/audio';
import { exportFundReportToExcel } from '../utils/excel';

interface ClassFundViewProps {
  currentClass: ClassInfo;
  students: Student[];
  campaigns: FundCampaign[];
  contributions: FundContribution[];
  transactions: FundTransaction[];
  onAddCampaign: (campaign: Omit<FundCampaign, 'id'>) => void;
  onUpdateCampaign: (id: string, updates: Partial<FundCampaign>) => void;
  onDeleteCampaign: (id: string) => void;
  onUpdateContribution: (id: string, updates: Partial<FundContribution>) => void;
  onBatchMarkPaid: (campaignId: string, studentIds: string[], amount: number) => void;
  onAddTransaction: (transaction: Omit<FundTransaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
}

const INCOME_CATEGORIES = [
  'Thu đóng góp học sinh',
  'Tài trợ PHHS',
  'Thưởng thi đua',
  'Kế hoạch nhỏ',
  'Quỹ tồn kỳ trước',
  'Khác'
];

const EXPENSE_CATEGORIES = [
  'Khen thưởng thi đua',
  'In tài liệu học tập',
  'Liên hoan & Sự kiện',
  'Cơ sở vật chất lớp',
  'Thăm hỏi hiếu hỉ',
  'Hoạt động Đoàn - Đội',
  'Khác'
];

export const ClassFundView: React.FC<ClassFundViewProps> = ({
  currentClass,
  students,
  campaigns,
  contributions,
  transactions,
  onAddCampaign,
  onUpdateCampaign,
  onDeleteCampaign,
  onUpdateContribution,
  onBatchMarkPaid,
  onAddTransaction,
  onDeleteTransaction
}) => {
  const classStudents = useMemo(() => students.filter(s => s.classId === currentClass.id), [students, currentClass.id]);
  const classCampaigns = useMemo(() => campaigns.filter(c => c.classId === currentClass.id), [campaigns, currentClass.id]);
  const classContributions = useMemo(() => contributions.filter(c => c.classId === currentClass.id), [contributions, currentClass.id]);
  const classTransactions = useMemo(() => transactions.filter(t => t.classId === currentClass.id), [transactions, currentClass.id]);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'contributions' | 'incomes' | 'expenses' | 'report'>('overview');

  // Active Campaign selected for contributions view
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(classCampaigns[0]?.id || '');

  // Keep selectedCampaignId updated if list changes
  React.useEffect(() => {
    if (!classCampaigns.some(c => c.id === selectedCampaignId) && classCampaigns.length > 0) {
      setSelectedCampaignId(classCampaigns[0].id);
    }
  }, [classCampaigns, selectedCampaignId]);

  // Current selected campaign
  const activeCampaign = classCampaigns.find(c => c.id === selectedCampaignId) || classCampaigns[0];

  // Filters
  const [contribFilterTeam, setContribFilterTeam] = useState<string>('all');
  const [contribFilterStatus, setContribFilterStatus] = useState<string>('all');
  const [contribSearch, setContribSearch] = useState('');

  // Modals
  const [showAddCampaignModal, setShowAddCampaignModal] = useState(false);
  const [campTitle, setCampTitle] = useState('');
  const [campAmount, setCampAmount] = useState<number>(100000);
  const [campStartDate, setCampStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [campEndDate, setCampEndDate] = useState('');
  const [campDesc, setCampDesc] = useState('');

  // Add Income / Expense Transaction Modal
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<FundCategoryType>('expense');
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState<number>(100000);
  const [txCategory, setTxCategory] = useState<string>('Khen thưởng thi đua');
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [txPayerOrReceiver, setTxPayerOrReceiver] = useState('');
  const [txReceiptNumber, setTxReceiptNumber] = useState('');
  const [txNotes, setTxNotes] = useState('');
  const [txCreatedBy, setTxCreatedBy] = useState<'Thủ quỹ' | 'GVCN'>('Thủ quỹ');

  // Edit Single Contribution Modal
  const [editingContrib, setEditingContrib] = useState<FundContribution | null>(null);
  const [contribPaidAmount, setContribPaidAmount] = useState<number>(0);
  const [contribMethod, setContribMethod] = useState<'Tiền mặt' | 'Chuyển khoản'>('Tiền mặt');
  const [contribTransferRef, setContribTransferRef] = useState<string>('');
  const [contribDate, setContribDate] = useState(new Date().toISOString().slice(0, 10));
  const [contribNote, setContribNote] = useState('');
  const [contribFilterMethod, setContribFilterMethod] = useState<string>('all');

  // Financial calculations
  const totalIncome = useMemo(() => {
    return classTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [classTransactions]);

  const totalExpense = useMemo(() => {
    return classTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [classTransactions]);

  const currentBalance = totalIncome - totalExpense;

  // Active Campaign contributions mapping (ensure every class student is accounted for)
  const currentCampaignContributions = useMemo(() => {
    if (!activeCampaign) return [];
    const list: FundContribution[] = [];

    classStudents.forEach(st => {
      const existing = classContributions.find(c => c.campaignId === activeCampaign.id && c.studentId === st.id);
      if (existing) {
        list.push(existing);
      } else {
        // default placeholder
        list.push({
          id: `contrib_${st.id}_${activeCampaign.id}`,
          classId: currentClass.id,
          campaignId: activeCampaign.id,
          studentId: st.id,
          studentName: st.fullName,
          team: st.team,
          amountPaid: 0,
          paidDate: '',
          status: 'unpaid',
          paymentMethod: 'Tiền mặt',
          collector: 'Thủ quỹ'
        });
      }
    });

    return list;
  }, [classStudents, classContributions, activeCampaign, currentClass.id]);

  // Campaign progress metrics (supporting surplus and cash/transfer split)
  const campaignMetrics = useMemo(() => {
    if (!activeCampaign) return { 
      totalExpected: 0, 
      totalCollected: 0, 
      paidCount: 0, 
      rate: 0, 
      cashTotal: 0, 
      transferTotal: 0, 
      surplusCount: 0, 
      surplusTotal: 0 
    };

    const target = activeCampaign.targetAmountPerStudent;
    const totalExpected = classStudents.length * target;
    const totalCollected = currentCampaignContributions.reduce((sum, c) => sum + (c.amountPaid || 0), 0);
    const paidCount = currentCampaignContributions.filter(c => c.status === 'paid').length;
    const rate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    let cashTotal = 0;
    let transferTotal = 0;
    let surplusCount = 0;
    let surplusTotal = 0;

    currentCampaignContributions.forEach(c => {
      const amt = c.amountPaid || 0;
      if (c.paymentMethod === 'Chuyển khoản') {
        transferTotal += amt;
      } else {
        cashTotal += amt;
      }
      if (amt > target) {
        surplusCount++;
        surplusTotal += (amt - target);
      }
    });

    return { 
      totalExpected, 
      totalCollected, 
      paidCount, 
      rate, 
      cashTotal, 
      transferTotal, 
      surplusCount, 
      surplusTotal 
    };
  }, [activeCampaign, classStudents.length, currentCampaignContributions]);

  // Filtered contributions list
  const filteredContributions = useMemo(() => {
    return currentCampaignContributions.filter(c => {
      const matchSearch = c.studentName.toLowerCase().includes(contribSearch.toLowerCase());
      const matchTeam = contribFilterTeam === 'all' || c.team === Number(contribFilterTeam);
      const matchStatus = contribFilterStatus === 'all' || c.status === contribFilterStatus;
      const matchMethod = contribFilterMethod === 'all' || c.paymentMethod === contribFilterMethod;
      return matchSearch && matchTeam && matchStatus && matchMethod;
    });
  }, [currentCampaignContributions, contribSearch, contribFilterTeam, contribFilterStatus, contribFilterMethod]);

  // Category expense breakdown
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    classTransactions.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [classTransactions]);

  // Handlers
  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campTitle.trim()) return;

    onAddCampaign({
      classId: currentClass.id,
      title: campTitle.trim(),
      targetAmountPerStudent: Math.max(0, campAmount),
      startDate: campStartDate,
      endDate: campEndDate || undefined,
      description: campDesc.trim(),
      status: 'active'
    });

    sound.playSuccess();
    setShowAddCampaignModal(false);
    setCampTitle('');
    setCampAmount(100000);
    setCampDesc('');
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle.trim() || txAmount <= 0) return;

    onAddTransaction({
      classId: currentClass.id,
      type: txType,
      title: txTitle.trim(),
      amount: txAmount,
      date: txDate,
      category: txCategory,
      payerOrReceiver: txPayerOrReceiver.trim() || (txType === 'income' ? 'Đóng góp' : 'Người nhận'),
      receiptNumber: txReceiptNumber.trim() || (txType === 'income' ? 'PT-' + Date.now().toString().slice(-4) : 'PC-' + Date.now().toString().slice(-4)),
      notes: txNotes.trim(),
      createdBy: txCreatedBy
    });

    sound.playSuccess();
    setShowTxModal(false);
    setTxTitle('');
    setTxAmount(100000);
    setTxNotes('');
    setTxReceiptNumber('');
    setTxPayerOrReceiver('');
  };

  const handleQuickMarkStudentPaid = (item: FundContribution) => {
    if (!activeCampaign) return;
    const target = activeCampaign.targetAmountPerStudent;
    const isPaid = item.status === 'paid';

    if (isPaid) {
      // Toggle back to unpaid
      onUpdateContribution(item.id, {
        amountPaid: 0,
        paidDate: '',
        status: 'unpaid'
      });
      sound.playClick();
    } else {
      // Mark as fully paid
      onUpdateContribution(item.id, {
        amountPaid: target,
        paidDate: new Date().toISOString().slice(0, 10),
        status: 'paid',
        paymentMethod: 'Tiền mặt'
      });
      sound.playCoin();
    }
  };

  const handleMarkTeamPaid = (teamNumber: number) => {
    if (!activeCampaign) return;
    const teamStudents = classStudents.filter(s => s.team === teamNumber);
    const target = activeCampaign.targetAmountPerStudent;
    onBatchMarkPaid(activeCampaign.id, teamStudents.map(s => s.id), target);
    sound.playSuccess();
  };

  const handleSaveEditContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContrib || !activeCampaign) return;

    const target = activeCampaign.targetAmountPerStudent;
    const amount = Math.max(0, contribPaidAmount);
    const status = amount >= target ? 'paid' : amount > 0 ? 'partial' : 'unpaid';

    onUpdateContribution(editingContrib.id, {
      amountPaid: amount,
      paidDate: contribDate,
      status,
      paymentMethod: contribMethod,
      transferReference: contribMethod === 'Chuyển khoản' ? contribTransferRef.trim() : undefined,
      note: contribNote.trim()
    });

    sound.playSuccess();
    setEditingContrib(null);
  };

  const handleInlineAmountChange = (item: FundContribution, rawValue: string) => {
    if (!activeCampaign) return;
    const target = activeCampaign.targetAmountPerStudent;
    const parsed = parseInt(rawValue.replace(/\D/g, ''), 10) || 0;
    const status = parsed >= target ? 'paid' : parsed > 0 ? 'partial' : 'unpaid';

    onUpdateContribution(item.id, {
      amountPaid: parsed,
      paidDate: parsed > 0 ? (item.paidDate || new Date().toISOString().slice(0, 10)) : '',
      status
    });
  };

  const handleInlineMethodToggle = (item: FundContribution) => {
    const nextMethod = item.paymentMethod === 'Chuyển khoản' ? 'Tiền mặt' : 'Chuyển khoản';
    onUpdateContribution(item.id, {
      paymentMethod: nextMethod
    });
    sound.playClick();
  };

  const openEditContributionModal = (c: FundContribution) => {
    setEditingContrib(c);
    setContribPaidAmount(c.amountPaid || (activeCampaign?.targetAmountPerStudent || 0));
    setContribMethod(c.paymentMethod || 'Tiền mặt');
    setContribTransferRef(c.transferReference || '');
    setContribDate(c.paidDate || new Date().toISOString().slice(0, 10));
    setContribNote(c.note || '');
    sound.playClick();
  };

  // Export full report to Excel
  const handleExportExcel = () => {
    exportFundReportToExcel(
      currentClass.name,
      currentClass.teacherName || 'GVCN',
      activeCampaign ? activeCampaign.title : 'Quỹ lớp',
      currentCampaignContributions,
      classTransactions.filter(t => t.type === 'income'),
      classTransactions.filter(t => t.type === 'expense')
    );
    sound.playSuccess();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-teal-600" />
            Sổ Quỹ Lớp & Báo Cáo Thu Chi Minh Bạch
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý danh sách đóng tiền của học sinh, theo dõi nguồn thu, nguồn chi và xuất báo cáo tài chính cho lớp {currentClass.name}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setTxType('income');
              setTxCategory('Thu đóng góp học sinh');
              setShowTxModal(true);
              sound.playClick();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors"
          >
            <ArrowDownRight className="w-4 h-4 text-emerald-600" />
            + Khoản Thu Mới
          </button>

          <button
            type="button"
            onClick={() => {
              setTxType('expense');
              setTxCategory('Khen thưởng thi đua');
              setShowTxModal(true);
              sound.playClick();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
          >
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
            - Khoản Chi Mới
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            title="Xuất toàn bộ sổ thu chi và danh sách đóng tiền ra file Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Xuất Báo Cáo Excel
          </button>
        </div>
      </div>

      {/* 4 Financial Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span>Tổng nguồn thu (+)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 tabular-nums">
            {totalIncome.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {classTransactions.filter(t => t.type === 'income').length} khoản thu đã ghi
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span>Tổng nguồn chi (-)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-600 tabular-nums">
            {totalExpense.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {classTransactions.filter(t => t.type === 'expense').length} khoản chi đã thực hiện
          </div>
        </div>

        {/* Current Balance */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span>Tồn quỹ hiện tại (=)</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${currentBalance >= 0 ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'}`}>
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl sm:text-2xl font-extrabold tabular-nums ${currentBalance >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
            {currentBalance.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Số dư khả dụng hiện có
          </div>
        </div>

        {/* Contribution Completion Rate */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span>Tiến độ thu quỹ đợt này</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-700 tabular-nums">
            {campaignMetrics.rate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate" title={activeCampaign?.title}>
            Đã nộp: {campaignMetrics.paidCount}/{classStudents.length} học sinh
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => {
            setActiveTab('overview');
            sound.playClick();
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tổng quan & Sổ quỹ
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('contributions');
            sound.playClick();
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'contributions' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Danh sách đóng tiền quỹ ({classStudents.length} HS)
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('incomes');
            sound.playClick();
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'incomes' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Nguồn thu ({classTransactions.filter(t => t.type === 'income').length})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('expenses');
            sound.playClick();
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'expenses' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Nguồn chi ({classTransactions.filter(t => t.type === 'expense').length})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('report');
            sound.playClick();
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'report' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 text-teal-600" />
          Báo cáo quyết toán & In ấn
        </button>
      </div>

      {/* TAB 1: OVERVIEW & RECENT TRANSACTIONS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions List */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-teal-600" />
                Nhật ký thu chi gần đây
              </h3>
              <span className="text-xs text-slate-400">
                Toàn bộ các giao dịch tài chính của lớp
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {classTransactions.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  Chưa có giao dịch thu chi nào. Bấm nút "+ Khoản Thu Mới" hoặc "- Khoản Chi Mới" để bắt đầu.
                </div>
              ) : (
                [...classTransactions].reverse().map(tx => (
                  <div key={tx.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {tx.type === 'income' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{tx.title}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{tx.date}</span>
                          <span className="text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">{tx.category}</span>
                          <span>Đối tác: {tx.payerOrReceiver}</span>
                          {tx.receiptNumber && <span className="font-mono text-slate-500">[{tx.receiptNumber}]</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`text-xs font-extrabold tabular-nums ${
                        tx.type === 'income' ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        {tx.type === 'income' ? `+${tx.amount.toLocaleString('vi-VN')} đ` : `-${tx.amount.toLocaleString('vi-VN')} đ`}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Xóa giao dịch "${tx.title}" (${tx.amount.toLocaleString('vi-VN')}đ)?`)) {
                            onDeleteTransaction(tx.id);
                            sound.playClick();
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Xóa giao dịch này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Category Breakdown & Quick Campaign Preview */}
          <div className="space-y-4">
            {/* Expense breakdown by category */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>Cơ cấu các khoản chi tiêu</span>
                <PieChart className="w-4 h-4 text-teal-600" />
              </h3>

              <div className="space-y-2">
                {expenseByCategory.length === 0 ? (
                  <div className="text-center py-4 text-slate-400 text-xs">
                    Chưa có khoản chi nào.
                  </div>
                ) : (
                  expenseByCategory.map(([cat, amount]) => {
                    const percent = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-700">{cat}</span>
                          <span className="font-bold text-slate-900 tabular-nums">{amount.toLocaleString('vi-VN')} đ ({percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-teal-600 h-full rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Campaign info card */}
            {activeCampaign && (
              <div className="bg-gradient-to-br from-teal-50 to-white border border-teal-200 rounded-2xl p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase text-teal-800">Đợt thu đang áp dụng</span>
                  <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                    {activeCampaign.status === 'active' ? 'Đang thu' : 'Hoàn thành'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{activeCampaign.title}</h4>
                <div className="text-xs text-slate-600">
                  Mức thu quy định: <strong className="text-teal-900">{activeCampaign.targetAmountPerStudent.toLocaleString('vi-VN')} đ / học sinh</strong>
                </div>
                <div className="pt-2 flex justify-between items-center text-xs">
                  <span>Tiến độ đóng tiền:</span>
                  <strong className="text-teal-800">{campaignMetrics.paidCount} / {classStudents.length} học sinh</strong>
                </div>
                <div className="w-full bg-teal-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-teal-600 h-full rounded-full transition-all"
                    style={{ width: `${campaignMetrics.rate}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: STUDENT CONTRIBUTION TRACKING */}
      {activeTab === 'contributions' && (
        <div className="space-y-4">
          {/* Campaign Selector & Toolbar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700">Đợt thu tiền quỹ:</span>
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-hidden"
              >
                {classCampaigns.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.targetAmountPerStudent.toLocaleString('vi-VN')}đ/HS)
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setShowAddCampaignModal(true);
                  sound.playClick();
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm đợt thu mới
              </button>
            </div>

            {/* Quick Team Collection Actions */}
            <div className="flex items-center gap-1.5 text-xs flex-wrap">
              <span className="text-slate-400 font-medium text-[11px]">Thu cả tổ (1-click):</span>
              {[1, 2, 3, 4].map(tNum => (
                <button
                  key={tNum}
                  type="button"
                  onClick={() => handleMarkTeamPaid(tNum)}
                  className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg font-bold text-[11px] transition-colors"
                  title={`Đánh dấu toàn bộ học sinh Tổ ${tNum} đã nộp đủ`}
                >
                  Tổ {tNum}
                </button>
              ))}
            </div>
          </div>

          {/* Campaign KPI Mini-Strip */}
          {activeCampaign && (
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-teal-950 text-sm block">{activeCampaign.title}</span>
                <span className="text-teal-700 text-[11px]">
                  Mức quy định: <strong>{activeCampaign.targetAmountPerStudent.toLocaleString('vi-VN')} đ</strong> / em · Dự kiến: <strong>{campaignMetrics.totalExpected.toLocaleString('vi-VN')} đ</strong>
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[11px] text-teal-700 block">Đã thu thực tế:</span>
                  <span className="text-base font-extrabold text-teal-900 tabular-nums">
                    {campaignMetrics.totalCollected.toLocaleString('vi-VN')} đ ({campaignMetrics.rate}%)
                  </span>
                </div>
                <div className="text-right border-l border-teal-200 pl-4">
                  <span className="text-[11px] text-teal-700 block">Học sinh hoàn thành:</span>
                  <span className="text-base font-extrabold text-teal-900 tabular-nums">
                    {campaignMetrics.paidCount} / {classStudents.length} em
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Search & Filters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm học sinh theo tên..."
                value={contribSearch}
                onChange={(e) => setContribSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:bg-white focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <span className="text-slate-400 font-medium">Tổ:</span>
                <select
                  value={contribFilterTeam}
                  onChange={(e) => setContribFilterTeam(e.target.value)}
                  className="bg-transparent font-semibold text-slate-700 outline-hidden"
                >
                  <option value="all">Tất cả</option>
                  <option value="1">Tổ 1</option>
                  <option value="2">Tổ 2</option>
                  <option value="3">Tổ 3</option>
                  <option value="4">Tổ 4</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <span className="text-slate-400 font-medium">Trạng thái:</span>
                <select
                  value={contribFilterStatus}
                  onChange={(e) => setContribFilterStatus(e.target.value)}
                  className="bg-transparent font-semibold text-slate-700 outline-hidden"
                >
                  <option value="all">Tất cả</option>
                  <option value="paid">Đã đóng đủ</option>
                  <option value="partial">Đóng một phần</option>
                  <option value="unpaid">Chưa đóng</option>
                </select>
              </div>
            </div>
          </div>

          {/* Student Contribution Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-3 text-center w-12">STT</th>
                    <th className="py-3 px-4">Họ và tên</th>
                    <th className="py-3 px-3 text-center w-16">Tổ</th>
                    <th className="py-3 px-3 text-right w-28">Mức thu</th>
                    <th className="py-3 px-3 text-right w-28">Đã đóng</th>
                    <th className="py-3 px-3 text-center w-28">Ngày nộp</th>
                    <th className="py-3 px-3 text-center w-24">Hình thức</th>
                    <th className="py-3 px-3 text-center w-28">Trạng thái</th>
                    <th className="py-3 px-4">Ghi chú</th>
                    <th className="py-3 px-3 text-center w-28">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredContributions.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        Không tìm thấy học sinh nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredContributions.map((item, idx) => {
                      const target = activeCampaign ? activeCampaign.targetAmountPerStudent : 0;
                      const isPaid = item.status === 'paid';
                      const isPartial = item.status === 'partial';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 text-center text-slate-400 tabular-nums">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {item.studentName}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700">
                              Tổ {item.team}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-slate-600 tabular-nums">
                            {target.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-teal-800 tabular-nums">
                            {(item.amountPaid || 0).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-3 px-3 text-center text-slate-500 tabular-nums">
                            {item.paidDate || '—'}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-600">
                            {item.paymentMethod || 'Tiền mặt'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isPaid 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : isPartial 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {isPaid ? 'Đã đóng đủ' : isPartial ? 'Đóng 1 phần' : 'Chưa đóng'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 italic text-[11px] max-w-xs truncate" title={item.note}>
                            {item.note || '—'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* 1-click toggle */}
                              <button
                                type="button"
                                onClick={() => handleQuickMarkStudentPaid(item)}
                                className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                                  isPaid
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : 'bg-slate-100 text-slate-600 hover:bg-emerald-600 hover:text-white'
                                }`}
                                title={isPaid ? 'Bấm để đánh dấu chưa đóng' : 'Bấm 1-click để thu đủ'}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit details */}
                              <button
                                type="button"
                                onClick={() => openEditContributionModal(item)}
                                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Chỉnh sửa số tiền nộp hoặc ghi chú"
                              >
                                <Edit className="w-3.5 h-3.5" />
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

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Đang hiển thị <strong>{filteredContributions.length}</strong> học sinh</span>
              <span className="text-teal-700 font-semibold">Tự động cập nhật vào nguồn thu sổ quỹ</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INCOMES (Nguồn thu) */}
      {activeTab === 'incomes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Danh sách chi tiết các khoản tiền thu vào quỹ lớp (Đóng góp học sinh, tài trợ phụ huynh, giải thưởng...)
            </span>
            <button
              type="button"
              onClick={() => {
                setTxType('income');
                setTxCategory('Thu đóng góp học sinh');
                setShowTxModal(true);
                sound.playClick();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm khoản thu mới
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-3 text-center w-12">STT</th>
                    <th className="py-3 px-3 w-24">Số phiếu</th>
                    <th className="py-3 px-4">Tên khoản thu</th>
                    <th className="py-3 px-3 w-32">Danh mục</th>
                    <th className="py-3 px-3 text-right w-32">Số tiền</th>
                    <th className="py-3 px-3 w-28 text-center">Ngày thu</th>
                    <th className="py-3 px-3 w-36">Người nộp / Nguồn</th>
                    <th className="py-3 px-4">Ghi chú</th>
                    <th className="py-3 px-3 text-center w-16">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classTransactions.filter(t => t.type === 'income').length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Chưa có khoản thu nào.
                      </td>
                    </tr>
                  ) : (
                    classTransactions
                      .filter(t => t.type === 'income')
                      .map((tx, idx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 text-center text-slate-400 tabular-nums">{idx + 1}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-700">{tx.receiptNumber || '—'}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{tx.title}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-semibold">
                              {tx.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-emerald-700 tabular-nums">
                            +{tx.amount.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-3 px-3 text-center text-slate-500 tabular-nums">{tx.date}</td>
                          <td className="py-3 px-3 text-slate-700 font-medium">{tx.payerOrReceiver}</td>
                          <td className="py-3 px-4 text-slate-500 italic text-[11px]">{tx.notes || '—'}</td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Xóa khoản thu "${tx.title}"?`)) {
                                  onDeleteTransaction(tx.id);
                                  sound.playClick();
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                              title="Xóa khoản thu"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EXPENSES (Nguồn chi) */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Danh sách chi tiết các khoản chi ra từ quỹ lớp (Khen thưởng, in tài liệu, liên hoan, cơ sở vật chất...)
            </span>
            <button
              type="button"
              onClick={() => {
                setTxType('expense');
                setTxCategory('Khen thưởng thi đua');
                setShowTxModal(true);
                sound.playClick();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm khoản chi mới
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-3 text-center w-12">STT</th>
                    <th className="py-3 px-3 w-24">Số phiếu</th>
                    <th className="py-3 px-4">Tên khoản chi</th>
                    <th className="py-3 px-3 w-32">Danh mục</th>
                    <th className="py-3 px-3 text-right w-32">Số tiền</th>
                    <th className="py-3 px-3 w-28 text-center">Ngày chi</th>
                    <th className="py-3 px-3 w-36">Người nhận / Chi</th>
                    <th className="py-3 px-4">Ghi chú</th>
                    <th className="py-3 px-3 text-center w-16">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classTransactions.filter(t => t.type === 'expense').length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Chưa có khoản chi nào được ghi nhận.
                      </td>
                    </tr>
                  ) : (
                    classTransactions
                      .filter(t => t.type === 'expense')
                      .map((tx, idx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 text-center text-slate-400 tabular-nums">{idx + 1}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-700">{tx.receiptNumber || '—'}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{tx.title}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 text-[11px] font-semibold">
                              {tx.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-rose-600 tabular-nums">
                            -{tx.amount.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-3 px-3 text-center text-slate-500 tabular-nums">{tx.date}</td>
                          <td className="py-3 px-3 text-slate-700 font-medium">{tx.payerOrReceiver}</td>
                          <td className="py-3 px-4 text-slate-500 italic text-[11px]">{tx.notes || '—'}</td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Xóa khoản chi "${tx.title}"?`)) {
                                  onDeleteTransaction(tx.id);
                                  sound.playClick();
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                              title="Xóa khoản chi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FINANCIAL REPORT & PRINTABLE AUDIT SHEET */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between no-print">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Phiếu Quyết Toán Thu Chi Quỹ Lớp (Chuẩn bị Họp Phụ Huynh)
              </h3>
              <p className="text-xs text-slate-500">
                Mẫu báo cáo A4 trang trọng, đầy đủ bảng kê thu - chi, tồn quỹ và các chữ ký xác nhận
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                Xuất Excel
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                <Printer className="w-4 h-4" />
                In phiếu quyết toán
              </button>
            </div>
          </div>

          {/* Printable Report Sheet */}
          <div className="bg-white border border-slate-300 p-8 rounded-2xl shadow-sm text-slate-900 text-xs space-y-6 print:m-0 print:border-none print:shadow-none">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <div className="font-extrabold uppercase text-slate-800">TRƯỜNG THCS · NĂM HỌC {currentClass.schoolYear}</div>
                <div className="text-base font-black text-teal-800 mt-1">LỚP: {currentClass.name.toUpperCase()}</div>
                <div className="text-[11px] text-slate-500">Giáo viên chủ nhiệm: {currentClass.teacherName || 'GVCN'}</div>
              </div>

              <div className="text-right">
                <div className="font-black text-sm uppercase text-slate-800">BẢNG QUYẾT TOÁN THU CHI QUỸ LỚP</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Ngày lập: {new Date().toLocaleDateString('vi-VN')}</div>
                <div className="text-[11px] text-slate-500">Sĩ số: {classStudents.length} học sinh</div>
              </div>
            </div>

            {/* Summary Box */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div>
                <div className="text-[11px] text-slate-500 uppercase font-semibold">I. TỔNG NGUỒN THU</div>
                <div className="text-base font-black text-emerald-700 mt-0.5 tabular-nums">
                  +{totalIncome.toLocaleString('vi-VN')} đ
                </div>
              </div>

              <div className="border-x border-slate-200 px-3">
                <div className="text-[11px] text-slate-500 uppercase font-semibold">II. TỔNG NGUỒN CHI</div>
                <div className="text-base font-black text-rose-600 mt-0.5 tabular-nums">
                  -{totalExpense.toLocaleString('vi-VN')} đ
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-500 uppercase font-semibold">III. TỒN QUỸ THỰC TẾ</div>
                <div className={`text-base font-black mt-0.5 tabular-nums ${currentBalance >= 0 ? 'text-teal-800' : 'text-rose-600'}`}>
                  {currentBalance.toLocaleString('vi-VN')} đ
                </div>
              </div>
            </div>

            {/* Detailed tables */}
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-800 mb-2 uppercase text-[11px] border-b pb-1">
                  1. CHI TIẾT CÁC KHOẢN THU
                </h4>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="py-1.5 px-2 w-10 text-center">#</th>
                      <th className="py-1.5 px-3">Khoản thu</th>
                      <th className="py-1.5 px-3 text-right w-28">Số tiền</th>
                      <th className="py-1.5 px-3 w-24 text-center">Ngày</th>
                      <th className="py-1.5 px-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classTransactions.filter(t => t.type === 'income').map((tx, i) => (
                      <tr key={tx.id}>
                        <td className="py-1 px-2 text-center text-slate-400">{i + 1}</td>
                        <td className="py-1 px-3 font-semibold">{tx.title}</td>
                        <td className="py-1 px-3 text-right font-bold text-emerald-800 tabular-nums">+{tx.amount.toLocaleString('vi-VN')} đ</td>
                        <td className="py-1 px-3 text-center text-slate-500">{tx.date}</td>
                        <td className="py-1 px-3 text-slate-500">{tx.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2 uppercase text-[11px] border-b pb-1">
                  2. CHI TIẾT CÁC KHOẢN CHI
                </h4>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="py-1.5 px-2 w-10 text-center">#</th>
                      <th className="py-1.5 px-3">Khoản chi</th>
                      <th className="py-1.5 px-3 text-right w-28">Số tiền</th>
                      <th className="py-1.5 px-3 w-24 text-center">Ngày</th>
                      <th className="py-1.5 px-3">Ghi chú / Chứng từ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classTransactions.filter(t => t.type === 'expense').map((tx, i) => (
                      <tr key={tx.id}>
                        <td className="py-1 px-2 text-center text-slate-400">{i + 1}</td>
                        <td className="py-1 px-3 font-semibold">{tx.title}</td>
                        <td className="py-1 px-3 text-right font-bold text-rose-600 tabular-nums">-{tx.amount.toLocaleString('vi-VN')} đ</td>
                        <td className="py-1 px-3 text-center text-slate-500">{tx.date}</td>
                        <td className="py-1 px-3 text-slate-500">{tx.notes || tx.receiptNumber || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signature Area */}
            <div className="pt-8 grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <div className="font-bold text-slate-800">TRƯỞNG BAN ĐẠI DIỆN CMHS</div>
                <div className="text-[10px] text-slate-400 italic">(Ký & ghi rõ họ tên)</div>
                <div className="h-16" />
                <div className="font-semibold text-slate-700">........................................</div>
              </div>

              <div>
                <div className="font-bold text-slate-800">THỦ QUỸ LỚP</div>
                <div className="text-[10px] text-slate-400 italic">(Ký & ghi rõ họ tên)</div>
                <div className="h-16" />
                <div className="font-semibold text-slate-700">Đặng Thùy Dương</div>
              </div>

              <div>
                <div className="font-bold text-slate-800">GIÁO VIÊN CHỦ NHIỆM</div>
                <div className="text-[10px] text-slate-400 italic">(Ký & ghi rõ họ tên)</div>
                <div className="h-16" />
                <div className="font-semibold text-teal-800">{currentClass.teacherName || 'GVCN'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Create New Campaign */}
      {showAddCampaignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-teal-600" />
                Tạo Đợt Thu Tiền Quỹ Mới
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCampaignModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên đợt thu quỹ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Quỹ hoạt động lớp Học kỳ II (2024 - 2025)..."
                  value={campTitle}
                  onChange={(e) => setCampTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mức thu quy định theo đầu học sinh (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  required
                  value={campAmount}
                  onChange={(e) => setCampAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-bold tabular-nums"
                />
                <span className="text-[11px] text-teal-700 mt-1 block">
                  Dự kiến cả lớp ({classStudents.length} HS): {(campAmount * classStudents.length).toLocaleString('vi-VN')} đ
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày bắt đầu thu</label>
                  <input
                    type="date"
                    value={campStartDate}
                    onChange={(e) => setCampStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hạn nộp</label>
                  <input
                    type="date"
                    value={campEndDate}
                    onChange={(e) => setCampEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mục đích thu & Nội dung dự chi</label>
                <textarea
                  rows={2}
                  placeholder="In tài liệu, mua chổi quét lớp, thăm hỏi, khen thưởng..."
                  value={campDesc}
                  onChange={(e) => setCampDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCampaignModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Tạo đợt thu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Income / Expense Transaction */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {txType === 'income' ? (
                  <>
                    <ArrowDownRight className="w-5 h-5 text-emerald-600" />
                    Thêm Khoản Thu Mới
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-5 h-5 text-rose-600" />
                    Thêm Khoản Chi Mới
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setShowTxModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên nội dung khoản {txType === 'income' ? 'thu' : 'chi'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={txType === 'income' ? 'VD: Tiền thưởng thi đua giải Nhất cấp trường...' : 'VD: Mua quà khen thưởng thi đua tuần 5...'}
                  value={txTitle}
                  onChange={(e) => setTxTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số tiền (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="5000"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-bold tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Danh mục phân loại
                  </label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-medium"
                  >
                    {(txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày giao dịch</label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {txType === 'income' ? 'Người nộp / nguồn tiền' : 'Người nhận / phụ trách'}
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Cô Mai Hoa / PH em Bình"
                    value={txPayerOrReceiver}
                    onChange={(e) => setTxPayerOrReceiver(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số chứng từ / Phiếu</label>
                  <input
                    type="text"
                    placeholder={txType === 'income' ? 'PT-01' : 'PC-01'}
                    value={txReceiptNumber}
                    onChange={(e) => setTxReceiptNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Người lập phiếu</label>
                  <select
                    value={txCreatedBy}
                    onChange={(e) => setTxCreatedBy(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                  >
                    <option value="Thủ quỹ">Thủ quỹ lớp</option>
                    <option value="GVCN">Giáo viên chủ nhiệm</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú chi tiết</label>
                <textarea
                  rows={2}
                  placeholder="Hóa đơn cửa hàng, số lượng vật phẩm..."
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-xl font-semibold shadow-xs ${
                    txType === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Lưu vào sổ quỹ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Single Student Contribution */}
      {editingContrib && activeCampaign && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cập Nhật Đóng Quỹ
                </h3>
                <span className="text-[11px] text-teal-700 font-semibold">{editingContrib.studentName} (Tổ {editingContrib.team})</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingContrib(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditContribution} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mức quy định: <strong className="text-teal-800">{activeCampaign.targetAmountPerStudent.toLocaleString('vi-VN')} đ</strong>
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số tiền thực nộp (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  required
                  value={contribPaidAmount}
                  onChange={(e) => setContribPaidAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-bold tabular-nums"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hình thức nộp</label>
                  <select
                    value={contribMethod}
                    onChange={(e) => setContribMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                  >
                    <option value="Tiền mặt">Tiền mặt</option>
                    <option value="Chuyển khoản">Chuyển khoản</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày nộp</label>
                  <input
                    type="date"
                    value={contribDate}
                    onChange={(e) => setContribDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú</label>
                <input
                  type="text"
                  placeholder="VD: Nộp trước 50k, còn thiếu 50k..."
                  value={contribNote}
                  onChange={(e) => setContribNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingContrib(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Lưu cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
