import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot,
  limit,
  where
} from 'firebase/firestore';

import { getYear, getWeek } from 'date-fns';

// Component Imports
import { Header } from './components/layout/Header';
import { DisciplineInput } from './components/discipline/DisciplineInput';
import { WeeklySummary } from './components/discipline/WeeklySummary';
import { Dashboard } from './components/dashboard/Dashboard';
import { AICounselor } from './components/dashboard/AICounselor';

// Service & Type Imports
import { analyzeDiscipline } from './services/geminiService';
import { AnalysisResult } from './types';
import { 
  auth, 
  db, 
  loginWithGoogle, 
  logout, 
  handleFirestoreError, 
  OperationType 
} from './firebase';

export default function App() {
  const CLASSES = [
    '6A', '6B', '7A', '7B', '7C', '8A', '8B', '9A', '9B', '10A', '10B', '11A', '11B', '12A', '12B'
  ];

  const [className, setClassName] = useState(CLASSES[0]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [view, setView] = useState<'input' | 'dashboard' | 'counselor'>('dashboard');
  const [subView, setSubView] = useState<'daily' | 'weekly'>('daily');
  const [history, setHistory] = useState<any[]>([]);
  const [journalScore, setJournalScore] = useState<number>(10);
  const [goodGradesCount, setGoodGradesCount] = useState<number>(0);
  const [dashboardFilter, setDashboardFilter] = useState({
    class: 'All',
    startDate: '',
    endDate: ''
  });
  
  const [uniformImage, setUniformImage] = useState<string | null>(null);
  const [diningImage, setDiningImage] = useState<string | null>(null);
  const [cleaningImage, setCleaningImage] = useState<string | null>(null);
  const [manualNotes, setManualNotes] = useState({
    classDiscipline: '',
    dorm: '',
    dining: '',
    cleaning: ''
  });
  const [dormRooms, setDormRooms] = useState<{ id: number; score: number; image: string | null; notes: string }[]>([
    { id: 1, score: 3, image: null, notes: '' }
  ]);
  const [attendanceData, setAttendanceData] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [verified, setVerified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dailyScores, setDailyScores] = useState({
    friday: 10, saturday: 10, sunday: 10, monday: 10, tuesday: 10, wednesday: 10, thursday: 10
  });
  const [weeklyViolations, setWeeklyViolations] = useState<string[]>([]);
  const [weeklySummaries, setWeeklySummaries] = useState<any[]>([]);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Fetch history
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'daily_scores'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsubHistory = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'daily_scores');
    });

    const qWeekly = query(collection(db, 'weekly_summaries'), orderBy('createdAt', 'desc'), limit(20));
    const unsubWeekly = onSnapshot(qWeekly, (snapshot) => {
      setWeeklySummaries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'weekly_summaries');
    });

    return () => {
      unsubHistory();
      unsubWeekly();
    };
  }, [user]);

  // Update manualNotes.dorm when dormRooms change
  useEffect(() => {
    const avg = dormRooms.reduce((a, b) => a + b.score, 0) / dormRooms.length;
    const roundedAvg = Math.round(avg * 1000) / 1000;
    const details = dormRooms.map(r => `P${r.id}: ${r.score}đ${r.notes ? ` (${r.notes})` : ''}`).join(', ');
    setManualNotes(prev => ({ 
      ...prev, 
      dorm: `Điểm trung bình ${dormRooms.length} phòng: ${roundedAvg}đ. Chi tiết: ${details}` 
    }));
  }, [dormRooms]);

  // Fetch daily scores for the current competition week
  useEffect(() => {
    if (!user || !className || !selectedDate) return;

    const date = new Date(selectedDate);
    const daysSinceFriday = (date.getDay() + 2) % 7;
    const friday = new Date(date);
    friday.setDate(date.getDate() - daysSinceFriday);
    friday.setHours(0, 0, 0, 0);

    const thursday = new Date(friday);
    thursday.setDate(friday.getDate() + 6);
    thursday.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, 'daily_scores'),
      where('className', '==', className),
      where('date', '>=', friday.toISOString().split('T')[0]),
      where('date', '<=', thursday.toISOString().split('T')[0])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const scores = {
        friday: 10, saturday: 10, sunday: 10, monday: 10, tuesday: 10, wednesday: 10, thursday: 10
      };
      const violations: string[] = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const docDate = new Date(data.date);
        const dayMapping: Record<number, string> = {
          0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday'
        };
        const dayKey = dayMapping[docDate.getDay()];
        if (dayKey in scores) {
          (scores as any)[dayKey] = data.score ?? 10;
        }
        if (data.details) {
          violations.push(`${data.date}: ${data.details}`);
        }
      });

      setDailyScores(scores);
      setWeeklyViolations(violations);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'daily_scores');
    });

    return () => unsubscribe();
  }, [user, className, selectedDate]);

  const handleSaveWeekly = async (data: any) => {
    if (!user) {
      alert("Vui lòng đăng nhập để lưu.");
      return;
    }
    setSaving(true);
    try {
      const weeklyData = {
        ...data,
        authorUid: user.uid,
        createdAt: serverTimestamp(),
        // Format a unique ID for the week to avoid duplicates (e.g., class_year_week)
        weekId: `${data.className}_${getYear(new Date(selectedDate))}_${getWeek(new Date(selectedDate))}`
      };
      await addDoc(collection(db, 'weekly_summaries'), weeklyData);
      alert("Đã lưu tổng kết tuần thành công!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'weekly_summaries');
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async () => {
    if (!className) {
      alert("Vui lòng nhập tên lớp.");
      return;
    }
    setLoading(true);
    setVerified(false);
    try {
      const data = await analyzeDiscipline(
        className,
        selectedDate,
        dormRooms.map(r => r.image).filter(Boolean) as string[],
        uniformImage || undefined,
        diningImage || undefined,
        cleaningImage || undefined,
        attendanceData || undefined,
        manualNotes
      );
      setResult(data);
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Có lỗi xảy ra trong quá trình phân tích.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!user || !result) return;
    setSaving(true);
    try {
      const dailyData = {
        className: className,
        date: selectedDate,
        score: result.scores.disciplineTotal,
        scores: result.scores,
        details: result.pedagogicalMessage,
        authorUid: user.uid,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'daily_scores'), dailyData);
      setVerified(true);
      alert("Đã phê duyệt và lưu kết quả thành công!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'daily_scores');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bản ghi này?")) return;
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'daily_scores', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'daily_scores');
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50/50">
      <Header user={user} loginWithGoogle={loginWithGoogle} logout={logout} />

      <div className="bg-white border-b border-primary/5 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 flex items-center gap-8">
          <button 
            onClick={() => setView('input')}
            className={`py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
              view === 'input' ? "border-accent text-primary" : "border-transparent text-primary/40 hover:text-primary/60"
            }`}
          >
            Chấm điểm mới
          </button>
          <button 
            onClick={() => setView('dashboard')}
            className={`py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
              view === 'dashboard' ? "border-accent text-primary" : "border-transparent text-primary/40 hover:text-primary/60"
            }`}
          >
            Bảng tổng hợp
          </button>
          <button 
            onClick={() => setView('counselor')}
            className={`py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
              view === 'counselor' ? "border-accent text-primary" : "border-transparent text-primary/40 hover:text-primary/60"
            }`}
          >
            Cố vấn AI
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6">
        {view === 'input' ? (
          subView === 'daily' ? (
            <DisciplineInput
              CLASSES={CLASSES}
              className={className}
              setClassName={setClassName}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              subView={subView}
              setSubView={setSubView}
              uniformImage={uniformImage}
              setUniformImage={setUniformImage}
              diningImage={diningImage}
              setDiningImage={setDiningImage}
              cleaningImage={cleaningImage}
              setCleaningImage={setCleaningImage}
              manualNotes={manualNotes}
              setManualNotes={setManualNotes}
              dormRooms={dormRooms}
              setDormRooms={setDormRooms}
              attendanceData={attendanceData}
              setAttendanceData={setAttendanceData}
              loading={loading}
              result={result}
              handleAnalyze={handleAnalyze}
              handleVerify={handleVerify}
              verified={verified}
              saving={saving}
              dailyScores={dailyScores}
            />
          ) : (
            <WeeklySummary
              className={className}
              dailyScores={dailyScores}
              goodGradesCount={goodGradesCount}
              setGoodGradesCount={setGoodGradesCount}
              journalScore={journalScore}
              setJournalScore={setJournalScore}
              weeklyViolations={weeklyViolations}
              onSave={handleSaveWeekly}
              saving={saving}
            />
          )
        ) : view === 'counselor' ? (
          <AICounselor
            history={history}
            weeklySummaries={weeklySummaries}
          />
        ) : (
          <Dashboard
            history={history}
            weeklySummaries={weeklySummaries}
            filter={dashboardFilter}
            setFilter={setDashboardFilter}
            onDelete={handleDelete}
            classes={CLASSES}
          />
        )}
      </main>

      <footer className="py-8 px-6 border-t border-primary/5 text-center text-primary/40 text-[10px] font-bold uppercase tracking-widest">
        Smart Boarding 4.0 &copy; 2026
      </footer>
    </div>
  );
}
