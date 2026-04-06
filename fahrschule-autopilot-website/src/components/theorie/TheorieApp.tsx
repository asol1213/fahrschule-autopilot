"use client";

import { useState, useEffect, useCallback, useMemo, useReducer } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Trophy,
  Flame,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Home,
  ChevronRight,
  Zap,
  Target,
  Brain,
  AlertTriangle,
  Car,
  ShieldCheck,
  Signpost,
  Leaf,
  Wrench,
  User,
  FileText,
  Award,
  RefreshCw,
  TrendingUp,
  Bookmark,
  Timer,
  GraduationCap,
  BarChart3,
  SkipForward,
  ChevronLeft,
  Lock,
} from "lucide-react";
import QuestionCard from "./QuestionCard";
import AITutor from "./AITutor";
import ThemeToggle from "../ThemeToggle";
import type { Question, Category } from "@/data/questions";
import {
  trackQuestionAnswered,
  trackQuizCompleted,
  trackAITutorUsed,
  trackSessionStarted,
} from "@/lib/analytics/theorie-tracker";
import {
  loadAndMergeProgress,
  scheduleSyncToServer,
  flushSyncToServer,
} from "@/lib/theorie-progress-sync";

/* ------------------------------------------------------------------ */
/*  Icon + Color Maps                                                  */
/* ------------------------------------------------------------------ */

const iconMap: Record<string, React.ElementType> = {
  AlertTriangle, Car, Signpost, ShieldCheck, Leaf, Wrench, User, FileText,
};

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  red: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  green: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  pink: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20" },
};

/* ------------------------------------------------------------------ */
/*  Level System                                                       */
/* ------------------------------------------------------------------ */

const LEVELS = [
  { level: 1, title: "Anfänger", xpNeeded: 0, icon: "🚶" },
  { level: 2, title: "Einsteiger", xpNeeded: 50, icon: "🚗" },
  { level: 3, title: "Lernender", xpNeeded: 150, icon: "📖" },
  { level: 4, title: "Fleißig", xpNeeded: 300, icon: "💪" },
  { level: 5, title: "Fortgeschritten", xpNeeded: 500, icon: "⭐" },
  { level: 6, title: "Könner", xpNeeded: 800, icon: "🏅" },
  { level: 7, title: "Profi", xpNeeded: 1200, icon: "🎯" },
  { level: 8, title: "Experte", xpNeeded: 1800, icon: "🧠" },
  { level: 9, title: "Meister", xpNeeded: 2500, icon: "🏆" },
  { level: 10, title: "Prüfungsreif", xpNeeded: 3500, icon: "🎓" },
];

function getLevelInfo(xp: number) {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.xpNeeded) current = l;
    else break;
  }
  const nextLevel = LEVELS.find((l) => l.xpNeeded > xp);
  const xpForNext = nextLevel ? nextLevel.xpNeeded - xp : 0;
  const xpInLevel = nextLevel
    ? xp - current.xpNeeded
    : 0;
  const xpLevelTotal = nextLevel
    ? nextLevel.xpNeeded - current.xpNeeded
    : 1;
  const progress = nextLevel ? Math.round((xpInLevel / xpLevelTotal) * 100) : 100;
  return { ...current, xpForNext, progress, nextLevel };
}

function getXPForAnswer(correct: boolean, difficulty: string, streak: number): number {
  if (!correct) return 0;
  const base = difficulty === "hard" ? 15 : difficulty === "medium" ? 10 : 5;
  const streakBonus = Math.min(streak, 10) * 2;
  return base + streakBonus;
}

/* ------------------------------------------------------------------ */
/*  Category Badges                                                    */
/* ------------------------------------------------------------------ */

function getCategoryBadge(pct: number): { icon: string; label: string; color: string } | null {
  if (pct >= 95) return { icon: "🥇", label: "Gold", color: "text-yellow-400" };
  if (pct >= 85) return { icon: "🥈", label: "Silber", color: "text-gray-300" };
  if (pct >= 70) return { icon: "🥉", label: "Bronze", color: "text-orange-400" };
  return null;
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type View = "categories" | "quiz" | "results" | "exam" | "exam-results" | "stats";
type QuizMode = "all" | "wrong-only" | "unanswered" | "bookmarked" | "smart";

interface QuestionRecord {
  correct: number;
  wrong: number;
  lastAnswered: number; // timestamp
  lastCorrect: boolean;
  bookmarked: boolean;
}

interface FullProgress {
  questions: Record<string, QuestionRecord>;
  xp: number;
  bestStreak: number;
  totalCorrect: number;
  totalWrong: number;
  dailyGoal: number;
  dailyDone: number;
  dailyDate: string;
  examsPassed: number;
  examsFailed: number;
}

const DEFAULT_PROGRESS: FullProgress = {
  questions: {},
  xp: 0,
  bestStreak: 0,
  totalCorrect: 0,
  totalWrong: 0,
  dailyGoal: 20,
  dailyDone: 0,
  dailyDate: new Date().toISOString().split("T")[0],
  examsPassed: 0,
  examsFailed: 0,
};

/* ------------------------------------------------------------------ */
/*  Session Reducer                                                    */
/* ------------------------------------------------------------------ */

interface SessionState {
  correct: number;
  wrong: number;
  answers: { question: Question; correct: boolean; userAnswers: number[] }[];
  streak: number;
  xpGained: number;
  showTutor: boolean;
  lastAnswerData: {
    question: string;
    userAnswer: string;
    correctAnswers: string;
    explanation: string;
    wasCorrect: boolean;
  } | null;
}

const SESSION_INITIAL: SessionState = {
  correct: 0,
  wrong: 0,
  answers: [],
  streak: 0,
  xpGained: 0,
  showTutor: false,
  lastAnswerData: null,
};

type SessionAction =
  | { type: "RESET" }
  | {
      type: "ANSWER";
      payload: {
        question: Question;
        isCorrect: boolean;
        selectedAnswers: number[];
        earnedXP: number;
        answerData: SessionState["lastAnswerData"];
      };
    }
  | { type: "ADD_WRONG"; payload: number }
  | { type: "SET_SHOW_TUTOR"; payload: boolean }
  | { type: "CLEAR_TUTOR" };

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "RESET":
      return SESSION_INITIAL;
    case "ANSWER": {
      const { question, isCorrect, selectedAnswers, earnedXP, answerData } = action.payload;
      return {
        ...state,
        correct: state.correct + (isCorrect ? 1 : 0),
        wrong: state.wrong + (isCorrect ? 0 : 1),
        answers: [...state.answers, { question, correct: isCorrect, userAnswers: selectedAnswers }],
        streak: isCorrect ? state.streak + 1 : 0,
        xpGained: state.xpGained + earnedXP,
        lastAnswerData: answerData,
      };
    }
    case "ADD_WRONG":
      return { ...state, wrong: state.wrong + action.payload };
    case "SET_SHOW_TUTOR":
      return { ...state, showTutor: action.payload };
    case "CLEAR_TUTOR":
      return { ...state, showTutor: false, lastAnswerData: null };
    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/*  Exam Reducer                                                       */
/* ------------------------------------------------------------------ */

interface ExamState {
  timeLeft: number;
  errorPoints: number;
  running: boolean;
  startTime: number;
  answeredIndices: number[]; // Set<number> serialized as array for reducer compat
}

type ExamAction =
  | { type: "START"; payload: { startTime: number; timeSeconds: number } }
  | { type: "TICK"; payload: { remaining: number } }
  | { type: "STOP" }
  | { type: "ADD_ERROR_POINTS"; payload: number }
  | { type: "SET_ERROR_POINTS"; payload: number }
  | { type: "MARK_ANSWERED"; payload: number }
  | { type: "RESET" };

function makeExamInitial(timeSeconds: number): ExamState {
  return { timeLeft: timeSeconds, errorPoints: 0, running: false, startTime: 0, answeredIndices: [] };
}

function examReducer(state: ExamState, action: ExamAction): ExamState {
  switch (action.type) {
    case "START":
      return {
        timeLeft: action.payload.timeSeconds,
        errorPoints: 0,
        running: true,
        startTime: action.payload.startTime,
        answeredIndices: [],
      };
    case "TICK":
      return { ...state, timeLeft: action.payload.remaining };
    case "STOP":
      return { ...state, running: false };
    case "ADD_ERROR_POINTS":
      return { ...state, errorPoints: state.errorPoints + action.payload };
    case "SET_ERROR_POINTS":
      return { ...state, errorPoints: action.payload };
    case "MARK_ANSWERED":
      if (state.answeredIndices.includes(action.payload)) return state;
      return { ...state, answeredIndices: [...state.answeredIndices, action.payload] };
    case "RESET":
      return makeExamInitial(state.timeLeft);
    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/*  Exam Config                                                        */
/* ------------------------------------------------------------------ */

const EXAM_TOTAL = 30;
const EXAM_GRUNDSTOFF = 20;
const EXAM_ZUSATZSTOFF = EXAM_TOTAL - EXAM_GRUNDSTOFF; // 10
const EXAM_TIME_SECONDS = 30 * 60; // 30 minutes
const EXAM_MAX_ERRORS = 10; // Max 10 error points to pass

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

const DEMO_QUESTIONS_PER_CATEGORY = 5;

export default function TheorieApp({ demo = false }: { demo?: boolean }) {
  const [view, setView] = useState<View>("categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [quizMode, setQuizMode] = useState<QuizMode>("all");
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState<FullProgress>(DEFAULT_PROGRESS);
  const [session, dispatchSession] = useReducer(sessionReducer, SESSION_INITIAL);
  const [examState, dispatchExam] = useReducer(examReducer, makeExamInitial(EXAM_TIME_SECONDS));
  const [isLoaded, setIsLoaded] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Convenience aliases so the rest of the render JSX reads naturally
  const { correct: sessionCorrect, wrong: sessionWrong, answers: sessionAnswers,
          streak, showTutor, lastAnswerData, xpGained } = session;
  const { timeLeft: examTimeLeft, errorPoints: examErrorPoints,
          running: examRunning, startTime: examStartTime } = examState;
  const examAnsweredSet = useMemo(
    () => new Set(examState.answeredIndices),
    [examState.answeredIndices]
  );

  // Load questions (lazy — each category is a separate chunk)
  useEffect(() => {
    import("@/data/questions").then(async (mod) => {
      const questions = await mod.loadAllQuestions();
      if (demo) {
        // Demo mode: limit to first N questions per category
        const limitedQuestions = mod.categories.flatMap((cat: Category) => {
          const catQuestions = questions.filter((q: Question) => q.category === cat.id);
          return catQuestions.slice(0, DEMO_QUESTIONS_PER_CATEGORY);
        });
        const demoCats = mod.categories.map((cat: Category) => ({
          ...cat,
          questionCount: Math.min(cat.questionCount, DEMO_QUESTIONS_PER_CATEGORY),
        }));
        setCategories(demoCats);
        setAllQuestions(limitedQuestions);
      } else {
        setCategories(mod.categories);
        setAllQuestions(questions);
      }
      setIsLoaded(true);
    });
  }, [demo]);

  // Load progress: merge localStorage + Supabase (if logged in)
  useEffect(() => {
    loadAndMergeProgress(DEFAULT_PROGRESS).then(setProgress);
  }, []);

  // Save progress to localStorage + schedule sync to Supabase
  useEffect(() => {
    if (progress.xp > 0 || Object.keys(progress.questions).length > 0) {
      localStorage.setItem("theorie-progress-v2", JSON.stringify(progress));
      scheduleSyncToServer(progress);
    }
  }, [progress]);

  // Flush sync on page unload (best-effort via sendBeacon)
  useEffect(() => {
    const handleUnload = () => flushSyncToServer(progress);
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [progress]);

  // Exam timer — Date.now()-based for accuracy across tab switches
  useEffect(() => {
    if (!examRunning || examStartTime === 0) return;
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - examStartTime) / 1000);
      const remaining = Math.max(EXAM_TIME_SECONDS - elapsed, 0);
      dispatchExam({ type: "TICK", payload: { remaining } });
      if (remaining <= 0) {
        dispatchExam({ type: "STOP" });
        setView("exam-results");
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [examRunning, examStartTime]);

  // Derived data
  const levelInfo = useMemo(() => getLevelInfo(progress.xp), [progress.xp]);
  const globalWrongCount = useMemo(() => {
    return allQuestions.filter((q) => {
      const rec = progress.questions[q.id];
      return rec && rec.wrong > 0 && (!rec.lastCorrect || rec.wrong > rec.correct);
    }).length;
  }, [allQuestions, progress.questions]);

  const getWrongQuestions = useCallback(
    (categoryId?: string) => {
      return allQuestions.filter((q) => {
        if (categoryId && q.category !== categoryId) return false;
        const rec = progress.questions[q.id];
        return rec && rec.wrong > 0 && (!rec.lastCorrect || rec.wrong > rec.correct);
      });
    },
    [allQuestions, progress.questions]
  );

  const getUnansweredQuestions = useCallback(
    (categoryId?: string) => {
      return allQuestions.filter((q) => {
        if (categoryId && q.category !== categoryId) return false;
        return !progress.questions[q.id];
      });
    },
    [allQuestions, progress.questions]
  );

  const getBookmarkedQuestions = useCallback(
    (categoryId?: string) => {
      return allQuestions.filter((q) => {
        if (categoryId && q.category !== categoryId) return false;
        return progress.questions[q.id]?.bookmarked;
      });
    },
    [allQuestions, progress.questions]
  );

  const getSmartQuestions = useCallback(
    (categoryId?: string) => {
      // Spaced repetition: prioritize wrong > unanswered > old correct
      const wrong = [...getWrongQuestions(categoryId)].sort(() => Math.random() - 0.5);
      const unanswered = [...getUnansweredQuestions(categoryId)].sort(() => Math.random() - 0.5);
      const oldCorrect = allQuestions.filter((q) => {
        if (categoryId && q.category !== categoryId) return false;
        const rec = progress.questions[q.id];
        return rec && rec.lastCorrect;
      }).sort((a, b) => {
        // Oldest answered first (spaced repetition)
        const aRec = progress.questions[a.id];
        const bRec = progress.questions[b.id];
        return (aRec?.lastAnswered || 0) - (bRec?.lastAnswered || 0);
      });

      // True 50/30/20 interleaving up to 50 questions total
      const TARGET = 50;
      const wCount = Math.min(Math.ceil(TARGET * 0.5), wrong.length);
      const uCount = Math.min(Math.ceil(TARGET * 0.3), unanswered.length);
      const oCount = Math.min(TARGET - wCount - uCount, oldCorrect.length);

      const wPick = wrong.slice(0, wCount);
      const uPick = unanswered.slice(0, uCount);
      const oPick = oldCorrect.slice(0, oCount);

      // Interleave: pick from pools in round-robin weighted order
      const result: Question[] = [];
      const pools = [
        { items: [...wPick], weight: 5 },  // 50%
        { items: [...uPick], weight: 3 },  // 30%
        { items: [...oPick], weight: 2 },  // 20%
      ];

      let safety = 0;
      while (result.length < TARGET && safety < 200) {
        safety++;
        let added = false;
        for (const pool of pools) {
          if (pool.items.length === 0) continue;
          // Pick 'weight' items per round
          const take = Math.min(pool.weight, pool.items.length);
          for (let i = 0; i < take && result.length < TARGET; i++) {
            result.push(pool.items.shift()!);
            added = true;
          }
        }
        if (!added) break;
      }

      return result;
    },
    [allQuestions, progress.questions, getWrongQuestions, getUnansweredQuestions]
  );

  const getCategoryStats = useCallback(
    (categoryId: string) => {
      const catQuestions = allQuestions.filter((q) => q.category === categoryId);
      let correct = 0, wrong = 0, unanswered = 0;
      for (const q of catQuestions) {
        const rec = progress.questions[q.id];
        if (!rec) { unanswered++; continue; }
        if (rec.lastCorrect) correct++;
        else wrong++;
      }
      const total = catQuestions.length;
      const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
      return { correct, wrong, unanswered, total, pct };
    },
    [allQuestions, progress.questions]
  );

  // Pre-compute all category stats once (instead of per-card in render loop)
  const allCategoryStats = useMemo(() => {
    return Object.fromEntries(categories.map((cat) => [cat.id, getCategoryStats(cat.id)]));
  }, [categories, getCategoryStats]);

  const wrongCountByCategory = useMemo(() => {
    return Object.fromEntries(categories.map((cat) => [cat.id, getWrongQuestions(cat.id).length]));
  }, [categories, getWrongQuestions]);

  /* ------------------------------------------------------------------ */
  /*  Actions                                                            */
  /* ------------------------------------------------------------------ */

  const resetSession = useCallback(() => {
    setCurrentIndex(0);
    dispatchSession({ type: "RESET" });
  }, []);

  const startQuiz = useCallback(
    (categoryId: string, mode: QuizMode = "all") => {
      let questions: Question[];
      switch (mode) {
        case "wrong-only":
          questions = getWrongQuestions(categoryId);
          break;
        case "unanswered":
          questions = getUnansweredQuestions(categoryId);
          break;
        case "bookmarked":
          questions = getBookmarkedQuestions(categoryId);
          break;
        case "smart":
          questions = getSmartQuestions(categoryId);
          break;
        default:
          questions = allQuestions.filter((q) => q.category === categoryId);
      }

      if (questions.length === 0) {
        alert("Keine Fragen in diesem Modus verfügbar!");
        return;
      }

      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      resetSession();
      setSelectedCategory(categoryId);
      setQuizMode(mode);
      setCurrentQuestions(shuffled);
      trackSessionStarted();
      setView("quiz");
    },
    [allQuestions, getWrongQuestions, getUnansweredQuestions, getBookmarkedQuestions, getSmartQuestions, resetSession]
  );

  const startExam = useCallback(() => {
    // Pick 30 random questions across all categories (weighted like real exam: 20 Grundstoff + 10 Zusatzstoff)
    const grundstoff = allQuestions.filter(
      (q) => !["zusatzstoff_b", "persoenlich"].includes(q.category)
    );
    const zusatzstoff = allQuestions.filter(
      (q) => ["zusatzstoff_b", "persoenlich"].includes(q.category)
    );

    const shuffledG = [...grundstoff].sort(() => Math.random() - 0.5).slice(0, EXAM_GRUNDSTOFF);
    const shuffledZ = [...zusatzstoff].sort(() => Math.random() - 0.5).slice(0, EXAM_ZUSATZSTOFF);
    const examQuestions = [...shuffledG, ...shuffledZ].sort(() => Math.random() - 0.5);

    resetSession();
    setCurrentQuestions(examQuestions);
    dispatchExam({ type: "START", payload: { startTime: Date.now(), timeSeconds: EXAM_TIME_SECONDS } });
    setSelectedCategory(null);
    setView("exam");
  }, [allQuestions, resetSession]);

  const handleAnswer = useCallback(
    (selectedAnswers: number[], question: Question) => {
      const correctIndices = question.answers
        .map((a, i) => (a.correct ? i : -1))
        .filter((i) => i !== -1);

      const isCorrect =
        selectedAnswers.length === correctIndices.length &&
        selectedAnswers.every((i) => correctIndices.includes(i));

      // XP calculation
      const newStreak = isCorrect ? streak + 1 : 0;
      const earnedXP = getXPForAnswer(isCorrect, question.difficulty, newStreak);
      const oldLevel = getLevelInfo(progress.xp).level;

      // One dispatch replaces 7 setState calls
      dispatchSession({
        type: "ANSWER",
        payload: {
          question,
          isCorrect,
          selectedAnswers,
          earnedXP,
          answerData: {
            question: question.question,
            userAnswer: selectedAnswers.map((i) => question.answers[i].text).join(", "),
            correctAnswers: correctIndices.map((i) => question.answers[i].text).join(", "),
            explanation: question.explanation,
            wasCorrect: isCorrect,
          },
        },
      });

      // Analytics tracking
      trackQuestionAnswered(selectedCategory || "unknown", isCorrect);

      // Mark this question index as answered in exam mode
      if (view === "exam") {
        dispatchExam({ type: "MARK_ANSWERED", payload: currentIndex });
        if (!isCorrect) {
          dispatchExam({ type: "ADD_ERROR_POINTS", payload: question.points });
        }
      }

      // Update progress
      setProgress((prev) => {
        const existing = prev.questions[question.id] || {
          correct: 0, wrong: 0, lastAnswered: 0, lastCorrect: false, bookmarked: false,
        };
        const newXP = prev.xp + earnedXP;
        const newLevel = getLevelInfo(newXP).level;
        if (newLevel > oldLevel) {
          setTimeout(() => {
            setShowLevelUp(true);
            setTimeout(() => setShowLevelUp(false), 3000);
          }, 500);
        }

        return {
          ...prev,
          questions: {
            ...prev.questions,
            [question.id]: {
              ...existing,
              correct: existing.correct + (isCorrect ? 1 : 0),
              wrong: existing.wrong + (isCorrect ? 0 : 1),
              lastAnswered: Date.now(),
              lastCorrect: isCorrect,
              bookmarked: existing.bookmarked,
            },
          },
          xp: newXP,
          bestStreak: Math.max(prev.bestStreak, newStreak),
          totalCorrect: prev.totalCorrect + (isCorrect ? 1 : 0),
          totalWrong: prev.totalWrong + (isCorrect ? 0 : 1),
          dailyDone: prev.dailyDone + 1,
        };
      });
    },
    [streak, progress.xp, view, currentIndex, selectedCategory]
  );

  const toggleBookmark = useCallback((questionId: string) => {
    setProgress((prev) => {
      const existing = prev.questions[questionId] || {
        correct: 0, wrong: 0, lastAnswered: 0, lastCorrect: false, bookmarked: false,
      };
      return {
        ...prev,
        questions: {
          ...prev.questions,
          [questionId]: { ...existing, bookmarked: !existing.bookmarked },
        },
      };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    dispatchSession({ type: "CLEAR_TUTOR" });
    if (view === "exam") {
      const nextUnanswered = currentQuestions.findIndex(
        (_, i) => i > currentIndex && !examAnsweredSet.has(i) && !sessionAnswers.some((a) => a.question.id === currentQuestions[i].id)
      );
      if (nextUnanswered !== -1) {
        setCurrentIndex(nextUnanswered);
      } else {
        const prevUnanswered = currentQuestions.findIndex(
          (_, i) => i < currentIndex && !examAnsweredSet.has(i) && !sessionAnswers.some((a) => a.question.id === currentQuestions[i].id)
        );
        if (prevUnanswered !== -1) {
          setCurrentIndex(prevUnanswered);
        } else {
          // All answered — finish exam
          dispatchExam({ type: "STOP" });
          const freshErrors = sessionAnswers
            .filter((a) => !a.correct)
            .reduce((sum, a) => sum + a.question.points, 0);
          dispatchExam({ type: "SET_ERROR_POINTS", payload: freshErrors });
          const passed = freshErrors <= EXAM_MAX_ERRORS;
          setProgress((prev) => ({
            ...prev,
            examsPassed: prev.examsPassed + (passed ? 1 : 0),
            examsFailed: prev.examsFailed + (passed ? 0 : 1),
          }));
          trackQuizCompleted(freshErrors, Math.round((Date.now() - examStartTime) / 1000));
          setView("exam-results");
        }
      }
    } else if (currentIndex + 1 < currentQuestions.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setView("results");
    }
  }, [currentIndex, currentQuestions, view, examAnsweredSet, sessionAnswers, examStartTime]);

  const finishExam = useCallback(() => {
    if (!confirm("Prüfung jetzt abgeben? Unbeantwortete Fragen zählen als falsch.")) return;
    dispatchExam({ type: "STOP" });
    const answeredErrors = sessionAnswers
      .filter((a) => !a.correct)
      .reduce((sum, a) => sum + a.question.points, 0);
    const unansweredCount = currentQuestions.length - sessionAnswers.length;
    const unansweredPoints = currentQuestions
      .filter((q) => !sessionAnswers.some((a) => a.question.id === q.id))
      .reduce((sum, q) => sum + q.points, 0);
    const totalErrors = answeredErrors + unansweredPoints;
    dispatchExam({ type: "SET_ERROR_POINTS", payload: totalErrors });
    if (unansweredCount > 0) {
      dispatchSession({ type: "ADD_WRONG", payload: unansweredCount });
    }
    const passed = totalErrors <= EXAM_MAX_ERRORS;
    setProgress((prev) => ({
      ...prev,
      examsPassed: prev.examsPassed + (passed ? 1 : 0),
      examsFailed: prev.examsFailed + (passed ? 0 : 1),
    }));
    trackQuizCompleted(totalErrors, EXAM_TIME_SECONDS - examTimeLeft);
    setView("exam-results");
  }, [currentQuestions, sessionAnswers, examTimeLeft]);

  const getTotalPct = useCallback(() => {
    const answered = Object.values(progress.questions);
    if (answered.length === 0) return 0;
    const correct = answered.filter((r) => r.lastCorrect).length;
    return Math.round((correct / answered.length) * 100);
  }, [progress.questions]);

  // Stats data for dashboard
  const statsData = useMemo(() => {
    const records = Object.entries(progress.questions);
    const totalAnswered = records.length;
    const totalCorrect = records.filter(([, r]) => r.lastCorrect).length;
    const totalWrong = totalAnswered - totalCorrect;

    // Per-category breakdown
    const categoryBreakdown = categories.map((cat) => {
      const catQs = allQuestions.filter((q) => q.category === cat.id);
      const catRecords = catQs.map((q) => progress.questions[q.id]).filter(Boolean);
      const correct = catRecords.filter((r) => r.lastCorrect).length;
      const wrong = catRecords.filter((r) => !r.lastCorrect).length;
      const unanswered = catQs.length - catRecords.length;
      const pct = catRecords.length > 0 ? Math.round((correct / catRecords.length) * 100) : 0;
      return { ...cat, correct, wrong, unanswered, total: catQs.length, answered: catRecords.length, pct };
    });

    // Weakest categories (sorted by % correct ascending)
    const weakest = [...categoryBreakdown]
      .filter((c) => c.answered >= 3)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 3);

    // Difficulty breakdown — O(n) with lookup map instead of O(n*m)
    const difficultyMap = new Map<string, string>();
    for (const q of allQuestions) difficultyMap.set(q.id, q.difficulty);

    const diffCounts = { easy: { total: 0, correct: 0 }, medium: { total: 0, correct: 0 }, hard: { total: 0, correct: 0 } };
    for (const [id, rec] of records) {
      const diff = difficultyMap.get(id) as keyof typeof diffCounts | undefined;
      if (diff && diffCounts[diff]) {
        diffCounts[diff].total++;
        if (rec.lastCorrect) diffCounts[diff].correct++;
      }
    }
    const diffBreakdown = [
      { label: "Leicht", total: diffCounts.easy.total, correct: diffCounts.easy.correct, color: "text-green-400" },
      { label: "Mittel", total: diffCounts.medium.total, correct: diffCounts.medium.correct, color: "text-yellow-400" },
      { label: "Schwer", total: diffCounts.hard.total, correct: diffCounts.hard.correct, color: "text-red-400" },
    ];

    return { totalAnswered, totalCorrect, totalWrong, categoryBreakdown, weakest, diffBreakdown };
  }, [progress.questions, categories, allQuestions]);

  /* ------------------------------------------------------------------ */
  /*  Render helpers                                                     */
  /* ------------------------------------------------------------------ */

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          <p className="text-muted text-sm">Fragen werden geladen...</p>
        </div>
      </div>
    );
  }

  /* ================================================================== */
  /*  RENDER                                                             */
  /* ================================================================== */

  return (
    <div className="min-h-screen">
      {/* Level Up Toast */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-2xl shadow-2xl shadow-yellow-500/30 flex items-center gap-3"
            role="alert"
            aria-live="assertive"
          >
            <Award className="h-6 w-6" />
            <div>
              <div className="text-sm font-bold">Level Up!</div>
              <div className="text-xs opacity-90">
                {levelInfo.icon} {levelInfo.title} — Level {levelInfo.level}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              {view !== "categories" && view !== "stats" && (
                <button
                  onClick={() => {
                    if (examRunning && !confirm("Prüfung wirklich abbrechen? Dein Fortschritt geht verloren.")) return;
                    setView("categories");
                    dispatchSession({ type: "SET_SHOW_TUTOR", payload: false });
                    dispatchExam({ type: "STOP" });
                  }}
                  className="p-2 rounded-lg hover:bg-surface-light transition-colors text-muted hover:text-foreground"
                  aria-label="Zurück zu Kategorien"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              {view === "stats" && (
                <button
                  onClick={() => setView("categories")}
                  className="p-2 rounded-lg hover:bg-surface-light transition-colors text-muted hover:text-foreground"
                  aria-label="Zurück zu Kategorien"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <Link href="/" className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="font-bold text-sm sm:text-base">
                  Theorie-<span className="gradient-text">Trainer</span>
                </span>
              </Link>
              <nav className="hidden md:flex items-center gap-6 ml-8 text-sm text-muted">
                <Link href="/#features" className="hover:text-foreground transition-colors">Features</Link>
                <Link href="/preise" className="hover:text-foreground transition-colors">Preise</Link>
                <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
                <Link href="/anmeldung" className="hover:text-foreground transition-colors">Anmeldung</Link>
              </nav>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Exam timer */}
              {(view === "exam") && examRunning && (
                <div className={`flex items-center gap-1.5 text-sm font-mono font-bold ${examTimeLeft < 300 ? "text-red-400" : "text-foreground"}`}>
                  <Timer className="h-4 w-4" />
                  {formatTime(examTimeLeft)}
                </div>
              )}

              {/* XP + Level */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-light border border-border">
                <span className="text-sm">{levelInfo.icon}</span>
                <span className="text-xs font-semibold">Lv.{levelInfo.level}</span>
                <div className="w-12 h-1.5 rounded-full bg-surface-lighter overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-500"
                    style={{ width: `${levelInfo.progress}%` }}
                  />
                </div>
              </div>

              {/* Streak */}
              <div className="flex items-center gap-1 text-sm">
                <Flame className={`h-4 w-4 ${streak >= 5 ? "text-orange-400" : streak >= 1 ? "text-yellow-400" : "text-muted"}`} />
                <span className={streak >= 5 ? "text-orange-400 font-bold" : "text-muted"}>
                  {streak}
                </span>
              </div>

              {/* Daily progress (mini) */}
              <div className="hidden sm:flex items-center gap-1.5">
                <div className="w-16 h-1.5 rounded-full bg-surface-lighter overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${Math.min((progress.dailyDone / progress.dailyGoal) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted">{progress.dailyDone}/{progress.dailyGoal}</span>
              </div>

              <button
                onClick={() => { setView("stats"); dispatchExam({ type: "STOP" }); dispatchSession({ type: "SET_SHOW_TUTOR", payload: false }); }}
                className="p-2 rounded-lg hover:bg-surface-light transition-colors text-muted hover:text-foreground"
                title="Statistiken"
                aria-label="Statistiken anzeigen"
              >
                <BarChart3 className="h-5 w-5" />
              </button>
              <ThemeToggle />
              <Link href="/" className="p-2 rounded-lg hover:bg-surface-light transition-colors text-muted hover:text-foreground" aria-label="Zur Startseite">
                <Home className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {demo && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm">
            <Lock className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="text-amber-200/90">
              <strong>Demo-Version:</strong> 5 Fragen pro Kategorie.{" "}
              <Link href="/login" className="underline hover:text-amber-100 font-medium">
                Als Fahrschule einloggen
              </Link>{" "}
              für alle 2.300+ Fragen, Prüfungssimulation und mehr.
            </span>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ============================================================ */}
        {/*  CATEGORIES VIEW                                              */}
        {/* ============================================================ */}
        {view === "categories" && (
          <motion.div
            key="categories"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
          >
            {/* Hero + Level Card */}
            <div className="text-center mb-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-4">
                  <Brain className="h-3.5 w-3.5" />
                  2.300+ Übungsfragen
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                  Theorie-<span className="gradient-text">Trainer</span>
                </h1>
              </motion.div>
            </div>

            {/* Level + Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border bg-surface/50 p-5 sm:p-6 mb-8"
            >
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Level */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/20 flex items-center justify-center text-2xl">
                    {levelInfo.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold">Level {levelInfo.level}</span>
                      <span className="text-sm text-muted">— {levelInfo.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-surface-lighter overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-700"
                          style={{ width: `${levelInfo.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted whitespace-nowrap">
                        {progress.xp} XP {levelInfo.nextLevel ? `(${levelInfo.xpForNext} bis Lv.${levelInfo.nextLevel.level})` : "MAX"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">{getTotalPct()}%</div>
                    <div className="text-[10px] text-muted">Richtig</div>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-center">
                    <div className="text-xl font-bold text-orange-400 flex items-center justify-center gap-0.5">
                      <Flame className="h-4 w-4" />{progress.bestStreak}
                    </div>
                    <div className="text-[10px] text-muted">Beste Serie</div>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-center">
                    <div className="text-xl font-bold">{Object.keys(progress.questions).length}</div>
                    <div className="text-[10px] text-muted">Beantwortet</div>
                  </div>
                  <div className="w-px h-8 bg-border hidden sm:block" />
                  <div className="text-center hidden sm:block">
                    <div className="text-xl font-bold text-accent">{progress.dailyDone}/{progress.dailyGoal}</div>
                    <div className="text-[10px] text-muted">Tagesziel</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Exam + Smart Mode Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8"
            >
              {/* Prüfungssimulation */}
              <button
                onClick={demo ? undefined : startExam}
                disabled={demo}
                className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${demo ? "border-gray-500/20 bg-gray-500/5 opacity-50 cursor-not-allowed" : "border-red-500/20 bg-red-500/5 hover:bg-red-500/10"}`}
                title={demo ? "Nur für eingeloggte Fahrschulen verfügbar" : undefined}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${demo ? "bg-gray-500/10" : "bg-red-500/10"}`}>
                  <GraduationCap className={`h-6 w-6 ${demo ? "text-gray-400" : "text-red-400"}`} />
                </div>
                <div>
                  <div className="font-semibold text-sm">Prüfungssimulation</div>
                  <div className="text-xs text-muted">{demo ? "Nur mit Login verfügbar" : "30 Fragen, 30 Min, wie echt"}</div>
                  {progress.examsPassed + progress.examsFailed > 0 && (
                    <div className="text-[10px] text-muted mt-0.5">
                      {progress.examsPassed}x bestanden, {progress.examsFailed}x nicht
                    </div>
                  )}
                </div>
              </button>

              {/* Fehler wiederholen */}
              <button
                onClick={() => {
                  const wrong = getWrongQuestions();
                  if (wrong.length === 0) { alert("Keine falschen Fragen vorhanden!"); return; }
                  resetSession();
                  setCurrentQuestions([...wrong].sort(() => Math.random() - 0.5));
                  setSelectedCategory(null);
                  setQuizMode("wrong-only");
                  setView("quiz");
                }}
                className="group flex items-center gap-4 p-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                  <RefreshCw className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Fehler wiederholen</div>
                  <div className="text-xs text-muted">{globalWrongCount} Fragen</div>
                </div>
              </button>

              {/* Smart-Modus */}
              <button
                onClick={() => {
                  const smart = getSmartQuestions();
                  if (smart.length === 0) { alert("Beantworte zuerst ein paar Fragen!"); return; }
                  resetSession();
                  setCurrentQuestions(smart);
                  setSelectedCategory(null);
                  setQuizMode("smart");
                  setView("quiz");
                }}
                className="group flex items-center gap-4 p-4 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Smart-Modus</div>
                  <div className="text-xs text-muted">AI wählt deine schwächsten Fragen</div>
                </div>
              </button>
            </motion.div>

            {/* Category Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((cat, i) => {
                const Icon = iconMap[cat.icon] || BookOpen;
                const colors = colorMap[cat.color] || colorMap.blue;
                const stats = allCategoryStats[cat.id] || getCategoryStats(cat.id);
                const badge = getCategoryBadge(stats.pct);
                const wrongCount = wrongCountByCategory[cat.id] || 0;

                return (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 * i }}
                    className={`group relative rounded-2xl border ${colors.border} bg-surface/50 hover:bg-surface-light transition-all duration-300 overflow-hidden`}
                  >
                    {/* Badge */}
                    {badge && (
                      <div className="absolute top-3 right-3 text-lg" title={badge.label}>
                        {badge.icon}
                      </div>
                    )}

                    <button
                      onClick={() => startQuiz(cat.id, "all")}
                      className="w-full text-left p-5 pb-3"
                    >
                      <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center mb-3`}>
                        <Icon className={`h-5 w-5 ${colors.text}`} />
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{cat.name}</h3>
                      <p className="text-xs text-muted mb-3 line-clamp-2">{cat.description}</p>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-[10px] text-muted mb-2">
                        <span className="text-accent">{stats.correct} ✓</span>
                        <span className="text-red-400">{stats.wrong} ✗</span>
                        <span>{stats.unanswered} offen</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-lighter overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            stats.pct >= 70 ? "bg-accent" : stats.pct >= 40 ? "bg-primary" : "bg-muted/40"
                          }`}
                          style={{ width: `${stats.pct}%` }}
                        />
                      </div>
                      <div className="text-right text-[10px] text-muted mt-1">{stats.pct}%</div>
                    </button>

                    {/* Mode buttons */}
                    <div className="flex border-t border-border">
                      {wrongCount > 0 && (
                        <button
                          onClick={() => startQuiz(cat.id, "wrong-only")}
                          className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] text-orange-400 hover:bg-orange-500/10 transition-colors border-r border-border"
                          title="Fehler wiederholen"
                        >
                          <RefreshCw className="h-3 w-3" />
                          {wrongCount} Fehler
                        </button>
                      )}
                      <button
                        onClick={() => startQuiz(cat.id, "smart")}
                        className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] text-primary hover:bg-primary/10 transition-colors"
                        title="Smart-Modus"
                      >
                        <Zap className="h-3 w-3" />
                        Smart
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Reset */}
            {Object.keys(progress.questions).length > 0 && (
              <div className="text-center mt-10">
                <button
                  onClick={() => {
                    if (confirm("Gesamten Fortschritt wirklich zurücksetzen? Level, XP und alle Antworten werden gelöscht.")) {
                      setProgress(DEFAULT_PROGRESS);
                      localStorage.removeItem("theorie-progress-v2");
                    }
                  }}
                  className="inline-flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Fortschritt zurücksetzen
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ============================================================ */}
        {/*  QUIZ VIEW (normal + exam)                                    */}
        {/* ============================================================ */}
        {(view === "quiz" || view === "exam") && currentQuestions.length > 0 && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
          >
            {/* Quiz info bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-muted">
                    Frage {currentIndex + 1} von {currentQuestions.length}
                  </span>
                  {view === "exam" && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      examErrorPoints > 7 ? "border-red-500/30 text-red-400 bg-red-500/10" : "border-border text-muted"
                    }`}>
                      {examErrorPoints}/{EXAM_MAX_ERRORS} Fehlerpunkte
                    </span>
                  )}
                  {quizMode === "wrong-only" && (
                    <span className="text-xs px-2 py-0.5 rounded-full border border-orange-500/30 text-orange-400 bg-orange-500/10">
                      Fehler-Modus
                    </span>
                  )}
                  {quizMode === "smart" && (
                    <span className="text-xs px-2 py-0.5 rounded-full border border-primary/30 text-primary bg-primary/10">
                      Smart-Modus
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {xpGained > 0 && (
                    <span className="text-xs text-yellow-400 font-medium">+{xpGained} XP</span>
                  )}
                  <span className="flex items-center gap-1 text-accent">
                    <CheckCircle2 className="h-4 w-4" />{sessionCorrect}
                  </span>
                  <span className="flex items-center gap-1 text-red-400">
                    <XCircle className="h-4 w-4" />{sessionWrong}
                  </span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-lighter overflow-hidden" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={0} aria-valuemax={currentQuestions.length} aria-label="Fragenfortschritt">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  animate={{ width: `${((currentIndex + 1) / currentQuestions.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Exam question navigation grid */}
              {view === "exam" && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {currentQuestions.map((_, i) => {
                    const isAnswered = examAnsweredSet.has(i);
                    const isCurrent = i === currentIndex;
                    const answer = sessionAnswers.find((a) => a.question.id === currentQuestions[i].id);
                    let bg = "bg-surface-lighter text-muted";
                    if (isCurrent) bg = "bg-primary text-white ring-2 ring-primary/50";
                    else if (answer?.correct) bg = "bg-green-500/20 text-green-400 border-green-500/30";
                    else if (answer && !answer.correct) bg = "bg-red-500/20 text-red-400 border-red-500/30";
                    else if (isAnswered) bg = "bg-surface-light text-foreground";
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          if (!isAnswered || isCurrent) {
                            setCurrentIndex(i);
                            dispatchSession({ type: "CLEAR_TUTOR" });
                          }
                        }}
                        className={`w-8 h-8 rounded-lg text-[10px] font-bold border border-border transition-all ${bg} ${
                          !isAnswered && !isCurrent ? "hover:bg-surface-light cursor-pointer" : isAnswered && !isCurrent ? "cursor-default" : ""
                        }`}
                        title={`Frage ${i + 1}: ${isAnswered ? (answer?.correct ? "Richtig" : "Falsch") : "Noch offen"}`}
                        aria-label={`Frage ${i + 1}, ${isAnswered ? (answer?.correct ? "richtig beantwortet" : "falsch beantwortet") : "noch offen"}`}
                      >
                        {answer?.correct ? "✓" : answer && !answer.correct ? "✗" : i + 1}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bookmark button */}
            <div className="flex justify-end mb-2">
              <button
                onClick={() => toggleBookmark(currentQuestions[currentIndex].id)}
                className={`p-2 rounded-lg transition-colors ${
                  progress.questions[currentQuestions[currentIndex]?.id]?.bookmarked
                    ? "text-yellow-400 bg-yellow-500/10"
                    : "text-muted hover:text-foreground hover:bg-surface-light"
                }`}
                title="Frage merken"
                aria-label={progress.questions[currentQuestions[currentIndex]?.id]?.bookmarked ? "Lesezeichen entfernen" : "Frage als Lesezeichen merken"}
              >
                <Bookmark className="h-4 w-4" />
              </button>
            </div>

            <QuestionCard
              question={currentQuestions[currentIndex]}
              onAnswer={handleAnswer}
              onNext={nextQuestion}
              onShowTutor={() => { dispatchSession({ type: "SET_SHOW_TUTOR", payload: true }); trackAITutorUsed(selectedCategory || undefined); }}
              questionNumber={currentIndex + 1}
              totalQuestions={currentQuestions.length}
              previousAnswer={(() => {
                const prev = sessionAnswers.find((a) => a.question.id === currentQuestions[currentIndex]?.id);
                return prev ? { userAnswers: prev.userAnswers, correct: prev.correct } : null;
              })()}
            />

            <AnimatePresence>
              {showTutor && lastAnswerData && (
                <AITutor questionData={lastAnswerData} onClose={() => dispatchSession({ type: "SET_SHOW_TUTOR", payload: false })} />
              )}
            </AnimatePresence>

            {/* Exam action bar: Skip + Submit */}
            {view === "exam" && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  {currentIndex > 0 && (
                    <button
                      onClick={() => {
                        setCurrentIndex((i) => i - 1);
                        dispatchSession({ type: "CLEAR_TUTOR" });
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground px-3 py-2 rounded-lg hover:bg-surface-light transition-all"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Zurück
                    </button>
                  )}
                  {!examAnsweredSet.has(currentIndex) && !sessionAnswers.some((a) => a.question.id === currentQuestions[currentIndex]?.id) && (
                    <button
                      onClick={() => {
                        // Skip to next unanswered
                        const next = currentQuestions.findIndex(
                          (_, i) => i > currentIndex && !examAnsweredSet.has(i) && !sessionAnswers.some((a) => a.question.id === currentQuestions[i].id)
                        );
                        if (next !== -1) setCurrentIndex(next);
                        else {
                          // Wrap around
                          const prev = currentQuestions.findIndex(
                            (_, i) => i !== currentIndex && !examAnsweredSet.has(i) && !sessionAnswers.some((a) => a.question.id === currentQuestions[i].id)
                          );
                          if (prev !== -1) setCurrentIndex(prev);
                        }
                        dispatchSession({ type: "CLEAR_TUTOR" });
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground px-3 py-2 rounded-lg hover:bg-surface-light transition-all"
                    >
                      <SkipForward className="h-3.5 w-3.5" />
                      Überspringen
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted">
                    {sessionAnswers.length}/{currentQuestions.length} beantwortet
                  </span>
                  <button
                    onClick={finishExam}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-300 px-3 py-2 rounded-lg border border-red-500/20 hover:bg-red-500/10 transition-all"
                  >
                    Prüfung abgeben
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ============================================================ */}
        {/*  RESULTS VIEW                                                 */}
        {/* ============================================================ */}
        {view === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                  sessionCorrect / Math.max(sessionCorrect + sessionWrong, 1) >= 0.7 ? "bg-accent/10" : "bg-orange-500/10"
                }`}
              >
                {sessionCorrect / Math.max(sessionCorrect + sessionWrong, 1) >= 0.7 ? (
                  <Trophy className="h-10 w-10 text-accent" />
                ) : (
                  <Target className="h-10 w-10 text-orange-400" />
                )}
              </motion.div>

              <h2 className="text-2xl font-bold mb-1">
                {sessionCorrect / Math.max(sessionCorrect + sessionWrong, 1) >= 0.9 ? "Perfekt! 🎉" :
                 sessionCorrect / Math.max(sessionCorrect + sessionWrong, 1) >= 0.7 ? "Sehr gut! 💪" :
                 sessionCorrect / Math.max(sessionCorrect + sessionWrong, 1) >= 0.5 ? "Guter Anfang! 📚" : "Weiter üben! 🔄"}
              </h2>
              <p className="text-muted">
                {sessionCorrect} von {sessionCorrect + sessionWrong} richtig
                {xpGained > 0 && <span className="text-yellow-400 font-medium ml-2">+{xpGained} XP</span>}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="rounded-xl border border-border bg-surface/50 p-4 text-center">
                <div className="text-2xl font-bold text-accent">{sessionCorrect}</div>
                <div className="text-xs text-muted">Richtig</div>
              </div>
              <div className="rounded-xl border border-border bg-surface/50 p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{sessionWrong}</div>
                <div className="text-xs text-muted">Falsch</div>
              </div>
              <div className="rounded-xl border border-border bg-surface/50 p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.round((sessionCorrect / Math.max(sessionCorrect + sessionWrong, 1)) * 100)}%
                </div>
                <div className="text-xs text-muted">Quote</div>
              </div>
            </div>

            {/* Wrong questions review */}
            {sessionAnswers.filter((a) => !a.correct).length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-400" />
                  Falsch beantwortet ({sessionAnswers.filter((a) => !a.correct).length})
                </h3>
                <div className="space-y-2">
                  {sessionAnswers
                    .filter((a) => !a.correct)
                    .map((a, i) => {
                      const correctAnswers = a.question.answers
                        .filter((ans) => ans.correct)
                        .map((ans) => ans.text);
                      return (
                        <div
                          key={i}
                          className="rounded-xl border border-red-500/10 bg-red-500/5 p-4"
                        >
                          <p className="text-sm font-medium mb-2">{a.question.question}</p>
                          <p className="text-xs text-accent">
                            ✓ Richtig: {correctAnswers.join(", ")}
                          </p>
                          <p className="text-xs text-muted mt-1">{a.question.explanation}</p>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {sessionWrong > 0 && (
                <button
                  onClick={() => {
                    const wrongQs = sessionAnswers.filter((a) => !a.correct).map((a) => a.question);
                    resetSession();
                    setCurrentQuestions([...wrongQs].sort(() => Math.random() - 0.5));
                    setQuizMode("wrong-only");
                    setView("quiz");
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition-all"
                >
                  <RefreshCw className="h-4 w-4" />
                  Fehler wiederholen ({sessionWrong})
                </button>
              )}
              <button
                onClick={() => {
                  if (selectedCategory) {
                    startQuiz(selectedCategory, quizMode);
                  } else {
                    const questions = quizMode === "smart" ? getSmartQuestions() :
                      quizMode === "wrong-only" ? getWrongQuestions() :
                      [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 50);
                    if (questions.length === 0) { setView("categories"); return; }
                    resetSession();
                    setCurrentQuestions([...questions].sort(() => Math.random() - 0.5));
                    setView("quiz");
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-all"
              >
                <RotateCcw className="h-4 w-4" />
                Nochmal üben
              </button>
              <button
                onClick={() => { setView("categories"); dispatchSession({ type: "SET_SHOW_TUTOR", payload: false }); }}
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-muted hover:text-foreground hover:bg-surface-light transition-all"
              >
                Kategorien
              </button>
            </div>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/*  EXAM RESULTS VIEW                                            */}
        {/* ============================================================ */}
        {view === "exam-results" && (
          <motion.div
            key="exam-results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
                  examErrorPoints <= EXAM_MAX_ERRORS ? "bg-accent/10" : "bg-red-500/10"
                }`}
              >
                {examErrorPoints <= EXAM_MAX_ERRORS ? (
                  <GraduationCap className="h-12 w-12 text-accent" />
                ) : (
                  <XCircle className="h-12 w-12 text-red-400" />
                )}
              </motion.div>

              <h2 className="text-3xl font-bold mb-2">
                {examErrorPoints <= EXAM_MAX_ERRORS
                  ? "Bestanden! 🎉🎓"
                  : "Nicht bestanden 😔"}
              </h2>
              <p className="text-muted text-lg">
                {examErrorPoints} von max. {EXAM_MAX_ERRORS} Fehlerpunkten
              </p>
              {xpGained > 0 && (
                <p className="text-yellow-400 font-medium mt-2">+{xpGained} XP verdient</p>
              )}
            </div>

            {/* Exam stats */}
            <div className="grid grid-cols-4 gap-3 mb-8">
              <div className="rounded-xl border border-border bg-surface/50 p-4 text-center">
                <div className="text-xl font-bold text-accent">{sessionCorrect}</div>
                <div className="text-[10px] text-muted">Richtig</div>
              </div>
              <div className="rounded-xl border border-border bg-surface/50 p-4 text-center">
                <div className="text-xl font-bold text-red-400">{sessionWrong}</div>
                <div className="text-[10px] text-muted">Falsch</div>
              </div>
              <div className="rounded-xl border border-border bg-surface/50 p-4 text-center">
                <div className={`text-xl font-bold ${examErrorPoints <= EXAM_MAX_ERRORS ? "text-accent" : "text-red-400"}`}>
                  {examErrorPoints}
                </div>
                <div className="text-[10px] text-muted">Fehlerpunkte</div>
              </div>
              <div className="rounded-xl border border-border bg-surface/50 p-4 text-center">
                <div className="text-xl font-bold text-primary">
                  {formatTime(EXAM_TIME_SECONDS - examTimeLeft)}
                </div>
                <div className="text-[10px] text-muted">Zeit</div>
              </div>
            </div>

            {/* Wrong answers review */}
            {sessionAnswers.filter((a) => !a.correct).length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-400" />
                  Falsche Antworten
                </h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {sessionAnswers
                    .filter((a) => !a.correct)
                    .map((a, i) => (
                      <div key={i} className="rounded-xl border border-red-500/10 bg-red-500/5 p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-medium">{a.question.question}</p>
                          <span className="text-xs text-red-400 shrink-0">{a.question.points}P</span>
                        </div>
                        <p className="text-xs text-accent">
                          ✓ {a.question.answers.filter((ans) => ans.correct).map((ans) => ans.text).join(", ")}
                        </p>
                        <p className="text-xs text-muted mt-1">{a.question.explanation}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={startExam}
                className="inline-flex items-center gap-2 rounded-full bg-red-500 px-6 py-3 text-sm font-semibold text-white hover:bg-red-600 transition-all"
              >
                <GraduationCap className="h-4 w-4" />
                Neue Prüfung starten
              </button>
              {sessionWrong > 0 && (
                <button
                  onClick={() => {
                    const wrongQs = sessionAnswers.filter((a) => !a.correct).map((a) => a.question);
                    resetSession();
                    setCurrentQuestions([...wrongQs].sort(() => Math.random() - 0.5));
                    setQuizMode("wrong-only");
                    setView("quiz");
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition-all"
                >
                  <RefreshCw className="h-4 w-4" />
                  Fehler üben
                </button>
              )}
              <button
                onClick={() => { setView("categories"); dispatchSession({ type: "SET_SHOW_TUTOR", payload: false }); }}
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-muted hover:text-foreground hover:bg-surface-light transition-all"
              >
                Zurück
              </button>
            </div>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/*  STATS DASHBOARD VIEW                                         */}
        {/* ============================================================ */}
        {view === "stats" && (
          <motion.div
            key="stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  <span className="gradient-text">Statistiken</span>
                </h1>
                <p className="text-sm text-muted mt-1">Dein Lernfortschritt im Detail</p>
              </div>
              <button
                onClick={() => setView("categories")}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground hover:bg-surface-light transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                Zurück
              </button>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <div className="rounded-2xl border border-border bg-surface/50 p-5 text-center">
                <div className="text-3xl font-bold">{statsData.totalAnswered}</div>
                <div className="text-xs text-muted mt-1">Beantwortet</div>
                <div className="text-[10px] text-muted">von {allQuestions.length}</div>
              </div>
              <div className="rounded-2xl border border-border bg-surface/50 p-5 text-center">
                <div className="text-3xl font-bold text-accent">
                  {statsData.totalAnswered > 0 ? Math.round((statsData.totalCorrect / statsData.totalAnswered) * 100) : 0}%
                </div>
                <div className="text-xs text-muted mt-1">Richtig-Quote</div>
                <div className="text-[10px] text-accent">{statsData.totalCorrect} richtig</div>
              </div>
              <div className="rounded-2xl border border-border bg-surface/50 p-5 text-center">
                <div className="text-3xl font-bold text-yellow-400">{progress.xp}</div>
                <div className="text-xs text-muted mt-1">XP gesamt</div>
                <div className="text-[10px] text-muted">Level {levelInfo.level} — {levelInfo.title}</div>
              </div>
              <div className="rounded-2xl border border-border bg-surface/50 p-5 text-center">
                <div className="text-3xl font-bold text-primary">
                  {progress.examsPassed + progress.examsFailed}
                </div>
                <div className="text-xs text-muted mt-1">Prüfungen</div>
                <div className="text-[10px]">
                  <span className="text-accent">{progress.examsPassed}✓</span>
                  {" "}
                  <span className="text-red-400">{progress.examsFailed}✗</span>
                </div>
              </div>
            </div>

            {/* Difficulty Breakdown */}
            <div className="rounded-2xl border border-border bg-surface/50 p-5 sm:p-6 mb-6">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Nach Schwierigkeit
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {statsData.diffBreakdown.map((d) => {
                  const pct = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
                  return (
                    <div key={d.label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${d.color}`}>{d.label}</span>
                        <span className="text-xs text-muted">{d.correct}/{d.total}</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-surface-lighter overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            pct >= 70 ? "bg-accent" : pct >= 40 ? "bg-primary" : "bg-muted/40"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-right text-[10px] text-muted mt-1">{pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="rounded-2xl border border-border bg-surface/50 p-5 sm:p-6 mb-6">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Nach Kategorie
              </h3>
              <div className="space-y-4">
                {statsData.categoryBreakdown.map((cat) => {
                  const Icon = iconMap[cat.icon] || BookOpen;
                  const colors = colorMap[cat.color] || colorMap.blue;
                  const badge = getCategoryBadge(cat.pct);
                  return (
                    <div key={cat.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-md ${colors.bg} flex items-center justify-center`}>
                            <Icon className={`h-3.5 w-3.5 ${colors.text}`} />
                          </div>
                          <span className="text-sm font-medium">{cat.name}</span>
                          {badge && <span className="text-sm" title={badge.label}>{badge.icon}</span>}
                        </div>
                        <div className="flex items-center gap-3 text-[10px]">
                          <span className="text-accent">{cat.correct}✓</span>
                          <span className="text-red-400">{cat.wrong}✗</span>
                          <span className="text-muted">{cat.unanswered} offen</span>
                          <span className="font-bold text-sm">{cat.pct}%</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-lighter overflow-hidden">
                        <div className="h-full flex">
                          <div
                            className="h-full bg-accent transition-all duration-700"
                            style={{ width: `${(cat.correct / Math.max(cat.total, 1)) * 100}%` }}
                          />
                          <div
                            className="h-full bg-red-400 transition-all duration-700"
                            style={{ width: `${(cat.wrong / Math.max(cat.total, 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommendations */}
            {statsData.weakest.length > 0 && (
              <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5 sm:p-6 mb-6">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-400" />
                  Empfehlung: Diese Themen üben
                </h3>
                <div className="space-y-2">
                  {statsData.weakest.map((cat) => {
                    const Icon = iconMap[cat.icon] || BookOpen;
                    const colors = colorMap[cat.color] || colorMap.blue;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => startQuiz(cat.id, "smart")}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-surface/50 hover:bg-surface-light transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
                            <Icon className={`h-4 w-4 ${colors.text}`} />
                          </div>
                          <div className="text-left">
                            <span className="text-sm font-medium">{cat.name}</span>
                            <div className="text-[10px] text-muted">{cat.pct}% richtig — {cat.wrong} Fehler</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          Smart üben <ChevronRight className="h-3 w-3" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border bg-surface/50 p-4 text-center">
                <div className="text-lg font-bold text-orange-400 flex items-center justify-center gap-1">
                  <Flame className="h-4 w-4" />{progress.bestStreak}
                </div>
                <div className="text-[10px] text-muted">Beste Serie</div>
              </div>
              <div className="rounded-xl border border-border bg-surface/50 p-4 text-center">
                <div className="text-lg font-bold">{progress.totalCorrect + progress.totalWrong}</div>
                <div className="text-[10px] text-muted">Antworten gesamt</div>
              </div>
              <div className="rounded-xl border border-border bg-surface/50 p-4 text-center">
                <div className="text-lg font-bold text-accent">{progress.dailyDone}</div>
                <div className="text-[10px] text-muted">Heute gelernt</div>
              </div>
              <div className="rounded-xl border border-border bg-surface/50 p-4 text-center">
                <div className="text-lg font-bold">
                  {allQuestions.length - Object.keys(progress.questions).length}
                </div>
                <div className="text-[10px] text-muted">Noch offen</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
