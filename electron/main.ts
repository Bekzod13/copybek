import { app, BrowserWindow, globalShortcut, clipboard, ipcMain, screen, Tray, nativeImage, Menu } from 'electron'

// Disable hardware acceleration to avoid GetVSyncParametersIfAvailable errors on Linux
app.disableHardwareAcceleration()

// Linux: enable global shortcuts on Wayland
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-features', 'GlobalShortcutsPortal')
}
import path from 'path'
import { fileURLToPath } from 'url'
import Store from 'electron-store'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const MAX_HISTORY_ITEMS = 20
const SHOW_ARG = '--show'

function shouldShowOnLaunch(): boolean {
  return process.argv.includes(SHOW_ARG)
}
interface HistoryItem {
  id: string
  text: string
  timestamp: number
}

const store = new Store<{ history: HistoryItem[]; autoPaste: boolean }>({
  defaults: {
    history: [],
    autoPaste: false
  }
})

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let lastClipboardText = ''
let blurHideTimeout: ReturnType<typeof setTimeout> | null = null
let lastShowTime = 0
const BLUR_GRACE_MS = 1500
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function startClipboardMonitoring(): void {
  const checkClipboard = () => {
    try {
      const text = clipboard.readText()
      if (text && text !== lastClipboardText) {
        lastClipboardText = text
        addToHistory(text)
      }
    } catch {
      // Ignore clipboard read errors
    }
  }
  checkClipboard()
  setInterval(checkClipboard, 600)
}

function createWindow(): BrowserWindow {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const winWidth = 400
  const winHeight = 500

  const iconPath = path.join(__dirname, '../logo.png')
  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    show: false,
    frame: false,
    icon: iconPath,
    alwaysOnTop: true,
    transparent: false,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html')).catch(() => {})
  }

  mainWindow.webContents.once('did-finish-load', () => {
    lastShowTime = Date.now()
    mainWindow?.show()
    mainWindow?.focus()
  })

  mainWindow.on('blur', () => {
    if (blurHideTimeout) clearTimeout(blurHideTimeout)
    const timeSinceShow = Date.now() - lastShowTime
    const delay = timeSinceShow < BLUR_GRACE_MS ? BLUR_GRACE_MS - timeSinceShow : 400
    blurHideTimeout = setTimeout(() => {
      mainWindow?.hide()
      blurHideTimeout = null
    }, delay)
  })

  mainWindow.on('focus', () => {
    if (blurHideTimeout) {
      clearTimeout(blurHideTimeout)
      blurHideTimeout = null
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  return mainWindow
}

function showWindow(): void {
  lastShowTime = Date.now()
  if (blurHideTimeout) {
    clearTimeout(blurHideTimeout)
    blurHideTimeout = null
  }
  if (!mainWindow) createWindow()
  positionWindowNearCursor()
  mainWindow?.setVisibleOnAllWorkspaces(true)
  mainWindow?.show()
  mainWindow?.setAlwaysOnTop(true, 'floating')
  mainWindow?.focus()
  mainWindow?.moveTop()
  mainWindow?.webContents.send('history-updated', getHistory())
}

function createTray(): void {
  const iconPath = path.join(__dirname, '../logo.png')
  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon)
  tray.setToolTip('CopyBek - Super+V or Ctrl+Alt+V to show')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show Clipboard History', click: () => showWindow() },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() }
    ])
  )
  tray.on('click', () => showWindow())
  tray.on('double-click', () => showWindow())
}

function positionWindowNearCursor(): void {
  if (!mainWindow) return

  const cursorPos = screen.getCursorScreenPoint()
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const winWidth = 400
  const winHeight = 500

  let x = cursorPos.x
  let y = cursorPos.y + 20

  if (x + winWidth > width) x = width - winWidth
  if (x < 0) x = 0
  if (y + winHeight > height) y = cursorPos.y - winHeight - 20
  if (y < 0) y = 0

  mainWindow.setPosition(Math.round(x), Math.round(y))
}

function getHistory(): HistoryItem[] {
  return store.get('history', [])
}

function addToHistory(text: string): void {
  if (!text || typeof text !== 'string') return

  const trimmed = text.trim()
  if (!trimmed) return

  const history = getHistory()
  const exists = history.some(item => item.text === trimmed)
  if (exists) return

  const newItem: HistoryItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text: trimmed,
    timestamp: Date.now()
  }

  const updated = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS)
  store.set('history', updated)
}

function onSaveClipboard(): void {
  const text = clipboard.readText()
  addToHistory(text)
}

function registerShortcuts(): void {
  if (!globalShortcut.register('Super+C', onSaveClipboard) && process.platform === 'linux') {
    globalShortcut.register('Control+Alt+C', onSaveClipboard)
  }

  const shortcuts = ['Super+V', 'Meta+V', 'Control+Alt+V', 'Control+Shift+V', 'Alt+Shift+V']
  for (const accel of shortcuts) {
    if (globalShortcut.register(accel, showWindow)) break
  }
}

function unregisterShortcuts(): void {
  globalShortcut.unregisterAll()
}

const gotLock = app.requestSingleInstanceLock()

if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    if (argv.includes(SHOW_ARG)) showWindow()
  })
}

app.whenReady().then(() => {
  createWindow()
  createTray()
  registerShortcuts()
  startClipboardMonitoring()
  if (shouldShowOnLaunch()) {
    showWindow()
  }
})

app.on('window-all-closed', () => {
  // Don't quit - keep app running in background for clipboard manager
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('will-quit', () => {
  unregisterShortcuts()
})

ipcMain.handle('get-history', () => getHistory())

ipcMain.handle('paste-text', async (_event, text: string, autoPaste: boolean) => {
  if (!text || typeof text !== 'string') return
  clipboard.writeText(text)

  if (autoPaste) {
    try {
      const { keyboard, Key } = await import('@nut-tree-fork/nut-js')
      keyboard.config.autoDelayMs = 50
      const modifier = process.platform === 'darwin' ? Key.LeftSuper : Key.LeftControl
      await keyboard.pressKey(modifier)
      await keyboard.pressKey(Key.V)
      await keyboard.releaseKey(Key.V)
      await keyboard.releaseKey(modifier)
    } catch (err) {
      console.error('Auto-paste failed (may not work on Wayland):', err)
    }
  }

  mainWindow?.hide()
})

ipcMain.handle('get-auto-paste-setting', () => {
  return store.get('autoPaste', false)
})

ipcMain.handle('set-auto-paste', (_event, enabled: boolean) => {
  store.set('autoPaste', enabled)
})

ipcMain.handle('hide-window', () => {
  mainWindow?.hide()
})
