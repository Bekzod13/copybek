import { useEffect, useState, useCallback } from 'react'

const PREVIEW_LENGTH = 50

interface HistoryItem {
  id: string
  text: string
  timestamp: number
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '…'
}

export default function App() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [autoPaste, setAutoPaste] = useState(false)

  const loadHistory = useCallback(async () => {
    if (window.copybek) {
      const items = await window.copybek.getHistory()
      setHistory(items)
      setSelectedIndex(0)
    }
  }, [])

  const loadAutoPaste = useCallback(async () => {
    if (window.copybek) {
      const enabled = await window.copybek.getAutoPasteSetting()
      setAutoPaste(enabled)
    }
  }, [])

  const handleSelect = useCallback(
    async (item: HistoryItem) => {
      if (window.copybek) await window.copybek.pasteText(item.text, autoPaste)
    },
    [autoPaste]
  )

  useEffect(() => {
    loadHistory()
    loadAutoPaste()
  }, [loadHistory, loadAutoPaste])

  useEffect(() => {
    const onFocus = () => loadHistory()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [loadHistory])

  useEffect(() => {
    const cleanup = window.copybek?.onHistoryUpdated?.(items => {
      setHistory(items)
      setSelectedIndex(0)
    })
    return () => cleanup?.()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (history.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(i => Math.min(i + 1, history.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(i => Math.max(i - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          handleSelect(history[selectedIndex])
          break
        case 'Escape':
          e.preventDefault()
          window.copybek?.hideWindow()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [history, selectedIndex, handleSelect])

  const handleClick = (item: HistoryItem) => {
    if (window.copybek) {
      window.copybek.pasteText(item.text, false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">Clipboard history</h1>
        <p className="shortcut-hint">Super+V · Ctrl+Alt+V · Tray</p>
        <label className="auto-paste-toggle">
          <input
            type="checkbox"
            checked={autoPaste}
            onChange={async e => {
              const enabled = e.target.checked
              setAutoPaste(enabled)
              await window.copybek?.setAutoPaste(enabled)
            }}
          />
          <span>Auto-paste on Enter</span>
        </label>
      </header>
      <ul className="list" role="listbox">
        {history.length === 0 ? (
          <li className="empty">No items yet. Copy text (Ctrl+C) anywhere to add to history.</li>
        ) : (
          history.map((item, index) => (
            <li
              key={item.id}
              role="option"
              aria-selected={index === selectedIndex}
              className={`item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleClick(item)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {truncate(item.text, PREVIEW_LENGTH)}
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
