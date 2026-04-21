#!/bin/bash

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/safeschool_$DATE.sql"
DB_USER="postgres"
DB_NAME="safeschool"
CONTAINER="safeschool_db"

mkdir -p $BACKUP_DIR

if ! docker ps | grep -q $CONTAINER; then
  echo "ERREUR : Le conteneur $CONTAINER n'est pas démarré"
  exit 1
fi

echo "Backup en cours..."
docker exec $CONTAINER pg_dump -U $DB_USER $DB_NAME > $BACKUP_FILE

if [ $? -eq 0 ] && [ -s $BACKUP_FILE ]; then
  SIZE=$(du -h $BACKUP_FILE | cut -f1)
  echo "Backup réussi : $BACKUP_FILE ($SIZE)"
else
  echo "ERREUR : Le backup a échoué"
  rm -f $BACKUP_FILE
  exit 1
fi

ls -t $BACKUP_DIR/safeschool_*.sql | tail -n +8 | xargs -r rm
echo "Anciens backups nettoyés (7 derniers conservés)"

echo ""
echo "Backups disponibles :"
ls -lh $BACKUP_DIR/safeschool_*.sql 2>/dev/null || echo "Aucun backup"
