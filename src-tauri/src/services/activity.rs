use serde::Serialize;
use std::path::PathBuf;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

/// 프론트엔드로 보내는 활동 상태
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivityStatus {
    pub is_ide_running: bool,
    pub active_ide: Option<String>,
    pub idle_seconds: u64,
}

/// 백그라운드 활동 모니터
pub async fn start_monitor(app: AppHandle) {
    let mut interval = tokio::time::interval(Duration::from_secs(10));
    let mut last_ide_seen = Instant::now();
    let mut was_ide_running = false;
    let mut sleep_emitted = false;
    let mut late_night_emitted = false;

    loop {
        interval.tick().await;

        // 1. IDE 프로세스 감지
        let detected_ide = detect_running_ide();
        let is_ide_running = detected_ide.is_some();

        if is_ide_running {
            last_ide_seen = Instant::now();
            sleep_emitted = false;
        }

        let idle_seconds = last_ide_seen.elapsed().as_secs();

        // 2. 상태 변화 시에만 이벤트 발생
        if is_ide_running && !was_ide_running {
            let ide_name = detected_ide.clone().unwrap_or("IDE".to_string());
            let _ = app.emit("activity:ide-detected", &ide_name);

            // IDE 감지 시 워크스페이스에서 git repo 자동 등록
            auto_register_repos(&app);
        } else if !is_ide_running && was_ide_running {
            let _ = app.emit("activity:ide-closed", "");
        }

        // 3. 유휴 시간 체크
        if idle_seconds >= 600 && !sleep_emitted {
            let _ = app.emit("activity:sleeping", idle_seconds);
            sleep_emitted = true;
        } else if idle_seconds >= 180 && idle_seconds < 600 && was_ide_running && !is_ide_running {
            let _ = app.emit("activity:idle", idle_seconds);
        }

        // 4. 밤 시간 체크 (1회만)
        let hour = chrono::Local::now().hour();
        if is_ide_running && (hour >= 23 || hour < 6) {
            if !late_night_emitted {
                let _ = app.emit("activity:late-night-coding", hour);
                late_night_emitted = true;
            }
        } else {
            late_night_emitted = false;
        }

        was_ide_running = is_ide_running;

        // 5. 주기적 상태 보고
        let status = ActivityStatus {
            is_ide_running,
            active_ide: detected_ide,
            idle_seconds,
        };
        let _ = app.emit("activity:status", &status);
    }
}

use chrono::Timelike;

/// IDE 감지 (OS별 분기)
fn detect_running_ide() -> Option<String> {
    #[cfg(target_os = "macos")]
    { detect_running_ide_macos() }

    #[cfg(target_os = "windows")]
    { detect_running_ide_windows() }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    { detect_running_ide_unix() }
}

// ═══════════════════════════════════════
// macOS: 프로세스 전체 경로로 감지
// ═══════════════════════════════════════
#[cfg(target_os = "macos")]
fn detect_running_ide_macos() -> Option<String> {
    // ps -A -o args= 로 전체 커맨드라인을 가져옴
    let output = std::process::Command::new("ps")
        .args(["-A", "-o", "args="])
        .output()
        .ok()?;

    let stdout = String::from_utf8_lossy(&output.stdout);

    // 앱 경로 패턴 → IDE 이름
    let app_patterns: &[(&str, &str)] = &[
        // VS Code 계열
        ("Visual Studio Code.app", "VS Code"),
        ("Visual Studio Code - Insiders.app", "VS Code Insiders"),
        ("Cursor.app", "Cursor"),
        ("Windsurf.app", "Windsurf"),
        // JetBrains 계열
        ("IntelliJ IDEA.app", "IntelliJ IDEA"),
        ("IntelliJ IDEA CE.app", "IntelliJ IDEA"),
        ("WebStorm.app", "WebStorm"),
        ("PyCharm.app", "PyCharm"),
        ("PyCharm CE.app", "PyCharm"),
        ("GoLand.app", "GoLand"),
        ("CLion.app", "CLion"),
        ("RustRover.app", "RustRover"),
        ("DataGrip.app", "DataGrip"),
        ("Rider.app", "Rider"),
        // 기타
        ("Xcode.app", "Xcode"),
        ("Zed.app", "Zed"),
        ("Sublime Text.app", "Sublime Text"),
        ("Android Studio.app", "Android Studio"),
    ];

    for (pattern, ide_name) in app_patterns {
        if stdout.contains(pattern) {
            return Some(ide_name.to_string());
        }
    }

    None
}

// ═══════════════════════════════════════
// Windows: tasklist로 감지
// ═══════════════════════════════════════
#[cfg(target_os = "windows")]
fn detect_running_ide_windows() -> Option<String> {
    let output = std::process::Command::new("tasklist")
        .args(["/FO", "CSV", "/NH"])
        .output()
        .ok()?;

    let stdout = String::from_utf8_lossy(&output.stdout);

    let win_processes: &[(&str, &str)] = &[
        ("Code.exe", "VS Code"),
        ("Cursor.exe", "Cursor"),
        ("devenv.exe", "Visual Studio"),
        ("idea64.exe", "IntelliJ IDEA"),
        ("webstorm64.exe", "WebStorm"),
        ("pycharm64.exe", "PyCharm"),
        ("goland64.exe", "GoLand"),
        ("clion64.exe", "CLion"),
        ("rustrover64.exe", "RustRover"),
        ("datagrip64.exe", "DataGrip"),
        ("rider64.exe", "Rider"),
    ];

    for (proc_name, ide_name) in win_processes {
        if stdout.contains(proc_name) {
            return Some(ide_name.to_string());
        }
    }

    None
}

// ═══════════════════════════════════════
// Linux: ps 기반
// ═══════════════════════════════════════
#[cfg(not(any(target_os = "macos", target_os = "windows")))]
fn detect_running_ide_unix() -> Option<String> {
    let output = std::process::Command::new("ps")
        .args(["-A", "-o", "args="])
        .output()
        .ok()?;

    let stdout = String::from_utf8_lossy(&output.stdout);

    let patterns: &[(&str, &str)] = &[
        ("/code", "VS Code"),
        ("/cursor", "Cursor"),
        ("idea", "IntelliJ IDEA"),
        ("webstorm", "WebStorm"),
        ("pycharm", "PyCharm"),
        ("goland", "GoLand"),
        ("clion", "CLion"),
        ("rustrover", "RustRover"),
        ("sublime_text", "Sublime Text"),
    ];

    for (pattern, ide_name) in patterns {
        if stdout.lines().any(|l| l.contains(pattern)) {
            return Some(ide_name.to_string());
        }
    }

    None
}

/// IDE 프로세스의 cwd에서 git repo를 찾아 자동 등록
fn auto_register_repos(app: &AppHandle) {
    let pids = get_ide_pids();
    for pid in pids {
        if let Some(cwd) = get_process_cwd(pid) {
            if let Some(repo_root) = find_git_root(&cwd) {
                let _ = super::storage::add_repo(app, &repo_root.to_string_lossy());
            }
        }
    }
}

/// 실행 중인 IDE 프로세스의 PID 목록
fn get_ide_pids() -> Vec<u32> {
    #[cfg(target_os = "macos")]
    { get_ide_pids_macos() }

    #[cfg(target_os = "windows")]
    { vec![] } // Windows는 lsof 없어서 수동 등록으로

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    { get_ide_pids_linux() }
}

#[cfg(target_os = "macos")]
fn get_ide_pids_macos() -> Vec<u32> {
    let output = match std::process::Command::new("ps")
        .args(["-A", "-o", "pid=,args="])
        .output()
    {
        Ok(o) => o,
        Err(_) => return vec![],
    };

    let stdout = String::from_utf8_lossy(&output.stdout);
    let ide_patterns = [
        "Visual Studio Code.app", "Cursor.app", "Windsurf.app",
        "IntelliJ IDEA", "WebStorm", "PyCharm", "GoLand", "CLion",
        "RustRover", "Xcode.app", "Zed.app",
    ];

    let mut pids = vec![];
    for line in stdout.lines() {
        let trimmed = line.trim();
        if ide_patterns.iter().any(|p| trimmed.contains(p)) {
            if let Some(pid_str) = trimmed.split_whitespace().next() {
                if let Ok(pid) = pid_str.parse::<u32>() {
                    pids.push(pid);
                }
            }
        }
    }
    pids
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
fn get_ide_pids_linux() -> Vec<u32> {
    let output = match std::process::Command::new("ps")
        .args(["-A", "-o", "pid=,args="])
        .output()
    {
        Ok(o) => o,
        Err(_) => return vec![],
    };

    let stdout = String::from_utf8_lossy(&output.stdout);
    let ide_patterns = ["/code", "/cursor", "idea", "webstorm", "pycharm", "goland", "clion", "rustrover"];

    let mut pids = vec![];
    for line in stdout.lines() {
        let trimmed = line.trim();
        if ide_patterns.iter().any(|p| trimmed.contains(p)) {
            if let Some(pid_str) = trimmed.split_whitespace().next() {
                if let Ok(pid) = pid_str.parse::<u32>() {
                    pids.push(pid);
                }
            }
        }
    }
    pids
}

/// 프로세스의 현재 작업 디렉토리 추출
fn get_process_cwd(pid: u32) -> Option<PathBuf> {
    #[cfg(target_os = "macos")]
    {
        let output = std::process::Command::new("lsof")
            .args(["-p", &pid.to_string(), "-d", "cwd", "-Fn"])
            .output()
            .ok()?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        // lsof 출력: "p<pid>\nn<path>"
        for line in stdout.lines() {
            if let Some(path) = line.strip_prefix('n') {
                if path != "/" {
                    return Some(PathBuf::from(path));
                }
            }
        }
        None
    }

    #[cfg(target_os = "windows")]
    { let _ = pid; None }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        // Linux: /proc/<pid>/cwd symlink
        std::fs::read_link(format!("/proc/{}/cwd", pid)).ok()
    }
}

/// 디렉토리에서 위로 올라가며 .git 폴더 탐색
fn find_git_root(start: &PathBuf) -> Option<PathBuf> {
    let mut current = start.clone();
    loop {
        if current.join(".git").exists() {
            return Some(current);
        }
        if !current.pop() {
            return None;
        }
    }
}
