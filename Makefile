COMPOSE = docker compose

# ── Cycle de vie ────────────────────────────────────────────────────────────

up:        ## Démarrer tous les services
	$(COMPOSE) up -d

down:      ## Arrêter les conteneurs
	$(COMPOSE) down

rebuild:   ## Reconstruire les images et redémarrer (no-cache)
	$(COMPOSE) down && $(COMPOSE) build --no-cache && $(COMPOSE) up -d


# ── Démarrages partiels ──────────────────────────────────────────────────────

up-fe:     ## Démarrer FE + BE + db sans ELK
	$(COMPOSE) up -d frontend backend database

up-elk:    ## Démarrer la stack ELK
	$(COMPOSE) up -d elasticsearch logstash kibana

down-elk:  ## Arrêter la stack ELK
	$(COMPOSE) stop elasticsearch logstash kibana


# ── Logs ────────────────────────────────────────────────────────────────────

logs:      ## Logs de tous les services
	$(COMPOSE) logs -f

logs-fe:   ## Logs frontend
	$(COMPOSE) logs -f frontend

logs-be:   ## Logs backend
	$(COMPOSE) logs -f backend


# ── Données ─────────────────────────────────────────────────────────────────

seed:      ## Injecter les données de test
	docker compose exec -T database psql -U postgres safeschool < database/seed.sql
	

# ── Nettoyage ────────────────────────────────────────────────────────────────

clean:     ## Supprimer les conteneurs et volumes orphelins
	$(COMPOSE) down --remove-orphans

prune:     ## Supprimer tous les volumes
	$(COMPOSE) down -v --remove-orphans

.PHONY: up down rebuild up-fe up-elk down-elk logs logs-fe logs-be seed clean prune help
