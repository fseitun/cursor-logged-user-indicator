import * as fs from "fs";
import * as os from "os";
import * as path from "path";

/** Path to Cursor's globalStorage/state.vscdb for the current OS (best-effort). */
export function getCursorStateVscdbPath(): string {
  const home = os.homedir();
  switch (process.platform) {
    case "darwin":
      return path.join(
        home,
        "Library",
        "Application Support",
        "Cursor",
        "User",
        "globalStorage",
        "state.vscdb",
      );
    case "win32":
      return path.join(
        process.env.APPDATA || path.join(home, "AppData", "Roaming"),
        "Cursor",
        "User",
        "globalStorage",
        "state.vscdb",
      );
    default:
      return path.join(
        home,
        ".config",
        "Cursor",
        "User",
        "globalStorage",
        "state.vscdb",
      );
  }
}

export function stateDbExists(dbPath: string): boolean {
  try {
    fs.accessSync(dbPath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}
