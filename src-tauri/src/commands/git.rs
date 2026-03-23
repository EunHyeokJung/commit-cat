use crate::services;

#[tauri::command]
pub async fn get_today_commits(app: tauri::AppHandle) -> Result<u32, String> {
    let repos = services::storage::get_watched_repos(&app);
    let total: u32 = repos
        .iter()
        .map(|r| services::git::count_today_commits(r))
        .sum();
    Ok(total)
}

#[tauri::command]
pub async fn register_repo(app: tauri::AppHandle, path: String) -> Result<bool, String> {
    let git_dir = std::path::Path::new(&path).join(".git");
    if git_dir.exists() {
        services::storage::add_repo(&app, &path)?;
        Ok(true)
    } else {
        Err("Not a valid git repository".to_string())
    }
}
