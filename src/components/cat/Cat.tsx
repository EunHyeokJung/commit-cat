import { useState, useRef, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalPosition } from "@tauri-apps/api/dpi";
import { listen } from "@tauri-apps/api/event";
import { useCatStore } from "../../stores/catStore";
import "./Cat.css";

const WIN_W = 200;

const normalMessages = ["meow!", "nya~", "purr...", "mrrp?", "*stretch*", "code with me~", "prrrr~"];
const happyMessages = ["love it!", "more pets!", "purrrr~", "nya nya~!"];
const annoyedMessages = ["...meow.", "okay okay!", "I'm busy!", "stahp!"];

type Behavior = "walk" | "stand" | "sit" | "sleep";

interface XpResult {
  level: number;
  currentExp: number;
  expToNext: number;
  leveledUp: boolean;
}

export function Cat() {
  const { catColor, setCatColor, state: catState, levelUp, clearLevelUp } = useCatStore();
  const {
    pomodoroActive, pomodoroPaused, pomodoroSeconds,
    startPomodoro, pausePomodoro, resumePomodoro, stopPomodoro, tickPomodoro,
    addPomodoro, setState: setCatState, setLevel, triggerLevelUp,
  } = useCatStore();
  const appWindow = useRef(getCurrentWindow());

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

  // ── 포모도로 tick ──
  useEffect(() => {
    if (!pomodoroActive || pomodoroPaused) return;
    const id = setInterval(() => tickPomodoro(), 1000);
    return () => clearInterval(id);
  }, [pomodoroActive, pomodoroPaused, tickPomodoro]);

  // 포모도로 시작 시 → coding 상태
  useEffect(() => {
    if (pomodoroActive) {
      setCatState("coding");
    }
  }, [pomodoroActive, setCatState]);

  // ── 컨텍스트 메뉴 ──
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [contextMenu]);

  const openSummary = useCallback(async () => {
    setContextMenu(null);
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
    setContextMenu(null);
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
    setContextMenu(null);
    try {
      const settings = await invoke<{ pomodoroMinutes?: number }>("get_settings");
      const minutes = settings.pomodoroMinutes ?? 25;
      startPomodoro(minutes * 60);
    } catch (_) {
      startPomodoro(25 * 60);
    }
  }, [startPomodoro]);

  const handleStopFocus = useCallback(() => {
    setContextMenu(null);
    stopPomodoro();
    setCatState("idle");
  }, [stopPomodoro, setCatState]);

  const handleQuit = useCallback(async () => {
    setContextMenu(null);
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
    if (catState === "coding" || catState === "tired") setBehavior("sit");
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
    // "idle" / "interaction" → 기존 자체 사이클 유지
  }, [catState]);

  // 행동 전환: walk <-> stand <-> sit <-> sleep (idle일 때만)
  useEffect(() => {
    if (catState !== "idle" && catState !== "interaction") return;

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
      // sleep -> 30초 후 stand
      duration = 30000 + Math.random() * 10000;
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

  // sit/sit2 이미지가 있는 색상
  const hasSit = catColor === "brown" || catColor === "orange";

  // 이미지 경로 결정
  const getImageSrc = () => {
    if (behavior === "sleep") return hasSit ? `/assets/cat/${catColor}_sit2.png` : `/assets/cat/${catColor}_stand.png`;
    if (behavior === "sit") return hasSit ? `/assets/cat/${catColor}_sit.png` : `/assets/cat/${catColor}_stand.png`;
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

  // macOS Dock 높이(약 70px) 고려하여 y 제한
  const maxY = useRef(window.screen.height - 150 - 70);

  useEffect(() => {
    (async () => {
      try {
        const pos = await appWindow.current.outerPosition();
        const clampedY = Math.min(pos.y, maxY.current);
        winPosRef.current = { x: pos.x, y: clampedY };
        if (pos.y > maxY.current) moveWindow(pos.x, clampedY);
      } catch (_) {}
    })();
  }, [moveWindow]);

  // ── 걸어다니기: walk 행동 + walk 프레임일 때만 이동 ──
  useEffect(() => {
    if (isDragging || behavior !== "walk" || frame === 0) return;
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
  const showBubble = useCallback((msg: string, duration = 2000) => {
    setBubble(msg);
    setBubbleKey(k => k + 1);
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), duration);
  }, []);

  // ── 포모도로 완료 감지 ──
  useEffect(() => {
    if (!pomodoroActive || pomodoroSeconds > 0) return;
    stopPomodoro();
    addPomodoro();
    setCatState("celebrating");
    showBubble("focus complete! good job hooman!", 3000);
    invoke<XpResult>("add_xp", { amount: 20, source: "pomodoro" }).then((res) => {
      setLevel(res.level, res.currentExp, res.expToNext);
      if (res.leveledUp) triggerLevelUp(res.level);
    }).catch(() => {});
  }, [pomodoroActive, pomodoroSeconds, stopPomodoro, addPomodoro, setCatState, showBubble, setLevel, triggerLevelUp]);

  // ══════════════════════════════════════
  // 드래그
  // ══════════════════════════════════════
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
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
      if (didDrag.current) showBubble("wheee~!", 1500);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging, moveWindow, showBubble]);

  // ══════════════════════════════════════
  // 클릭
  // ══════════════════════════════════════
  const sleepAnnoyedMessages = ["zzz... stop...", "let me sleep...", "5 more minutes...", "go away..."];

  const handleClick = async () => {
    if (didDrag.current) return;
    try { await invoke<string>("click_cat"); } catch (_) {}

    // sleep 중 클릭: 잠깐 눈 뜨고 다시 잠들기
    if (behavior === "sleep") {
      sleepClickCount.current += 1;
      if (sleepClickCount.current >= 5) {
        const msg = sleepAnnoyedMessages[Math.floor(Math.random() * sleepAnnoyedMessages.length)];
        showBubble(msg);
      } else {
        showBubble("...mrrp?", 1500);
      }
      // 눈 뜨기 (sit) -> 2초 후 다시 잠들기 (sleep)
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
  };

  // ══════════════════════════════════════
  // 렌더
  // ══════════════════════════════════════
  const isFlipped = direction === "right";

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="cat-window">
      <div className="bubble-area">
        {showLevelUp ? (
          <div className="cat__bubble cat__bubble--levelup" key={`lvl-${levelUpLevel}`}>
            LEVEL UP! Lv.{levelUpLevel}
          </div>
        ) : bubble ? (
          <div className="cat__bubble" key={bubbleKey}>{bubble}</div>
        ) : pomodoroActive ? (
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
        ) : null}
      </div>
      <div
        className={`cat ${isDragging ? "cat--dragging" : ""} ${catState !== "idle" ? `cat--${catState}` : ""}`}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <div
          className="cat__sprite"
          style={{ transform: isFlipped ? "scaleX(-1)" : "scaleX(1)" }}
        >
          <img
            className={`cat__image cat__image--${catColor} ${behavior === "walk" && frame === 1 ? "cat__image--walk" : ""} ${behavior === "sit" ? "cat__image--sit" : ""} ${behavior === "sleep" ? "cat__image--sleep" : ""}`}
            src={imageSrc}
            alt="cat"
            draggable={false}
          />
        </div>
        {(behavior === "sleep" || catState === "sleeping") && hasSit && <div className="cat__zzz" style={direction === "right" ? { left: "auto", right: "5px" } : undefined}>z z z</div>}
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
    </div>
  );
}
