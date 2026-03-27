/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Calculator, 
  ClipboardList, 
  FileText, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';
import { 
  WeeklyData, 
  DailyRecord, 
  Violation, 
  VIOLATION_POINTS, 
  VIOLATION_LABELS,
  CLASSES,
  ClassName,
  EDUCATIONAL_SOLUTIONS
} from './types';

const DAYS = ['Thứ 6', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5'];

const getInitialData = (): WeeklyData => ({
  dailyRecords: DAYS.map(day => ({ day, violations: [], baseScore: 10 })),
  weekendViolations: { saturday: false, sunday: false },
  goodGradesCount: 0,
  classLogScore: 10,
  roomCount: 1,
});

const calculateResultsForData = (data: WeeklyData) => {
  if (!data) return { N: 0, T: 0, weekendDeduction: 0, S: 0, dailyScores: [0,0,0,0,0] };
  const roomCount = Math.max(1, data.roomCount || 1);

  const dailyScores = data.dailyRecords.map(record => {
    let roomDeduction = 0;
    let otherDeduction = 0;
    
    record.violations.forEach(v => {
      const points = VIOLATION_POINTS[v.type] * v.count;
      if (v.type === 'room') {
        roomDeduction += points;
      } else {
        otherDeduction += points;
      }
    });
    
    const effectiveRoomDeduction = roomDeduction / roomCount;
    const totalDeduction = otherDeduction + effectiveRoomDeduction;
    
    return Math.max(0, record.baseScore - totalDeduction);
  });
  const N = dailyScores.reduce((sum, s) => sum + s, 0) / 5;

  let T = 0;
  const g = data.goodGradesCount;
  if (g >= 1 && g <= 5) T = 2;
  else if (g >= 6 && g <= 10) T = 4;
  else if (g >= 11 && g <= 15) T = 6;
  else if (g >= 16 && g <= 20) T = 8;
  else if (g > 20) T = 10;

  const weekendDeduction = (data.weekendViolations.saturday ? 2 : 0) + (data.weekendViolations.sunday ? 2 : 0);
  const S = (0.45 * N) + (0.45 * data.classLogScore) + (0.1 * T) - weekendDeduction;

  return { N, T, weekendDeduction, S: Math.round(S * 100) / 100, dailyScores };
};

export default function App() {
  const [appData, setAppData] = useState<Record<ClassName, Record<number, WeeklyData>>>(() => {
    const saved = localStorage.getItem('emulationAppData');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {} as Record<ClassName, Record<number, WeeklyData>>;
  });
  
  const appDataRef = useRef(appData);
  useEffect(() => {
    appDataRef.current = appData;
  }, [appData]);

  const [selectedClass, setSelectedClass] = useState<ClassName>('6A');
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  const [data, setData] = useState<WeeklyData>(getInitialData());
  const [rawInput, setRawInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'result'>('input');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [showMarkdown, setShowMarkdown] = useState(false);

  useEffect(() => {
    const classData = appDataRef.current[selectedClass] || {};
    let weekData = classData[selectedWeek];
    
    if (!weekData) {
      weekData = getInitialData();
      // Inherit roomCount from previous week if available
      const existingWeeks = Object.keys(classData).map(Number).sort((a, b) => b - a);
      if (existingWeeks.length > 0) {
        weekData.roomCount = classData[existingWeeks[0]].roomCount || 1;
      }
    }
    setData(weekData);
  }, [selectedClass, selectedWeek]);

  useEffect(() => {
    setAppData(prev => {
      const newAppData = { ...prev };
      if (!newAppData[selectedClass]) newAppData[selectedClass] = {};
      newAppData[selectedClass][selectedWeek] = data;
      localStorage.setItem('emulationAppData', JSON.stringify(newAppData));
      return newAppData;
    });
  }, [data, selectedClass, selectedWeek]);

  const calculateResults = useMemo(() => calculateResultsForData(data), [data]);

  const comparativeAnalysis = useMemo(() => {
    const classData = appData[selectedClass] || {};
    const w1Data = classData[selectedWeek - 1];
    const w2Data = classData[selectedWeek - 2];

    let growth = null;
    let w1Score = null;
    if (w1Data) {
      const w1Results = calculateResultsForData(w1Data);
      w1Score = w1Results.S;
      if (w1Score > 0) {
        growth = ((calculateResults.S - w1Score) / w1Score) * 100;
      }
    }

    const weeksToAnalyze = [data, w1Data, w2Data].filter(Boolean) as WeeklyData[];
    const violationCounts: Record<string, number> = {};
    
    weeksToAnalyze.forEach(w => {
      w.dailyRecords.forEach(r => {
        r.violations.forEach(v => {
          violationCounts[v.type] = (violationCounts[v.type] || 0) + v.count;
        });
      });
    });

    let mostFrequentViolationType = null;
    let mostFrequentViolation = null;
    let maxCount = 0;
    Object.entries(violationCounts).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequentViolationType = type;
        mostFrequentViolation = VIOLATION_LABELS[type as keyof typeof VIOLATION_LABELS];
      }
    });

    return { w1Score, growth, mostFrequentViolation, mostFrequentViolationType, maxCount };
  }, [appData, selectedClass, selectedWeek, data, calculateResults.S]);

  const generateMarkdown = () => {
    let md = `### Bảng Điểm Thi Đua Tuần ${selectedWeek} - Lớp ${selectedClass}\n\n`;
    md += `| Hạng mục | Chi tiết | Điểm |\n`;
    md += `| :--- | :--- | :--- |\n`;
    
    data.dailyRecords.forEach((r, i) => {
      const details = r.violations.length > 0 
        ? r.violations.map(v => {
            let text = `${VIOLATION_LABELS[v.type]} x${v.count}`;
            if (v.type === 'room' && (data.roomCount || 1) > 1) {
              text += ` (chia ${data.roomCount} phòng)`;
            }
            return text;
          }).join(', ')
        : "Không vi phạm";
      md += `| **${r.day}** | ${details} | ${calculateResults.dailyScores[i].toFixed(2)} |\n`;
    });

    md += `| **Điểm nề nếp trung bình (N)** | (Tổng 5 ngày) / 5 | **${calculateResults.N.toFixed(2)}** |\n`;
    md += `| **Điểm Sổ đầu bài** | Dữ liệu từ giáo viên | ${data.classLogScore.toFixed(1)} |\n`;
    md += `| **Điểm thưởng (T)** | ${data.goodGradesCount} điểm 9, 10 | +${calculateResults.T} |\n`;
    
    let weekendStr = "Không vi phạm";
    if (data.weekendViolations.saturday || data.weekendViolations.sunday) {
      weekendStr = [
        data.weekendViolations.saturday ? "Thứ 7 (-2)" : "",
        data.weekendViolations.sunday ? "Chủ nhật (-2)" : ""
      ].filter(Boolean).join(", ");
    }
    md += `| **Trừ cuối tuần** | ${weekendStr} | -${calculateResults.weekendDeduction} |\n`;
    md += `| **TỔNG ĐIỂM (S)** | (0.45*N) + (0.45*SĐB) + (0.1*T) - L | **${calculateResults.S.toFixed(2)}** |\n`;

    return md;
  };

  const handleProcessRawData = async () => {
    if (!rawInput.trim()) return;
    setIsProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          Bạn là trợ lý trích xuất dữ liệu thi đua. 
          Dựa trên văn bản thô sau, hãy trích xuất các thông tin cần thiết để điền vào cấu trúc dữ liệu.
          
          Văn bản: "${rawInput}"
          
          Quy tắc trích xuất:
          1. Tìm lỗi vi phạm cho 5 ngày: Thứ 6, Thứ 2, Thứ 3, Thứ 4, Thứ 5.
          2. Các loại lỗi: classroom (lớp học/tự học), room (phòng ở), dining (bàn ăn), hygiene2 (vệ sinh -2), hygiene3 (vệ sinh -3), heavy5 (thuốc lá/đt), heavy10 (đánh bài/gây gổ).
          3. Tìm số lượng điểm 9, 10 trong tuần.
          4. Tìm điểm sổ đầu bài.
          5. Tìm vi phạm Thứ 7, Chủ nhật.
          
          Trả về JSON theo định dạng sau:
          {
            "dailyRecords": [
              { "day": "Thứ 6", "violations": [{ "type": "room", "description": "Phòng bẩn", "count": 1 }] },
              ... (đủ 5 ngày theo thứ tự: Thứ 6, Thứ 2, Thứ 3, Thứ 4, Thứ 5)
            ],
            "weekendViolations": { "saturday": boolean, "sunday": boolean },
            "goodGradesCount": number,
            "classLogScore": number,
            "roomCount": number (số lượng phòng nội trú của lớp, mặc định giữ nguyên nếu không nhắc đến)
          }
          
          Lưu ý: Nếu ngày nào không có lỗi, mảng violations để trống. Điểm sổ đầu bài mặc định là 10 nếu không thấy nhắc tới.
        `,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text);
      setData(prev => ({
        ...prev,
        ...result,
        dailyRecords: result.dailyRecords.map((r: any) => ({ ...r, baseScore: 10 }))
      }));
      setActiveTab('result');
      generateAiAnalysis(result);
    } catch (error) {
      console.error("Error processing data:", error);
      alert("Có lỗi xảy ra khi xử lý dữ liệu. Vui lòng kiểm tra lại văn bản.");
    } finally {
      setIsProcessing(false);
    }
  };

  const generateAiAnalysis = async (currentData: WeeklyData) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          Dựa trên dữ liệu thi đua sau, hãy đưa ra nhận xét ngắn gọn (khoảng 3-4 câu) về ưu điểm và nhược điểm của lớp trong tuần này.
          Dữ liệu: ${JSON.stringify(currentData)}
          Kết quả tính toán: N=${calculateResults.N}, T=${calculateResults.T}, S=${calculateResults.S}
          Ngôn ngữ: Tiếng Việt.
        `
      });
      setAiAnalysis(response.text);
    } catch (e) {
      console.error(e);
    }
  };

  const addViolation = (dayIndex: number) => {
    const newData = { ...data };
    newData.dailyRecords[dayIndex].violations.push({
      type: 'classroom',
      description: '',
      count: 1
    });
    setData(newData);
  };

  const removeViolation = (dayIndex: number, vIndex: number) => {
    const newData = { ...data };
    newData.dailyRecords[dayIndex].violations.splice(vIndex, 1);
    setData(newData);
  };

  const updateViolation = (dayIndex: number, vIndex: number, field: keyof Violation, value: any) => {
    const newData = { ...data };
    (newData.dailyRecords[dayIndex].violations[vIndex] as any)[field] = value;
    setData(newData);
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0] print:bg-white">
      {/* Header */}
      <header className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center bg-green-700 text-white sticky top-0 z-20 gap-4 print:hidden shadow-xl border-b-4 border-green-900">
        <div>
          <h1 className="text-2xl font-serif italic font-bold tracking-tight text-white flex items-center gap-3">
            Smart Boarding
            <span className="bg-green-900 text-green-100 px-2 py-0.5 rounded-sm text-sm not-italic font-mono uppercase tracking-widest shadow-lg shadow-green-900/50">v4.0</span>
          </h1>
          <p className="text-[11px] uppercase tracking-widest text-green-100 font-mono mt-1">Giải pháp Số hóa Nề nếp và Học tập</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value as ClassName)}
              className="px-3 py-2 text-sm font-mono border border-green-600 bg-green-800 text-white focus:outline-none focus:border-green-400 transition-colors rounded-sm"
            >
              {CLASSES.map(c => <option key={c} value={c}>Lớp {c}</option>)}
            </select>
            
            <select 
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
              className="px-3 py-2 text-sm font-mono border border-green-600 bg-green-800 text-white focus:outline-none focus:border-green-400 transition-colors rounded-sm"
            >
              {Array.from({length: 35}, (_, i) => i + 1).map(w => <option key={w} value={w}>Tuần {w}</option>)}
            </select>
            
            <div className="flex items-center gap-2 border border-green-600 bg-green-800 px-3 py-2 transition-colors focus-within:border-green-400 rounded-sm" title="Số lượng phòng nội trú của lớp này">
              <span className="text-sm font-mono text-green-200/70">Số phòng:</span>
              <input 
                type="number" 
                min="1" 
                value={data.roomCount || 1}
                onChange={(e) => setData({...data, roomCount: Math.max(1, parseInt(e.target.value) || 1)})}
                className="w-12 text-sm font-mono bg-transparent text-white focus:outline-none text-center"
              />
            </div>
          </div>

          <div className="flex gap-2 bg-green-800 p-1 border border-green-600 rounded-sm">
            <button 
              onClick={() => setActiveTab('input')}
              className={cn(
                "px-4 py-1.5 text-xs font-mono uppercase tracking-tighter transition-all rounded-sm",
                activeTab === 'input' ? "bg-green-600 text-white font-bold shadow-md" : "text-green-200/70 hover:text-white hover:bg-green-700"
              )}
            >
              Nhập liệu
            </button>
            <button 
              onClick={() => setActiveTab('result')}
              className={cn(
                "px-4 py-1.5 text-xs font-mono uppercase tracking-tighter transition-all rounded-sm",
                activeTab === 'result' ? "bg-green-600 text-white font-bold shadow-md" : "text-green-200/70 hover:text-white hover:bg-green-700"
              )}
            >
              Kết quả
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'input' ? (
            <motion.div 
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Quick Input Section */}
              <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4" />
                  <h2 className="font-serif italic text-lg">Nhập nhanh bằng văn bản</h2>
                </div>
                <textarea 
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder="Ví dụ: Thứ 6 lớp sạch nhưng phòng 201 bẩn (-2), Thứ 2 có 1 bạn hút thuốc (-5). Tuần này có 15 điểm 10. Sổ đầu bài 9.5..."
                  className="w-full h-32 p-4 bg-[#F5F5F3] border border-[#141414] focus:outline-none focus:ring-1 focus:ring-[#141414] font-mono text-sm resize-none"
                />
                <button 
                  onClick={handleProcessRawData}
                  disabled={isProcessing || !rawInput.trim()}
                  className="mt-4 w-full py-3 bg-[#141414] text-[#E4E3E0] font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                  {isProcessing ? "Đang xử lý..." : "Phân tích & Tự động điền"}
                </button>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Manual Input - Daily Records */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList className="w-4 h-4" />
                    <h2 className="font-serif italic text-lg">Chi tiết nề nếp (Thứ 6 - Thứ 5)</h2>
                  </div>
                  
                  {data.dailyRecords.map((record, dIdx) => (
                    <div key={record.day} className="bg-white border border-[#141414] overflow-hidden">
                      <div className="bg-[#141414] text-[#E4E3E0] px-4 py-2 flex justify-between items-center">
                        <span className="font-mono text-xs uppercase tracking-widest">{record.day}</span>
                        <span className="font-mono text-[10px] opacity-70">Điểm gốc: {record.baseScore}</span>
                      </div>
                      <div className="p-4 space-y-3">
                        {record.violations.length === 0 && (
                          <p className="text-xs text-center py-4 opacity-40 italic">Không có lỗi vi phạm</p>
                        )}
                        {record.violations.map((v, vIdx) => (
                          <div key={vIdx} className="grid grid-cols-12 gap-2 items-center border-b border-dashed border-[#141414]/20 pb-2">
                            <select 
                              value={v.type}
                              onChange={(e) => updateViolation(dIdx, vIdx, 'type', e.target.value)}
                              className="col-span-5 text-[11px] p-1 border border-[#141414] bg-white font-mono"
                            >
                              {Object.entries(VIOLATION_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>
                            <input 
                              type="text"
                              value={v.description}
                              placeholder="Mô tả..."
                              onChange={(e) => updateViolation(dIdx, vIdx, 'description', e.target.value)}
                              className="col-span-4 text-[11px] p-1 border border-[#141414] bg-white font-mono"
                            />
                            <input 
                              type="number"
                              value={v.count}
                              min="1"
                              onChange={(e) => updateViolation(dIdx, vIdx, 'count', parseInt(e.target.value) || 1)}
                              className="col-span-2 text-[11px] p-1 border border-[#141414] bg-white font-mono text-center"
                            />
                            <button 
                              onClick={() => removeViolation(dIdx, vIdx)}
                              className="col-span-1 flex justify-center text-red-600 hover:scale-110 transition-transform"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => addViolation(dIdx)}
                          className="w-full py-2 border border-dashed border-[#141414] text-[10px] uppercase font-mono flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-3 h-3" /> Thêm lỗi
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sidebar Inputs */}
                <div className="space-y-6">
                  <div className="bg-white border border-[#141414] p-6 space-y-6">
                    <div>
                      <h3 className="font-serif italic text-md mb-3">Điểm Sổ Đầu Bài</h3>
                      <input 
                        type="number"
                        step="0.1"
                        max="10"
                        min="0"
                        value={data.classLogScore}
                        onChange={(e) => setData({...data, classLogScore: parseFloat(e.target.value) || 0})}
                        className="w-full p-2 border border-[#141414] font-mono text-sm"
                      />
                    </div>

                    <div>
                      <h3 className="font-serif italic text-md mb-3">Số lượng điểm 9, 10</h3>
                      <input 
                        type="number"
                        min="0"
                        value={data.goodGradesCount}
                        onChange={(e) => setData({...data, goodGradesCount: parseInt(e.target.value) || 0})}
                        className="w-full p-2 border border-[#141414] font-mono text-sm"
                      />
                      <p className="text-[10px] mt-1 opacity-50 font-mono italic">Dùng để tính điểm thưởng (T)</p>
                    </div>

                    <div>
                      <h3 className="font-serif italic text-md mb-3">Vi phạm cuối tuần</h3>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox"
                            checked={data.weekendViolations.saturday}
                            onChange={(e) => setData({...data, weekendViolations: {...data.weekendViolations, saturday: e.target.checked}})}
                            className="w-4 h-4 accent-[#141414]"
                          />
                          <span className="font-mono text-xs uppercase tracking-tighter group-hover:underline">Thứ 7 có lỗi (-2đ)</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox"
                            checked={data.weekendViolations.sunday}
                            onChange={(e) => setData({...data, weekendViolations: {...data.weekendViolations, sunday: e.target.checked}})}
                            className="w-4 h-4 accent-[#141414]"
                          />
                          <span className="font-mono text-xs uppercase tracking-tighter group-hover:underline">Chủ nhật có lỗi (-2đ)</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setActiveTab('result');
                      generateAiAnalysis(data);
                    }}
                    className="w-full py-4 bg-[#141414] text-[#E4E3E0] font-mono text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                  >
                    Xem kết quả & Nhận xét
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-8 print:space-y-6"
            >
              {/* Print Header */}
              <div className="hidden print:block text-center mb-8">
                <h1 className="text-3xl font-serif italic font-bold">Báo Cáo Thi Đua Nội Trú</h1>
                <p className="text-lg font-mono mt-2">Lớp: {selectedClass} - Tuần: {selectedWeek}</p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-[#141414] p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-mono uppercase opacity-50 mb-1">Nề nếp (N)</span>
                  <span className="text-3xl font-serif italic">{calculateResults.N.toFixed(2)}</span>
                </div>
                <div className="bg-white border border-[#141414] p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-mono uppercase opacity-50 mb-1">Sổ đầu bài</span>
                  <span className="text-3xl font-serif italic">{data.classLogScore.toFixed(1)}</span>
                </div>
                <div className="bg-white border border-[#141414] p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-mono uppercase opacity-50 mb-1">Thưởng (T)</span>
                  <span className="text-3xl font-serif italic">+{calculateResults.T}</span>
                </div>
                <div className="bg-[#141414] text-[#E4E3E0] border border-[#141414] p-4 flex flex-col items-center justify-center text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                  <span className="text-[10px] font-mono uppercase opacity-50 mb-1">Tổng điểm (S)</span>
                  <span className="text-4xl font-serif italic font-bold">{calculateResults.S.toFixed(2)}</span>
                </div>
              </div>

              {/* Detailed Table */}
              <section className="bg-white border border-[#141414] overflow-hidden">
                <div className="bg-[#141414] text-[#E4E3E0] px-6 py-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <h2 className="font-mono text-xs uppercase tracking-widest">Bảng tính chi tiết</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#141414]">
                        <th className="p-4 font-serif italic text-xs uppercase opacity-50">Hạng mục</th>
                        <th className="p-4 font-serif italic text-xs uppercase opacity-50">Chi tiết</th>
                        <th className="p-4 font-serif italic text-xs uppercase opacity-50 text-right">Điểm</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-xs">
                      {data.dailyRecords.map((r, i) => (
                        <tr key={r.day} className="border-b border-[#141414]/10 hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-bold">{r.day}</td>
                          <td className="p-4">
                            {r.violations.length > 0 
                              ? r.violations.map(v => {
                                  let text = `${VIOLATION_LABELS[v.type]} x${v.count}`;
                                  if (v.type === 'room' && (data.roomCount || 1) > 1) {
                                    text += ` (chia ${data.roomCount} phòng)`;
                                  }
                                  return text;
                                }).join(', ')
                              : "Không vi phạm"}
                          </td>
                          <td className="p-4 text-right">{calculateResults.dailyScores[i].toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="bg-[#F5F5F3]">
                        <td className="p-4 font-bold">Điểm nề nếp trung bình (N)</td>
                        <td className="p-4 italic opacity-60">(Tổng 5 ngày) / 5</td>
                        <td className="p-4 text-right font-bold">{calculateResults.N.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-bold">Điểm Sổ đầu bài</td>
                        <td className="p-4">Dữ liệu từ giáo viên</td>
                        <td className="p-4 text-right">{data.classLogScore.toFixed(1)}</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-bold">Điểm thưởng (T)</td>
                        <td className="p-4">{data.goodGradesCount} điểm 9, 10</td>
                        <td className="p-4 text-right">+{calculateResults.T}</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-bold">Trừ cuối tuần</td>
                        <td className="p-4">
                          {data.weekendViolations.saturday && "Thứ 7 (-2) "}
                          {data.weekendViolations.sunday && "Chủ nhật (-2)"}
                          {!data.weekendViolations.saturday && !data.weekendViolations.sunday && "Không vi phạm"}
                        </td>
                        <td className="p-4 text-right text-red-600">-{calculateResults.weekendDeduction}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#141414] text-[#E4E3E0]">
                        <td colSpan={2} className="p-4 font-serif italic text-lg">Công thức: (0.45*N) + (0.45*SĐB) + (0.1*T) - L</td>
                        <td className="p-4 text-right text-2xl font-serif italic font-bold">{calculateResults.S.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>

              {/* Comparative Analysis */}
              <section className="bg-white border border-[#141414] p-6">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-4 h-4" />
                  <h2 className="font-serif italic text-lg">Phân tích So sánh & Xu hướng</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 border border-dashed border-[#141414]/30 bg-[#F5F5F3]">
                    <div className="text-[10px] font-mono uppercase opacity-50 mb-2">So với Tuần {selectedWeek - 1}</div>
                    {comparativeAnalysis.w1Score !== null ? (
                      <div className="flex items-end gap-3">
                        <span className="text-2xl font-serif italic">{comparativeAnalysis.w1Score.toFixed(2)}</span>
                        <span className={cn(
                          "text-sm font-mono font-bold mb-1",
                          comparativeAnalysis.growth! > 0 ? "text-green-600" : comparativeAnalysis.growth! < 0 ? "text-red-600" : "text-gray-600"
                        )}>
                          {comparativeAnalysis.growth! > 0 ? '↑' : comparativeAnalysis.growth! < 0 ? '↓' : '-'} 
                          {Math.abs(comparativeAnalysis.growth!).toFixed(1)}%
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm font-mono italic opacity-50">Không có dữ liệu tuần trước</div>
                    )}
                  </div>

                  <div className="md:col-span-2 p-4 border border-dashed border-[#141414]/30 bg-[#F5F5F3]">
                    <div className="text-[10px] font-mono uppercase opacity-50 mb-2">Xu hướng vi phạm (3 tuần gần nhất)</div>
                    {comparativeAnalysis.mostFrequentViolation ? (
                      <div>
                        <span className="text-lg font-serif italic text-red-600">{comparativeAnalysis.mostFrequentViolation}</span>
                        <span className="text-xs font-mono ml-2 opacity-70">({comparativeAnalysis.maxCount} lần vi phạm)</span>
                        <p className="text-xs font-mono mt-2 opacity-70">Hạng mục này thường xuyên bị trừ điểm. Cần nhắc nhở lớp chú ý khắc phục.</p>
                        
                        <div className="mt-4 p-3 bg-white border border-[#141414]/20">
                          <div className="text-[10px] font-mono uppercase font-bold mb-1 text-amber-700">💡 Phương án giáo dục đề xuất:</div>
                          <p className="text-xs font-serif leading-relaxed">
                            {EDUCATIONAL_SOLUTIONS[comparativeAnalysis.mostFrequentViolationType as keyof typeof EDUCATIONAL_SOLUTIONS]}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm font-mono italic opacity-50">Chưa có dữ liệu vi phạm đủ để phân tích xu hướng.</div>
                    )}
                  </div>
                </div>
              </section>

              {/* AI Analysis */}
              <section className="bg-white border border-[#141414] p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-5">
                  <MessageSquare className="w-24 h-24" />
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <h2 className="font-serif italic text-lg">Nhận xét từ Trợ lý AI</h2>
                </div>
                <div className="prose prose-sm max-w-none font-serif text-[#333] leading-relaxed">
                  {aiAnalysis ? (
                    <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                  ) : (
                    <div className="flex items-center gap-2 opacity-40 italic">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Đang tạo nhận xét...</span>
                    </div>
                  )}
                </div>
              </section>

              <div className="flex flex-wrap justify-center gap-4 print:hidden">
                <button 
                  onClick={() => setShowMarkdown(true)}
                  className="px-6 py-3 bg-white border border-[#141414] font-mono text-xs uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Xuất Markdown
                </button>
                <button 
                  onClick={() => window.print()}
                  className="px-6 py-3 bg-white border border-[#141414] font-mono text-xs uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" /> In báo cáo
                </button>
                <button 
                  onClick={() => setActiveTab('input')}
                  className="px-6 py-3 bg-[#141414] text-[#E4E3E0] font-mono text-xs uppercase tracking-widest hover:bg-[#333] transition-all flex items-center gap-2"
                >
                  <Calculator className="w-4 h-4" /> Chỉnh sửa dữ liệu
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Markdown Export Modal */}
        <AnimatePresence>
          {showMarkdown && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white border border-[#141414] w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
              >
                <div className="flex justify-between items-center p-4 border-b border-[#141414] bg-[#141414] text-[#E4E3E0]">
                  <h3 className="font-mono text-xs uppercase tracking-widest">Xuất dữ liệu Markdown</h3>
                  <button onClick={() => setShowMarkdown(false)} className="hover:text-white">✕</button>
                </div>
                <div className="p-4 flex-1 overflow-auto">
                  <textarea 
                    readOnly
                    value={generateMarkdown()}
                    className="w-full h-64 p-4 bg-[#F5F5F3] border border-[#141414] font-mono text-xs focus:outline-none resize-none"
                  />
                </div>
                <div className="p-4 border-t border-[#141414] bg-gray-50 flex justify-end gap-2">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(generateMarkdown());
                      alert('Đã copy vào clipboard!');
                    }}
                    className="px-4 py-2 bg-[#141414] text-[#E4E3E0] font-mono text-xs uppercase tracking-widest hover:bg-[#333] transition-colors"
                  >
                    Copy Markdown
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-20 border-t border-[#141414] p-12 text-center opacity-30 print:mt-8 print:p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em]">Trường Phổ thông Dân tộc Nội trú • 2026</p>
      </footer>
    </div>
  );
}
