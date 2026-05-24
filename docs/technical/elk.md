Le chemin complet d'un log :
Ton backend NestJS
      ↓ envoie un log
Logstash
      ↓ transforme et nomme l'index "safeschool-logs-2026.05.23"
Elasticsearch
      ↓ stocke dans l'index
Kibana
      ↓ lit via le pattern "safeschool-logs-*"
      ↓ affiche dans Discover et les dashboards


Le rôle de chaque composant :
Elasticsearch  → base de données qui stocke et indexe les logs
Logstash       → collecte les logs de ton backend et les transforme
Kibana         → interface web pour visualiser les logs
Le flux des données :
Backend NestJS → Logstash → Elasticsearch → Kibana
Pourquoi c'est utile :
→ centraliser tous les logs en un endroit
→ rechercher rapidement dans des milliers de logs
→ détecter des anomalies (pics d'erreurs, lenteurs)
→ garder un historique même si le conteneur redémarre

Ce que tu dois avoir en place
✅ ELK qui tourne dans Docker
✅ Les logs du backend qui arrivent dans Elasticsearch
✅ Une Data View configurée dans Kibana (safeschool-logs-*)
✅ Au moins un dashboard avec quelques visualisations
✅ Les volumes persistants (esdata, kibanadata)

1. Log retention and archiving policies
C'est la politique de conservation des logs — combien de temps tu gardes les logs avant de les supprimer automatiquement.
Dans Kibana c'est géré via ILM (Index Lifecycle Management) :
Kibana → Stack Management → Index Lifecycle Policies → Create policy
Une politique typique pour ton projet :
Phase Hot (logs récents)    → 7 jours  → logs consultables
Phase Warm (logs anciens)   → 23 jours → logs compressés
Phase Delete (suppression)  → 30 jours → logs supprimés
Concrètement dans Kibana :
Create policy
→ Name : safeschool-retention
→ Hot phase : 7 days
→ Delete phase : enable → 30 days
→ Save policy
Puis lier la politique à ton index pattern :
Stack Management → Index Templates
→ cherche safeschool-logs
→ ajouter la policy safeschool-retention

2. Secure access to all components
C'est protéger Elasticsearch et Kibana pour que n'importe qui ne puisse pas y accéder.
Actuellement dans ton docker-compose.yml tu as :
yaml- xpack.security.enabled=false  # ← aucune sécurité
Option 1 — Activer xpack.security (recommandé)
yamlelasticsearch:
  environment:
    - xpack.security.enabled=true
    - ELASTIC_PASSWORD=motdepassefort

kibana:
  environment:
    - ELASTICSEARCH_USERNAME=kibana_system
    - ELASTICSEARCH_PASSWORD=motdepassefort
Option 2 — Restreindre les ports (plus simple)
Ne pas exposer Elasticsearch sur l'extérieur — uniquement accessible depuis le réseau Docker interne :
yamlelasticsearch:
  # ports:           ← supprimer l'exposition publique
  #   - "9201:9200"  ← plus accessible depuis l'extérieur
  expose:
    - "9200"         ← uniquement accessible aux autres conteneurs
Kibana reste accessible sur localhost:5601 mais Elasticsearch n'est plus directement accessible depuis l'extérieur.

Ce que je te conseille pour l'évaluation
Fais les deux mais commence par le plus simple :
1. Option 2 pour la sécurité → 10 minutes
   → supprimer l'exposition publique d'Elasticsearch

2. ILM pour la rétention → 20 minutes
   → créer la policy dans Kibana