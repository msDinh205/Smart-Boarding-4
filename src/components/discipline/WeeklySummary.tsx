import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, AlertCircle, Sparkles, Award, BookOpen, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { generateWeeklyReport } from '../../utils/docxExport';

interface WeeklySummaryProps {
  className: string;
  dailyScores: {
    friday: number;
    saturday: number;
    sunday: number;
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
  };
  goodGradesCount: number;
  setGoodGradesCount: (val: number) => void;
  journalScore: number;
  setJournalScore: (val: number) => void;
  weeklyViolations: string[];
  dormRooms: { id: number; score: number; image: string | null; notes: string }[];
  onSave?: (data: any) => void;
  saving?: boolean;
}

export const WeeklySummary: React.FC<WeeklySummaryProps> = ({
  className,
  dailyScores,
  goodGradesCount,
  setGoodGradesCount,
  journalScore,
  setJournalScore,
  weeklyViolations,
  dormRooms,
  onSave,
  saving
}) => {
  const weekdayScores = [
    dailyScores.friday,
    dailyScores.monday,
    dailyScores.tuesday,
    dailyScores.wednesday,
    dailyScores.thursday
  ];
  const weekdayAvg = weekdayScores.reduce((a, b) => a + b, 0) / 5;
  const diemNeNep = weekdayAvg;
  const diemThu7 = dailyScores.saturday < 10 ? 2 : 0;
  const diemChuNhat = dailyScores.sunday < 10 ? 2 : 0;
  
  let bonusPoints = 0;
  if (goodGradesCount > 0) {
    if (goodGradesCount <= 5) bonusPoints = 2;
    else if (goodGradesCount <= 10) bonusPoints = 4;
    else if (goodGradesCount <= 15) bonusPoints = 6;
    else if (goodGradesCount <= 20) bonusPoints = 8;
    else bonusPoints = 10;
  }

  const classAvg = (0.45 * diemNeNep) + (0.45 * journalScore) + (0.1 * bonusPoints) - (diemThu7 + diemChuNhat);
  const finalClassAvg = Math.max(0, classAvg);

  const handleExport = () => {
    generateWeeklyReport({
      className,
      dailyScores,
      totalScore: finalClassAvg.toLocaleString('vi-VN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
      weekdayAvg: weekdayAvg.toLocaleString('vi-VN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
      journalScore,
      goodGradesCount,
      bonusPoints,
      violations: weeklyViolations
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-primary/5 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-2xl font-black text-primary">Tổng kết tuần thi đua</h2>
            <p className="text-sm text-primary/40 font-medium">Lớp {className} • Tuần từ Thứ 6 đến Thứ 5</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleExport}
              className="px-6 py-4 bg-white text-primary border border-primary/10 rounded-2xl font-bold flex items-center gap-2 hover:bg-primary/5 transition-all"
            >
              <FileText size={18} />
              <span>Xuất (DOCX)</span>
            </button>
            <button 
              onClick={() => onSave?.({
                className,
                weekdayAvg,
                dormAvg: dormRooms.reduce((a, r) => a + r.score, 0) / dormRooms.length,
                journalScore,
                goodGradesCount,
                bonusPoints,
                totalScore: finalClassAvg,
                violations: weeklyViolations
              })}
              disabled={saving}
              className="px-6 py-4 bg-primary text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 disabled:opacity-50"
            >
              {saving ? <Sparkles className="animate-spin" size={18} /> : <Award size={18} />}
              <span>{saving ? "Đang lưu..." : "Lưu dữ liệu Tuần"}</span>
            </button>
            <div className="p-4 bg-accent/5 rounded-2xl text-right">
              <span className="text-[10px] font-bold text-accent uppercase tracking-widest block mb-1">TB Nề nếp</span>
              <span className="text-2xl font-black text-accent">
                {weekdayAvg.toLocaleString('vi-VN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}đ
              </span>
            </div>
            <div className="p-4 bg-primary/5 rounded-2xl text-right border border-primary/10">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-1">Điểm TB Lớp</span>
              <span className="text-3xl font-black text-primary">
                {finalClassAvg.toLocaleString('vi-VN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}đ
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-primary/5 p-6 rounded-2xl border border-primary/10">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-primary/60 uppercase tracking-wider flex items-center gap-2">
              <BookOpen size={12} className="text-accent" />
              Điểm Sổ đầu bài (Tuần)
            </label>
            <input 
              type="number" step="0.1" min="0" max="10"
              className="w-full p-3 rounded-xl border-2 border-primary/10 bg-white text-sm font-bold"
              value={journalScore}
              onChange={(e) => setJournalScore(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-primary/60 uppercase tracking-wider flex items-center gap-2">
              <Award size={12} className="text-accent" />
              Số điểm 9, 10 trong tuần
            </label>
            <input 
              type="number" min="0"
              className="w-full p-3 rounded-xl border-2 border-primary/10 bg-white text-sm font-bold"
              value={goodGradesCount}
              onChange={(e) => setGoodGradesCount(parseInt(e.target.value) || 0)}
            />
            <div className="text-[9px] text-primary/40 italic">
              {goodGradesCount > 0 ? `Điểm thưởng: +${bonusPoints}đ` : 'Chưa có điểm thưởng'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
          {[
            { key: 'friday', label: 'Thứ 6' },
            { key: 'saturday', label: 'Thứ 7' },
            { key: 'sunday', label: 'Chủ Nhật' },
            { key: 'monday', label: 'Thứ 2' },
            { key: 'tuesday', label: 'Thứ 3' },
            { key: 'wednesday', label: 'Thứ 4' },
            { key: 'thursday', label: 'Thứ 5' }
          ].map((day) => (
            <div key={day.key} className="p-4 bg-primary/5 rounded-2xl border border-primary/5 flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-primary/40 uppercase">{day.label}</span>
              <span className={cn(
                "text-xl font-black",
                (day.key === 'saturday' || day.key === 'sunday') ? (
                  (dailyScores as any)[day.key] < 10 ? "text-red-500" : "text-green-500"
                ) : (
                  (dailyScores as any)[day.key] >= 8 ? "text-green-500" : 
                  (dailyScores as any)[day.key] >= 5 ? "text-accent" : "text-red-500"
                )
              )}>
                {(day.key === 'saturday' || day.key === 'sunday') ? (
                  (dailyScores as any)[day.key] < 10 ? "-2đ" : "0đ"
                ) : (
                  (dailyScores as any)[day.key]
                )}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <AlertCircle size={18} className="text-accent" />
            Chi tiết các lỗi vi phạm trong tuần
          </h3>
          <div className="space-y-3">
            {weeklyViolations.length > 0 ? (
              weeklyViolations.map((v, idx) => (
                <div key={idx} className="p-4 bg-red-50 rounded-2xl border border-red-100 flex gap-4 items-start">
                  <div className="p-2 bg-red-100 text-red-600 rounded-xl shrink-0">
                    <AlertCircle size={16} />
                  </div>
                  <p className="text-sm text-red-700 leading-relaxed">{v}</p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-green-50 rounded-3xl border border-green-100">
                <Sparkles size={32} className="text-green-400 mx-auto mb-3" />
                <p className="text-sm text-green-700 font-medium">Tuyệt vời! Không có lỗi vi phạm nào trong tuần.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
