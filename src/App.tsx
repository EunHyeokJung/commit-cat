import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { sendNotification, isPermissionGranted, requestPermission } from "@tauri-apps/plugin-notification";
import { Cat } from "./components/cat/Cat";
import { useCatStore } from "./stores/catStore";

// 백엔드에서 오는 상태 데이터
interface ActivityStatus {
  isIdeRunning: boolean;
  activeIde: string | null;
  idleSeconds: number;
}

interface XpResult {
  level: number;
  currentExp: number;
  expToNext: number;
  leveledUp: boolean;
}

interface XpStatus {
  level: number;
  currentExp: number;
  expToNext: number;
}

/** 설정 확인 후 알림 전송 */
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

function App() {
  const { setState, setActiveIde, setIdleSeconds, addCodingMinute, setLevel, triggerLevelUp } = useCatStore();

  // celebrating/interaction 같은 임시 상태의 자동 복귀 타이머
  const tempStateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 코딩 시간 카운터 (1분마다)
  const codingTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // XP 코딩 시간 카운터 (60분마다 +5 XP)
  const xpCodingMinutes = useRef(0);

  // 야간 코딩 XP (세션당 1회)
  const lateNightXpGiven = useRef(false);

  // 앱 초기화: XP 상태 동기화
  useEffect(() => {
    (async () => {
      try {
        const status = await invoke<XpStatus>("get_xp_status");
        setLevel(status.level, status.currentExp, status.expToNext);
      } catch (e) {
        console.error("Failed to load XP status:", e);
      }
    })();
  }, [setLevel]);

  useEffect(() => {
    const unlisten = Promise.all([
      // ── IDE 감지됨 → coding ──
      listen<string>("activity:ide-detected", (event) => {
        const ideName = event.payload;
        setActiveIde(ideName);
        setState("coding");

        // 코딩 시간 카운트 시작
        if (!codingTimer.current) {
          codingTimer.current = setInterval(() => {
            addCodingMinute();
            invoke("add_coding_minute").catch(() => {});

            // XP: 60분마다 +5
            xpCodingMinutes.current += 1;
            if (xpCodingMinutes.current >= 60) {
              xpCodingMinutes.current = 0;
              invoke<XpResult>("add_xp", { amount: 5, source: "coding_hour" }).then((res) => {
                setLevel(res.level, res.currentExp, res.expToNext);
              }).catch(() => {});
            }
          }, 60_000);
        }
      }),

      // ── IDE 꺼짐 → idle ──
      listen("activity:ide-closed", () => {
        setActiveIde(null);
        setState("idle");

        // 코딩 시간 카운트 중지
        if (codingTimer.current) {
          clearInterval(codingTimer.current);
          codingTimer.current = null;
        }
      }),

      // ── 유휴 → idle ──
      listen<number>("activity:idle", () => {
        setState("idle");
      }),

      // ── 장시간 유휴 → sleeping ──
      listen<number>("activity:sleeping", () => {
        setState("sleeping");

        if (codingTimer.current) {
          clearInterval(codingTimer.current);
          codingTimer.current = null;
        }
      }),

      // ── 밤 코딩 → tired + XP ──
      listen<number>("activity:late-night-coding", () => {
        // coding 상태에서만 tired로
        const current = useCatStore.getState().state;
        if (current === "coding") {
          setState("tired");
        }

        // 야간 코딩 XP (세션당 1회)
        if (!lateNightXpGiven.current) {
          lateNightXpGiven.current = true;
          invoke<XpResult>("add_xp", { amount: 15, source: "late_night" }).then((res) => {
            setLevel(res.level, res.currentExp, res.expToNext);
          }).catch(() => {});
        }
      }),

      // ── 주기적 상태 보고 (초기 상태 동기화 포함) ──
      listen<ActivityStatus>("activity:status", (event) => {
        const status = event.payload;
        setIdleSeconds(status.idleSeconds);

        // 현재 상태와 IDE 상태 동기화
        const currentState = useCatStore.getState().state;
        const currentIde = useCatStore.getState().activeIde;

        if (status.isIdeRunning && !currentIde) {
          // IDE가 실행 중인데 아직 감지 안됨 → coding
          setActiveIde(status.activeIde);
          if (currentState === "idle") {
            setState("coding");
          }
        } else if (!status.isIdeRunning && currentIde) {
          // IDE가 꺼졌는데 아직 반영 안됨 → idle
          setActiveIde(null);
          if (currentState === "coding") {
            setState("idle");
          }
        }
      }),

      // ── Git 커밋 → celebrating (임시) + XP ──
      listen("git:new-commit", () => {
        if (tempStateTimer.current) clearTimeout(tempStateTimer.current);
        setState("celebrating");
        tempStateTimer.current = setTimeout(() => {
          // 이전 상태로 복귀
          const ide = useCatStore.getState().activeIde;
          setState(ide ? "coding" : "idle");
        }, 3000);

        // 커밋 XP +10
        invoke<XpResult>("add_xp", { amount: 10, source: "commit" }).then((res) => {
          setLevel(res.level, res.currentExp, res.expToNext);
        }).catch(() => {});

        notify("CommitCat", "new commit! +10 XP \uD83D\uDC3E");
      }),

      // ── Git push → XP +5 ──
      listen("git:new-push", () => {
        invoke<XpResult>("add_xp", { amount: 5, source: "push" }).then((res) => {
          setLevel(res.level, res.currentExp, res.expToNext);
        }).catch(() => {});
      }),

      // ── XP 레벨업 이벤트 (백엔드에서 emit) ──
      listen<number>("xp:level-up", (event) => {
        triggerLevelUp(event.payload);
        notify("CommitCat", `LEVEL UP! You reached Lv.${event.payload}`);
      }),

      // ── 풀스크린 ──
      listen<boolean>("activity:fullscreen", (event) => {
        const el = document.getElementById("root");
        if (el) {
          el.style.display = event.payload ? "none" : "block";
        }
      }),
    ]);

    return () => {
      unlisten.then((fns) => fns.forEach((fn) => fn()));
      if (codingTimer.current) clearInterval(codingTimer.current);
    };
  }, [setState, setActiveIde, setIdleSeconds, addCodingMinute, setLevel, triggerLevelUp]);

  return <Cat />;
}

export default App;
