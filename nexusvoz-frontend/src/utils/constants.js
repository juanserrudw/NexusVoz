

export const APPOINTMENT_TYPES = {
  CONSULTATION: 'consultation',
  DEMO: 'demo',
  SUPPORT: 'support',
  FOLLOWUP: 'followup',
};

export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
};

export const CONVERSATION_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

export const LEAD_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  CONVERTED: 'converted',
  LOST: 'lost',
};

export const INTEREST_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export const STATUS_COLORS = {
  // Appointment Status
  [APPOINTMENT_STATUS.SCHEDULED]: 'bg-blue-100 text-blue-800',
  [APPOINTMENT_STATUS.CONFIRMED]: 'bg-green-100 text-green-800',
  [APPOINTMENT_STATUS.COMPLETED]: 'bg-gray-100 text-gray-800',
  [APPOINTMENT_STATUS.CANCELLED]: 'bg-red-100 text-red-800',
  [APPOINTMENT_STATUS.NO_SHOW]: 'bg-yellow-100 text-yellow-800',
  
  // Conversation Status
  [CONVERSATION_STATUS.ACTIVE]: 'bg-green-100 text-green-800',
  [CONVERSATION_STATUS.COMPLETED]: 'bg-blue-100 text-blue-800',
  [CONVERSATION_STATUS.FAILED]: 'bg-red-100 text-red-800',
  
  // Lead Status
  [LEAD_STATUS.NEW]: 'bg-blue-100 text-blue-800',
  [LEAD_STATUS.CONTACTED]: 'bg-yellow-100 text-yellow-800',
  [LEAD_STATUS.QUALIFIED]: 'bg-green-100 text-green-800',
  [LEAD_STATUS.CONVERTED]: 'bg-purple-100 text-purple-800',
  [LEAD_STATUS.LOST]: 'bg-red-100 text-red-800',
  
  // Interest Levels
  [INTEREST_LEVELS.HIGH]: 'bg-green-100 text-green-800',
  [INTEREST_LEVELS.MEDIUM]: 'bg-yellow-100 text-yellow-800',
  [INTEREST_LEVELS.LOW]: 'bg-red-100 text-red-800',
};

export const TYPE_COLORS = {
  [APPOINTMENT_TYPES.CONSULTATION]: 'bg-purple-100 text-purple-800',
  [APPOINTMENT_TYPES.DEMO]: 'bg-indigo-100 text-indigo-800',
  [APPOINTMENT_TYPES.SUPPORT]: 'bg-orange-100 text-orange-800',
  [APPOINTMENT_TYPES.FOLLOWUP]: 'bg-teal-100 text-teal-800',
};

export const ROUTES = {
  DASHBOARD: 'dashboard',
  CONVERSATIONS: 'conversations',
  APPOINTMENTS: 'appointments',
  LEADS: 'leads',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
};

export const LOCAL_STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
};

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/users/me',
  
  // Conversations
  CONVERSATIONS: '/api/v1/conversations',
  CONVERSATION_ANALYSIS: '/api/v1/conversations/:id/analysis',
  
  // Appointments
  APPOINTMENTS: '/api/v1/appointments',
  APPOINTMENT_DETAIL: '/api/v1/appointments/:id',
  
  // Leads
  LEADS: '/api/v1/leads',
  LEAD_DETAIL: '/api/v1/leads/:id',
  
  // Dashboard
  DASHBOARD_STATS: '/api/v1/dashboard/stats',
  
  // Health
  HEALTH: '/health',
};

export const DEFAULT_PAGINATION = {
  PAGE: 0,
  LIMIT: 50,
};

export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  API: 'yyyy-MM-dd',
  DATETIME: 'dd/MM/yyyy HH:mm',
};

export const MESSAGES = {
  SUCCESS: {
    LOGIN: 'Sesión iniciada correctamente',
    LOGOUT: 'Sesión cerrada correctamente',
    PROFILE_UPDATED: 'Perfil actualizado exitosamente',
    APPOINTMENT_CREATED: 'Cita creada exitosamente',
    APPOINTMENT_UPDATED: 'Cita actualizada exitosamente',
  },
  ERROR: {
    NETWORK: 'Error de conexión. Verifica tu internet.',
    UNAUTHORIZED: 'Tu sesión ha expirado. Inicia sesión nuevamente.',
    FORBIDDEN: 'No tienes permisos para realizar esta acción.',
    NOT_FOUND: 'El recurso solicitado no fue encontrado.',
    SERVER_ERROR: 'Error interno del servidor. Intenta más tarde.',
    VALIDATION: 'Por favor verifica los datos ingresados.',
  },
  LOADING: {
    DEFAULT: 'Cargando...',
    LOGIN: 'Iniciando sesión...',
    SAVING: 'Guardando...',
    DELETING: 'Eliminando...',
  },
};
