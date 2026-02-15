import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('copybek', {
  getHistory: () => ipcRenderer.invoke('get-history'),
  pasteText: (text: string, autoPaste: boolean) =>
    ipcRenderer.invoke('paste-text', text, autoPaste),
  getAutoPasteSetting: () => ipcRenderer.invoke('get-auto-paste-setting'),
  setAutoPaste: (enabled: boolean) => ipcRenderer.invoke('set-auto-paste', enabled),
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  onHistoryUpdated: (callback: (items: { id: string; text: string; timestamp: number }[]) => void) => {
    const handler = (_: unknown, items: { id: string; text: string; timestamp: number }[]) =>
      callback(items)
    ipcRenderer.on('history-updated', handler)
    return () => ipcRenderer.removeListener('history-updated', handler)
  }
})
