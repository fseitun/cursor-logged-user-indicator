#!/usr/bin/env node
/**
 * Publishes to Open VSX using a token from a dotenv file (default: .env in repo root).
 *
 * Env file path: set OVSX_DOTENV to a relative path from repo root or an absolute path.
 * Token: OVSX_PAT (preferred, matches ovsx) or OPENVSX_TOKEN (alias).
 */
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const envArg = process.env.OVSX_DOTENV;
const envFile = envArg
  ? path.isAbsolute(envArg)
    ? envArg
    : path.join(root, envArg)
  : path.join(root, ".env");

require("dotenv").config({ path: envFile });

const pat = process.env.OVSX_PAT || process.env.OPENVSX_TOKEN;
if (!pat) {
  console.error(
    `Missing OVSX_PAT or OPENVSX_TOKEN in ${envFile} (set OVSX_DOTENV to use another file).`,
  );
  process.exit(1);
}

process.env.OVSX_PAT = pat;

const result = spawnSync("npx", ["ovsx", "publish"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

process.exit(result.status === null ? 1 : result.status);
