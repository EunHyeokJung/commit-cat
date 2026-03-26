use crate::models::cat::CatInfo;
use tauri::{AppHandle, Manager};

/// 고양이 현재 상태 조회
#[tauri::command]
pub async fn get_cat_state() -> Result<CatInfo, String> {
    // TODO: 실제 상태 머신에서 현재 상태 가져오기
    Ok(CatInfo {
        state: crate::models::cat::CatState::Idle,
        mood: crate::models::cat::CatMood::Happy,
        level: 1,
        exp: 0,
        exp_to_next: 60,
        streak_days: 0,
    })
}

/// 고양이 클릭 인터랙션
#[tauri::command]
pub async fn click_cat() -> Result<String, String> {
    // TODO: 상태를 Interaction으로 전환, 반응 애니메이션 트리거
    Ok("meow!".to_string())
}

/// 앱 종료
#[tauri::command]
pub async fn quit_app(app: AppHandle) -> Result<(), String> {
    app.exit(0);
    Ok(())
}

/// 서브 고양이 윈도우 macOS 투명 설정
#[tauri::command]
pub async fn setup_sub_cat_window(app: AppHandle, label: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        if let Some(window) = app.get_webview_window(&label) {
            crate::setup_macos_window(&window);
        }
    }
    let _ = &app;
    let _ = &label;
    Ok(())
}
