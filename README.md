# Cursor Logged User Indicator

**Cursor IDE only.** Shows the cached Cursor account email (and plan hints) in the status bar by reading `User/globalStorage/state.vscdb` in read-only mode. Does not use the network or read access/refresh tokens.

## Privacy

All data stays on your machine. The extension **does not send** account email, plan metadata, or database paths over the network. It only reads a few keys from your local Cursor `state.vscdb` (via a short-lived Python process) and displays them in the editor UI. Anyone who can see your screen can also see the status bar and tooltips—avoid sharing your desktop if that is a concern.

## Why this exists

Cursor subscription and team membership are tied to the Cursor account, not to VS Code’s GitHub/Microsoft sign-in. This extension surfaces `cursorAuth/cachedEmail` and related keys from local storage so you always see which account is active.

## Requirements

- **Python 3** on your `PATH` (the extension shells out to a small script that uses the stdlib `sqlite3` module so multi‑gigabyte `state.vscdb` files are never loaded into the extension host).

## Settings

| Setting                                     | Purpose                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cursorLoggedUser.allowedEmails`            | If **non-empty** (after trimming entries), the status bar uses **error** styling when the current email is not in the list (case-insensitive). Values are merged from **User** and **Workspace** the usual VS Code way (e.g. `.vscode/settings.json`).                                                                |
| `cursorLoggedUser.expectedByFolder`         | Map of **absolute** folder paths → `{ "allowedEmails": string[] }`. Used only when merged `allowedEmails` is **empty**. The **longest** path prefix that matches the **first** workspace folder wins. Lets you keep one User `settings.json` with different expected accounts for `~/code/work` vs `~/code/personal`. |
| `cursorLoggedUser.highlightMatchingAccount` | If `true`, when the email satisfies the allow list the status bar uses **OK** colors (`cursorLoggedUser.statusBarOkBackground` / `statusBarOkForeground`). Default `false`.                                                                                                                                           |

**Precedence:** merged `allowedEmails` first; if that list is empty, `expectedByFolder` is used for the open folder’s path. If there is no allow list, any signed-in email is treated as OK (no red bar for “wrong account”).

**Multi-root workspaces:** only the **first** root folder is used for `expectedByFolder` matching.

**Theming:** Override OK colors in `settings.json` via `workbench.colorCustomizations`, for example `"cursorLoggedUser.statusBarOkBackground": "#2e7d32"`.

### Breaking change (v0.5.0)

`cursorLoggedUser.flaggedDomains` was **removed**. Use explicit addresses in `allowedEmails` / `expectedByFolder` instead.

## Status bar colors

- **Error (red):** email present but not in the allow list.
- **Warning (yellow):** no cached email (signed out or storage empty), missing state DB, or read error.
- **OK (green):** email matches the allow list and `highlightMatchingAccount` is `true`.
- **Default:** email matches and highlight is off, or no allow list is configured.

## Risks

Cursor may rename or move these storage keys without notice. The indicator may break or show stale data until the extension is updated.

## Related tools

[Cursor Account Switcher](https://marketplace.visualstudio.com/items?itemName=AliAldahmani.cursor-account-switcher) swaps saved local session snapshots and also shows an active-account HUD. This project is **read-only** (no account switching) and adds optional **allow-list** hints so you notice the wrong Cursor account.

## Development

### Setup (once)

```bash
cd /path/to/logged-user
npm install
```

Optional for publishing later: copy [`.env.example`](.env.example) to `.env` (gitignored) and fill in tokens when you need them.

### 1. Test locally

**Unit tests** (runs compiled output under `dist/`):

```bash
npm run compile
npm test
```

**Run the extension inside Cursor** (real UI against your real `state.vscdb`):

1. Open this repo as the workspace folder in Cursor.
2. **Run and Debug** (sidebar) → choose **Run Extension**, or press **F5**.
3. A new **Extension Development Host** window opens with this extension loaded; check the status bar and tooltips there.

The default pre-launch task is **`npm: watch`**, which keeps TypeScript rebuilding as you edit. If you prefer a one-off build, run **`npm run compile`** before F5, or run the **npm: compile** task from **Terminal → Run Task…**.

### 2. Build

**Compile only** (TypeScript → `dist/`):

```bash
npm run compile
```

**Produce a `.vsix` package** (runs `vscode:prepublish`, which compiles first):

```bash
npm run package
```

That writes `cursor-logged-user-indicator-<version>.vsix` in the repo root. Install it in Cursor with **Extensions: Install from VSIX…** and pick that file.

### 3. Publish to the Visual Studio Marketplace

Prerequisites:

1. You have a [publisher](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#create-a-publisher) (this extension uses publisher `fseitun` in [`package.json`](package.json)).
2. You created a **Personal Access Token** with the **Marketplace (Manage)** scope ([docs](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#create-a-publisher)).
3. Bump **`version`** in `package.json` when you are shipping a new release (Marketplace rejects duplicate versions).

Steps:

```bash
# In .env at repo root (or file pointed to by VSCODE_DOTENV):
# VSCE_PAT=your_token_here

npm run publish:vscode
```

This runs `vsce publish` with `VSCE_PAT` loaded via [`scripts/publish-vscode.cjs`](scripts/publish-vscode.cjs).

### 4. Open the listing and install from the marketplace

**On the web:** extension page — [marketplace.visualstudio.com/items?itemName=fseitun.cursor-logged-user-indicator](https://marketplace.visualstudio.com/items?itemName=fseitun.cursor-logged-user-indicator) (may take a minute to update after publish).

**In Cursor / VS Code:** **Extensions** view → search **Cursor Logged User Indicator** (or the publisher name). Cursor’s marketplace may lag slightly behind the Visual Studio Marketplace page.

### Publish to Open VSX

Put `OVSX_PAT` or `OPENVSX_TOKEN` in `.env`, then `npm run publish:openvsx` (see [`scripts/publish-openvsx.cjs`](scripts/publish-openvsx.cjs)).

## Optional: use Open VSX as the extension marketplace (whole IDE)

Cursor normally uses Cursor’s own marketplace (`marketplace.cursorapi.com`). To match the Open VSX [VS Code gallery config](https://github.com/eclipse-openvsx/openvsx/wiki/Using-Open-VSX-in-VS-Code), this repo includes a small patcher:

```bash
# Linux (typical path). Requires write access — use sudo if the file is root-owned.
sudo npm run ide:openvsx-gallery
# or: sudo node scripts/apply-openvsx-gallery.cjs
```

It backs up `product.json` next to the original (`product.json.bak.<timestamp>`), then sets `extensionsGallery` to the Open VSX URLs from that wiki.

**Caveats:** Package updates (RPM/DEB/AppImage) usually **overwrite** `/usr/share/cursor/.../product.json` — re-run the script after upgrading Cursor. `linkProtectionTrustedDomains` already includes `https://open-vsx.org` in current Cursor builds, so no change there is required for the wiki’s “trusted domain” note.

## Storage keys used

- `cursorAuth/cachedEmail`
- `cursorAuth/stripeMembershipType`
- `cursorAuth/stripeSubscriptionStatus`
- `cursorAuth/cachedSignUpType`
