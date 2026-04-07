
## SafeSchool

### Présentation du projet
SafeSchool est une application web permettant la gestion des signalements de harcèlement scolaire dans les établissements collégiens. Elle permet aux élèves de signaler des situations de harcèlement, analysées par une IA, classées par niveau de gravité et traitées par l'équipe administrative.

---

## Installation et démarrage

### Prérequis
- Installer **Docker** et **Docker Compose**
- Aucune installation de Node.js, npm, NestJS ou PostgreSQL n'est nécessaire

### Étapes

- Cloner le projet  
- Créer le fichier `.env` :
  ```bash
  cp .env.example .env
- Lancer le projet :
  ```bash
  docker-compose up --build



backend:

1. users.entity.ts (c'est quoi un utilisateur)
2. users.service.ts (comment on cree/chercher un utilisateur)
3. report.entity.ts (c'est quoi un signalement)
4. report.service.ts (comment on gere les signalement)
5. report.controller.ts (quelles sont les routes des signalements)
6. auth.service.ts (comment on se connecte)
7. auth.controller.ts (quelles sont les routes de onnexion)

TypeORM c est une librairie qu on install avec npm install typeorm
TypeORM est telecharger et mis dans backend/node_modules/typeorm/