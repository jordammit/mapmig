# MapMig — A Map Porting Quickfix Tool

MapMig is a desktop utility for porting maps from other games to Quake 1 format, with intent to expand to other titles/engines in the future. Drop in a `.map` file to swap textures, modify entities, manage WAD files, and save a clean output. Built with [Tauri](https://tauri.app) for a native desktop feel with no runtime dependencies.

Maintained by Jordan Siegler @ iKM Media for the QuakeWorld Team Fortress Unification Project.

---

## Features

### Texture management
- Browse every unique texture across all brush faces, with face count and entity usage per texture
- Worldspawn, brush entity, and special textures (clip, skip, trigger, sky) listed in separate groups
- Per-texture replacement with Quake's 15-character name limit enforced at input
- WAD texture picker — searchable, alphabetical list with thumbnail previews
- Detection for texture names exceeding Quake's 15-character limit or containing invalid characters
- Bulk texture replacement via the Quick Edit tab

### WAD file support
- Load WAD2 (Quake) and WAD3 (Half-Life) files:
  - **Persistent WADs** — add WAD files in Settings to auto-load them with every map session
  - **Single-use WADs** — loaded per-session by drag-and-drop or sidebar button, promotable to the persistent list at any time
- Texture thumbnails displayed throughout the interface when a WAD is loaded
- Active WADs panel in sidebar with a refresh button to pick up changes made to WAD files externally

### WAD file creation
- Manually upload individual textures (`.tga`, `.png`, `.bmp`, `.jpg`, `.vtf`, `.pcx`) to build a new WAD
- Images larger than 512px are proportionally scaled down on import to maintain compatibility with older QuakeWorld clients.
- Dimensions are automatically padded to multiples of 16 (required by Quake's miptex format)
- Full mipmap generation
- Three palette options for exported WADs:
  - **All colors** — full Quake palette (indices 0–255)
  - **No fullbrights** — restricts to indices 0–223
  - **Fullbrights only** — indices 224–255
- WAD export can be set to Always On, Always Ask, or Disabled in Settings

### Entity editor
- Browse all entities grouped by classname; expand any instance to view and edit its key/value pairs
- Add new properties, edit values inline, or delete keys per entity
- **Delete Entity** button on each instance; **Delete All** removes every instance of a classname
- Brush entities display per-face texture editing inline
- **Multi-entity editing** — check individual entities or use Edit All to select an entire classname at once; differing values across the selection display as an italic *multi* placeholder
- Quick Entity Property Edit in the Quick Edit tab for applying a key-value change across all instances of a classname at once

### Saving and file management
- **Save** — overwrites the original file directly; optionally writes a timestamped backup to the same folder first (toggleable in Settings)
- **Save As** — allows user to save file under whatever name they'd like in a directory of their choosing
- **Reload** — re-reads the current file from disk without re-selecting it, useful when editing externally between saves
- **Recents panel** — persistent list of recently opened maps; clicking any entry reopens the file from disk

### Edit history and undo/redo
- Full edit history panel in the sidebar, showing up to 30 operations
- **Ctrl+Z** to undo, **Ctrl+Y** to redo
- Click any entry in the history panel to jump directly to that point in history
- Undone entries are visually dimmed; the current position is highlighted
- Hover any entry for a more detailed tooltip

### Settings
- Target game selector (Quake 1 only for now; additional games planned)
- Persistent WAD file management
- Backup download toggle (enabled by default)
- WAD saving mode: Enable / Disable / Always Ask
- Palette preference for WAD export
- Option to auto-add exported WADs to the persistent list
- Toggle worldspawn brush texture visibility

---

## Prerequisites

### 1. Install Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```
On Windows, download and run [rustup-init.exe](https://rustup.rs).

After installing, restart your terminal and verify:
```bash
rustc --version
cargo --version
```

### 2. Install Node.js (v18+)
Download from [nodejs.org](https://nodejs.org) or use a version manager like nvm.

### 3. System dependencies (Linux only)
```bash
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

macOS and Windows require no additional system dependencies.

---

## Setup

```bash
cd mapmig
npm install
```

---

## Development

Run the app in development mode with hot-reload:
```bash
npm run tauri:dev
```

This opens the app window. Changes to files in `src/` will auto-reload.

---

## Building for Distribution

Build a production release:
```bash
npm run tauri:build
```

Output installers:
- **Windows:** `src-tauri/target/release/bundle/msi/MapMig_1.0.0_x64_en-US.msi`
- **macOS:** `src-tauri/target/release/bundle/dmg/MapMig_1.0.0_aarch64.dmg`
- **Linux:** `src-tauri/target/release/bundle/appimage/MapMig_1.0.0_amd64.AppImage`

---

## Configuration

All user data is stored in the OS config directory:
- **Windows:** `%APPDATA%/mapmig/`
- **macOS:** `~/Library/Application Support/mapmig/`
- **Linux:** `~/.config/mapmig/`

Contents:
- `settings.json` — all MapMig settings
- `recents.json` — recently opened files (with full paths)
- `persistent_wads/` — WAD files that auto-load with every map

---

## Known Bugs

Listed below are all bugs that are currently identifiable:
- Right-clicking an image and choosing Magnify currently does not work as intended; this will be patched at a later point.
