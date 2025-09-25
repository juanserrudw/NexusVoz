"""
Configuración centralizada para el servidor NexusVoz Retell AI
"""
import os
from typing import Optional
from dataclasses import dataclass


@dataclass
class Config:
    """Configuración principal de la aplicación"""
    
    # === SERVIDOR ===
    PORT: int = int(os.environ.get("PORT", 8000))
    HOST: str = os.environ.get("HOST", "0.0.0.0")
    DEBUG_MODE: bool = os.environ.get("DEBUG_MODE", "false").lower() == "true"
    
    # === APIs EXTERNAS ===
    RETELL_API_KEY: str = os.environ.get("RETELL_API_KEY", "")
    DEEPSEEK_API_KEY: str = os.environ.get("DEEPSEEK_API_KEY", "")
    
    # === CONEXIONES ===
    AUTH_API_URL: str = os.environ.get("AUTH_API_URL", "http://localhost:8001")
    N8N_WEBHOOK_URL: Optional[str] = os.environ.get("N8N_WEBHOOK_URL")
    
    # === LOGGING ===
    LOG_LEVEL: str = os.environ.get("LOG_LEVEL", "INFO")
    WS_DEBUG: bool = os.environ.get("WS_DEBUG", "false").lower() == "true"
    
    # === TIMEOUTS ===
    HTTP_TIMEOUT: float = float(os.environ.get("HTTP_TIMEOUT", 10.0))
    WS_TIMEOUT: float = float(os.environ.get("WS_TIMEOUT", 300.0))
    
    # === IA CONFIGURATION ===
    AI_MODEL: str = os.environ.get("AI_MODEL", "deepseek-chat")
    AI_TEMPERATURE: float = float(os.environ.get("AI_TEMPERATURE", 0.7))
    MAX_TOOL_ITERATIONS: int = int(os.environ.get("MAX_TOOL_ITERATIONS", 5))
    
    # === SEGURIDAD ===
    WEBHOOK_SECRET: Optional[str] = os.environ.get("WEBHOOK_SECRET")
    
    def __post_init__(self):
        """Validaciones después de la inicialización"""
        if not self.RETELL_API_KEY:
            raise ValueError("RETELL_API_KEY es requerida")
        
        if not self.DEEPSEEK_API_KEY:
            raise ValueError("DEEPSEEK_API_KEY es requerida")
        
        if self.AI_TEMPERATURE < 0.0 or self.AI_TEMPERATURE > 2.0:
            raise ValueError("AI_TEMPERATURE debe estar entre 0.0 y 2.0")


# Instancia global de configuración
config = Config()


# === CONFIGURACIONES ESPECÍFICAS ===

CORS_CONFIG = {
    "allow_origins": ["*"] if config.DEBUG_MODE else [
        "https://nexusvoz.com",
        "https://api.nexusvoz.com",
        "http://localhost:3000",
        "http://localhost:8001"
    ],
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        },
        "detailed": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(module)s - %(funcName)s:%(lineno)d - %(message)s"
        }
    },
    "handlers": {
        "console": {
            "level": config.LOG_LEVEL,
            "class": "logging.StreamHandler",
            "formatter": "standard"
        },
        "file": {
            "level": config.LOG_LEVEL,
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "logs/retell_server.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5,
            "formatter": "detailed"
        }
    },
    "loggers": {
        "": {  # root logger
            "handlers": ["console", "file"],
            "level": config.LOG_LEVEL,
            "propagate": False
        },
        "uvicorn": {
            "handlers": ["console", "file"],
            "level": config.LOG_LEVEL,
            "propagate": False
        },
        "fastapi": {
            "handlers": ["console", "file"],
            "level": config.LOG_LEVEL,
            "propagate": False
        }
    }
}

# Sistema de mensajes del asistente
SYSTEM_MESSAGE = """Eres NexusVoz, un asistente de voz profesional especializado en ventas y soporte técnico para una empresa de tecnología de voz e IA.

INFORMACIÓN DE LA EMPRESA:
- NexusVoz es una plataforma de asistentes de voz inteligentes para empresas
- Ofrecemos soluciones de automatización de llamadas, atención al cliente y ventas
- Nos especializamos en integración con CRM, sistemas de calendario y herramientas empresariales

REGLAS IMPORTANTES:
1. SIEMPRE usa las herramientas disponibles para responder preguntas específicas
2. Para precios: DEBES usar get_pricing_plans
3. Para agendar citas: DEBES usar schedule_appointment
4. NO inventes información - solo responde con datos de las herramientas
5. Sé conversacional, amigable y profesional
6. Confirma todos los datos antes de agendar citas (nombre, email, fecha, hora, tipo)
7. Si no tienes información específica, usa las herramientas apropiadas
8. Mantén las respuestas concisas pero informativas
9. Si el cliente pregunta algo fuera de tu alcance, deriva a un agente humano

FLUJO DE AGENDAMIENTO:
1. Identifica qué tipo de cita necesita (ventas, soporte, demo, consulta)
2. Solicita y confirma: nombre completo, email, fecha preferida, hora preferida
3. Confirma todos los datos antes de proceder
4. Usa la herramienta schedule_appointment
5. Proporciona el código de confirmación al cliente

TIPOS DE CITAS DISPONIBLES:
- ventas: Reuniones comerciales y demostraciones de producto
- soporte_tecnico: Soporte técnico y resolución de problemas
- demo: Demostraciones del producto
- consulta: Consultas generales y evaluación de necesidades

Tu objetivo principal es ayudar a los clientes con información precisa y agendar citas cuando sea necesario.
"""

# Configuración de herramientas
TOOLS_CONFIG = [
    {
        "type": "function",
        "function": {
            "name": "get_pricing_plans",
            "description": "Obtiene información detallada de los planes de precios de NexusVoz. Úsala cuando el usuario pregunte por precios, planes, costos, tarifas o información comercial.",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "schedule_appointment",
            "description": "Agenda una cita con el cliente. SIEMPRE confirma todos los datos antes de usar esta herramienta. Requiere: tipo, nombre, email, fecha y hora.",
            "parameters": {
                "type": "object",
                "properties": {
                    "appointment_type": {
                        "type": "string",
                        "enum": ["ventas", "soporte_tecnico", "demo", "consulta"],
                        "description": "Tipo de cita: ventas, soporte_tecnico, demo, o consulta"
                    },
                    "client_email": {
                        "type": "string",
                        "format": "email",
                        "description": "Email del cliente (obligatorio y debe ser válido)"
                    },
                    "client_name": {
                        "type": "string",
                        "description": "Nombre completo del cliente"
                    },
                    "appointment_date": {
                        "type": "string",
                        "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
                        "description": "Fecha de la cita en formato YYYY-MM-DD"
                    },
                    "appointment_time": {
                        "type": "string",
                        "pattern": "^\\d{2}:\\d{2}$",
                        "description": "Hora de la cita en formato HH:MM (24 horas)"
                    }
                },
                "required": ["appointment_type", "client_email", "client_name", "appointment_date", "appointment_time"],
            },
        },
    }
]

# Planes de precios actualizados
PRICING_PLANS = {
    "planes": [
        {
            "nombre": "Plan Básico",
            "precio": "$29/mes",
            "precio_anual": "$290/año (ahorra $58)",
            "caracteristicas": [
                "Hasta 500 llamadas por mes",
                "Asistente de voz básico con IA",
                "Integración básica con CRM",
                "Reportes y analytics básicos",
                "Soporte por email",
                "Plantillas predefinidas",
                "Dashboard básico"
            ],
            "ideal_para": "Pequeñas empresas y startups",
            "limites": {
                "llamadas_mes": 500,
                "integraciones": 2,
                "usuarios": 3
            }
        },
        {
            "nombre": "Plan Profesional",
            "precio": "$79/mes",
            "precio_anual": "$790/año (ahorra $158)",
            "caracteristicas": [
                "Hasta 2,000 llamadas por mes",
                "Asistente de voz avanzado con IA personalizada",
                "Integraciones múltiples (CRM, Calendar, etc.)",
                "Analytics avanzados y reportes detallados",
                "Agendamiento automático inteligente",
                "Soporte prioritario por chat y teléfono",
                "Personalización de voz y scripts",
                "Dashboard avanzado con métricas en tiempo real",
                "API básica incluida"
            ],
            "ideal_para": "Empresas en crecimiento y equipos comerciales",
            "limites": {
                "llamadas_mes": 2000,
                "integraciones": 10,
                "usuarios": 10
            }
        },
        {
            "nombre": "Plan Empresarial",
            "precio": "$199/mes",
            "precio_anual": "$1,990/año (ahorra $398)",
            "caracteristicas": [
                "Llamadas ilimitadas",
                "IA completamente personalizada para tu negocio",
                "Integraciones custom y API completa",
                "Dashboard ejecutivo con KPIs personalizados",
                "Implementación y onboarding dedicado",
                "Soporte 24/7 con account manager",
                "SLA garantizado del 99.9%",
                "Entrenamiento personalizado del equipo",
                "Análisis predictivo y machine learning",
                "White label disponible"
            ],
            "ideal_para": "Grandes empresas y corporaciones",
            "limites": {
                "llamadas_mes": "ilimitadas",
                "integraciones": "ilimitadas",
                "usuarios": "ilimitados"
            }
        }
    ],
    "promociones_actuales": {
        "descuento_nuevos_clientes": "25% de descuento en los primeros 3 meses para nuevos clientes",
        "descuento_anual": "2 meses gratis al pagar anualmente",
        "migracion_gratuita": "Migración gratuita desde otras plataformas"
    },
    "beneficios_adicionales": {
        "garantia": "30 días de garantía de satisfacción",
        "prueba_gratuita": "14 días de prueba gratuita sin compromiso",
        "setup_gratuito": "Configuración inicial gratuita en todos los planes",
        "soporte_migracion": "Asistencia completa para migrar desde otras plataformas"
    },
    "complementos": [
        {
            "nombre": "Llamadas adicionales",
            "precio": "$0.05 por llamada extra",
            "descripcion": "Para cuando superes el límite de tu plan"
        },
        {
            "nombre": "Integraciones premium",
            "precio": "$15/mes por integración",
            "descripcion": "Conecta con herramientas empresariales avanzadas"
        },
        {
            "nombre": "Analytics avanzado",
            "precio": "$25/mes",
            "descripcion": "Reportes detallados y análisis predictivo"
        }
    ]
}