use crate::services::update;
use tauri::AppHandle;

#[tauri::command]
pub async fn check_for_update(app: AppHandle) -> Result<Option<String>, String> {
    update::check_update(&app).await
}
