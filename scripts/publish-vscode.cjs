#!/usr/bin/env node
/**
 * Publishes to the Visual Studio Marketplace using vsce.
 * Token: VSCE_PAT (see https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
 *
 * Env file path: set VSCODE_DOTENV to a relative path from repo root or an absolute path.
 * Default: .env in repo root (same pattern as publish-openvsx.cjs).
 */
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const envArg = process.env.VSCODE_DOTENV;
const envFile = envArg
  ? path.isAbsolute(envArg)
    ? envArg
    : path.join(root, envArg)
  : path.join(root, ".env");

require("dotenv").config({ path: envFile });

const pat = process.env.VSCE_PAT;
if (!pat) {
  console.error(
    `Missing VSCE_PAT in ${envFile} (set VSCODE_DOTENV to use another file).`,
  );
  process.exit(1);
}

process.env.VSCE_PAT = pat;

const result = spawnSync(
  "npx",
  ["@vscode/vsce", "publish", "--no-dependencies"],
  {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  },
);

process.exit(result.status === null ? 1 : result.status);
