import React from 'react';
import { motion } from 'motion/react';
import { Award, Star, Home, BookOpen, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface GamificationProps {
  weeklySummaries: any[];
}

export const Gamification: React.FC<GamificationProps> = ({ weeklySummaries }) => {
  if (weeklySummaries.length === 0) return null;

  // Find winners for the latest week in the data
  const latestSummaries = weeklySummaries.filter(s => s.weekId === weeklySummaries[0]?.weekId);

  const starClass = latestSummaries.reduce((prev, current) => (prev.totalScore > current.totalScore) ? prev : current, latestSummaries[0]);
  const disciplineWinner = latestSummaries.reduce((prev, current) => (prev.weekdayAvg > current.weekdayAvg) ? prev : current, latestSummaries[0]);
  const dormWinner = latestSummaries.reduce((prev, current) => (prev.dormAvg > current.dormAvg) ? prev : current, latestSummaries[0]);
  const studyWinner = latestSummaries.reduce((prev, current) => (prev.goodGradesCount > current.goodGradesCount) ? prev : current, latestSummaries[0]);

  const awards = [
    {
      id: 'star-class',
      title: 'Lớp Sao Sáng',
      winner: starClass.className,
      value: `${starClass.totalScore.toLocaleString('vi-VN', { minimumFractionDigits: 3 })}đ`,
      icon: <Star className="text-yellow-500" size={24} />,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-100',
      description: 'Tổng điểm thi đua cao nhất tuần'
    },
    {
      id: 'discipline',
      title: 'Vô địch Nề nếp',
      winner: disciplineWinner.className,
      value: `${disciplineWinner.weekdayAvg.toLocaleString('vi-VN', { minimumFractionDigits: 3 })}đ`,
      icon: <Award className="text-blue-500" size={24} />,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      description: 'Điểm nề nếp trung bình cao nhất'
    },
    {
      id: 'dorm',
      title: 'Phòng ở Kiểu mẫu',
      winner: dormWinner.className,
      value: `${dormWinner.dormAvg.toLocaleString('vi-VN', { minimumFractionDigits: 3 })}đ`,
      icon: <Home className="text-green-500" size={24} />,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-100',
      description: 'Điểm nội trú trung bình cao nhất'
    },
    {
      id: 'study',
      title: 'Tinh thần Học tập',
      winner: studyWinner.className,
      value: `${studyWinner.goodGradesCount} điểm 9, 10`,
      icon: <BookOpen className="text-purple-500" size={24} />,
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-100',
      description: 'Nhiều điểm tốt nhất trong tuần'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={18} className="text-accent" />
        <h3 className="text-xs font-bold text-primary uppercase tracking-widest text-left">Bảng Vàng Danh Dự Tuần</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {awards.map((award, idx) => (
          <motion.div 
            key={award.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              "p-5 rounded-3xl border shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all",
              award.bgColor,
              award.borderColor
            )}
          >
            <div className="absolute -right-2 -top-2 opacity-10 group-hover:scale-125 transition-transform">
              {award.icon}
            </div>
            <div className="flex flex-col gap-3 relative z-10">
              <div className="p-2 bg-white rounded-xl w-fit shadow-sm">
                {award.icon}
              </div>
              <div>
                <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-1">{award.title}</p>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-xl font-black text-primary">Lớp {award.winner}</h4>
                  <span className="text-[10px] font-bold text-accent">{award.value}</span>
                </div>
                <p className="text-[10px] text-primary/60 mt-2 font-medium">{award.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
