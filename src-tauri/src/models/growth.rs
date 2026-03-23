use serde::{Deserialize, Serialize};

/// 레벨 정보
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LevelInfo {
    pub level: u32,
    pub current_exp: u32,
    pub exp_to_next: u32,
    pub total_exp: u32,
}

/// 레벨업에 필요한 EXP: level * 100
pub fn exp_for_level(level: u32) -> u32 {
    level * 100
}
