# CopyBek – Installation Guide for Ubuntu

CopyBek is a clipboard history manager for Ubuntu. Copy text with **Ctrl+C** anywhere, then open the history with a shortcut to paste from your last 20 copied items.

---

## Option 1: Install from .deb package (recommended)

### Step 1: Download

Download the `.deb` package from the [releases page](https://github.com/Bekzod13/copybek/releases) or build it yourself (see [Building from source](#building-from-source)).

### Step 2: Install

```bash
sudo dpkg -i copybek_1.0.0_amd64.deb
```

If you see dependency errors:

```bash
sudo apt-get install -f
```

### Step 3: Launch

- From the app menu: search for **CopyBek**
- From terminal: `copybek`

The app runs in the background and shows an icon in the system tray.

---

## Option 2: Install from AppImage

### Step 1: Download

Download `CopyBek-1.0.0.AppImage` from the [releases page](https://github.com/Bekzod13/copybek/releases).

### Step 2: Make it executable

```bash
chmod +x CopyBek-1.0.0.AppImage
```

### Step 3: Run

```bash
./CopyBek-1.0.0.AppImage
```

Or double-click the file in your file manager.

---

## Set up keyboard shortcut (recommended)

On Ubuntu (especially with Wayland), global shortcuts may not work. Use a custom shortcut instead:

### Step 1: Start CopyBek

Run CopyBek once so it stays in the tray.

### Step 2: Add custom shortcut

1. Open **Settings** → **Keyboard** → **Keyboard Shortcuts**
2. Click **View and customize shortcuts**
3. Scroll to **Custom shortcuts** → click **+**
4. Enter:
   - **Name:** `CopyBek`
   - **Command:** `copybek --show`  
     (or `/usr/bin/copybek --show` for full path)
   - **Shortcut:** `Super+V` (or any key you prefer)
5. Click **Add**

### Step 3: Use it

Press your shortcut (e.g. **Super+V**) to open the clipboard history window.

---

## Usage

1. **Copy text** with **Ctrl+C** in any app – it is saved automatically.
2. **Open history** with **Super+V** (or your custom shortcut) or by clicking the tray icon.
3. **Select an item** with the mouse or **↑/↓** keys.
4. **Paste** with **Enter** or by clicking the item.
5. **Close** with **Escape** or by clicking outside the window.

---

## Installed locations (.deb)

| Item        | Path                                      |
|------------|-------------------------------------------|
| Executable | `/usr/bin/copybek` or `/opt/CopyBek/copybek` |
| Desktop    | `/usr/share/applications/copybek.desktop` |
| Icons      | `/usr/share/icons/hicolor/*/apps/copybek.png` |

---

## Uninstall

### .deb package

```bash
sudo apt remove copybek
```

### AppImage

Delete the `CopyBek-1.0.0.AppImage` file.

---

## Building from source

```bash
git clone https://github.com/Bekzod13/copybek.git
cd copybek
npm install
npm run dist
```

Output:

- `release/copybek_1.0.0_amd64.deb`
- `release/CopyBek-1.0.0.AppImage`

---

## Troubleshooting

| Problem              | Solution                                                                 |
|----------------------|---------------------------------------------------------------------------|
| Shortcut doesn’t work | Add a custom shortcut in Settings (see above)                            |
| App doesn’t open     | Run `copybek` in a terminal and check for errors                          |
| No tray icon         | Some desktop environments hide tray icons; use the custom shortcut       |
| Wrong icon           | Reinstall the .deb package; log out and back in to refresh the icon cache |
