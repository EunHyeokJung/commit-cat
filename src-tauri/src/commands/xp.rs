use crate::models::growth::{exp_for_level, LevelInfo};
use crate::services::storage;
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

    // source별 통계 업데이트
    match source.as_str() {
        "commit" => data.cat.total_commits += 1,
        "coding_hour" => data.cat.total_coding_minutes += 60,
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
