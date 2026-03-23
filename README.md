# CommitCat 🐈‍⬛

A developer desktop companion that grows with your coding activity.

![CommitCat on desktop](assets/example.png)

CommitCat lives on your desktop, watches your development environment locally, and reacts to your work — commits, coding time, focus sessions, and more.

> 🐱 A tiny coding partner that never judges you (even at 3 AM).

---

## ✨ Features

- 🐾 Desktop pet with pixel-art sprite — walks, sits, sleeps, and celebrates
- 👣 Menu bar / system tray companion
- 🖱️ Draggable — place it anywhere on your screen
- 💬 Click to chat (speech bubble reactions)
- 🐙 Local Git commit tracking — reacts every time you commit
- 💻 IDE detection — knows when you're coding (VS Code, JetBrains, and more)
- 🌙 Late-night coding awareness
- 🌱 XP & level system — grows with your activity
- ✨ Pixel-art level-up animation
- 🎨 Multi-color cat (orange / brown / white)
- ⚙️ Settings panel — manage watched repos, cat color, XP progress
- 💤 Sleeps when you're away
- 🤖 Optional AI companion (planned)
- 🐳 Docker activity awareness (planned)
- ⏱️ Pomodoro focus timer (planned)

---

## 🧠 How It Grows

CommitCat gains XP from:

| Activity | XP |
|---|---|
| Git commit | +10 XP |
| 1 hour of coding | +5 XP |
| Late-night session | +15 XP |

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
✔️ External integrations are opt-in only

---

## 🖥️ Platforms

- ✅ macOS
- 🔜 Windows
- 🔜 Linux

---

## 📦 Installation

🚧 Pre-release — binaries not yet available.

When available, download from the [Releases page](https://github.com/eunseo9311/commit-cat/releases).

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

---

## 🗺️ Roadmap

**MVP ✅**
- [x] Desktop pet rendering
- [x] Activity & IDE detection
- [x] Local Git integration
- [x] XP & growth system
- [x] Tray / menu bar UI
- [x] Settings panel

**Next**
- [ ] Pomodoro focus timer
- [ ] Daily coding summary
- [ ] GitHub integration
- [ ] Docker integration
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

🚧 MVP complete — actively developing  
If you like the idea, consider giving the repo a ⭐
