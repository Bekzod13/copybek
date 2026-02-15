#!/bin/bash
# Ubuntu shortcut: use full path to this script or to AppImage
# Example: /home/bekzod/startup/copyBek/release/CopyBek-1.0.0.AppImage --show

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP="${SCRIPT_DIR}/release/CopyBek-1.0.0.AppImage"

if [ -f "$APP" ]; then
  exec "$APP" --show
else
  (cd "$SCRIPT_DIR" && npx electron . --show) 2>/dev/null
fi
