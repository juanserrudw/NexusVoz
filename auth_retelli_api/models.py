from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
   
    phone = Column(String, nullable=True)  
    address = Column(String, nullable=True)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relación con respuestas de RetelliA
    retelli_responses = relationship("RetelliAResponse", back_populates="user")
    
    conversations = relationship("Conversation", back_populates="user")
    appointments = relationship("Appointment", back_populates="user")

class RetelliAResponse(Base):
    __tablename__ = "retelli_responses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(String, nullable=True)  
    query = Column(Text, nullable=False)  
    response = Column(Text, nullable=False)  
    response_time = Column(Integer, nullable=True)  
    confidence_score = Column(String, nullable=True)  
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    
    user = relationship("User", back_populates="retelli_responses")


class Conversation(Base):
    """Modelo para almacenar conversaciones de Retell AI"""
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    call_id = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  
    
    # Información de la llamada
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    status = Column(String, default="active")  
    
    # Metadatos de Retell
    retell_data = Column(JSON, nullable=True)  
    phone_number = Column(String, nullable=True)
    caller_info = Column(JSON, nullable=True)
    
    # Datos extraídos durante la conversación
    client_email = Column(String, nullable=True)
    client_name = Column(String, nullable=True)
    intent_detected = Column(String, nullable=True)  
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    
    messages = relationship("ConversationMessage", back_populates="conversation", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="conversation")
    tool_executions = relationship("ToolExecution", back_populates="conversation")
    
    # Relación con usuari
    user = relationship("User", back_populates="conversations")

class ConversationMessage(Base):
    """Modelo para almacenar mensajes individuales de las conversaciones"""
    __tablename__ = "conversation_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    
    # Contenido del mensaje
    role = Column(String, nullable=False)  
    content = Column(Text, nullable=False)
    
    # Metadatos
    timestamp = Column(DateTime, default=datetime.utcnow)
    meta_data = Column(JSON, nullable=True)  
    
    # Información específica de Retell
    transcript_confidence = Column(String, nullable=True)  
    audio_duration = Column(Integer, nullable=True) 
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    conversation = relationship("Conversation", back_populates="messages")

class ToolExecution(Base):
    """Modelo para almacenar ejecuciones de herramientas"""
    __tablename__ = "tool_executions"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    
    # Información de la herramienta
    tool_name = Column(String, nullable=False)
    arguments = Column(JSON, nullable=False)
    result = Column(JSON, nullable=False)
    
    # Estado de la ejecución
    status = Column(String, default="completed")  
    error_message = Column(Text, nullable=True)
    execution_time_ms = Column(Integer, nullable=True)
    
    # Timestamps
    timestamp = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    conversation = relationship("Conversation", back_populates="tool_executions")

class Appointment(Base):
    """Modelo para almacenar citas agendadas"""
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(String, unique=True, index=True, nullable=False)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Información de la cita
    appointment_type = Column(String, nullable=False)  
    client_email = Column(String, nullable=False)
    client_name = Column(String, nullable=True)
    client_phone = Column(String, nullable=True)
    
    # Fecha y hora
    appointment_date = Column(String, nullable=False)  
    appointment_time = Column(String, nullable=False)  
    
    # Estado y seguimiento
    status = Column(String, default="scheduled")  
    source = Column(String, default="voice_assistant")  
    confirmation_code = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Notificaciones
    email_sent = Column(Boolean, default=False)
    sms_sent = Column(Boolean, default=False)
    reminder_sent = Column(Boolean, default=False)
    
    # Timestamps
    scheduled_at = Column(DateTime, default=datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    conversation = relationship("Conversation", back_populates="appointments")
    user = relationship("User", back_populates="appointments")

class LeadGeneration(Base):
    """Modelo para capturar leads generados durante las conversaciones"""
    __tablename__ = "lead_generation"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=True)
    
    # Información del lead
    email = Column(String, nullable=False, index=True)
    name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    company = Column(String, nullable=True)
    
    # Información de interés
    interest_level = Column(String, nullable=True) 
    interested_plans = Column(JSON, nullable=True)  
    budget_mentioned = Column(String, nullable=True)
    timeline = Column(String, nullable=True)
    
    # Estado del lead
    status = Column(String, default="new")  
    source = Column(String, default="voice_assistant")
    tags = Column(JSON, nullable=True)  
    
    # Seguimiento
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    follow_up_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    conversation = relationship("Conversation")
    assigned_user = relationship("User", foreign_keys=[assigned_to])

class CallAnalytics(Base):
    """Modelo para almacenar analytics de las llamadas"""
    __tablename__ = "call_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    
    # Métricas de la conversación
    total_messages = Column(Integer, default=0)
    user_messages = Column(Integer, default=0)
    assistant_messages = Column(Integer, default=0)
    tools_used = Column(JSON, nullable=True)  
    
    # Métricas de calidad
    avg_response_time_ms = Column(Integer, nullable=True)
    errors_count = Column(Integer, default=0)
    user_satisfaction = Column(String, nullable=True) 
    
    # Resultados de la conversación
    conversion_achieved = Column(Boolean, default=False)  
    conversion_type = Column(String, nullable=True) 
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    conversation = relationship("Conversation")



