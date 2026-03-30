import * as path from "path";

export type ExpectedByFolderEntry = { allowedEmails?: string[] };

/** Trim strings and drop blanks (merged config or file entries). */
export function normalizeAllowedEmailsList(
  raw: string[] | undefined,
): string[] {
  if (!raw || !Array.isArray(raw)) {
    return [];
  }
  return raw.map((e) => String(e).trim()).filter(Boolean);
}

function normalizeFsPath(fsPath: string): string {
  const n = path.normalize(fsPath);
  if (n.length > 1 && n.endsWith(path.sep)) {
    return n.slice(0, -1);
  }
  return n;
}

/**
 * Among `keys`, return the one that is a path prefix of `workspacePath` with longest length.
 * Uses case-insensitive comparison on Windows.
 */
export function longestPrefixFolderKey(
  workspacePath: string,
  keys: string[],
): string | null {
  if (keys.length === 0) {
    return null;
  }
  const ws = normalizeFsPath(workspacePath);
  const isWin = process.platform === "win32";
  const wsCmp = isWin ? ws.toLowerCase() : ws;
  const sep = path.sep;

  let best: string | null = null;
  let bestLen = -1;

  for (const key of keys) {
    const k = normalizeFsPath(key);
    const kCmp = isWin ? k.toLowerCase() : k;
    if (wsCmp === kCmp || wsCmp.startsWith(kCmp + sep)) {
      if (k.length > bestLen) {
        best = key;
        bestLen = k.length;
      }
    }
  }
  return best;
}

export type ResolveAllowedEmailsResult = {
  allowedEmails: string[];
  sourceHint: "settings" | "expectedByFolder" | "none";
  matchedFolderKey?: string;
};

/**
 * 1. Non-empty merged `allowedEmails` from configuration wins.
 * 2. Else use `expectedByFolder` entry for longest path-prefix match on workspace root.
 */
export function resolveAllowedEmails(
  mergedAllowedEmails: string[] | undefined,
  expectedByFolder: Record<string, ExpectedByFolderEntry> | undefined,
  workspaceFolderPath: string | undefined,
): ResolveAllowedEmailsResult {
  const mergedNorm = normalizeAllowedEmailsList(mergedAllowedEmails);
  if (mergedNorm.length > 0) {
    return {
      allowedEmails: mergedNorm,
      sourceHint: "settings",
    };
  }

  if (
    !workspaceFolderPath ||
    !expectedByFolder ||
    typeof expectedByFolder !== "object"
  ) {
    return { allowedEmails: [], sourceHint: "none" };
  }

  const keys = Object.keys(expectedByFolder);
  const matchKey = longestPrefixFolderKey(workspaceFolderPath, keys);
  if (!matchKey) {
    return { allowedEmails: [], sourceHint: "none" };
  }

  const entry = expectedByFolder[matchKey];
  const emails = normalizeAllowedEmailsList(entry?.allowedEmails);
  return {
    allowedEmails: emails,
    sourceHint: "expectedByFolder",
    matchedFolderKey: matchKey,
  };
}
