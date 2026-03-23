use crate::models::activity::{ActivityEvent, CodingStatus, DailySummary};
use crate::services::storage;
use tauri::AppHandle;

/// 오늘 활동 요약
#[tauri::command]
pub async fn get_today_summary(app: AppHandle) -> Result<DailySummary, String> {
    let data = storage::load(&app)?;
    Ok(data.today)
}

/// 오늘 이벤트 목록
#[tauri::command]
pub async fn get_today_events(app: AppHandle) -> Result<Vec<ActivityEvent>, String> {
    let data = storage::load(&app)?;
    Ok(data.today.events)
}

/// 현재 코딩 상태
#[tauri::command]
pub async fn get_coding_status() -> Result<CodingStatus, String> {
    // TODO: activity monitor에서 현재 상태
    Ok(CodingStatus {
        is_coding: false,
        active_ide: None,
        idle_seconds: 0,
        session_minutes: 0,
    })
}
