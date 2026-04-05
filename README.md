
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
