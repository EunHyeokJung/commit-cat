import * as vscode from "vscode";
import * as http from "http";

const COMMITCAT_PORT = 39547;
const CODING_INTERVAL_MS = 60_000; // 60 seconds

let codingTimer: NodeJS.Timeout | undefined;
let statusBarItem: vscode.StatusBarItem;

/** POST JSON to CommitCat's local HTTP server */
function postActivity(body: Record<string, unknown>): void {
  const data = JSON.stringify(body);
  const req = http.request(
    {
      hostname: "127.0.0.1",
      port: COMMITCAT_PORT,
      path: "/activity",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
      timeout: 3000,
    },
    (res) => {
      // drain response
      res.resume();
    }
  );
  req.on("error", () => {
    // CommitCat not running — silently ignore
  });
  req.write(data);
  req.end();
}

export function activate(context: vscode.ExtensionContext): void {
  // ── Status bar ──
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = "$(heart) CommitCat";
  statusBarItem.tooltip = "CommitCat is tracking your activity";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // ── 1. Coding time: send heartbeat every 60s while editor is focused ──
  codingTimer = setInterval(() => {
    if (vscode.window.state.focused) {
      postActivity({ type: "coding_time", seconds: 60 });
    }
  }, CODING_INTERVAL_MS);

  // ── 2. File change: when active editor changes ──
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        const doc = editor.document;
        postActivity({
          type: "file_change",
          filename: doc.fileName,
          language: doc.languageId,
        });
      }
    })
  );

  // ── 3. File save ──
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(() => {
      postActivity({ type: "save" });
    })
  );

  // ── 4. Build task success/fail ──
  context.subscriptions.push(
    vscode.tasks.onDidEndTaskProcess((event) => {
      const task = event.execution.task;
      // Only track build-group tasks or tasks with "build" in their name
      const isBuild =
        task.group === vscode.TaskGroup.Build ||
        task.name.toLowerCase().includes("build");

      if (isBuild) {
        if (event.exitCode === 0) {
          postActivity({ type: "build_success" });
        } else {
          postActivity({ type: "build_fail" });
        }
      }
    })
  );

  // ── Send initial file info if an editor is already open ──
  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    postActivity({
      type: "file_change",
      filename: activeEditor.document.fileName,
      language: activeEditor.document.languageId,
    });
  }
}

export function deactivate(): void {
  if (codingTimer) {
    clearInterval(codingTimer);
    codingTimer = undefined;
  }
}
