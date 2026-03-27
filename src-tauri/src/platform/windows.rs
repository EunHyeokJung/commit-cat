#![cfg(target_os = "windows")]

use std::path::PathBuf;
use std::process::{Command, Stdio};

/// 콘솔 창이 뜨지 않는 Command 생성
fn silent_command(program: &str) -> Command {
    let mut cmd = Command::new(program);
    cmd.stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    use std::os::windows::process::CommandExt;
    cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    cmd
}

/// Windows: tasklist로 IDE 감지
pub fn detect_running_ide() -> Option<String> {
    let output = silent_command("tasklist")
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

/// Windows: IDE PID 목록 (미지원 — 수동 등록)
pub fn get_ide_pids() -> Vec<u32> {
    vec![]
}

/// Windows: 프로세스 cwd 추출 (미지원)
pub fn get_process_cwd(_pid: u32) -> Option<PathBuf> {
    None
}
