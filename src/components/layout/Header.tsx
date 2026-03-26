import React, { useState } from 'react';
import { ClipboardCheck, Mountain, User, LogIn, Settings, X, ExternalLink } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { cn } from '../../lib/utils';

interface HeaderProps {
  user: FirebaseUser | null;
  loginWithGoogle: () => void;
  logout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, loginWithGoogle, logout }) => {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState(localStorage.getItem('gemini_api_key') || '');

  const saveKey = () => {
    localStorage.setItem('gemini_api_key', tempKey);
    setShowKeyModal(false);
    window.location.reload(); // Refresh to apply key to service
  };

  return (
    <header className="bg-primary text-secondary py-8 px-6 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
        <Mountain size={200} />
      </div>
      <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent rounded-2xl shadow-inner">
            <ClipboardCheck size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Smart Boarding 4.0</h1>
            <p className="text-[10px] font-bold text-accent uppercase tracking-widest mt-1 opacity-80">Giải pháp Số hóa Nề nếp và Học tập</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* API Settings Button */}
          <div className="flex flex-col items-end">
            <button 
              onClick={() => setShowKeyModal(true)}
              className="group flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 rounded-xl transition-all"
            >
              <Settings size={16} className="text-white group-hover:rotate-45 transition-transform" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Cài đặt API</span>
            </button>
            <a 
              href="https://aistudio.google.com/api-keys" 
              target="_blank" 
              rel="noreferrer"
              className="text-[9px] font-bold text-red-400 uppercase tracking-tighter mt-1 hover:text-red-300 transition-colors animate-pulse"
            >
              Lấy API key để sử dụng app
            </a>
          </div>

          <div className="h-8 w-px bg-white/10" />

          {user ? (
            <div className="flex items-center gap-3 bg-white/5 p-2 pr-4 rounded-2xl border border-white/10">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-10 h-10 rounded-xl shadow-sm" />
              ) : (
                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">{user.displayName}</span>
                <button 
                  onClick={logout} 
                  className="text-[10px] font-bold text-accent uppercase tracking-widest text-left hover:text-accent/80 transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={loginWithGoogle}
              className="flex items-center gap-2 bg-white text-primary px-5 py-2.5 rounded-2xl font-bold text-sm shadow-lg hover:bg-secondary transition-all"
            >
              <LogIn size={18} />
              Đăng nhập
            </button>
          )}
        </div>
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-primary/5 flex items-center justify-between bg-primary/5">
              <h3 className="text-sm font-black text-primary uppercase tracking-widest">Cài đặt Gemini API</h3>
              <button 
                onClick={() => setShowKeyModal(false)}
                className="p-2 hover:bg-red-50 text-primary/40 hover:text-red-500 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-primary/40 uppercase tracking-widest ml-1">Nhập API Key</label>
                <input 
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="XxxXxx..."
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-xs font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                <ExternalLink size={20} className="text-blue-500 shrink-0" />
                <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                  Truy cập <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noreferrer" className="underline font-bold">Google AI Studio</a> để lấy API Key miễn phí cho ứng dụng của bạn.
                </p>
              </div>
              <button 
                onClick={saveKey}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
