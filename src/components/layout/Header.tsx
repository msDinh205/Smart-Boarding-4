import React from 'react';
import { ClipboardCheck, Mountain, User, LogIn } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface HeaderProps {
  user: FirebaseUser | null;
  loginWithGoogle: () => void;
  logout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, loginWithGoogle, logout }) => {
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
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Smart Boarding 4.0: Giải pháp Số hóa Nề nếp và Học tập</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
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
              Đăng nhập Google
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
