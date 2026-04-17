## SafeSchool 🛡️

### Présentation du projet
SafeSchool est une application web permettant la gestion des signalements de harcèlement scolaire dans les établissements collégiens. Elle permet aux élèves de signaler des situations de harcèlement, analysées par une IA, classées par niveau de gravité et traitées par l'équipe administrative.

---

## Démarrage rapide

```bash

# 1. Créer le fichier .env
cp .env.example .env

# 2. Lancer tous les services
docker compose up --build

# 3.Appliquer les données de test
docker compose exec -T database psql -U postgres safeschool < database/seed.sql

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

**Accéder à Kibana :**
1. Ouvrir http://localhost:5601
2. Discover → Create data view
3. Index pattern : `safeschool-logs-*`
4. Timestamp field : `@timestamp`

