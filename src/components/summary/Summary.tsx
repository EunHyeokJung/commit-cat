import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./Summary.css";

interface ActivityEvent {
  timestamp: string;
  eventType: string;
  xp: number;
  detail: string;
}

interface DailySummary {
  codingMinutes: number;
  commits: number;
  expGained: number;
}

interface XpStatus {
  level: number;
  currentExp: number;
  expToNext: number;
}

interface StreakInfo {
  streakDays: number;
  lastActiveDate: string | null;
}

const eventText: Record<string, string> = {
  commit: "i noticed a commit! \ud83d\udc3e",
  push: "pushed to remote! \ud83d\ude80",
  coding_hour: "a whole hour of coding! \ud83d\udcaa",
  late_night: "still coding at night... \ud83c\udf19",
  pomodoro: "focus session complete! \ud83c\udf45",
  pr_open: "opened a PR! \ud83d\udd00",
  pr_merge: "PR merged! \ud83c\udf89",
  level_up: "LEVEL UP! {detail} \ud83c\udf89",
  streak: "{detail} \ud83d\udd25",
};

function formatEvent(ev: ActivityEvent): string {
  const template = eventText[ev.eventType] || ev.detail;
  return template.replace("{detail}", ev.detail);
}

function formatMinutes(m: number): string {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

export function Summary() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [xp, setXp] = useState<XpStatus | null>(null);
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ev, sum, xpStatus, streakInfo] = await Promise.all([
          invoke<ActivityEvent[]>("get_today_events"),
          invoke<DailySummary>("get_today_summary"),
          invoke<XpStatus>("get_xp_status"),
          invoke<StreakInfo>("get_streak_info"),
        ]);
        setEvents(ev);
        setSummary(sum);
        setXp(xpStatus);
        setStreak(streakInfo);
      } catch (e) {
        console.error("Failed to load summary:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="summary__loading">loading...</div>;
  }

  return (
    <div className="summary">
      {/* Header */}
      <div className="summary__header">
        <div className="summary__speech">
          here's your day, hooman!
        </div>
      </div>

      {/* Stats */}
      {summary && (
        <div className="summary__stats">
          <div className="summary__stat">
            <span className="summary__stat-icon">{"\ud83d\udcbb"}</span>
            <span className="summary__stat-value">{formatMinutes(summary.codingMinutes)}</span>
            <span className="summary__stat-label">Coding</span>
          </div>
          <div className="summary__stat">
            <span className="summary__stat-icon">{"\ud83d\udc3e"}</span>
            <span className="summary__stat-value">{summary.commits}</span>
            <span className="summary__stat-label">Commits</span>
          </div>
          <div className="summary__stat">
            <span className="summary__stat-icon">{"\u2b50"}</span>
            <span className="summary__stat-value">+{summary.expGained}</span>
            <span className="summary__stat-label">XP Earned</span>
          </div>
          <div className="summary__stat">
            <span className="summary__stat-icon">{"\ud83d\udd25"}</span>
            <span className="summary__stat-value">{streak?.streakDays ?? 0}</span>
            <span className="summary__stat-label">Streak</span>
          </div>
          <div className="summary__stat">
            <span className="summary__stat-icon">{"\ud83c\udf1f"}</span>
            <span className="summary__stat-value">Lv.{xp?.level ?? 1}</span>
            <span className="summary__stat-label">Level</span>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="summary__timeline">
        <div className="summary__timeline-title">Activity Log</div>
        {events.length === 0 ? (
          <div className="summary__empty">
            no activity yet today...<br />
            go make some commits! {"\ud83d\udc3e"}
          </div>
        ) : (
          events.map((ev, i) => (
            <div key={i} className={`summary__event summary__event--${ev.eventType}`}>
              <span className="summary__event-time">{ev.timestamp}</span>
              <div className="summary__event-body">
                <div className="summary__event-text">{formatEvent(ev)}</div>
                {ev.xp > 0 && (
                  <div className="summary__event-xp">+{ev.xp} xp</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
