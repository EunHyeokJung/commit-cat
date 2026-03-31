use crate::models::ai_provider_catalog::{
    normalize_provider_models, normalize_provider_owned, normalize_provider_reasoning,
};
use crate::services;
use commit_cat_core::models::settings::AppSettings;
use serde_json::{Map, Value};

#[tauri::command]
pub async fn get_settings(app: tauri::AppHandle) -> Result<AppSettings, String> {
    let data = services::storage::load(&app)?;
    let mut settings = data.settings;
    normalize_settings(&mut settings);
    Ok(settings)
}

#[tauri::command]
pub async fn update_settings(
    app: tauri::AppHandle,
    mut settings: AppSettings,
) -> Result<bool, String> {
    normalize_settings(&mut settings);
    services::storage::update(&app, move |data| {
        data.settings = settings;
        Ok(())
    })?;
    Ok(true)
}

#[tauri::command]
pub async fn update_settings_patch(
    app: tauri::AppHandle,
    patch: Map<String, Value>,
) -> Result<bool, String> {
    services::storage::update(&app, move |data| {
        let mut settings_value = serde_json::to_value(&data.settings)
            .map_err(|e| format!("Failed to serialize settings: {}", e))?;
        let settings_object = settings_value
            .as_object_mut()
            .ok_or_else(|| "Failed to serialize settings patch target".to_string())?;

        for (key, value) in patch {
            settings_object.insert(key, value);
        }

        let mut settings: AppSettings = serde_json::from_value(settings_value)
            .map_err(|e| format!("Failed to apply settings patch: {}", e))?;
        normalize_settings(&mut settings);
        data.settings = settings;
        Ok(())
    })?;
    Ok(true)
}

fn normalize_settings(settings: &mut AppSettings) {
    settings.ai_provider = normalize_provider_owned(&settings.ai_provider);
    normalize_provider_models(&mut settings.ai_provider_models);
    normalize_provider_reasoning(
        &mut settings.ai_provider_reasoning,
        &settings.ai_provider_models,
    );
}
