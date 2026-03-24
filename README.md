# CommitCat 🐈‍⬛

A developer desktop companion that grows with your coding activity.

![CommitCat on desktop](assets/example.png)

CommitCat lives on your desktop, watches your development environment locally, and reacts to your work — commits, coding time, focus sessions, and more.

> 🐱 A tiny coding partner that never judges you (even at 3 AM).

---

## ✨ Features

### Core
- 🐾 Desktop pet with pixel-art sprites — walks, sits, sleeps, and celebrates
- 👣 Menu bar / system tray companion (streak tooltip)
- 🖱️ Draggable — place it anywhere on your screen
- 💬 Click to chat (speech bubble reactions with personality)
- 💬 Random coding messages — cat reacts while you code
- 🎨 Multi-color cat (orange / brown / white)
- 💤 Sleeps when you're away
- 🖥️ Fullscreen-aware — auto-hides when you go fullscreen

### Coding Activity
- 🐙 Local Git commit & push tracking — reacts every time you commit
- 💻 IDE detection — knows when you're coding (VS Code, JetBrains, Xcode, and more)
- 🌙 Late-night coding awareness
- 🌱 XP & level system — grows with your activity
- 🔥 Streak system — 3/7/30-day milestones with bonus XP
- ✨ Pixel-art level-up animation with burst particles

### Focus & Productivity
- ⏱️ Pomodoro focus timer with break timer
- 📊 Daily summary timeline (right-click → Today) — view commits, coding time, XP earned, and event history

### Integrations
- 🐙 GitHub integration — PR open/merge XP, star notifications
- 🤖 Claude AI chat — double-click the cat to chat with your AI companion (Anthropic API)
- 🔔 macOS Notification Center — system notifications for key events
- 🔄 Auto-update checker — notifies when a new version is available

### Settings
- ⚙️ Settings panel — manage watched repos, cat color, timer durations, API keys, and XP progress
- 🐳 Docker activity awareness — container start/build detection with XP

---

## 🧠 How It Grows

CommitCat gains XP from:

| Activity | XP |
|---|---|
| Git commit | +10 XP |
| Git push | +5 XP |
| 1 hour of coding | +5 XP |
| Late-night session | +15 XP |
| Pomodoro complete | +20 XP |
| GitHub PR opened | +20 XP |
| GitHub PR merged | +30 XP |
| Docker container start | +5 XP |
| Docker build complete | +15 XP |
| 3-day streak | +50 XP |
| 7-day streak | +100 XP |
| 30-day streak | +500 XP |

Level up formula: **Level n → n+1 requires n × 100 XP**

The more you build, the happier it becomes.

---

## 🔒 Privacy First

CommitCat is designed for developers who care about privacy.

- ❌ No code is collected
- ❌ No keystrokes are recorded
- ❌ No files are uploaded
- ❌ No telemetry by default

✔️ All data is stored locally on your machine
✔️ External integrations (GitHub, AI) are opt-in only

---

## 🖥️ Platforms

- ✅ macOS
- ✅ Windows
- 🔜 Linux

---

## 📦 Installation

Download from the [Releases page](https://github.com/eunseo9311/commit-cat/releases).

**macOS**
```
CommitCat.dmg
```

**Windows**
```
CommitCat-Setup.exe
```

### Build from source

```bash
git clone https://github.com/eunseo9311/commit-cat.git
cd commit-cat
npm install
npm run tauri dev
```

**Requirements:** Node.js, Rust, Tauri CLI

---

## 🛠️ Built With

- [Tauri](https://tauri.app/) — lightweight desktop framework
- [React](https://react.dev/) — UI
- [Rust](https://www.rust-lang.org/) — system integration, Git & IDE tracking
- [Anthropic API](https://docs.anthropic.com/) — AI chat (optional)

---

## 🗺️ Roadmap

**MVP ✅**
- [x] Desktop pet rendering
- [x] Activity & IDE detection
- [x] Local Git integration
- [x] XP & growth system
- [x] Tray / menu bar UI
- [x] Settings panel

**v1 ✅**
- [x] Pomodoro focus timer with break timer
- [x] Daily coding summary & event timeline
- [x] GitHub integration (PR tracking, star notifications)
- [x] Claude AI chat companion
- [x] macOS notifications
- [x] Windows support

**Next**
- [ ] Linux support
- [x] Docker integration
- [ ] IDE plugins
- [ ] Custom skins
- [ ] Cloud sync (optional)

---

## 🤝 Contributing

Contributions are welcome!

- Open an issue
- Suggest features
- Submit pull requests

---

## 📜 License

MIT License

---

## 💬 Status

v1 feature-complete — actively developing
If you like the idea, consider giving the repo a ⭐
