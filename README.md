# MapMig - A Map Porting Quickfix Tool

For anyone who does map porting from one game to another, the earliest obstacles are often the same: replacing countless texture names, manually converting the textures into a supported format, removing entities that don't exist in the target game, and modifying similar enough entities to make them work properly. MapMig seeks to speed up this process within a sleek, straightforward visual interface.

MapMig is a desktop map porting cleanup utility, with current support geared specifically for porting maps to Quake 1, and intent to expand support to other titles soon.  
  
Simply drop in a `.map` file to swap textures, modify entities, manage WAD files, and save a clean output. Open the resulting output in your favorite map editor to confirm accuracy and make any other necessary additions before compilation.  
  
Built with [Tauri](https://tauri.app), [React](https://react.dev/), and [Rust](https://rust-lang.org/) in order to pack the application into a single executable that remains lightweight with no runtime dependencies.  
  
Created and maintained by Jordan Siegler @ iKM Media for the QuakeWorld Team Fortress Unification Project.

---

## Features

### Texture management
- Browse every unique texture across all brush faces, with face count and entity usage per texture
- Worldspawn, brush entity, and special textures (clip, skip, trigger, sky) listed in separate groups
- Per-texture replacement with Quake's 15-character name limit enforced at input
- Detection for texture names exceeding Quake's 15-character limit or containing invalid characters
- WAD texture browser/picker that is a searchable alphabetical list with thumbnail previews
- Bulk texture replacement via the Quick Edit tab

### Entity editor
- Browse all entities grouped by classname; expand any instance to view and edit its key/value pairs
- Add new properties, edit values inline, or delete keys per entity
- Edit properties on individual entities, check specific entities to edit properties across a specific set, or use the **Edit All** button to edit properties for every instance of an entity.
- Delete individual entities, or delete every instance of a classname
- Brush entities display per-face texture editing inline
- Quick Entity Property Edit in the Quick Edit tab for applying a key/value change across all instances of a classname at once

### WAD file support
- Load WAD2 (Quake) files 2 ways:
  - **Persistent WADs**: add WAD files in Settings to auto-load them with every map session
  - **Single-use WADs**: loaded per-session by drag-and-drop or sidebar button, promotable to the persistent list at any time before restarting the application
- Texture thumbnails displayed throughout the interface when a WAD is loaded
- Active WADs panel in sidebar with a refresh button to pick up changes made to WAD files externally

### WAD file creation
- Manually upload individual textures (*Supported: `.tga`, `.png`, `.bmp`, `.jpg`, `.vtf`, `.pcx`*) to build a new WAD
- Images larger than 512px are proportionally scaled down on import to maintain compatibility with older QuakeWorld clients.
- Dimensions are automatically padded to multiples of 16.
- Full mipmap generation
- Three palette options for exported WADs:
  - **All colors**: full Quake palette (indices 0–255)
  - **No fullbrights**: restricts to indices 0–223
  - **Fullbrights only**: indices 224–255
- WAD export can be set to Always On, Always Ask, or Disabled in Settings

### Edit history and undo/redo
- Full edit history panel in the sidebar, showing up to 30 previous operations
- Click any entry in the history panel to undo/redo up to that point in history
- Detailed changes available upon cursor hover on any edit history entry

### Settings
- Target game selector (Quake 1 only for now; additional games planned)
- Persistent WAD file management
- Backup download toggle (enabled by default)
- WAD saving mode: Enable / Disable / Always Ask
- Palette preference for WAD export
- Option to auto-add exported WADs to the persistent list
- Toggle worldspawn brush texture visibility

---

## Config Location

All user data is stored in the OS config directory:
- **Windows:** `%APPDATA%/mapmig/`
- **macOS:** `~/Library/Application Support/mapmig/`
- **Linux:** `~/.config/mapmig/`

Contents:
- `settings.json` — all MapMig settings
- `recents.json` — recently opened files (with full paths)
- `persistent_wads/` — WAD files that auto-load with every map

---

## Compiling

### Prerequisites

#### 1. Install Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```
On Windows, download and run [rustup-init.exe](https://rustup.rs).

After installing, restart your terminal and verify:
```bash
rustc --version
cargo --version
```

#### 2. Install Node.js (v18+)
Download from [nodejs.org](https://nodejs.org) or use a version manager like nvm.

#### 3. System dependencies (Linux only)
```bash
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

macOS and Windows require no additional system dependencies.

### Setup

```bash
cd mapmig
npm install
```

To run the app in development mode:
```bash
npm run tauri:dev
```

This opens the app in a window that supports hot-reload, where changes to files in `src/` will automatically restart the application.

#### Build for Distribution

Build a production release:
```bash
npm run tauri:build
```

Output application is saved to:
- **Windows:** `src-tauri/target/release/mapmig.exe`
- **macOS:** `src-tauri/target/release/bundle/macos/mapmig.app`
- **Linux:** `src-tauri/target/release/mapmig.AppImage`

---

## Known Bugs

Listed below are all bugs that are currently identifiable:
- Right-clicking an image and choosing Magnify currently does not work as intended; this will be patched at a later point.
- While automatic texture detection & renaming between `.map` files and individual texture imports works, this automatic action does not currently work between `.map` files and `.wad` files.  
