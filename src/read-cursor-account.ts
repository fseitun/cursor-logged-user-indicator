import { spawn } from "child_process";
import * as path from "path";
import { KEYS } from "./cursor-state-keys";

export interface CursorAccountSnapshot {
  email: string | null;
  membershipType: string | null;
  subscriptionStatus: string | null;
  signUpType: string | null;
}

const MAX_BUFFER = 1024 * 1024;

function pythonBinaries(): string[] {
  if (process.platform === "win32") {
    return ["python", "python3"];
  }
  return ["python3", "python"];
}

type RunOutcome =
  | { kind: "ENOENT" }
  | { kind: "done"; code: number | null; stdout: string };

function runPythonRead(
  bin: string,
  script: string,
  dbPath: string,
): Promise<RunOutcome> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, [script, dbPath], { windowsHide: true });
    let stdout = "";
    let settled = false;

    const finish = (outcome: RunOutcome): void => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(outcome);
    };

    child.stdout?.setEncoding("utf8");
    child.stdout?.on("data", (chunk: string) => {
      stdout += chunk;
      if (stdout.length > MAX_BUFFER) {
        child.kill("SIGTERM");
      }
    });

    child.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ENOENT") {
        finish({ kind: "ENOENT" });
      } else if (!settled) {
        settled = true;
        reject(err);
      }
    });

    child.on("close", (code) => {
      if (settled) {
        return;
      }
      let out = stdout;
      let exitCode = code;
      if (out.length > MAX_BUFFER) {
        out = "";
        exitCode = -1;
      }
      finish({ kind: "done", code: exitCode, stdout: out });
    });
  });
}

/**
 * Uses bundled Python + stdlib sqlite3 so we never load the whole DB into the extension host
 * (state.vscdb can be gigabytes). Requires Python 3 on PATH.
 */
export async function readCursorAccountFromStateDb(
  dbPath: string,
  extensionRoot: string,
): Promise<CursorAccountSnapshot | null> {
  const script = path.join(
    extensionRoot,
    "scripts",
    "read_cursor_itemtable.py",
  );
  for (const bin of pythonBinaries()) {
    let outcome: RunOutcome;
    try {
      outcome = await runPythonRead(bin, script, dbPath);
    } catch {
      return null;
    }
    if (outcome.kind === "ENOENT") {
      continue;
    }
    const { code, stdout } = outcome;
    if (code !== 0 || stdout === "") {
      return null;
    }
    try {
      const raw = JSON.parse(stdout.trim()) as Record<
        string,
        string | null | undefined
      >;
      return {
        email: raw[KEYS.cachedEmail] ?? null,
        membershipType: raw[KEYS.stripeMembershipType] ?? null,
        subscriptionStatus: raw[KEYS.stripeSubscriptionStatus] ?? null,
        signUpType: raw[KEYS.cachedSignUpType] ?? null,
      };
    } catch {
      return null;
    }
  }
  return null;
}
