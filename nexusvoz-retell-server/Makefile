# Makefile para NexusVoz Retell AI Server

.PHONY: help build run dev stop clean logs test lint format

# Variables
DOCKER_IMAGE_NAME=nexusvoz-retell-server
CONTAINER_NAME=nexusvoz-retell-server
PYTHON=python3
PIP=pip3

help: ## Mostrar ayuda
	@echo "Comandos disponibles:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# === DESARROLLO LOCAL ===

install: ## Instalar dependencias localmente
	$(PIP) install -r requirements.txt

dev: ## Ejecutar servidor en modo desarrollo
	$(PYTHON) main.py

dev-reload: ## Ejecutar servidor con recarga automática
	uvicorn main:app --host 0.0.0.0 --port 8000 --reload --log-level info

test: ## Ejecutar tests
	$(PYTHON) -m pytest tests/ -v

lint: ## Ejecutar linting
	flake8 main.py --max-line-length=120 --ignore=E501,W503
	pylint main.py --disable=C0103,C0114,C0116

format: ## Formatear código
	black main.py --line-length=120
	isort main.py

# === DOCKER ===

build: ## Construir imagen Docker
	docker build -t $(DOCKER_IMAGE_NAME) .

run: ## Ejecutar contenedor Docker
	docker run -d \
		--name $(CONTAINER_NAME) \
		--env-file .env \
		-p 8000:8000 \
		-v $(PWD)/logs:/app/logs \
		$(DOCKER_IMAGE_NAME)

stop: ## Detener contenedor
	docker stop $(CONTAINER_NAME) || true
	docker rm $(CONTAINER_NAME) || true

restart: stop run ## Reiniciar contenedor

logs: ## Ver logs del contenedor
	docker logs -f $(CONTAINER_NAME)

shell: ## Acceder al shell del contenedor
	docker exec -it $(CONTAINER_NAME) /bin/bash

# === DOCKER COMPOSE ===

up: ## Levantar todos los servicios con Docker Compose
	docker-compose up -d

up-build: ## Construir y levantar servicios
	docker-compose up -d --build

down: ## Detener todos los servicios
	docker-compose down

down-volumes: ## Detener servicios y eliminar volúmenes
	docker-compose down -v

logs-compose: ## Ver logs de todos los servicios
	docker-compose logs -f

logs-retell: ## Ver logs solo del servidor Retell
	docker-compose logs -f retell-server

status: ## Ver estado de los servicios
	docker-compose ps

# === BASE DE DATOS ===

db-reset: ## Resetear base de datos (CUIDADO: elimina todos los datos)
	docker-compose down -v
	docker-compose up -d db
	sleep 10
	docker-compose up -d

# === LIMPIEZA ===

clean: ## Limpiar imágenes Docker no utilizadas
	docker system prune -f
	docker image prune -f

clean-all: ## Limpieza completa (CUIDADO: elimina volúmenes)
	docker-compose down -v
	docker system prune -af
	docker volume prune -f

# === MONITOREO ===

health: ## Verificar salud de los servicios
	@echo "=== Estado de Servicios ==="
	@curl -s http://localhost:8000/health | jq . || echo "Retell Server no disponible"
	@curl -s http://localhost:8001/health | jq . || echo "Auth API no disponible"
	@curl -s http://localhost:5678/healthz || echo "n8n no disponible"

monitor: ## Monitorear logs en tiempo real
	docker-compose logs -f --tail=100

# === BACKUP Y RESTAURACIÓN ===

backup-db: ## Crear backup de la base de datos
	@echo "Creando backup de la base de datos..."
	docker-compose exec db pg_dump -U nexusvoz_user nexusvoz_db > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup creado: backup_$(shell date +%Y%m%d_%H%M%S).sql"

restore-db: ## Restaurar backup de base de datos (especificar archivo con FILE=)
	@if [ -z "$(FILE)" ]; then echo "Uso: make restore-db FILE=backup_file.sql"; exit 1; fi
	docker-compose exec -T db psql -U nexusvoz_user nexusvoz_db < $(FILE)

# === UTILIDADES ===

env-example: ## Crear archivo .env desde .env.example
	@if [ ! -f .env ]; then cp .env.example .env; echo "Archivo .env creado desde .env.example"; else echo "El archivo .env ya existe"; fi

check-env: ## Verificar variables de entorno requeridas
	@echo "Verificando variables de entorno..."
	@test -n "$(shell grep -v '^#' .env 2>/dev/null | grep RETELL_API_KEY)" || echo "⚠️  RETELL_API_KEY no configurada"
	@test -n "$(shell grep -v '^#' .env 2>/dev/null | grep DEEPSEEK_API_KEY)" || echo "⚠️  DEEPSEEK_API_KEY no configurada"
	@echo "Verificación completada"

# === DESARROLLO Y DEBUG ===

debug: ## Ejecutar en modo debug
	DEBUG_MODE=true LOG_LEVEL=DEBUG $(PYTHON) main.py

ws-debug: ## Ejecutar con debug de WebSocket habilitado
	WS_DEBUG=true LOG_LEVEL=DEBUG $(PYTHON) main.py

# === TESTS E2E ===

test-health: ## Test de endpoints de salud
	@echo "Probando endpoint de salud..."
	@curl -f http://localhost:8000/health || echo "❌ Health check falló"

test-websocket: ## Test básico de WebSocket
	@echo "Probando conexión WebSocket..."
	@python3 -c "import asyncio, websockets; asyncio.run(websockets.connect('ws://localhost:8000/call'))" || echo "❌ WebSocket test falló"

# === DESPLIEGUE ===

deploy-staging: ## Desplegar en staging
	docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d --build

deploy-prod: ## Desplegar en producción
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# === INFORMACIÓN ===

info: ## Mostrar información del sistema
	@echo "=== Información del Sistema ==="
	@echo "Imagen Docker: $(DOCKER_IMAGE_NAME)"
	@echo "Contenedor: $(CONTAINER_NAME)"
	@echo "Python: $(shell $(PYTHON) --version)"
	@echo "Docker: $(shell docker --version)"
	@echo "Docker Compose: $(shell docker-compose --version)"
	@echo ""
	@echo "=== Puertos ==="
	@echo "Retell Server: http://localhost:8000"
	@echo "Auth API: http://localhost:8001"
	@echo "n8n: http://localhost:5678"
	@echo "PostgreSQL: localhost:5432"
	@echo "Redis: localhost:6379"