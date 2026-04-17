#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage : ./restore.sh <fichier_backup>"
  echo ""
  echo "Backups disponibles :"
  ls -lh ./backups/safeschool_*.sql 2>/dev/null || echo "Aucun backup trouvé"
  exit 1
fi

BACKUP_FILE=$1
DB_USER="postgres"
DB_NAME="safeschool"
CONTAINER="safeschool_db"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERREUR : Fichier introuvable : $BACKUP_FILE"
  exit 1
fi

if ! docker ps | grep -q $CONTAINER; then
  echo "ERREUR : Le conteneur $CONTAINER n'est pas démarré"
  exit 1
fi

echo "ATTENTION : Cette action va écraser toutes les données actuelles !"
echo "Fichier de restauration : $BACKUP_FILE"
read -p "Confirmer ? (oui/non) : " CONFIRM

if [ "$CONFIRM" != "oui" ]; then
  echo "Restauration annulée"
  exit 0
fi

echo "Restauration en cours..."
docker exec -i $CONTAINER psql -U $DB_USER $DB_NAME < $BACKUP_FILE

if [ $? -eq 0 ]; then
  echo "Restauration réussie depuis : $BACKUP_FILE"
else
  echo "ERREUR : La restauration a échoué"
  exit 1
fi
