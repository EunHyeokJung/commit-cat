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
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [cloneUrl, setCloneUrl] = useState("");
  const [clonePath, setClonePath] = useState("");
  const [cloning, setCloning] = useState(false);
  const [cloneError, setCloneError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [xp, setXp] = useState<XpStatus>({ level: 1, currentExp: 0, expToNext: 100 });

  // 초기 데이터 로드
  useEffect(() => {
    (async () => {
      try {
        const [repoList, settings, xpStatus] = await Promise.all([
          invoke<string[]>("get_watched_repos"),
          invoke<{ catColor?: CatColor }>("get_settings"),
          invoke<XpStatus>("get_xp_status"),
        ]);
        setRepos(repoList);
        if (settings.catColor) setCatColor(settings.catColor);
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
