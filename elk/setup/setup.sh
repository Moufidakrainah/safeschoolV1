#!/bin/sh
# =============================================================
# setup.sh — Configuration initiale d'Elasticsearch
# Ce script tourne une seule fois au démarrage pour :
#   1. Créer la politique ILM (rétention 30 jours)
#   2. Créer le template d'index pour les logs SafeSchool
# =============================================================

echo "⏳ Attente qu'Elasticsearch soit prêt..."

# Attend qu'Elasticsearch réponde avant de continuer
until curl -s http://elasticsearch:9200/_cluster/health > /dev/null 2>&1; do
  sleep 2
done

echo "✅ Elasticsearch est prêt !"

# ── 1. Créer la politique de rétention (ILM) ──────────────────
# Les logs sont supprimés automatiquement après 30 jours
echo "📋 Création de la politique ILM (rétention 30 jours)..."
curl -s -X PUT "http://elasticsearch:9200/_ilm/policy/safeschool-logs-policy" \
  -H "Content-Type: application/json" \
  -d @/setup/ilm-policy.json

echo ""
echo "📋 Création du template d'index..."

# ── 2. Créer le template d'index ────────────────────────────────
# Applique automatiquement la politique ILM à tous les index safeschool-logs-*
curl -s -X PUT "http://elasticsearch:9200/_index_template/safeschool-logs-template" \
  -H "Content-Type: application/json" \
  -d '{
    "index_patterns": ["safeschool-logs-*"],
    "template": {
      "settings": {
        "index.lifecycle.name": "safeschool-logs-policy",
        "number_of_shards": 1,
        "number_of_replicas": 0
      },
      "mappings": {
        "properties": {
          "@timestamp":   { "type": "date" },
          "level":        { "type": "keyword" },
          "type":         { "type": "keyword" },
          "application":  { "type": "keyword" },
          "message":      { "type": "text" },
          "userId":       { "type": "keyword" },
          "userRole":     { "type": "keyword" },
          "method":       { "type": "keyword" },
          "url":          { "type": "keyword" },
          "statusCode":   { "type": "integer" },
          "responseTime": { "type": "keyword" },
          "grade":        { "type": "keyword" },
          "score":        { "type": "integer" }
        }
      }
    }
  }'

echo ""
echo "✅ Configuration ELK terminée !"
echo "   → Kibana : http://localhost:5601"
echo "   → Logs supprimés automatiquement après 30 jours"
