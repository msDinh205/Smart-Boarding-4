import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  Filter, 
  X, 
  History, 
  Search, 
  Trash2,
  Trophy,
  Star
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { Gamification } from './Gamification';
import { ViolationHeatmap } from './ViolationHeatmap';

interface DashboardProps {
  history: any[];
  weeklySummaries: any[];
  filter: {
    class: string;
    startDate: string;
    endDate: string;
  };
  setFilter: (filter: any) => void;
  onDelete: (id: string) => void;
  classes: string[];
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  history, 
  weeklySummaries,
  filter, 
  setFilter,
  onDelete,
  classes
}) => {
  const filteredHistory = history.filter(h => {
    const matchesClass = filter.class === 'All' || h.className === filter.class;
    const matchesStartDate = !filter.startDate || h.date >= filter.startDate;
    const matchesEndDate = !filter.endDate || h.date <= filter.endDate;
    return matchesClass && matchesStartDate && matchesEndDate;
  });

  // Stats calculation
  const totalRecords = filteredHistory.length;
  const avgScore = totalRecords > 0 
    ? (filteredHistory.reduce((acc, curr) => acc + curr.score, 0) / totalRecords).toLocaleString('vi-VN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
    : '0,000';
  
  const classStats = classes.map(cls => {
    const classRecords = filteredHistory.filter(h => h.className === cls);
    const avg = classRecords.length > 0
      ? (classRecords.reduce((acc, curr) => acc + curr.score, 0) / classRecords.length).toLocaleString('vi-VN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
      : '0,000';
    return { name: cls, avg: parseFloat(avg.replace(',', '.') as string) };
  }).filter(s => s.avg > 0);

  // Chart data (last 10 entries for trend)
  const trendData = [...filteredHistory].reverse().slice(-10).map(h => ({
    name: h.date,
    score: h.score,
    class: h.className
  }));

  return (
    <div className="space-y-8">
      {/* Gamification Awards */}
      <Gamification weeklySummaries={weeklySummaries} />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-primary/5 flex items-center gap-4">
          <div className="p-3 bg-primary/5 text-primary rounded-2xl">
            <BarChart3 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Tổng số bản ghi</p>
            <p className="text-2xl font-black text-primary">{totalRecords}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-primary/5 flex items-center gap-4">
          <div className="p-3 bg-accent/5 text-accent rounded-2xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Điểm trung bình</p>
            <p className="text-2xl font-black text-accent">{avgScore}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-primary/5 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
            <Award size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Lớp dẫn đầu</p>
            <p className="text-2xl font-black text-green-600">
              {classStats.length > 0 ? classStats.reduce((a, b) => a.avg > b.avg ? a : b).name : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-primary/5 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-xl">
          <Filter size={14} className="text-primary/40" />
          <span className="text-[10px] font-bold text-primary/60 uppercase tracking-wider">Lọc dữ liệu:</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-primary/40 uppercase ml-1">Lớp</span>
            <select 
              className="bg-primary/5 border-none rounded-xl px-4 py-2 text-xs font-bold text-primary focus:ring-0 cursor-pointer"
              value={filter.class}
              onChange={(e) => setFilter({ ...filter, class: e.target.value })}
            >
              <option value="All">Tất cả các lớp</option>
              {classes.map(cls => (
                <option key={cls} value={cls}>Lớp {cls}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-primary/40 uppercase ml-1">Từ ngày</span>
            <input 
              type="date"
              className="bg-primary/5 border-none rounded-xl px-4 py-2 text-xs font-bold text-primary focus:ring-0 cursor-pointer"
              value={filter.startDate}
              onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-primary/40 uppercase ml-1">Đến ngày</span>
            <input 
              type="date"
              className="bg-primary/5 border-none rounded-xl px-4 py-2 text-xs font-bold text-primary focus:ring-0 cursor-pointer"
              value={filter.endDate}
              onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
            />
          </div>

          {(filter.class !== 'All' || filter.startDate || filter.endDate) && (
            <button 
              onClick={() => setFilter({ class: 'All', startDate: '', endDate: '' })}
              className="mt-5 px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 transition-colors flex items-center gap-2"
            >
              <X size={12} />
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-primary/5 space-y-4">
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={16} className="text-accent" />
            Xu hướng điểm số
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                />
                <YAxis 
                  domain={[0, 10]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#F27D26" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#F27D26', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-primary/5 space-y-4">
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
            <BarChart3 size={16} className="text-primary" />
            So sánh giữa các lớp
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                />
                <YAxis 
                  domain={[0, 10]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                  {classStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#141414' : '#F27D26'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Advanced Analytics */}
      <ViolationHeatmap history={filteredHistory} classes={classes} />

      {/* History Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-primary/5 overflow-hidden">
        <div className="p-6 border-b border-primary/5 flex items-center justify-between">
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
            <History size={16} className="text-primary/40" />
            Lịch sử ghi nhận
          </h3>
          <div className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">
            Hiển thị {filteredHistory.length} kết quả
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary/5">
                <th className="px-6 py-4 text-[10px] font-bold text-primary/40 uppercase tracking-widest">Ngày</th>
                <th className="px-6 py-4 text-[10px] font-bold text-primary/40 uppercase tracking-widest">Lớp</th>
                <th className="px-6 py-4 text-[10px] font-bold text-primary/40 uppercase tracking-widest">Nề nếp (3)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-primary/40 uppercase tracking-widest">Phòng (3)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-primary/40 uppercase tracking-widest">Ăn trưa (2)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-primary/40 uppercase tracking-widest">Vệ sinh (2)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-primary/40 uppercase tracking-widest">Tổng (10)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-primary/40 uppercase tracking-widest">Nhận xét</th>
                <th className="px-6 py-4 text-[10px] font-bold text-primary/40 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {filteredHistory.map((item) => (
                <tr key={item.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-primary">
                        {item.date}
                      </span>
                      <span className="text-[9px] text-primary/40 uppercase font-medium">
                        {format(new Date(item.date), 'yyyy')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-primary/5 rounded-lg text-[10px] font-bold text-primary uppercase">
                      {item.className}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-primary/60">
                    {item.scores?.classDiscipline?.toLocaleString('vi-VN', { minimumFractionDigits: 3 }) || '-'}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-primary/60">
                    {item.scores?.dorm?.toLocaleString('vi-VN', { minimumFractionDigits: 3 }) || '-'}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-primary/60">
                    {item.scores?.dining?.toLocaleString('vi-VN', { minimumFractionDigits: 3 }) || '-'}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-primary/60">
                    {item.scores?.cleaning?.toLocaleString('vi-VN', { minimumFractionDigits: 3 }) || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        item.score >= 8 ? "bg-green-500" : 
                        item.score >= 5 ? "bg-accent" : "bg-red-500"
                      )} />
                      <span className="text-sm font-black text-primary">
                        {item.score.toLocaleString('vi-VN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-primary/60 line-clamp-1 max-w-xs italic">
                      {item.details}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onDelete(item.id)}
                      className="p-2 text-primary/20 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <Search size={32} />
                      <p className="text-xs font-bold uppercase tracking-widest">Không tìm thấy dữ liệu</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
