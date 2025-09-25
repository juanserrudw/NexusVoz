
FROM python:3.11-slim


WORKDIR /app
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*


COPY requirements.txt .

# Instalar dependencias de Python
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

    
COPY . .

# Crear usuario no-root 
RUN useradd --create-home --shell /bin/bash retell && \
    chown -R retell:retell /app
USER retell

# Crear directorio para logs
RUN mkdir -p /app/logs

# Exponer el puerto
EXPOSE 8001

# Variables de entorno por defecto
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Comando de inicio
CMD ["python", "main.py"]