import { useCatStore } from "../../stores/catStore";

/**
 * 🐾 트레이 미니 패널
 * 상태바 아이콘 클릭 시 표시되는 요약 패널
 */
export function TrayPanel() {
  const { level, exp, expToNext, todayCodingMinutes, todayCommits, todayPomodoros, mood } =
    useCatStore();

  const moodEmoji: Record<string, string> = {
    happy: "😺",
    sad: "😿",
    sleeping: "😴",
    focused: "🔥",
    excited: "💥",
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  const expPercent = expToNext > 0 ? Math.round((exp / expToNext) * 100) : 0;

  return (
    <div className="tray-panel">
      <div className="tray-panel__header">
        <span className="tray-panel__mood">{moodEmoji[mood] ?? "🐱"}</span>
        <span className="tray-panel__level">Lv.{level}</span>
        <div className="tray-panel__exp-bar">
          <div
            className="tray-panel__exp-fill"
            style={{ width: `${expPercent}%` }}
          />
        </div>
      </div>

      <div className="tray-panel__stats">
        <div className="tray-panel__stat">
          <span>⌨️</span>
          <span>{formatTime(todayCodingMinutes)}</span>
        </div>
        <div className="tray-panel__stat">
          <span>📝</span>
          <span>{todayCommits} commits</span>
        </div>
        <div className="tray-panel__stat">
          <span>🍅</span>
          <span>{todayPomodoros} sessions</span>
        </div>
      </div>
    </div>
  );
}
