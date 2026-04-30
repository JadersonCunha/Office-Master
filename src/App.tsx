/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Search, 
  BookOpen, 
  Zap, 
  Gamepad2, 
  Table, 
  FileText, 
  Presentation, 
  X, 
  CheckCircle2, 
  Star,
  Award,
  ArrowRight,
  TrendingUp,
  Settings,
  CircleHelp,
  ChevronRight,
  MessageSquare,
  Send,
  Loader2,
  Lock,
  Compass,
  LayoutGrid,
  Cloud,
  Key,
  History,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { cn } from './lib/utils';

// Firestore Error Handler
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
import { SHORTCUTS, TIPS, EXERCISES, BADGES, SURVIVAL_TOPICS, FAQS } from './data';
import { Program, UserStats, Shortcut, Tip, Exercise } from './types';

// Safe access to Gemini API Key
const GEMINI_KEY = (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) 
  ? process.env.GEMINI_API_KEY 
  : '';

const ai = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;

const INITIAL_STATS: UserStats = {
  xp: 0,
  level: 1,
  completedExercises: [],
  readTips: [],
  unlockedBadges: [],
  survivalManualUnlocked: false,
};

const LEVEL_XP = 150;

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'student' | 'instructor'>('student');
  const [activeProgram, setActiveProgram] = useState<Program>('Excel');
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [view, setView] = useState<'dashboard' | 'profile' | 'survival'>('dashboard');
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant', text: string}[]>([]);
  const [chatSessions, setChatSessions] = useState<{id: string, title: string, timestamp: any}[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [showTurmaModal, setShowTurmaModal] = useState(false);
  const [turmaCode, setTurmaCode] = useState('');
  const [turmaName, setTurmaName] = useState('');

  // Turma Logic
  useEffect(() => {
    if (!user) return;
    
    const turmasQuery = query(
      collection(db, 'turmas'),
      where('memberIds', 'array-contains', user.uid)
    );
    
    const instructorQuery = query(
      collection(db, 'turmas'),
      where('instructorId', '==', user.uid)
    );

    const unsubTurmas = onSnapshot(turmasQuery, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setTurmas(prev => {
        // Merge without duplicates
        const combined = [...prev, ...docs];
        return Array.from(new Map(combined.map(item => [item.id, item])).values());
      });
    });

    const unsubInstructor = onSnapshot(instructorQuery, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setTurmas(prev => {
        const combined = [...prev, ...docs];
        return Array.from(new Map(combined.map(item => [item.id, item])).values());
      });
    });

    return () => {
      unsubTurmas();
      unsubInstructor();
    };
  }, [user]);

  const createTurma = async () => {
    if (!user || !turmaName) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      await addDoc(collection(db, 'turmas'), {
        name: turmaName,
        instructorId: user.uid,
        memberIds: [user.uid],
        code,
        createdAt: serverTimestamp(),
      });
      // also ensure user is instructor role
      if (userRole !== 'instructor') {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { role: 'instructor' });
        setUserRole('instructor');
      }
      setTurmaName('');
      setShowTurmaModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'turmas');
    }
  };

  const joinTurma = async () => {
    if (!user || !turmaCode) return;
    try {
      const q = query(collection(db, 'turmas'), where('code', '==', turmaCode.toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        alert("Código de turma inválido.");
        return;
      }
      const turmaDoc = snap.docs[0];
      const data = turmaDoc.data();
      if (!data.memberIds.includes(user.uid)) {
        await updateDoc(doc(db, 'turmas', turmaDoc.id), {
          memberIds: [...data.memberIds, user.uid]
        });
      }
      setTurmaCode('');
      setShowTurmaModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'turmas');
    }
  };

  // Auth & Sync Logic
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        const userDocRef = doc(db, 'users', authUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            setStats({
              xp: data.xp || 0,
              level: data.level || 1,
              completedExercises: data.completedExercises || [],
              readTips: data.readTips || [],
              unlockedBadges: data.unlockedBadges || [],
              survivalManualUnlocked: data.survivalManualUnlocked || false,
            });
            setUserRole(data.role || 'student');
          } else {
            // First time user
            const initialData = {
              ...INITIAL_STATS,
              role: 'student',
              displayName: authUser.displayName,
              email: authUser.email,
              photoURL: authUser.photoURL,
              createdAt: serverTimestamp(),
            };
            await setDoc(userDocRef, initialData);
            setStats(INITIAL_STATS);
            setUserRole('student');
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${authUser.uid}`);
        }
      } else {
        setStats(INITIAL_STATS);
        setUserRole('student');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync Stats to Firestore
  const syncStats = async (newStats: UserStats) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userDocRef, { ...newStats });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const unlockSurvival = () => {
    setRequestingAccess(true);
    setTimeout(() => {
      const newStats = { ...stats, survivalManualUnlocked: true };
      setStats(newStats);
      syncStats(newStats);
      setRequestingAccess(false);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }, 2000);
  };

  // Load Chat History for a User
  useEffect(() => {
    if (!user) return;

    // Load recent "sessions" (using top-level user messages as starters)
    const chatsRef = collection(db, 'users', user.uid, 'chatSessions');
    const q = query(chatsRef, orderBy('updatedAt', 'desc'), limit(20));

    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as any[];
      setChatSessions(docs);
    });

    return () => unsub();
  }, [user]);

  // Load messages for active session
  useEffect(() => {
    if (!user || !activeSessionId) {
      setChatHistory([]);
      return;
    }

    const messagesRef = collection(db, 'users', user.uid, 'chatSessions', activeSessionId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({
        role: d.data().role,
        text: d.data().text
      })) as {role: 'user' | 'assistant', text: string}[];
      setChatHistory(msgs);
    });

    return () => unsub();
  }, [user, activeSessionId]);

  const handleSendMessage = async (msgOverride?: string) => {
    const textToSend = msgOverride || chatMessage;
    if (!textToSend.trim() || isSearching || !user) return;
    
    const tempUserMsg = { role: 'user' as const, text: textToSend };
    
    // If no active session, create one
    let sessionId = activeSessionId;
    if (!sessionId) {
      try {
        const sessionRef = await addDoc(collection(db, 'users', user.uid, 'chatSessions'), {
          title: textToSend.substring(0, 40) + (textToSend.length > 40 ? '...' : ''),
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        });
        sessionId = sessionRef.id;
        setActiveSessionId(sessionId);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'chatSessions');
        return;
      }
    }

    // Save User Message
    try {
      await addDoc(collection(db, 'users', user.uid, 'chatSessions', sessionId, 'messages'), {
        role: 'user',
        text: textToSend,
        timestamp: serverTimestamp()
      });
      await updateDoc(doc(db, 'users', user.uid, 'chatSessions', sessionId), {
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'messages');
    }

    setChatMessage('');
    setIsSearching(true);
    
    if (view !== 'survival') {
      setView('survival');
    }

    if (!ai) {
      const errorMsg = "A chave da API Gemini não foi configurada. Por favor, adicione GEMINI_API_KEY no arquivo .env.";
      await addDoc(collection(db, 'users', user.uid, 'chatSessions', sessionId, 'messages'), {
        role: 'assistant',
        text: errorMsg,
        timestamp: serverTimestamp()
      });
      setIsSearching(false);
      return;
    }

    try {
      const model = ai.getGenerativeModel({
        model: "gemini-1.5-flash",
        tools: [{ googleSearchRetrieval: {} }],
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: textToSend }] }],
        generationConfig: { maxOutputTokens: 1000 }
      });

      const response = await result.response;
      const assistantMsg = response.text() || "Desculpe, não consegui encontrar uma resposta detalhada no momento.";
      
      // Save Assistant Message
      await addDoc(collection(db, 'users', user.uid, 'chatSessions', sessionId, 'messages'), {
        role: 'assistant',
        text: assistantMsg,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      const errorMsg = "Erro ao buscar informações na internet. Certifique-se de que a API Key está configurada corretamente.";
      await addDoc(collection(db, 'users', user.uid, 'chatSessions', sessionId, 'messages'), {
        role: 'assistant',
        text: errorMsg,
        timestamp: serverTimestamp()
      });
    } finally {
      setIsSearching(false);
    }
  };

  const addXP = (amount: number, type: 'exercise' | 'tip', id: string) => {
    if (type === 'exercise' && stats.completedExercises.includes(id)) return;
    if (type === 'tip' && stats.readTips.includes(id)) return;

    const newXP = stats.xp + amount;
    const newLevel = Math.floor(newXP / LEVEL_XP) + 1;
    const newStats = {
      ...stats,
      xp: newXP,
      level: newLevel,
      completedExercises: type === 'exercise' ? [...stats.completedExercises, id] : stats.completedExercises,
      readTips: type === 'tip' ? [...stats.readTips, id] : stats.readTips,
    };
    
    if (newLevel > stats.level) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#217346', '#2b579a', '#b7472a']
      });
    }

    setStats(newStats);
    syncStats(newStats);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando sua jornada...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-12 text-center space-y-8 border border-slate-200">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl mx-auto rotate-3">
            <Trophy size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900 leading-tight">Mestre do Office</h1>
            <p className="text-slate-500 font-medium">Sua jornada para dominar Excel, Word, PowerPoint e Workspace começa aqui.</p>
          </div>
          <button 
            onClick={login}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3"
          >
            Entrar com Google <ArrowRight size={18} />
          </button>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Acesso seguro via Firebase Auth</p>
        </div>
      </div>
    );
  }

  const currentLevelXP = stats.xp % LEVEL_XP;
  const progressPercent = (currentLevelXP / LEVEL_XP) * 100;

  const filteredShortcuts = SHORTCUTS.filter(s => 
    s.program === activeProgram && 
    (s.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
     s.keys.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const programs = [
    { name: 'Excel' as Program, icon: Table, color: 'text-excel', bg: 'bg-excel/10', border: 'border-excel/20', solid: 'bg-excel' },
    { name: 'Word' as Program, icon: FileText, color: 'text-word', bg: 'bg-word/10', border: 'border-word/20', solid: 'bg-word' },
    { name: 'PowerPoint' as Program, icon: Presentation, color: 'text-powerpoint', bg: 'bg-powerpoint/10', border: 'border-powerpoint/20', solid: 'bg-powerpoint' },
    { name: 'Workspace' as Program, icon: Cloud, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', solid: 'bg-indigo-600' },
  ];

  const currentProgramInfo = programs.find(p => p.name === activeProgram)!;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* 1. Navigation Rail - Fixed Left */}
      <nav className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-10 z-50">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
          <Trophy size={24} />
        </div>

        <div className="flex flex-col gap-4 flex-1">
          {programs.map((p) => (
            <button
              key={p.name}
              onClick={() => { setActiveProgram(p.name); setView('dashboard'); }}
              className={cn(
                "nav-rail-item group",
                activeProgram === p.name ? p.bg + " " + p.color : "text-slate-400 hover:bg-slate-50"
              )}
            >
              <p.icon size={22} strokeWidth={activeProgram === p.name ? 2.5 : 2} />
              {activeProgram === p.name && (
                <motion.div 
                  layoutId="active-indicator"
                  className={cn("absolute -left-0 w-1 h-6 rounded-r-full", p.solid)}
                />
              )}
              {/* Tooltip */}
              <span className="absolute left-16 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-bold uppercase tracking-wider">
                {p.name}
              </span>
            </button>
          ))}
          
          <div className="h-px w-8 bg-slate-100 mx-auto my-2" />
          
          <button 
            onClick={() => setView('survival')}
            className={cn(
              "nav-rail-item group",
              view === 'survival' ? "bg-emerald-100 text-emerald-600" : "text-slate-400 hover:bg-slate-50"
            )}
          >
            <Compass size={22} />
          </button>

          <button 
            onClick={() => setView('profile')}
            className={cn(
              "nav-rail-item group",
              view === 'profile' ? "bg-amber-100 text-amber-600" : "text-slate-400 hover:bg-slate-50"
            )}
          >
            <Award size={22} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <button className="nav-rail-item group text-slate-300 hover:text-slate-600"><CircleHelp size={22} /></button>
          <button className="nav-rail-item group text-slate-300 hover:text-slate-600"><Settings size={22} /></button>
        </div>
      </nav>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Dynamic Background */}
        <div className={cn(
          "absolute top-0 right-0 w-1/2 h-1/2 opacity-20 blur-[120px] pointer-events-none transition-colors duration-1000",
          activeProgram === 'Excel' ? "bg-excel" : activeProgram === 'Word' ? "bg-word" : activeProgram === 'Workspace' ? "bg-indigo-600" : "bg-powerpoint"
        )} />

        {/* Top Header */}
        <header className="h-20 border-b border-slate-200 bg-white/50 backdrop-blur-xl px-8 flex items-center justify-between z-40">
          <div className="flex items-center gap-4">
            <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-sm", currentProgramInfo.solid)}>
              PRO MODE ACTIVATED
            </div>
            <h1 className="text-xl font-bold font-sans tracking-tight">
              {view === 'dashboard' ? `Dominando o ${activeProgram === 'Workspace' ? 'Google Workspace' : activeProgram}` : 
               view === 'survival' ? 'Manual de Sobrevivência' :
               'Sua Jornada de Mestre'}
            </h1>
          </div>

          <div className="flex items-center gap-8">
            {/* Level Bar */}
            <div className="hidden lg:flex items-center gap-4 w-64 bg-white/80 p-1.5 rounded-2xl border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-700">
                {stats.level}
              </div>
              <div className="flex-1 pr-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  <span>Progressão</span>
                  <span>{progressPercent.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className={cn("h-full", currentProgramInfo.solid)}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-500 font-mono">{stats.xp} XP</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Ranking Global #42</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                <span className="text-sm font-bold text-slate-500">JP</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable View */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {view === 'dashboard' ? (
            <div className="max-w-7xl mx-auto space-y-10">
              {/* Top Bento Grid Section */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Search & Shortcuts */}
                <div className="md:col-span-8 flex flex-col gap-6">
                  <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input 
                      type="text" 
                      placeholder={`Qual função ou atalho deseja encontrar hoje no ${activeProgram}?`}
                      className="w-full pl-14 pr-32 py-5 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm font-medium focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-slate-700"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchQuery.trim()) {
                          handleSendMessage(searchQuery);
                        }
                      }}
                    />
                    {searchQuery.trim() && (
                      <button 
                        onClick={() => handleSendMessage(searchQuery)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
                      >
                        <MessageSquare size={14} /> Consultar IA
                      </button>
                    )}
                  </div>

                  {filteredShortcuts.length === 0 && searchQuery.trim().length > 0 && (
                    <div className="bg-white/50 backdrop-blur-sm border border-slate-200 p-10 rounded-[2rem] text-center space-y-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mx-auto">
                        <Search size={32} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Nenhum atalho encontrado</p>
                        <p className="text-slate-400 text-sm font-medium">Não encontramos um atalho local para sua pesquisa. Deseja perguntar à nossa IA que busca na internet?</p>
                      </div>
                      <button 
                        onClick={() => handleSendMessage(searchQuery)}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all inline-flex items-center gap-3"
                      >
                        <Compass size={16} /> Pesquisar com IA Especialista
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredShortcuts.map((s, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={s.id} 
                        className="bento-card group flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md", currentProgramInfo.bg, currentProgramInfo.color)}>
                              {s.category}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-800 text-lg group-hover:text-ink transition-colors">{s.action}</h4>
                        </div>
                        <div className="mt-4 flex gap-2">
                          {s.keys.split('+').map((key, i) => (
                            <kbd 
                              key={i}
                              className="bg-slate- surface border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-600 shadow-sm"
                            >
                              {key.trim()}
                            </kbd>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Right Bento Column: Stats & Recommendations */}
                <div className="md:col-span-4 flex flex-col gap-6">
                  {/* Daily Streak Card */}
                  <div className="bento-card bg-indigo-600 text-white border-0 !shadow-indigo-200">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-white/20 rounded-2xl">
                        <TrendingUp size={24} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Status Diário</span>
                    </div>
                    <h3 className="text-2xl font-black mb-2">Fogo nos Estudos!</h3>
                    <p className="text-white/70 text-sm leading-relaxed mb-6">Você completou {stats.completedExercises.length} exercícios esta semana. Mantenha o ritmo para ganhar o bônus de XP!</p>
                    <div className="flex items-center gap-2 text-sm font-bold bg-white text-indigo-600 w-fit px-4 py-2 rounded-2xl">
                      Ganhar +100 XP <ChevronRight size={16} />
                    </div>
                  </div>

                  {/* Highlights / Quick Tip */}
                  <div className="bento-card">
                    <div className="flex items-center gap-2 mb-4 text-amber-500">
                      <Zap size={20} fill="currentColor" />
                      <span className="text-xs font-black uppercase tracking-widest">Dica Rápida</span>
                    </div>
                    {TIPS.filter(t => t.program === activeProgram).slice(0, 1).map(tip => (
                      <div key={tip.id} className="space-y-4">
                        <h4 className="font-bold text-slate-800 text-lg leading-snug">{tip.title}</h4>
                        <p className="text-slate-500 text-sm line-clamp-2">{tip.description}</p>
                        <button 
                          onClick={() => setSelectedTip(tip)}
                          className="flex items-center gap-2 text-indigo-600 font-bold text-sm"
                        >
                          Explorar Método <ArrowRight size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sections: Learning Center */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <section className="space-y-6">
                  <header className="flex items-center justify-between">
                    <h2 className="text-2xl font-black flex items-center gap-3">
                      <BookOpen size={28} className="text-indigo-500" /> Centro de Tutoriais
                    </h2>
                  </header>
                  <div className="grid grid-cols-1 gap-4">
                    {TIPS.filter(t => t.program === activeProgram).map(tip => (
                      <button
                        key={tip.id}
                        onClick={() => setSelectedTip(tip)}
                        className="w-full text-left bg-white p-6 rounded-[2rem] border border-slate-200/60 hover:border-indigo-400 group relative transition-all"
                      >
                        <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 mb-2">{tip.title}</h4>
                        <p className="text-slate-500 text-sm font-medium">{tip.description}</p>
                        {stats.readTips.includes(tip.id) && (
                          <div className="absolute top-6 right-6 text-green-500">
                            <CheckCircle2 size={24} />
                          </div>
                        )}
                        <div className="mt-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Tutorial Disponível <ChevronRight size={12} />
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-6">
                  <header className="flex items-center justify-between">
                    <h2 className="text-2xl font-black flex items-center gap-3">
                      <Gamepad2 size={28} className="text-rose-500" /> Laboratório Prático
                    </h2>
                  </header>
                  <div className="grid grid-cols-1 gap-4">
                    {EXERCISES.filter(e => e.program === activeProgram).map(exe => (
                      <button
                        key={exe.id}
                        onClick={() => setSelectedExercise(exe)}
                        className="w-full text-left bento-card relative !py-6"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className={cn(
                            "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                            exe.difficulty === 'Fácil' ? "bg-green-50 text-green-700 border-green-200" :
                            exe.difficulty === 'Médio' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                            "bg-red-50 text-red-700 border-red-200"
                          )}>
                            Nível {exe.difficulty}
                          </div>
                          <div className="text-slate-400 font-mono text-[10px] font-bold">+{exe.xp} XP</div>
                        </div>
                        <h4 className="font-bold text-slate-900 text-lg mb-1">{exe.title}</h4>
                        <p className="text-slate-500 text-sm font-medium mb-4">{exe.task}</p>
                        
                        {stats.completedExercises.includes(exe.id) ? (
                          <div className="w-full py-2 bg-green-50 border border-green-100 rounded-xl flex items-center justify-center gap-2 text-green-600 text-xs font-bold">
                            <CheckCircle2 size={16} /> Concluído
                          </div>
                        ) : (
                          <div className="w-full py-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center gap-2 text-slate-600 text-xs font-bold group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                            Iniciar Desafio <ArrowRight size={16} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          ) : view === 'survival' ? (
            /* Survival Manual View */
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-8">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">Especialista Office</h2>
                  <p className="text-slate-500 font-medium font-sans">Busca inteligente em fontes confiáveis da internet.</p>
                </div>
              </div>

              {/* Chat is ALWAYS available now */}
              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                    <MessageSquare size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black tracking-tight">Chat de Busca Inteligente</h3>
                    <p className="text-slate-500 text-sm font-medium">Faça qualquer pergunta sobre ferramentas do Office</p>
                  </div>
                </div>

                <div className="bento-card !p-0 bg-white border border-slate-200 overflow-hidden flex h-[600px] shadow-2xl rounded-[3rem]">
                  {/* Sidebar with History */}
                  <div className="w-64 bg-slate-50 border-r border-slate-100 flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <History size={14} /> Histórico
                      </h4>
                      <button 
                        onClick={() => setActiveSessionId(null)}
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-indigo-600 transition-colors"
                        title="Nova Conversa"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                      {chatSessions.length === 0 ? (
                        <div className="py-8 px-4 text-center">
                          <p className="text-[10px] font-bold text-slate-400 leading-tight">Nenhuma conversa anterior</p>
                        </div>
                      ) : (
                        chatSessions.map((session) => (
                          <button
                            key={session.id}
                            onClick={() => setActiveSessionId(session.id)}
                            className={cn(
                              "w-full text-left px-3 py-3 rounded-2xl text-xs font-medium transition-all group relative",
                              activeSessionId === session.id 
                                ? "bg-white text-indigo-600 shadow-sm border border-indigo-100" 
                                : "text-slate-500 hover:bg-slate-100"
                            )}
                          >
                            <p className="truncate pr-4">{session.title}</p>
                            <ChevronRight size={12} className={cn(
                              "absolute right-2 top-1/2 -translate-y-1/2 transition-opacity",
                              activeSessionId === session.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )} />
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Chat Content */}
                  <div className="flex-1 flex flex-col bg-white">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                      {chatHistory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6 p-8">
                          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-inner border border-indigo-100 rotate-3">
                            <Compass size={40} />
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-xl font-black text-slate-900 leading-tight">Como posso ajudar?</h4>
                            <p className="text-slate-500 font-bold text-sm max-w-xs mx-auto">
                              Explico funções, traduzo fórmulas do Excel ou ajudo com atalhos e erros complexos.
                            </p>
                          </div>
                          <div className="flex flex-wrap justify-center gap-2">
                            {['Procv Excel', 'Fundo PPT', 'Macros Word'].map(s => (
                              <button 
                                key={s}
                                onClick={() => handleSendMessage(s)}
                                className="px-4 py-2 bg-slate-100 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        chatHistory.map((msg, i) => (
                          <div key={i} className={cn(
                            "flex flex-col max-w-[85%] space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-300",
                            msg.role === 'user' ? "ml-auto items-end" : "items-start"
                          )}>
                            <div className={cn(
                              "p-4 rounded-[1.5rem] text-sm font-medium shadow-sm transition-all",
                              msg.role === 'user' 
                                ? "bg-indigo-600 text-white rounded-tr-none shadow-indigo-100" 
                                : "bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none whitespace-pre-wrap leading-relaxed"
                            )}>
                              {msg.text}
                            </div>
                          </div>
                        ))
                      )}
                      {isSearching && (
                        <div className="flex items-start gap-2 max-w-[85%] animate-pulse">
                          <div className="bg-slate-50 border border-slate-200 p-4 rounded-[1.5rem] rounded-tl-none shadow-sm flex items-center gap-3">
                            <div className="flex gap-1">
                              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></span>
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Consultando Fontes...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Input Area */}
                    <div className="p-6 bg-white border-t border-slate-100">
                      <div className="relative flex items-center gap-3">
                        <input 
                          type="text"
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Pergunte qualquer coisa sobre Office..."
                          className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all pr-14 placeholder:text-slate-400"
                        />
                        <button 
                          onClick={() => handleSendMessage()}
                          disabled={!chatMessage.trim() || isSearching}
                          className="absolute right-2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-indigo-100"
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="h-px bg-slate-200 w-full my-12" />

              {!stats.survivalManualUnlocked ? (
                <div className="py-16 flex flex-col items-center text-center space-y-8 bg-white/50 backdrop-blur-md rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 border border-slate-100 shadow-inner">
                    <Lock size={32} />
                  </div>
                  <div className="space-y-2 max-w-md px-6">
                    <h3 className="text-2xl font-black text-slate-900">Guia de Sobrevivência (Manual)</h3>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed">
                      O manual estruturado com ferramentas básicas e o FAQ está bloqueado. 
                      Apenas o seu instrutor pode liberar o acesso para este módulo.
                    </p>
                  </div>
                  
                  <button 
                    onClick={unlockSurvival}
                    disabled={requestingAccess}
                    className={cn(
                      "flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all shadow-xl",
                      requestingAccess 
                        ? "bg-slate-100 text-slate-400 cursor-wait shadow-none" 
                        : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 hover:-translate-y-1"
                    )}
                  >
                    {requestingAccess ? "Validando Permissão..." : "Solicitar Liberação"}
                  </button>
                </div>
              ) : (
                /* Unlocked Survival Content */
                <div className="space-y-12 pb-20">
                  <section className="space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                        <LayoutGrid size={24} />
                      </div>
                      <h3 className="text-2xl font-black tracking-tight">Funções Fundamentais</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {SURVIVAL_TOPICS.map((topic) => (
                        <div key={topic.id} className="bento-card group hover:border-indigo-500 border-l-4 border-l-indigo-600 !rounded-3xl">
                          <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mb-3 inline-block", 
                            topic.program === 'Excel' ? "bg-excel/10 text-excel" : 
                            topic.program === 'Word' ? "bg-word/10 text-word" : 
                            topic.program === 'Workspace' ? "bg-indigo-100 text-indigo-700" :
                            "bg-powerpoint/10 text-powerpoint"
                          )}>
                            {topic.program}
                          </span>
                          <h4 className="text-xl font-black text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">{topic.title}</h4>
                          <p className="text-slate-500 text-sm leading-relaxed font-medium">{topic.content}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-100">
                        <CircleHelp size={24} />
                      </div>
                      <h3 className="text-2xl font-black tracking-tight">Banco de Perguntas (FAQ)</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {FAQS.filter(f => f.program === activeProgram).map((faq) => (
                        <details key={faq.id} className="group bento-card !p-0 overflow-hidden border border-slate-200/60 bg-white hover:border-emerald-400 transition-all">
                          <summary className="flex items-center justify-between p-6 cursor-pointer list-none select-none">
                            <h4 className="font-bold text-slate-800 text-lg group-open:text-emerald-700 transition-colors pr-8 leading-tight">
                              {faq.question}
                            </h4>
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-open:rotate-90 group-open:bg-emerald-50 group-open:text-emerald-600 transition-all flex-shrink-0">
                              <ChevronRight size={18} />
                            </div>
                          </summary>
                          <div className="px-6 pb-6 pt-2 text-slate-600 text-base leading-relaxed font-medium max-w-3xl">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              {faq.answer}
                            </div>
                          </div>
                        </details>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </div>
          ) : (
            /* Profile & Career View */
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-600 text-white flex items-center justify-center shadow-2xl rotate-3 overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                    ) : (
                      <Star size={64} fill="white" />
                    )}
                  </div>
                  <button 
                    onClick={logout}
                    className="absolute -bottom-2 -right-2 p-2 bg-rose-500 text-white rounded-xl shadow-lg hover:bg-rose-600 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X size={16} />
                  </button>
                </div>
                <h2 className="text-4xl font-black text-slate-900">{user.displayName || 'Mestre'}</h2>
                <p className="text-slate-500 font-medium max-w-md">Nível {stats.level} • {userRole === 'instructor' ? 'Instrutor' : 'Aluno'}</p>
              </div>

              {/* Turmas Section */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black flex items-center gap-3">
                    <LayoutGrid size={24} className="text-indigo-500" /> Minhas Turmas
                  </h2>
                  <button 
                    onClick={() => setShowTurmaModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                  >
                    Gerenciar Turmas
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {turmas.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-white rounded-[2.5rem] border border-slate-200 border-dashed space-y-2">
                      <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Nenhuma turma encontrada</p>
                      <p className="text-slate-500 text-xs">Crie ou entre em uma turma para colaborar com outros alunos.</p>
                    </div>
                  ) : (
                    turmas.map(turma => (
                      <div key={turma.id} className="bento-card border-l-4 border-l-indigo-600 flex justify-between items-center bg-white">
                        <div>
                          <h4 className="font-bold text-slate-900 text-lg">{turma.name}</h4>
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                            <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">{turma.code}</span>
                            <span>• {turma.memberIds.length} Membros</span>
                            {turma.instructorId === user.uid && <span>• Instrutor</span>}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bento-card flex flex-col items-center text-center">
                  <h3 className="text-4xl font-black text-indigo-600 mb-1">{stats.level}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Nível Alcançado</p>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed">Você está à frente de {75 + stats.level}% dos novos usuários.</p>
                </div>
                <div className="bento-card flex flex-col items-center text-center">
                  <h3 className="text-4xl font-black text-rose-600 mb-1">{stats.xp}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Total XP Acumulado</p>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed">Média de {(stats.xp / 7).toFixed(1)} XP por dia esta semana.</p>
                </div>
                <div className="bento-card flex flex-col items-center text-center">
                  <h3 className="text-4xl font-black text-excel mb-1">{stats.completedExercises.length}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Desafios Vencidos</p>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed">Zero erros reportados nos últimos 5 desafios.</p>
                </div>
              </div>

              <section className="space-y-6">
                <h2 className="text-xl font-black flex items-center gap-3">
                  <Award size={24} className="text-amber-500" /> Galeria de Honra
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {BADGES.map((badge) => {
                    const isUnlocked = stats.unlockedBadges.includes(badge.id) || 
                                       (badge.id === 'badge-1' && stats.completedExercises.length > 0);
                    return (
                      <div 
                        key={badge.id}
                        className={cn(
                          "p-6 rounded-[2rem] border-2 flex flex-col items-center text-center transition-all duration-500",
                          isUnlocked 
                            ? "bg-white border-indigo-200 shadow-lg scale-100" 
                            : "bg-slate-50 border-slate-200 opacity-40 grayscale scale-95"
                        )}
                      >
                        <div className={cn(
                          "w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-4 shadow-inner",
                          isUnlocked ? "bg-amber-100 text-amber-600" : "bg-slate-200 text-slate-400"
                        )}>
                          <Award size={32} strokeWidth={2.5} />
                        </div>
                        <h4 className="text-sm font-black text-slate-800 mb-1 leading-tight">{badge.name}</h4>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-tight">{badge.description}</p>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Instructor Panel - Added to allow the user (instructor) to unlock content */}
              <section className="pt-12 mt-12 border-t border-slate-100">
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Settings size={120} />
                  </div>
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3 text-amber-400">
                      <Lock size={24} />
                      <h3 className="text-xl font-black uppercase tracking-widest">Painel do Instrutor</h3>
                    </div>
                    <p className="text-slate-400 text-sm font-medium max-w-md">
                      Espaço reservado para o administrador. Controle o acesso ao Manual de Sobrevivência e outras ferramentas avançadas.
                    </p>
                    <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/10">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                          stats.survivalManualUnlocked ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400"
                        )}>
                          <Compass size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold">Manual de Sobrevivência</h4>
                          <p className="text-xs text-slate-400">{stats.survivalManualUnlocked ? 'Acesso Liberado' : 'Acesso Bloqueado'}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const newStats = { ...stats, survivalManualUnlocked: !stats.survivalManualUnlocked };
                          setStats(newStats);
                          syncStats(newStats);
                        }}
                        className={cn(
                          "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                          stats.survivalManualUnlocked 
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/50 hover:bg-rose-500 hover:text-white" 
                            : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-900/20"
                        )}
                      >
                        {stats.survivalManualUnlocked ? 'Revogar' : 'Liberar para Aluno'}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* 3. Refined Modals */}
      <AnimatePresence>
        {selectedTip && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTip(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200"
            >
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <button 
                  onClick={() => setSelectedTip(null)}
                  className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
                
                <div className="flex items-center gap-4 mb-8">
                  <div className={cn("p-4 rounded-3xl text-white shadow-lg", currentProgramInfo.solid)}>
                    <BookOpen size={32} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block">TUTORIAL AVANÇADO</span>
                    <h2 className="text-3xl font-black text-slate-900 leading-tight">{selectedTip.title}</h2>
                  </div>
                </div>

                <div className="space-y-8">
                  <p className="text-slate-600 text-lg leading-relaxed font-medium">
                    {selectedTip.description}
                  </p>
                  
                  <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200/50 space-y-6">
                    <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
                       Execução Prática
                    </h4>
                    <div className="text-slate-600 leading-relaxed font-medium text-base space-y-4">
                      {selectedTip.fullTutorial.split('. ').map((sentence, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-1">
                            {i+1}
                          </div>
                          <p>{sentence.endsWith('.') ? sentence : sentence + '.'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex justify-center">
                  <button
                    onClick={() => {
                      addXP(selectedTip.xp, 'tip', selectedTip.id);
                      setSelectedTip(null);
                    }}
                    className={cn(
                      "flex items-center justify-center gap-3 w-full max-w-sm py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl",
                      stats.readTips.includes(selectedTip.id)
                        ? "bg-green-50 text-green-600 border border-green-200"
                        : "bg-ink text-white hover:bg-slate-800 shadow-slate-200"
                    )}
                  >
                    {stats.readTips.includes(selectedTip.id) ? (
                      <>CONHECIMENTO ADQUIRIDO <CheckCircle2 size={20} /></>
                    ) : (
                      <>RESGATAR +{selectedTip.xp} XP</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {selectedExercise && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedExercise(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden p-10 border border-slate-200"
            >
              <button 
                onClick={() => setSelectedExercise(null)}
                className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="space-y-8 flex flex-col items-center">
                <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center shadow-inner border border-rose-100">
                  <Gamepad2 size={40} />
                </div>
                
                <div className="text-center">
                  <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em] mb-2 block">MISSÃO ATIVA</span>
                  <h3 className="text-3xl font-black mb-2">{selectedExercise.title}</h3>
                  <p className="text-slate-500 font-bold text-sm">{selectedExercise.task}</p>
                </div>

                <div className="w-full space-y-3">
                  {selectedExercise.instructions.map((step, i) => (
                    <div key={i} className="flex gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex-shrink-0 flex items-center justify-center text-xs font-black text-indigo-600 shadow-sm">
                        {i + 1}
                      </div>
                      <p className="text-slate-700 font-bold text-sm pt-2.5 leading-snug">{step}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    addXP(selectedExercise.xp, 'exercise', selectedExercise.id);
                    setSelectedExercise(null);
                  }}
                  className={cn(
                    "w-full flex items-center justify-center gap-3 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl",
                    stats.completedExercises.includes(selectedExercise.id)
                      ? "bg-slate-100 text-slate-400 cursor-default shadow-none"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
                  )}
                >
                  {stats.completedExercises.includes(selectedExercise.id) ? (
                    <>DESAFIO CUMPRIDO</>
                  ) : (
                    <>FINALIZAR DESAFIO (+{selectedExercise.xp} XP)</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {showTurmaModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTurmaModal(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden p-10 border border-slate-200 space-y-8"
            >
              <button 
                onClick={() => setShowTurmaModal(false)}
                className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900">Entrar em Turma</h3>
                  <p className="text-slate-500 text-sm font-medium">Use o código fornecido pelo seu instrutor.</p>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={turmaCode}
                    onChange={(e) => setTurmaCode(e.target.value)}
                    placeholder="CÓDIGO"
                    className="flex-1 bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 font-black text-center text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <button 
                    onClick={joinTurma}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    Entrar
                  </button>
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full" />

              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900">Criar Nova Turma</h3>
                  <p className="text-slate-500 text-sm font-medium">Torne-se um instrutor e gerencie seus alunos.</p>
                </div>
                <div className="space-y-3">
                  <input 
                    type="text" 
                    value={turmaName}
                    onChange={(e) => setTurmaName(e.target.value)}
                    placeholder="Nome da Turma (Ex: Turma A - 2024)"
                    className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <button 
                    onClick={createTurma}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl"
                  >
                    Criar Turma & Ativar Modo Instrutor
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
