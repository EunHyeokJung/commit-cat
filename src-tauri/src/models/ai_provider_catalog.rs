use commit_cat_core::models::ai_provider_catalog::{
    get_ai_provider_catalog as get_core_ai_provider_catalog, infer_codex_model,
    AiProviderCatalogEntry, AiProviderCatalogResponse, CodexConfigFile,
};
use std::fs;
use std::path::PathBuf;

pub fn get_ai_provider_catalog_response() -> AiProviderCatalogResponse {
    AiProviderCatalogResponse {
        providers: get_ai_provider_catalog(),
    }
}

pub fn get_ai_provider_catalog() -> Vec<AiProviderCatalogEntry> {
    let mut providers = get_core_ai_provider_catalog();

    if let Some(local_model) = read_codex_config_model() {
        if let Some(codex_provider) = providers
            .iter_mut()
            .find(|provider| provider.id == "openai-codex-local")
        {
            let already_present = codex_provider
                .models
                .iter()
                .any(|candidate| candidate.id == local_model);
            if !already_present {
                codex_provider.models.push(infer_codex_model(&local_model));
            }
        }
    }

    providers
}

fn read_codex_config_model() -> Option<String> {
    let path = codex_config_path()?;
    let raw = fs::read_to_string(path).ok()?;
    parse_codex_config_model(&raw)
}

fn codex_config_path() -> Option<PathBuf> {
    if let Some(codex_home) = std::env::var_os("CODEX_HOME") {
        return Some(PathBuf::from(codex_home).join("config.toml"));
    }

    let home = std::env::var_os("HOME").or_else(|| std::env::var_os("USERPROFILE"))?;
    Some(PathBuf::from(home).join(".codex").join("config.toml"))
}

fn parse_codex_config_model(raw: &str) -> Option<String> {
    let parsed = toml::from_str::<CodexConfigFile>(raw)
        .ok()
        .and_then(|config| config.model);

    parsed
        .or_else(|| {
            raw.lines().find_map(|line| {
                let trimmed = line.trim();
                if trimmed.starts_with("model") {
                    let (_, value) = trimmed.split_once('=')?;
                    let value = value.trim().trim_matches('"').trim_matches('\'');
                    if value.is_empty() {
                        None
                    } else {
                        Some(value.to_string())
                    }
                } else {
                    None
                }
            })
        })
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}
