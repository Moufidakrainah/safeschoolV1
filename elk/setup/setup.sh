#!/bin/sh
# =============================================================
# setup.sh - Configuration initiale de la stack ELK
# Ce script s'execute une seule fois au demarrage pour :
#   1. Attendre qu'Elasticsearch et Kibana soient prets
#   2. Creer la politique ILM (retention 30 jours)
#   3. Creer le template d'index pour les logs SafeSchool
#   4. Importer le Data View Kibana
# =============================================================

echo "Attente qu'Elasticsearch soit pret..."

until curl -s http://elasticsearch:9200/_cluster/health > /dev/null 2>&1; do
  sleep 2
done

echo "Elasticsearch est pret."

# -- 1. Politique de retention ILM ----------------------------
# Suppression automatique des logs apres 30 jours
echo "Creation de la politique ILM (retention 30 jours)..."
curl -s -X PUT "http://elasticsearch:9200/_ilm/policy/safeschool-logs-policy" \
  -H "Content-Type: application/json" \
  -d @/setup/ilm-policy.json

echo ""

# -- 2. Template d'index --------------------------------------
# Applique la politique ILM a tous les index safeschool-logs-*
echo "Creation du template d'index..."
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

# -- 3. Import du Data View Kibana ----------------------------
# Attend que Kibana soit pret avant d'importer
echo "Attente que Kibana soit pret..."

until curl -s http://kibana:5601/api/status | grep -q '"level":"available"' 2>/dev/null; do
  sleep 5
done

echo "Kibana est pret."
echo "Import du Data View safeschool-logs..."

curl -s -X POST "http://kibana:5601/api/saved_objects/_import?overwrite=true" \
  -H "kbn-xsrf: true" \
  -F file=@/setup/kibana-data-view.ndjson

echo ""
echo "Configuration ELK terminee."
echo "Kibana accessible sur http://localhost:5601"
echo "Retention des logs : 30 jours"