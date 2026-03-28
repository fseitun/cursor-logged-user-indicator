import * as fs from "fs";
import * as vscode from "vscode";
import {
  getCursorStateVscdbPath,
  stateDbExists,
} from "./cursor-global-storage";
import { evaluateAccountPolicy } from "./policy";
import { readCursorAccountFromStateDb } from "./read-cursor-account";

const SECTION = "cursorLoggedUser";

function isCursorApp(): boolean {
  return vscode.env.appName.toLowerCase().includes("cursor");
}

function debounce(fn: () => void, ms: number): () => void {
  let t: ReturnType<typeof setTimeout> | undefined;
  return () => {
    if (t) {
      clearTimeout(t);
    }
    t = setTimeout(() => {
      t = undefined;
      fn();
    }, ms);
  };
}

function formatTooltip(
  snapshot: NonNullable<ReturnType<typeof readCursorAccountFromStateDb>>,
  dbPath: string,
  policy: ReturnType<typeof evaluateAccountPolicy>,
): string {
  const lines = [
    "Cursor account (from local state.vscdb, read-only).",
    "",
    `Database: ${dbPath}`,
  ];
  if (snapshot) {
    lines.push("", `Email: ${snapshot.email ?? "(none)"}`);
    if (snapshot.membershipType) {
      lines.push(`Plan: ${snapshot.membershipType}`);
    }
    if (snapshot.subscriptionStatus) {
      lines.push(`Subscription: ${snapshot.subscriptionStatus}`);
    }
    if (snapshot.signUpType) {
      lines.push(`Sign-up: ${snapshot.signUpType}`);
    }
  }
  if (policy.level !== "ok") {
    lines.push(
      "",
      `${policy.level === "error" ? "Alert" : "Notice"}: ${policy.reason}`,
    );
  }
  lines.push(
    "",
    "Keys: cursorAuth/cachedEmail, stripeMembershipType, stripeSubscriptionStatus, cachedSignUpType",
  );
  return lines.join("\n");
}

let extensionRoot = "";

export function activate(context: vscode.ExtensionContext): void {
  extensionRoot = context.extensionPath;
  const status = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    10000,
  );
  status.name = "Cursor Logged User";
  context.subscriptions.push(status);

  const refresh = () => updateStatusBar(status);

  if (!isCursorApp()) {
    status.text = "$(info) Not Cursor";
    status.tooltip = "Cursor Logged User Indicator only runs in Cursor IDE.";
    status.command = undefined;
    status.show();
    return;
  }

  const dbPath = getCursorStateVscdbPath();

  const debouncedRefresh = debounce(refresh, 1500);
  let watcher: fs.FSWatcher | undefined;
  try {
    watcher = fs.watch(dbPath, { persistent: false }, () => debouncedRefresh());
    context.subscriptions.push(new vscode.Disposable(() => watcher?.close()));
  } catch {
    /* missing file until Cursor creates it */
  }

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(SECTION)) {
        refresh();
      }
    }),
  );

  context.subscriptions.push(
    vscode.window.onDidChangeWindowState((s) => s.focused && refresh()),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("cursorLoggedUser.refresh", () =>
      refresh(),
    ),
  );

  refresh();
}

function updateStatusBar(status: vscode.StatusBarItem): void {
  if (!isCursorApp()) {
    return;
  }

  const config = vscode.workspace.getConfiguration(SECTION);
  const flaggedDomains: string[] = config.get("flaggedDomains") ?? [];
  const allowedEmails: string[] = config.get("allowedEmails") ?? [];

  const dbPath = getCursorStateVscdbPath();
  if (!stateDbExists(dbPath)) {
    status.text = "$(account) Cursor: no state DB";
    status.tooltip = `Expected: ${dbPath}\n(File missing — open Cursor and sign in once.)`;
    status.backgroundColor = new vscode.ThemeColor(
      "statusBarItem.warningBackground",
    );
    status.color = undefined;
    status.show();
    return;
  }

  const snapshot = readCursorAccountFromStateDb(dbPath, extensionRoot);
  if (snapshot === null) {
    status.text = "$(account) Cursor: read error";
    status.tooltip = [
      "Could not read Cursor session database.",
      "",
      `Path: ${dbPath}`,
      "",
      "Requires Python 3 on PATH (uses stdlib sqlite3).",
      `Script: ${extensionRoot}/scripts/read_cursor_itemtable.py`,
    ].join("\n");
    status.backgroundColor = new vscode.ThemeColor(
      "statusBarItem.warningBackground",
    );
    status.color = new vscode.ThemeColor("statusBarItem.warningForeground");
    status.command = "cursorLoggedUser.refresh";
    status.show();
    return;
  }

  const email = snapshot.email?.trim() || null;
  const policy = evaluateAccountPolicy(email, flaggedDomains, allowedEmails);

  const shortEmail = email ?? "not signed in";
  status.text = `$(account) ${shortEmail}`;
  status.tooltip = formatTooltip(snapshot, dbPath, policy);

  if (policy.level === "error") {
    status.backgroundColor = new vscode.ThemeColor(
      "statusBarItem.errorBackground",
    );
    status.color = new vscode.ThemeColor("statusBarItem.errorForeground");
  } else if (policy.level === "warning") {
    status.backgroundColor = new vscode.ThemeColor(
      "statusBarItem.warningBackground",
    );
    status.color = new vscode.ThemeColor("statusBarItem.warningForeground");
  } else {
    status.backgroundColor = undefined;
    status.color = undefined;
  }

  status.command = "cursorLoggedUser.refresh";
  status.show();
}

export function deactivate(): void {
  /* fs watcher disposed via subscription */
}
