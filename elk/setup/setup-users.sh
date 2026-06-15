#!/bin/sh
# Cree les roles et utilisateurs systeme ELK.
# Doit se terminer AVANT que Kibana et Logstash demarrent.

ES="http://elastic:${ELASTIC_PASSWORD}@elasticsearch:9200"

echo "Attente qu'Elasticsearch soit pret..."
until curl -s "${ES}/_cluster/health" > /dev/null 2>&1; do
  sleep 2
done
echo "Elasticsearch est pret."

echo "Creation du role logstash_writer..."
until curl -s -o /dev/null -w "%{http_code}" -X PUT "${ES}/_security/role/logstash_writer" \
  -H "Content-Type: application/json" \
  -d '{
    "cluster": ["monitor", "manage_index_templates"],
    "indices": [{
      "names": ["safeschool-logs-*"],
      "privileges": ["create_index", "create", "index", "write"]
    }]
  }' | grep -qE "^2"; do
  echo "  -> reessai..."
  sleep 3
done
echo "Role logstash_writer cree."

echo "Mise a jour du mot de passe kibana_system..."
until curl -s -o /dev/null -w "%{http_code}" -X POST "${ES}/_security/user/kibana_system/_password" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"${KIBANA_SYSTEM_PASSWORD}\"}" | grep -qE "^2"; do
  echo "  -> reessai..."
  sleep 3
done
echo "Mot de passe kibana_system mis a jour."

echo "Creation de l'utilisateur logstash_internal..."
until curl -s -o /dev/null -w "%{http_code}" -X PUT "${ES}/_security/user/logstash_internal" \
  -H "Content-Type: application/json" \
  -d "{
    \"password\": \"${LOGSTASH_INTERNAL_PASSWORD}\",
    \"roles\": [\"logstash_writer\"],
    \"full_name\": \"Logstash Internal\"
  }" | grep -qE "^2"; do
  echo "  -> reessai..."
  sleep 3
done
echo "Utilisateur logstash_internal cree."

echo "Creation de la politique ILM (retention 30 jours)..."
curl -s -X PUT "${ES}/_ilm/policy/safeschool-logs-policy" \
  -H "Content-Type: application/json" \
  -d @/setup/ilm-policy.json
echo ""

echo "Creation du template d'index..."
curl -s -X PUT "${ES}/_index_template/safeschool-logs-template" \
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

echo "Utilisateurs et configuration ELK initialises."
