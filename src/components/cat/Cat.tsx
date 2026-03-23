import { useState, useRef, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalPosition } from "@tauri-apps/api/dpi";
import { useCatStore } from "../../stores/catStore";
import "./Cat.css";

const WIN_W = 200;

const normalMessages = ["meow!", "nya~", "purr...", "mrrp?", "*stretch*", "code with me~", "prrrr~"];
const happyMessages = ["love it!", "more pets!", "purrrr~", "nya nya~!"];
const annoyedMessages = ["...meow.", "okay okay!", "I'm busy!", "stahp!"];

export function Cat() {
  const { catColor } = useCatStore();
  const appWindow = useRef(getCurrentWindow());

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

  // ══════════════════════════════════════
  // 걷기 프레임: 단순 setInterval로 0/1 토글
  // ══════════════════════════════════════
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setFrame(prev => (prev === 0 ? 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // 이미지 경로: frame에 따라 stand/walk 교차
  const imageSrc = frame === 0
    ? `/assets/cat/${catColor}_stand.png`
    : `/assets/cat/${catColor}_walk.png`;

  // 임시: 흰 고양이 비교용
  const whiteImageSrc = frame === 0
    ? `/assets/cat/white_stand.png`
    : `/assets/cat/white_walk.png`;


  // ══════════════════════════════════════
  // 윈도우 이동
  // ══════════════════════════════════════
  const moveWindow = useCallback(async (x: number, y: number) => {
    winPosRef.current = { x, y };
    try {
      await appWindow.current.setPosition(new LogicalPosition(Math.round(x), Math.round(y)));
    } catch (_) {}
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const pos = await appWindow.current.outerPosition();
        winPosRef.current = { x: pos.x, y: pos.y };
      } catch (_) {}
    })();
  }, []);

  // ── 걸어다니기: walk 프레임(frame===1)일 때만 이동, stand(frame===0)일 때 정지 ──
  useEffect(() => {
    if (isDragging || frame === 0) return;
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
  }, [direction, isDragging, moveWindow, frame]);

  // ══════════════════════════════════════
  // 말풍선
  // ══════════════════════════════════════
  const showBubble = useCallback((msg: string, duration = 2000) => {
    setBubble(msg);
    setBubbleKey(k => k + 1);
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), duration);
  }, []);

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
  const handleClick = async () => {
    if (didDrag.current) return;
    try { await invoke<string>("click_cat"); } catch (_) {}
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

  return (
    <div className="cat-window">
      <div className="bubble-area">
        {bubble && (
          <div className="cat__bubble" key={bubbleKey}>{bubble}</div>
        )}
      </div>
      <div
        className={`cat ${isDragging ? "cat--dragging" : ""}`}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
      >
        <div
          className="cat__sprite"
          style={{ transform: isFlipped ? "scaleX(-1)" : "scaleX(1)" }}
        >
          <img
            className={`cat__image cat__image--${catColor} ${frame === 1 ? "cat__image--walk" : ""}`}
            src={imageSrc}
            alt="cat"
            draggable={false}
          />
          <img
            className={`cat__image cat__image--white ${frame === 1 ? "cat__image--walk" : ""}`}
            src={whiteImageSrc}
            alt="white cat"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
