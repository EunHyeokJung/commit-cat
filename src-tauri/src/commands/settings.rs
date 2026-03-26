use commit_cat_core::models::settings::AppSettings;
use crate::services;

#[tauri::command]
pub async fn get_settings(app: tauri::AppHandle) -> Result<AppSettings, String> {
    let data = services::storage::load(&app)?;
    Ok(data.settings)
}

#[tauri::command]
pub async fn update_settings(app: tauri::AppHandle, settings: AppSettings) -> Result<bool, String> {
    let mut data = services::storage::load(&app)?;
    data.settings = settings;
    services::storage::save(&app, &data)?;
    Ok(true)
}
