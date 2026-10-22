import React, { useState } from 'react';
import { 
  Gift, 
  Coins, 
  Plus, 
  Trash2, 
  RotateCcw, 
  CheckCircle, 
  Sparkles, 
  AlertCircle, 
  ShoppingBag,
  Award,
  BookOpen,
  PenTool,
  Star,
  Compass,
  X
} from 'lucide-react';
import { RewardItem, RewardRedemption, Student, ClassInfo } from '../types';
import { sound } from '../utils/audio';

interface RewardStoreProps {
  currentClass: ClassInfo;
  students: Student[];
  rewards: RewardItem[];
  redemptions: RewardRedemption[];
  onAddReward: (item: Omit<RewardItem, 'id'>) => void;
  onDeleteReward: (id: string) => void;
  onRedeemReward: (redemption: Omit<RewardRedemption, 'id'>) => void;
  onCancelRedemption: (id: string) => void;
}

export const RewardStore: React.FC<RewardStoreProps> = ({
  currentClass,
  students,
  rewards,
  redemptions,
  onAddReward,
  onDeleteReward,
  onRedeemReward,
  onCancelRedemption
}) => {
  const classStudents = students.filter(s => s.classId === currentClass.id);
  const classRedemptions = redemptions.filter(r => r.classId === currentClass.id);

  const [activeTab, setActiveTab] = useState<'catalog' | 'history'>('catalog');

  // Redeem modal state
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(classStudents[0]?.id || '');
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);

  // New Reward Modal
  const [showAddRewardModal, setShowAddRewardModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCost, setNewCost] = useState(20);
  const [newStock, setNewStock] = useState(10);

  // Confirm redemption
  const handleConfirmRedeem = () => {
    if (!selectedReward) return;

    const student = classStudents.find(s => s.id === selectedStudentId);
    if (!student) return;

    if (student.coins < selectedReward.coinCost) {
      alert(`Học sinh ${student.fullName} không đủ xu! Hiện có ${student.coins} xu, phần thưởng cần ${selectedReward.coinCost} xu.`);
      return;
    }

    if (selectedReward.stock <= 0) {
      alert('Phần thưởng này đã hết số lượng trong kho!');
      return;
    }

    onRedeemReward({
      classId: currentClass.id,
      studentId: student.id,
      studentName: student.fullName,
      rewardId: selectedReward.id,
      rewardName: selectedReward.name,
      coinsSpent: selectedReward.coinCost,
      date: new Date().toISOString().slice(0, 10),
      timestamp: Date.now(),
      status: 'completed'
    });

    sound.playCoin();
    setRedeemSuccess(`Đã đổi thành công "${selectedReward.name}" cho em ${student.fullName}!`);
    setSelectedReward(null);
    setTimeout(() => setRedeemSuccess(null), 3500);
  };

  // Add new reward item
  const handleSaveReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddReward({
      name: newName.trim(),
      description: newDesc.trim(),
      coinCost: Math.max(1, newCost),
      stock: Math.max(0, newStock),
      icon: 'sparkles'
    });

    sound.playSuccess();
    setShowAddRewardModal(false);
    setNewName('');
    setNewDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Gift className="w-5 h-5 text-teal-600" />
            Cửa Hàng Đổi Quà Thi Đua Lớp Học
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quy đổi điểm xu thi đua lấy dụng cụ học tập, huy hiệu và các thẻ đặc quyền khích lệ học sinh
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('catalog');
                sound.playClick();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'catalog' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Gian hàng ({rewards.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('history');
                sound.playClick();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'history' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Lịch sử đổi quà ({classRedemptions.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowAddRewardModal(true);
              sound.playClick();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm phần thưởng
          </button>
        </div>
      </div>

      {redeemSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {redeemSuccess}
        </div>
      )}

      {/* TAB 1: CATALOG */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map(item => (
            <div 
              key={item.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-teal-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 font-extrabold px-2.5 py-1 rounded-xl text-xs border border-amber-200 tabular-nums">
                      <Coins className="w-3.5 h-3.5 text-amber-600" />
                      {item.coinCost} xu
                    </div>
                    <span className="block text-[11px] text-slate-400 mt-1">
                      Còn lại: <strong className="text-slate-700 tabular-nums">{item.stock}</strong> món
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {item.description || 'Phần thưởng động viên học sinh tích cực.'}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={item.stock <= 0}
                  onClick={() => {
                    setSelectedReward(item);
                    sound.playClick();
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                    item.stock > 0
                      ? 'bg-teal-600 hover:bg-teal-700 text-white'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {item.stock > 0 ? 'Đổi quà cho học sinh' : 'Đã hết quà'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Xóa phần thưởng "${item.name}"?`)) {
                      onDeleteReward(item.id);
                      sound.playClick();
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl transition-colors"
                  title="Xóa phần thưởng này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: REDEMPTION HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Nhật ký giao dịch đổi quà ({classRedemptions.length} lượt)
            </span>
            <span className="text-[11px] text-slate-400">
              Có thể hoàn tác giao dịch để trả lại xu và hoàn kho phần thưởng
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {classRedemptions.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Chưa có giao dịch đổi quà nào.
              </div>
            ) : (
              [...classRedemptions].reverse().map(red => (
                <div 
                  key={red.id}
                  className="p-3.5 px-5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {red.studentName} · <span className="font-medium text-teal-700">{red.rewardName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Ngày đổi: {red.date} · Đã trừ: <strong className="text-amber-700 tabular-nums">-{red.coinsSpent} xu</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {red.status === 'completed' ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hoàn tác đổi quà cho ${red.studentName}? Xu (${red.coinsSpent} xu) sẽ được hoàn trả vào tài khoản học sinh và số lượng quà sẽ được cộng lại vào kho.`)) {
                            onCancelRedemption(red.id);
                            sound.playSuccess();
                          }
                        }}
                        className="px-2.5 py-1 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg font-medium transition-colors flex items-center gap-1"
                        title="Hoàn tác giao dịch này"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Hoàn tác
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Đã hủy</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Redeem Modal */}
      {selectedReward && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Gift className="w-4 h-4 text-teal-600" />
                Xác nhận đổi quà
              </h3>
              <button
                type="button"
                onClick={() => setSelectedReward(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-3.5 mb-4">
              <div className="font-bold text-sm text-teal-900">{selectedReward.name}</div>
              <div className="flex items-center justify-between text-xs text-teal-800 mt-1">
                <span>Giá đổi: <strong>{selectedReward.coinCost} xu</strong></span>
                <span>Trong kho: <strong>{selectedReward.stock} món</strong></span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chọn học sinh đổi quà <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-semibold"
                >
                  {classStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.code} - Hiện có: {s.coins} xu)
                    </option>
                  ))}
                </select>
              </div>

              {/* Balance preview */}
              {(() => {
                const curSt = classStudents.find(s => s.id === selectedStudentId);
                const afterBalance = (curSt?.coins || 0) - selectedReward.coinCost;
                const isInsufficient = afterBalance < 0;

                return (
                  <div className={`p-3 rounded-xl border text-xs ${
                    isInsufficient 
                      ? 'bg-rose-50 border-rose-200 text-rose-800' 
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <div className="flex justify-between py-0.5">
                      <span>Số xu hiện tại của em:</span>
                      <strong className="tabular-nums">{curSt?.coins || 0} xu</strong>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span>Xu cần trừ:</span>
                      <strong className="text-amber-700 tabular-nums">-{selectedReward.coinCost} xu</strong>
                    </div>
                    <div className="flex justify-between py-0.5 border-t border-slate-200/60 mt-1 pt-1 font-bold">
                      <span>Số dư sau khi đổi:</span>
                      <span className={isInsufficient ? 'text-rose-600' : 'text-teal-700'}>
                        {afterBalance} xu {isInsufficient && '(Không đủ xu)'}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setSelectedReward(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmRedeem}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-xs"
              >
                Xác nhận trừ xu & Đổi quà
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Reward Modal */}
      {showAddRewardModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Gift className="w-4 h-4 text-teal-600" />
                Thêm phần thưởng mới vào kho
              </h3>
              <button
                type="button"
                onClick={() => setShowAddRewardModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReward} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên phần thưởng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Bộ bút chì 2B Deli..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả quà tặng</label>
                <textarea
                  rows={2}
                  placeholder="VD: Hộp 12 cây, nét viết êm, phù hợp môn Mỹ thuật..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Giá xu quy đổi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCost}
                    onChange={(e) => setNewCost(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-bold tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số lượng trong kho <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-teal-500 outline-hidden font-bold tabular-nums"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRewardModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Thêm vào kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
