import { spawnSync } from "child_process";
import * as path from "path";
import { KEYS } from "./cursor-state-keys";

export interface CursorAccountSnapshot {
  email: string | null;
  membershipType: string | null;
  subscriptionStatus: string | null;
  signUpType: string | null;
}

function pythonBinaries(): string[] {
  if (process.platform === "win32") {
    return ["python", "python3"];
  }
  return ["python3", "python"];
}

/**
 * Uses bundled Python + stdlib sqlite3 so we never load the whole DB into the extension host
 * (state.vscdb can be gigabytes). Requires Python 3 on PATH.
 */
export function readCursorAccountFromStateDb(
  dbPath: string,
  extensionRoot: string,
): CursorAccountSnapshot | null {
  const script = path.join(
    extensionRoot,
    "scripts",
    "read_cursor_itemtable.py",
  );
  let lastCode: number | null = null;
  for (const bin of pythonBinaries()) {
    const res = spawnSync(bin, [script, dbPath], {
      encoding: "utf-8",
      maxBuffer: 1024 * 1024,
      windowsHide: true,
    });
    lastCode = res.status ?? 1;
    if (res.error && (res.error as NodeJS.ErrnoException).code === "ENOENT") {
      continue;
    }
    if (res.status !== 0 || res.stdout === undefined || res.stdout === "") {
      return null;
    }
    try {
      const raw = JSON.parse(res.stdout.trim()) as Record<
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
  void lastCode;
  return null;
}
