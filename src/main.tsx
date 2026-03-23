import React from "react";
import ReactDOM from "react-dom/client";
import { getCurrentWindow } from "@tauri-apps/api/window";
import App from "./App";
import { Settings } from "./components/settings/Settings";
import "./styles/global.css";

const windowLabel = getCurrentWindow().label;
const isSettings = windowLabel === "settings";

if (isSettings) {
  document.body.classList.add("settings-window");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isSettings ? <Settings /> : <App />}
  </React.StrictMode>
);
