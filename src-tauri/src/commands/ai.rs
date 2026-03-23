use crate::services::storage;
use serde::Deserialize;
use tauri::AppHandle;

#[derive(Deserialize)]
struct ContentBlock {
    text: Option<String>,
}

#[derive(Deserialize)]
struct MessagesResponse {
    content: Vec<ContentBlock>,
}

/// CommitCat AI 채팅 — Anthropic Messages API 호출
#[tauri::command]
pub async fn chat_with_cat(app: AppHandle, message: String) -> Result<String, String> {
    let data = storage::load(&app)?;

    let api_key = data
        .settings
        .anthropic_api_key
        .as_deref()
        .filter(|k| !k.is_empty())
        .ok_or("No Anthropic API key configured")?;

    // 오늘 통계 수집
    let today = &data.today;
    let cat = &data.cat;
    let coding_hours = today.coding_minutes / 60;
    let coding_mins = today.coding_minutes % 60;

    let system_prompt = format!(
        "You are CommitCat, a tiny pixel cat developer companion. \
         Respond in cute, short cat-like messages (1-2 sentences max). \
         You know the user's coding stats today: \
         {} commits, {}h {}m coding time, {} XP earned, Level {}.",
        today.commits,
        coding_hours,
        coding_mins,
        today.exp_gained,
        cat.level,
    );

    let body = serde_json::json!({
        "model": "claude-sonnet-4-20250514",
        "max_tokens": 150,
        "system": system_prompt,
        "messages": [
            { "role": "user", "content": message }
        ]
    });

    let client = reqwest::Client::new();
    let res = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !res.status().is_success() {
        let status = res.status();
        let body_text = res.text().await.unwrap_or_default();
        return Err(format!("API error ({}): {}", status, body_text));
    }

    let parsed: MessagesResponse = res
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let text = parsed
        .content
        .into_iter()
        .filter_map(|b| b.text)
        .collect::<Vec<_>>()
        .join("");

    if text.is_empty() {
        return Err("Empty response from API".into());
    }

    Ok(text)
}
