#!/bin/sh
set -e

SEED_DIR=/app/seed/avatars
DEST_DIR=/app/uploads/avatars

if [ -d "$SEED_DIR" ]; then
  mkdir -p "$DEST_DIR"
  cp -n "$SEED_DIR"/* "$DEST_DIR"/ 2>/dev/null || true
fi

exec "$@"
