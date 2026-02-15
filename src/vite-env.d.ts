/// <reference types="vite/client" />

interface CopybekAPI {
  getHistory: () => Promise<{ id: string; text: string; timestamp: number }[]>
  pasteText: (text: string, autoPaste: boolean) => Promise<void>
  getAutoPasteSetting: () => Promise<boolean>
  setAutoPaste: (enabled: boolean) => Promise<void>
  hideWindow: () => Promise<void>
  onHistoryUpdated: (callback: (items: { id: string; text: string; timestamp: number }[]) => void) => () => void
}

declare global {
  interface Window {
    copybek: CopybekAPI
  }
}

export {}
