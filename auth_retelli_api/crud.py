from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any
from models import (User, RetelliAResponse, Conversation, ConversationMessage, ToolExecution, Appointment, 
    LeadGeneration, CallAnalytics)
from schemas import UserCreate, RetelliAResponseCreate
from schemas import (
    ConversationStart, ConversationMessage as ConversationMessageSchema,
    AppointmentCreate, LeadCreate, LeadUpdate
)
from auth import get_password_hash

# CRUD para Usuarios
def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        phone=user.phone,           # AGREGAR ESTA LÍNEA
        address=user.address,  
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()

def update_user(db: Session, user_id: int, user_data: dict):
    db.query(User).filter(User.id == user_id).update(user_data)
    db.commit()
    return get_user(db, user_id)

def delete_user(db: Session, user_id: int):
    user = get_user(db, user_id)
    if user:
        db.delete(user)
        db.commit()
    return user

# CRUD para RetelliA Responses
def create_retelli_response(db: Session, response: RetelliAResponseCreate, user_id: int):
    db_response = RetelliAResponse(
        user_id=user_id,
        session_id=response.session_id,
        query=response.query,
        response=response.response,
        response_time=response.response_time,
        confidence_score=response.confidence_score
    )
    db.add(db_response)
    db.commit()
    db.refresh(db_response)
    return db_response

def get_user_responses(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(RetelliAResponse).filter(
        RetelliAResponse.user_id == user_id
    ).offset(skip).limit(limit).all()

def get_response(db: Session, response_id: int):
    return db.query(RetelliAResponse).filter(RetelliAResponse.id == response_id).first()

def delete_response(db: Session, response_id: int):
    response = get_response(db, response_id)
    if response:
        db.delete(response)
        db.commit()
    return response

# ========================================
# CRUD PARA CONVERSACIONES
# ========================================

def create_conversation(db: Session, call_id: str, retell_data: Dict[str, Any]) -> Conversation:
    """Crear una nueva conversación"""
    conversation = Conversation(
        call_id=call_id,
        retell_data=retell_data,
        phone_number=retell_data.get('phone_number'),
        caller_info=retell_data.get('caller_info'),
        status="active"
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation

def get_conversation_by_call_id(db: Session, call_id: str) -> Optional[Conversation]:
    """Obtener conversación por call_id"""
    return db.query(Conversation).filter(Conversation.call_id == call_id).first()

def update_conversation(db: Session, call_id: str, **kwargs) -> Optional[Conversation]:
    """Actualizar una conversación"""
    conversation = get_conversation_by_call_id(db, call_id)
    if conversation:
        for key, value in kwargs.items():
            if hasattr(conversation, key):
                setattr(conversation, key, value)
        conversation.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(conversation)
    return conversation

def end_conversation(db: Session, call_id: str, duration_seconds: int = None) -> Optional[Conversation]:
    """Finalizar una conversación"""
    return update_conversation(
        db, 
        call_id, 
        ended_at=datetime.utcnow(), 
        duration_seconds=duration_seconds,
        status="completed"
    )

def get_conversations(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    status: str = None,
    intent: str = None,
    date_from: date = None,
    date_to: date = None
) -> List[Conversation]:
    """Obtener lista de conversaciones con filtros"""
    query = db.query(Conversation)
    
    if status:
        query = query.filter(Conversation.status == status)
    if intent:
        query = query.filter(Conversation.intent_detected == intent)
    if date_from:
        query = query.filter(func.date(Conversation.started_at) >= date_from)
    if date_to:
        query = query.filter(func.date(Conversation.started_at) <= date_to)
    
    return query.order_by(desc(Conversation.started_at)).offset(skip).limit(limit).all()

# ========================================
# CRUD PARA MENSAJES DE CONVERSACIÓN
# ========================================

def create_conversation_message(
    db: Session, 
    conversation_id: int, 
    role: str, 
    content: str, 
    meta_data: Dict[str, Any] = None,
    timestamp: datetime = None
) -> ConversationMessage:
    """Crear un mensaje de conversación"""
    message = ConversationMessage(
        conversation_id=conversation_id,
        role=role,
        content=content,
        meta_data=meta_data or {},
        timestamp=timestamp or datetime.utcnow()
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message

def get_conversation_messages(db: Session, conversation_id: int) -> List[ConversationMessage]:
    """Obtener todos los mensajes de una conversación"""
    return db.query(ConversationMessage).filter(
        ConversationMessage.conversation_id == conversation_id
    ).order_by(ConversationMessage.timestamp).all()

def get_messages_by_role(db: Session, conversation_id: int, role: str) -> List[ConversationMessage]:
    """Obtener mensajes por rol específico"""
    return db.query(ConversationMessage).filter(
        and_(
            ConversationMessage.conversation_id == conversation_id,
            ConversationMessage.role == role
        )
    ).order_by(ConversationMessage.timestamp).all()

# ========================================
# CRUD PARA EJECUCIÓN DE HERRAMIENTAS
# ========================================

def create_tool_execution(
    db: Session,
    conversation_id: int,
    tool_name: str,
    arguments: Dict[str, Any],
    result: Dict[str, Any],
    timestamp: datetime = None,
    execution_time_ms: int = None
) -> ToolExecution:
    """Crear registro de ejecución de herramienta"""
    tool_execution = ToolExecution(
        conversation_id=conversation_id,
        tool_name=tool_name,
        arguments=arguments,
        result=result,
        timestamp=timestamp or datetime.utcnow(),
        status="completed" if result.get("status") == "success" else "failed",
        execution_time_ms=execution_time_ms
    )
    db.add(tool_execution)
    db.commit()
    db.refresh(tool_execution)
    return tool_execution

def get_conversation_tools(db: Session, conversation_id: int) -> List[ToolExecution]:
    """Obtener todas las herramientas ejecutadas en una conversación"""
    return db.query(ToolExecution).filter(
        ToolExecution.conversation_id == conversation_id
    ).order_by(ToolExecution.timestamp).all()

def get_tool_usage_stats(db: Session, date_from: date = None, date_to: date = None) -> Dict[str, int]:
    """Obtener estadísticas de uso de herramientas"""
    query = db.query(ToolExecution.tool_name, func.count(ToolExecution.tool_name))
    
    if date_from:
        query = query.filter(func.date(ToolExecution.timestamp) >= date_from)
    if date_to:
        query = query.filter(func.date(ToolExecution.timestamp) <= date_to)
    
    results = query.group_by(ToolExecution.tool_name).all()
    return {tool_name: count for tool_name, count in results}

# ========================================
# CRUD PARA CITAS
# ========================================

def create_appointment(db: Session, appointment: AppointmentCreate, conversation_id: int = None) -> Appointment:
    """Crear una nueva cita"""
    db_appointment = Appointment(
        appointment_id=appointment.appointment_id,
        conversation_id=conversation_id,
        appointment_type=appointment.appointment_type,
        client_email=appointment.client_email,
        client_name=appointment.client_name,
        client_phone=appointment.client_phone,
        appointment_date=appointment.appointment_date,
        appointment_time=appointment.appointment_time,
        source=appointment.source,
        status=appointment.status,
        notes=appointment.notes,
        confirmation_code=f"CONF-{appointment.appointment_id[:8].upper()}"
    )
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

def get_appointment_by_id(db: Session, appointment_id: str) -> Optional[Appointment]:
    """Obtener cita por ID"""
    return db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()

def get_appointments(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    appointment_type: str = None,
    status: str = None,
    client_email: str = None,
    date_from: str = None,
    date_to: str = None
) -> List[Appointment]:
    """Obtener lista de citas con filtros"""
    query = db.query(Appointment)
    
    if appointment_type:
        query = query.filter(Appointment.appointment_type == appointment_type)
    if status:
        query = query.filter(Appointment.status == status)
    if client_email:
        query = query.filter(Appointment.client_email.ilike(f"%{client_email}%"))
    if date_from:
        query = query.filter(Appointment.appointment_date >= date_from)
    if date_to:
        query = query.filter(Appointment.appointment_date <= date_to)
    
    return query.order_by(desc(Appointment.created_at)).offset(skip).limit(limit).all()

def update_appointment(db: Session, appointment_id: str, **kwargs) -> Optional[Appointment]:
    """Actualizar una cita"""
    appointment = get_appointment_by_id(db, appointment_id)
    if appointment:
        for key, value in kwargs.items():
            if hasattr(appointment, key):
                setattr(appointment, key, value)
        appointment.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(appointment)
    return appointment

def cancel_appointment(db: Session, appointment_id: str, reason: str = None) -> Optional[Appointment]:
    """Cancelar una cita"""
    return update_appointment(
        db, 
        appointment_id, 
        status="cancelled", 
        cancelled_at=datetime.utcnow(),
        notes=f"Cancelada: {reason}" if reason else "Cancelada"
    )

def confirm_appointment(db: Session, appointment_id: str) -> Optional[Appointment]:
    """Confirmar una cita"""
    return update_appointment(
        db, 
        appointment_id, 
        status="confirmed", 
        confirmed_at=datetime.utcnow()
    )

def get_appointments_by_date(db: Session, target_date: str) -> List[Appointment]:
    """Obtener citas de una fecha específica"""
    return db.query(Appointment).filter(Appointment.appointment_date == target_date).all()

def get_appointments_by_email(db: Session, client_email: str) -> List[Appointment]:
    """Obtener todas las citas de un cliente por email"""
    return db.query(Appointment).filter(
        Appointment.client_email == client_email
    ).order_by(desc(Appointment.created_at)).all()

# ========================================
# CRUD PARA LEADS
# ========================================

def create_lead(db: Session, lead: LeadCreate, conversation_id: int = None) -> LeadGeneration:
    """Crear un nuevo lead"""
    db_lead = LeadGeneration(
        conversation_id=conversation_id,
        email=lead.email,
        name=lead.name,
        phone=lead.phone,
        company=lead.company,
        interest_level=lead.interest_level,
        interested_plans=lead.interested_plans,
        budget_mentioned=lead.budget_mentioned,
        timeline=lead.timeline,
        tags=lead.tags,
        notes=lead.notes,
        status="new"
    )
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead

def get_lead_by_email(db: Session, email: str) -> Optional[LeadGeneration]:
    """Obtener lead por email"""
    return db.query(LeadGeneration).filter(LeadGeneration.email == email).first()

def get_leads(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: str = None,
    interest_level: str = None,
    assigned_to: int = None
) -> List[LeadGeneration]:
    """Obtener lista de leads con filtros"""
    query = db.query(LeadGeneration)
    
    if status:
        query = query.filter(LeadGeneration.status == status)
    if interest_level:
        query = query.filter(LeadGeneration.interest_level == interest_level)
    if assigned_to:
        query = query.filter(LeadGeneration.assigned_to == assigned_to)
    
    return query.order_by(desc(LeadGeneration.created_at)).offset(skip).limit(limit).all()

def update_lead(db: Session, lead_id: int, lead_update: LeadUpdate) -> Optional[LeadGeneration]:
    """Actualizar un lead"""
    lead = db.query(LeadGeneration).filter(LeadGeneration.id == lead_id).first()
    if lead:
        update_data = lead_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(lead, key, value)
        lead.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(lead)
    return lead

def assign_lead(db: Session, lead_id: int, user_id: int) -> Optional[LeadGeneration]:
    """Asignar un lead a un usuario"""
    lead = db.query(LeadGeneration).filter(LeadGeneration.id == lead_id).first()
    if lead:
        lead.assigned_to = user_id
        lead.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(lead)
    return lead

# ========================================
# CRUD PARA ANALYTICS
# ========================================

def create_call_analytics(
    db: Session,
    conversation_id: int,
    total_messages: int = 0,
    user_messages: int = 0,
    assistant_messages: int = 0,
    tools_used: List[str] = None,
    conversion_achieved: bool = False,
    conversion_type: str = None
) -> CallAnalytics:
    """Crear analytics para una conversación"""
    analytics = CallAnalytics(
        conversation_id=conversation_id,
        total_messages=total_messages,
        user_messages=user_messages,
        assistant_messages=assistant_messages,
        tools_used=tools_used or [],
        conversion_achieved=conversion_achieved,
        conversion_type=conversion_type
    )
    db.add(analytics)
    db.commit()
    db.refresh(analytics)
    return analytics

def get_analytics_by_conversation(db: Session, conversation_id: int) -> Optional[CallAnalytics]:
    """Obtener analytics de una conversación"""
    return db.query(CallAnalytics).filter(
        CallAnalytics.conversation_id == conversation_id
    ).first()

def calculate_conversation_metrics(db: Session, conversation_id: int) -> Dict[str, Any]:
    """Calcular métricas automáticamente para una conversación"""
    # Contar mensajes
    total_messages = db.query(ConversationMessage).filter(
        ConversationMessage.conversation_id == conversation_id
    ).count()
    
    user_messages = db.query(ConversationMessage).filter(
        and_(
            ConversationMessage.conversation_id == conversation_id,
            ConversationMessage.role == "user"
        )
    ).count()
    
    assistant_messages = db.query(ConversationMessage).filter(
        and_(
            ConversationMessage.conversation_id == conversation_id,
            ConversationMessage.role == "assistant"
        )
    ).count()
    
    # Obtener herramientas usadas
    tools = db.query(ToolExecution).filter(
        ToolExecution.conversation_id == conversation_id
    ).all()
    
    tools_used = [tool.tool_name for tool in tools]
    successful_tools = [tool for tool in tools if tool.status == "completed"]
    
    # Determinar conversión
    conversion_achieved = len(successful_tools) > 0
    conversion_type = None
    
    if any(tool.tool_name == "schedule_appointment" and tool.status == "completed" for tool in tools):
        conversion_type = "appointment_scheduled"
    elif any(tool.tool_name == "get_pricing_plans" and tool.status == "completed" for tool in tools):
        conversion_type = "information_provided"
    
    return {
        "total_messages": total_messages,
        "user_messages": user_messages,
        "assistant_messages": assistant_messages,
        "tools_used": tools_used,
        "conversion_achieved": conversion_achieved,
        "conversion_type": conversion_type,
        "successful_tools_count": len(successful_tools),
        "failed_tools_count": len(tools) - len(successful_tools)
    }

# ========================================
# FUNCIONES DE ESTADÍSTICAS GENERALES
# ========================================

def get_daily_stats(db: Session, target_date: date = None) -> Dict[str, Any]:
    """Obtener estadísticas del día"""
    if not target_date:
        target_date = datetime.now().date()
    
    conversations_today = db.query(Conversation).filter(
        func.date(Conversation.started_at) == target_date
    ).count()
    
    appointments_today = db.query(Appointment).filter(
        func.date(Appointment.created_at) == target_date
    ).count()
    
    leads_today = db.query(LeadGeneration).filter(
        func.date(LeadGeneration.created_at) == target_date
    ).count()
    
    completed_conversations = db.query(Conversation).filter(
        and_(
            func.date(Conversation.started_at) == target_date,
            Conversation.status == "completed"
        )
    ).count()
    
    return {
        "date": target_date.isoformat(),
        "conversations": conversations_today,
        "appointments": appointments_today,
        "leads": leads_today,
        "completed_conversations": completed_conversations,
        "completion_rate": (completed_conversations / conversations_today * 100) if conversations_today > 0 else 0
    }

def get_conversion_rates(db: Session, date_from: date = None, date_to: date = None) -> Dict[str, float]:
    """Calcular tasas de conversión"""
    query = db.query(Conversation)
    
    if date_from:
        query = query.filter(func.date(Conversation.started_at) >= date_from)
    if date_to:
        query = query.filter(func.date(Conversation.started_at) <= date_to)
    
    total_conversations = query.count()
    
    if total_conversations == 0:
        return {
            "appointment_rate": 0.0,
            "information_rate": 0.0,
            "overall_conversion_rate": 0.0
        }
    
    # Conversaciones con citas agendadas
    appointment_conversations = query.filter(
        Conversation.intent_detected == "appointment_request"
    ).count()
    
    # Conversaciones con información proporcionada
    info_conversations = query.filter(
        Conversation.intent_detected == "pricing_inquiry"
    ).count()
    
    # Conversaciones exitosas (cualquier intent detectado)
    successful_conversations = query.filter(
        Conversation.intent_detected.isnot(None)
    ).count()
    
    return {
        "appointment_rate": round(appointment_conversations / total_conversations * 100, 2),
        "information_rate": round(info_conversations / total_conversations * 100, 2),
        "overall_conversion_rate": round(successful_conversations / total_conversations * 100, 2)
    }

def get_popular_time_slots(db: Session) -> Dict[str, int]:
    """Obtener horarios más populares para citas"""
    appointments = db.query(Appointment.appointment_time, func.count(Appointment.appointment_time)).group_by(
        Appointment.appointment_time
    ).order_by(desc(func.count(Appointment.appointment_time))).limit(10).all()
    
    return {time_slot: count for time_slot, count in appointments}

def get_email_domains_stats(db: Session) -> Dict[str, int]:
    """Obtener estadísticas de dominios de email más comunes"""
    # Extraer dominio del email usando función SQL
    domains = db.query(
        func.substring(Appointment.client_email, func.position('@', Appointment.client_email) + 1).label('domain'),
        func.count('*').label('count')
    ).group_by('domain').order_by(desc('count')).limit(10).all()
    
    return {domain: count for domain, count in domains}

def get_conversation_duration_stats(db: Session, date_from: date = None, date_to: date = None) -> Dict[str, float]:
    """Obtener estadísticas de duración de conversaciones"""
    query = db.query(Conversation.duration_seconds).filter(
        Conversation.duration_seconds.isnot(None)
    )
    
    if date_from:
        query = query.filter(func.date(Conversation.started_at) >= date_from)
    if date_to:
        query = query.filter(func.date(Conversation.started_at) <= date_to)
    
    durations = [duration[0] for duration in query.all()]
    
    if not durations:
        return {
            "avg_duration": 0.0,
            "min_duration": 0.0,
            "max_duration": 0.0,
            "total_conversations": 0
        }
    
    return {
        "avg_duration": round(sum(durations) / len(durations), 2),
        "min_duration": min(durations),
        "max_duration": max(durations),
        "total_conversations": len(durations)
    }

# ========================================
# FUNCIONES DE LIMPIEZA Y MANTENIMIENTO
# ========================================

def cleanup_old_conversations(db: Session, days_old: int = 90) -> int:
    """Limpiar conversaciones antiguas (solo marca como archivadas, no elimina)"""
    cutoff_date = datetime.now() - timedelta(days=days_old)
    
    updated_count = db.query(Conversation).filter(
        and_(
            Conversation.started_at < cutoff_date,
            Conversation.status != "archived"
        )
    ).update({"status": "archived"})
    
    db.commit()
    return updated_count

def get_incomplete_conversations(db: Session) -> List[Conversation]:
    """Obtener conversaciones que no terminaron correctamente"""
    return db.query(Conversation).filter(
        and_(
            Conversation.status == "active",
            Conversation.started_at < datetime.now() - timedelta(hours=1)
        )
    ).all()

def mark_abandoned_conversations(db: Session) -> int:
    """Marcar conversaciones abandonadas (activas por más de 1 hora)"""
    cutoff_time = datetime.now() - timedelta(hours=1)
    
    updated_count = db.query(Conversation).filter(
        and_(
            Conversation.status == "active",
            Conversation.started_at < cutoff_time
        )
    ).update({
        "status": "abandoned",
        "ended_at": datetime.utcnow()
    })
    
    db.commit()
    return updated_count