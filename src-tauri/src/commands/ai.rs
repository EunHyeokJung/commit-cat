use crate::services::storage;
use serde::Deserialize;
use tauri::AppHandle;

// Claude API response
#[derive(Deserialize)]
struct ClaudeContentBlock {
    text: Option<String>,
}

#[derive(Deserialize)]
struct ClaudeResponse {
    content: Vec<ClaudeContentBlock>,
}

// OpenAI API response
#[derive(Deserialize)]
struct OpenAIChoice {
    message: OpenAIMessage,
}

#[derive(Deserialize)]
struct OpenAIMessage {
    content: Option<String>,
}

#[derive(Deserialize)]
struct OpenAIResponse {
    choices: Vec<OpenAIChoice>,
}

#[tauri::command]
pub async fn chat_with_cat(app: AppHandle, message: String) -> Result<String, String> {
    let data = storage::load(&app)?;
    let provider = data.settings.ai_provider.as_str();

    // Build system prompt (shared)
    let today = &data.today;
    let cat = &data.cat;
    let coding_hours = today.coding_minutes / 60;
    let coding_mins = today.coding_minutes % 60;

    let system_prompt = format!(
        "You are CommitCat, a small desktop cat companion that lives on a developer's screen. \
         Respond with short, warm messages. Keep it cute but not over the top — \
         no action descriptions like *purrs* or *meows*. \
         Reply in 3-5 sentences max. Always add 1 relevant emoji at the end. \
         Keep total response under 200 characters. \
         User stats: {} commits, {}h{}m coding, Lv.{}.",
        today.commits, coding_hours, coding_mins, cat.level,
    );

    match provider {
        "openai" => chat_openai(&data.settings.openai_api_key, &system_prompt, &message).await,
        _ => chat_claude(&data.settings.anthropic_api_key, &system_prompt, &message).await,
    }
}

async fn chat_claude(api_key: &Option<String>, system_prompt: &str, message: &str) -> Result<String, String> {
    let api_key = api_key
        .as_deref()
        .filter(|k| !k.is_empty())
        .ok_or("No Anthropic API key configured")?;

    let body = serde_json::json!({
        "model": "claude-sonnet-4-20250514",
        "max_tokens": 200,
        "system": system_prompt,
        "messages": [{ "role": "user", "content": message }]
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

    let parsed: ClaudeResponse = res
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let text = parsed.content.into_iter().filter_map(|b| b.text).collect::<Vec<_>>().join("");
    if text.is_empty() { return Err("Empty response from API".into()); }
    Ok(text)
}

async fn chat_openai(api_key: &Option<String>, system_prompt: &str, message: &str) -> Result<String, String> {
    let api_key = api_key
        .as_deref()
        .filter(|k| !k.is_empty())
        .ok_or("No OpenAI API key configured")?;

    let body = serde_json::json!({
        "model": "gpt-4o-mini",
        "max_tokens": 200,
        "messages": [
            { "role": "system", "content": system_prompt },
            { "role": "user", "content": message }
        ]
    });

    let client = reqwest::Client::new();
    let res = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !res.status().is_success() {
        let status = res.status();
        let body_text = res.text().await.unwrap_or_default();
        return Err(format!("API error ({}): {}", status, body_text));
    }

    let parsed: OpenAIResponse = res
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let text = parsed.choices.into_iter()
        .filter_map(|c| c.message.content)
        .next()
        .unwrap_or_default();
    if text.is_empty() { return Err("Empty response from API".into()); }
    Ok(text)
}
