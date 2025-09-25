import os
import uvicorn
import asyncio
import nest_asyncio
import openai
import json
import requests
import uuid
import re
from contextlib import asynccontextmanager
from retell import Retell
from fastapi import FastAPI, WebSocket, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from datetime import datetime
from typing import Dict, Optional
import httpx
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('retell_server.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Cargar variables de entorno
load_dotenv()

# Variables globales para los clientes
retell = None
AUTH_API_URL = None
N8N_WEBHOOK_URL = None
active_calls: Dict[str, list] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    global retell, AUTH_API_URL, N8N_WEBHOOK_URL
    #logger.info("🚀 NexusVoz Retell AI Server iniciado") ## borraaarr para despliegue
    # Inicializar clientes y configuraciones
    retell = Retell(api_key=os.environ.get("RETELL_API_KEY"))
    openai.api_key = os.environ.get("DEEPSEEK_API_KEY")
    openai.base_url = "https://api.deepseek.com/v1"
    AUTH_API_URL = os.environ.get("AUTH_API_URL")
    N8N_WEBHOOK_URL = os.environ.get("N8N_WEBHOOK_URL")
    
    #logger.info(f"🔗 AUTH_API_URL configurada: {AUTH_API_URL}")   #borrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr
    #logger.info(f"🔗 Conectando a API de autenticación: {AUTH_API_URL}") #brrrrrrrrrrrrrrrrrrrrrrrrrrrrrr
    
    # Verificar conexión con API de autenticación
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{AUTH_API_URL}/health")
            if response.status_code == 200:
                logger.info("✅ Conexión con API de autenticación establecida")
            else:
                logger.warning("⚠️ API de autenticación no responde correctamente")
    except Exception as e:
        logger.error(f"❌ Error conectando con API de autenticación: {e}")
    
    yield  
    
    # === SHUTDOWN ===
    logger.info("🛑 NexusVoz Retell AI Server detenido")
    
    
    active_calls.clear()
    logger.info("🧹 Recursos limpiados")

# Configuración de la aplicación con lifespan
app = FastAPI(
    title="NexusVoz Retell AI Server",
    description="Servidor de integración con Retell AI para conversaciones de voz",
    version="2.0.0",
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === FUNCIONES DE COMUNICACIÓN CON API DE AUTENTICACIÓN ===

async def log_conversation_start(call_id: str, retell_data: dict):
    payload = {
        "call_id": call_id,
        "timestamp": datetime.now().isoformat(),
        "data": retell_data
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            url = f"{AUTH_API_URL}/api/v1/conversations/start"
            logger.info(f"📤 Enviando a: {url}")
            
            response = await client.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            logger.info(f"📥 Respuesta: {response.status_code} - {response.text[:200]}")
            
            if response.status_code == 200:
                logger.info(f"✅ Conversación iniciada registrada: {call_id}")
            else:
                logger.error(f"❌ Error registrando conversación: {response.status_code} - {response.text}")
                
    except httpx.ConnectError as e:
        logger.error(f"❌ Error de conexión con API: {e}")
        logger.error(f"💡 Verificar que la API esté corriendo en: {AUTH_API_URL}")
    except Exception as e:
        logger.error(f"❌ Error inesperado: {e}")

async def log_message(call_id: str, role: str, content: str, metadata: dict = None):
    """Registrar mensajes individuales"""
    payload = {
        "call_id": call_id,
        "role": role,
        "content": content,
        "timestamp": datetime.now().isoformat(),
        "metadata": metadata or {}
    }
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"{AUTH_API_URL}/api/v1/conversations/messages",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            if response.status_code == 200:
                logger.debug(f"💬 Mensaje registrado: {call_id} - {role}")
            else:
                logger.error(f"❌ Error registrando mensaje: {response.status_code} - {response.text}")
    except Exception as e:
        logger.error(f"❌ Falló al registrar mensaje: {e}")

async def log_tool_execution(call_id: str, tool_name: str, arguments: dict, result: dict):
    """Registrar ejecuciones de herramientas"""
    payload = {
        "call_id": call_id,
        "tool_name": tool_name,
        "arguments": arguments,
        "result": result,
        "timestamp": datetime.now().isoformat()
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{AUTH_API_URL}/api/v1/conversations/tools",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            if response.status_code == 200:
                logger.info(f"🔧 Herramienta registrada: {tool_name} para {call_id}")
            else:
                logger.error(f"❌ Error registrando herramienta: {response.status_code}")
    except Exception as e:
        logger.error(f"❌ Falló al registrar ejecución de herramienta: {e}")

async def log_conversation_end(call_id: str, duration_seconds: int = 0):
    """Registrar fin de conversación"""
    payload = {
        "call_id": call_id,
        "timestamp": datetime.now().isoformat(),
        "duration_seconds": duration_seconds
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{AUTH_API_URL}/api/v1/conversations/end",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            if response.status_code == 200:
                logger.info(f"📝 Conversación finalizada: {call_id}")
                await trigger_n8n_webhook("conversation-completed", {"call_id": call_id})
            else:
                logger.error(f"❌ Error finalizando conversación: {response.status_code}")
    except Exception as e:
        logger.error(f"❌ Falló al registrar fin de conversación: {e}")

async def trigger_n8n_webhook(event_type: str, data: dict):
    """Activar webhooks de n8n"""
    if not N8N_WEBHOOK_URL:
        return
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{N8N_WEBHOOK_URL}/webhook/{event_type}",
                json=data,
                headers={"Content-Type": "application/json"}
            )
            logger.info(f"🔄 Webhook n8n activado: {event_type}")
    except Exception as e:
        logger.error(f"❌ Error activando webhook n8n: {e}")

# === FUNCIONES DE HERRAMIENTAS ===

def get_pricing_plans():
    """
    Obtiene la información detallada de los planes de precios de NexusVoz
    """
    logger.info("🔧 Herramienta 'get_pricing_plans' ejecutada")
    
    pricing_data = {
        "planes": [
            {
                "nombre": "Plan Básico",
                "precio": "$29/mes",
                "caracteristicas": [
                    "Hasta 500 llamadas por mes",
                    "Asistente de voz básico",
                    "Integración con CRM",
                    "Reportes básicos",
                    "Soporte por email"
                ],
                "ideal_para": "Pequeñas empresas y startups"
            },
            {
                "nombre": "Plan Profesional",
                "precio": "$79/mes",
                "caracteristicas": [
                    "Hasta 2,000 llamadas por mes",
                    "Asistente de voz avanzado con IA",
                    "Integraciones múltiples (CRM, Calendar, etc.)",
                    "Analytics avanzados",
                    "Agendamiento automático",
                    "Soporte prioritario",
                    "Personalización de voz"
                ],
                "ideal_para": "Empresas en crecimiento"
            },
            {
                "nombre": "Plan Empresarial",
                "precio": "$199/mes",
                "caracteristicas": [
                    "Llamadas ilimitadas",
                    "IA personalizada para tu negocio",
                    "Integraciones custom",
                    "Dashboard ejecutivo",
                    "API completa",
                    "Soporte 24/7",
                    "Implementación dedicada",
                    "SLA garantizado"
                ],
                "ideal_para": "Grandes empresas y corporaciones"
            }
        ],
        "promociones_actuales": "20% de descuento en el primer año para nuevos clientes",
        "garantia": "30 días de garantía de devolución",
        "prueba_gratuita": "14 días de prueba gratuita sin compromiso"
    }
    
    return {
        "status": "success",
        "data": pricing_data,
        "message": "Información de precios obtenida exitosamente"
    }

async def schedule_appointment(appointment_type: str, client_email: str, client_name: str,
                             appointment_date: str, appointment_time: str, call_id: str = None):
    """
    Agenda una cita haciendo una llamada a la API de autenticación
    """
    logger.info(f"🔧 Herramienta 'schedule_appointment' ejecutada")
    logger.info(f"📋 Datos: Tipo: {appointment_type}, Email: {client_email}, Nombre: {client_name}")
    logger.info(f"📅 Fecha: {appointment_date}, Hora: {appointment_time}")
    
    # Generar ID único para la cita
    appointment_id = str(uuid.uuid4())
    
    # Extraer teléfono del contexto de la llamada si está disponible
    phone_number = None
    if call_id and call_id in active_calls:
        conversation_data = active_calls.get(call_id, [])
        for message in conversation_data:
            if message.get("role") == "system" and "phone" in str(message.get("content", "")).lower():
                pass
    
    payload = {
        "appointment_id": appointment_id,
        "appointment_type": appointment_type,
        "client_email": client_email,
        "client_name": client_name,
        "client_phone": phone_number or "",
        "appointment_date": appointment_date,
        "appointment_time": appointment_time,
        "source": "voice_call",
        "status": "scheduled",
        "notes": f"Agendada via llamada de voz {call_id}",
    }
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{AUTH_API_URL}/api/v1/appointments",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result_data = response.json()
                logger.info(f"✅ Cita agendada exitosamente: {appointment_id}")
                
                # Activar webhook de n8n para nueva cita
                await trigger_n8n_webhook("appointment-scheduled", {
                    "appointment_id": appointment_id,
                    "client_email": client_email,
                    "appointment_type": appointment_type
                })
                
                return {
                    "status": "success",
                    "message": f"Cita agendada exitosamente para {appointment_date} a las {appointment_time}",
                    "appointment_id": appointment_id,
                    "confirmation_code": result_data.get("confirmation_code", ""),
                    "details": {
                        "tipo": appointment_type,
                        "fecha": appointment_date,
                        "hora": appointment_time,
                        "cliente": client_name,
                        "email": client_email
                    }
                }
            else:
                logger.error(f"❌ Error de API: {response.status_code} - {response.text}")
                return {
                    "status": "error",
                    "message": "Lo siento, hubo un problema al agendar la cita. Por favor intenta nuevamente."
                }
                
    except Exception as e:
        logger.error(f"❌ Error de conexión: {e}")
        return {
            "status": "error",
            "message": "Servicio temporalmente no disponible. Por favor intenta más tarde."
        }

def extract_email_from_text(text: str) -> Optional[str]:
    """Extraer email de un texto"""
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, text)
    return emails[0] if emails else None

def extract_phone_from_text(text: str) -> Optional[str]:
    """Extraer teléfono de un texto"""
    phone_patterns = [
        r'(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
        r'(\+\d{1,3}[-.\s]?)?\d{10}',
        r'(\+\d{1,3}[-.\s]?)?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}'
    ]
    
    for pattern in phone_patterns:
        phones = re.findall(pattern, text)
        if phones:
            return ''.join(phones[0]) if isinstance(phones[0], tuple) else phones[0]
    return None

# === DEFINICIÓN DE HERRAMIENTAS PARA DEEPSEEK ===

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_pricing_plans",
            "description": "Obtiene información detallada de los planes de precios de NexusVoz. Úsala cuando el usuario pregunte por precios, planes, costos o tarifas.",
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
            "description": "Agenda una cita con el cliente para ventas o soporte técnico. SIEMPRE pide y confirma: tipo de cita, nombre completo, email, fecha y hora antes de usar esta herramienta.",
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
                        "description": "Email del cliente (obligatorio)"
                    },
                    "client_name": {
                        "type": "string",
                        "description": "Nombre completo del cliente"
                    },
                    "appointment_date": {
                        "type": "string",
                        "description": "Fecha de la cita en formato YYYY-MM-DD"
                    },
                    "appointment_time": {
                        "type": "string",
                        "description": "Hora de la cita en formato HH:MM (24 horas)"
                    },
                    "call_id": {
                        "type": "string",
                        "description": "ID de la llamada actual"
                    }
                },
                "required": ["appointment_type", "client_email", "client_name", "appointment_date", "appointment_time"],
            },
        },
    }
]

# === ENDPOINTS HTTP ===

@app.get("/health")
async def health_check():
    """Verificar estado del servidor"""
    try:
        # Verificar conexión con API de autenticación
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{AUTH_API_URL}/health")
            auth_api_status = "connected" if response.status_code == 200 else "disconnected"
    except:
        auth_api_status = "disconnected"
    
    return {
        "status": "healthy",
        "service": "NexusVoz Retell AI Server",
        "version": "2.0.0",
        "auth_api_connection": auth_api_status,
        "active_calls": len(active_calls),
        "timestamp": datetime.now().isoformat()
    }

@app.post("/call")
async def register_call(request: Request):
    """Endpoint para manejar webhooks de Retell AI y enviar a API de autenticación"""
    try:
        call_data = await request.json()
        logger.info(f"📞 Datos recibidos en POST /call: {json.dumps(call_data, indent=2)}")

        # Verificar si es un evento específico
        event_type = call_data.get("event")
        call_info = call_data.get("call", {})
        call_id = call_info.get("call_id")
        
        if not call_id:
            logger.info("📨 Solicitud POST sin call_id (posible notificación de evento)")
            return {"status": "ok", "message": "No call_id provided"}
        
        if event_type == "call_started":
            # Procesar inicio de llamada
            logger.info(f"🟢 Procesando call_started: {call_id}")
            
            # Inicializar historial local
            active_calls[call_id] = [
                {
                    "role": "system", 
                    "content": """Eres NexusVoz, un asistente de voz profesional especializado en ventas y soporte técnico. 

REGLAS IMPORTANTES:
1. SIEMPRE usa las herramientas disponibles para responder preguntas específicas
2. Para precios: DEBES usar get_pricing_plans
3. Para agendar citas: DEBES usar schedule_appointment
4. NO inventes información - solo responde con datos de las herramientas
5. Sé conversacional y amigable
6. Confirma todos los datos antes de agendar citas
7. Si no tienes información, usa las herramientas apropiadas

Tu objetivo es ayudar a los clientes con información y agendar citas cuando sea necesario."""
                },
            ]
            
            # Enviar a API de autenticación
            try:
                await log_conversation_start(call_id, call_info)
                logger.info(f"✅ Conversación iniciada enviada a API: {call_id}")
            except Exception as e:
                logger.error(f"❌ Error enviando inicio de conversación: {e}")
                
        elif event_type == "call_ended":
            # Procesar fin de llamada
            logger.info(f"🔴 Procesando call_ended: {call_id}")
            
            duration_seconds = call_info.get("duration_ms", 0) // 1000
            
            # Procesar transcript si existe
            transcript_data = call_info.get("transcript_object", [])
            logger.info(f"📝 Procesando {len(transcript_data)} mensajes del transcript")
            
            for msg in transcript_data:
                try:
                    role = msg.get("role", "unknown")
                    content = msg.get("content", "").strip()
                    
                    if content:  # Solo enviar si hay contenido
                        await log_message(call_id, role, content, msg.get("metadata", {}))
                        logger.debug(f"💬 Mensaje enviado: {role} - {content[:50]}...")
                except Exception as msg_error:
                    logger.error(f"❌ Error procesando mensaje: {msg_error}")
                    continue
            
            # Enviar fin de conversación
            try:
                await log_conversation_end(call_id, duration_seconds)
                logger.info(f"📝 Conversación finalizada enviada: {call_id}")
            except Exception as e:
                logger.error(f"❌ Error enviando fin de conversación: {e}")
            
            # Limpiar memoria local
            if call_id in active_calls:
                del active_calls[call_id]
                logger.info(f"🧹 Historial limpiado: {call_id}")
                    
        elif event_type == "call_analyzed":
            # Procesar análisis de llamada
            logger.info(f"📊 Procesando call_analyzed: {call_id}")
            analysis = call_info.get("call_analysis", {})
            
            if analysis:
                try:
                    # Crear endpoint de análisis si no existe
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        response = await client.post(
                            f"{AUTH_API_URL}/api/v1/conversations/analysis",
                            json={
                                "call_id": call_id,
                                "analysis": analysis,
                                "timestamp": datetime.now().isoformat()
                            },
                            headers={"Content-Type": "application/json"}
                        )
                        if response.status_code == 200:
                            logger.info(f"📊 Análisis enviado: {call_id}")
                        else:
                            logger.warning(f"⚠️ Análisis no enviado ({response.status_code}): {call_id}")
                except Exception as e:
                    logger.error(f"❌ Error enviando análisis: {e}")
            else:
                logger.info(f"📊 Sin datos de análisis para: {call_id}")
        else:
            logger.warning(f"⚠️ Evento no reconocido: {event_type}")
        
        return {"status": "ok", "processed_event": event_type or "unknown", "call_id": call_id}
            
    except Exception as e:
        logger.error(f"❌ Error en endpoint POST /call: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {e}")

# === EJECUCIÓN PRINCIPAL ===

if __name__ == "__main__":
    nest_asyncio.apply()
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=int(os.environ.get("PORT", 8001)),
        log_level="info"
    )



























# import os
# import uvicorn
# import asyncio
# import nest_asyncio
# import openai
# import json
# import requests
# import uuid
# import re
# from retell import Retell
# from fastapi import FastAPI, WebSocket, Request, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from dotenv import load_dotenv
# from datetime import datetime
# from typing import Dict, Optional
# import httpx
# import logging

# # Configurar logging
# logging.basicConfig(
#     level=logging.INFO,
#     format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
#     handlers=[
#         logging.FileHandler('retell_server.log'),
#         logging.StreamHandler()
#     ]
# )
# logger = logging.getLogger(__name__)

# # Cargar variables de entorno
# load_dotenv()
# \

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     """Manejador del ciclo de vida de la aplicación"""
#     # === STARTUP ===
#     global retell, AUTH_API_URL, N8N_WEBHOOK_URL
    
#     logger.info("🚀 NexusVoz Retell AI Server iniciado")
    
#     # Inicializar clientes y configuraciones
#     retell = Retell(api_key=os.environ.get("RETELL_API_KEY"))
#     openai.api_key = os.environ.get("DEEPSEEK_API_KEY")
#     openai.base_url = "https://api.deepseek.com/v1"
    
#     AUTH_API_URL = os.environ.get("AUTH_API_URL")
#     N8N_WEBHOOK_URL = os.environ.get("N8N_WEBHOOK_URL")
    
#     logger.info(f"🔗 AUTH_API_URL configurada: {AUTH_API_URL}")
#     logger.info(f"🔗 Conectando a API de autenticación: {AUTH_API_URL}")
    
#     # Verificar conexión con API de autenticación
#     try:
#         async with httpx.AsyncClient(timeout=10.0) as client:
#             response = await client.get(f"{AUTH_API_URL}/health")
#             if response.status_code == 200:
#                 logger.info("✅ Conexión con API de autenticación establecida")
#             else:
#                 logger.warning("⚠️ API de autenticación no responde correctamente")
#     except Exception as e:
#         logger.error(f"❌ Error conectando con API de autenticación: {e}")
    
#     yield  # El servidor está corriendo
    
#     # === SHUTDOWN ===
#     logger.info("🛑 NexusVoz Retell AI Server detenido")
    
#     # Limpiar recursos si es necesario
#     active_calls.clear()
#     logger.info("🧹 Recursos limpiados")
# # Configuración de la aplicación
# app = FastAPI(
#     title="NexusVoz Retell AI Server",
#     description="Servidor de integración con Retell AI para conversaciones de voz",
#     version="2.0.0"
# )

# # Configurar CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Inicializar clientes
# retell = Retell(api_key=os.environ.get("RETELL_API_KEY"))
# openai.api_key = os.environ.get("DEEPSEEK_API_KEY")
# openai.base_url = "https://api.deepseek.com/v1"

# # URL de la API de autenticación
# AUTH_API_URL = os.environ.get("AUTH_API_URL")
# N8N_WEBHOOK_URL = os.environ.get("N8N_WEBHOOK_URL")
# logger.info(f"🔗 AUTH_API_URL configurada: {AUTH_API_URL}")

# # Diccionario para almacenar el estado de las llamadas activas
# active_calls: Dict[str, list] = {}

# # === FUNCIONES DE COMUNICACIÓN CON API DE AUTENTICACIÓN ===

# # === FUNCIONES DE COMUNICACIÓN CON API DE AUTENTICACIÓN ===

# async def log_conversation_start(call_id: str, retell_data: dict):
#     """Registrar inicio de conversación en API principal"""
#     payload = {
#         "call_id": call_id,
#         "timestamp": datetime.now().isoformat(),
#         "data": retell_data
#     }
    
#     try:
#         async with httpx.AsyncClient(timeout=10.0) as client:
#             url = f"{AUTH_API_URL}/api/v1/conversations/start"
#             logger.info(f"📤 Enviando a: {url}")
            
#             response = await client.post(
#                 url,
#                 json=payload,
#                 headers={"Content-Type": "application/json"}
#             )
            
#             logger.info(f"📥 Respuesta: {response.status_code} - {response.text[:200]}")
            
#             if response.status_code == 200:
#                 logger.info(f"✅ Conversación iniciada registrada: {call_id}")
#             else:
#                 logger.error(f"❌ Error registrando conversación: {response.status_code} - {response.text}")
                
#     except httpx.ConnectError as e:
#         logger.error(f"❌ Error de conexión con API: {e}")
#         logger.error(f"💡 Verificar que la API esté corriendo en: {AUTH_API_URL}")
#     except Exception as e:
#         logger.error(f"❌ Error inesperado: {e}")

# async def log_message(call_id: str, role: str, content: str, metadata: dict = None):
#     """Registrar mensajes individuales"""
#     payload = {
#         "call_id": call_id,
#         "role": role,
#         "content": content,
#         "timestamp": datetime.now().isoformat(),
#         "metadata": metadata or {}
#     }
    
#     try:
#         async with httpx.AsyncClient(timeout=5.0) as client:
#             response = await client.post(
#                 f"{AUTH_API_URL}/api/v1/conversations/messages",
#                 json=payload,
#                 headers={"Content-Type": "application/json"}
#             )
#             if response.status_code == 200:
#                 logger.debug(f"💬 Mensaje registrado: {call_id} - {role}")
#             else:
#                 logger.error(f"❌ Error registrando mensaje: {response.status_code} - {response.text}")
#     except Exception as e:
#         logger.error(f"❌ Falló al registrar mensaje: {e}")

# async def log_tool_execution(call_id: str, tool_name: str, arguments: dict, result: dict):
#     """Registrar ejecuciones de herramientas"""
#     payload = {
#         "call_id": call_id,
#         "tool_name": tool_name,
#         "arguments": arguments,
#         "result": result,
#         "timestamp": datetime.now().isoformat()
#     }
    
#     try:
#         async with httpx.AsyncClient(timeout=10.0) as client:
#             response = await client.post(
#                 f"{AUTH_API_URL}/api/v1/conversations/tools",
#                 json=payload,
#                 headers={"Content-Type": "application/json"}
#             )
#             if response.status_code == 200:
#                 logger.info(f"🔧 Herramienta registrada: {tool_name} para {call_id}")
#             else:
#                 logger.error(f"❌ Error registrando herramienta: {response.status_code}")
#     except Exception as e:
#         logger.error(f"❌ Falló al registrar ejecución de herramienta: {e}")

# async def log_conversation_end(call_id: str, duration_seconds: int = 0):
#     """Registrar fin de conversación"""
#     payload = {
#         "call_id": call_id,
#         "timestamp": datetime.now().isoformat(),
#         "duration_seconds": duration_seconds
#     }
    
#     try:
#         async with httpx.AsyncClient(timeout=10.0) as client:
#             response = await client.post(
#                 f"{AUTH_API_URL}/api/v1/conversations/end",
#                 json=payload,
#                 headers={"Content-Type": "application/json"}
#             )
#             if response.status_code == 200:
#                 logger.info(f"📝 Conversación finalizada: {call_id}")
#                 await trigger_n8n_webhook("conversation-completed", {"call_id": call_id})
#             else:
#                 logger.error(f"❌ Error finalizando conversación: {response.status_code}")
#     except Exception as e:
#         logger.error(f"❌ Falló al registrar fin de conversación: {e}")

# async def trigger_n8n_webhook(event_type: str, data: dict):
#     """Activar webhooks de n8n"""
#     if not N8N_WEBHOOK_URL:
#         return
    
#     try:
#         async with httpx.AsyncClient(timeout=5.0) as client:
#             await client.post(
#                 f"{N8N_WEBHOOK_URL}/webhook/{event_type}",
#                 json=data,
#                 headers={"Content-Type": "application/json"}
#             )
#             logger.info(f"🔄 Webhook n8n activado: {event_type}")
#     except Exception as e:
#         logger.error(f"❌ Error activando webhook n8n: {e}")

# # === FUNCIONES DE HERRAMIENTAS ===

# def get_pricing_plans():
#     """
#     Obtiene la información detallada de los planes de precios de NexusVoz
#     """
#     logger.info("🔧 Herramienta 'get_pricing_plans' ejecutada")
    
#     pricing_data = {
#         "planes": [
#             {
#                 "nombre": "Plan Básico",
#                 "precio": "$29/mes",
#                 "caracteristicas": [
#                     "Hasta 500 llamadas por mes",
#                     "Asistente de voz básico",
#                     "Integración con CRM",
#                     "Reportes básicos",
#                     "Soporte por email"
#                 ],
#                 "ideal_para": "Pequeñas empresas y startups"
#             },
#             {
#                 "nombre": "Plan Profesional",
#                 "precio": "$79/mes",
#                 "caracteristicas": [
#                     "Hasta 2,000 llamadas por mes",
#                     "Asistente de voz avanzado con IA",
#                     "Integraciones múltiples (CRM, Calendar, etc.)",
#                     "Analytics avanzados",
#                     "Agendamiento automático",
#                     "Soporte prioritario",
#                     "Personalización de voz"
#                 ],
#                 "ideal_para": "Empresas en crecimiento"
#             },
#             {
#                 "nombre": "Plan Empresarial",
#                 "precio": "$199/mes",
#                 "caracteristicas": [
#                     "Llamadas ilimitadas",
#                     "IA personalizada para tu negocio",
#                     "Integraciones custom",
#                     "Dashboard ejecutivo",
#                     "API completa",
#                     "Soporte 24/7",
#                     "Implementación dedicada",
#                     "SLA garantizado"
#                 ],
#                 "ideal_para": "Grandes empresas y corporaciones"
#             }
#         ],
#         "promociones_actuales": "20% de descuento en el primer año para nuevos clientes",
#         "garantia": "30 días de garantía de devolución",
#         "prueba_gratuita": "14 días de prueba gratuita sin compromiso"
#     }
    
#     return {
#         "status": "success",
#         "data": pricing_data,
#         "message": "Información de precios obtenida exitosamente"
#     }

# async def schedule_appointment(appointment_type: str, client_email: str, client_name: str,
#                              appointment_date: str, appointment_time: str, call_id: str = None):
#     """
#     Agenda una cita haciendo una llamada a la API de autenticación
#     """
#     logger.info(f"🔧 Herramienta 'schedule_appointment' ejecutada")
#     logger.info(f"📋 Datos: Tipo: {appointment_type}, Email: {client_email}, Nombre: {client_name}")
#     logger.info(f"📅 Fecha: {appointment_date}, Hora: {appointment_time}")
    
#     # Generar ID único para la cita
#     appointment_id = str(uuid.uuid4())
    
#     # Extraer teléfono del contexto de la llamada si está disponible
#     phone_number = None
#     if call_id and call_id in active_calls:
#         # Intentar extraer teléfono de los datos de Retell
#         conversation_data = active_calls.get(call_id, [])
#         for message in conversation_data:
#             if message.get("role") == "system" and "phone" in str(message.get("content", "")).lower():
#                 # Lógica para extraer teléfono si está disponible
#                 pass
    
#     payload = {
#         "appointment_id": appointment_id,
#         "appointment_type": appointment_type,
#         "client_email": client_email,
#         "client_name": client_name,
#         "client_phone": phone_number or "",
#         "appointment_date": appointment_date,
#         "appointment_time": appointment_time,
#         "source": "voice_call",
#         "status": "scheduled",
#         "notes": f"Agendada via llamada de voz {call_id}",
#     }
    
#     try:
#         async with httpx.AsyncClient(timeout=15.0) as client:
#             response = await client.post(
#                 f"{AUTH_API_URL}/api/v1/appointments",
#                 json=payload,
#                 headers={"Content-Type": "application/json"}
#             )
            
#             if response.status_code == 200:
#                 result_data = response.json()
#                 logger.info(f"✅ Cita agendada exitosamente: {appointment_id}")
                
#                 # Activar webhook de n8n para nueva cita
#                 await trigger_n8n_webhook("appointment-scheduled", {
#                     "appointment_id": appointment_id,
#                     "client_email": client_email,
#                     "appointment_type": appointment_type
#                 })
                
#                 return {
#                     "status": "success",
#                     "message": f"Cita agendada exitosamente para {appointment_date} a las {appointment_time}",
#                     "appointment_id": appointment_id,
#                     "confirmation_code": result_data.get("confirmation_code", ""),
#                     "details": {
#                         "tipo": appointment_type,
#                         "fecha": appointment_date,
#                         "hora": appointment_time,
#                         "cliente": client_name,
#                         "email": client_email
#                     }
#                 }
#             else:
#                 logger.error(f"❌ Error de API: {response.status_code} - {response.text}")
#                 return {
#                     "status": "error",
#                     "message": "Lo siento, hubo un problema al agendar la cita. Por favor intenta nuevamente."
#                 }
                
#     except Exception as e:
#         logger.error(f"❌ Error de conexión: {e}")
#         return {
#             "status": "error",
#             "message": "Servicio temporalmente no disponible. Por favor intenta más tarde."
#         }

# def extract_email_from_text(text: str) -> Optional[str]:
#     """Extraer email de un texto"""
#     email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
#     emails = re.findall(email_pattern, text)
#     return emails[0] if emails else None

# def extract_phone_from_text(text: str) -> Optional[str]:
#     """Extraer teléfono de un texto"""
#     phone_patterns = [
#         r'(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
#         r'(\+\d{1,3}[-.\s]?)?\d{10}',
#         r'(\+\d{1,3}[-.\s]?)?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}'
#     ]
    
#     for pattern in phone_patterns:
#         phones = re.findall(pattern, text)
#         if phones:
#             return ''.join(phones[0]) if isinstance(phones[0], tuple) else phones[0]
#     return None

# # === DEFINICIÓN DE HERRAMIENTAS PARA DEEPSEEK ===

# tools = [
#     {
#         "type": "function",
#         "function": {
#             "name": "get_pricing_plans",
#             "description": "Obtiene información detallada de los planes de precios de NexusVoz. Úsala cuando el usuario pregunte por precios, planes, costos o tarifas.",
#             "parameters": {
#                 "type": "object",
#                 "properties": {},
#             },
#         },
#     },
#     {
#         "type": "function",
#         "function": {
#             "name": "schedule_appointment",
#             "description": "Agenda una cita con el cliente para ventas o soporte técnico. SIEMPRE pide y confirma: tipo de cita, nombre completo, email, fecha y hora antes de usar esta herramienta.",
#             "parameters": {
#                 "type": "object",
#                 "properties": {
#                     "appointment_type": {
#                         "type": "string",
#                         "enum": ["ventas", "soporte_tecnico", "demo", "consulta"],
#                         "description": "Tipo de cita: ventas, soporte_tecnico, demo, o consulta"
#                     },
#                     "client_email": {
#                         "type": "string",
#                         "description": "Email del cliente (obligatorio)"
#                     },
#                     "client_name": {
#                         "type": "string",
#                         "description": "Nombre completo del cliente"
#                     },
#                     "appointment_date": {
#                         "type": "string",
#                         "description": "Fecha de la cita en formato YYYY-MM-DD"
#                     },
#                     "appointment_time": {
#                         "type": "string",
#                         "description": "Hora de la cita en formato HH:MM (24 horas)"
#                     },
#                     "call_id": {
#                         "type": "string",
#                         "description": "ID de la llamada actual"
#                     }
#                 },
#                 "required": ["appointment_type", "client_email", "client_name", "appointment_date", "appointment_time"],
#             },
#         },
#     }
# ]

# # === ENDPOINTS HTTP ===

# # @app.post("/call")
# # async def register_call(request: Request):
# #     """Endpoint para manejar solicitudes POST de Retell AI"""
# #     try:
# #         call_data = await request.json()
# #         logger.info(f"📞 Datos recibidos en POST /call: {json.dumps(call_data, indent=2)}")

# #         if "call_id" in call_data:
# #             call_id = call_data["call_id"]
            
# #             # Inicializar historial de conversación
# #             active_calls[call_id] = [
# #                 {
# #                     "role": "system", 
# #                     "content": """Eres NexusVoz, un asistente de voz profesional especializado en ventas y soporte técnico. 

# # REGLAS IMPORTANTES:
# # 1. SIEMPRE usa las herramientas disponibles para responder preguntas específicas
# # 2. Para precios: DEBES usar get_pricing_plans
# # 3. Para agendar citas: DEBES usar schedule_appointment
# # 4. NO inventes información - solo responde con datos de las herramientas
# # 5. Sé conversacional y amigable
# # 6. Confirma todos los datos antes de agendar citas
# # 7. Si no tienes información, usa las herramientas apropiadas

# # Tu objetivo es ayudar a los clientes con información y agendar citas cuando sea necesario."""
# #                 },
# #             ]

# #             logger.info(f"✅ Llamada registrada correctamente: {call_id}")
# #             return {"status": "ok"}
# #         else:
# #             logger.info("📨 Solicitud POST sin call_id (posible notificación de evento)")
# #             return {"status": "ok"}
            
# #     except Exception as e:
# #         logger.error(f"❌ Error en endpoint POST /call: {e}")
# #         raise HTTPException(status_code=500, detail=f"Error interno del servidor: {e}")

# @app.get("/health")
# async def health_check():
#     """Verificar estado del servidor"""
#     try:
#         # Verificar conexión con API de autenticación
#         async with httpx.AsyncClient(timeout=5.0) as client:
#             response = await client.get(f"{AUTH_API_URL}/health")
#             auth_api_status = "connected" if response.status_code == 200 else "disconnected"
#     except:
#         auth_api_status = "disconnected"
    
#     return {
#         "status": "healthy",
#         "service": "NexusVoz Retell AI Server",
#         "version": "2.0.0",
#         "auth_api_connection": auth_api_status,
#         "active_calls": len(active_calls),
#         "timestamp": datetime.now().isoformat()
#     }


# @app.post("/call")
# async def register_call(request: Request):
#     """Endpoint para manejar webhooks de Retell AI y enviar a API de autenticación"""
#     try:
#         call_data = await request.json()
#         logger.info(f"📞 Datos recibidos en POST /call: {json.dumps(call_data, indent=2)}")

#         # Verificar si es un evento específico
#         event_type = call_data.get("event")
#         call_info = call_data.get("call", {})
#         call_id = call_info.get("call_id")
        
#         if not call_id:
#             logger.info("📨 Solicitud POST sin call_id (posible notificación de evento)")
#             return {"status": "ok", "message": "No call_id provided"}
        
#         if event_type == "call_started":
#             # Procesar inicio de llamada
#             logger.info(f"🟢 Procesando call_started: {call_id}")
            
#             # Inicializar historial local
#             active_calls[call_id] = [
#                 {
#                     "role": "system", 
#                     "content": """Eres NexusVoz, un asistente de voz profesional especializado en ventas y soporte técnico. 

# REGLAS IMPORTANTES:
# 1. SIEMPRE usa las herramientas disponibles para responder preguntas específicas
# 2. Para precios: DEBES usar get_pricing_plans
# 3. Para agendar citas: DEBES usar schedule_appointment
# 4. NO inventes información - solo responde con datos de las herramientas
# 5. Sé conversacional y amigable
# 6. Confirma todos los datos antes de agendar citas
# 7. Si no tienes información, usa las herramientas apropiadas

# Tu objetivo es ayudar a los clientes con información y agendar citas cuando sea necesario."""
#                 },
#             ]
            
#             # Enviar a API de autenticación
#             try:
#                 await log_conversation_start(call_id, call_info)
#                 logger.info(f"✅ Conversación iniciada enviada a API: {call_id}")
#             except Exception as e:
#                 logger.error(f"❌ Error enviando inicio de conversación: {e}")
                
#         elif event_type == "call_ended":
#             # Procesar fin de llamada
#             logger.info(f"🔴 Procesando call_ended: {call_id}")
            
#             duration_seconds = call_info.get("duration_ms", 0) // 1000
            
#             # Procesar transcript si existe
#             transcript_data = call_info.get("transcript_object", [])
#             logger.info(f"📝 Procesando {len(transcript_data)} mensajes del transcript")
            
#             for msg in transcript_data:
#                 try:
#                     role = msg.get("role", "unknown")
#                     content = msg.get("content", "").strip()
                    
#                     if content:  # Solo enviar si hay contenido
#                         await log_message(call_id, role, content, msg.get("metadata", {}))
#                         logger.debug(f"💬 Mensaje enviado: {role} - {content[:50]}...")
#                 except Exception as msg_error:
#                     logger.error(f"❌ Error procesando mensaje: {msg_error}")
#                     continue
            
#             # Enviar fin de conversación
#             try:
#                 await log_conversation_end(call_id, duration_seconds)
#                 logger.info(f"📝 Conversación finalizada enviada: {call_id}")
#             except Exception as e:
#                 logger.error(f"❌ Error enviando fin de conversación: {e}")
            
#             # Limpiar memoria local
#             if call_id in active_calls:
#                 del active_calls[call_id]
#                 logger.info(f"🧹 Historial limpiado: {call_id}")
                    
#         elif event_type == "call_analyzed":
#             # Procesar análisis de llamada
#             logger.info(f"📊 Procesando call_analyzed: {call_id}")
#             analysis = call_info.get("call_analysis", {})
            
#             if analysis:
#                 try:
#                     # Crear endpoint de análisis si no existe
#                     async with httpx.AsyncClient(timeout=10.0) as client:
#                         response = await client.post(
#                             f"{AUTH_API_URL}/api/v1/conversations/analysis",
#                             json={
#                                 "call_id": call_id,
#                                 "analysis": analysis,
#                                 "timestamp": datetime.now().isoformat()
#                             },
#                             headers={"Content-Type": "application/json"}
#                         )
#                         if response.status_code == 200:
#                             logger.info(f"📊 Análisis enviado: {call_id}")
#                         else:
#                             logger.warning(f"⚠️ Análisis no enviado ({response.status_code}): {call_id}")
#                 except Exception as e:
#                     logger.error(f"❌ Error enviando análisis: {e}")
#             else:
#                 logger.info(f"📊 Sin datos de análisis para: {call_id}")
#         else:
#             logger.warning(f"⚠️ Evento no reconocido: {event_type}")
        
#         return {"status": "ok", "processed_event": event_type or "unknown", "call_id": call_id}
            
#     except Exception as e:
#         logger.error(f"❌ Error en endpoint POST /call: {e}")
#         raise HTTPException(status_code=500, detail=f"Error interno del servidor: {e}")
    
# # @app.post("/call")
# # async def register_call(request: Request):
# #     """Endpoint para manejar webhooks de Retell AI y enviar a API de autenticación"""
# #     try:
# #         call_data = await request.json()
# #         logger.info(f"📞 Datos recibidos en POST /call: {json.dumps(call_data, indent=2)}")

# #         # Verificar si es un evento específico
# #         event_type = call_data.get("event")
# #         call_info = call_data.get("call", {})
        
# #         if event_type == "call_started":
# #             # Procesar inicio de llamada
# #             call_id = call_info.get("call_id")
# #             if call_id:
# #                 # Inicializar historial local
# #                 active_calls[call_id] = [
# #                     {
# #                         "role": "system", 
# #                         "content": """Eres NexusVoz, un asistente de voz profesional especializado en ventas y soporte técnico..."""
# #                     },
# #                 ]
                
# #                 # Enviar a API de autenticación
# #                 await log_conversation_start(call_id, call_info)
# #                 logger.info(f"✅ Llamada iniciada registrada: {call_id}")
                
# #         elif event_type == "call_ended":
# #             # Procesar fin de llamada - AQUÍ ESTÁ LA CLAVE
# #             call_id = call_info.get("call_id")
# #             if call_id:
# #                 duration_seconds = call_info.get("duration_ms", 0) // 1000
                
# #                 # Procesar transcript si existe
# #                 transcript_data = call_info.get("transcript_object", [])
# #                 for msg in transcript_data:
# #                     await log_message(
# #                         call_id, 
# #                         msg.get("role"), 
# #                         msg.get("content", ""),
# #                         msg.get("metadata", {})
# #                     )
                
# #                 # Enviar fin de conversación
# #                 await log_conversation_end(call_id, duration_seconds)
                
# #                 # Limpiar memoria local
# #                 if call_id in active_calls:
# #                     del active_calls[call_id]
                    
# #                 logger.info(f"📝 Llamada finalizada procesada: {call_id}")
                
# #         elif event_type == "call_analyzed":
# #             # Procesar análisis de llamada (datos adicionales)
# #             call_id = call_info.get("call_id")
# #             analysis = call_info.get("call_analysis", {})
            
# #             # Enviar análisis adicional si es necesario
# #             if call_id and analysis:
# #                 try:
# #                     async with httpx.AsyncClient(timeout=10.0) as client:
# #                         response = await client.post(
# #                             f"{AUTH_API_URL}/api/v1/conversations/analysis",
# #                             json={
# #                                 "call_id": call_id,
# #                                 "analysis": analysis,
# #                                 "timestamp": datetime.now().isoformat()
# #                             },
# #                             headers={"Content-Type": "application/json"}
# #                         )
# #                         if response.status_code == 200:
# #                             logger.info(f"📊 Análisis enviado: {call_id}")
# #                         else:
# #                             logger.warning(f"⚠️ No se pudo enviar análisis: {response.status_code}")
# #                 except Exception as e:
# #                     logger.error(f"❌ Error enviando análisis: {e}")
        
# #         return {"status": "ok", "processed_event": event_type or "unknown"}
            
# #     except Exception as e:
# #         logger.error(f"❌ Error en endpoint POST /call: {e}")
# #         raise HTTPException(status_code=500, detail=f"Error interno del servidor: {e}")


# # # FUNCIÓN AUXILIAR PARA PROCESAR TRANSCRIPT
# # async def process_transcript_data(call_id: str, transcript_data: list):
# #     """Procesa y envía los datos del transcript a la API de autenticación"""
# #     for message_data in transcript_data:
# #         try:
# #             role = message_data.get("role", "unknown")
# #             content = message_data.get("content", "")
            
# #             if content.strip():  # Solo enviar si hay contenido
# #                 await log_message(call_id, role, content, message_data.get("metadata", {}))
                
# #         except Exception as e:
# #             logger.error(f"❌ Error procesando mensaje del transcript: {e}")
# #             continue

# # === WEBSOCKET PARA CONVERSACIÓN EN TIEMPO REAL ===

# # @app.websocket("/call")
# # async def websocket_endpoint(websocket: WebSocket):
# #     """WebSocket para manejar conversación en tiempo real"""
# #     await websocket.accept()
# #     call_id = None
# #     conversation_start_time = datetime.now()

# #     try:
# #         # Primer mensaje contiene call_id
# #         start_message = await websocket.receive_json()
# #         call_id = start_message["call_id"]
        
# #         logger.info(f"🔗 Conexión WebSocket establecida: {call_id}")
        
# #         # Registrar inicio de conversación
# #         await log_conversation_start(call_id, start_message)

# #         # Mapear herramientas a funciones
# #         available_tools = {
# #             "get_pricing_plans": get_pricing_plans,
# #             "schedule_appointment": schedule_appointment
# #         }

# #         # Bucle principal de conversación
# #         while True:
# #             try:
# #                 message = await websocket.receive_json()

# #                 if message["interaction_type"] == "update_only":
# #                     user_text = message["user_input"]["transcript"]
# #                     logger.info(f"👤 Usuario [{call_id}]: {user_text}")

# #                     # Registrar mensaje del usuario
# #                     await log_message(call_id, "user", user_text)

# #                     # Obtener historial de conversación
# #                     history = active_calls.get(call_id, [])
# #                     history.append({"role": "user", "content": user_text})

# #                     # Bucle de procesamiento con herramientas
# #                     max_iterations = 5  # Prevenir loops infinitos
# #                     iteration = 0
                    
# #                     while iteration < max_iterations:
# #                         iteration += 1
                        
# #                         try:
# #                             response = openai.chat.completions.create(
# #                                 model="deepseek-chat",
# #                                 messages=history,
# #                                 stream=True,
# #                                 tools=tools,
# #                                 tool_choice="auto",
# #                                 temperature=0.7
# #                             )
                            
# #                             full_response_text = ""
# #                             tool_calls = []

# #                             # Procesar respuesta streaming
# #                             for chunk in response:
# #                                 delta = chunk.choices[0].delta
                                
# #                                 if delta.content:
# #                                     full_response_text += delta.content
# #                                     # Enviar respuesta parcial al cliente
# #                                     await websocket.send_json({
# #                                         "response": delta.content,
# #                                         "interaction_type": "response",
# #                                         "response_type": "partial"
# #                                     })
                                
# #                                 # Detectar llamadas a herramientas
# #                                 if delta.tool_calls:
# #                                     for tool_call in delta.tool_calls:
# #                                         if tool_call.function.name:
# #                                             tool_calls.append({
# #                                                 "id": tool_call.id,
# #                                                 "name": tool_call.function.name,
# #                                                 "arguments": tool_call.function.arguments
# #                                             })

# #                             # Si no hay herramientas, terminar bucle
# #                             if not tool_calls:
# #                                 if full_response_text:
# #                                     history.append({"role": "assistant", "content": full_response_text})
# #                                     await log_message(call_id, "assistant", full_response_text)
# #                                     logger.info(f"🤖 Asistente [{call_id}]: {full_response_text[:100]}...")
# #                                 break

# #                             # Procesar herramientas
# #                             history.append({
# #                                 "role": "assistant",
# #                                 "content": None,
# #                                 "tool_calls": tool_calls
# #                             })

# #                             for tool_call in tool_calls:
# #                                 function_name = tool_call["name"]
# #                                 function_to_call = available_tools.get(function_name)
                                
# #                                 try:
# #                                     function_args = json.loads(tool_call["arguments"])
                                    
# #                                     # Agregar call_id a argumentos si es schedule_appointment
# #                                     if function_name == "schedule_appointment":
# #                                         function_args["call_id"] = call_id
                                    
# #                                     logger.info(f"🔧 Ejecutando {function_name} con args: {function_args}")
                                    
# #                                     if function_to_call:
# #                                         # Ejecutar herramienta (async o sync)
# #                                         if asyncio.iscoroutinefunction(function_to_call):
# #                                             function_response = await function_to_call(**function_args)
# #                                         else:
# #                                             function_response = function_to_call(**function_args)
                                        
# #                                         # Registrar ejecución de herramienta
# #                                         await log_tool_execution(call_id, function_name, function_args, function_response)
                                        
# #                                         # Agregar respuesta al historial
# #                                         history.append({
# #                                             "tool_call_id": tool_call["id"],
# #                                             "role": "tool",
# #                                             "name": function_name,
# #                                             "content": json.dumps(function_response, ensure_ascii=False)
# #                                         })
                                        
# #                                         logger.info(f"✅ Herramienta {function_name} ejecutada exitosamente")
                                        
# #                                     else:
# #                                         logger.warning(f"⚠️ Herramienta no encontrada: {function_name}")
# #                                         history.append({
# #                                             "tool_call_id": tool_call["id"],
# #                                             "role": "tool",
# #                                             "name": function_name,
# #                                             "content": json.dumps({"error": "Herramienta no encontrada"})
# #                                         })
                                        
# #                                 except json.JSONDecodeError as je:
# #                                     logger.error(f"❌ Error decodificando argumentos JSON: {je}")
# #                                     history.append({
# #                                         "tool_call_id": tool_call["id"],
# #                                         "role": "tool",
# #                                         "name": function_name,
# #                                         "content": json.dumps({"error": "Argumentos inválidos"})
# #                                     })
# #                                 except Exception as te:
# #                                     logger.error(f"❌ Error ejecutando herramienta {function_name}: {te}")
# #                                     history.append({
# #                                         "tool_call_id": tool_call["id"],
# #                                         "role": "tool",
# #                                         "name": function_name,
# #                                         "content": json.dumps({"error": f"Error de ejecución: {str(te)}"})
# #                                     })

# #                         except Exception as e:
# #                             logger.error(f"❌ Error en llamada a OpenAI: {e}")
# #                             await websocket.send_json({
# #                                 "response": "Lo siento, tuve un problema técnico. ¿Puedes repetir tu pregunta?",
# #                                 "interaction_type": "response",
# #                                 "response_type": "complete"
# #                             })
# #                             break

# #                     # Actualizar historial de la llamada
# #                     active_calls[call_id] = history

# #             except Exception as msg_error:
# #                 logger.error(f"❌ Error procesando mensaje: {msg_error}")
# #                 continue

# #     except Exception as e:
# #         logger.error(f"❌ Error en WebSocket para {call_id}: {e}")
# #     finally:
# #         # Cleanup y logging de fin de conversación
# #         if call_id:
# #             duration = (datetime.now() - conversation_start_time).total_seconds()
# #             await log_conversation_end(call_id, int(duration))
            
# #             if call_id in active_calls:
# #                 del active_calls[call_id]
            
# #             logger.info(f"🔚 Conversación finalizada: {call_id} (duración: {duration:.0f}s)")
        
# #         try:
# #             await websocket.close()
# #         except:
# #             pass

# # === CONFIGURACIÓN DE STARTUP ===

# @app.on_event("startup")
# async def startup_event():
#     logger.info("🚀 NexusVoz Retell AI Server iniciado")
#     logger.info(f"🔗 Conectando a API de autenticación: {AUTH_API_URL}")
    
#     # Verificar conexión con API de autenticación
#     try:
#         async with httpx.AsyncClient(timeout=10.0) as client:
#             response = await client.get(f"{AUTH_API_URL}/health")
#             if response.status_code == 200:
#                 logger.info("✅ Conexión con API de autenticación establecida")
#             else:
#                 logger.warning("⚠️ API de autenticación no responde correctamente")
#     except Exception as e:
#         logger.error(f"❌ Error conectando con API de autenticación: {e}")

# @app.on_event("shutdown")
# async def shutdown_event():
#     logger.info("🛑 NexusVoz Retell AI Server detenido")

# @app.get("/health")
# async def health_check():
#     return {"status": "healthy", "service": "nexusvoz-retell", "timestamp": datetime.now().isoformat()}
# # === EJECUCIÓN PRINCIPAL ===

# if __name__ == "__main__":
#     nest_asyncio.apply()
#     uvicorn.run(
#         app, 
#         host="0.0.0.0", 
#         port=int(os.environ.get("PORT", 8001)),
#         log_level="info"
#     )