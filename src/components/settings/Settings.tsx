import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import "./Settings.css";

interface XpStatus {
  level: number;
  currentExp: number;
  expToNext: number;
}

type CatColor = "white" | "brown" | "orange";

export function Settings() {
  const [repos, setRepos] = useState<string[]>([]);
  const [catColor, setCatColor] = useState<CatColor>("brown");
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [cloneUrl, setCloneUrl] = useState("");
  const [clonePath, setClonePath] = useState("");
  const [cloning, setCloning] = useState(false);
  const [cloneError, setCloneError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [xp, setXp] = useState<XpStatus>({ level: 1, currentExp: 0, expToNext: 100 });
  const [githubToken, setGithubToken] = useState("");
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [githubConnecting, setGithubConnecting] = useState(false);
  const [githubError, setGithubError] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [subCatsEnabled, setSubCatsEnabled] = useState(true);
  const [aiKey, setAiKey] = useState("");
  const [aiKeySaved, setAiKeySaved] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);
  const [openaiKey, setOpenaiKey] = useState("");
  const [openaiKeySaved, setOpenaiKeySaved] = useState(false);
  const [aiProvider, setAiProvider] = useState<"claude" | "openai">("claude");

  // 초기 데이터 로드
  useEffect(() => {
    (async () => {
      try {
        const [repoList, settings, xpStatus] = await Promise.all([
          invoke<string[]>("get_watched_repos"),
          invoke<{ catColor?: CatColor; pomodoroMinutes?: number; breakMinutes?: number; githubUsername?: string | null; notificationsEnabled?: boolean; anthropicApiKey?: string | null; openaiApiKey?: string | null; aiProvider?: string; subCatsEnabled?: boolean }>("get_settings"),
          invoke<XpStatus>("get_xp_status"),
        ]);
        setRepos(repoList);
        if (settings.catColor) setCatColor(settings.catColor);
        if (settings.pomodoroMinutes) setFocusMinutes(settings.pomodoroMinutes);
        if (settings.breakMinutes) setBreakMinutes(settings.breakMinutes);
        if (settings.githubUsername) setGithubUsername(settings.githubUsername);
        if (settings.notificationsEnabled !== undefined) setNotificationsEnabled(settings.notificationsEnabled);
        if (settings.subCatsEnabled !== undefined) setSubCatsEnabled(settings.subCatsEnabled);
        if (settings.anthropicApiKey) setAiKeySaved(true);
        if (settings.openaiApiKey) setOpenaiKeySaved(true);
        if (settings.aiProvider) setAiProvider(settings.aiProvider as "claude" | "openai");
        setXp(xpStatus);
      } catch (e) {
        console.error("Failed to load settings:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  // 기존 폴더 선택으로 Repo 추가
  const handleAddExisting = useCallback(async () => {
    setDropdownOpen(false);
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Git Repository",
      });
      if (!selected) return;

      const path = selected as string;
      await invoke("register_repo", { path });
      const updated = await invoke<string[]>("get_watched_repos");
      setRepos(updated);
    } catch (e) {
      console.error("Failed to add repo:", e);
    }
  }, []);

  // Clone 모달 열기
  const handleOpenCloneModal = useCallback(() => {
    setDropdownOpen(false);
    setCloneUrl("");
    setClonePath("");
    setCloneError("");
    setCloneModalOpen(true);
  }, []);

  // Clone 경로 선택
  const handleChooseClonePath = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Clone Destination",
      });
      if (selected) {
        setClonePath(selected as string);
      }
    } catch (e) {
      console.error("Failed to choose path:", e);
    }
  }, []);

  // Clone 실행
  const handleClone = useCallback(async () => {
    if (!cloneUrl.trim() || !clonePath.trim()) return;

    // URL에서 repo 이름 추출하여 하위 폴더로 사용
    const repoName = cloneUrl.trim().replace(/\.git$/, "").split("/").pop() || "repo";
    const fullPath = `${clonePath.replace(/\/$/, "")}/${repoName}`;

    setCloning(true);
    setCloneError("");
    try {
      await invoke("clone_repo", { url: cloneUrl.trim(), path: fullPath });
      const updated = await invoke<string[]>("get_watched_repos");
      setRepos(updated);
      setCloneModalOpen(false);
    } catch (e) {
      setCloneError(String(e));
    } finally {
      setCloning(false);
    }
  }, [cloneUrl, clonePath]);

  // Repo 삭제
  const handleRemoveRepo = useCallback(async (path: string) => {
    try {
      await invoke("remove_repo", { path });
      setRepos(prev => prev.filter(r => r !== path));
    } catch (e) {
      console.error("Failed to remove repo:", e);
    }
  }, []);

  // Timer 설정 변경
  const handleFocusChange = useCallback(async (val: number) => {
    const clamped = Math.max(1, Math.min(120, val));
    setFocusMinutes(clamped);
    try {
      const current = await invoke<Record<string, unknown>>("get_settings");
      await invoke("update_settings", { settings: { ...current, pomodoroMinutes: clamped } });
    } catch (e) {
      console.error("Failed to update focus minutes:", e);
    }
  }, []);

  const handleBreakChange = useCallback(async (val: number) => {
    const clamped = Math.max(1, Math.min(60, val));
    setBreakMinutes(clamped);
    try {
      const current = await invoke<Record<string, unknown>>("get_settings");
      await invoke("update_settings", { settings: { ...current, breakMinutes: clamped } });
    } catch (e) {
      console.error("Failed to update break minutes:", e);
    }
  }, []);

  // GitHub 연결
  const handleGithubConnect = useCallback(async () => {
    if (!githubToken.trim()) return;
    setGithubConnecting(true);
    setGithubError("");
    try {
      const username = await invoke<string>("verify_github_token", { token: githubToken.trim() });
      setGithubUsername(username);
      setGithubToken("");
    } catch (e) {
      setGithubError(String(e));
    } finally {
      setGithubConnecting(false);
    }
  }, [githubToken]);

  // GitHub 연결 해제
  const handleGithubDisconnect = useCallback(async () => {
    try {
      await invoke("disconnect_github");
      setGithubUsername(null);
    } catch (e) {
      console.error("Failed to disconnect GitHub:", e);
    }
  }, []);

  // 알림 토글
  const handleNotificationsToggle = useCallback(async () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    try {
      const current = await invoke<Record<string, unknown>>("get_settings");
      await invoke("update_settings", { settings: { ...current, notificationsEnabled: next } });
    } catch (e) {
      console.error("Failed to update notifications:", e);
    }
  }, [notificationsEnabled]);

  // 서브 고양이 토글
  const handleSubCatsToggle = useCallback(async () => {
    const next = !subCatsEnabled;
    setSubCatsEnabled(next);
    try {
      const current = await invoke<Record<string, unknown>>("get_settings");
      await invoke("update_settings", { settings: { ...current, subCatsEnabled: next } });
      await emit("sub-cats-toggle", next);
    } catch (e) {
      console.error("Failed to update sub cats:", e);
    }
  }, [subCatsEnabled]);

  // AI API Key 저장
  const handleAiSave = useCallback(async () => {
    if (!aiKey.trim()) return;
    setAiSaving(true);
    try {
      const current = await invoke<Record<string, unknown>>("get_settings");
      await invoke("update_settings", { settings: { ...current, anthropicApiKey: aiKey.trim() } });
      setAiKeySaved(true);
      setAiKey("");
    } catch (e) {
      console.error("Failed to save AI key:", e);
    } finally {
      setAiSaving(false);
    }
  }, [aiKey]);

  // AI API Key 삭제
  const handleAiRemove = useCallback(async () => {
    try {
      const current = await invoke<Record<string, unknown>>("get_settings");
      await invoke("update_settings", { settings: { ...current, anthropicApiKey: null } });
      setAiKeySaved(false);
    } catch (e) {
      console.error("Failed to remove AI key:", e);
    }
  }, []);

  // OpenAI API Key 저장
  const handleOpenaiSave = useCallback(async () => {
    if (!openaiKey.trim()) return;
    try {
      const current = await invoke<Record<string, unknown>>("get_settings");
      await invoke("update_settings", { settings: { ...current, openaiApiKey: openaiKey.trim() } });
      setOpenaiKeySaved(true);
      setOpenaiKey("");
    } catch (e) {
      console.error("Failed to save OpenAI key:", e);
    }
  }, [openaiKey]);

  // OpenAI API Key 삭제
  const handleOpenaiRemove = useCallback(async () => {
    try {
      const current = await invoke<Record<string, unknown>>("get_settings");
      await invoke("update_settings", { settings: { ...current, openaiApiKey: null } });
      setOpenaiKeySaved(false);
    } catch (e) {
      console.error("Failed to remove OpenAI key:", e);
    }
  }, []);

  // AI Provider 변경
  const handleProviderChange = useCallback(async (provider: "claude" | "openai") => {
    setAiProvider(provider);
    try {
      const current = await invoke<Record<string, unknown>>("get_settings");
      await invoke("update_settings", { settings: { ...current, aiProvider: provider } });
    } catch (e) {
      console.error("Failed to update AI provider:", e);
    }
  }, []);

  // 색상 변경
  const handleColorChange = useCallback(async (color: CatColor) => {
    setCatColor(color);
    try {
      await emit("change-cat-color", color);
    } catch (e) {
      console.error("Failed to change color:", e);
    }
  }, []);

  // 경로 축약 (홈 디렉토리 → ~)
  const shortenPath = (path: string) => {
    const home = path.match(/^\/Users\/[^/]+/)?.[0];
    if (home) return path.replace(home, "~");
    return path;
  };

  if (loading) {
    return <div className="settings"><div className="settings__loading">Loading...</div></div>;
  }

  return (
    <div className="settings">
      <h1 className="settings__title">CommitCat Settings</h1>

      {/* Watched Repositories */}
      <section className="settings__section">
        <h2 className="settings__section-title">Watched Repositories</h2>
        <div className="settings__repo-list">
          {repos.length === 0 ? (
            <div className="settings__repo-empty">
              No repositories registered. Add one to track commits.
            </div>
          ) : (
            repos.map(repo => (
              <div key={repo} className="settings__repo-item">
                <span className="settings__repo-path" title={repo}>
                  {shortenPath(repo)}
                </span>
                <button
                  className="settings__repo-remove"
                  onClick={() => handleRemoveRepo(repo)}
                  title="Remove repository"
                >
                  &times;
                </button>
              </div>
            ))
          )}
        </div>
        <div className="settings__repo-add-wrap" ref={dropdownRef}>
          <button
            className="settings__repo-add"
            onClick={() => setDropdownOpen(prev => !prev)}
          >
            + Add Repository
          </button>
          {dropdownOpen && (
            <div className="settings__dropdown">
              <button className="settings__dropdown-item" onClick={handleOpenCloneModal}>
                Clone Repository...
              </button>
              <button className="settings__dropdown-item" onClick={handleAddExisting}>
                Add Existing Repository...
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Level */}
      <section className="settings__section">
        <h2 className="settings__section-title">Level</h2>
        <div className="settings__level-row">
          <span className="settings__level-label">Lv.{xp.level}</span>
          <div className="settings__xp-bar">
            <div
              className="settings__xp-fill"
              style={{ width: `${xp.expToNext > 0 ? (xp.currentExp / xp.expToNext) * 100 : 0}%` }}
            />
          </div>
          <span className="settings__xp-text">{xp.currentExp} / {xp.expToNext}</span>
        </div>
      </section>

      {/* Cat Settings */}
      <section className="settings__section">
        <h2 className="settings__section-title">Cat</h2>
        <div className="settings__color-row">
          <span className="settings__color-label">Color</span>
          <div className="settings__color-options">
            {(["brown", "orange", "white"] as CatColor[]).map(color => (
              <button
                key={color}
                className={`settings__color-btn settings__color-btn--${color} ${catColor === color ? "settings__color-btn--active" : ""}`}
                onClick={() => handleColorChange(color)}
                title={color}
              />
            ))}
          </div>
        </div>
        <div className="settings__toggle-row">
          <span className="settings__toggle-label">Sub Cats</span>
          <button
            className={`settings__toggle ${subCatsEnabled ? "settings__toggle--on" : ""}`}
            onClick={handleSubCatsToggle}
          >
            <span className="settings__toggle-knob" />
          </button>
        </div>
      </section>

      {/* Timer */}
      <section className="settings__section">
        <h2 className="settings__section-title">Timer</h2>
        <div className="settings__timer-row">
          <label className="settings__timer-label">Focus Duration</label>
          <div className="settings__stepper">
            <button className="settings__stepper-btn" onClick={() => handleFocusChange(focusMinutes - 5)}>-</button>
            <span className="settings__stepper-value">{focusMinutes} min</span>
            <button className="settings__stepper-btn" onClick={() => handleFocusChange(focusMinutes + 5)}>+</button>
          </div>
        </div>
        <div className="settings__timer-row">
          <label className="settings__timer-label">Break Duration</label>
          <div className="settings__stepper">
            <button className="settings__stepper-btn" onClick={() => handleBreakChange(breakMinutes - 1)}>-</button>
            <span className="settings__stepper-value">{breakMinutes} min</span>
            <button className="settings__stepper-btn" onClick={() => handleBreakChange(breakMinutes + 1)}>+</button>
          </div>
        </div>
      </section>

      {/* AI */}
      <section className="settings__section">
        <h2 className="settings__section-title">AI</h2>

        {/* AI Provider 선택 */}
        <div className="settings__provider-row">
          <button
            className={`settings__provider-btn ${aiProvider === "claude" ? "settings__provider-btn--active-claude" : ""}`}
            onClick={() => handleProviderChange("claude")}
          >
            Claude
          </button>
          <button
            className={`settings__provider-btn ${aiProvider === "openai" ? "settings__provider-btn--active-openai" : ""}`}
            onClick={() => handleProviderChange("openai")}
          >
            OpenAI
          </button>
        </div>

        {/* Claude API Key */}
        <div className="settings__ai-key-section">
          <div className="settings__ai-key-label">Anthropic API Key</div>
          {aiKeySaved ? (
            <div className="settings__github-status">
              <span>Connected</span>
              <button
                className="settings__github-btn settings__github-btn--disconnect"
                onClick={handleAiRemove}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="settings__github-row">
              <input
                className="settings__github-input"
                type="password"
                placeholder="sk-ant-..."
                value={aiKey}
                onChange={e => setAiKey(e.target.value)}
                disabled={aiSaving}
                onKeyDown={e => e.key === "Enter" && handleAiSave()}
              />
              <button
                className="settings__github-btn settings__github-btn--connect"
                onClick={handleAiSave}
                disabled={aiSaving || !aiKey.trim()}
              >
                {aiSaving ? "..." : "Save"}
              </button>
            </div>
          )}
        </div>

        {/* OpenAI API Key */}
        <div className="settings__ai-key-section">
          <div className="settings__ai-key-label">OpenAI API Key</div>
          {openaiKeySaved ? (
            <div className="settings__github-status">
              <span>Connected</span>
              <button
                className="settings__github-btn settings__github-btn--disconnect"
                onClick={handleOpenaiRemove}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="settings__github-row">
              <input
                className="settings__github-input"
                type="password"
                placeholder="sk-..."
                value={openaiKey}
                onChange={e => setOpenaiKey(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleOpenaiSave()}
              />
              <button
                className="settings__github-btn settings__github-btn--connect"
                onClick={handleOpenaiSave}
                disabled={!openaiKey.trim()}
              >
                Save
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Notifications */}
      <section className="settings__section">
        <h2 className="settings__section-title">Notifications</h2>
        <div className="settings__toggle-row">
          <span className="settings__toggle-label">System Notifications</span>
          <button
            className={`settings__toggle ${notificationsEnabled ? "settings__toggle--on" : ""}`}
            onClick={handleNotificationsToggle}
          >
            <span className="settings__toggle-knob" />
          </button>
        </div>
      </section>

      {/* GitHub */}
      <section className="settings__section">
        <h2 className="settings__section-title">GitHub</h2>
        {githubUsername ? (
          <div className="settings__github-status">
            <span>Connected as <strong>@{githubUsername}</strong></span>
            <button
              className="settings__github-btn settings__github-btn--disconnect"
              onClick={handleGithubDisconnect}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <>
            <div className="settings__github-row">
              <input
                className="settings__github-input"
                type="password"
                placeholder="GitHub Personal Access Token"
                value={githubToken}
                onChange={e => setGithubToken(e.target.value)}
                disabled={githubConnecting}
                onKeyDown={e => e.key === "Enter" && handleGithubConnect()}
              />
              <button
                className="settings__github-btn settings__github-btn--connect"
                onClick={handleGithubConnect}
                disabled={githubConnecting || !githubToken.trim()}
              >
                {githubConnecting ? "..." : "Connect"}
              </button>
            </div>
            {githubError && (
              <div className="settings__github-error">{githubError}</div>
            )}
          </>
        )}
      </section>

      {/* Clone Modal */}
      {cloneModalOpen && (
        <div className="settings__modal-overlay" onClick={() => !cloning && setCloneModalOpen(false)}>
          <div className="settings__modal" onClick={e => e.stopPropagation()}>
            <h3 className="settings__modal-title">Clone Repository</h3>

            <label className="settings__modal-label">Repository URL</label>
            <input
              className="settings__modal-input"
              type="text"
              placeholder="https://github.com/user/repo.git"
              value={cloneUrl}
              onChange={e => setCloneUrl(e.target.value)}
              disabled={cloning}
            />

            <label className="settings__modal-label">Local Path</label>
            <div className="settings__modal-path-row">
              <input
                className="settings__modal-input"
                type="text"
                placeholder="/Users/.../projects"
                value={clonePath}
                onChange={e => setClonePath(e.target.value)}
                disabled={cloning}
              />
              <button
                className="settings__modal-choose"
                onClick={handleChooseClonePath}
                disabled={cloning}
              >
                Choose
              </button>
            </div>

            {cloneError && (
              <div className="settings__modal-error">{cloneError}</div>
            )}

            <div className="settings__modal-actions">
              <button
                className="settings__modal-btn settings__modal-btn--cancel"
                onClick={() => setCloneModalOpen(false)}
                disabled={cloning}
              >
                Cancel
              </button>
              <button
                className="settings__modal-btn settings__modal-btn--primary"
                onClick={handleClone}
                disabled={cloning || !cloneUrl.trim() || !clonePath.trim()}
              >
                {cloning ? "Cloning..." : "Clone"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
