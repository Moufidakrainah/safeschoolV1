
## SafeSchool

### Présentation du projet
SafeSchool est une application web permettant la gestion des signalements de harcèlement scolaire dans les établissements collégiens. Elle permet aux élèves de signaler des situations de harcèlement, analysées par une IA, classées par niveau de gravité et traitées par l'équipe administrative.

---

## Démarrage rapide

```bash
# 1. Cloner le projet
git clone git@github.com:hydnumrepandum68/ft_transcendence.git safeschool

# 2. Créer le fichier .env
cp .env.example .env

# 3. Appliquer les données de test
docker-compose exec -T database psql -U postgres safeschool < database/seed.sql

# 4. Lancer tous les services
docker-compose up --build
```

| URL | Service |
|-----|---------|
| http://localhost:5173 | Frontend React |
| http://localhost:5000 | Backend NestJS |
| http://localhost:8080 | pgAdmin (base de données) |

## Comptes de test


| Email | Mot de passe | Rôle |
|-------|-------------|------|
| `eleve@safeschool.com` | `eleve123` | student |
| `admin@safeschool.com` | `admin123` | admin |
| `directeur@safeschool.com` | `directeur123` | director |

## Backup

```bash
# Créer un backup
./backup.sh

# Restaurer un backup
./restore.sh ./backups/safeschool_YYYYMMDD_HHMMSS.sql
```

---

*SafeSchool — Ensemble contre le harcèlement scolaire* 