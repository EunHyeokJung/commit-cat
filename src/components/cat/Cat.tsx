import { useState, useRef, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import { listen } from "@tauri-apps/api/event";
import { sendNotification, isPermissionGranted, requestPermission } from "@tauri-apps/plugin-notification";
import { useCatStore } from "../../stores/catStore";
import { useShallow } from "zustand/react/shallow";
import "./Cat.css";

async function notify(title: string, body: string) {
  try {
    const settings = await invoke<{ notificationsEnabled?: boolean }>("get_settings");
    if (settings.notificationsEnabled === false) return;
    let granted = await isPermissionGranted();
    if (!granted) {
      const perm = await requestPermission();
      granted = perm === "granted";
    }
    if (granted) sendNotification({ title, body });
  } catch (_) {}
}

const WIN_W = 200;
const WIN_W_EXPANDED = 350;

const normalMessages = ["hey there~ 😺", "what's up? 🐾", "hi hi~ 💛", "oh, hello! 😸", "noticed me? 👀"];
const happyMessages = ["that feels nice~ 💛", "more more! 😻", "you're the best 🥰", "hehe~ 😸"];
const loveMessages = ["I love you so much~ 💕", "you're my favorite human 💗", "never stop... 🥺💛", "purrrrrr~ 💞"];
const annoyedMessages = ["okay I get it 😑", "a bit much... 🙄", "I was napping! 😾", "not now please 😤"];
const codingMessages = [
  "you're on a roll today 🔥", "ooh that's clean code 👀",
  "don't forget to save 💾", "hydration check! 💧",
  "nice focus session 💪", "you've been at it, take a breather? ☕",
  "this is coming together nicely ✨", "smooth typing today 🎹",
  "I believe in you 💛", "commit when you're ready 📦",
];

// 감정별 메시지
const surprisedMessages = ["whoa! what happened?! 😱", "oh no! 💥", "huh?! 😳", "that was unexpected! 😮"];
const excitedMessages = ["you're on fire!! 🔥🔥", "commit streak! 🚀", "unstoppable! ⚡", "keep going!! 💪✨"];
const proudMessages = ["we did it! 🏆", "so proud of us! 🌟", "amazing work! 👑", "look at that! ✨"];
const boredMessages = ["so bored... 😴", "anyone there? 🥱", "I miss coding... 💤", "come back soon~ 🐾"];
const angryMessages = ["not again!! 😡", "fix the bugs! 🔥", "grr... 💢", "this is frustrating! 😤"];

type Behavior = "walk" | "stand" | "sit" | "sleep";

interface XpResult {
  level: number;
  currentExp: number;
  expToNext: number;
  leveledUp: boolean;
}

// ══════════════════════════════════════
// 타이머 (별도 컴포넌트 — 매초 리렌더가 고양이에 영향 안 줌)
// ══════════════════════════════════════
function TimerDisplay({ showBubble }: { showBubble: (msg: string, duration?: number) => void }) {
  const pomodoroActive = useCatStore(s => s.pomodoroActive);
  const pomodoroPaused = useCatStore(s => s.pomodoroPaused);
  const pomodoroSeconds = useCatStore(s => s.pomodoroSeconds);
  const tickPomodoro = useCatStore(s => s.tickPomodoro);
  const stopPomodoro = useCatStore(s => s.stopPomodoro);
  const pausePomodoro = useCatStore(s => s.pausePomodoro);
  const resumePomodoro = useCatStore(s => s.resumePomodoro);
  const addPomodoro = useCatStore(s => s.addPomodoro);
  const breakActive = useCatStore(s => s.breakActive);
  const breakSeconds = useCatStore(s => s.breakSeconds);
  const tickBreak = useCatStore(s => s.tickBreak);
  const startBreak = useCatStore(s => s.startBreak);
  const stopBreak = useCatStore(s => s.stopBreak);
  const setCatState = useCatStore(s => s.setState);
  const setLevel = useCatStore(s => s.setLevel);
  const triggerLevelUp = useCatStore(s => s.triggerLevelUp);

  // 포모도로 tick
  useEffect(() => {
    if (!pomodoroActive || pomodoroPaused) return;
    const id = setInterval(() => tickPomodoro(), 1000);
    return () => clearInterval(id);
  }, [pomodoroActive, pomodoroPaused, tickPomodoro]);

  // 브레이크 tick
  useEffect(() => {
    if (!breakActive) return;
    const id = setInterval(() => tickBreak(), 1000);
    return () => clearInterval(id);
  }, [breakActive, tickBreak]);

  // 포모도로 완료
  useEffect(() => {
    if (!pomodoroActive || pomodoroSeconds > 0) return;
    stopPomodoro();
    addPomodoro();
    setCatState("celebrating");
    showBubble("focus session complete! 🎉", 3000);
    notify("CommitCat", "focus session complete! +20 XP");
    invoke<XpResult>("add_xp", { amount: 20, source: "pomodoro" }).then((res) => {
      setLevel(res.level, res.currentExp, res.expToNext);
      if (res.leveledUp) triggerLevelUp(res.level);
    }).catch(() => {});
    invoke<{ breakMinutes?: number }>("get_settings").then((s) => {
      const mins = s.breakMinutes ?? 5;
      startBreak(mins * 60);
    }).catch(() => startBreak(5 * 60));
  }, [pomodoroActive, pomodoroSeconds, stopPomodoro, addPomodoro, setCatState, showBubble, setLevel, triggerLevelUp, startBreak]);

  // 브레이크 완료
  useEffect(() => {
    if (!breakActive || breakSeconds > 0) return;
    stopBreak();
    showBubble("break's over, let's go! 💪", 3000);
    notify("CommitCat", "break's over! back to work~");
  }, [breakActive, breakSeconds, stopBreak, showBubble]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (pomodoroActive) {
    return (
      <div className="cat-timer">
        <span className="cat-timer__time">{formatTime(pomodoroSeconds)}</span>
        <button
          className="cat-timer__btn"
          onClick={() => pomodoroPaused ? resumePomodoro() : pausePomodoro()}
          title={pomodoroPaused ? "Resume" : "Pause"}
        >
          {pomodoroPaused ? "\u25B6" : "\u23F8"}
        </button>
        <button
          className="cat-timer__btn cat-timer__btn--stop"
          onClick={() => { stopPomodoro(); setCatState("idle"); }}
          title="Stop"
        >
          {"\u25A0"}
        </button>
      </div>
    );
  }

  if (breakActive) {
    return (
      <div className="cat-timer cat-timer--break">
        <span className="cat-timer__label">BREAK</span>
        <span className="cat-timer__time">{formatTime(breakSeconds)}</span>
        <button
          className="cat-timer__btn cat-timer__btn--stop"
          onClick={() => stopBreak()}
          title="Skip"
        >
          {"\u25A0"}
        </button>
      </div>
    );
  }

  return null;
}

// ══════════════════════════════════════
// 메인 고양이 컴포넌트
// ══════════════════════════════════════
export function Cat() {
  const {
    catColor, setCatColor, state: catState, levelUp, clearLevelUp,
    pomodoroActive, startPomodoro, stopPomodoro,
    setState: setCatState, emotion,
  } = useCatStore(useShallow(s => ({
    catColor: s.catColor, setCatColor: s.setCatColor,
    state: s.state, levelUp: s.levelUp, clearLevelUp: s.clearLevelUp,
    pomodoroActive: s.pomodoroActive,
    startPomodoro: s.startPomodoro, stopPomodoro: s.stopPomodoro,
    setState: s.setState, emotion: s.emotion,
  })));
  const appWindow = useRef(getCurrentWindow());

  // 투명 영역 클릭 통과 (드래그 중에는 비활성화)
  const ignoreRef = useRef(false);
  const catRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const win = appWindow.current;
    const PAD = 30;
    const IGNORE_DELAY = 200;
    let busy = false;
    let queued: boolean | null = null;
    let ignoreTimer: ReturnType<typeof setTimeout> | null = null;

    const applyIgnore = async (ignore: boolean) => {
      if (busy) { queued = ignore; return; }
      busy = true;
      try {
        await win.setIgnoreCursorEvents(ignore);
      } catch (_) {}
      busy = false;
      if (queued !== null) {
        const next = queued;
        queued = null;
        applyIgnore(next);
      }
    };

    const onMove = (e: MouseEvent) => {
      if (isDraggingRef.current) return;
      const { clientX: mx, clientY: my } = e;
      let hit = false;
      if (catRef.current) {
        const r = catRef.current.getBoundingClientRect();
        if (mx >= r.left - PAD && mx <= r.right + PAD && my >= r.top - PAD && my <= r.bottom + PAD) {
          hit = true;
        }
      }
      if (!hit) {
        const el = document.elementFromPoint(mx, my) as HTMLElement | null;
        if (el?.closest(".cat-context-menu, .cat-chat, .cat__bubble, .cat-timer")) {
          hit = true;
        }
      }
      const shouldIgnore = !hit;
      if (shouldIgnore === ignoreRef.current) return;

      if (shouldIgnore) {
        // 투명 영역 진입: 딜레이 후 클릭 통과 활성화
        if (!ignoreTimer) {
          ignoreTimer = setTimeout(() => {
            ignoreTimer = null;
            ignoreRef.current = true;
            applyIgnore(true);
          }, IGNORE_DELAY);
        }
      } else {
        // 고양이 영역 진입: 즉시 클릭 통과 해제
        if (ignoreTimer) { clearTimeout(ignoreTimer); ignoreTimer = null; }
        ignoreRef.current = false;
        applyIgnore(false);
      }
    };
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, []);

  // 트레이 메뉴에서 고양이 색상 변경 이벤트 수신
  useEffect(() => {
    const unlisten = listen<string>("change-cat-color", (event) => {
      setCatColor(event.payload as "white" | "brown" | "orange");
    });
    return () => { unlisten.then(fn => fn()); };
  }, [setCatColor]);

  const winPosRef = useRef({ x: 300, y: 200 });
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const didDrag = useRef(false);
  const dragStartMouse = useRef({ x: 0, y: 0 });
  const dragStartWin = useRef({ x: 0, y: 0 });
  const screenW = useRef(window.screen.width);

  // ── 말풍선 ──
  const [bubble, setBubble] = useState<string | null>(null);
  const [bubbleKey, setBubbleKey] = useState(0);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickCount = useRef(0);
  const clickResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const singleClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Petting (우클릭 + 좌우 스와이프) ──
  const isPettingRef = useRef(false);
  const petLastX = useRef(0);
  const petScore = useRef(0);
  const petTier = useRef(0);           // 0=none, 1=mild, 2=happy, 3=love
  const petLastDirection = useRef<"left" | "right" | null>(null);
  const petLastChangeTime = useRef(0);
  const [showPettingImg, setShowPettingImg] = useState(false);

  // ── AI 채팅 ──
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // ── 레벨업 연출 ──
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState(0);

  useEffect(() => {
    if (levelUp !== null) {
      setLevelUpLevel(levelUp);
      setShowLevelUp(true);
      const timer = setTimeout(() => {
        setShowLevelUp(false);
        clearLevelUp();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [levelUp, clearLevelUp]);

  // 포모도로 시작 시 → coding 상태
  useEffect(() => {
    if (pomodoroActive) {
      setCatState("coding");
    }
  }, [pomodoroActive, setCatState]);

  // ── 컨텍스트 메뉴 ──
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    const pos = await appWindow.current.outerPosition();
    const scale = await appWindow.current.scaleFactor();
    const shift = (WIN_W_EXPANDED - WIN_W) / 2;
    await appWindow.current.setSize(new LogicalSize(WIN_W_EXPANDED, 150));
    await appWindow.current.setPosition(new LogicalPosition(
      Math.round(pos.x / scale - shift),
      Math.round(pos.y / scale)
    ));
    setContextMenu({ x: 235, y: 20 });
  }, []);

  // 외부 클릭 시 메뉴 닫기
  const closeContextMenu = useCallback(async () => {
    setContextMenu(null);
    try {
      const pos = await appWindow.current.outerPosition();
      const scale = await appWindow.current.scaleFactor();
      const shift = (WIN_W_EXPANDED - WIN_W) / 2;
      await appWindow.current.setSize(new LogicalSize(WIN_W, 150));
      await appWindow.current.setPosition(new LogicalPosition(
        Math.round(pos.x / scale + shift),
        Math.round(pos.y / scale)
      ));
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => closeContextMenu();
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [contextMenu, closeContextMenu]);

  // 브라우저 기본 컨텍스트 메뉴 방지
  useEffect(() => {
    const prevent = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", prevent);
    return () => document.removeEventListener("contextmenu", prevent);
  }, []);

  // 메뉴가 윈도우 밖으로 넘어가면 위로 올리기
  useEffect(() => {
    if (!contextMenu || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    if (rect.bottom > window.innerHeight) {
      menuRef.current.style.top = `${Math.max(0, contextMenu.y - rect.height)}px`;
    }
    if (rect.right > window.innerWidth) {
      menuRef.current.style.left = `${Math.max(0, contextMenu.x - rect.width)}px`;
    }
  }, [contextMenu]);

  const openSummary = useCallback(async () => {
    closeContextMenu();
    const existing = await WebviewWindow.getByLabel("summary");
    if (existing) {
      await existing.setFocus();
      return;
    }
    new WebviewWindow("summary", {
      url: "/",
      title: "Today's Report",
      width: 400,
      height: 500,
      center: true,
      resizable: false,
    });
  }, []);

  const openSettings = useCallback(async () => {
    closeContextMenu();
    const existing = await WebviewWindow.getByLabel("settings");
    if (existing) {
      await existing.setFocus();
      return;
    }
    new WebviewWindow("settings", {
      url: "/",
      title: "CommitCat Settings",
      width: 500,
      height: 600,
      center: true,
      resizable: false,
    });
  }, []);

  const handleStartFocus = useCallback(async () => {
    closeContextMenu();
    try {
      const settings = await invoke<{ pomodoroMinutes?: number }>("get_settings");
      const minutes = settings.pomodoroMinutes ?? 25;
      startPomodoro(minutes * 60);
    } catch (_) {
      startPomodoro(25 * 60);
    }
  }, [startPomodoro]);

  const handleStopFocus = useCallback(() => {
    closeContextMenu();
    stopPomodoro();
    setCatState("idle");
  }, [stopPomodoro, setCatState]);

  const handleQuit = useCallback(async () => {
    closeContextMenu();
    await invoke("quit_app");
  }, []);

  // ── 행동 ──
  const [behavior, setBehavior] = useState<Behavior>("walk");

  // ── sleep 전용 상태 ──
  const sleepStartTime = useRef(0);
  const sleepClickCount = useRef(0);
  const sleepWakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // catState 변경 → 행동 오버라이드
  useEffect(() => {
    if (catState === "tired") setBehavior("sit");
    else if (catState === "sleeping") setBehavior("sleep");
    else if (catState === "celebrating") {
      setBehavior("stand");
      // 3초 후 자동 복귀 (store가 아직 celebrating이면 idle로)
      const id = setTimeout(() => {
        const current = useCatStore.getState().state;
        if (current === "celebrating") useCatStore.getState().setState("idle");
      }, 3000);
      return () => clearTimeout(id);
    } else if (catState === "frustrated") setBehavior("stand");
    // "idle" / "interaction" / "coding" → 기존 자체 사이클 유지
  }, [catState]);

  // 행동 전환: walk <-> stand <-> sit <-> sleep
  useEffect(() => {
    if (catState !== "idle" && catState !== "interaction" && catState !== "coding") return;

    let duration: number;
    let next: Behavior;

    if (behavior === "walk") {
      duration = 5000 + Math.random() * 5000;
      next = "stand";
    } else if (behavior === "stand") {
      if (Math.random() < 0.5) {
        duration = 2000 + Math.random() * 3000;
        next = "walk";
      } else {
        duration = 2000 + Math.random() * 2000;
        next = "sit";
      }
    } else if (behavior === "sit") {
      // sleep에서 깨워진 sit인 경우 다시 sleep으로
      if (sleepStartTime.current > 0 && Date.now() - sleepStartTime.current < 30000) {
        duration = 1500 + Math.random() * 1000;
        next = "sleep";
      } else if (Math.random() < 0.5) {
        duration = 2000 + Math.random() * 2000;
        next = "sleep";
      } else {
        duration = 5000 + Math.random() * 3000;
        next = "stand";
      }
    } else {
      // sleep -> 10~15초 후 stand
      duration = 10000 + Math.random() * 5000;
      next = "stand";
    }

    const id = setTimeout(() => {
      if (next !== "sleep" && next !== "sit") {
        sleepStartTime.current = 0;
        sleepClickCount.current = 0;
      }
      if (next === "sleep" && sleepStartTime.current === 0) {
        sleepStartTime.current = Date.now();
        sleepClickCount.current = 0;
      }
      setBehavior(next);
      if (next === "walk") {
        setDirection(Math.random() > 0.5 ? "right" : "left");
      }
    }, duration);
    return () => clearTimeout(id);
  }, [behavior, catState]);

  // ══════════════════════════════════════
  // 걷기 프레임: walk일 때만 stand/walk 교차
  // ══════════════════════════════════════
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (behavior !== "walk") { setFrame(0); return; }

    const id = setInterval(() => {
      setFrame(prev => (prev === 0 ? 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [behavior]);

  // 이미지 경로 결정
  const getImageSrc = () => {
    if (showPettingImg) return `/assets/cat/${catColor}_petting.png`;
    if (behavior === "sleep") return `/assets/cat/${catColor}_sit2.png`;
    if (behavior === "sit") return `/assets/cat/${catColor}_sit.png`;
    if (behavior === "stand") return `/assets/cat/${catColor}_stand.png`;
    return frame === 0
      ? `/assets/cat/${catColor}_stand.png`
      : `/assets/cat/${catColor}_walk.png`;
  };
  const imageSrc = getImageSrc();

  // ══════════════════════════════════════
  // 윈도우 이동
  // ══════════════════════════════════════
  const moveWindow = useCallback(async (x: number, y: number) => {
    winPosRef.current = { x, y };
    try {
      await appWindow.current.setPosition(new LogicalPosition(Math.round(x), Math.round(y)));
    } catch (_) {}
  }, []);

  // 태스크바/Dock 높이 고려하여 y 제한
  const maxY = useRef(window.screen.availHeight - 150);

  useEffect(() => {
    (async () => {
      try {
        const pos = await appWindow.current.outerPosition();
        const scale = await appWindow.current.scaleFactor();
        const logicalX = pos.x / scale;
        const logicalY = pos.y / scale;
        const clampedY = Math.min(logicalY, maxY.current);
        winPosRef.current = { x: logicalX, y: clampedY };
        if (logicalY > maxY.current) moveWindow(logicalX, clampedY);
      } catch (_) {}
    })();
  }, [moveWindow]);

  // ── 걸어다니기: walk 행동 + walk 프레임일 때만 이동 ──
  useEffect(() => {
    if (isDragging || showPettingImg || behavior !== "walk" || frame === 0) return;
    const id = setInterval(() => {
      const pos = winPosRef.current;
      const speed = 0.75;
      let newX = pos.x + (direction === "right" ? speed : -speed);
      const maxX = screenW.current - WIN_W;
      if (newX > maxX) { setDirection("left"); newX = maxX; }
      else if (newX < 0) { setDirection("right"); newX = 0; }
      moveWindow(newX, pos.y);
    }, 30);
    return () => clearInterval(id);
  }, [direction, isDragging, moveWindow, frame, behavior]);

  // ══════════════════════════════════════
  // 말풍선
  // ══════════════════════════════════════
  const [isAiBubble, setIsAiBubble] = useState(false);

  const dismissBubble = useCallback(async () => {
    setBubble(null);
    if (isAiBubble) {
      setIsAiBubble(false);
      try {
        const pos = await appWindow.current.outerPosition();
        const scale = await appWindow.current.scaleFactor();
        await appWindow.current.setSize(new LogicalSize(WIN_W, 150));
        await appWindow.current.setPosition(new LogicalPosition(
          Math.round(pos.x / scale),
          Math.round(pos.y / scale + 150)
        ));
      } catch (_) {}
    }
  }, [isAiBubble]);

  const showBubble = useCallback((msg: string, duration = 2000) => {
    setBubble(msg);
    setBubbleKey(k => k + 1);
    setIsAiBubble(false);
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => {
      setBubble(null);
    }, duration);
  }, []);

  // ── 감정 변경 시 말풍선 표시 ──
  useEffect(() => {
    if (!emotion) return;
    const msgMap: Record<string, string[]> = {
      surprised: surprisedMessages,
      excited: excitedMessages,
      proud: proudMessages,
      bored: boredMessages,
      angry: angryMessages,
    };
    const msgs = msgMap[emotion];
    if (msgs) {
      showBubble(msgs[Math.floor(Math.random() * msgs.length)], emotion === "bored" ? 4000 : 3000);
    }
  }, [emotion, showBubble]);

  // ── GitHub 이벤트 ──
  useEffect(() => {
    const unlisten = Promise.all([
      listen<string>("github:star-received", () => {
        showBubble("someone starred us! ⭐", 3000);
        notify("CommitCat", "someone starred your repo! \u2B50");
      }),
      listen("github:pr-opened", () => {
        showBubble("new PR opened! 🔀", 3000);
      }),
      listen("github:pr-merged", () => {
        setCatState("celebrating");
      }),
    ]);
    return () => { unlisten.then(fns => fns.forEach(fn => fn())); };
  }, [showBubble, setCatState]);

  // ── Streak 마일스톤 이벤트 수신 ──
  useEffect(() => {
    const unlisten = listen<{ days: number; bonus: number }>("streak:milestone", (event) => {
      showBubble(`${event.payload.days} day streak!`, 4000);
      setCatState("celebrating");
    });
    return () => { unlisten.then(fn => fn()); };
  }, [showBubble, setCatState]);

  // ── 업데이트 알림 수신 ──
  useEffect(() => {
    const unlisten = listen<{ latestVersion: string }>("update:available", (event) => {
      showBubble(`new version v${event.payload.latestVersion}!`, 5000);
      notify("CommitCat", `New version v${event.payload.latestVersion} available!`);
    });
    return () => { unlisten.then(fn => fn()); };
  }, [showBubble]);

  // ── 코딩 중 랜덤 말풍선 (3~10분 간격) ──
  const codingBubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (catState !== "coding") {
      if (codingBubbleTimer.current) {
        clearTimeout(codingBubbleTimer.current);
        codingBubbleTimer.current = null;
      }
      return;
    }

    const scheduleBubble = () => {
      const delay = (3 + Math.random() * 7) * 60_000; // 3~10분
      codingBubbleTimer.current = setTimeout(() => {
        const msg = codingMessages[Math.floor(Math.random() * codingMessages.length)];
        showBubble(msg, 3000);
        scheduleBubble();
      }, delay);
    };

    scheduleBubble();
    return () => {
      if (codingBubbleTimer.current) {
        clearTimeout(codingBubbleTimer.current);
        codingBubbleTimer.current = null;
      }
    };
  }, [catState, showBubble]);

  // ══════════════════════════════════════
  // 드래그
  // ══════════════════════════════════════
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 2) {
      // 우클릭: petting 추적 시작
      isPettingRef.current = true;
      petLastX.current = e.screenX;
      petScore.current = 0;
      petTier.current = 0;
      petLastDirection.current = null;
      petLastChangeTime.current = 0;
      return;
    }
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    ignoreRef.current = false;
    setIsDragging(true);
    appWindow.current.setIgnoreCursorEvents(false).catch(() => {});
    didDrag.current = false;
    dragStartMouse.current = { x: e.screenX, y: e.screenY };
    dragStartWin.current = { ...winPosRef.current };
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      didDrag.current = true;
      const dx = e.screenX - dragStartMouse.current.x;
      const dy = e.screenY - dragStartMouse.current.y;
      moveWindow(dragStartWin.current.x + dx, dragStartWin.current.y + dy);
    };
    const handleUp = () => {
      setIsDragging(false);
      isDraggingRef.current = false;
      if (didDrag.current) showBubble("wheee~! 🎢", 1500);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging, moveWindow, showBubble]);

  // ══════════════════════════════════════
  // Petting (우클릭 + 좌우 스와이프)
  // ══════════════════════════════════════
  useEffect(() => {
    const SPEED_THRESHOLD = 200; // ms — 이보다 빠르면 보너스

    const handlePetMove = (e: MouseEvent) => {
      if (!isPettingRef.current) return;
      const dx = e.screenX - petLastX.current;
      if (Math.abs(dx) < 5) return; // jitter 무시
      const dir = dx > 0 ? "right" : "left";
      if (petLastDirection.current && dir !== petLastDirection.current) {
        const now = Date.now();
        const fast = petLastChangeTime.current > 0 && (now - petLastChangeTime.current) < SPEED_THRESHOLD;
        petScore.current += fast ? 2 : 1;
        petLastChangeTime.current = now;

        // 티어별 말풍선 (각 티어는 한 번만 발동)
        const score = petScore.current;
        if (score >= 10 && petTier.current < 3) {
          petTier.current = 3;
          showBubble(loveMessages[Math.floor(Math.random() * loveMessages.length)], 3000);
        } else if (score >= 6 && petTier.current < 2) {
          petTier.current = 2;
          setShowPettingImg(true);
          showBubble(happyMessages[Math.floor(Math.random() * happyMessages.length)], 2500);
        } else if (score >= 3 && petTier.current < 1) {
          petTier.current = 1;
          showBubble(normalMessages[Math.floor(Math.random() * normalMessages.length)], 2000);
        }
      }
      petLastDirection.current = dir;
      petLastX.current = e.screenX;
    };
    const handlePetUp = (e: MouseEvent) => {
      if (e.button !== 2) return;
      if (!isPettingRef.current) return;
      isPettingRef.current = false;
      setShowPettingImg(false);
      if (petTier.current === 0) {
        // 쓰담 아님 → 기존 컨텍스트 메뉴 호출
        handleContextMenu(e as unknown as React.MouseEvent);
      }
    };
    window.addEventListener("mousemove", handlePetMove);
    window.addEventListener("mouseup", handlePetUp);
    return () => {
      window.removeEventListener("mousemove", handlePetMove);
      window.removeEventListener("mouseup", handlePetUp);
    };
  }, [showBubble, handleContextMenu]);

  // ══════════════════════════════════════
  // 클릭
  // ══════════════════════════════════════
  const sleepAnnoyedMessages = ["five more minutes... 😴", "shh I'm dreaming 💤", "come back later... 🌙", "not now... 😾"];

  const handleClick = () => {
    if (didDrag.current) return;
    // 더블클릭과 구분하기 위해 약간 지연
    if (singleClickTimer.current) clearTimeout(singleClickTimer.current);
    singleClickTimer.current = setTimeout(async () => {
      try { await invoke<string>("click_cat"); } catch (_) {}

      // sleep 중 클릭: 잠깐 눈 뜨고 다시 잠들기
      if (behavior === "sleep") {
        sleepClickCount.current += 1;
        if (sleepClickCount.current >= 5) {
          const msg = sleepAnnoyedMessages[Math.floor(Math.random() * sleepAnnoyedMessages.length)];
          showBubble(msg);
        } else {
          showBubble("hmm...? 😪", 1500);
        }
        setBehavior("sit");
        if (sleepWakeTimer.current) clearTimeout(sleepWakeTimer.current);
        sleepWakeTimer.current = setTimeout(() => setBehavior("sleep"), 2000);
        return;
      }

      clickCount.current += 1;
      const count = clickCount.current;
      if (clickResetTimer.current) clearTimeout(clickResetTimer.current);
      clickResetTimer.current = setTimeout(() => { clickCount.current = 0; }, 3000);
      const msgs = count <= 2 ? normalMessages : count <= 5 ? happyMessages : annoyedMessages;
      showBubble(msgs[Math.floor(Math.random() * msgs.length)]);
    }, 250);
  };

  // ══════════════════════════════════════
  // AI 채팅
  // ══════════════════════════════════════
  const openChat = useCallback(async () => {
    if (chatOpen || chatLoading) return;
    try {
      const settings = await invoke<{ anthropicApiKey?: string | null; openaiApiKey?: string | null; aiProvider?: string }>("get_settings");
      const provider = settings.aiProvider === "openai" ? "openai-api" : (settings.aiProvider || "claude");

      if (provider === "openai-codex-local") {
        const codexStatus = await invoke<{ available: boolean; connected: boolean; statusMessage: string }>("get_codex_provider_status");
        if (!codexStatus.available || !codexStatus.connected) {
          showBubble(codexStatus.statusMessage, 3000);
          return;
        }
      } else {
        const hasKey = provider === "openai-api" ? !!settings.openaiApiKey : !!settings.anthropicApiKey;
        if (!hasKey) {
          showBubble("set API key in settings first 🔑", 3000);
          return;
        }
      }

      if (!["claude", "openai-api", "openai-codex-local"].includes(provider)) {
        showBubble("check AI provider in settings ⚙️", 3000);
        return;
      }
    } catch (_) {
      showBubble("something went wrong... 😿", 2000);
      return;
    }
    await appWindow.current.setSize(new LogicalSize(220, 180));
    setChatOpen(true);
    setChatInput("");
    setTimeout(() => chatInputRef.current?.focus(), 100);
  }, [chatOpen, chatLoading, showBubble]);

  const closeChat = useCallback(async () => {
    setChatOpen(false);
    setChatInput("");
    await appWindow.current.setSize(new LogicalSize(WIN_W, 150));
  }, []);

  const sendChat = useCallback(async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatLoading(true);
    setChatOpen(false);
    setChatInput("");
    await appWindow.current.setSize(new LogicalSize(WIN_W, 150));
    showBubble("thinking... 🤔", 30000);
    try {
      const response = await invoke<string>("chat_with_cat", { message: msg });
      // AI 응답: 윈도우 넓히고, 클릭할 때까지 유지
      const pos = await appWindow.current.outerPosition();
      const scale = await appWindow.current.scaleFactor();
      await appWindow.current.setSize(new LogicalSize(WIN_W_EXPANDED, 300));
      await appWindow.current.setPosition(new LogicalPosition(
        Math.round(pos.x / scale),
        Math.round(pos.y / scale - 150)
      ));
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
      setBubble(response);
      setBubbleKey(k => k + 1);
      setIsAiBubble(true);
    } catch (e) {
      console.error("chat_with_cat error:", e);
      showBubble("can't think right now... 😿", 3000);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, showBubble]);

  const handleChatKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendChat();
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeChat();
    }
  }, [sendChat, closeChat]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (didDrag.current) return;
    // 싱글클릭 타이머 취소
    if (singleClickTimer.current) {
      clearTimeout(singleClickTimer.current);
      singleClickTimer.current = null;
    }
    openChat();
  }, [openChat]);

  // ══════════════════════════════════════
  // 렌더
  // ══════════════════════════════════════
  const isFlipped = direction === "right";

  return (
    <div className="cat-window">
      <div className="bubble-area">
        {showLevelUp ? (
          <div className="cat__bubble cat__bubble--levelup" key={`lvl-${levelUpLevel}`}>
            LEVEL UP! Lv.{levelUpLevel}
          </div>
        ) : bubble ? (
          <div
            className={`cat__bubble${isAiBubble ? " cat__bubble--ai" : ""}`}
            key={bubbleKey}
            onClick={isAiBubble ? dismissBubble : undefined}
            style={isAiBubble ? { pointerEvents: "auto", cursor: "pointer" } : undefined}
          >{bubble}</div>
        ) : (
          <TimerDisplay showBubble={showBubble} />
        )}
      </div>
      <div
        ref={catRef}
        className={`cat ${isDragging ? "cat--dragging" : ""} ${catState !== "idle" ? `cat--${catState}` : ""} ${emotion && !showPettingImg ? `cat--emotion-${emotion}` : ""}`}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <div
          className="cat__sprite"
          style={{ transform: isFlipped ? "scaleX(-1)" : "scaleX(1)" }}
        >
          <img
            className={`cat__image cat__image--${catColor} ${showPettingImg ? "cat__image--petting" : ""} ${behavior === "walk" && frame === 1 ? "cat__image--walk" : ""} ${behavior === "sit" ? "cat__image--sit" : ""} ${behavior === "sleep" ? "cat__image--sleep" : ""}`}
            src={imageSrc}
            alt="cat"
            draggable={false}
          />
        </div>
        {(behavior === "sleep" || catState === "sleeping") && <div className="cat__zzz" style={direction === "right" ? { left: "auto", right: "5px" } : undefined}>z z z</div>}
        {showLevelUp && (
          <div className={`cat__level-particles cat__level-particles--${catColor}`}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className={`cat__pixel-particle cat__pixel-particle--${i}`} />
            ))}
          </div>
        )}
      </div>
      {contextMenu && (
        <div
          ref={menuRef}
          className="cat-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {pomodoroActive ? (
            <button className="cat-context-menu__item" onClick={handleStopFocus}>Stop Focus</button>
          ) : (
            <button className="cat-context-menu__item" onClick={handleStartFocus}>Start Focus</button>
          )}
          <button className="cat-context-menu__item" onClick={openSummary}>Today</button>
          <button className="cat-context-menu__item" onClick={openSettings}>Settings</button>
          <div className="cat-context-menu__separator" />
          <button className="cat-context-menu__item cat-context-menu__item--quit" onClick={handleQuit}>Quit</button>
        </div>
      )}
      {chatOpen && (
        <div className="cat-chat" onMouseDown={(e) => e.stopPropagation()}>
          <input
            ref={chatInputRef}
            className="cat-chat__input"
            type="text"
            placeholder="talk to me~"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleChatKeyDown}
            onBlur={() => setTimeout(() => closeChat(), 150)}
            maxLength={200}
          />
          <button
            className="cat-chat__btn"
            onClick={sendChat}
            disabled={!chatInput.trim()}
          >
            &#x2191;
          </button>
        </div>
      )}
    </div>
  );
}
