# CommitCat Feature List

## Cat Interactions

**[Single Click]** → 250ms delay (to distinguish from double-click), then shows random speech bubble
- 1-2 clicks: "meow!", "nya~", "purr...", "mrrp?", "*stretch*", "code with me~", "prrrr~"
- 3-5 clicks: "love it!", "more pets!", "purrrr~", "nya nya~!"
- 6+ clicks: "...meow.", "okay okay!", "I'm busy!", "stahp!"
- Click resets after 3s of no clicking

**[Click while sleeping]** → Cat briefly wakes (sit pose 2s → back to sleep)
- 1-4 clicks: "...mrrp?"
- 5+ clicks: "zzz... stop...", "let me sleep...", "5 more minutes...", "go away..."

**[Double Click]** → Opens AI chat input (window expands to 220x180)
- If no API key set: shows "set API key in settings first~"
- Type message + Enter → "thinking..." bubble → Claude API response (5s)
- Escape or blur → closes chat input, window shrinks back

**[Click + Drag]** → Cat follows mouse cursor; "wheee~!" on release

**[Right Click]** → Context menu (window expands to 320px wide)
- Start Focus / Stop Focus (pomodoro toggle)
- Today (opens Summary window 400x500)
- Settings (opens Settings window 500x600)
- --- separator ---
- Quit

---

## Tray Icon

**[Left Click tray]** → Toggle cat window visibility (show/hide)

**[Right Click tray]** → Menu:
- Settings... → opens Settings window
- Check for Updates → checks GitHub releases for newer version
- --- separator ---
- Quit

**[Tray Tooltip]** → "CommitCat — {N} day streak" (or just "CommitCat" if streak=0)

---

## Automatic Background Behaviors

### IDE Detection (every 10s polling)
**[IDE starts]** → Cat switches to `coding` state (sit pose); starts coding minute counter
- Detected IDEs: VS Code, Cursor, Windsurf, IntelliJ, WebStorm, PyCharm, GoLand, CLion, RustRover, DataGrip, Rider, Xcode, Zed, Sublime Text, Android Studio
- Auto-registers git repos found in IDE's working directory

**[IDE closes]** → Cat returns to `idle` (walk/stand/sit cycle)

### Idle Detection
**[3min+ idle after coding]** → `idle` state
**[10min+ total idle]** → `sleeping` state (zzz particles)

### Git Tracking (every 30s polling)
**[New commit detected]** → `celebrating` state (3s) → +10 XP → system notification "new commit! +10 XP 🐾"
**[Push detected]** → +5 XP (no visible reaction)

### Late Night Coding
**[IDE detected between 23:00-06:00]** → `tired` state + +15 XP (once per session)

### Fullscreen Detection
**[Fullscreen app detected]** → Cat window hides; reappears when fullscreen exits

### Cat Behavior Cycle (idle state only)
walk (5-10s) → stand (2-5s) → sit (2-4s) → sleep (30-40s) → stand → repeat
- Walk: alternates stand/walk sprite every 1s, moves 0.75px per frame
- Sleep: shows "z z z" floating text; only for brown/orange cats (have sit2 sprite)

---

## Pomodoro Timer

**[Start Focus via context menu]** → Timer countdown in bubble area (MM:SS format)
- Cat enters `coding` state
- Pause/Resume button (⏸/▶)
- Stop button (■) → cancels, returns to idle

**[Timer reaches 0:00]** → "focus complete! good job hooman!" + `celebrating` state + +20 XP + system notification
- Auto-starts break timer (uses breakMinutes from settings, default 5min)

**[Break timer active]** → Green "BREAK" label + countdown
- Skip button (■) to end break early

**[Break timer reaches 0:00]** → "break's over! back to work~" + system notification

---

## GitHub Integration (every 5min polling, first tick skipped)

Requires: GitHub PAT configured in Settings

**[New PR detected on watched repo]** → "new PR opened! 🔀" bubble + +20 XP
**[PR merged]** → `celebrating` state + +30 XP
**[Star count increased]** → "someone starred us! ⭐" bubble + system notification

---

## XP & Level System

### XP Sources
| Source | Amount | Trigger |
|---|---|---|
| Git commit | +10 XP | New commit detected |
| Git push | +5 XP | Push to remote detected |
| Coding hour | +5 XP | 60 continuous coding minutes |
| Late night coding | +15 XP | IDE active 23:00-06:00 (once/session) |
| Pomodoro complete | +20 XP | Focus timer reaches 0 |
| PR opened | +20 XP | New PR on watched repo |
| PR merged | +30 XP | PR status → merged |
| 3-day streak | +50 XP | Consecutive daily activity |
| 7-day streak | +100 XP | Consecutive daily activity |
| 30-day streak | +500 XP | Consecutive daily activity |

### Level Formula
Level N → N+1 requires N × 100 XP (Lv1→2: 100 XP, Lv2→3: 200 XP, ...)

### Level Up
**[Level threshold reached]** → "LEVEL UP! Lv.{N}" golden bubble + 8-direction pixel particle burst (3s) + system notification

### Streak System
- Streak increments when XP gained on consecutive days
- Milestone at 3/7/30 days → "{N} day streak!" bubble + `celebrating` state + bonus XP

---

## Update Checker

**[App startup (after 10s)]** → Checks GitHub releases for newer version
**[Every 24h]** → Auto-checks again
**[Tray → Check for Updates]** → Manual check
**[New version found]** → "new version v{VERSION}!" bubble (5s) + system notification

---

## Notifications (macOS Notification Center)

All notifications gated by `settings.notificationsEnabled` (default: true)

| Event | Notification Body |
|---|---|
| Commit | "new commit! +10 XP 🐾" |
| Level up | "LEVEL UP! You reached Lv.{N}" |
| Pomodoro done | "focus session complete! +20 XP" |
| Break done | "break's over! back to work~" |
| GitHub star | "someone starred your repo! ⭐" |
| Update available | "New version v{VERSION} available!" |

---

## Settings Panel Sections

### Watched Repositories
- Repo list with path and remove (×) button
- "+ Add Repository" dropdown: Clone Repository... / Add Existing Repository...
- Clone modal: URL input + path chooser + Clone button

### Level
- "Lv.{N}" label + XP progress bar + "{current} / {next}" text

### Cat
- Color picker: Brown / Orange / White (circle buttons)

### Timer
- Focus Duration: ±5 min stepper (1-120 min, default 25)
- Break Duration: ±1 min stepper (1-60 min, default 5)

### AI
- Not set: password input + Save button
- Set: "Anthropic API key saved" + Remove button

### Notifications
- System Notifications: toggle switch (ON/OFF)

### GitHub
- Disconnected: PAT input + Connect button
- Connected: "Connected as @{username}" + Disconnect button
- Error: red message below input

---

## Summary Window (Today's Report)

### Header
"here's your day, hooman!"

### Stats Row
💻 Coding time | 🐾 Commits | ⭐ XP earned | 🔥 Streak | 🌟 Level

### Activity Timeline
Chronological list of today's events with timestamp, description, and XP earned

### Event Templates
- commit: "i noticed a commit! 🐾"
- push: "pushed to remote! 🚀"
- coding_hour: "a whole hour of coding! 💪"
- late_night: "still coding at night... 🌙"
- pomodoro: "focus session complete! 🍅"
- pr_open: "opened a PR! 🔀"
- pr_merge: "PR merged! 🎉"
- level_up: "LEVEL UP! {detail} 🎉"
- streak: "{detail} 🔥"

### Empty State
"no activity yet today... go make some commits! 🐾"

---
---

# CommitCat 기능 목록 (한국어)

## 고양이 상호작용

**[한 번 클릭]** → 랜덤 말풍선 표시 (더블클릭 구분을 위해 250ms 딜레이)
- 1-2회: "meow!", "nya~", "purr...", "mrrp?", "*stretch*", "code with me~", "prrrr~"
- 3-5회: "love it!", "more pets!", "purrrr~", "nya nya~!"
- 6회 이상: "...meow.", "okay okay!", "I'm busy!", "stahp!"
- 3초간 클릭 없으면 카운트 초기화

**[자는 중 클릭]** → 잠깐 깸 (앉기 자세 2초 → 다시 잠듦)
- 1-4회: "...mrrp?"
- 5회 이상: "zzz... stop...", "let me sleep...", "5 more minutes...", "go away..."

**[더블클릭]** → AI 채팅 입력창 열림 (윈도우 220x180으로 확장)
- API 키 미설정 시: "set API key in settings first~"
- 메시지 입력 + Enter → "thinking..." 말풍선 → Claude API 응답 (5초간 표시)
- Escape 또는 포커스 해제 → 채팅창 닫힘, 윈도우 원래 크기로

**[클릭 + 드래그]** → 고양이가 마우스를 따라감; 놓으면 "wheee~!"

**[우클릭]** → 컨텍스트 메뉴 (윈도우 320px로 확장)
- Start Focus / Stop Focus (포모도로 토글)
- Today (오늘 요약 윈도우 400x500 열기)
- Settings (설정 윈도우 500x600 열기)
- --- 구분선 ---
- Quit (종료)

---

## 트레이 아이콘

**[트레이 좌클릭]** → 고양이 윈도우 보이기/숨기기 토글

**[트레이 우클릭]** → 메뉴:
- Settings... → 설정 윈도우 열기
- Check for Updates → GitHub 릴리즈에서 새 버전 확인
- --- 구분선 ---
- Quit (종료)

**[트레이 툴팁]** → "CommitCat — {N} day streak" (스트릭 0이면 "CommitCat"만 표시)

---

## 자동 백그라운드 동작

### IDE 감지 (10초마다 폴링)
**[IDE 실행됨]** → 고양이 `coding` 상태 전환 (앉기 자세); 코딩 시간 카운터 시작
- 감지 IDE: VS Code, Cursor, Windsurf, IntelliJ, WebStorm, PyCharm, GoLand, CLion, RustRover, DataGrip, Rider, Xcode, Zed, Sublime Text, Android Studio
- IDE 작업 디렉토리에서 git 저장소 자동 등록

**[IDE 종료됨]** → `idle` 상태 복귀 (걷기/서기/앉기 사이클)

### 유휴 감지
**[코딩 후 3분 이상 유휴]** → `idle` 상태
**[총 10분 이상 유휴]** → `sleeping` 상태 (zzz 파티클)

### Git 추적 (30초마다 폴링)
**[새 커밋 감지]** → `celebrating` 상태 (3초) → +10 XP → 시스템 알림 "new commit! +10 XP 🐾"
**[푸시 감지]** → +5 XP (별도 시각적 반응 없음)

### 야간 코딩
**[23:00-06:00 사이 IDE 감지]** → `tired` 상태 + +15 XP (세션당 1회)

### 풀스크린 감지
**[풀스크린 앱 감지]** → 고양이 윈도우 숨김; 풀스크린 해제 시 다시 표시

### 고양이 행동 사이클 (idle 상태에서만)
걷기 (5-10초) → 서기 (2-5초) → 앉기 (2-4초) → 잠자기 (30-40초) → 서기 → 반복
- 걷기: stand/walk 스프라이트 1초마다 교체, 프레임당 0.75px 이동
- 잠자기: "z z z" 떠다니는 텍스트 표시; brown/orange 고양이만 (sit2 스프라이트 보유)

---

## 포모도로 타이머

**[컨텍스트 메뉴에서 Start Focus]** → 말풍선 영역에 타이머 카운트다운 (MM:SS)
- 고양이 `coding` 상태 진입
- 일시정지/재개 버튼 (⏸/▶)
- 정지 버튼 (■) → 취소, idle로 복귀

**[타이머 0:00 도달]** → "focus complete! good job hooman!" + `celebrating` 상태 + +20 XP + 시스템 알림
- 자동으로 휴식 타이머 시작 (설정의 breakMinutes 사용, 기본 5분)

**[휴식 타이머 활성]** → 초록색 "BREAK" 라벨 + 카운트다운
- 건너뛰기 버튼 (■)으로 휴식 조기 종료

**[휴식 타이머 0:00 도달]** → "break's over! back to work~" + 시스템 알림

---

## GitHub 연동 (5분마다 폴링, 첫 번째 틱은 건너뜀)

필수: 설정에서 GitHub PAT 토큰 연결

**[감시 중인 레포에서 새 PR 감지]** → "new PR opened! 🔀" 말풍선 + +20 XP
**[PR 머지됨]** → `celebrating` 상태 + +30 XP
**[스타 수 증가]** → "someone starred us! ⭐" 말풍선 + 시스템 알림

---

## XP & 레벨 시스템

### XP 획득 방법
| 출처 | 보상 | 조건 |
|---|---|---|
| Git 커밋 | +10 XP | 새 커밋 감지 시 |
| Git 푸시 | +5 XP | 리모트 푸시 감지 시 |
| 코딩 1시간 | +5 XP | 연속 60분 코딩 |
| 야간 코딩 | +15 XP | 23:00-06:00 IDE 활성 (세션당 1회) |
| 포모도로 완료 | +20 XP | 집중 타이머 종료 시 |
| PR 오픈 | +20 XP | 감시 레포에 새 PR |
| PR 머지 | +30 XP | PR 상태 → merged |
| 3일 연속 | +50 XP | 연속 활동 |
| 7일 연속 | +100 XP | 연속 활동 |
| 30일 연속 | +500 XP | 연속 활동 |

### 레벨 공식
레벨 N → N+1에 필요한 XP: N × 100 (Lv1→2: 100, Lv2→3: 200, ...)

### 레벨 업
**[레벨 임계치 도달]** → "LEVEL UP! Lv.{N}" 금색 말풍선 + 8방향 픽셀 파티클 (3초) + 시스템 알림

### 스트릭 시스템
- 연속 날에 XP 획득 시 스트릭 증가
- 3/7/30일 마일스톤 → "{N} day streak!" 말풍선 + `celebrating` 상태 + 보너스 XP

---

## 업데이트 체커

**[앱 시작 (10초 후)]** → GitHub 릴리즈에서 새 버전 확인
**[24시간마다]** → 자동 재확인
**[트레이 → Check for Updates]** → 수동 확인
**[새 버전 발견]** → "new version v{VERSION}!" 말풍선 (5초) + 시스템 알림

---

## 알림 (macOS 알림 센터)

모든 알림은 `settings.notificationsEnabled` 설정에 의해 제어됨 (기본: 켜짐)

| 이벤트 | 알림 내용 |
|---|---|
| 커밋 | "new commit! +10 XP 🐾" |
| 레벨 업 | "LEVEL UP! You reached Lv.{N}" |
| 포모도로 완료 | "focus session complete! +20 XP" |
| 휴식 완료 | "break's over! back to work~" |
| GitHub 스타 | "someone starred your repo! ⭐" |
| 업데이트 가능 | "New version v{VERSION} available!" |

---

## 설정 패널 구성

### 감시 저장소 (Watched Repositories)
- 저장소 목록 + 경로 표시 + 삭제 (×) 버튼
- "+ Add Repository" 드롭다운: Clone Repository... / Add Existing Repository...
- Clone 모달: URL 입력 + 경로 선택 + Clone 버튼

### 레벨 (Level)
- "Lv.{N}" 라벨 + XP 진행 바 + "{현재} / {다음}" 텍스트

### 고양이 (Cat)
- 색상 선택: Brown / Orange / White (원형 버튼)

### 타이머 (Timer)
- 집중 시간: ±5분 스텝퍼 (1-120분, 기본 25분)
- 휴식 시간: ±1분 스텝퍼 (1-60분, 기본 5분)

### AI
- 미설정: 비밀번호 입력창 + Save 버튼
- 설정됨: "Anthropic API key saved" + Remove 버튼

### 알림 (Notifications)
- System Notifications: 토글 스위치 (ON/OFF)

### GitHub
- 미연결: PAT 입력창 + Connect 버튼
- 연결됨: "Connected as @{username}" + Disconnect 버튼
- 오류: 입력창 아래 빨간 에러 메시지

---

## 오늘 요약 윈도우 (Today's Report)

### 헤더
"here's your day, hooman!"

### 통계 행
💻 코딩 시간 | 🐾 커밋 수 | ⭐ 획득 XP | 🔥 스트릭 | 🌟 레벨

### 활동 타임라인
오늘의 이벤트를 시간순으로 나열 (타임스탬프 + 설명 + 획득 XP)

### 이벤트 템플릿
- commit: "i noticed a commit! 🐾"
- push: "pushed to remote! 🚀"
- coding_hour: "a whole hour of coding! 💪"
- late_night: "still coding at night... 🌙"
- pomodoro: "focus session complete! 🍅"
- pr_open: "opened a PR! 🔀"
- pr_merge: "PR merged! 🎉"
- level_up: "LEVEL UP! {detail} 🎉"
- streak: "{detail} 🔥"

### 빈 상태
"no activity yet today... go make some commits! 🐾"
