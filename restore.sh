#!/bin/bash

# ── Verifier qu'un fichier de backup est fourni ────────────
if [ -z "$1" ]; then
  echo "Usage : ./restore.sh <fichier_backup>"
  echo ""
  echo "Backups disponibles :"
  ls -lh ./backups/safeschool_*.sql 2>/dev/null || echo "Aucun backup trouve"
  exit 1
fi

BACKUP_FILE=$1
DB_USER="postgres"
DB_NAME="safeschool"
CONTAINER="safeschool_db"

# ── Verifier que le fichier existe ─────────────────────────
if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERREUR : Fichier introuvable : $BACKUP_FILE"
  exit 1
fi

# ── Verifier que le conteneur tourne ───────────────────────
if ! docker ps | grep -q $CONTAINER; then
  echo "ERREUR : Le conteneur $CONTAINER n'est pas demarre"
  exit 1
fi

# ── Confirmation ────────────────────────────────────────────
echo "ATTENTION : Cette action va ecraser toutes les donnees actuelles !"
echo "Fichier de restauration : $BACKUP_FILE"
read -p "Confirmer ? (oui/non) : " CONFIRM

if [ "$CONFIRM" != "oui" ]; then
  echo "Restauration annulee"
  exit 0
fi

# ── Restaurer ───────────────────────────────────────────────
echo "Restauration en cours..."
docker exec -i $CONTAINER psql -U $DB_USER $DB_NAME < $BACKUP_FILE

if [ $? -eq 0 ]; then
  echo "Restauration reussie depuis : $BACKUP_FILE"
else
  echo "ERREUR : La restauration a echoue"
  exit 1
fi
