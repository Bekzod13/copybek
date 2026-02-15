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
const DEBUG = true

function log(...args: unknown[]): void {
  if (DEBUG) console.log('[CopyBek]', ...args)
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
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function startClipboardMonitoring(): void {
  const checkClipboard = () => {
    try {
      const text = clipboard.readText()
      if (text && text !== lastClipboardText) {
        lastClipboardText = text
        addToHistory(text)
        log('Clipboard: added', text.slice(0, 50) + (text.length > 50 ? '…' : ''))
      }
    } catch {
      // Ignore clipboard read errors
    }
  }
  checkClipboard() // Initial check
  setInterval(checkClipboard, 500)
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
    const htmlPath = path.join(__dirname, '../dist/index.html')
    log('Loading from:', htmlPath)
    mainWindow.loadFile(htmlPath).catch(err => {
      log('Load error:', err)
    })
  }

  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow?.show()
    mainWindow?.focus()
    log('Window ready, showing')
  })

  mainWindow.on('blur', () => {
    if (blurHideTimeout) clearTimeout(blurHideTimeout)
    blurHideTimeout = setTimeout(() => {
      log('Window: blur, hiding')
      mainWindow?.hide()
      blurHideTimeout = null
    }, 400)
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
  log('Show window, history:', getHistory().length, 'items')
  if (blurHideTimeout) {
    clearTimeout(blurHideTimeout)
    blurHideTimeout = null
  }
  if (!mainWindow) createWindow()
  positionWindowNearCursor()
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
  log('History: now', updated.length, 'items')
}

function onSaveClipboard(): void {
  log('Shortcut: save clipboard')
  const text = clipboard.readText()
  addToHistory(text)
}

function registerShortcuts(): void {
  const superC = globalShortcut.register('Super+C', onSaveClipboard)
  log('Shortcut Super+C registered:', superC ? 'OK' : 'FAILED')
  if (!superC && process.platform === 'linux') {
    const alt = globalShortcut.register('Control+Alt+C', onSaveClipboard)
    log('Fallback Control+Alt+C registered:', alt ? 'OK' : 'FAILED')
  }

  const showHistory = () => showWindow()

  const shortcuts: [string, string][] = [
    ['Super+V', 'primary'],
    ['Meta+V', 'Meta'],
    ['Control+Alt+V', 'fallback 1'],
    ['Control+Shift+V', 'fallback 2'],
    ['Alt+Shift+V', 'fallback 3']
  ]
  for (const [accel, name] of shortcuts) {
    const ok = globalShortcut.register(accel, showHistory)
    log(`Shortcut ${accel} (${name}):`, ok ? 'OK' : 'FAILED')
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
    if (argv.includes(SHOW_ARG)) {
      log('Second instance with --show, focusing window')
      showWindow()
    }
  })
}

app.whenReady().then(() => {
  log('App ready')
  createWindow()
  createTray()
  registerShortcuts()
  startClipboardMonitoring()
  log('Clipboard monitoring started')
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

ipcMain.handle('get-history', () => {
  const history = getHistory()
  log('IPC get-history:', history.length, 'items')
  return history
})

ipcMain.handle('paste-text', async (_event, text: string, autoPaste: boolean) => {
  if (!text || typeof text !== 'string') return
  log('IPC paste-text:', text.slice(0, 30) + '…', 'autoPaste:', autoPaste)

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
