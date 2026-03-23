use crate::models::activity::ActivityEvent;
use crate::models::growth::{exp_for_level, LevelInfo};
use crate::services::storage;
use chrono::Local;
use serde::Serialize;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AddXpResult {
    pub level: u32,
    pub current_exp: u32,
    pub exp_to_next: u32,
    pub leveled_up: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StreakInfo {
    pub streak_days: u32,
    pub last_active_date: Option<String>,
}

#[tauri::command]
pub async fn get_xp_status(app: AppHandle) -> Result<LevelInfo, String> {
    let data = storage::load(&app)?;
    let cat = &data.cat;
    Ok(LevelInfo {
        level: cat.level,
        current_exp: cat.exp,
        exp_to_next: exp_for_level(cat.level),
        total_exp: 0,
    })
}

#[tauri::command]
pub async fn get_streak_info(app: AppHandle) -> Result<StreakInfo, String> {
    let data = storage::load(&app)?;
    Ok(StreakInfo {
        streak_days: data.cat.streak_days,
        last_active_date: data.cat.last_active_date.clone(),
    })
}

#[tauri::command]
pub async fn add_xp(app: AppHandle, amount: u32, source: String) -> Result<AddXpResult, String> {
    let mut data = storage::load(&app)?;

    data.cat.exp += amount;
    let mut leveled_up = false;

    // 이벤트 기록
    let now = Local::now().format("%H:%M").to_string();
    data.today.events.push(ActivityEvent {
        timestamp: now.clone(),
        event_type: source.clone(),
        xp: amount,
        detail: source.clone(),
    });

    // 레벨업 루프
    loop {
        let needed = exp_for_level(data.cat.level);
        if data.cat.exp >= needed {
            data.cat.exp -= needed;
            data.cat.level += 1;
            leveled_up = true;
        } else {
            break;
        }
    }

    // 레벨업 이벤트 기록
    if leveled_up {
        let now = Local::now().format("%H:%M").to_string();
        data.today.events.push(ActivityEvent {
            timestamp: now,
            event_type: "level_up".to_string(),
            xp: 0,
            detail: format!("Lv.{}", data.cat.level),
        });
    }

    // source별 통계 업데이트
    data.today.exp_gained += amount;
    match source.as_str() {
        "commit" => {
            data.cat.total_commits += 1;
            data.today.commits += 1;
        }
        "coding_hour" => {
            data.cat.total_coding_minutes += 60;
            data.today.coding_minutes += 60;
        }
        _ => {}
    }

    // ── Streak 업데이트 ──
    let today_str = Local::now().format("%Y-%m-%d").to_string();
    let mut streak_milestone: Option<(u32, u32)> = None; // (days, bonus_xp)

    if data.cat.last_active_date.as_deref() != Some(&today_str) {
        let yesterday = (Local::now() - chrono::Duration::days(1))
            .format("%Y-%m-%d")
            .to_string();

        if data.cat.last_active_date.as_deref() == Some(&yesterday) {
            data.cat.streak_days += 1;
        } else {
            data.cat.streak_days = 1;
        }
        data.cat.last_active_date = Some(today_str);

        // 마일스톤 체크
        let bonus = match data.cat.streak_days {
            3 => Some(50u32),
            7 => Some(100),
            30 => Some(500),
            _ => None,
        };
        if let Some(bonus_xp) = bonus {
            data.cat.exp += bonus_xp;
            data.today.exp_gained += bonus_xp;

            // 보너스 XP 이벤트 기록
            let ts = Local::now().format("%H:%M").to_string();
            data.today.events.push(ActivityEvent {
                timestamp: ts,
                event_type: "streak".to_string(),
                xp: bonus_xp,
                detail: format!("{} day streak!", data.cat.streak_days),
            });

            // 보너스로 인한 추가 레벨업 체크
            loop {
                let needed = exp_for_level(data.cat.level);
                if data.cat.exp >= needed {
                    data.cat.exp -= needed;
                    data.cat.level += 1;
                    leveled_up = true;
                } else {
                    break;
                }
            }

            streak_milestone = Some((data.cat.streak_days, bonus_xp));
        }
    }

    let result = AddXpResult {
        level: data.cat.level,
        current_exp: data.cat.exp,
        exp_to_next: exp_for_level(data.cat.level),
        leveled_up,
    };

    storage::save(&app, &data)?;

    if leveled_up {
        let _ = app.emit("xp:level-up", result.level);
    }

    // Streak 마일스톤 이벤트 발행
    if let Some((days, bonus)) = streak_milestone {
        #[derive(Clone, Serialize)]
        struct StreakMilestone { days: u32, bonus: u32 }
        let _ = app.emit("streak:milestone", StreakMilestone { days, bonus });
    }

    Ok(result)
}
