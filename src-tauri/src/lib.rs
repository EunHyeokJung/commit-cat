mod commands;
mod events;
mod models;
mod services;
mod utils;

use tauri::Manager;
use tauri::menu::MenuBuilder;

#[cfg(target_os = "macos")]
use cocoa::appkit::{NSColor, NSWindow};
#[cfg(target_os = "macos")]
use cocoa::base::{id, nil, NO};

#[cfg(target_os = "macos")]
fn setup_macos_window(window: &tauri::WebviewWindow) {
    use tauri::Emitter;

    if let Ok(ns_window) = window.ns_window() {
        unsafe {
            let ns_win = ns_window as id;
            // 윈도우를 불투명하지 않게 설정
            ns_win.setOpaque_(NO);
            // 배경색을 완전 투명으로 설정
            ns_win.setBackgroundColor_(NSColor::clearColor(nil));
            // 그림자 비활성화 (잔상 방지)
            ns_win.setHasShadow_(NO);
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // ── Plugins ──
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        // ── State ──
        .setup(|app| {
            let app_handle = app.handle().clone();

            // Initialize local data storage
            services::storage::init(&app_handle)?;

            // macOS 투명 윈도우 설정
            #[cfg(target_os = "macos")]
            if let Some(window) = app.get_webview_window("cat-overlay") {
                setup_macos_window(&window);
            }

            // ── config 기반 트레이 아이콘 설정 ──
            if let Some(tray) = app.tray_by_id("main-tray") {
                let menu = MenuBuilder::new(app)
                    .text("settings", "Settings...")
                    .separator()
                    .text("quit", "Quit")
                    .build()?;
                tray.set_menu(Some(menu))?;
                tray.set_show_menu_on_left_click(false)?;

                // 좌클릭: 고양이 보이기/숨기기
                tray.on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click {
                        button_state: tauri::tray::MouseButtonState::Up,
                        ..
                    } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("cat-overlay") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                            }
                        }
                    }
                });

                // 메뉴 이벤트: 색상 변경 + 종료
                tray.on_menu_event(|app, event| {
                    use tauri::Emitter;
                    match event.id().as_ref() {
                        "cat-orange" => { let _ = app.emit("change-cat-color", "orange"); }
                        "cat-brown" => { let _ = app.emit("change-cat-color", "brown"); }
                        "cat-white" => { let _ = app.emit("change-cat-color", "white"); }
                        "settings" => {
                            // 이미 열려있으면 포커스, 아니면 새로 생성
                            if let Some(win) = app.get_webview_window("settings") {
                                let _ = win.set_focus();
                            } else {
                                let _ = tauri::webview::WebviewWindowBuilder::new(
                                    app,
                                    "settings",
                                    tauri::WebviewUrl::App("/".into()),
                                )
                                .title("CommitCat Settings")
                                .inner_size(500.0, 600.0)
                                .center()
                                .resizable(false)
                                .build();
                            }
                        }
                        "quit" => { app.exit(0); }
                        _ => {}
                    }
                });
            }

            // 활동 모니터 시작
            let monitor_handle = app_handle.clone();
            tauri::async_runtime::spawn(async move {
                services::activity::start_monitor(monitor_handle).await;
            });

            // Git 커밋 감지 시작
            let git_handle = app_handle.clone();
            tauri::async_runtime::spawn(async move {
                services::git::start_watcher(git_handle).await;
            });

            Ok(())
        })
        // ── Commands (frontend ↔ backend) ──
        .invoke_handler(tauri::generate_handler![
            // Cat state
            commands::cat::get_cat_state,
            commands::cat::click_cat,
            // Activity
            commands::activity::get_today_summary,
            commands::activity::get_coding_status,
            // Growth
            commands::growth::get_level_info,
            commands::growth::get_exp_breakdown,
            // Pomodoro
            commands::pomodoro::start_pomodoro,
            commands::pomodoro::stop_pomodoro,
            commands::pomodoro::get_pomodoro_status,
            // Git
            commands::git::get_today_commits,
            commands::git::register_repo,
            commands::git::get_watched_repos,
            commands::git::remove_repo,
            commands::git::clone_repo,
            // Settings
            commands::settings::get_settings,
            commands::settings::update_settings,
            // Fullscreen
            commands::fullscreen::check_fullscreen,
            // XP
            commands::xp::get_xp_status,
            commands::xp::add_xp,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Commit Cat");
}
