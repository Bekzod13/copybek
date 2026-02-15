# CopyBek

A personal clipboard history manager for Linux (Ubuntu), with cross-platform support for Windows and macOS.

## Features

- **Super+C** – Save current clipboard text to history
- **Super+V** – Open history window to select and paste
- Stores last 20 unique clipboard items
- Keyboard navigation (↑/↓ arrows, Enter, Escape)
- Optional auto-paste on Enter (simulates Ctrl+V)
- Frameless, always-on-top window positioned near cursor

## Quick Start

```bash
npm install
npm run electron:dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server only |
| `npm run electron:dev` | Start app in development mode |
| `npm run build` | Build for production |
| `npm run dist` | Build and create Linux package (.deb, AppImage) |

## Usage

1. Copy text with **Ctrl+C** in any application
2. Press **Super+C** to save it to history
3. Press **Super+V** to open the history window
4. Use **↑/↓** to navigate, **Enter** to paste (or **Escape** to close)
5. Click an item to copy to clipboard (then press Ctrl+V manually)

## Ubuntu Custom Shortcut (recommended when Super+V doesn't work)

1. **Start CopyBek** (run the AppImage once so it stays in the tray)
2. Open **Settings** → **Keyboard** → **Keyboard Shortcuts** → **View and customize shortcuts**
3. Scroll to **Custom shortcuts** → click **+**
4. Set:
   - **Name:** `CopyBek`
   - **Command:** `/full/path/to/CopyBek-1.0.0.AppImage --show`
   - **Shortcut:** `Super+V` (or any key you prefer)
5. Click **Add**

The shortcut will trigger the running CopyBek instance to show the window. You can use any shortcut Ubuntu supports (e.g. Super+V, Ctrl+Shift+V).

## Linux Notes

- **Wayland**: Global shortcuts may not work; use Ubuntu custom shortcut above instead.
- **Sandbox**: If Electron fails to start, run with `--no-sandbox` (already in `electron:dev`).
- **Super key**: On some setups, Super+C/V might conflict with desktop shortcuts.

## Tech Stack

- Electron 28+
- React 18 + TypeScript
- Vite
- electron-store
- @nut-tree-fork/nut-js (auto-paste)
