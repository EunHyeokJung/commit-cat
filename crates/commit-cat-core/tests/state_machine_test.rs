use commit_cat_core::models::cat::CatState;
use commit_cat_core::state_machine::*;

#[test]
fn idle_to_coding_on_activity() {
    let result = transition(&CatState::Idle, &StateEvent::ActivityDetected);
    assert_eq!(result, Some(CatState::Coding));
}

#[test]
fn idle_to_sleeping_after_10min() {
    let result = transition(&CatState::Idle, &StateEvent::IdleTimeout(600));
    assert_eq!(result, Some(CatState::Sleeping));
}

#[test]
fn idle_no_sleep_under_10min() {
    let result = transition(&CatState::Idle, &StateEvent::IdleTimeout(300));
    assert_eq!(result, None);
}

#[test]
fn idle_to_interaction_on_click() {
    let result = transition(&CatState::Idle, &StateEvent::UserClicked);
    assert_eq!(result, Some(CatState::Interaction));
}

#[test]
fn coding_to_celebrating_on_commit() {
    let result = transition(&CatState::Coding, &StateEvent::CommitDetected);
    assert_eq!(result, Some(CatState::Celebrating));
}

#[test]
fn coding_to_frustrated_on_error() {
    let result = transition(&CatState::Coding, &StateEvent::ErrorDetected);
    assert_eq!(result, Some(CatState::Frustrated));
}

#[test]
fn coding_to_idle_after_3min() {
    let result = transition(&CatState::Coding, &StateEvent::IdleTimeout(180));
    assert_eq!(result, Some(CatState::Idle));
}

#[test]
fn celebrating_to_idle_on_timer() {
    let result = transition(&CatState::Celebrating, &StateEvent::TimerExpired);
    assert_eq!(result, Some(CatState::Idle));
}

#[test]
fn frustrated_to_idle_on_timer() {
    let result = transition(&CatState::Frustrated, &StateEvent::TimerExpired);
    assert_eq!(result, Some(CatState::Idle));
}

#[test]
fn sleeping_to_idle_on_activity() {
    let result = transition(&CatState::Sleeping, &StateEvent::ActivityDetected);
    assert_eq!(result, Some(CatState::Idle));
}

#[test]
fn sleeping_to_idle_on_click() {
    let result = transition(&CatState::Sleeping, &StateEvent::UserClicked);
    assert_eq!(result, Some(CatState::Idle));
}

#[test]
fn interaction_to_idle_on_timer() {
    let result = transition(&CatState::Interaction, &StateEvent::TimerExpired);
    assert_eq!(result, Some(CatState::Idle));
}

#[test]
fn tired_to_coding_on_activity() {
    let result = transition(&CatState::Tired, &StateEvent::ActivityDetected);
    assert_eq!(result, Some(CatState::Coding));
}

#[test]
fn no_transition_for_invalid_event() {
    let result = transition(&CatState::Idle, &StateEvent::CommitDetected);
    assert_eq!(result, None);
}
