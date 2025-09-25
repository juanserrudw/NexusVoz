from typing import Optional
import secrets
import string

def generate_session_id(length: int = 16) -> str:
    """Generar un ID de sesión aleatorio"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def validate_email(email: str) -> bool:
    """Validar formato de email básico"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def format_response_for_retelli(user_query: str, api_response: str, metadata: Optional[dict] = None) -> dict:
    """Formatear respuesta para almacenar en RetelliA"""
    return {
        "query": user_query,
        "response": api_response,
        "session_id": generate_session_id(),
        "response_time": metadata.get("response_time") if metadata else None,
        "confidence_score": metadata.get("confidence_score") if metadata else None
    }