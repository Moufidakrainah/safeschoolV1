COMPOSE = docker compose

up:        ## Démarrer tous les services (détaché)
	$(COMPOSE) up -d

down:      ## Arrêter et supprimer les conteneurs
	$(COMPOSE) down

restart:   ## Redémarrer tous les services
	$(COMPOSE) restart

build:     ## (Re)construire les images sans cache
	$(COMPOSE) build --no-cache

rebuild:   ## Reconstruire et redémarrer
	$(COMPOSE) down && $(COMPOSE) build --no-cache && $(COMPOSE) up -d

logs:       ## Afficher les logs de tous les services (suivis)
	$(COMPOSE) logs -f

logs-fe:    ## Logs du frontend uniquement
	$(COMPOSE) logs -f frontend

logs-be:    ## Logs du backend uniquement
	$(COMPOSE) logs -f backend

logs-db:    ## Logs de la base de données
	$(COMPOSE) logs -f database

up-fe:      ## Démarrer uniquement frontend + backend + db
	$(COMPOSE) up -d frontend backend database

up-elk:     ## Démarrer la stack ELK (elasticsearch + logstash + kibana)
	$(COMPOSE) up -d elasticsearch logstash kibana

down-elk:   ## Arrêter la stack ELK
	$(COMPOSE) stop elasticsearch logstash kibana

seed:       ## Injecter les données de test (seed.sql)
	docker compose exec -T database psql -U postgres safeschool < database/seed.sql

clean:      ## Arrêter les conteneurs et supprimer les volumes orphelins
	$(COMPOSE) down --remove-orphans

prune:      ## Supprimer tous les volumes (perte de données)
	$(COMPOSE) down -v --remove-orphans

.PHONY: up down restart build rebuild \
		logs logs-fe logs-be logs-db \
        up-fe up-elk down-elk seed clean prune help \
