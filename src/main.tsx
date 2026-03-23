import React from "react";
import ReactDOM from "react-dom/client";
import { getCurrentWindow } from "@tauri-apps/api/window";
import App from "./App";
import { Settings } from "./components/settings/Settings";
import { Summary } from "./components/summary/Summary";
import "./styles/global.css";

const windowLabel = getCurrentWindow().label;
const isSettings = windowLabel === "settings";
const isSummary = windowLabel === "summary";

if (isSettings) {
  document.body.classList.add("settings-window");
}
if (isSummary) {
  document.body.classList.add("summary-window");
}

function Root() {
  if (isSettings) return <Settings />;
  if (isSummary) return <Summary />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
