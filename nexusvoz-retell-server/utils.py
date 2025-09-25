"""
Utilidades y funciones auxiliares para el servidor NexusVoz Retell AI
"""
import re
import json
import logging
from datetime import datetime, date, timedelta
from typing import Optional, Dict, Any, List
import uuid
import hashlib

logger = logging.getLogger(__name__)


class DataExtractor:
    """Clase para extraer información de textos de conversación"""
    
    @staticmethod
    def extract_email(text: str) -> Optional[str]:
        """Extraer email de un texto usando regex mejorado"""
        email_patterns = [
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
            r'correo[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})',
            r'email[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})',
            r'mi email es[:\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})'
        ]
        
        for pattern in email_patterns:
            matches = re.findall(pattern, text.lower())
            if matches:
                email = matches[0] if isinstance(matches[0], str) else matches[0][0]
                if DataValidator.is_valid_email(email):
                    return email.lower().strip()
        return None

    @staticmethod
    def extract_phone(text: str) -> Optional[str]:
        """Extraer número telefónico de un texto"""
        # Limpiar texto de caracteres especiales para mejor detección
        clean_text = re.sub(r'[^\d\s\+\-\(\)\.]+', ' ', text)
        
        phone_patterns = [
            # Formatos colombianos
            r'(\+57\s?)?[1-9]\d{9}',  # +57 3001234567 o 3001234567
            r'(\+57\s?)?[1-9]\d{2}\s?\d{3}\s?\d{4}',  # 300 123 4567
            r'(\+57\s?)?\(\d{3}\)\s?\d{3}[-.\s]?\d{4}',  # (300) 123-4567
            # Formatos internacionales generales
            r'(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
            r'(\+\d{1,3}[-.\s]?)?\d{10,15}',
            # Patrones de texto
            r'teléfono[:\s]+([+\d\s\-\(\)\.]{10,15})',
            r'celular[:\s]+([+\d\s\-\(\)\.]{10,15})',
            r'número[:\s]+([+\d\s\-\(\)\.]{10,15})'
        ]
        
        for pattern in phone_patterns:
            matches = re.findall(pattern, clean_text)
            if matches:
                phone = matches[0] if isinstance(matches[0], str) else matches[0][-1]
                cleaned_phone = re.sub(r'[^\d\+]', '', phone)
                if len(cleaned_phone) >= 10:
                    return DataValidator.format_phone(cleaned_phone)
        return None

    @staticmethod
    def extract_name(text: str) -> Optional[str]:
        """Extraer nombre de una conversación"""
        name_patterns = [
            r'mi nombre es\s+([A-Za-záéíóúñÁÉÍÓÚÑ\s]{2,40})',
            r'me llamo\s+([A-Za-záéíóúñÁÉÍÓÚÑ\s]{2,40})',
            r'soy\s+([A-Za-záéíóúñÁÉÍÓÚÑ\s]{2,40})',
            r'nombre[:\s]+([A-Za-záéíóúñÁÉÍÓÚÑ\s]{2,40})',
        ]
        
        for pattern in name_patterns:
            matches = re.findall(pattern, text.lower())
            if matches:
                name = matches[0].strip().title()
                if DataValidator.is_valid_name(name):
                    return name
        return None

    @staticmethod
    def extract_date(text: str) -> Optional[str]:
        """Extraer fecha de un texto y convertir a formato YYYY-MM-DD"""
        today = datetime.now().date()
        
        # Patrones de fecha
        date_patterns = [
            r'(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})',  # DD/MM/YYYY o DD-MM-YYYY
            r'(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})',  # YYYY/MM/DD
            r'(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})',  # 15 de marzo de 2024
            r'(\w+)\s+(\d{1,2}),?\s+(\d{4})',  # marzo 15, 2024
        ]
        
        # Días relativos
        relative_patterns = {
            r'mañana': today + timedelta(days=1),
            r'pasado mañana': today + timedelta(days=2),
            r'próximo\s+lunes': DateUtils.next_weekday(today, 0),
            r'próximo\s+martes': DateUtils.next_weekday(today, 1),
            r'próximo\s+miércoles': DateUtils.next_weekday(today, 2),
            r'próximo\s+jueves': DateUtils.next_weekday(today, 3),
            r'próximo\s+viernes': DateUtils.next_weekday(today, 4),
            r'próximo\s+sábado': DateUtils.next_weekday(today, 5),
            r'próximo\s+domingo': DateUtils.next_weekday(today, 6),
        }
        
        text_lower = text.lower()
        
        # Buscar fechas relativas
        for pattern, target_date in relative_patterns.items():
            if re.search(pattern, text_lower):
                return target_date.strftime('%Y-%m-%d')
        
        # Buscar fechas específicas
        for pattern in date_patterns:
            matches = re.findall(pattern, text)
            if matches:
                try:
                    parsed_date = DateUtils.parse_date_match(matches[0])
                    if parsed_date and parsed_date >= today:
                        return parsed_date.strftime('%Y-%m-%d')
                except:
                    continue
        
        return None

    @staticmethod
    def extract_time(text: str) -> Optional[str]:
        """Extraer hora de un texto y convertir a formato HH:MM"""
        time_patterns = [
            r'(\d{1,2}):(\d{2})\s*(?:am|pm)?',
            r'(\d{1,2})\s*(?:am|pm)',
            r'a las (\d{1,2}):?(\d{2})?',
            r'(\d{1,2})\s+(?:de la )?(?:mañana|tarde|noche)',
        ]
        
        text_lower = text.lower()
        
        for pattern in time_patterns:
            matches = re.findall(pattern, text_lower)
            if matches:
                try:
                    time_str = DateUtils.parse_time_match(matches[0], text_lower)
                    if time_str:
                        return time_str
                except:
                    continue
        
        return None


class DataValidator:
    """Clase para validar datos extraídos"""
    
    @staticmethod
    def is_valid_email(email: str) -> bool:
        """Validar formato de email"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        return bool(re.match(pattern, email))
    
    @staticmethod
    def is_valid_name(name: str) -> bool:
        """Validar que el nombre sea válido"""
        if not name or len(name.strip()) < 2:
            return False
        
        # Verificar que no sean solo números o caracteres especiales
        if re.match(r'^[\d\W]+, name'):
            return False
        
        # Verificar que tenga al menos una letra
        if not re.search(r'[a-zA-ZáéíóúñÁÉÍÓÚÑ]', name):
            return False
        
        return True
    
    @staticmethod
    def format_phone(phone: str) -> str:
        """Formatear número telefónico"""
        # Remover todo excepto números y +
        clean = re.sub(r'[^\d\+]', '', phone)
        
        # Si comienza con +57 (Colombia), formatear apropiadamente
        if clean.startswith('+57'):
            return clean
        elif clean.startswith('57') and len(clean) == 12:
            return f'+{clean}'
        elif len(clean) == 10:
            return f'+57{clean}'
        
        return clean
    
    @staticmethod
    def validate_date(date_str: str) -> bool:
        """Validar que la fecha sea futura y válida"""
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            return target_date >= datetime.now().date()
        except:
            return False
    
    @staticmethod
    def validate_time(time_str: str) -> bool:
        """Validar formato de hora"""
        try:
            datetime.strptime(time_str, '%H:%M')
            return True
        except:
            return False


class DateUtils:
    """Utilidades para manejo de fechas"""
    
    MONTHS_ES = {
        'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
        'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
        'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
    }
    
    @staticmethod
    def next_weekday(current_date: date, weekday: int) -> date:
        """Obtener la próxima fecha de un día específico de la semana"""
        days_ahead = weekday - current_date.weekday()
        if days_ahead <= 0:  # Target day already happened this week
            days_ahead += 7
        return current_date + timedelta(days=days_ahead)
    
    @staticmethod
    def parse_date_match(match_tuple) -> Optional[date]:
        """Parsear tupla de fecha capturada por regex"""
        try:
            if len(match_tuple) == 3:
                day, month, year = match_tuple
                
                # Si el mes es texto, convertir
                if month.isalpha():
                    month_num = DateUtils.MONTHS_ES.get(month.lower())
                    if not month_num:
                        return None
                    return date(int(year), month_num, int(day))
                else:
                    # Determinar formato basado en valores
                    if int(year) > 31:  # Es año
                        if int(day) > 12:  # DD/MM/YYYY
                            return date(int(year), int(month), int(day))
                        else:  # YYYY/MM/DD
                            return date(int(day), int(month), int(year))
                    else:
                        return date(int(year), int(month), int(day))
        except:
            pass
        return None
    
    @staticmethod
    def parse_time_match(match_tuple, original_text: str) -> Optional[str]:
        """Parsear tupla de tiempo capturada por regex"""
        try:
            if len(match_tuple) == 1:
                hour = int(match_tuple[0])
                minute = 0
            else:
                hour = int(match_tuple[0])
                minute = int(match_tuple[1]) if match_tuple[1] else 0
            
            # Detectar AM/PM
            if 'pm' in original_text and hour < 12:
                hour += 12
            elif 'am' in original_text and hour == 12:
                hour = 0
            elif 'tarde' in original_text and hour < 12:
                hour += 12
            elif 'noche' in original_text and hour < 12:
                hour += 12
            
            if 0 <= hour <= 23 and 0 <= minute <= 59:
                return f"{hour:02d}:{minute:02d}"
        except:
            pass
        return None


class ConversationUtils:
    """Utilidades para manejo de conversaciones"""
    
    @staticmethod
    def generate_session_id() -> str:
        """Generar ID único para sesión"""
        return str(uuid.uuid4())
    
    @staticmethod
    def hash_sensitive_data(data: str) -> str:
        """Hashear datos sensibles para logging seguro"""
        return hashlib.sha256(data.encode()).hexdigest()[:16]
    
    @staticmethod
    def extract_intent(text: str) -> Optional[str]:
        """Extraer intención de la conversación"""
        text_lower = text.lower()
        
        intent_patterns = {
            'pricing': [r'precio', r'costo', r'cuanto cuesta', r'tarifa', r'plan'],
            'appointment': [r'cita', r'reunión', r'agendar', r'programar', r'reservar'],
            'support': [r'ayuda', r'soporte', r'problema', r'error', r'no funciona'],
            'demo': [r'demo', r'demostración', r'mostrar', r'ver como funciona'],
            'information': [r'información', r'que es', r'como funciona', r'detalles']
        }
        
        for intent, patterns in intent_patterns.items():
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    return intent
        
        return None
    
    @staticmethod
    def extract_conversation_data(messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Extraer datos útiles de toda una conversación"""
        data = {
            'client_email': None,
            'client_name': None,
            'client_phone': None,
            'intent': None,
            'appointment_requested': False,
            'pricing_requested': False
        }
        
        full_text = ' '.join([msg.get('content', '') for msg in messages if msg.get('role') == 'user'])
        
        data['client_email'] = DataExtractor.extract_email(full_text)
        data['client_name'] = DataExtractor.extract_name(full_text)
        data['client_phone'] = DataExtractor.extract_phone(full_text)
        data['intent'] = ConversationUtils.extract_intent(full_text)
        
        # Detectar si se solicitó información específica
        text_lower = full_text.lower()
        data['appointment_requested'] = any(word in text_lower for word in ['cita', 'reunión', 'agendar'])
        data['pricing_requested'] = any(word in text_lower for word in ['precio', 'costo', 'plan'])
        
        return data


class ResponseFormatter:
    """Formatear respuestas del asistente"""
    
    @staticmethod
    def format_error_response(error_type: str, message: str) -> Dict[str, Any]:
        """Formatear respuesta de error"""
        return {
            "status": "error",
            "error_type": error_type,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
    
    @staticmethod
    def format_success_response(data: Any, message: str = "Success") -> Dict[str, Any]:
        """Formatear respuesta exitosa"""
        return {
            "status": "success",
            "message": message,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
    
    @staticmethod
    def format_appointment_confirmation(appointment_data: Dict[str, Any]) -> str:
        """Formatear confirmación de cita para el usuario"""
        return f"""¡Perfecto! He agendado tu cita con los siguientes detalles:

📅 Tipo: {appointment_data.get('appointment_type', 'N/A')}
👤 Nombre: {appointment_data.get('client_name', 'N/A')}
📧 Email: {appointment_data.get('client_email', 'N/A')}
📆 Fecha: {appointment_data.get('appointment_date', 'N/A')}
🕐 Hora: {appointment_data.get('appointment_time', 'N/A')}
🔢 Código de confirmación: {appointment_data.get('confirmation_code', 'N/A')}

Recibirás un email de confirmación en los próximos minutos. 
Si necesitas hacer algún cambio, por favor contáctanos con tu código de confirmación."""


class LoggingUtils:
    """Utilidades para logging mejorado"""
    
    @staticmethod
    def log_conversation_event(call_id: str, event_type: str, data: Dict[str, Any]):
        """Log estructurado de eventos de conversación"""
        logger.info(
            f"CONVERSATION_EVENT",
            extra={
                "call_id": call_id,
                "event_type": event_type,
                "data": data,
                "timestamp": datetime.now().isoformat()
            }
        )
    
    @staticmethod
    def log_tool_execution(call_id: str, tool_name: str, args: Dict[str, Any], 
                          result: Dict[str, Any], duration: float):
        """Log estructurado de ejecución de herramientas"""
        logger.info(
            f"TOOL_EXECUTION",
            extra={
                "call_id": call_id,
                "tool_name": tool_name,
                "args": args,
                "result": result,
                "duration_ms": duration * 1000,
                "timestamp": datetime.now().isoformat()
            }
        )
    
    @staticmethod
    def log_api_call(call_id: str, api_endpoint: str, status_code: int, 
                     duration: float, error: Optional[str] = None):
        """Log estructurado de llamadas a API"""
        logger.info(
            f"API_CALL",
            extra={
                "call_id": call_id,
                "endpoint": api_endpoint,
                "status_code": status_code,
                "duration_ms": duration * 1000,
                "error": error,
                "timestamp": datetime.now().isoformat()
            }
        )