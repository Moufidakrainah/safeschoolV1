## SafeSchool 🛡️

### Présentation du projet
SafeSchool est une application web permettant la gestion des signalements de harcèlement scolaire dans les établissements collégiens. Elle permet aux élèves de signaler des situations de harcèlement, analysées par une IA, classées par niveau de gravité et traitées par l'équipe administrative.

---

## Démarrage rapide

```bash
# 1. Cloner le projet
git clone git@github.com:hydnumrepandum68/ft_transcendence.git safeschool
cd safeschool

# 2. Créer le fichier .env
cp .env.example .env

# 3. Lancer tous les services
docker compose up --build

# 4. (Optionnel) Appliquer les données de test
# Sur Linux/Mac :
docker-compose exec -T database psql -U postgres safeschool < database/seed.sql
# Sur Windows PowerShell :
Get-Content database\seed.sql | docker-compose exec -T database psql -U postgres safeschool
```

---

## URLs d'accès

| URL | Service |
|-----|---------|
| http://localhost:5173 | Frontend React |
| http://localhost:5000 | Backend NestJS (API) |
| http://localhost:5601 | Kibana (logs et monitoring) |

---

## Comptes de test

| Email | Mot de passe | Rôle | Accès |
|-------|-------------|------|-------|
| `lotfi@safeschool.com` | `eleve123` | student | /student |
| `admin@safeschool.com` | `admin123` | admin | /dashboard |
| `directeur@safeschool.com` | `directeur123` | director | /dashboard |
| `prof@safeschool.com` | `prof123` | teacher | /reporter |
| `agent@safeschool.com` | `staff123` | staff | /reporter |

---

## Module ELK — Gestion des logs

La stack ELK (Elasticsearch, Logstash, Kibana) est intégrée dans le projet pour la gestion centralisée des logs.

**Ce qui est loggé :**
- Toutes les requêtes HTTP (méthode, URL, statut, temps de réponse, utilisateur)
- Événements d'authentification (connexion réussie/échouée, inscription)
- Création et mise à jour des signalements
- Détail du calcul de score IA (tous les critères)

**Politique de rétention :** les logs sont automatiquement supprimés après 30 jours.

**Accéder à Kibana :**
1. Ouvrir http://localhost:5601
2. Discover → Create data view
3. Index pattern : `safeschool-logs-*`
4. Timestamp field : `@timestamp`

---

## Système de scoring IA

Chaque signalement reçoit automatiquement un score de gravité (0-100) :

| Critère | Points max |
|---------|-----------|
| Type de harcèlement (physique/sexuel=25, cyber=15, verbal=10, exclusion=5) | 25 |
| Fréquence (tous les jours=20, 3x+=12, 2x=6, 1x=2) | 20 |
| Classe de la victime (6ème=8 ... 3ème=5) | 8 |
| Récidive du soupçonné (3x+=20, 2x=12, 1x=6) | 20 |
| Rôle du soupçonné (prof=20, staff=15, élève=0) | 20 |
| Analyse IA Groq | 20 |

**Grades :** ≥60 → 🔴 Critique | ≥40 → 🟠 Grave | ≥20 → 🟡 Moyen | <20 → 🟢 Faible

---

*SafeSchool — Ensemble contre le harcèlement scolaire*
