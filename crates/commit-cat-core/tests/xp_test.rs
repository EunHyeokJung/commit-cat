use commit_cat_core::xp::*;

// ── apply_xp ──

#[test]
fn basic_xp_no_levelup() {
    let result = apply_xp(1, 0, 50);
    assert_eq!(result.level, 1);
    assert_eq!(result.current_exp, 50);
    assert!(!result.leveled_up);
}

#[test]
fn xp_causes_levelup() {
    // level 1 needs 100 XP
    let result = apply_xp(1, 0, 100);
    assert_eq!(result.level, 2);
    assert_eq!(result.current_exp, 0);
    assert!(result.leveled_up);
}

#[test]
fn xp_overflow_multi_levelup() {
    // level 1 needs 100, level 2 needs 200 → 300 total to reach level 3
    let result = apply_xp(1, 0, 350);
    assert_eq!(result.level, 3);
    assert_eq!(result.current_exp, 50); // 350 - 100 - 200 = 50
    assert!(result.leveled_up);
}

#[test]
fn xp_with_existing_exp() {
    // level 1, already has 80 exp, add 30 → 110 → levelup with 10 remaining
    let result = apply_xp(1, 80, 30);
    assert_eq!(result.level, 2);
    assert_eq!(result.current_exp, 10);
    assert!(result.leveled_up);
}

#[test]
fn exp_to_next_is_correct() {
    let result = apply_xp(1, 0, 50);
    assert_eq!(result.exp_to_next, 100); // level 1 needs 100
}

#[test]
fn exp_to_next_after_levelup() {
    let result = apply_xp(1, 0, 100);
    assert_eq!(result.exp_to_next, 200); // level 2 needs 200
}

// ── streak_milestone_bonus ──

#[test]
fn streak_3_bonus() {
    assert_eq!(streak_milestone_bonus(3), Some(50));
}

#[test]
fn streak_7_bonus() {
    assert_eq!(streak_milestone_bonus(7), Some(100));
}

#[test]
fn streak_30_bonus() {
    assert_eq!(streak_milestone_bonus(30), Some(500));
}

#[test]
fn streak_no_bonus() {
    assert_eq!(streak_milestone_bonus(1), None);
    assert_eq!(streak_milestone_bonus(5), None);
    assert_eq!(streak_milestone_bonus(15), None);
}

// ── update_streak ──

#[test]
fn first_activity_starts_streak() {
    let result = update_streak("2026-04-01", "2026-03-31", None, 0);
    assert!(result.is_some());
    assert_eq!(result.unwrap().streak_days, 1);
}

#[test]
fn consecutive_day_increments_streak() {
    let result = update_streak("2026-04-01", "2026-03-31", Some("2026-03-31"), 5);
    assert!(result.is_some());
    assert_eq!(result.unwrap().streak_days, 6);
}

#[test]
fn gap_resets_streak() {
    let result = update_streak("2026-04-01", "2026-03-31", Some("2026-03-29"), 5);
    assert!(result.is_some());
    assert_eq!(result.unwrap().streak_days, 1);
}

#[test]
fn same_day_no_update() {
    let result = update_streak("2026-04-01", "2026-03-31", Some("2026-04-01"), 5);
    assert!(result.is_none());
}

#[test]
fn streak_milestone_included() {
    let result = update_streak("2026-04-01", "2026-03-31", Some("2026-03-31"), 6);
    assert!(result.is_some());
    let r = result.unwrap();
    assert_eq!(r.streak_days, 7);
    assert_eq!(r.milestone_bonus, Some(100));
}
