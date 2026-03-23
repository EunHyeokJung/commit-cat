use tauri::{AppHandle, Emitter};
use std::collections::HashMap;
use std::path::PathBuf;
use std::time::Duration;

/// Git HEAD 변경 감지 (폴링 방식 - MVP)
pub async fn start_watcher(app: AppHandle) {
    let mut interval = tokio::time::interval(Duration::from_secs(30));
    let mut last_heads: HashMap<PathBuf, String> = HashMap::new();

    loop {
        interval.tick().await;

        let repos = super::storage::get_watched_repos(&app);

        for repo in repos {
            if let Some(current_head) = read_head(&repo) {
                let changed = last_heads
                    .get(&repo)
                    .map(|prev| prev != &current_head)
                    .unwrap_or(false);

                if changed {
                    let _ = app.emit("git:new-commit", serde_json::json!({
                        "repo": repo.to_string_lossy().to_string(),
                        "head": current_head,
                    }));
                }

                last_heads.insert(repo, current_head);
            }
        }
    }
}

/// .git/HEAD에서 현재 커밋 해시 읽기
fn read_head(repo_path: &PathBuf) -> Option<String> {
    let head_path = repo_path.join(".git").join("HEAD");
    let content = std::fs::read_to_string(&head_path).ok()?;

    if content.starts_with("ref: ") {
        let ref_path = content.trim().strip_prefix("ref: ")?;
        let full_ref_path = repo_path.join(".git").join(ref_path);

        // 개별 ref 파일 먼저 시도
        if let Ok(hash) = std::fs::read_to_string(&full_ref_path) {
            return Some(hash.trim().to_string());
        }

        // packed-refs에서 찾기 (git gc 이후 또는 빈 레포)
        let packed_refs = repo_path.join(".git").join("packed-refs");
        if let Ok(packed) = std::fs::read_to_string(&packed_refs) {
            for line in packed.lines() {
                if line.starts_with('#') { continue; }
                let parts: Vec<&str> = line.splitn(2, ' ').collect();
                if parts.len() == 2 && parts[1] == ref_path {
                    return Some(parts[0].to_string());
                }
            }
        }

        None
    } else {
        Some(content.trim().to_string())
    }
}

/// 오늘 커밋 수 계산
pub fn count_today_commits(repo_path: &PathBuf) -> u32 {
    let output = std::process::Command::new("git")
        .current_dir(repo_path)
        .args(["rev-list", "--count", "--since=midnight", "HEAD"])
        .output();

    match output {
        Ok(out) => {
            String::from_utf8_lossy(&out.stdout)
                .trim()
                .parse()
                .unwrap_or(0)
        }
        Err(_) => 0,
    }
}
