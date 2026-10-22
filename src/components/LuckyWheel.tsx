import React, { useState, useRef, useEffect } from 'react';
import { 
  Disc, 
  RotateCcw, 
  UserCheck, 
  Award, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Users, 
  Gift, 
  Network 
} from 'lucide-react';
import { Student, RewardItem, WheelHistory, ClassInfo } from '../types';
import { sound } from '../utils/audio';

interface LuckyWheelProps {
  currentClass: ClassInfo;
  students: Student[];
  rewards: RewardItem[];
  history: WheelHistory[];
  onAddHistory: (record: Omit<WheelHistory, 'id'>) => void;
  onClearHistory: () => void;
  soundEnabled: boolean;
}

const COLORS = [
  '#0d9488', // Teal
  '#0284c7', // Sky
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#14b8a6', // Cyan
  '#ef4444', // Red
  '#06b6d4', // Teal light
  '#84cc16'  // Lime
];

export const LuckyWheel: React.FC<LuckyWheelProps> = ({
  currentClass,
  students,
  rewards,
  history,
  onAddHistory,
  onClearHistory,
  soundEnabled
}) => {
  const classStudents = students.filter(s => s.classId === currentClass.id);
  const classHistory = history.filter(h => h.classId === currentClass.id);

  const [mode, setMode] = useState<'students' | 'teams' | 'rewards'>('students');

  // Candidate pool with elimination capability
  const [activeCandidates, setActiveCandidates] = useState<string[]>([]);
  const [eliminatedCandidates, setEliminatedCandidates] = useState<string[]>([]);

  // Wheel animation states
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);

  // Sound ticking timer ref
  const tickIntervalRef = useRef<number | null>(null);

  // Initialize candidates when mode or students/rewards change
  useEffect(() => {
    resetCandidates();
  }, [mode, classStudents, rewards]);

  const resetCandidates = () => {
    let list: string[] = [];
    if (mode === 'students') {
      list = classStudents.map(s => s.fullName);
    } else if (mode === 'teams') {
      list = ['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'];
    } else {
      list = rewards.filter(r => r.stock > 0).map(r => r.name);
    }
    setActiveCandidates(list);
    setEliminatedCandidates([]);
    setWinner(null);
  };

  const spinWheel = () => {
    if (isSpinning || activeCandidates.length < 2) return;

    sound.playClick();
    setIsSpinning(true);
    setWinner(null);

    // Audio tick simulation during spin
    if (soundEnabled) {
      let tickCount = 0;
      const maxTicks = 45;
      const interval = window.setInterval(() => {
        sound.playWheelTick();
        tickCount++;
        if (tickCount >= maxTicks) {
          clearInterval(interval);
        }
      }, 90);
      tickIntervalRef.current = interval;
    }

    // Pick random index
    const totalItems = activeCandidates.length;
    const winningIndex = Math.floor(Math.random() * totalItems);

    // Calculate rotation angle
    const segmentAngle = 360 / totalItems;
    // We want the chosen segment to land under the top pointer (at 270 deg or 90 deg depending on pointer position)
    // Pointer is at the top (angle 270 or 0 from top)
    const extraSpins = 5 + Math.floor(Math.random() * 3); // 5 to 7 full circles
    // Calculate final angle
    const stopAngle = extraSpins * 360 + (360 - (winningIndex * segmentAngle + segmentAngle / 2));
    const finalRotation = currentRotation + stopAngle;

    setCurrentRotation(finalRotation);

    // Wait for css transition to finish (4 seconds)
    setTimeout(() => {
      setIsSpinning(false);
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);

      const winningCandidate = activeCandidates[winningIndex];
      setWinner(winningCandidate);
      sound.playFanfare();

      onAddHistory({
        classId: currentClass.id,
        type: mode,
        winner: winningCandidate,
        timestamp: Date.now()
      });
    }, 4200);
  };

  // Eliminate winner
  const handleEliminateWinner = () => {
    if (!winner) return;
    setEliminatedCandidates(prev => [...prev, winner]);
    setActiveCandidates(prev => prev.filter(c => c !== winner));
    setWinner(null);
    sound.playClick();
  };

  const totalSegments = activeCandidates.length;
  const segmentAngle = totalSegments > 0 ? 360 / totalSegments : 360;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Disc className="w-5 h-5 text-teal-600" />
            Vòng Quay May Mắn (Lucky Wheel)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tạo không khí sôi nổi trong giờ học: gọi tên phát biểu ngẫu nhiên, quay thưởng, bốc thăm tổ nhật ký
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('students');
                sound.playClick();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                mode === 'students' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Học sinh ({classStudents.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('teams');
                sound.playClick();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                mode === 'teams' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              Tổ học sinh (4 tổ)
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('rewards');
                sound.playClick();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                mode === 'rewards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              Phần thưởng
            </button>
          </div>

          <button
            type="button"
            onClick={resetCandidates}
            className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            title="Khôi phục đầy đủ danh sách ban đầu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Khôi phục
          </button>
        </div>
      </div>

      {/* Main Wheel Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Wheel SVG Viewport */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col items-center justify-center relative overflow-hidden">
          {/* Winner Celebration Banner */}
          {winner && (
            <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3 animate-bounce">
                <Sparkles className="w-8 h-8" />
              </div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">
                Chúc mừng người may mắn!
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
                {winner}
              </h3>
              <p className="text-xs text-slate-500 mb-6 max-w-sm">
                Đã trúng lượt quay may mắn trong hoạt động của lớp {currentClass.name}!
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleEliminateWinner}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Loại khỏi lượt quay tiếp theo
                </button>
                <button
                  type="button"
                  onClick={() => setWinner(null)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Giữ lại & Quay tiếp
                </button>
              </div>
            </div>
          )}

          {/* Pointer indicator at Top */}
          <div className="relative mb-[-12px] z-20">
            <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-rose-600 filter drop-shadow-md" />
          </div>

          {/* The Spinning Wheel */}
          <div className="relative w-72 h-72 sm:w-88 sm:h-88 flex items-center justify-center">
            {activeCandidates.length < 2 ? (
              <div className="text-center text-xs text-slate-400 p-6">
                Cần ít nhất 2 ứng viên để quay. Nhấn nút "Khôi phục" để tải lại danh sách.
              </div>
            ) : (
              <svg
                viewBox="0 0 300 300"
                className="w-full h-full drop-shadow-xl"
                style={{
                  transform: `rotate(${currentRotation}deg)`,
                  transition: isSpinning ? 'transform 4s cubic-bezier(0.12, 0.8, 0.15, 1)' : 'none',
                }}
              >
                {activeCandidates.map((candidate, idx) => {
                  const startAngle = idx * segmentAngle;
                  const endAngle = (idx + 1) * segmentAngle;
                  const startRad = (startAngle - 90) * (Math.PI / 180);
                  const endRad = (endAngle - 90) * (Math.PI / 180);

                  const x1 = 150 + 140 * Math.cos(startRad);
                  const y1 = 150 + 140 * Math.sin(startRad);
                  const x2 = 150 + 140 * Math.cos(endRad);
                  const y2 = 150 + 140 * Math.sin(endRad);

                  const largeArc = segmentAngle > 180 ? 1 : 0;
                  const pathData = `M 150 150 L ${x1} ${y1} A 140 140 0 ${largeArc} 1 ${x2} ${y2} Z`;

                  // Text rotation angle
                  const textAngle = startAngle + segmentAngle / 2;
                  const color = COLORS[idx % COLORS.length];

                  return (
                    <g key={idx}>
                      <path d={pathData} fill={color} stroke="#ffffff" strokeWidth="2" />
                      <text
                        x="150"
                        y="150"
                        fill="#ffffff"
                        fontSize={totalSegments > 16 ? '8' : totalSegments > 10 ? '9' : '11'}
                        fontWeight="700"
                        textAnchor="end"
                        transform={`rotate(${textAngle}, 150, 150) translate(130, 4)`}
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {candidate.length > 14 ? candidate.slice(0, 12) + '..' : candidate}
                      </text>
                    </g>
                  );
                })}

                {/* Outer Ring */}
                <circle cx="150" cy="150" r="140" fill="none" stroke="#ffffff" strokeWidth="4" />
                {/* Center Hub */}
                <circle cx="150" cy="150" r="24" fill="#0f172a" stroke="#ffffff" strokeWidth="4" />
                <circle cx="150" cy="150" r="8" fill="#14b8a6" />
              </svg>
            )}
          </div>

          {/* Spin Trigger Button */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <button
              type="button"
              disabled={isSpinning || activeCandidates.length < 2}
              onClick={spinWheel}
              className={`px-8 py-3.5 rounded-2xl text-sm font-extrabold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 ${
                isSpinning
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed scale-98'
                  : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white hover:scale-103'
              }`}
            >
              <Disc className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
              {isSpinning ? 'Đang quay...' : 'BẮT ĐẦU QUAY!'}
            </button>
            <span className="text-[11px] text-slate-400">
              Đang có <strong className="text-slate-700 tabular-nums">{activeCandidates.length}</strong> ứng viên trong vòng quay
            </span>
          </div>
        </div>

        {/* Side Panel: Active List & Spin History */}
        <div className="space-y-4">
          {/* Active candidates list preview */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">
                Danh sách ứng viên ({activeCandidates.length})
              </span>
              {eliminatedCandidates.length > 0 && (
                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                  Đã loại {eliminatedCandidates.length} em
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1 text-xs">
              {activeCandidates.map((c, i) => (
                <span 
                  key={i}
                  className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 text-[11px] font-medium"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* History */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">
                Lịch sử trúng thưởng ({classHistory.length})
              </span>
              {classHistory.length > 0 && (
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="text-[11px] text-slate-400 hover:text-rose-600"
                >
                  Xóa lịch sử
                </button>
              )}
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar pr-1 text-xs">
              {classHistory.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Chưa có lượt quay nào.
                </div>
              ) : (
                [...classHistory].reverse().map(h => (
                  <div key={h.id} className="p-2 rounded-xl bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">{h.winner}</span>
                      <span className="text-[10px] text-slate-400">
                        {h.type === 'students' ? 'Học sinh' : h.type === 'teams' ? 'Tổ' : 'Phần thưởng'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 tabular-nums">
                      {new Date(h.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
