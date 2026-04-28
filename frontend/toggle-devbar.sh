#!/usr/bin/env bash
# toggle-devbar.sh — active ou désactive la DevBar sans toucher au code source
# Utilisation : bash toggle-devbar.sh  (depuis le dossier frontend/)

ENV_LOCAL="$(dirname "$0")/.env.local"

is_disabled() {
  [[ -f "$ENV_LOCAL" ]] && grep -q "VITE_DEVBAR=false" "$ENV_LOCAL"
}

if is_disabled; then
  # Actuellement OFF → on passe ON (supprime la ligne)
  sed -i '/VITE_DEVBAR=false/d' "$ENV_LOCAL"
  # Nettoie le fichier s'il est vide
  [[ ! -s "$ENV_LOCAL" ]] && rm -f "$ENV_LOCAL"
  echo "✅ DevBar ACTIVÉE — redémarrer le serveur Vite pour appliquer"
else
  # Actuellement ON → on passe OFF
  echo "VITE_DEVBAR=false" >> "$ENV_LOCAL"
  echo "🚫 DevBar DÉSACTIVÉE — redémarrer le serveur Vite pour appliquer"
fi
