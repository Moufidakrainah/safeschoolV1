# Guide d'utilisation de la stack ELK

## Présentation

La stack ELK (Elasticsearch, Logstash, Kibana) est intégrée au projet pour centraliser et visualiser les logs applicatifs.

| Composant | Rôle | Port exposé |
|---|---|---|
| **Elasticsearch** | Stockage et indexation des logs | `9201` |
| **Logstash** | Collecte, transformation, envoi vers ES | `5044` (TCP) |
| **Kibana** | Interface de visualisation | `5601` |

Les logs du backend NestJS sont envoyés à Logstash via TCP (JSON), qui les indexe dans Elasticsearch sous la forme `safeschool-logs-YYYY.MM.DD`.

---

## Démarrage

```bash
# Depuis la racine du projet
make up-elk

# Vérifier que les trois services sont healthy
docker compose ps
```

Attendre ~30 secondes que Elasticsearch soit disponible avant d'ouvrir Kibana.

---

## Accéder à Kibana

Ouvrir : **http://localhost:5601**

Lors de la première ouverture, Kibana peut demander un délai de démarrage supplémentaire (~1 min).

---

## Configurer un Data View (première fois seulement)

1. Dans le menu latéral → **Management** → **Stack Management**
2. **Kibana** → **Data Views** → **Create data view**
3. Remplir :
   - Name : `safeschool-logs`
   - Index pattern : `safeschool-logs-*`
   - Timestamp field : `@timestamp`
4. Cliquer **Save data view to Kibana**

---

## Explorer les logs — Discover

Menu → **Discover**

Sélectionner le data view `safeschool-logs` en haut à gauche.

### Filtres utiles par tag

Les logs sont automatiquement tagués selon leur type :

| Tag | Contenu |
|---|---|
| `auth` | Connexions, déconnexions, tentatives d'authentification |
| `http` | Requêtes HTTP entrantes (méthode, route, statut, durée) |
| `report` | Création, modification, consultation de signalements |
| `scoring` | Événements liés au quiz (résultats, scores) |
| `error` | Toutes les erreurs applicatives (niveau ERROR) |

Pour filtrer sur un tag : dans la barre de recherche KQL, saisir :
```
tags: "auth"
tags: "error"
tags: "report"
```

Pour combiner :
```
tags: "auth" and level: "ERROR"
```

---

## Envoyer un log de test manuellement

Pour vérifier que Logstash reçoit bien les données sans démarrer toute l'application :

```bash
echo '{"level":"INFO","type":"auth_event","message":"test connexion","user":"admin","timestamp":"2026-01-01T10:00:00Z"}' | nc localhost 5044
```

Attendre quelques secondes puis vérifier dans Discover que le document apparaît.

---

## Créer un dashboard

1. Menu → **Dashboards** → **Create dashboard**
2. **Add panel** → **Lens**
3. Exemples de visualisations utiles :

**Volume de logs par type (dernières 24h)**
- Axe X : `@timestamp` (par intervalles)
- Axe Y : Count
- Split by : `tags.keyword`

**Taux d'erreurs**
- Filtre : `level: "ERROR"`
- Visualisation : Metric (nombre total)

**Activité d'authentification**
- Filtre : `tags: "auth"`
- Axe X : `@timestamp`
- Axe Y : Count

---

## Vérifier que les logs applicatifs arrivent bien

Pour confirmer que l'application envoie réellement des logs (et pas seulement des tests manuels) :

1. Démarrer la stack complète : `make up`
2. Effectuer une action dans l'interface (connexion, création de signalement, lancement du quiz)
3. Dans Discover, chercher l'événement correspondant dans les logs récents
4. Vérifier que le champ `type` correspond à l'action effectuée (`auth_event`, `report_event`, `scoring_event`)

Si aucun log n'apparaît après une action : le logger backend n'envoie probablement pas à Logstash pour cette route. C'est un point à investiguer côté backend.

---

## Points de vigilance (conformité module Devops)

Le module ELK du sujet requiert :

- ✅ Elasticsearch pour stocker et indexer les logs
- ✅ Logstash pour collecter et transformer les logs
- ✅ Kibana pour la visualisation
- ⚠️ **Politique de rétention** : à configurer (Index Lifecycle Management dans ES)
- ⚠️ **Accès sécurisé** : `xpack.security.enabled=false` actuellement — à activer avant évaluation

### Configurer une politique de rétention basique

Dans Kibana → **Stack Management** → **Index Lifecycle Policies** → **Create policy** :
- Phase Hot : 7 jours
- Phase Delete : supprimer après 30 jours

Puis assigner la policy à l'index template `safeschool-logs-*`.


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