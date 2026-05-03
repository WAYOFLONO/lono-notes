# Lono Notes — Project Brief

> Hand this entire document to Claude Code at project initialization. It contains everything needed to scope, architect, and start building.

---

## 1. About this project

**Name:** Lono Notes
**Owner:** Eric (poker player, building this for personal use + eventual release under his Way of Lono brand)
**Brand:** Way of Lono — a poker training brand co-developed with poker coach Tyler Forrester (formerly of Run It Once). The notes app is part of the Way of Lono product surface.
**Public site:** wayoflono.xyz

You are building a desktop note-taking and in-game-overlay tool for a professional online poker player. The user plays on **ClubWPT Gold**, a US-legal sweepstakes-format poker site that ships **without any built-in note-taking, color-tagging, or HUD features.** The client allows multi-tabling up to 4 tables. There is no third-party HUD ecosystem on this site — the user is unaided unless they build their own tools.

This app fills that gap.

---

## 2. Read this section twice — Terms of Service constraints

ClubWPT Gold's ToS explicitly prohibits:

- Cheats and automation software
- "Accessing the Service by any means (automated or otherwise) other than through their currently available, published interfaces"
- Modified clients or any tools that interact with the game client

**This means the following are OUT OF SCOPE and must not be implemented:**

- ❌ OCR or screen-scraping of the poker table to extract player names, stacks, or any game state
- ❌ Reading the poker client's process memory
- ❌ Parsing the poker client's network traffic
- ❌ Any automation that triggers actions in the poker client (autoclicker, hotkey-to-fold, etc.)
- ❌ Reading hand histories from the client's data directory while the client is running
- ❌ Any feature that requires the app to know what is currently happening at the user's table

**The following are explicitly safe and form the basis of the build:**

- ✅ A standalone application the user manually types or pastes into
- ✅ An always-on-top desktop window (a window beside the client is not "accessing the Service")
- ✅ Global hotkeys that open/focus the app (OS-level, do not touch the client)
- ✅ Cloud sync of the user's own notes between their own devices
- ✅ Manual import of hand histories the user exports themselves (deferred, see §10)

**If you find yourself proposing a feature that depends on knowing what's happening at the table without the user telling the app, stop. That feature is out.**

---

## 3. The product, in one paragraph

Lono Notes is a desktop app with two coordinated surfaces. **Notes Mode** is a full-featured player database where the user curates opponents between sessions: color-codes them by type, records *exploits* (action-oriented imperatives like "raise his flop cbets"), and logs notable hands. **Game Mode** is a compact always-on-top overlay used during play: the user pastes the seat names from each table they have open, and Game Mode surfaces each opponent's color and top exploits at a glance, with a global hotkey for one-keystroke capture of new observations mid-session. Same data, two surfaces — one for reflection, one for reaction.

---

## 4. The user

Treat the user as a senior technical operator. Specifically:

- He is a working professional poker player with ~20 years of experience. He knows the domain better than you do. Don't explain poker concepts to him.
- He is technically literate. He has Claude Code already configured in WSL with bypass permissions. He can read code. He builds his own tools.
- He values **direct, science-first, expert-level engagement.** No hand-holding, no excessive caveats, no beginner-level framing. If you have a strong opinion, state it. If he's wrong, say so and explain why.
- He prefers **opinionated defaults** to "would you like X or Y" choice paralysis. Pick the right answer and ship.
- He has good design taste. Don't ship generic AI-coder aesthetics. The visual system in §7 is mandatory, not a starting point.

---

## 5. Tech stack — these are decisions, not suggestions

- **Electron** for the desktop shell. Required for `setAlwaysOnTop` and `globalShortcut`, both of which a browser-only build cannot provide. These are core to the product.
- **React 18 + TypeScript** for the UI.
- **Vite** for build tooling (Electron Forge with Vite template is fine, or `electron-vite` directly).
- **SQLite** via `better-sqlite3` for local persistence. JSON-file storage is fragile at scale; SQLite gives proper indexing, atomic writes, and an obvious migration path.
- **Zustand** for state management. Redux is overkill for this app; Context-only gets unwieldy fast.
- **Tailwind CSS** for styling, with a custom theme matching §7. The v1 of this app used inline-styles-on-everything, which became unmaintainable. Don't repeat that mistake.
- **Fuse.js** for fuzzy search (player names contain digits, mixed case, special chars).

Do not bring in component libraries (shadcn, MUI, Mantine). The visual system is custom and a component library will fight it.

---

## 6. Data model

```ts
type PlayerType =
  | "unknown" | "fish" | "whale" | "nit" | "reg"
  | "lag" | "maniac" | "watch";

type Street = "preflop" | "flop" | "turn" | "river" | "tells" | "meta";

interface Exploit {
  id: string;
  text: string;              // imperative, e.g. "raise his flop cbets"
  street: Street;
  priority: number;          // 1 = top, displayed first in Game Mode
  createdAt: string;         // ISO date
}

interface Tag {
  id: string;
  text: string;              // descriptive, e.g. "cbets too much"
  street: Street;
}

interface Hand {
  id: string;
  date: string;              // ISO date
  position?: string;         // optional structure; freeform fallback below
  vsPosition?: string;
  street?: Street;
  action?: string;
  sizing?: string;
  result?: string;
  freeform: string;          // always populated; a one-line summary if structured fields used
}

interface Player {
  id: string;                // slug from name; immutable once created
  name: string;              // editable display name
  type: PlayerType;
  exploits: Exploit[];
  tags: Tag[];
  hands: Hand[];
  notes: string;             // freeform markdown
  createdAt: string;
  lastSeen: string;          // updated only when player appears in Game Mode table
  lastTagged: string;        // updated when exploits/tags edited
  encounters: number;        // incremented when added to Game Mode table (debounced per session)
  starred: boolean;          // user-flagged for priority surfacing
}

interface Table {
  id: 1 | 2 | 3 | 4;         // up to 4 tables, ClubWPT Gold maximum
  playerNames: string[];     // raw seat names; resolved to Player by id at render time
  updatedAt: string;
}

interface AppState {
  players: Record<string, Player>;
  customTags: Tag[];          // user-defined tag vocabulary
  tagFrequency: Record<string, number>;  // for ranking common tags
  tables: Table[];            // current Game Mode state
  hotkeyBindings: Record<string, string>;  // key -> tag/exploit text
  preferences: {
    quickCaptureHotkey: string;  // default: "CommandOrControl+Shift+L"
    gameModeAlwaysOnTop: boolean; // default: true
    staleDays: number;            // default: 90
  };
}
```

Key decisions encoded above:

- **Exploits are first-class, not a subset of tags.** They have priority, they drive Game Mode display, they're the headline information.
- **Tags are descriptive observations**, kept for between-session pattern analysis.
- **`lastSeen` and `lastTagged` are separate fields** so timeline data isn't corrupted by editing.
- **`encounters` is real** — increments on Game Mode table population.
- **Hands have optional structure** with a freeform fallback for fast capture.

---

## 7. Visual design system

The aesthetic is **terminal-meets-typography**: monospace utility, serif accents, dark slate, single gold accent color, understated but not generic-dark-mode. This matches the Way of Lono brand.

### Typography

- **Display / serif accent:** Instrument Serif, italic. Used for the "Lono" wordmark and rare flourishes only.
- **UI / body:** JetBrains Mono. Used everywhere else. All weights from 400–700.

```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
```

### Color palette (use these exact hex values)

```ts
const palette = {
  bg:        "#0a0c0f",  // deepest background
  surface:   "#13171c",  // cards, header
  surface2:  "#1a1f26",  // hover states, raised elements
  border:    "#252a31",
  borderDim: "#1d2228",
  text:      "#e8e5dc",  // off-white, warm
  textDim:   "#8a8e95",
  textMute:  "#5a5e65",
  accent:    "#c9a961",  // gold — used sparingly
  accentDim: "#806a3d",
  danger:    "#c84a4a",
};

// Player type colors (dot + label)
const types = {
  unknown: { hex: "#5aa8a8", label: "Unknown" },
  fish:    { hex: "#5a7ba8", label: "Fish" },
  whale:   { hex: "#9568b0", label: "Whale" },
  nit:     { hex: "#5b8c5a", label: "Nit" },
  reg:     { hex: "#d4b94a", label: "Solid Reg" },
  lag:     { hex: "#d68a3c", label: "LAG" },
  maniac:  { hex: "#c84a4a", label: "Maniac" },
  watch:   { hex: "#c87aa8", label: "Watch" },
};
```

### Visual rules

- **Borders are sharp** (border-radius: 2px max, not rounded chips)
- **No drop shadows** anywhere. Depth comes from background-color steps (`bg` → `surface` → `surface2`).
- **Gold accent is rare.** Use it for the wordmark, the primary action button, and active state highlights. Not for general emphasis.
- **Section labels use uppercase, 10px, letter-spaced (2px), color: textDim.** This is the dominant header style.
- **Animations are minimal** — 100–150ms ease, only on interactive elements (hover translate-y-[-1px], color transitions).
- **Scrollbars are styled** (8px, surface-colored track, border-colored thumb, accent on hover).

### Layout principles

- **Information density beats whitespace.** This is a tool, not a marketing site. Pack information tightly without sacrificing legibility.
- **Avoid card-heavy layouts.** Sections divide by single-pixel borders, not floating boxes.
- **The serif is for the brand only.** Don't start italicizing UI labels for "elegance" — it'll cheapen the brand mark.

---

## 8. The two modes

### 8.1 Notes Mode (the main window)

**Layout:** Two-pane. Left sidebar = player list with search, type filter, and add buttons. Right pane = selected player detail.

**Player list (sidebar):**
- ⌘K-focusable search input at top
- Type filter (color dots + ALL toggle)
- Player rows: type-color dot, name, exploit count, hand count
- Sort: starred first, then by last seen desc, then by encounters desc, then alphabetical
- Stale indicator (faded opacity + "Xmo" badge) when `lastSeen` > `preferences.staleDays`
- Add single + bulk-add buttons in header
- Keyboard nav: `↑`/`↓` or `j`/`k` move selection, Enter opens

**Player detail (right pane), top to bottom:**

1. **Header:** Editable name (large), type-color picker dots inline, star toggle, delete button. Meta line below: type label · last seen · # exploits · # hands · # tags
2. **EXPLOITS section** — primary, placed first. Action-oriented imperatives, grouped by street. Each exploit is a row with reorder handle, text, street tag, and delete. "+ Exploit" input at bottom with street selector. **This is the section the user references most. It earns top placement.**
3. **APPLIED TAGS section** — descriptive observations, grouped by street, displayed as compact chips. Tag library expands below this section (collapsed by default once player has any tags).
4. **NOTABLE HANDS section** — structured-or-freeform hand entries. Inline add at top. List below with date and one-line display.
5. **NOTES section** — freeform textarea with markdown rendering on blur. For long-form thinking that doesn't fit the structured fields.

### 8.2 Game Mode (the always-on-top overlay)

A separate Electron `BrowserWindow` opened on user demand, distinct from the main Notes Mode window:

- `width: 380, minWidth: 320, maxWidth: 480, height: variable`
- `alwaysOnTop: true` (level: `floating` or `screen-saver` for Windows)
- `frame: false` with custom drag region in header
- `transparent: false, backgroundColor: "#0a0c0f"`

**Layout — three sub-modes the user toggles:**

1. **All Tables view (default):** Four collapsible sections, one per table (Table 1–4). Each section contains a "Set Names" input (paste/newline-separated names) and the resolved player rows. Empty tables collapse to just the header.
2. **Single Table view:** One table, expanded view, more detail per row.
3. **Focus card:** A single player surfaced large — for "the opponent in the current hand." Toggleable by clicking a player row.

**Compact player row anatomy:**

```
●  PlayerName              [F] ⭐
   raise his cbets · float turn wide · X/r river
   3 turn agg · 2 river fold · 6mo stale
```

- Color dot (8px), name (truncated), 1-letter type badge, star indicator
- Top 3 exploits (priority-sorted) on line 2
- Compact metadata on line 3: tag-density-by-street + staleness if applicable
- Click row → opens Notes Mode focused on this player (without closing Game Mode)
- Unknown players (not in DB) render as a stub with "+ Tag" button to create them inline

**Window controls (custom):**

- Drag handle (top of window)
- Switch view (all/single/focus) buttons
- Pin/unpin always-on-top toggle
- Close button (hides; doesn't quit app)

### 8.3 Quick-Capture modal

A globally-registered hotkey (default `Ctrl+Shift+L` on Windows/Linux, `Cmd+Shift+L` on macOS) opens a small modal anywhere, even when the poker client has focus.

**Modal:**
- Player name field (autocomplete from existing players, fuzzy-matched, or creates new on Enter+Enter)
- Single-line capture field
- Type toggle: `exploit` (default) | `tag` | `hand` | `note`
- Street selector (chip row): preflop / flop / turn / river / tells / meta
- Enter saves and closes; Escape discards

This is the **single highest-leverage feature** in the app. Most poker observations are lost because capture friction is too high. Build this early and well.

---

## 9. MVP scope and build order

Build in this order. Don't skip ahead. Each milestone should be runnable.

**Milestone 1 — Skeleton**
- Electron + React + TS + Vite scaffold
- SQLite setup with the schema from §6
- Main window opens with Notes Mode shell (header, sidebar, empty detail pane)
- Add/delete players, basic search
- Migrations system (even if migration 1 is just "create tables")

**Milestone 2 — Notes Mode core**
- Type color picker, exploits CRUD with street + priority
- Tags CRUD with library, custom tags, frequency tracking
- Hands CRUD (freeform first, structured fields second)
- Notes field with markdown rendering
- Star, stale indicator, fuzzy search

**Milestone 3 — Game Mode**
- Second `BrowserWindow` configured always-on-top
- All-Tables view with manual paste population
- Player rows render exploits + meta
- Click row opens Notes Mode focused on player
- View toggle (all / single / focus)

**Milestone 4 — Quick Capture**
- `globalShortcut` registration with user-configurable binding in preferences
- Modal opens regardless of focused window
- Saves to correct field type (exploit/tag/hand/note)
- Auto-creates player if new

**Milestone 5 — Polish**
- Keyboard navigation everywhere
- Settings panel (hotkey rebinding, stale threshold, etc.)
- JSON export/import for backups
- Hotkey-to-apply-tag (1–9 binds top tags)
- Drag-reorder for exploits (priority)

**Milestone 6 — Sync (optional, scope dependent)**
- Supabase or Firestore integration for cross-device
- Magic-link auth
- Conflict resolution: last-write-wins per record, with `updatedAt`

---

## 10. Out of scope (note for later, do not build now)

- Hand history parsing — defer until ClubWPT Gold ships an export format the user can manually share with the app
- AI-suggested tags from hand text — interesting, but not core to MVP
- Shared note packs / community features — Way of Lono brand opportunity, post-MVP
- Mobile companion — design the data layer to support it, do not build it
- Anything involving reading from the poker client (see §2)

---

## 11. Working style with the user

- He'll review and iterate. Build small, runnable increments and ship them for him to try. Don't disappear for a day to deliver a 50-file PR.
- When you have a real architectural choice, present 2 options briefly with a clear recommendation. When you have a clear right answer, just do it and tell him.
- Match his register: dense, technical, no filler. He'll ask follow-up questions if he wants more detail.
- He cares about the visual system. If a milestone looks wrong, he'll catch it. Bias toward getting §7 right early rather than treating it as polish.
- The Way of Lono brand is a real product he ships under. Code should be release-quality, not prototype-quality, by Milestone 4.

---

## 12. First action

Read this brief end-to-end. Then summarize back to the user in 5–10 lines:
1. Your understanding of the product
2. The tech stack you're going to scaffold
3. Any ambiguities you want clarified before scaffolding
4. The exact first commit you'll produce

Wait for confirmation before scaffolding. Then proceed to Milestone 1.
