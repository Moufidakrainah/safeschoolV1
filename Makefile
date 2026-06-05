
COMPOSE = docker compose
ENV_FILE = .env
SEED_FILE = database/seed.sql
SCHEMA_WAIT_RETRIES = 45
SCHEMA_WAIT_DELAY = 2


# == COMMANDES PRINCIPALES ==

all: up ## Alias de up

help: ## Afficher les cibles disponibles
	@echo "\nCibles :"
	@grep -E '^[a-zA-Z0-9_.-]+:.*## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*## "} {printf "  \033[34m%-14s\033[0m %s\n", $$1, $$2}'
	@echo ""

check-env: ## Vérifier que le fichier .env existe
	@test -f $(ENV_FILE) || { echo "$(ENV_FILE) manquant."; exit 1; }

up: check-env ## Construire, démarrer et injecter les données si base vide
	$(COMPOSE) up -d --build
	$(MAKE) seed-if-empty

up-app: check-env ## Démarrer uniquement frontend, backend et database (sans ELK ni pgadmin)
	$(COMPOSE) up -d --no-deps --build frontend backend database
	$(MAKE) seed-if-empty

start: check-env ## Démarrer les services sans reconstruire les images
	$(COMPOSE) up -d
	$(MAKE) seed-if-empty

down: ## Arrêter tous les services
	$(COMPOSE) down

re: ## Remettre à zéro et redémarrer
	$(MAKE) prune
	$(MAKE) up


# == BUILD ==

build: check-env ## Construire les images sans démarrer
	$(COMPOSE) build

rebuild: check-env ## Reconstruire sans cache et redémarrer
	$(COMPOSE) down
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d
	$(MAKE) seed-if-empty

# == SERVICE PAR SERVICE ==

up-fe: check-env ## Démarrer uniquement le frontend, backend et database
	$(COMPOSE) up -d frontend backend database
	$(MAKE) seed-if-empty

up-be: check-env ## Démarrer backend et database seulement
	$(COMPOSE) up -d backend database
	$(MAKE) seed-if-empty

up-elk: check-env ## Démarrer la stack ELK
	$(COMPOSE) up -d elasticsearch logstash kibana

down-elk: ## Arrêter la stack ELK
	$(COMPOSE) down elasticsearch logstash kibana


# === LOGS ===

logs: ## Suivre les logs de tous les services
	$(COMPOSE) logs -f

logs-fe: ## Suivre les logs du frontend
	$(COMPOSE) logs -f frontend

logs-be: ## Suivre les logs du backend
	$(COMPOSE) logs -f backend

logs-db: ## Suivre les logs de la base de données
	$(COMPOSE) logs -f database


#  === BASE DE DONNÉES ===

wait-schema: # Attendre que TypeORM crée le schéma
	@attempt=0; \
	until $(COMPOSE) exec -T database sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema = '\''public'\'' AND table_name = '\''users'\'';"' | grep -q 1; do \
		attempt=$$((attempt + 1)); \
		if [ $$attempt -ge $(SCHEMA_WAIT_RETRIES) ]; then \
			echo "Schéma PostgreSQL indisponible. Vérifiez les logs du backend et de la base."; \
			exit 1; \
		fi; \
		sleep $(SCHEMA_WAIT_DELAY); \
	done

seed: wait-schema ## Injecter les données de démonstration
	$(COMPOSE) exec -T database sh -c 'psql -v ON_ERROR_STOP=1 -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"' < $(SEED_FILE)

seed-if-empty: wait-schema ## Seeder seulement si la base est vide
	@user_count="$$($(COMPOSE) exec -T database sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB" -tAc "SELECT COUNT(*) FROM public.users;"' | tr -d '[:space:]')"; \
	if [ "$$user_count" = "0" ]; then \
		echo "Base vide : injection des données de démonstration."; \
		$(MAKE) seed; \
	else \
		echo "Base déjà initialisée : seed ignoré."; \
	fi


# === NETTOYAGE ===

clean: ## Supprimer les conteneurs
	$(COMPOSE) down --remove-orphans

prune: ## Supprimer les conteneurs et les volumes
	$(COMPOSE) down -v --remove-orphans

fclean: prune ## Nettoyage complet : conteneurs, volumes, images, cache
	docker system prune -af


# === UTILITAIRES ===

ps: ## Afficher l'état des conteneurs
	$(COMPOSE) ps

images: ## Afficher les images du projet (par tag)
	docker images | grep -E "transcendence|safeschool|elasticsearch|logstash|kibana|postgres"

volumes: ## Lister les volumes Docker du projet
	docker volume ls | grep transcendence_ || docker volume ls

stats: ## Afficher les statistiques des conteneurs
	$(COMPOSE) stats --no-stream

top: ## Afficher les processus dans les conteneurs
	$(COMPOSE) top

.PHONY: all help check-env up up-app down build rebuild re up-be up-fe up-elk down-elk logs logs-fe logs-be logs-db wait-schema seed seed-if-empty clean prune fclean ps images volumes stats top logs-db