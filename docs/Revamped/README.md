*This project has been created as part of the 42 curriculum by mdoan, mobougri, quclaque, eguhtman.*

---

## Description

<!-- Nom du projet + présentation claire de son but -->

**SafeSchool** is ...

### Key Features

- <!-- feature 1 -->
- <!-- feature 2 -->
- <!-- feature 3 -->

---

## Instructions

### Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Docker | <!-- version --> | |
| Docker Compose | v2+ | Use `docker compose`, not `docker-compose` |
| Make | <!-- version --> | |
| <!-- other --> | | |

### Environment Setup

<!-- Expliquer le fichier .env : quelles variables, comment le créer -->

```bash
cp .env.example .env
# Then fill in the required values:
# DB_NAME=...
# DB_USER=...
# DB_PASSWORD=...
# ...
```

### Run the Project

```bash
# Clone the repository
git clone ...
cd ...

# Start all services
make all

# Seed the database (optional, for development data)
make seed
```

### Stop the Project

```bash
make down       # Stop containers
make fclean     # Stop + remove volumes (⚠️ deletes all data)
```

---

## Resources

### References

<!-- Documentation officielle, articles, tutoriels utilisés -->

- [React documentation](https://react.dev)
- [NestJS documentation](https://nestjs.com)
- [PostgreSQL documentation](https://www.postgresql.org/docs/)
- [Docker documentation](https://docs.docker.com)
- <!-- other references -->
- [Color contrast checker] (https://www.acquia.com/fr/products/acquia-web-governance/tools/color-contrast-checker)

### AI Usage

<!-- Décrire comment l'IA a été utilisée, pour quelles tâches, quelles parties du projet -->

AI tools were used during this project for the following tasks:
- <!-- e.g. code review suggestions -->
- <!-- e.g. debugging assistance -->
- <!-- e.g. documentation drafting -->

---

## Team Information

*This project has been created as part of the 42 curriculum by <!-- login1 -->, <!-- login2 -->, <!-- login3 -->.*

| Login | Role(s) | Responsibilities |
|-------|---------|-----------------|
| <!-- login1 --> | <!-- PO / PM / Tech Lead / Developer --> | <!-- brief description --> |
| <!-- login2 --> | <!-- role --> | <!-- brief description --> |
| <!-- login3 --> | <!-- role --> | <!-- brief description --> |

---

## Project Management

### Organization

<!-- Comment le travail a été réparti, les réunions, les sprints -->

### Tools

<!-- GitHub Issues, Trello, Notion, etc. -->

### Communication

<!-- Discord, Slack, etc. -->

---

## Technical Stack

**Frontend :** React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, Axios, Socket.io-client, i18next, Recharts

**Backend :** NestJS 11, TypeScript, TypeORM, PostgreSQL (driver `pg`), Passport/JWT, bcrypt, Socket.io, Winston, class-validator

**Database :** PostgreSQL 15

**Infrastructure :** Docker Compose, ELK Stack (Elasticsearch + Logstash + Kibana) 8.12

**Outils de dev :** ESLint, Prettier, Jest


### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19 | UI framework |
| TypeScript | ~5.9 | Type safety |
| Vite | 8 | Build tool & dev server |
| Tailwind CSS | 4 | Styling |
| shadcn/ui | 4 | Component library |
| react-router-dom | 7 | Client-side routing |
| socket.io-client | 4 | Real-time communication |
| i18next | 26 | Internationalization |
| recharts | 3 | Charts & data visualization |
| lucide-react | 1 | Icon library |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| NestJS | <!-- version --> | Backend framework |
| TypeScript | <!-- version --> | Type safety |
| <!-- ORM --> | | Database access |
| socket.io | | Real-time communication |
| <!-- other --> | | |

### Database

| Technology | Version | Purpose |
|-----------|---------|---------|
| PostgreSQL | 15 | Main relational database |

**Why PostgreSQL?**
<!-- Justification du choix -->

### Infrastructure & Logging

| Technology | Purpose |
|-----------|---------|
| Docker / Docker Compose | Containerization |
| Elasticsearch 8.12 | Log storage & search |
| Logstash 8.12 | Log ingestion pipeline |
| Kibana 8.12 | Log visualization |

### Justification for Major Technical Choices

<!-- Expliquer les choix structurants : pourquoi NestJS, pourquoi React, pourquoi ELK, etc. -->

---

## Database Schema

<!-- Représentation visuelle ou description de la structure de la base -->

### Tables and Relationships

<!-- Diagramme ER ou liste des tables -->

```
users
  ├── id (PK)
  ├── ...
  └── ...

<!-- other tables -->
```

### Key Fields and Data Types

| Table | Field | Type | Description |
|-------|-------|------|-------------|
| <!-- table --> | id | UUID / SERIAL | Primary key |
| | | | |

---

## Features List

| Feature | Description | Team member(s) |
|---------|-------------|---------------|
| <!-- feature --> | <!-- description --> | <!-- login --> |
| | | |

---

## Modules

| Module | Type | Points | Description | Team member(s) |
|--------|------|--------|-------------|---------------|
| <!-- module name --> | Major | 2 | <!-- description + justification --> | <!-- login --> |
| <!-- module name --> | Minor | 1 | | |

**Total points: <!-- X Major × 2 + Y Minor × 1 = Z pts -->**

---

## Individual Contributions

### <!-- login1 -->

- <!-- feature / module / component -->
- <!-- challenges faced and how they were overcome -->

### <!-- login2 -->

- 
- 

### <!-- login3 -->

- 
- 

---

## Additional Information

<!-- Usage documentation, known limitations, license, credits, etc. -->

### Known Limitations

- <!-- limitation 1 -->

### License

<!-- MIT / 42 / etc. -->
