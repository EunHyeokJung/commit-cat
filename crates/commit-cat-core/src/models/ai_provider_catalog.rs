use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiProviderCatalogResponse {
    pub providers: Vec<AiProviderCatalogEntry>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiProviderCatalogEntry {
    pub id: String,
    pub label: String,
    pub description: String,
    pub default_model: String,
    pub models: Vec<AiProviderModelEntry>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiProviderModelEntry {
    pub id: String,
    pub label: String,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub reasoning_efforts: Vec<AiProviderReasoningEntry>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_reasoning: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiProviderReasoningEntry {
    pub id: String,
    pub label: String,
}

#[derive(Debug, Deserialize)]
pub struct CodexConfigFile {
    #[serde(default)]
    pub model: Option<String>,
}

pub fn get_ai_provider_catalog_response() -> AiProviderCatalogResponse {
    AiProviderCatalogResponse {
        providers: get_ai_provider_catalog(),
    }
}

pub fn get_ai_provider_catalog() -> Vec<AiProviderCatalogEntry> {
    vec![
        AiProviderCatalogEntry {
            id: "claude".to_string(),
            label: "Claude".to_string(),
            description: "Use Anthropic API key authentication.".to_string(),
            default_model: "claude-sonnet-4-20250514".to_string(),
            models: vec![
                plain_model("claude-sonnet-4-20250514"),
                plain_model("claude-opus-4-20250514"),
                plain_model("claude-3-5-haiku-latest"),
            ],
        },
        AiProviderCatalogEntry {
            id: "openai-api".to_string(),
            label: "OpenAI API".to_string(),
            description: "Use an OpenAI API key for hosted chat completions.".to_string(),
            default_model: "gpt-4o-mini".to_string(),
            models: vec![
                plain_model("gpt-4o-mini"),
                gpt54_model("gpt-5.4-mini"),
                gpt54_model("gpt-5.4"),
                gpt54_model("gpt-5.4-nano"),
            ],
        },
        AiProviderCatalogEntry {
            id: "openai-codex-local".to_string(),
            label: "OpenAI Codex Provider (Local)".to_string(),
            description: "Use the locally installed Codex CLI with ChatGPT OAuth.".to_string(),
            default_model: "gpt-5.4".to_string(),
            models: vec![
                gpt54_model("gpt-5.4"),
                codex_model("gpt-5-codex", &["minimal", "low", "medium", "high"])
                    .with_default_reasoning("minimal"),
                codex_model("gpt-5.3-codex", &["low", "medium", "high", "xhigh"]),
                codex_model("gpt-5.2-codex", &["low", "medium", "high", "xhigh"]),
                codex_model("gpt-5.1-codex", &["none", "low", "medium", "high"])
                    .with_default_reasoning("none"),
                codex_model("gpt-5.1-codex-max", &["none", "medium", "high", "xhigh"])
                    .with_default_reasoning("none"),
                codex_model("gpt-5.1-codex-mini", &["none", "low", "medium", "high"])
                    .with_default_reasoning("none"),
            ],
        },
    ]
}

pub fn normalize_provider(provider: &str) -> &str {
    match provider {
        "openai" => "openai-api",
        other => other,
    }
}

pub fn normalize_provider_owned(provider: &str) -> String {
    normalize_provider(provider).to_string()
}

pub fn normalize_provider_models(models: &mut HashMap<String, String>) {
    normalize_provider_string_map(models);
}

pub fn normalize_provider_reasoning(
    reasoning: &mut HashMap<String, String>,
    ai_provider_models: &HashMap<String, String>,
) {
    let catalog = get_ai_provider_catalog();
    normalize_provider_reasoning_with_catalog(reasoning, ai_provider_models, &catalog);
}

pub fn normalize_provider_reasoning_with_catalog(
    reasoning: &mut HashMap<String, String>,
    ai_provider_models: &HashMap<String, String>,
    catalog: &[AiProviderCatalogEntry],
) {
    let previous = std::mem::take(reasoning);
    let mut normalized = HashMap::with_capacity(previous.len());

    for (raw_key, value) in previous {
        let trimmed_value = value.trim();
        if trimmed_value.is_empty() {
            continue;
        }

        if let Some((provider, model)) = parse_reasoning_storage_key(&raw_key) {
            normalized
                .entry(reasoning_storage_key(&provider, &model))
                .or_insert_with(|| trimmed_value.to_string());
            continue;
        }

        let provider = normalize_provider(&raw_key);
        let model = resolve_model_with_catalog(provider, ai_provider_models, catalog);
        if model.is_empty() {
            continue;
        }

        normalized
            .entry(reasoning_storage_key(provider, &model))
            .or_insert_with(|| trimmed_value.to_string());
    }

    *reasoning = normalized;
}

fn normalize_provider_string_map(values: &mut HashMap<String, String>) {
    if let Some(legacy_openai_value) = values.remove("openai") {
        values
            .entry("openai-api".to_string())
            .or_insert(legacy_openai_value);
    }
}

pub fn resolve_model(provider: &str, ai_provider_models: &HashMap<String, String>) -> String {
    let catalog = get_ai_provider_catalog();
    resolve_model_with_catalog(provider, ai_provider_models, &catalog)
}

pub fn resolve_model_with_catalog(
    provider: &str,
    ai_provider_models: &HashMap<String, String>,
    catalog: &[AiProviderCatalogEntry],
) -> String {
    let normalized_provider = normalize_provider(provider);
    let selected_provider = catalog
        .iter()
        .find(|candidate| candidate.id == normalized_provider)
        .or_else(|| catalog.iter().find(|candidate| candidate.id == "claude"));

    let Some(provider_entry) = selected_provider else {
        return String::new();
    };

    let selected_model = ai_provider_models
        .get(normalized_provider)
        .or_else(|| {
            if normalized_provider == "openai-api" {
                ai_provider_models.get("openai")
            } else {
                None
            }
        })
        .map(|value| value.trim())
        .filter(|value| !value.is_empty());

    if let Some(selected_model) = selected_model {
        let valid_model = provider_entry
            .models
            .iter()
            .any(|candidate| candidate.id == selected_model);
        if valid_model {
            return selected_model.to_string();
        }
    }

    provider_entry.default_model.clone()
}

pub fn resolve_reasoning(
    provider: &str,
    model: &str,
    ai_provider_reasoning: &HashMap<String, String>,
) -> Option<String> {
    let catalog = get_ai_provider_catalog();
    resolve_reasoning_with_catalog(provider, model, ai_provider_reasoning, &catalog)
}

pub fn resolve_reasoning_with_catalog(
    provider: &str,
    model: &str,
    ai_provider_reasoning: &HashMap<String, String>,
    catalog: &[AiProviderCatalogEntry],
) -> Option<String> {
    let normalized_provider = normalize_provider(provider);
    let provider_entry = catalog
        .iter()
        .find(|candidate| candidate.id == normalized_provider)?;
    let model_entry = provider_entry
        .models
        .iter()
        .find(|candidate| candidate.id == model)?;

    if model_entry.reasoning_efforts.is_empty() {
        return None;
    }

    let selected_reasoning = ai_provider_reasoning
        .get(&reasoning_storage_key(normalized_provider, model))
        .or_else(|| ai_provider_reasoning.get(normalized_provider))
        .map(|value| value.trim())
        .filter(|value| !value.is_empty());

    if let Some(selected_reasoning) = selected_reasoning {
        let valid_reasoning = model_entry
            .reasoning_efforts
            .iter()
            .any(|candidate| candidate.id == selected_reasoning);
        if valid_reasoning {
            return Some(selected_reasoning.to_string());
        }
    }

    resolve_default_reasoning(model_entry).or_else(|| resolve_first_reasoning(model_entry))
}

fn plain_model(id: &str) -> AiProviderModelEntry {
    AiProviderModelEntry {
        id: id.to_string(),
        label: id.to_string(),
        reasoning_efforts: vec![],
        default_reasoning: None,
    }
}

fn gpt54_model(id: &str) -> AiProviderModelEntry {
    codex_model(id, &["none", "low", "medium", "high", "xhigh"]).with_default_reasoning("none")
}

fn codex_model(id: &str, reasoning_efforts: &[&str]) -> AiProviderModelEntry {
    AiProviderModelEntry {
        id: id.to_string(),
        label: id.to_string(),
        reasoning_efforts: reasoning_efforts
            .iter()
            .map(|effort| reasoning(effort))
            .collect(),
        default_reasoning: None,
    }
}

fn reasoning(id: &str) -> AiProviderReasoningEntry {
    AiProviderReasoningEntry {
        id: id.to_string(),
        label: id.to_string(),
    }
}

pub fn infer_codex_model(id: &str) -> AiProviderModelEntry {
    if id == "gpt-5.1-codex-max" {
        return codex_model(id, &["none", "medium", "high", "xhigh"])
            .with_default_reasoning("none");
    }
    if id == "gpt-5.4" || id.starts_with("gpt-5.4-") {
        return gpt54_model(id);
    }
    if id.contains("gpt-5.2-codex") {
        return codex_model(id, &["low", "medium", "high", "xhigh"]);
    }
    if id.contains("gpt-5.3-codex") {
        return codex_model(id, &["low", "medium", "high", "xhigh"]);
    }
    if id.contains("gpt-5.1-codex") {
        return codex_model(id, &["none", "low", "medium", "high"]).with_default_reasoning("none");
    }
    if id.contains("gpt-5-codex") {
        return codex_model(id, &["minimal", "low", "medium", "high"])
            .with_default_reasoning("minimal");
    }
    plain_model(id)
}

pub fn reasoning_storage_key(provider: &str, model: &str) -> String {
    format!("{}::{}", normalize_provider(provider), model)
}

fn parse_reasoning_storage_key(value: &str) -> Option<(String, String)> {
    let (provider, model) = value.split_once("::")?;
    let normalized_provider = normalize_provider(provider).to_string();
    let trimmed_model = model.trim().to_string();
    if trimmed_model.is_empty() {
        None
    } else {
        Some((normalized_provider, trimmed_model))
    }
}

fn resolve_default_reasoning(model: &AiProviderModelEntry) -> Option<String> {
    let default_reasoning = model.default_reasoning.as_deref()?.trim();
    if default_reasoning.is_empty() {
        return None;
    }

    model
        .reasoning_efforts
        .iter()
        .any(|candidate| candidate.id == default_reasoning)
        .then(|| default_reasoning.to_string())
}

fn resolve_first_reasoning(model: &AiProviderModelEntry) -> Option<String> {
    model
        .reasoning_efforts
        .first()
        .map(|entry| entry.id.clone())
}

trait WithDefaultReasoning {
    fn with_default_reasoning(self, default_reasoning: &str) -> Self;
}

impl WithDefaultReasoning for AiProviderModelEntry {
    fn with_default_reasoning(mut self, default_reasoning: &str) -> Self {
        self.default_reasoning = Some(default_reasoning.to_string());
        self
    }
}

#[cfg(test)]
mod tests {
    use super::{
        get_ai_provider_catalog, infer_codex_model, normalize_provider_reasoning_with_catalog,
        reasoning_storage_key, resolve_model_with_catalog, resolve_reasoning_with_catalog,
    };
    use std::collections::HashMap;

    #[test]
    fn resolve_reasoning_falls_back_to_catalog_default() {
        let reasoning = HashMap::new();
        let catalog = get_ai_provider_catalog();

        assert_eq!(
            resolve_reasoning_with_catalog(
                "openai-codex-local",
                "gpt-5-codex",
                &reasoning,
                &catalog
            ),
            Some("minimal".to_string())
        );
    }

    #[test]
    fn gpt_5_2_codex_catalog_does_not_allow_none() {
        let provider = get_ai_provider_catalog()
            .into_iter()
            .find(|entry| entry.id == "openai-codex-local")
            .expect("codex provider");
        let model = provider
            .models
            .into_iter()
            .find(|entry| entry.id == "gpt-5.2-codex")
            .expect("gpt-5.2-codex model");

        assert_eq!(model.default_reasoning, None);
        assert!(!model
            .reasoning_efforts
            .iter()
            .any(|option| option.id == "none"));
    }

    #[test]
    fn invalid_gpt_5_2_codex_reasoning_is_ignored() {
        let mut reasoning = HashMap::new();
        let catalog = get_ai_provider_catalog();
        reasoning.insert(
            reasoning_storage_key("openai-codex-local", "gpt-5.2-codex"),
            "none".to_string(),
        );

        assert_eq!(
            resolve_reasoning_with_catalog(
                "openai-codex-local",
                "gpt-5.2-codex",
                &reasoning,
                &catalog,
            ),
            Some("low".to_string())
        );
    }

    #[test]
    fn resolve_reasoning_falls_back_to_first_option_when_no_catalog_default_exists() {
        let reasoning = HashMap::new();
        let catalog = get_ai_provider_catalog();

        assert_eq!(
            resolve_reasoning_with_catalog(
                "openai-codex-local",
                "gpt-5.3-codex",
                &reasoning,
                &catalog,
            ),
            Some("low".to_string())
        );
    }

    #[test]
    fn normalize_provider_reasoning_uses_augmented_catalog() {
        let mut catalog = get_ai_provider_catalog();
        let provider = catalog
            .iter_mut()
            .find(|entry| entry.id == "openai-codex-local")
            .expect("codex provider");
        provider.models.push(infer_codex_model("gpt-5.4-ultra"));

        let mut provider_models = HashMap::new();
        provider_models.insert(
            "openai-codex-local".to_string(),
            "gpt-5.4-ultra".to_string(),
        );

        let mut reasoning = HashMap::new();
        reasoning.insert("openai-codex-local".to_string(), "high".to_string());

        normalize_provider_reasoning_with_catalog(&mut reasoning, &provider_models, &catalog);

        assert_eq!(
            reasoning.get("openai-codex-local::gpt-5.4-ultra"),
            Some(&"high".to_string())
        );
    }

    #[test]
    fn resolve_model_prefers_augmented_catalog_entries() {
        let mut catalog = get_ai_provider_catalog();
        let provider = catalog
            .iter_mut()
            .find(|entry| entry.id == "openai-codex-local")
            .expect("codex provider");
        provider.models.push(infer_codex_model("gpt-5.4-ultra"));

        let mut provider_models = HashMap::new();
        provider_models.insert(
            "openai-codex-local".to_string(),
            "gpt-5.4-ultra".to_string(),
        );

        assert_eq!(
            resolve_model_with_catalog("openai-codex-local", &provider_models, &catalog),
            "gpt-5.4-ultra".to_string()
        );
    }
}
