use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HatDefinition {
    pub id: &'static str,
    pub name: &'static str,
    pub image: &'static str,
    pub unlock_condition: &'static str,
}

pub const HATS: &[HatDefinition] = &[
    HatDefinition { id: "party_hat", name: "Party Hat", image: "assets/item/party_hat.png", unlock_condition: "First commit ever" },
    HatDefinition { id: "wizard", name: "Wizard Hat", image: "assets/item/wizard.png", unlock_condition: "Reach level 5" },
    HatDefinition { id: "crown", name: "Crown", image: "assets/item/crown.png", unlock_condition: "Reach level 10" },
    HatDefinition { id: "tophat", name: "Top Hat", image: "assets/item/tophat.png", unlock_condition: "7-day streak" },
    HatDefinition { id: "santahat", name: "Santa Hat", image: "assets/item/santahat.png", unlock_condition: "Code in December" },
    HatDefinition { id: "sunglass", name: "Sunglasses", image: "assets/item/sunglass.png", unlock_condition: "10 late-night sessions" },
    HatDefinition { id: "tuna", name: "Tuna", image: "assets/item/tuna.png", unlock_condition: "50 total commits" },
    HatDefinition { id: "cornhead", name: "Corn Head", image: "assets/item/cornhead.png", unlock_condition: "30-day streak" },
];

/// 첫 해금 시 자동 장착할 아이템인지 판별
/// 현재 장착 중인 아이템이 없을 때만 자동 장착
pub fn auto_equip(newly_unlocked: &[String], current_hat: &Option<String>) -> Option<String> {
    if current_hat.is_some() || newly_unlocked.is_empty() {
        return None;
    }
    // 첫 번째 해금 아이템을 자동 장착
    Some(newly_unlocked[0].clone())
}

/// Check which hats should be newly unlocked based on current stats
pub fn check_unlocks(
    level: u32,
    total_commits: u32,
    current_streak: u32,
    late_night_sessions: u32,
    month: u32,
    already_unlocked: &[String],
) -> Vec<String> {
    let mut newly_unlocked = Vec::new();

    let conditions: &[(&str, bool)] = &[
        ("party_hat", total_commits >= 1),
        ("wizard", level >= 5),
        ("crown", level >= 10),
        ("tophat", current_streak >= 7),
        ("santahat", month == 12),
        ("sunglass", late_night_sessions >= 10),
        ("tuna", total_commits >= 50),
        ("cornhead", current_streak >= 30),
    ];

    for (hat_id, condition) in conditions {
        if *condition && !already_unlocked.iter().any(|h| h == hat_id) {
            newly_unlocked.push(hat_id.to_string());
        }
    }

    newly_unlocked
}
