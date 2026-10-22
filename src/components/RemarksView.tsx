import React, { useState } from 'react';
import { 
  MessageSquareQuote, 
  Bell, 
  Plus, 
  Pin, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  Edit, 
  Trash2, 
  Printer, 
  Sparkles,
  HeartHandshake,
  AlertTriangle,
  Award,
  X
} from 'lucide-react';
import { 
  Announcement, 
  StudentRemark, 
  Student, 
  ClassInfo, 
  RemarkCategory 
} from '../types';
import { sound } from '../utils/audio';

interface RemarksViewProps {
  currentClass: ClassInfo;
  students: Student[];
  announcements: Announcement[];
  remarks: StudentRemark[];
  onAddAnnouncement: (ann: Omit<Announcement, 'id' | 'classId'>) => void;
  onUpdateAnnouncement: (id: string, updates: Partial<Announcement>) => void;
  onDeleteAnnouncement: (id: string) => void;
  onAddRemark: (rem: Omit<StudentRemark, 'id' | 'classId'>) => void;
  onUpdateRemark: (id: string, updates: Partial<StudentRemark>) => void;
  onDeleteRemark: (id: string) => void;
}

const REMARK_CATEGORIES: RemarkCategory[] = [
  'Tuyên dương',
  'Tiến bộ',
  'Cần nhắc nhở',
  'Kế hoạch hỗ trợ',
  'Trao đổi phụ huynh'
];

export const RemarksView: React.FC<RemarksViewProps> = ({
  currentClass,
  students,
  announcements,
  remarks,
  onAddAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement,
  onAddRemark,
  onUpdateRemark,
  onDeleteRemark
}) => {
  const classStudents = students.filter(s => s.classId === currentClass.id);
  const classAnnouncements = announcements.filter(a => a.classId === currentClass.id);
  const classRemarks = remarks.filter(r => r.classId === currentClass.id);

  const [activeTab, setActiveTab] = useState<'announcements' | 'remarks'>('announcements');

  // Search & Filter for Remarks
  const [remarkSearch, setRemarkSearch] = useState('');
  const [remarkCategoryFilter, setRemarkCategoryFilter] = useState<string>('all');
  const [remarkStatusFilter, setRemarkStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  // Announcement Modal
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [annPinned, setAnnPinned] = useState(false);
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);

  // Student Remark Modal
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [remarkStudentId, setRemarkStudentId] = useState<string>(classStudents[0]?.id || '');
  const [remarkCategory, setRemarkCategory] = useState<RemarkCategory>('Tuyên dương');
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [supportPlan, setSupportPlan] = useState('');
  const [editingRemarkId, setEditingRemarkId] = useState<string | null>(null);

  // Handlers for Announcements
  const openNewAnnModal = () => {
    setEditingAnnId(null);
    setAnnTitle('');
    setAnnContent('');
    setAnnPriority('normal');
    setAnnPinned(false);
    setShowAnnModal(true);
    sound.playClick();
  };

  const handleSaveAnn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim()) return;

    const todayStr = new Date().toISOString().slice(0, 10);
    if (editingAnnId) {
      onUpdateAnnouncement(editingAnnId, {
        title: annTitle.trim(),
        content: annContent.trim(),
        priority: annPriority,
        isPinned: annPinned
      });
      sound.playSuccess();
    } else {
      onAddAnnouncement({
        title: annTitle.trim(),
        content: annContent.trim(),
        priority: annPriority,
        isPinned: annPinned,
        date: todayStr
      });
      sound.playSuccess();
    }
    setShowAnnModal(false);
  };

  // Handlers for Remarks
  const openNewRemarkModal = () => {
    setEditingRemarkId(null);
    setRemarkStudentId(classStudents[0]?.id || '');
    setRemarkCategory('Tuyên dương');
    setStrengths('');
    setImprovements('');
    setSupportPlan('');
    setShowRemarkModal(true);
    sound.playClick();
  };

  const applyConstructiveTemplate = (type: RemarkCategory) => {
    setRemarkCategory(type);
    if (type === 'Tuyên dương') {
      setStrengths('Tích cực phát biểu xây dựng bài, gương mẫu, hỗ trợ bạn bè nhiệt tình.');
      setImprovements('Duy trì sự tập trung và tiếp tục dẫn dắt phong trào học tập.');
      setSupportPlan('Tạo điều kiện để em tham gia đội tuyển học sinh giỏi hoặc làm nhóm trưởng.');
    } else if (type === 'Tiến bộ') {
      setStrengths('Có sự tiến bộ vượt bậc so với tuần trước, làm bài tập đầy đủ hơn.');
      setImprovements('Cần rèn thêm sự tự tin khi đứng trước lớp trình bày.');
      setSupportPlan('Khen ngợi kịp thời trước lớp để khích lệ tinh thần học tập.');
    } else if (type === 'Cần nhắc nhở') {
      setStrengths('Tiếp thu bài nhanh, tính cách vui vẻ, hòa đồng.');
      setImprovements('Thỉnh thoảng còn nói chuyện riêng trong giờ học, quên dụng cụ.');
      setSupportPlan('Xếp ngồi cùng bạn nghiêm túc, trao đổi nhẹ nhàng sau giờ học.');
    } else if (type === 'Kế hoạch hỗ trợ') {
      setStrengths('Chăm chỉ ghi chép bài, có ý thức kỷ luật tốt.');
      setImprovements('Còn gặp khó khăn ở các bài tập suy luận logic môn KHTN / Toán.');
      setSupportPlan('Phân công học tập theo mô hình Đôi bạn cùng tiến, thầy cô hỗ trợ giải đáp cuối tuần.');
    } else {
      setStrengths('Ngoan ngoãn, lễ phép với thầy cô và thân thiện với bạn.');
      setImprovements('Thời gian gần đây có biểu hiện mệt mỏi vào tiết 1.');
      setSupportPlan('Liên hệ phụ huynh trao đổi về thời gian biểu ngủ nghỉ tại nhà.');
    }
    sound.playClick();
  };

  const handleSaveRemark = (e: React.FormEvent) => {
    e.preventDefault();
    const st = classStudents.find(s => s.id === remarkStudentId);
    if (!st) return;

    const todayStr = new Date().toISOString().slice(0, 10);
    if (editingRemarkId) {
      onUpdateRemark(editingRemarkId, {
        studentId: st.id,
        studentName: st.fullName,
        category: remarkCategory,
        strengths: strengths.trim(),
        improvements: improvements.trim(),
        supportPlan: supportPlan.trim()
      });
      sound.playSuccess();
    } else {
      onAddRemark({
        studentId: st.id,
        studentName: st.fullName,
        date: todayStr,
        category: remarkCategory,
        strengths: strengths.trim(),
        improvements: improvements.trim(),
        supportPlan: supportPlan.trim(),
        isResolved: false
      });
      sound.playSuccess();
    }
    setShowRemarkModal(false);
  };

  // Filtered Remarks
  const filteredRemarks = classRemarks.filter(r => {
    const matchSearch = r.studentName.toLowerCase().includes(remarkSearch.toLowerCase()) ||
      r.strengths.toLowerCase().includes(remarkSearch.toLowerCase()) ||
      r.improvements.toLowerCase().includes(remarkSearch.toLowerCase());
    const matchCategory = remarkCategoryFilter === 'all' || r.category === remarkCategoryFilter;
    const matchStatus = remarkStatusFilter === 'all' || 
      (remarkStatusFilter === 'resolved' ? r.isResolved : !r.isResolved);
    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquareQuote className="w-5 h-5 text-teal-600" />
            Thông Báo & Sổ Nhận Xét Học Sinh
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Đăng thông báo dặn dò cho lớp học và ghi nhật ký sư phạm mang tính xây dựng, đồng hành cùng học sinh
          </p>
        </div>

        {/* Tab Buttons & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('announcements');
                sound.playClick();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'announcements'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              Thông báo ({classAnnouncements.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('remarks');
                sound.playClick();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'remarks'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquareQuote className="w-3.5 h-3.5" />
              Nhận xét cá nhân ({classRemarks.length})
            </button>
          </div>

          {activeTab === 'announcements' ? (
            <button
              type="button"
              onClick={openNewAnnModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tạo thông báo
            </button>
          ) : (
            <button
              type="button"
              onClick={openNewRemarkModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm nhận xét
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors no-print"
            title="In trang này"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab 1: Announcements Content */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {classAnnouncements.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-teal-600" />
              Chưa có thông báo nào trong lớp. Nhấn nút "Tạo thông báo" để bắt đầu dặn dò học sinh.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classAnnouncements
                .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
                .map((ann) => (
                  <div
                    key={ann.id}
                    className={`bg-white border rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between ${
                      ann.isPinned
                        ? 'border-teal-400 ring-1 ring-teal-400/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {ann.isPinned && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                              <Pin className="w-3 h-3 text-teal-600 fill-teal-600" />
                              Ghim đầu bảng
                            </span>
                          )}
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                            ann.priority === 'urgent'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : ann.priority === 'important'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {ann.priority === 'urgent' ? 'Khẩn cấp' : ann.priority === 'important' ? 'Quan trọng' : 'Thông báo'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 tabular-nums">{ann.date}</span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mb-2">
                        {ann.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {ann.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateAnnouncement(ann.id, { isPinned: !ann.isPinned });
                          sound.playClick();
                        }}
                        className={`text-xs font-semibold flex items-center gap-1 ${
                          ann.isPinned ? 'text-teal-700' : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                        {ann.isPinned ? 'Bỏ ghim' : 'Ghim tin'}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAnnId(ann.id);
                            setAnnTitle(ann.title);
                            setAnnContent(ann.content);
                            setAnnPriority(ann.priority);
                            setAnnPinned(ann.isPinned);
                            setShowAnnModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Sửa thông báo"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteAnnouncement(ann.id);
                            sound.playSuccess();
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa thông báo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Student Remarks Content */}
      {activeTab === 'remarks' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên học sinh hoặc từ khóa..."
                value={remarkSearch}
                onChange={(e) => setRemarkSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-teal-500 outline-hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <span className="text-slate-400 font-medium">Phân loại:</span>
                <select
                  value={remarkCategoryFilter}
                  onChange={(e) => setRemarkCategoryFilter(e.target.value)}
                  className="bg-transparent font-semibold text-slate-700 outline-hidden cursor-pointer"
                >
                  <option value="all">Tất cả danh mục</option>
                  {REMARK_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <span className="text-slate-400 font-medium">Tiến độ:</span>
                <select
                  value={remarkStatusFilter}
                  onChange={(e) => setRemarkStatusFilter(e.target.value as any)}
                  className="bg-transparent font-semibold text-slate-700 outline-hidden cursor-pointer"
                >
                  <option value="all">Tất cả</option>
                  <option value="pending">Đang theo dõi</option>
                  <option value="resolved">Đã cải thiện / Hoàn tất</option>
                </select>
              </div>
            </div>
          </div>

          {/* Remarks List */}
          {filteredRemarks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
              <MessageSquareQuote className="w-8 h-8 mx-auto mb-2 opacity-30 text-teal-600" />
              Không có nhận xét nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRemarks.map((rem) => (
                <div
                  key={rem.id}
                  className={`bg-white border rounded-2xl p-5 shadow-xs transition-all ${
                    rem.isResolved ? 'border-slate-200 bg-slate-50/50' : 'border-slate-200 hover:border-teal-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{rem.studentName}</span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        rem.category === 'Tuyên dương'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : rem.category === 'Tiến bộ'
                          ? 'bg-teal-50 text-teal-800 border border-teal-200'
                          : rem.category === 'Cần nhắc nhở'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-purple-50 text-purple-800 border border-purple-200'
                      }`}>
                        {rem.category}
                      </span>
                      {rem.isResolved && (
                        <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Đã cải thiện
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 tabular-nums">{rem.date}</span>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateRemark(rem.id, { isResolved: !rem.isResolved });
                          sound.playClick();
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          rem.isResolved
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {rem.isResolved ? 'Đánh dấu cần theo dõi lại' : 'Đánh dấu hoàn thành'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteRemark(rem.id);
                          sound.playSuccess();
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Xóa nhận xét"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 text-xs">
                    <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/60">
                      <div className="font-semibold text-emerald-900 mb-1 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                        Điểm mạnh & Ghi nhận:
                      </div>
                      <p className="text-slate-700 leading-relaxed">{rem.strengths || '—'}</p>
                    </div>

                    <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-100/60">
                      <div className="font-semibold text-amber-900 mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Điểm cần lưu ý / Cải thiện:
                      </div>
                      <p className="text-slate-700 leading-relaxed">{rem.improvements || '—'}</p>
                    </div>

                    <div className="bg-sky-50/40 p-3 rounded-xl border border-sky-100/60">
                      <div className="font-semibold text-sky-900 mb-1 flex items-center gap-1">
                        <HeartHandshake className="w-3.5 h-3.5 text-sky-600" />
                        Kế hoạch đồng hành & Hỗ trợ:
                      </div>
                      <p className="text-slate-700 leading-relaxed">{rem.supportPlan || '—'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: New Announcement */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-teal-600" />
                {editingAnnId ? 'Sửa thông báo lớp' : 'Tạo thông báo mới cho lớp'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAnnModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAnn} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tiêu đề thông báo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nhắc nhở nộp bài tập ôn tập tuần 8..."
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mức độ ưu tiên</label>
                  <select
                    value={annPriority}
                    onChange={(e) => setAnnPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden"
                  >
                    <option value="normal">Bình thường</option>
                    <option value="important">Quan trọng</option>
                    <option value="urgent">Khẩn cấp</option>
                  </select>
                </div>
                <div className="flex items-center mt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={annPinned}
                      onChange={(e) => setAnnPinned(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Ghim lên đầu bảng</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nội dung dặn dò chi tiết
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Ghi rõ nội dung, thời hạn và phân công..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAnnModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Đăng thông báo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Student Remark with Constructive Templates */}
      {showRemarkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquareQuote className="w-4 h-4 text-teal-600" />
                Ghi Nhận Xét & Kế Hoạch Hỗ Trợ Học Sinh
              </h3>
              <button
                type="button"
                onClick={() => setShowRemarkModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRemark} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Chọn học sinh <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={remarkStudentId}
                    onChange={(e) => setRemarkStudentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-semibold"
                  >
                    {classStudents.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.fullName} (Tổ {s.team})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phân loại nhận xét
                  </label>
                  <select
                    value={remarkCategory}
                    onChange={(e) => setRemarkCategory(e.target.value as RemarkCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-semibold"
                  >
                    {REMARK_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Template Buttons for Teachers */}
              <div>
                <span className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Mẫu gợi ý nhận xét sư phạm xây dựng (Nhấn để điền nhanh):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {REMARK_CATEGORIES.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => applyConstructiveTemplate(c)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 rounded-lg text-[11px] font-medium text-slate-700 transition-colors"
                    >
                      Mẫu: {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  1. Điểm mạnh / Tiến bộ đã đạt được
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="VD: Em phát biểu tự tin, bài làm sáng tạo, cẩn thận..."
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  2. Điểm cần khắc phục / Cải thiện
                </label>
                <textarea
                  rows={2}
                  placeholder="VD: Cần lưu ý việc ghi bài đầy đủ hơn trong các tiết..."
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  3. Kế hoạch hỗ trợ của giáo viên & tập thể lớp
                </label>
                <textarea
                  rows={2}
                  placeholder="VD: Ghép đôi bạn cùng tiến, kiểm tra tiến độ hàng tuần..."
                  value={supportPlan}
                  onChange={(e) => setSupportPlan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRemarkModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Lưu nhận xét
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
