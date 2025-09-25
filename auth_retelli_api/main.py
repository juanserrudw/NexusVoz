from sqlite3 import OperationalError
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from datetime import datetime, time, timedelta
from typing import List, Optional

from database import get_db, engine
from models import Base
from schemas import (
    UserCreate, User, UserLogin, Token, UserResponse, 
    RetelliAResponseCreate, RetelliAResponseSchema, UserWithResponses,
    ConversationStart, ConversationMessage, ToolExecution, ConversationEnd,
    AppointmentCreate, AppointmentResponse, AppointmentUpdate, AppointmentApiResponse,
    ConversationResponse, ConversationMessageResponse, ToolExecutionResponse,
    LeadCreate, LeadResponse, LeadUpdate,
    CallAnalyticsResponse, ApiResponse, ConversationFilters, AppointmentFilters,
    DashboardStats
)
from auth import (
    authenticate_user, create_access_token, get_current_active_user,
    get_user_by_email, get_user_by_username, ACCESS_TOKEN_EXPIRE_MINUTES
)
from crud import (
    create_user, get_users, get_user, update_user, delete_user,
    create_retelli_response, get_user_responses, get_response, delete_response
)

# Crear las tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API de Autenticación y RetelliA",
    description="API para manejo de usuarios y respuestas de RetelliA",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especifica los orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from models import (
    Conversation, ConversationMessage as DBConversationMessage, 
    ToolExecution as DBToolExecution, Appointment, 
    LeadGeneration, CallAnalytics, User as DBUser
)

# RUTAS DE AUTENTICACIÓN

@app.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Registrar un nuevo usuario"""
    # Verificar si el email ya existe
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="El email ya está registrado"
        )
    
    # Verificar si el username ya existe
    db_user = get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="El nombre de usuario ya está en uso"
        )
    
    return create_user(db=db, user=user)

@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Iniciar sesión y obtener token de acceso"""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            is_active=user.is_active,
            created_at=user.created_at
        )
    }

@app.post("/login", response_model=Token)
async def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Iniciar sesión alternativo con JSON"""
    user = authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            is_active=user.is_active,
            created_at=user.created_at
        )
    }

# RUTAS DE USUARIOS

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: DBUser = Depends(get_current_active_user)):
    """Obtener información del usuario actual"""
    return current_user

@app.get("/users/me/full", response_model=UserWithResponses)
async def read_users_me_with_responses(
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Obtener información completa del usuario con sus respuestas de RetelliA"""
    user = get_user(db, current_user.id)
    return user

@app.get("/users", response_model=List[UserResponse])
async def read_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_active_user)
):
    """Obtener lista de usuarios (requiere autenticación)"""
    users = get_users(db, skip=skip, limit=limit)
    return users

@app.put("/users/me", response_model=UserResponse)
async def update_user_me(
    user_data: dict,
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Actualizar información del usuario actual"""
    allowed_fields = {"full_name", "username", "phone", "address"}
    filtered_data = {k: v for k, v in user_data.items() if k in allowed_fields}
    
    if not filtered_data:
        raise HTTPException(
            status_code=400,
            detail="No se proporcionaron campos válidos para actualizar"
        )
    
    return update_user(db, current_user.id, filtered_data)

# ========================================
# NUEVAS RUTAS PARA RETELL AI
# ========================================


@app.post("/api/v1/conversations/start")
async def log_conversation_start(data: ConversationStart, db: Session = Depends(get_db)):
    """Registra el inicio de una conversación desde Retell AI"""
    try:
        # Crear nueva conversación
        conversation = Conversation(
            call_id=data.call_id,
            started_at=datetime.fromisoformat(data.timestamp.replace('Z', '+00:00')),
            retell_data=data.data,
            phone_number=data.data.get('phone_number'),
            caller_info=data.data.get('caller_info'),
            status="active"
        )
        
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        
        print(f"📝 Conversación iniciada: {data.call_id}")
        return {"status": "success", "message": "Conversación registrada", "conversation_id": conversation.id}
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error registrando conversación: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@app.post("/api/v1/conversations/messages", response_model=ConversationMessageResponse)
async def log_message(data: ConversationMessage, db: Session = Depends(get_db)):
    """Registra un mensaje de la conversación"""
    try:
        conversation = db.query(Conversation).filter(Conversation.call_id == data.call_id).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversación no encontrada")
        
        
        message = DBConversationMessage(
            conversation_id=conversation.id,
            role=data.role,
            content=data.content,
            timestamp=datetime.fromisoformat(data.timestamp.replace('Z', '+00:00')),
            meta_data=data.metadata
        )
        
        db.add(message)
        
        
        if data.role == "user" and "@" in data.content and not conversation.client_email:
            import re
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            emails = re.findall(email_pattern, data.content)
            if emails:
                conversation.client_email = emails[0]
        
        db.commit()
        db.refresh(message)
        
        print(f"💬 Mensaje guardado: {data.call_id} - {data.role}")
        return message
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error guardando mensaje: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@app.post("/api/v1/conversations/tools", response_model=ToolExecutionResponse)
async def log_tool_execution(data: ToolExecution, db: Session = Depends(get_db)):
    """Registra la ejecución de una herramienta"""
    try:
        conversation = db.query(Conversation).filter(Conversation.call_id == data.call_id).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversación no encontrada")
        
        tool_execution = DBToolExecution(
            conversation_id=conversation.id,
            tool_name=data.tool_name,
            arguments=data.arguments,
            result=data.result,
            timestamp=datetime.fromisoformat(data.timestamp.replace('Z', '+00:00')),
            status="completed" if data.result.get("status") == "success" else "failed"
        )
        
        db.add(tool_execution)
        
        
        if data.tool_name == "get_pricing_plans":
            conversation.intent_detected = "pricing_inquiry"
        elif data.tool_name == "schedule_appointment":
            conversation.intent_detected = "appointment_request"
            
            if data.result.get("status") == "success" and data.arguments.get("client_email"):
                conversation.client_email = data.arguments.get("client_email")
        
        db.commit()
        db.refresh(tool_execution)
        
        print(f"🔧 Herramienta {data.tool_name} registrada: {data.call_id}")
        return tool_execution
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error registrando herramienta: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
    
    

@app.post("/api/v1/conversations/end")
async def log_conversation_end(data: ConversationEnd, db: Session = Depends(get_db)):
    """Registra el fin de una conversación"""
    try:
        conversation = db.query(Conversation).filter(Conversation.call_id == data.call_id).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversación no encontrada")
        
        
        conversation.ended_at = datetime.fromisoformat(data.timestamp.replace('Z', '+00:00'))
        conversation.duration_seconds = data.duration_seconds
        conversation.status = "completed"
        
       
        messages_count = db.query(DBConversationMessage).filter(
            DBConversationMessage.conversation_id == conversation.id
        ).count()
        
        user_messages = db.query(DBConversationMessage).filter(
            and_(DBConversationMessage.conversation_id == conversation.id,
                 DBConversationMessage.role == "user")
        ).count()
        
        assistant_messages = db.query(DBConversationMessage).filter(
            and_(DBConversationMessage.conversation_id == conversation.id,
                 DBConversationMessage.role == "assistant")
        ).count()
        
        tools_used = db.query(DBToolExecution).filter(
            DBToolExecution.conversation_id == conversation.id
        ).all()
        
        analytics = CallAnalytics(
            conversation_id=conversation.id,
            total_messages=messages_count,
            user_messages=user_messages,
            assistant_messages=assistant_messages,
            tools_used=[tool.tool_name for tool in tools_used],
            conversion_achieved=bool(conversation.intent_detected and 
                                   any(tool.status == "completed" for tool in tools_used))
        )
        
        db.add(analytics)
        db.commit()
        
        print(f"📝 Conversación finalizada: {data.call_id}")
        return {"status": "success", "message": "Conversación finalizada"}
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error finalizando conversación: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

# --- ENDPOINTS DE CITAS ---

@app.post("/api/v1/appointments", response_model=AppointmentApiResponse)
async def create_appointment(appointment: AppointmentCreate, db: Session = Depends(get_db)):
    """Crear una nueva cita desde el asistente de voz"""
    try:
        confirmation_code = f"CONF-{appointment.appointment_id[:8].upper()}"
        
        db_appointment = Appointment(
            appointment_id=appointment.appointment_id,
            appointment_type=appointment.appointment_type,
            client_email=appointment.client_email,
            client_name=appointment.client_name,
            client_phone=appointment.client_phone,
            appointment_date=appointment.appointment_date,
            appointment_time=appointment.appointment_time,
            source=appointment.source,
            status=appointment.status,
            confirmation_code=confirmation_code,
            notes=appointment.notes
        )
        
        if hasattr(appointment, 'call_id'):
            conversation = db.query(Conversation).filter(
                Conversation.call_id == appointment.call_id
            ).first()
            if conversation:
                db_appointment.conversation_id = conversation.id
        
        db.add(db_appointment)
        db.commit()
        db.refresh(db_appointment)
        
        print(f"📅 Cita creada: {appointment.appointment_id} - {appointment.client_email}")
        return AppointmentApiResponse(
            status="success",
            message="Cita agendada exitosamente",
            appointment_id=db_appointment.appointment_id,
            confirmation_code=confirmation_code
        )
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creando cita: {e}")
        return AppointmentApiResponse(
            status="error",
            message=f"Error al agendar la cita: {str(e)}"
        )

@app.get("/api/v1/appointments", response_model=List[AppointmentResponse])
async def get_appointments(
    skip: int = 0,
    limit: int = 100,
    appointment_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    client_email: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_active_user)
):
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
    
    appointments = query.order_by(desc(Appointment.created_at)).offset(skip).limit(limit).all()
    return appointments

@app.get("/api/v1/appointments/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_active_user)
):
    """Obtener una cita específica"""
    appointment = db.query(Appointment).filter(
        Appointment.appointment_id == appointment_id
    ).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    
    return appointment

@app.put("/api/v1/appointments/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: str,
    appointment_update: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_active_user)
):
    """Actualizar una cita"""
    appointment = db.query(Appointment).filter(
        Appointment.appointment_id == appointment_id
    ).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    
    # Actualizar campos
    update_data = appointment_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appointment, field, value)
    
    appointment.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(appointment)
    
    return appointment

# --- ENDPOINTS DE CONVERSACIONES ---

@app.get("/api/v1/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = Query(None),
    intent: Optional[str] = Query(None),
    client_email: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_active_user)
):
    """Obtener lista de conversaciones con filtros"""
    query = db.query(Conversation)
    
    if status:
        query = query.filter(Conversation.status == status)
    if intent:
        query = query.filter(Conversation.intent_detected == intent)
    if client_email:
        query = query.filter(Conversation.client_email.ilike(f"%{client_email}%"))
    if date_from:
        query = query.filter(Conversation.started_at >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(Conversation.started_at <= datetime.fromisoformat(date_to))
    
    conversations = query.order_by(desc(Conversation.started_at)).offset(skip).limit(limit).all()
    return conversations

@app.get("/api/v1/conversations/{call_id}", response_model=ConversationResponse)
async def get_conversation(
    call_id: str,
    include_messages: bool = Query(False),
    include_tools: bool = Query(False),
    include_appointments: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_active_user)
):
    """Obtener una conversación específica con detalles"""
    conversation = db.query(Conversation).filter(Conversation.call_id == call_id).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    
    # Cargar relaciones si se solicita
    conversation_dict = {
        "id": conversation.id,
        "call_id": conversation.call_id,
        "user_id": conversation.user_id,
        "started_at": conversation.started_at,
        "ended_at": conversation.ended_at,
        "duration_seconds": conversation.duration_seconds,
        "status": conversation.status,
        "retell_data": conversation.retell_data,
        "phone_number": conversation.phone_number,
        "caller_info": conversation.caller_info,
        "client_email": conversation.client_email,
        "client_name": conversation.client_name,
        "intent_detected": conversation.intent_detected,
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at,
        "messages": [],
        "tool_executions": [],
        "appointments": []
    }
    
    if include_messages:
        messages = db.query(DBConversationMessage).filter(
            DBConversationMessage.conversation_id == conversation.id
        ).order_by(DBConversationMessage.timestamp).all()
        conversation_dict["messages"] = messages
    
    if include_tools:
        tools = db.query(DBToolExecution).filter(
            DBToolExecution.conversation_id == conversation.id
        ).order_by(DBToolExecution.timestamp).all()
        conversation_dict["tool_executions"] = tools
    
    if include_appointments:
        appointments = db.query(Appointment).filter(
            Appointment.conversation_id == conversation.id
        ).all()
        conversation_dict["appointments"] = appointments
    
    return conversation_dict

# --- ENDPOINTS DE LEADS ---

@app.post("/api/v1/leads", response_model=LeadResponse)
async def create_lead(
    lead: LeadCreate,
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_active_user)
):
    """Crear un nuevo lead"""
    try:
        db_lead = LeadGeneration(
            conversation_id=lead.conversation_id,
            email=lead.email,
            name=lead.name,
            phone=lead.phone,
            company=lead.company,
            interest_level=lead.interest_level,
            interested_plans=lead.interested_plans,
            budget_mentioned=lead.budget_mentioned,
            timeline=lead.timeline,
            tags=lead.tags,
            notes=lead.notes
        )
        
        db.add(db_lead)
        db.commit()
        db.refresh(db_lead)
        
        return db_lead
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creando lead: {str(e)}")

@app.get("/api/v1/leads", response_model=List[LeadResponse])
async def get_leads(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = Query(None),
    interest_level: Optional[str] = Query(None),
    assigned_to: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_active_user)
):
    """Obtener lista de leads"""
    query = db.query(LeadGeneration)
    
    if status:
        query = query.filter(LeadGeneration.status == status)
    if interest_level:
        query = query.filter(LeadGeneration.interest_level == interest_level)
    if assigned_to:
        query = query.filter(LeadGeneration.assigned_to == assigned_to)
    
    leads = query.order_by(desc(LeadGeneration.created_at)).offset(skip).limit(limit).all()
    return leads

# --- ENDPOINTS DE ESTADÍSTICAS ---

@app.get("/api/v1/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_active_user)
):
    """Obtener estadísticas para el dashboard"""
    try:
        base_date_filter = []
        if date_from:
            base_date_filter.append(Conversation.started_at >= datetime.fromisoformat(date_from))
        if date_to:
            base_date_filter.append(Conversation.started_at <= datetime.fromisoformat(date_to))
        
       
        total_conversations = db.query(Conversation).filter(*base_date_filter).count()
        total_appointments = db.query(Appointment).count()
        total_leads = db.query(LeadGeneration).count()
        
        
        today = datetime.now().date()
        conversations_today = db.query(Conversation).filter(
            func.date(Conversation.started_at) == today
        ).count()
        
        appointments_today = db.query(Appointment).filter(
            func.date(Appointment.created_at) == today
        ).count()
        
        leads_today = db.query(LeadGeneration).filter(
            func.date(LeadGeneration.created_at) == today
        ).count()
        
        
        successful_conversations = db.query(Conversation).filter(
            and_(Conversation.intent_detected.isnot(None), *base_date_filter)
        ).count()
        
        conversion_rate = (successful_conversations / total_conversations * 100) if total_conversations > 0 else 0
        
        
        avg_duration = db.query(func.avg(Conversation.duration_seconds)).filter(
            and_(Conversation.duration_seconds.isnot(None), *base_date_filter)
        ).scalar() or 0
        
        
        intent_stats = db.query(
            Conversation.intent_detected,
            func.count(Conversation.intent_detected)
        ).filter(
            and_(Conversation.intent_detected.isnot(None), *base_date_filter)
        ).group_by(Conversation.intent_detected).all()
        
        top_intents = {intent: count for intent, count in intent_stats}
        
        
        appointment_stats = db.query(
            Appointment.appointment_type,
            func.count(Appointment.appointment_type)
        ).group_by(Appointment.appointment_type).all()
        
        appointment_types_breakdown = {apt_type: count for apt_type, count in appointment_stats}
        
        return DashboardStats(
            total_conversations=total_conversations,
            total_appointments=total_appointments,
            total_leads=total_leads,
            conversations_today=conversations_today,
            appointments_today=appointments_today,
            leads_today=leads_today,
            conversion_rate=round(conversion_rate, 2),
            avg_conversation_duration=round(avg_duration, 2),
            top_intents=top_intents,
            appointment_types_breakdown=appointment_types_breakdown
        )
        
    except Exception as e:
        print(f"❌ Error obteniendo estadísticas: {e}")
        raise HTTPException(status_code=500, detail=f"Error obteniendo estadísticas: {str(e)}")


@app.post("/api/v1/conversations/analysis")
async def create_conversation_analysis(
    analysis_data: dict,
    db: Session = Depends(get_db)
):
    """Crear análisis de conversación desde Retell AI"""
    try:
        call_id = analysis_data.get("call_id")
        
        if not call_id:
            raise HTTPException(status_code=400, detail="call_id es requerido")
        
        
        conversation = db.query(Conversation).filter(
            Conversation.call_id == call_id
        ).first()
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversación no encontrada")
        
        
        conversation.analysis_data = analysis_data.get("analysis", {})
        conversation.sentiment_score = analysis_data.get("sentiment_score")
        conversation.summary = analysis_data.get("summary")
        conversation.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(conversation)
        
        print(f"📊 Análisis guardado: {call_id}")
        return {"status": "success", "message": "Análisis guardado exitosamente"}
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error guardando análisis: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
    

@app.get("/api/v1/conversations/{call_id}/analysis")
async def get_conversation_analysis(
    call_id: str,
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_active_user)
):
    """Obtener análisis de una conversación específica"""
    conversation = db.query(Conversation).filter(
        Conversation.call_id == call_id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    
    return {
        "call_id": conversation.call_id,
        "analysis_data": conversation.analysis_data,
        "sentiment_score": conversation.sentiment_score,
        "summary": conversation.summary,
        "intent_detected": conversation.intent_detected
    }

# ==========================
# RUTAS DE RETELLI RESPONSES 
# ==========================

@app.post("/retelli/responses", response_model=RetelliAResponseSchema)
async def create_response(
    response: RetelliAResponseCreate,
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Crear una nueva respuesta de RetelliA"""
    return create_retelli_response(db=db, response=response, user_id=current_user.id)

@app.get("/retelli/responses/me", response_model=List[RetelliAResponseSchema])
async def read_my_responses(
    skip: int = 0,
    limit: int = 100,
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Obtener las respuestas de RetelliA del usuario actual"""
    return get_user_responses(db, current_user.id, skip=skip, limit=limit)

@app.get("/retelli/responses/{response_id}", response_model=RetelliAResponseSchema)
async def read_response(
    response_id: int,
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Obtener una respuesta específica de RetelliA"""
    response = get_response(db, response_id)
    if response is None:
        raise HTTPException(status_code=404, detail="Respuesta no encontrada")
    
    
    if response.user_id != current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="No tienes permisos para ver esta respuesta"
        )
    
    return response

@app.delete("/retelli/responses/{response_id}")
async def delete_response_endpoint(
    response_id: int,
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Eliminar una respuesta de RetelliA"""
    response = get_response(db, response_id)
    if response is None:
        raise HTTPException(status_code=404, detail="Respuesta no encontrada")
    
    
    if response.user_id != current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="No tienes permisos para eliminar esta respuesta"
        )
    
    delete_response(db, response_id)
    return {"message": "Respuesta eliminada exitosamente"}

# --- ENDPOINT DE SALUD ---

@app.get("/health")
async def health_check():
    """Verificar el estado de la API"""
    return {
        "status": "healthy", 
        "message": "API NexusVoz funcionando correctamente",
        "version": "2.0.0",
        "features": ["auth", "conversations", "appointments", "leads", "analytics"]
    }

# --- ENDPOINT PARA WEBHOOKS DE RETELL AI ---

@app.post("/webhooks/retell")
async def retell_webhook(request_data: dict, db: Session = Depends(get_db)):
    """Webhook genérico para eventos de Retell AI"""
    try:
        event_type = request_data.get("event", "unknown")
        
        if event_type == "conversation_started":
            await log_conversation_start(ConversationStart(**request_data), db)
        elif event_type == "message_received":
            await log_message(ConversationMessage(**request_data), db)
        elif event_type == "tool_executed":
            await log_tool_execution(ToolExecution(**request_data), db)
        elif event_type == "conversation_ended":
            await log_conversation_end(ConversationEnd(**request_data), db)
        else:
            print(f"⚠️ Evento no reconocido: {event_type}")
        
        return {"status": "processed", "event": event_type}
        
    except Exception as e:
        print(f"❌ Error procesando webhook: {e}")
        raise HTTPException(status_code=500, detail=f"Error procesando webhook: {str(e)}")
    



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)










