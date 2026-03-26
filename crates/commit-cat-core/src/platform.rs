use serde_json::Value;

/// Event emission abstraction
pub trait EventEmitter: Send + Sync {
    fn emit(&self, event: &str, payload: Value);
}

/// Data persistence abstraction
pub trait Storage: Send + Sync {
    fn load(&self) -> Result<crate::models::settings::AppData, Box<dyn std::error::Error>>;
    fn save(
        &self,
        data: &crate::models::settings::AppData,
    ) -> Result<(), Box<dyn std::error::Error>>;
}

/// IDE detection abstraction
pub trait IdeDetector: Send + Sync {
    fn detect(&self) -> Option<String>;
}
