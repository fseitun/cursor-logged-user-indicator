# Contributing

This extension targets **Cursor** only (`vscode.env.appName` includes “Cursor”). Changes should keep that contract; pull requests that assume stock VS Code as the primary host may not fit the project’s scope.

## Setup

```bash
git clone https://github.com/fseitun/cursor-logged-user-indicator.git
cd cursor-logged-user-indicator
npm install
```

## Checks

```bash
npm run compile
npm test
```

## Try it in the editor

Open this repo in Cursor, then **Run and Debug** → **Run Extension** (or F5). The default pre-launch task runs `npm: watch` so TypeScript rebuilds as you edit. See [README.md](README.md) for full development and publishing notes.

## Pull requests

Keep changes focused. Match existing style and avoid unrelated refactors in the same PR.
