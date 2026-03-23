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

    Ok(result)
}
