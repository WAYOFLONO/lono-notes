# Lono Notes

A small desktop notes app for [ClubWPT Gold](https://clubwptgold.com) poker. Color-code players, take freeform notes (paste screenshots inline), find them again with fuzzy search.

Part of the [Way of Lono](https://wayoflono.xyz) brand.

## Install

Grab the latest build from [Releases](https://github.com/WAYOFLONO/lono-notes/releases/latest):

- **Windows (x64)** — Unzip, run `Lono Notes.exe`. SmartScreen will warn the app is unsigned; click **More info** → **Run anyway**.
- **macOS (Apple Silicon)** — Unzip, drag `Lono Notes.app` to Applications. Gatekeeper will refuse first launch; right-click the app and choose **Open**, then **Open** in the dialog. (Or once: `xattr -dr com.apple.quarantine /Applications/Lono\ Notes.app`.)

Your data lives in the OS user-data directory (`%APPDATA%\Lono Notes\` on Windows, `~/Library/Application Support/Lono Notes/` on macOS), separate from the installed app — safe across upgrades.

## What it does

- Player list with fuzzy search and sort modes (alpha, newest, oldest)
- 8-color player type picker — fish / whale / nit / reg / lag / maniac / watch / unknown
- Freeform notes per player with autosave; paste screenshots inline (Ctrl/⌘+V)
- Always-on-top toggle in the View menu (Ctrl/⌘+Shift+P) so the window can sit beside your poker client during play
- Sidebar collapse (Ctrl/⌘+B) for full-width notes
- Star a player to pin them to the top of the list

## Boundaries

ClubWPT Gold's Terms of Service forbid any tool that reads from or interacts with the game client — no OCR, no memory reading, no traffic parsing, no automation. Lono Notes ships none of that. It is a standalone notes window you type into; nothing reads the table.

## Develop

```sh
npm install
npm start                                          # dev mode
npm run package -- --platform=win32 --arch=x64     # Windows package
npm run package -- --platform=darwin --arch=arm64  # macOS package
```

Stack: Electron · React 18 · TypeScript · Vite · Tailwind CSS v4 · better-sqlite3 · Zustand · Fuse.js.

## License

MIT.
