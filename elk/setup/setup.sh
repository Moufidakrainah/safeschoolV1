#!/bin/sh
# Importe les Data Views et dashboards dans Kibana.
# S'execute apres que setup-users.sh ait cree les utilisateurs
# et que Kibana soit pret.

echo "Attente que Kibana soit pret..."
until curl -s http://kibana:5601/api/status | grep -q '"level":"available"' 2>/dev/null; do
  sleep 5
done
echo "Kibana est pret."

echo "Import du Data View safeschool-logs..."
curl -s -X POST "http://kibana:5601/api/saved_objects/_import?overwrite=true" \
  -H "kbn-xsrf: true" \
  -u "elastic:${ELASTIC_PASSWORD}" \
  -F file=@/setup/kibana-data-view.ndjson
echo ""

echo "Import du Dashboard SafeSchool - Logs Overview..."
curl -s -X POST "http://kibana:5601/api/saved_objects/_import?overwrite=true" \
  -H "kbn-xsrf: true" \
  -u "elastic:${ELASTIC_PASSWORD}" \
  -F file=@/setup/kibana-dashboard.ndjson
echo ""

echo "Configuration Kibana terminee."
