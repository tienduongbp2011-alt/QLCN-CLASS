import React, { useState } from 'react';
import { 
  Grid3X3, 
  Plus, 
  Minus, 
  Save, 
  Printer, 
  Search, 
  UserMinus, 
  ArrowRightLeft, 
  Sparkles,
  Check,
  RotateCcw
} from 'lucide-react';
import { Student, SeatingChartConfig, SeatPosition, ClassInfo } from '../types';
import { sound } from '../utils/audio';

interface SeatingPlanProps {
  currentClass: ClassInfo;
  students: Student[];
  config: SeatingChartConfig;
  onSaveConfig: (cfg: SeatingChartConfig) => void;
}

export const SeatingPlan: React.FC<SeatingPlanProps> = ({
  currentClass,
  students,
  config,
  onSaveConfig
}) => {
  const classStudents = students.filter(s => s.classId === currentClass.id);

  // Local working seating state
  const [rows, setRows] = useState(config.rows || 4);
  const [cols, setCols] = useState(config.cols || 4);
  const [seats, setSeats] = useState<SeatPosition[]>(config.seats || []);
  const [selectedSeat, setSelectedSeat] = useState<{ row: number; col: number } | null>(null);
  const [searchHighlight, setSearchHighlight] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Helper to get student at row, col
  const getSeat = (r: number, c: number): SeatPosition => {
    const found = seats.find(s => s.row === r && s.col === c);
    return found || { row: r, col: c, studentId: null };
  };

  // Click on a seat
  const handleSeatClick = (r: number, c: number) => {
    if (!selectedSeat) {
      // First click: select this seat
      setSelectedSeat({ row: r, col: c });
      sound.playClick();
    } else {
      // Second click: swap seat contents!
      if (selectedSeat.row === r && selectedSeat.col === c) {
        // Deselect
        setSelectedSeat(null);
        return;
      }

      const seatA = getSeat(selectedSeat.row, selectedSeat.col);
      const seatB = getSeat(r, c);

      // Perform swap
      setSeats(prev => {
        const copy = prev.filter(s => !(s.row === seatA.row && s.col === seatA.col) && !(s.row === seatB.row && s.col === seatB.col));
        copy.push({ row: seatA.row, col: seatA.col, studentId: seatB.studentId });
        copy.push({ row: seatB.row, col: seatB.col, studentId: seatA.studentId });
        return copy;
      });

      setSelectedSeat(null);
      sound.playSuccess();
    }
  };

  // Clear a seat
  const handleClearSeat = (r: number, c: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSeats(prev => {
      const copy = prev.filter(s => !(s.row === r && s.col === c));
      copy.push({ row: r, col: c, studentId: null });
      return copy;
    });
    sound.playClick();
  };

  // Adjust rows
  const changeRows = (delta: number) => {
    const newRows = Math.max(2, Math.min(8, rows + delta));
    setRows(newRows);
    sound.playClick();
  };

  // Adjust cols
  const changeCols = (delta: number) => {
    const newCols = Math.max(2, Math.min(8, cols + delta));
    setCols(newCols);
    sound.playClick();
  };

  // Save current seating config
  const handleSave = () => {
    onSaveConfig({
      classId: currentClass.id,
      rows,
      cols,
      seats
    });
    setSaveSuccess(true);
    sound.playSuccess();
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Auto layout sequential
  const handleAutoAssign = () => {
    if (confirm('Bạn có muốn tự động xếp chỗ lần lượt theo danh sách học sinh vào sơ đồ này?')) {
      const newSeats: SeatPosition[] = [];
      let studentIdx = 0;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (studentIdx < classStudents.length) {
            newSeats.push({ row: r, col: c, studentId: classStudents[studentIdx].id });
            studentIdx++;
          } else {
            newSeats.push({ row: r, col: c, studentId: null });
          }
        }
      }
      setSeats(newSeats);
      sound.playFanfare();
    }
  };

  // Assigned student IDs
  const assignedStudentIds = new Set(seats.map(s => s.studentId).filter(Boolean));
  const unplacedStudents = classStudents.filter(s => !assignedStudentIds.has(s.id));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-teal-600" />
            Sơ Đồ Chỗ Ngồi Lớp Học
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Thiết kế ma trận bàn học trực quan, chạm để đổi chỗ 2 học sinh, in ấn sơ đồ cho cán sự lớp
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Row / Col controls */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-500 font-medium">Hàng: {rows}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => changeRows(-1)}
                className="w-5 h-5 rounded bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => changeRows(1)}
                className="w-5 h-5 rounded bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold"
              >
                +
              </button>
            </div>

            <span className="text-slate-300">|</span>

            <span className="text-slate-500 font-medium">Cột: {cols}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => changeCols(-1)}
                className="w-5 h-5 rounded bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => changeCols(1)}
                className="w-5 h-5 rounded bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold"
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAutoAssign}
            className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            title="Xếp lần lượt học sinh vào chỗ còn trống"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Tự động điền
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            Lưu sơ đồ
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors no-print"
            title="In sơ đồ lớp"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600" />
          Đã lưu sơ đồ chỗ ngồi thành công!
        </div>
      )}

      {/* Guide & Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-teal-50 text-teal-700 font-bold">Mẹo:</span>
          <span className="text-slate-600">
            Chạm vào bàn học thứ nhất, sau đó chạm vào bàn học thứ hai để <strong>hoán đổi vị trí</strong> (áp dụng cả cảm ứng và chuột).
          </span>
        </div>

        {/* Quick Search to highlight student */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm vị trí học sinh..."
            value={searchHighlight}
            onChange={(e) => setSearchHighlight(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-teal-500 outline-hidden"
          />
        </div>
      </div>

      {/* Classroom Canvas Representation */}
      <div className="bg-slate-100/80 border border-slate-300 rounded-2xl p-6 shadow-inner space-y-6 overflow-x-auto">
        {/* Front of Classroom: Blackboard & Teacher Desk */}
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Blackboard */}
          <div className="w-full bg-slate-800 text-white rounded-xl py-2 px-4 text-center font-bold text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 border-2 border-slate-700">
            <span>BẢNG LỚP HỌC (HƯỚNG NHÌN LÊN BỤC GIẢNG)</span>
          </div>

          {/* Teacher Desk & Podium */}
          <div className="flex items-center justify-center gap-6">
            <div className="bg-amber-100 border-2 border-amber-300 text-amber-900 rounded-xl px-6 py-2 text-xs font-bold shadow-xs">
              BÀN GIÁO VIÊN
            </div>
            <div className="bg-slate-200 border border-slate-300 text-slate-600 rounded-xl px-4 py-1.5 text-[11px] font-semibold">
              Cửa ra vào
            </div>
          </div>
        </div>

        {/* Seating Grid */}
        <div 
          className="grid gap-3 justify-center min-w-fit mx-auto p-4"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(130px, 1fr))` }}
        >
          {Array.from({ length: rows }).map((_, r) => (
            Array.from({ length: cols }).map((_, c) => {
              const seat = getSeat(r, c);
              const student = classStudents.find(s => s.id === seat.studentId);
              const isSelected = selectedSeat?.row === r && selectedSeat?.col === c;
              const isHighlighted = searchHighlight.trim() && student && (
                student.fullName.toLowerCase().includes(searchHighlight.toLowerCase()) ||
                student.code.toLowerCase().includes(searchHighlight.toLowerCase())
              );

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleSeatClick(r, c)}
                  className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer min-h-[92px] flex flex-col justify-between ${
                    isSelected
                      ? 'bg-teal-100 border-teal-600 ring-2 ring-teal-500 shadow-md scale-102'
                      : isHighlighted
                      ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-400 shadow-sm animate-pulse'
                      : student
                      ? 'bg-white border-slate-200 hover:border-teal-400 hover:shadow-sm'
                      : 'bg-slate-50/60 border-dashed border-slate-300 hover:bg-white text-slate-400'
                  }`}
                >
                  {/* Seat coordinates & clear button */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-slate-100">
                    <span className="font-mono">H{r + 1} - C{c + 1}</span>
                    {student && (
                      <button
                        type="button"
                        onClick={(e) => handleClearSeat(r, c, e)}
                        className="text-slate-300 hover:text-rose-500 p-0.5"
                        title="Xóa học sinh khỏi vị trí này"
                      >
                        <UserMinus className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Seat Content */}
                  {student ? (
                    <div className="pt-1.5">
                      <div className="font-bold text-xs text-slate-900 truncate">
                        {student.fullName}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                        <span className="font-mono">{student.code}</span>
                        <span className="bg-teal-50 text-teal-800 px-1 py-0.2 rounded font-medium">
                          Tổ {student.team}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2 text-[11px] italic">
                      Bàn trống
                    </div>
                  )}

                  {/* Swap hint indicator */}
                  {isSelected && (
                    <div className="text-[10px] font-bold text-teal-700 text-center mt-1">
                      Đang chọn để đổi
                    </div>
                  )}
                </div>
              );
            })
          ))}
        </div>
      </div>

      {/* Unplaced Students List */}
      {unplacedStudents.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <h4 className="text-xs font-bold text-slate-800 mb-2">
            Học sinh chưa xếp chỗ ({unplacedStudents.length} em):
          </h4>
          <div className="flex flex-wrap gap-2 text-xs">
            {unplacedStudents.map(st => (
              <span 
                key={st.id} 
                className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-medium"
              >
                {st.fullName} ({st.code} - Tổ {st.team})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
