# Cursor Logged User Indicator

**Cursor IDE only.** Shows the cached Cursor account email (and plan hints) in the status bar by reading `User/globalStorage/state.vscdb` in read-only mode. Does not use the network or read access/refresh tokens.

## Why this exists

Cursor subscription and team membership are tied to the Cursor account, not to VS Code’s GitHub/Microsoft sign-in. This extension surfaces `cursorAuth/cachedEmail` and related keys from local storage so you always see which account is active.

## Requirements

- **Python 3** on your `PATH` (the extension shells out to a small script that uses the stdlib `sqlite3` module so multi‑gigabyte `state.vscdb` files are never loaded into the extension host).

## Settings

| Setting                           | Purpose                                                                                  |
| --------------------------------- | ---------------------------------------------------------------------------------------- |
| `cursorLoggedUser.flaggedDomains` | Domains (after `@`) that trigger a **red** status bar (e.g. your employer).              |
| `cursorLoggedUser.allowedEmails`  | If non-empty, **red** bar when the current email is not in this list (case-insensitive). |

## Risks

Cursor may rename or move these storage keys without notice. The indicator may break or show stale data until the extension is updated.

## Related tools

[Cursor Account Switcher](https://marketplace.visualstudio.com/items?itemName=AliAldahmani.cursor-account-switcher) swaps saved local session snapshots and also shows an active-account HUD. This project is **read-only** (no account switching) and adds optional **domain / allow-list warnings** for “wrong account” mistakes.

## Development

```bash
npm install
npm run compile
```

Press F5 in Cursor with this folder open to launch an Extension Development Host.

```bash
npx @vscode/vsce package
```

Install the `.vsix` via **Extensions: Install from VSIX…**.

## Storage keys used

- `cursorAuth/cachedEmail`
- `cursorAuth/stripeMembershipType`
- `cursorAuth/stripeSubscriptionStatus`
- `cursorAuth/cachedSignUpType`
