import React from 'react';
import { cn } from '../lib/utils';

export function ManualInput({ placeholder, value, onChange }: { placeholder: string, value: string, onChange: (val: string) => void }) {
  return (
    <input 
      type="text"
      className="w-full p-2.5 rounded-xl border border-primary/10 bg-white focus:border-accent/30 focus:ring-0 transition-all text-xs italic"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function ScoreCard({ icon, label, score, max }: { icon: React.ReactNode, label: string, score: number, max: number }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-primary/5 flex flex-col items-center text-center gap-1">
      <div className="text-primary/40 mb-1">{icon}</div>
      <span className="text-[10px] font-bold text-primary/40 uppercase tracking-wider">{label}</span>
      <div className="flex items-baseline gap-0.5">
        <span className={cn(
          "text-2xl font-black",
          score === max ? "text-primary" : score > 0 ? "text-accent" : "text-red-500"
        )}>
          {score.toLocaleString('vi-VN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
        </span>
        <span className="text-[10px] text-primary/20 font-bold">/{max}</span>
      </div>
    </div>
  );
}
