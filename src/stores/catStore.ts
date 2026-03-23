import { create } from "zustand";

type CatState =
  | "idle"
  | "coding"
  | "celebrating"
  | "frustrated"
  | "sleeping"
  | "tired"
  | "interaction";

type CatMood = "happy" | "sad" | "sleeping" | "focused" | "excited";
type CatColor = "white" | "brown" | "orange";

interface CatStore {
  // State
  state: CatState;
  mood: CatMood;
  level: number;
  exp: number;
  expToNext: number;
  streakDays: number;
  catColor: CatColor;

  // Activity
  activeIde: string | null;
  idleSeconds: number;

  // Today
  todayCodingMinutes: number;
  todayCommits: number;
  todayPomodoros: number;

  // Level up
  levelUp: number | null;

  // Pomodoro
  pomodoroActive: boolean;
  pomodoroPaused: boolean;
  pomodoroSeconds: number;
  pomodoroTotal: number;

  // Actions
  setState: (state: string) => void;
  setLevel: (level: number, exp: number, expToNext: number) => void;
  setCatColor: (color: CatColor) => void;
  setActiveIde: (ide: string | null) => void;
  setIdleSeconds: (seconds: number) => void;
  addCommit: () => void;
  addCodingMinute: () => void;
  addPomodoro: () => void;
  triggerLevelUp: (level: number) => void;
  clearLevelUp: () => void;
  startPomodoro: (totalSeconds: number) => void;
  pausePomodoro: () => void;
  resumePomodoro: () => void;
  stopPomodoro: () => void;
  tickPomodoro: () => void;
}

const moodFromState = (state: CatState): CatMood => {
  const map: Record<CatState, CatMood> = {
    idle: "happy",
    coding: "focused",
    celebrating: "excited",
    frustrated: "sad",
    sleeping: "sleeping",
    tired: "sad",
    interaction: "happy",
  };
  return map[state] ?? "happy";
};

export const useCatStore = create<CatStore>((set) => ({
  // Initial state
  state: "idle",
  mood: "happy",
  level: 1,
  exp: 0,
  expToNext: 100,
  streakDays: 0,
  catColor: "brown",

  levelUp: null,

  activeIde: null,
  idleSeconds: 0,

  todayCodingMinutes: 0,
  todayCommits: 0,
  todayPomodoros: 0,

  pomodoroActive: false,
  pomodoroPaused: false,
  pomodoroSeconds: 0,
  pomodoroTotal: 0,

  // Actions
  setState: (state) =>
    set({
      state: state as CatState,
      mood: moodFromState(state as CatState),
    }),

  setLevel: (level, exp, expToNext) =>
    set({ level, exp, expToNext }),

  setCatColor: (color) =>
    set({ catColor: color }),

  setActiveIde: (ide) =>
    set({ activeIde: ide }),

  setIdleSeconds: (seconds) =>
    set({ idleSeconds: seconds }),

  addCommit: () =>
    set((s) => ({ todayCommits: s.todayCommits + 1 })),

  addCodingMinute: () =>
    set((s) => ({ todayCodingMinutes: s.todayCodingMinutes + 1 })),

  addPomodoro: () =>
    set((s) => ({ todayPomodoros: s.todayPomodoros + 1 })),

  triggerLevelUp: (level) =>
    set({ levelUp: level }),

  clearLevelUp: () =>
    set({ levelUp: null }),

  startPomodoro: (totalSeconds) =>
    set({ pomodoroActive: true, pomodoroPaused: false, pomodoroSeconds: totalSeconds, pomodoroTotal: totalSeconds }),

  pausePomodoro: () =>
    set({ pomodoroPaused: true }),

  resumePomodoro: () =>
    set({ pomodoroPaused: false }),

  stopPomodoro: () =>
    set({ pomodoroActive: false, pomodoroPaused: false, pomodoroSeconds: 0, pomodoroTotal: 0 }),

  tickPomodoro: () =>
    set((s) => {
      if (!s.pomodoroActive || s.pomodoroPaused || s.pomodoroSeconds <= 0) return {};
      return { pomodoroSeconds: s.pomodoroSeconds - 1 };
    }),
}));
