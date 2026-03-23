import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import "./Settings.css";

type CatColor = "white" | "brown" | "orange";

export function Settings() {
  const [repos, setRepos] = useState<string[]>([]);
  const [catColor, setCatColor] = useState<CatColor>("brown");
  const [loading, setLoading] = useState(true);

  // 초기 데이터 로드
  useEffect(() => {
    (async () => {
      try {
        const [repoList, settings] = await Promise.all([
          invoke<string[]>("get_watched_repos"),
          invoke<{ catColor?: CatColor }>("get_settings"),
        ]);
        setRepos(repoList);
        if (settings.catColor) setCatColor(settings.catColor);
      } catch (e) {
        console.error("Failed to load settings:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Repo 추가
  const handleAddRepo = useCallback(async () => {
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
        <button className="settings__repo-add" onClick={handleAddRepo}>
          + Add Repository
        </button>
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
    </div>
  );
}
