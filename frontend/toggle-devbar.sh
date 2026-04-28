#!/usr/bin/env bash
# active ou désactive la DevBar
# Utilisation : ./toggle-devbar.sh depuis le dossier frontend/
#
# Priorité Vite : .env.development.local > .env.development > .env.local > .env
# On écrit dans .env.development.local pour écraser .env.development (VITE_DEVBAR=true)

ENV_LOCAL="$(dirname "$0")/.env.development.local"
COMPOSE_DIR="$(dirname "$0")/.."

is_disabled() {
  [[ -f "$ENV_LOCAL" ]] && grep -q "VITE_DEVBAR=false" "$ENV_LOCAL"
}

if is_disabled; then
  rm -f "$ENV_LOCAL"
  echo "✅ DevBar ON"
else
  echo "VITE_DEVBAR=false" > "$ENV_LOCAL"
  echo "🚫 DevBar OFF"
fi

echo "🔄 Redémarrage du frontend..."
docker compose -f "$COMPOSE_DIR/docker-compose.yml" restart frontend
echo "✔  Frontend redémarré."
