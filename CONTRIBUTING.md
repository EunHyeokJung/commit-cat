# Contributing to CommitCat

Thank you for your interest in contributing to CommitCat! Whether it's a bug report, feature suggestion, code contribution, or design asset — every bit helps make the coding companion better.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Commit Convention](#commit-convention)
- [Good First Issues](#good-first-issues)
- [Code of Conduct](#code-of-conduct)

---

## Getting Started

CommitCat is a cross-platform desktop pet built with **Tauri 2** (Rust backend) and **React 19** (frontend). Before contributing, make sure you're comfortable with at least one of these areas:

| Area | Tech | Location |
|------|------|----------|
| Core logic | Rust | `crates/commit-cat-core/` |
| Desktop app backend | Rust + Tauri | `src-tauri/` |
| Desktop app frontend | React + TypeScript | `src/` |
| VSCode Extension | TypeScript | `vscode-extension/` |
| JetBrains Plugin | Kotlin | `jetbrains-plugin/` |

You don't need to know all of them — pick the area that fits your skills.

---

## Project Structure

```
commit-cat/
├── crates/
│   └── commit-cat-core/          # Platform-independent core logic
│       ├── src/models/            # Data structures (AppData, CatState, etc.)
│       ├── src/state_machine.rs   # Cat behavior state transitions
│       ├── src/xp.rs              # XP calculation, leveling, streaks
│       └── src/platform.rs        # Trait definitions (EventEmitter, Storage, IdeDetector)
│
├── src-tauri/                     # Tauri desktop app (Rust backend)
│   ├── src/commands/              # IPC command handlers
│   ├── src/services/              # Background services (git, github, docker, etc.)
│   └── src/platform/              # OS-specific implementations (macOS, Windows, Linux)
│
├── src/                           # React frontend
│   ├── components/                # UI components (Cat, Settings, Summary, etc.)
│   ├── stores/                    # Zustand state management
│   └── styles/                    # CSS
│
├── vscode-extension/              # VSCode Extension
│   └── src/extension.ts
│
├── jetbrains-plugin/              # JetBrains Plugin (Kotlin)
│   └── src/main/kotlin/
│
└── assets/                        # Pixel art sprites and icons
```

### Architecture Principles

- **Core logic lives in `commit-cat-core`** — shared across desktop, server, and future WASM targets
- **Platform-specific code goes in `src-tauri/src/platform/`** — one file per OS
- **New platforms implement traits** from `commit-cat-core::platform` — no modifying existing files

---

## Development Setup

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **Rust** | stable | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| **Tauri CLI** | 2.x | `cargo install tauri-cli --version "^2"` |

### Running the Desktop App

```bash
git clone https://github.com/eunseo9311/commit-cat.git
cd commit-cat
npm install
npm run tauri dev
```

This starts both the Vite dev server (frontend) and the Tauri backend. The cat window should appear on your desktop.

### Building

```bash
# Check core crate
cargo check -p commit-cat-core

# Check desktop app
cargo check -p commit-cat

# Full build
npm run tauri build
```

### VSCode Extension

```bash
cd vscode-extension
npm install
# Open in VSCode and press F5 to launch Extension Development Host
```

### JetBrains Plugin

```bash
cd jetbrains-plugin
./gradlew buildPlugin
# Built plugin: build/distributions/commitcat-jetbrains-*.zip
```

---

## How to Contribute

### Bug Reports

Open an [issue](https://github.com/eunseo9311/commit-cat/issues) with:
- OS and version (macOS 15.x, Windows 11, Ubuntu 24.04, etc.)
- CommitCat version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

### Feature Suggestions

Open an issue with the `enhancement` label. Describe:
- What problem it solves
- How you'd like it to work
- Any alternatives you considered

### Code Contributions

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature
   ```
3. **Make your changes** — see the [Pull Request Guidelines](#pull-request-guidelines)
4. **Test locally** — run `cargo check` and verify the app works
5. **Push** and open a Pull Request

### Design & Assets

We welcome pixel art contributions! If you'd like to create:
- New cat skins or color variants
- Item sprites (hats, accessories, etc.)
- Animations

Please open an issue first to discuss the design direction before creating assets.

### Translations

CommitCat's UI currently supports Korean and English. If you'd like to add a language, open an issue to coordinate.

---

## Pull Request Guidelines

### Before Submitting

- [ ] `cargo check -p commit-cat-core` passes
- [ ] `cargo check -p commit-cat` passes
- [ ] App runs correctly with `npm run tauri dev`
- [ ] No unrelated changes included

### PR Title Format

Use a clear, descriptive title:
```
feat: add item equip system
fix: cat not hiding on fullscreen (macOS)
refactor: extract git polling into core crate
docs: add Linux troubleshooting guide
chore: update dependencies
```

### PR Description

- Explain **what** you changed and **why**
- Link related issues (e.g., `Closes #42`)
- Include screenshots for UI changes

### Review Process

- PRs are reviewed by maintainers
- Small, focused PRs are preferred over large ones
- If your PR is a work in progress, mark it as **Draft**

---

## Commit Convention

We follow a simple convention:

```
type: short description

# Types:
# feat     — new feature
# fix      — bug fix
# refactor — code restructuring (no behavior change)
# docs     — documentation
# chore    — maintenance (deps, config, CI)
# style    — formatting, CSS
# test     — adding or updating tests
```

Write commit messages that explain **why**, not just **what**.

```
# Good
feat: add streak milestone notifications at 3/7/30 days

# Not ideal
update code
```

---

## Good First Issues

Look for issues labeled [`good first issue`](https://github.com/eunseo9311/commit-cat/labels/good%20first%20issue). These are specifically curated for newcomers.

Some areas that are always open for contribution:
- **Linux improvements** — fullscreen detection, better IDE process detection
- **New IDE support** — add detection for editors not yet supported
- **Documentation** — fix typos, add guides, improve README
- **Accessibility** — improve UI for screen readers, keyboard navigation

---

## Code of Conduct

Be kind. Be respectful. We're all here because we like coding cats.

- No harassment, discrimination, or personal attacks
- Constructive feedback only
- Assume good intentions
- Help newcomers feel welcome

---

## Questions?

- Open a [Discussion](https://github.com/eunseo9311/commit-cat/discussions) on GitHub
- Check existing [Issues](https://github.com/eunseo9311/commit-cat/issues) for similar topics

Thank you for helping make CommitCat better! 🐱
