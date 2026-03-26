use serde::Serialize;

use crate::models::growth::exp_for_level;

/// XP 추가 결과
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AddXpResult {
    pub level: u32,
    pub current_exp: u32,
    pub exp_to_next: u32,
    pub leveled_up: bool,
}

/// 스트릭 정보
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StreakInfo {
    pub streak_days: u32,
    pub last_active_date: Option<String>,
}

/// 스트릭 마일스톤 보너스 XP 계산
/// 해당 streak_days에 마일스톤이 있으면 보너스 XP 반환
pub fn streak_milestone_bonus(streak_days: u32) -> Option<u32> {
    match streak_days {
        3 => Some(50),
        7 => Some(100),
        30 => Some(500),
        _ => None,
    }
}

/// XP를 추가하고 레벨업 처리 (순수 함수)
/// 현재 level, exp에 amount를 더한 뒤 레벨업 루프를 돌려 최종 상태 반환
pub fn apply_xp(level: u32, exp: u32, amount: u32) -> AddXpResult {
    let mut current_level = level;
    let mut current_exp = exp + amount;
    let mut leveled_up = false;

    loop {
        let needed = exp_for_level(current_level);
        if current_exp >= needed {
            current_exp -= needed;
            current_level += 1;
            leveled_up = true;
        } else {
            break;
        }
    }

    AddXpResult {
        level: current_level,
        current_exp,
        exp_to_next: exp_for_level(current_level),
        leveled_up,
    }
}

/// 스트릭 업데이트 결과
#[derive(Debug, Clone)]
pub struct StreakUpdateResult {
    pub streak_days: u32,
    pub milestone_bonus: Option<u32>,
}

/// 스트릭 업데이트 로직 (순수 함수)
/// today_str: 오늘 날짜 ("YYYY-MM-DD")
/// yesterday_str: 어제 날짜 ("YYYY-MM-DD")
/// last_active_date: 마지막 활동 날짜
/// current_streak: 현재 스트릭 일수
pub fn update_streak(
    today_str: &str,
    yesterday_str: &str,
    last_active_date: Option<&str>,
    current_streak: u32,
) -> Option<StreakUpdateResult> {
    // 오늘 이미 활동했으면 업데이트 불필요
    if last_active_date == Some(today_str) {
        return None;
    }

    let new_streak = if last_active_date == Some(yesterday_str) {
        current_streak + 1
    } else {
        1
    };

    let milestone_bonus = streak_milestone_bonus(new_streak);

    Some(StreakUpdateResult {
        streak_days: new_streak,
        milestone_bonus,
    })
}
