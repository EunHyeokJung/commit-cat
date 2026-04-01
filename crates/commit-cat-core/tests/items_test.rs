use commit_cat_core::items::*;

#[test]
fn first_commit_unlocks_party_hat() {
    let unlocked = check_unlocks(1, 1, 0, 0, 6, &[]);
    assert!(unlocked.contains(&"party_hat".to_string()));
}

#[test]
fn zero_commits_unlocks_nothing() {
    let unlocked = check_unlocks(1, 0, 0, 0, 6, &[]);
    assert!(unlocked.is_empty());
}

#[test]
fn level5_unlocks_wizard() {
    let unlocked = check_unlocks(5, 10, 0, 0, 6, &[]);
    assert!(unlocked.contains(&"wizard".to_string()));
}

#[test]
fn level10_unlocks_crown() {
    let unlocked = check_unlocks(10, 10, 0, 0, 6, &[]);
    assert!(unlocked.contains(&"crown".to_string()));
}

#[test]
fn streak7_unlocks_tophat() {
    let unlocked = check_unlocks(1, 1, 7, 0, 6, &[]);
    assert!(unlocked.contains(&"tophat".to_string()));
}

#[test]
fn streak30_unlocks_cornhead() {
    let unlocked = check_unlocks(1, 1, 30, 0, 6, &[]);
    assert!(unlocked.contains(&"cornhead".to_string()));
}

#[test]
fn december_unlocks_santahat() {
    let unlocked = check_unlocks(1, 1, 0, 0, 12, &[]);
    assert!(unlocked.contains(&"santahat".to_string()));
}

#[test]
fn non_december_no_santahat() {
    let unlocked = check_unlocks(1, 1, 0, 0, 6, &[]);
    assert!(!unlocked.contains(&"santahat".to_string()));
}

#[test]
fn late_night_10_unlocks_sunglass() {
    let unlocked = check_unlocks(1, 1, 0, 10, 6, &[]);
    assert!(unlocked.contains(&"sunglass".to_string()));
}

#[test]
fn commits_50_unlocks_tuna() {
    let unlocked = check_unlocks(1, 50, 0, 0, 6, &[]);
    assert!(unlocked.contains(&"tuna".to_string()));
}

#[test]
fn already_unlocked_not_duplicated() {
    let already = vec!["party_hat".to_string(), "wizard".to_string()];
    let unlocked = check_unlocks(5, 10, 0, 0, 6, &already);
    assert!(!unlocked.contains(&"party_hat".to_string()));
    assert!(!unlocked.contains(&"wizard".to_string()));
}

#[test]
fn multiple_unlocks_at_once() {
    // level 10 + 50 commits + 7 streak + december
    let unlocked = check_unlocks(10, 50, 7, 0, 12, &[]);
    assert!(unlocked.contains(&"party_hat".to_string()));
    assert!(unlocked.contains(&"wizard".to_string()));
    assert!(unlocked.contains(&"crown".to_string()));
    assert!(unlocked.contains(&"tophat".to_string()));
    assert!(unlocked.contains(&"santahat".to_string()));
    assert!(unlocked.contains(&"tuna".to_string()));
}

// ── auto_equip ──

#[test]
fn auto_equip_when_no_hat() {
    let result = auto_equip(&["party_hat".to_string()], &None);
    assert_eq!(result, Some("party_hat".to_string()));
}

#[test]
fn auto_equip_skips_when_hat_equipped() {
    let result = auto_equip(&["wizard".to_string()], &Some("crown".to_string()));
    assert_eq!(result, None);
}

#[test]
fn auto_equip_empty_unlocks() {
    let result = auto_equip(&[], &None);
    assert_eq!(result, None);
}

// ── check_event_auto_equip ──

#[test]
fn birthday_event_equip() {
    let unlocked = vec!["party_hat".to_string()];
    let result = check_event_auto_equip(true, 1, 0, 6, &unlocked);
    assert!(result.is_some());
    let event = result.unwrap();
    assert_eq!(event.hat_id, "party_hat");
    assert_eq!(event.duration_hours, 24);
}

#[test]
fn birthday_not_unlocked_no_equip() {
    let result = check_event_auto_equip(true, 1, 0, 6, &[]);
    assert!(result.is_none());
}

#[test]
fn level10_event_equip() {
    let unlocked = vec!["crown".to_string()];
    let result = check_event_auto_equip(false, 10, 0, 6, &unlocked);
    assert!(result.is_some());
    assert_eq!(result.unwrap().hat_id, "crown");
}

#[test]
fn streak7_event_equip() {
    let unlocked = vec!["tophat".to_string()];
    let result = check_event_auto_equip(false, 1, 7, 6, &unlocked);
    assert!(result.is_some());
    assert_eq!(result.unwrap().hat_id, "tophat");
}

#[test]
fn december_event_equip() {
    let unlocked = vec!["santahat".to_string()];
    let result = check_event_auto_equip(false, 1, 0, 12, &unlocked);
    assert!(result.is_some());
    assert_eq!(result.unwrap().hat_id, "santahat");
}

#[test]
fn birthday_takes_priority_over_level10() {
    let unlocked = vec!["party_hat".to_string(), "crown".to_string()];
    let result = check_event_auto_equip(true, 10, 0, 6, &unlocked);
    assert!(result.is_some());
    assert_eq!(result.unwrap().hat_id, "party_hat"); // birthday > level10
}

#[test]
fn no_event_no_equip() {
    let unlocked = vec!["party_hat".to_string()];
    let result = check_event_auto_equip(false, 1, 0, 6, &unlocked);
    assert!(result.is_none());
}
