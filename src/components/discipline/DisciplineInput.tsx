import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  Sparkles, 
  Loader2, 
  Home, 
  Trash2, 
  ClipboardCheck, 
  UserCheck, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Mountain,
  Award
} from 'lucide-react';
import { ImageUpload } from '../ImageUpload';
import { ManualInput, ScoreCard } from '../common';
import { AnalysisResult } from '../../types';
import { cn } from '../../lib/utils';

interface DisciplineInputProps {
  CLASSES: string[];
  className: string;
  setClassName: (val: string) => void;
  selectedDate: string;
  setSelectedDate: (val: string) => void;
  subView: 'daily' | 'weekly';
  setSubView: (val: 'daily' | 'weekly') => void;
  uniformImage: string | null;
  setUniformImage: (val: string | null) => void;
  diningImage: string | null;
  setDiningImage: (val: string | null) => void;
  cleaningImage: string | null;
  setCleaningImage: (val: string | null) => void;
  manualNotes: {
    classDiscipline: string;
    dorm: string;
    dining: string;
    cleaning: string;
  };
  setManualNotes: React.Dispatch<React.SetStateAction<{
    classDiscipline: string;
    dorm: string;
    dining: string;
    cleaning: string;
  }>>;
  dormRooms: { id: number; score: number; image: string | null; notes: string }[];
  setDormRooms: React.Dispatch<React.SetStateAction<{ id: number; score: number; image: string | null; notes: string }[]>>;
  attendanceData: string;
  setAttendanceData: (val: string) => void;
  loading: boolean;
  result: AnalysisResult | null;
  handleAnalyze: () => Promise<void>;
  handleVerify: () => Promise<void>;
  verified: boolean;
  saving: boolean;
  dailyScores: any;
}

export const DisciplineInput: React.FC<DisciplineInputProps> = ({
  CLASSES,
  className,
  setClassName,
  selectedDate,
  setSelectedDate,
  subView,
  setSubView,
  uniformImage,
  setUniformImage,
  diningImage,
  setDiningImage,
  cleaningImage,
  setCleaningImage,
  manualNotes,
  setManualNotes,
  dormRooms,
  setDormRooms,
  attendanceData,
  setAttendanceData,
  loading,
  result,
  handleAnalyze,
  handleVerify,
  verified,
  saving,
  dailyScores
}) => {
  const dayOfWeek = new Date(selectedDate).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return (
    <motion.div 
      key="input"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-8"
    >
      {/* Sub-View Switcher */}
      <div className="flex bg-primary/5 p-1 rounded-2xl w-fit mx-auto lg:mx-0">
        <button 
          onClick={() => setSubView('daily')}
          className={cn(
            "px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
            subView === 'daily' ? "bg-white text-primary shadow-sm" : "text-primary/40 hover:text-primary/60"
          )}
        >
          Chấm điểm ngày
        </button>
        <button 
          onClick={() => setSubView('weekly')}
          className={cn(
            "px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
            subView === 'weekly' ? "bg-white text-primary shadow-sm" : "text-primary/40 hover:text-primary/60"
          )}
        >
          Tổng kết tuần
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {subView === 'daily' ? (
          <>
            {/* Left Column: Input */}
            <div className="lg:col-span-12 xl:col-span-5 space-y-8">
              {isWeekend ? (
                <section className="bg-white p-6 rounded-3xl shadow-sm border border-primary/5 space-y-6">
                  <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs">
                    <AlertTriangle size={16} className="text-red-500" />
                    <span>Ghi nhận vi phạm cuối tuần ({dayOfWeek === 6 ? 'Thứ 7' : 'Chủ Nhật'})</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-primary/60 uppercase tracking-wider">Tên lớp</label>
                      <select 
                        className="w-full p-3 rounded-xl border-2 border-primary/10 bg-primary/5 focus:border-primary/30 focus:ring-0 transition-all text-sm appearance-none cursor-pointer"
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                      >
                        {CLASSES.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-primary/60 uppercase tracking-wider">Ngày chấm điểm</label>
                      <input 
                        type="date"
                        className="w-full p-3 rounded-xl border-2 border-primary/10 bg-primary/5 focus:border-primary/30 focus:ring-0 transition-all text-sm"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 space-y-3">
                    <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                      <span className="font-bold uppercase block mb-1">Quy tắc cuối tuần:</span>
                      Cuối tuần không chấm theo tiêu chí hàng ngày. Chỉ cần ghi nhận nếu có vi phạm. 
                      Trừ 2đ trực tiếp vào điểm trung bình tuần.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <ImageUpload label="Ảnh minh chứng (nếu có)" image={uniformImage} onImageChange={setUniformImage} />
                    <textarea 
                      className="w-full h-48 p-4 rounded-xl border-2 border-primary/10 bg-primary/5 text-sm resize-none"
                      placeholder="Nhập các lỗi vi phạm..."
                      value={attendanceData}
                      onChange={(e) => setAttendanceData(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={handleAnalyze}
                    disabled={loading}
                    className={cn(
                      "w-full py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2",
                      loading ? "bg-primary/50" : "bg-primary hover:bg-primary/90"
                    )}
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                    <span>{loading ? "Đang kiểm tra..." : "Xác nhận vi phạm"}</span>
                  </button>
                </section>
              ) : (
                <section className="bg-white p-6 rounded-3xl shadow-sm border border-primary/5 space-y-6">
                  <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs">
                    <Sparkles size={16} className="text-accent" />
                    <span>Dữ liệu đầu vào</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-primary/60 uppercase tracking-wider">Tên lớp</label>
                      <select 
                        className="w-full p-3 rounded-xl border-2 border-primary/10 bg-primary/5 text-sm"
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                      >
                        {CLASSES.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-primary/60 uppercase tracking-wider">Ngày chấm điểm</label>
                      <input 
                        type="date"
                        className="w-full p-3 rounded-xl border-2 border-primary/10 bg-primary/5 text-sm"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Dorm Rooms */}
                    <div className="bg-white p-4 rounded-2xl border border-primary/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-primary/60 uppercase tracking-wider flex items-center gap-1.5">
                          <Home size={12} className="text-accent" />
                          Phòng ở (TB cộng)
                        </label>
                        <button 
                          onClick={() => setDormRooms(prev => [...prev, { id: prev.length + 1, score: 3, image: null, notes: '' }])}
                          className="text-[9px] font-bold text-accent px-2 py-0.5 bg-accent/5 rounded-full"
                        >
                          + Thêm
                        </button>
                      </div>
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                        {dormRooms.map((room, index) => (
                          <div key={index} className="p-3 bg-primary/5 rounded-xl border border-primary/5 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-primary/40">Phòng {room.id}</span>
                              <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg">
                                <span className="text-[9px] text-primary/40 uppercase">Điểm:</span>
                                <input 
                                  type="number" step="0.5" max="10"
                                  className="w-10 bg-transparent text-xs font-black text-primary p-0 border-none focus:ring-0"
                                  value={room.score}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setDormRooms(prev => prev.map((r, i) => i === index ? { ...r, score: val } : r));
                                  }}
                                />
                              </div>
                              {dormRooms.length > 1 && (
                                <button onClick={() => setDormRooms(prev => prev.filter((_, i) => i !== index))} className="text-red-400">
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <ImageUpload label="Ảnh" image={room.image} onImageChange={(img) => setDormRooms(prev => prev.map((r, i) => i === index ? { ...r, image: img } : r))} />
                              <ManualInput placeholder="Lỗi..." value={room.notes} onChange={(v) => setDormRooms(prev => prev.map((r, i) => i === index ? { ...r, notes: v } : r))} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Class Discipline */}
                    <div className="space-y-3">
                      <ImageUpload label="Lớp học & Tác phong" image={uniformImage} onImageChange={setUniformImage} />
                      <ManualInput placeholder="Lỗi lớp học..." value={manualNotes.classDiscipline} onChange={(v) => setManualNotes(prev => ({ ...prev, classDiscipline: v }))} />
                    </div>

                    <div className="space-y-3">
                      <ImageUpload label="Bàn ăn" image={diningImage} onImageChange={setDiningImage} />
                      <ManualInput placeholder="Lỗi bàn ăn..." value={manualNotes.dining} onChange={(v) => setManualNotes(prev => ({ ...prev, dining: v }))} />
                    </div>

                    <div className="space-y-3">
                      <ImageUpload label="Vệ sinh" image={cleaningImage} onImageChange={setCleaningImage} />
                      <ManualInput placeholder="Lỗi vệ sinh..." value={manualNotes.cleaning} onChange={(v) => setManualNotes(prev => ({ ...prev, cleaning: v }))} />
                    </div>
                  </div>

                  <textarea 
                    className="w-full h-32 p-4 rounded-xl border-2 border-primary/10 bg-primary/5 text-sm resize-none"
                    placeholder="Báo cáo chuyên cần / Vi phạm đặc biệt..."
                    value={attendanceData}
                    onChange={(e) => setAttendanceData(e.target.value)}
                  />

                  <button 
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                    <span>{loading ? "Đang soi xét..." : "Gợi ý chấm điểm"}</span>
                  </button>
                </section>
              )}
            </div>

            {/* Right Column: Results */}
            <div className="lg:col-span-12 xl:col-span-7">
              <AnimatePresence mode="wait">
                {!result && !loading ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-3xl border-2 border-dashed border-primary/10 opacity-60">
                    <ClipboardCheck size={40} className="text-primary/20 mb-6" />
                    <h3 className="text-lg font-bold text-primary/40">Sẵn sàng hỗ trợ Thầy/Cô</h3>
                  </motion.div>
                ) : loading ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center p-12 space-y-6">
                    <Loader2 className="animate-spin text-accent" size={64} />
                    <h3 className="text-xl font-bold text-primary">Đang đối soát tiêu chí...</h3>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-primary/5">
                      <h3 className="text-sm font-bold text-primary uppercase">Lớp: {result.className || className}</h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <ScoreCard icon={<ClipboardCheck size={18} />} label="Lớp học" score={result.scores.classDiscipline} max={3} />
                      <ScoreCard icon={<Home size={18} />} label="Phòng ở" score={result.scores.dorm} max={3} />
                      <ScoreCard icon={<UserCheck size={18} />} label="Bàn ăn" score={result.scores.dining} max={2} />
                      <ScoreCard icon={<Calendar size={18} />} label="Vệ sinh" score={result.scores.cleaning} max={2} />
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm flex items-center justify-between">
                      <div className="text-3xl font-black text-primary">{result.scores.disciplineTotal}/10</div>
                      <ClipboardCheck size={24} className="text-primary/20" />
                    </div>

                    {/* Pedagogical Message */}
                    <section className="bg-primary text-secondary p-8 rounded-3xl relative overflow-hidden">
                       <blockquote className="text-lg italic">"{result.pedagogicalMessage}"</blockquote>
                    </section>

                    {/* Deductions */}
                    <section className="bg-white p-6 rounded-3xl border border-primary/5">
                      <h3 className="text-sm font-bold uppercase mb-4">Chi tiết vi phạm</h3>
                      <div className="space-y-3">
                        {result.deductions.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <span className="text-sm text-slate-600">{item.reason}</span>
                            <span className="font-bold text-red-500">-{item.points}đ</span>
                          </div>
                        ))}
                      </div>
                    </section>

                    {!verified ? (
                      <button 
                        onClick={handleVerify}
                        disabled={saving}
                        className="w-full py-4 bg-accent text-white rounded-2xl font-bold"
                      >
                        {saving ? "Đang lưu..." : "Phê duyệt kết quả"}
                      </button>
                    ) : (
                      <div className="w-full py-4 bg-green-100 text-green-700 rounded-2xl font-bold text-center">Đã phê duyệt</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="lg:col-span-12">
            {/* Weekly summary logic will go here or be passed down */}
            <div className="bg-white p-8 rounded-3xl shadow-sm text-center">
              <h2 className="text-xl font-bold">Vui lòng xem Bảng tổng hợp để biết chi tiết tuần.</h2>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
