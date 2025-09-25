from pydantic import BaseModel, EmailStr, validator
from datetime import datetime
from typing import Optional, Dict, Any, List

# Esquemas de Usuario
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    phone: Optional[str] = None     
    address: Optional[str] = None

class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        return v
    
    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('El nombre de usuario debe tener al menos 3 caracteres')
        return v

class UserLogin(BaseModel):
    email: str
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    phone: Optional[str] = None   
    address: Optional[str] = None 
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None 

    class Config:
        from_attributes = True

class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    
    


# Esquemas de Token
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None

# Esquemas de RetelliA
class RetelliAResponseCreate(BaseModel):
    session_id: Optional[str] = None
    query: str
    response: str
    response_time: Optional[int] = None
    confidence_score: Optional[str] = None

class RetelliAResponseSchema(BaseModel):
    id: int
    user_id: int
    session_id: Optional[str] = None
    query: str
    response: str
    response_time: Optional[int] = None
    confidence_score: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserWithResponses(UserResponse):
    retelli_responses: List[RetelliAResponseSchema] = []

    class Config:
        from_attributes = True


class ConversationStart(BaseModel):
    call_id: str
    timestamp: str
    event_type: str = "conversation_started"
    data: Dict[str, Any]

class ConversationMessage(BaseModel):
    call_id: str
    timestamp: str
    role: str  # user, assistant, system, tool
    content: str
    metadata: Optional[Dict[str, Any]] = {}

class ToolExecution(BaseModel):
    call_id: str
    timestamp: str
    event_type: str = "tool_executed"
    tool_name: str
    arguments: Dict[str, Any]
    result: Dict[str, Any]

class ConversationEnd(BaseModel):
    call_id: str
    timestamp: str
    event_type: str = "conversation_ended"
    duration_seconds: Optional[int] = None

# === SCHEMAS PARA CITAS ===

class AppointmentCreate(BaseModel):
    appointment_id: str
    appointment_type: str
    client_email: EmailStr
    appointment_date: str  # YYYY-MM-DD
    appointment_time: str  # HH:MM
    source: str = "voice_assistant"
    status: str = "scheduled"
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None
    
    @validator('appointment_type')
    def validate_appointment_type(cls, v):
        allowed_types = ['ventas', 'soporte_tecnico', 'soporte técnico']
        if v not in allowed_types:
            raise ValueError('appointment_type must be "ventas" or "soporte_tecnico"')
        return v.replace(' ', '_').lower()
    
    @validator('appointment_date')
    def validate_date_format(cls, v):
        try:
            datetime.strptime(v, '%Y-%m-%d')
            return v
        except ValueError:
            raise ValueError('appointment_date must be in YYYY-MM-DD format')
    
    @validator('appointment_time')
    def validate_time_format(cls, v):
        try:
            datetime.strptime(v, '%H:%M')
            return v
        except ValueError:
            raise ValueError('appointment_time must be in HH:MM format')

class AppointmentResponse(BaseModel):
    id: int
    appointment_id: str
    appointment_type: str
    client_email: str
    client_name: Optional[str]
    client_phone: Optional[str]
    appointment_date: str
    appointment_time: str
    status: str
    source: str
    confirmation_code: Optional[str]
    notes: Optional[str]
    email_sent: bool
    sms_sent: bool
    reminder_sent: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class AppointmentUpdate(BaseModel):
    appointment_type: Optional[str] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    appointment_date: Optional[str] = None
    appointment_time: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    confirmation_code: Optional[str] = None

# === SCHEMAS PARA CONVERSACIONES DETALLADAS ===

class ConversationMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    timestamp: datetime
    meta_data: Optional[Dict[str, Any]]
    transcript_confidence: Optional[str]
    audio_duration: Optional[int]
    
    class Config:
        from_attributes = True

class ToolExecutionResponse(BaseModel):
    id: int
    tool_name: str
    arguments: Dict[str, Any]
    result: Dict[str, Any]
    status: str
    error_message: Optional[str]
    execution_time_ms: Optional[int]
    timestamp: datetime
    
    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: int
    call_id: str
    user_id: Optional[int]
    started_at: datetime
    ended_at: Optional[datetime]
    duration_seconds: Optional[int]
    status: str
    retell_data: Optional[Dict[str, Any]]
    phone_number: Optional[str]
    caller_info: Optional[Dict[str, Any]]
    client_email: Optional[str]
    client_name: Optional[str]
    intent_detected: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    # Relaciones opcionales
    messages: Optional[List[ConversationMessageResponse]] = []
    tool_executions: Optional[List[ToolExecutionResponse]] = []
    appointments: Optional[List[AppointmentResponse]] = []
    
    class Config:
        from_attributes = True

# === SCHEMAS PARA LEADS ===

class LeadCreate(BaseModel):
    conversation_id: Optional[int] = None
    email: EmailStr
    name: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    interest_level: Optional[str] = None
    interested_plans: Optional[List[str]] = None
    budget_mentioned: Optional[str] = None
    timeline: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None

class LeadResponse(BaseModel):
    id: int
    conversation_id: Optional[int]
    email: str
    name: Optional[str]
    phone: Optional[str]
    company: Optional[str]
    interest_level: Optional[str]
    interested_plans: Optional[List[str]]
    budget_mentioned: Optional[str]
    timeline: Optional[str]
    status: str
    source: str
    tags: Optional[List[str]]
    assigned_to: Optional[int]
    follow_up_date: Optional[datetime]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    interest_level: Optional[str] = None
    interested_plans: Optional[List[str]] = None
    budget_mentioned: Optional[str] = None
    timeline: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    assigned_to: Optional[int] = None
    follow_up_date: Optional[datetime] = None
    notes: Optional[str] = None

# === SCHEMAS PARA ANALYTICS ===

class CallAnalyticsResponse(BaseModel):
    id: int
    conversation_id: int
    total_messages: int
    user_messages: int
    assistant_messages: int
    tools_used: Optional[List[str]]
    avg_response_time_ms: Optional[int]
    errors_count: int
    user_satisfaction: Optional[str]
    conversion_achieved: bool
    conversion_type: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# === SCHEMAS PARA RESPUESTAS DE LA API ===

class ApiResponse(BaseModel):
    status: str
    message: str
    data: Optional[Dict[str, Any]] = None

class AppointmentApiResponse(ApiResponse):
    appointment_id: Optional[str] = None
    confirmation_code: Optional[str] = None

# === SCHEMAS PARA BÚSQUEDAS Y FILTROS ===

class ConversationFilters(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None
    intent_detected: Optional[str] = None
    client_email: Optional[str] = None
    phone_number: Optional[str] = None

class AppointmentFilters(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    appointment_type: Optional[str] = None
    status: Optional[str] = None
    client_email: Optional[str] = None

# === SCHEMAS PARA ESTADÍSTICAS ===

class DashboardStats(BaseModel):
    total_conversations: int
    total_appointments: int
    total_leads: int
    conversations_today: int
    appointments_today: int
    leads_today: int
    conversion_rate: float
    avg_conversation_duration: float
    top_intents: Dict[str, int]
    appointment_types_breakdown: Dict[str, int]
    
    class Config:
        from_attributes = True