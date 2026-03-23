use crate::services::{github, storage};
use tauri::AppHandle;

/// GitHub PAT 검증 + 저장 → username 반환
#[tauri::command]
pub async fn verify_github_token(app: AppHandle, token: String) -> Result<String, String> {
    let username = github::verify_token(&token).await?;

    let mut data = storage::load(&app)?;
    data.settings.github_token = Some(token);
    data.settings.github_username = Some(username.clone());
    storage::save(&app, &data)?;

    Ok(username)
}

/// GitHub 연결 해제
#[tauri::command]
pub async fn disconnect_github(app: AppHandle) -> Result<(), String> {
    let mut data = storage::load(&app)?;
    data.settings.github_token = None;
    data.settings.github_username = None;
    data.github_state = Default::default();
    storage::save(&app, &data)?;
    Ok(())
}
