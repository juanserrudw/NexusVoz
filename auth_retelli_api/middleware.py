from fastapi import Request, Response
from fastapi.middleware.base import BaseHTTPMiddleware
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Log de la petición entrante
        logger.info(f"Petición entrante: {request.method} {request.url}")
        
        response = await call_next(request)
        
        # Calcular tiempo de procesamiento
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        
        # Log de la respuesta
        logger.info(f"Respuesta: {response.status_code} - Tiempo: {process_time:.4f}s")
        
        return response