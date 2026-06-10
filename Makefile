
COMPOSE = docker compose
COMPOSE_PROD = docker compose -f docker-compose.yml -f docker-compose.prod.yml
CERT_DIR = nginx/certs
# IP intégrée au certificat (SAN). Auto-détectée ; surchargeable :
#   make certs CERT_IP=192.168.1.42
CERT_IP ?= $(shell hostname -I 2>/dev/null | awk '{print $$1}')
ENV_FILE = .env
SEED_FILE = database/seed.sql
SCHEMA_WAIT_RETRIES = 45
SCHEMA_WAIT_DELAY = 2


# == COMMANDES PRINCIPALES ==

all: prod ## Par défaut : démarrage en mode production (nginx + HTTPS)

help: ## Afficher les cibles disponibles
	@echo "\nCibles :"
	@grep -E '^[a-zA-Z0-9_.-]+:.*## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*## "} {printf "  \033[34m%-14s\033[0m %s\n", $$1, $$2}'
	@echo ""

check-env: ## Vérifier que le fichier .env existe
	@test -f $(ENV_FILE) || { echo "$(ENV_FILE) manquant."; exit 1; }

up: check-env ## Construire, démarrer et injecter les données si base vide
	@start=$$(date +%s); \
	$(COMPOSE) up -d --build; \
	$(MAKE) seed-if-empty; \
	end=$$(date +%s); \
	echo "Temps de build : $$(((end - start) / 60))m $$(((end - start) % 60))s"

dev: up ## Mode développement (hot reload, sans nginx) — alias de up

down: ## Arrêter tous les services
	$(COMPOSE) down


# == PRODUCTION (nginx + HTTPS) ==

prod: check-env certs ## Construire et démarrer en mode production (nginx + TLS)
	@start=$$(date +%s); \
	$(COMPOSE_PROD) up -d --build; \
	$(MAKE) seed-if-empty; \
	end=$$(date +%s); \
	echo "Temps de build : $$(((end - start) / 60))m $$(((end - start) % 60))s"; \
	echo "Prod démarrée : https://localhost (certificat auto-signé, à accepter dans le navigateur)"

prod-down: ## Arrêter la stack de production
	$(COMPOSE_PROD) down

prod-logs: ## Suivre les logs de la stack de production
	$(COMPOSE_PROD) logs -f

certs: ## Générer des certificats TLS auto-signés (SAN: localhost + IP LAN) si absents
	@test -f $(CERT_DIR)/privkey.pem || $(MAKE) certs-renew

certs-renew: ## (Re)générer les certificats TLS, en écrasant les existants
	@mkdir -p $(CERT_DIR); \
	ip="$(CERT_IP)"; [ -z "$$ip" ] && ip="127.0.0.1"; \
	echo "Génération du certificat (CN=localhost, SAN=localhost,127.0.0.1,$$ip)"; \
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout $(CERT_DIR)/privkey.pem \
		-out $(CERT_DIR)/fullchain.pem \
		-subj "/CN=localhost" \
		-addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:$$ip" 2>/dev/null; \
	echo "Certificats générés dans $(CERT_DIR)/"

re: ## Remettre à zéro et redémarrer
	$(MAKE) prune
	$(MAKE) up


# == BUILD ==

build: check-env ## Construire les images sans démarrer
	$(COMPOSE) build

rebuild: check-env ## Reconstruire sans cache et redémarrer
	@start=$$(date +%s); \
	$(COMPOSE) down; \
	$(COMPOSE) build --no-cache; \
	$(COMPOSE) up -d; \
	$(MAKE) seed-if-empty; \
	end=$$(date +%s); \
	echo "Temps de build : $$(((end - start) / 60))m $$(((end - start) % 60))s"


# == SERVICE PAR SERVICE ==

up-app: check-env ## Démarrer uniquement frontend, backend et database
	@start=$$(date +%s); \
	$(COMPOSE) up -d --no-deps --build frontend backend database; \
	$(MAKE) seed-if-empty; \
	end=$$(date +%s); \
	echo "Temps de build : $$(((end - start) / 60))m $$(((end - start) % 60))s"

start: check-env ## Démarrer les services sans reconstruire les images
	$(COMPOSE) up -d

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

logs-elk: ## Suivre les logs de la stack ELK
	$(COMPOSE) logs -f elasticsearch logstash kibana


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

.PHONY: all help check-env up dev down prod prod-down prod-logs certs certs-renew re build rebuild up-app start up-be up-elk down-elk logs logs-fe logs-be logs-db logs-elk wait-schema seed seed-if-empty clean prune fclean ps images volumes stats top