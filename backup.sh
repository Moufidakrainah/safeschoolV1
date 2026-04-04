#!/bin/bash

# ── Configuration ──────────────────────────────────────────
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/safeschool_$DATE.sql"
DB_USER="postgres"
DB_NAME="safeschool"
CONTAINER="safeschool_db"

# ── Creer le dossier backups si inexistant ──────────────────
mkdir -p $BACKUP_DIR

# ── Verifier que le conteneur tourne ───────────────────────
if ! docker ps | grep -q $CONTAINER; then
  echo "ERREUR : Le conteneur $CONTAINER n'est pas demarre"
  echo "Lance d'abord : docker-compose up"
  exit 1
fi

# ── Faire le backup ─────────────────────────────────────────
echo "Backup en cours..."
docker exec $CONTAINER pg_dump -U $DB_USER $DB_NAME > $BACKUP_FILE

# ── Verifier que le backup est valide ───────────────────────
if [ $? -eq 0 ] && [ -s $BACKUP_FILE ]; then
  SIZE=$(du -h $BACKUP_FILE | cut -f1)
  echo "Backup reussi : $BACKUP_FILE ($SIZE)"
else
  echo "ERREUR : Le backup a echoue"
  rm -f $BACKUP_FILE
  exit 1
fi

# ── Garder uniquement les 7 derniers backups ────────────────
ls -t $BACKUP_DIR/safeschool_*.sql | tail -n +8 | xargs -r rm
echo "Anciens backups nettoyes (gardes : 7 derniers)"

# ── Afficher tous les backups disponibles ───────────────────
echo ""
echo "Backups disponibles :"
ls -lh $BACKUP_DIR/safeschool_*.sql 2>/dev/null || echo "Aucun backup"
