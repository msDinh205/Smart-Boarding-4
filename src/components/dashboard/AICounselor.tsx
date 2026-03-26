import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Sparkles, Brain, MessageSquare, ChevronRight, Info } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AICounselorProps {
  history: any[];
  weeklySummaries: any[];
}

export const AICounselor: React.FC<AICounselorProps> = ({ history, weeklySummaries }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Xin chào! Tôi là Cố vấn Thông minh Smart Boarding. Tôi đã sẵn sàng phân tích dữ liệu nề nếp và cung cấp lời khuyên sư phạm cho bạn. Bạn muốn bắt đầu từ lớp nào hay cần phân tích xu hướng của tuần này?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Context Construction
    const contextStr = `
      CONTEKST DỮ LIỆU CỦA BẠN:
      - Tổng số bản ghi hàng ngày: ${history.length}
      - Tổng số báo cáo tuần: ${weeklySummaries.length}
      
      DỮ LIỆU GẦN ĐÂY:
      ${history.slice(0, 10).map(h => `- ${h.date}, Lớp ${h.className}, Điểm: ${h.score}, Ghi chú: ${h.details}`).join('\n')}
      
      TỔNG KẾT TUẦN GẦN NHẤT:
      ${weeklySummaries.slice(0, 3).map(w => `- Tuần ${w.weekId}, Lớp ${w.className}, Điểm TB nề nếp: ${w.avgScore}, Điểm học tập: ${w.goodGradesCount}`).join('\n')}
    `;

    try {
      // Logic for AI Response (Simulation for now, or real call if configured)
      // In a real app, you would send this to your backend/LLM endpoint
      setTimeout(() => {
        let aiResponse = "";
        const lowerInput = input.toLowerCase();
        
        if (lowerInput.includes('tệ nhất') || lowerInput.includes('thấp nhất')) {
          const worst = [...history].sort((a, b) => a.score - b.score)[0];
          aiResponse = `Dựa trên dữ liệu, lớp có điểm số thấp nhất gần đây là ${worst.className} vào ngày ${worst.date} (${worst.score}đ). Các vi phạm chính bao gồm: ${worst.details}. Tôi khuyên bạn nên làm việc với Ban thi đua của lớp này để chấn chỉnh.`;
        } else if (lowerInput.includes('xu hướng') || lowerInput.includes('phát triển')) {
          aiResponse = "Tôi nhận thấy xu hướng nề nếp trong tuần này đang có sự cải thiện nhẹ về giờ giấc ăn trưa, nhưng nề nếp tại các phòng nội trú (Dorm) lại có dấu hiệu giảm sút điểm số trung bình từ 9.5 xuống 9.2 vào cuối tuần. Bạn có muốn xem chi tiết các phòng bị trừ điểm không?";
        } else {
          aiResponse = "Tôi đã phân tích 10 bản ghi gần nhất. Tổng quan chung nề nếp của các lớp đang ở mức Khá (TB ~9.0). Có một vài điểm sáng ở lớp 10A với 3 ngày liên tiếp đạt điểm 10. Bạn có cần tôi đưa ra chiến lược khen thưởng cho lớp này không?";
        }

        const newAssistantMessage: Message = {
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, newAssistantMessage]);
        setIsLoading(false);
      }, 1500);

    } catch (error) {
      console.error("AI Error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-3xl shadow-sm border border-primary/5 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-primary/5 bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-primary flex items-center gap-2">
              Cố vấn Smart Boarding
              <Sparkles size={14} className="text-accent" />
            </h3>
            <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Trợ lý AI phân tích sư phạm</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-primary/5 rounded-xl transition-colors text-primary/40">
            <Info size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        <AnimatePresence initial={false}>
          {messages.map((m, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex gap-3 max-w-[85%]",
                m.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                m.role === 'assistant' ? "bg-primary text-white" : "bg-accent text-white"
              )}>
                {m.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
              </div>
              <div className={cn(
                "p-4 rounded-2xl text-xs leading-relaxed shadow-sm",
                m.role === 'assistant' 
                  ? "bg-white border border-primary/5 text-primary rounded-tl-none" 
                  : "bg-accent text-white rounded-tr-none font-medium"
              )}>
                {m.content}
                <div className={cn(
                  "mt-2 text-[9px] font-bold uppercase tracking-widest opacity-40",
                  m.role === 'user' ? "text-white" : "text-primary/40"
                )}>
                  {format(m.timestamp, 'HH:mm')}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center">
              <Bot size={14} />
            </div>
            <div className="bg-white border border-primary/5 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
              <div className="flex gap-1">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-primary/20 rounded-full" />
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary/40 rounded-full" />
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary/60 rounded-full" />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Actions */}
      {messages.length === 1 && (
        <div className="px-6 py-3 bg-slate-50/30 flex gap-2 overflow-x-auto no-scrollbar">
          {[
            "Phân tích lớp 10A",
            "Vì sao 12C giảm điểm?",
            "Xu hướng tuần này",
            "Lời khuyên cho Model Dorm"
          ].map(action => (
            <button
              key={action}
              onClick={() => { setInput(action); handleSend(); }}
              className="px-3 py-1.5 bg-white border border-primary/10 rounded-full text-[10px] font-bold text-primary/60 hover:border-primary/30 transition-all whitespace-nowrap shadow-sm hover:translate-y-[-1px]"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-primary/5 bg-white">
        <div className="relative flex items-center gap-2">
          <div className="absolute left-4 text-primary/20">
            <Brain size={18} />
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Đặt câu hỏi cho Cố vấn AI..."
            className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-14 text-xs font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-primary/20"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              "absolute right-2 p-3 rounded-xl transition-all shadow-md",
              input.trim() && !isLoading 
                ? "bg-primary text-white hover:bg-primary/90 hover:scale-105 active:scale-95" 
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            )}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
