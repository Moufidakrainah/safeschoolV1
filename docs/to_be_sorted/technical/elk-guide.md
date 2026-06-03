# Guide d'utilisation ELK

## Présentation

La stack ELK permet de centraliser et de visualiser les logs applicatifs.

| Composant | Rôle | Port exposé |
|---|---|---|
| **Logstash** | Collecte, transformation, envoi vers ES | `5044` |
| **Elasticsearch** | Stockage et indexation des logs | `9201` |
| **Kibana** | Interface de visualisation | `5601` |

Les logs du backend NestJS sont envoyés au format JSON à Logstash via TCP. Logstash les indexe dans Elasticsearch sous la forme `safeschool-logs-YYYY.MM.DD`.

## Démarrage

```bash
# Depuis la racine du projet
make up-elk

# Vérifier que les trois services sont healthy
docker compose ps
```

Attendre ~30 secondes que Elasticsearch soit disponible avant d'ouvrir Kibana.


## Accéder à Kibana

Ouvrir : **http://localhost:5601**

Lors de la première ouverture, Kibana peut demander un délai de démarrage supplémentaire (~1 min).


## Configurer un Data View (première fois seulement)

1. Dans le menu latéral → **Management** → **Stack Management**
2. **Kibana** → **Data Views** → **Create data view**
3. Remplir :
   - Name : `safeschool-logs`
   - Index pattern : `safeschool-logs-*`
   - Timestamp field : `@timestamp`
4. Cliquer **Save data view to Kibana**



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


## Envoyer un log de test manuellement

Pour vérifier que Logstash reçoit bien les données sans démarrer toute l'application :

```bash
echo '{"level":"INFO","type":"auth_event","message":"test connexion","user":"admin","timestamp":"2026-01-01T10:00:00Z"}' | nc localhost 5044
```

Attendre quelques secondes puis vérifier dans Discover que le document apparaît.

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

## Vérifier que les logs applicatifs arrivent bien

Pour confirmer que l'application envoie réellement des logs (et pas seulement des tests manuels) :

1. Démarrer la stack complète : `make up`
2. Effectuer une action dans l'interface (connexion, création de signalement, lancement du quiz)
3. Dans Discover, chercher l'événement correspondant dans les logs récents
4. Vérifier que le champ `type` correspond à l'action effectuée (`auth_event`, `report_event`, `scoring_event`)

Si aucun log n'apparaît après une action : le logger backend n'envoie probablement pas à Logstash pour cette route. C'est un point à investiguer côté backend.

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
