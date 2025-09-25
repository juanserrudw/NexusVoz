#!/bin/bash

# Script de inicio para NexusVoz Retell AI Server
# Este script maneja la inicialización completa del servidor

set -e  # Salir si algún comando falla

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Banner
echo "
╔══════════════════════════════════════╗
║         NexusVoz Retell AI Server    ║
║              Versión 2.0.0           ║
╚══════════════════════════════════════╝
"

log "Iniciando servidor NexusVoz Retell AI..."

# Verificar Python
if ! command -v python3 &> /dev/null; then
    error "Python3 no está instalado"
    exit 1
fi

# Crear directorio de logs si no existe
mkdir -p logs
log "Directorio de logs preparado"

# Verificar archivo .env
if [ ! -f .env ]; then
    warning "Archivo .env no encontrado, copiando desde .env.example"
    if [ -f .env.example ]; then
        cp .env.example .env
        warning "Por favor, configura las variables en .env antes de continuar"
        exit 1
    else
        error "Archivo .env.example no encontrado"
        exit 1
    fi
fi

# Cargar variables de entorno
export $(grep -v '^#' .env | xargs)

# Verificar variables críticas
REQUIRED_VARS=(
    "RETELL_API_KEY"
    "DEEPSEEK_API_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        error "Variable requerida $var no está configurada en .env"
        exit 1
    fi
done

success "Variables de entorno verificadas"

# Verificar conexión con API de autenticación
log "Verificando conexión con API de autenticación..."
AUTH_API_URL=${AUTH_API_URL:-"http://localhost:8001"}

if curl -s --connect-timeout 5 "$AUTH_API_URL/health" > /dev/null; then
    success "Conexión con API de autenticación establecida"
else
    warning "No se puede conectar con API de autenticación en $AUTH_API_URL"
    warning "El servidor continuará, pero algunas funciones pueden no funcionar"
fi

# Verificar conexión con DeepSeek API
log "Verificando API de DeepSeek..."
if curl -s -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
   "https://api.deepseek.com/v1/models" > /dev/null 2>&1; then
    success "API de DeepSeek verificada"
else
    error "No se puede conectar con DeepSeek API. Verifica tu clave API."
    exit 1
fi

# Instalar dependencias si es necesario
if [ ! -d "venv" ] && [ "$1" != "--docker" ]; then
    log "Creando entorno virtual..."
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    success "Entorno virtual creado e instalado"
elif [ "$1" != "--docker" ]; then
    source venv/bin/activate
    log "Entorno virtual activado"
fi

# Configurar logging
export PYTHONUNBUFFERED=1

# Función de limpieza al salir
cleanup() {
    log "Deteniendo servidor..."
    # Matar procesos hijos si existen
    jobs -p | xargs -r kill
    exit 0
}

# Capturar señales para limpieza
trap cleanup SIGTERM SIGINT

# Configurar puerto
PORT=${PORT:-8000}
HOST=${HOST:-"0.0.0.0"}

log "Configuración:"
log "  - Puerto: $PORT"
log "  - Host: $HOST"
log "  - Modo debug: ${DEBUG_MODE:-false}"
log "  - Nivel de log: ${LOG_LEVEL:-INFO}"

# Función para verificar si el puerto está en uso
check_port() {
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        error "Puerto $PORT ya está en uso"
        log "Procesos usando el puerto:"
        lsof -Pi :$PORT -sTCP:LISTEN
        return 1
    fi
    return 0
}

# Verificar puerto solo si no estamos en Docker
if [ "$1" != "--docker" ]; then
    if ! check_port; then
        exit 1
    fi
fi

# Crear archivo PID
echo $$ > retell_server.pid

# Registrar inicio
log "Servidor iniciando en $HOST:$PORT"
echo "$(date +'%Y-%m-%d %H:%M:%S') - Server starting" >> logs/server.log

# Función para monitorear el servidor
monitor_server() {
    while true; do
        sleep 30
        if ! curl -s "http://localhost:$PORT/health" > /dev/null 2>&1; then
            warning "Health check falló, servidor podría estar down"
        fi
    done
}

# Iniciar monitoreo en background si no estamos en Docker
if [ "$1" != "--docker" ]; then
    monitor_server &
    MONITOR_PID=$!
fi

# Función para mostrar información del servidor
show_info() {
    echo ""
    success "🚀 Servidor NexusVoz Retell AI iniciado correctamente!"
    echo ""
    log "📊 Información del servidor:"
    log "   URL Principal: http://$HOST:$PORT"
    log "   Health Check:  http://$HOST:$PORT/health"
    log "   WebSocket:     ws://$HOST:$PORT/call"
    echo ""
    log "📝 Logs disponibles en:"
    log "   Servidor:      logs/retell_server.log"
    log "   Aplicación:    logs/server.log"
    echo ""
    log "🔧 Para detener el servidor: Ctrl+C"
    echo ""
}

# Determinar comando de inicio según el modo
if [ "${DEBUG_MODE:-false}" = "true" ]; then
    log "Iniciando en modo DEBUG"
    # Mostrar información antes de iniciar
    show_info
    python3 main.py
elif [ "$1" = "--reload" ]; then
    log "Iniciando con recarga automática"
    show_info
    uvicorn main:app --host $HOST --port $PORT --reload --log-level ${LOG_LEVEL,,}
else
    log "Iniciando en modo producción"
    show_info
    python3 main.py
fi

# El script llega aquí cuando el servidor se detiene
log "Servidor detenido"

# Limpiar archivo PID
rm -f retell_server.pid

# Detener monitor si existe
if [ ! -z "$MONITOR_PID" ]; then
    kill $MONITOR_PID 2>/dev/null || true
fi

success "Limpieza completada"