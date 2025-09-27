const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const apiCall = async (endpoint, method = 'GET', data = null, options = {}) => {
  // Usar la misma clave que AuthContext
  const token = localStorage.getItem('nexusvoz_token');
  
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Handle different data types and methods
  if (data && method !== 'GET') {
    if (data instanceof FormData) {
      // For file uploads, remove Content-Type to let browser set it with boundary
      delete config.headers['Content-Type'];
      config.body = data;
    } else {
      config.body = JSON.stringify(data);
    }
  }

  // Handle GET requests with data as query parameters
  let url = `${API_BASE_URL}${endpoint}`;
  if (data && method === 'GET') {
    const searchParams = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (endpoint.includes('?') ? '&' : '?') + queryString;
    }
  }

  try {
    const response = await fetch(url, config);
    
    // Handle 401 - Unauthorized (token expired)
    if (response.status === 401) {
      localStorage.removeItem('nexusvoz_token');
      localStorage.removeItem('nexusvoz_user');
      // Trigger logout event
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    
    if (!response.ok) {
      let errorData = {};
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          errorData = await response.json();
        } catch {
          errorData = {};
        }
      } else {
        try {
          errorData.detail = await response.text();
        } catch {
          errorData = {};
        }
      }
      
      throw new ApiError(
        errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    // Handle different response types
    const contentType = response.headers.get('content-type');
    if (contentType) {
      if (contentType.includes('application/json')) {
        return await response.json();
      } else if (contentType.includes('text/')) {
        return await response.text();
      } else if (contentType.includes('application/octet-stream') || contentType.includes('application/pdf')) {
        return await response.blob();
      }
    }
    
    // Default to text if no content-type or unknown type
    const text = await response.text();
    return text || null;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Network error: ${error.message}`, 0, null);
  }
};

// API Service Methods - ENDPOINTS CORREGIDOS según tu documentación
export const authService = {
  // Usar los endpoints reales de tu API
  login: (email, password) => apiCall('/token', 'POST', new URLSearchParams({
    username: email,
    password: password,
    grant_type: 'password'
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }),
  loginUser: (email, password) => apiCall('/login', 'POST', { email, password }),
  register: (userData) => apiCall('/register', 'POST', userData),
  getProfile: () => apiCall('/users/me'),
  updateProfile: (data) => apiCall('/users/me', 'PUT', data),
  getProfileFull: () => apiCall('/users/me/full'),
  
  // Métodos adicionales que podrían existir
  logout: () => {
    localStorage.removeItem('nexusvoz_token');
    localStorage.removeItem('nexusvoz_user');
    window.dispatchEvent(new CustomEvent('auth:logout'));
  },
  refreshToken: () => apiCall('/token/refresh', 'POST'),
  validateToken: () => apiCall('/users/me', 'GET'), // Usar /users/me para validar
  forgotPassword: (email) => apiCall('/auth/forgot-password', 'POST', { email }),
  resetPassword: (token, password) => apiCall('/auth/reset-password', 'POST', { token, password }),
  changePassword: (oldPassword, newPassword) => 
    apiCall('/auth/change-password', 'POST', { old_password: oldPassword, new_password: newPassword }),
};

export const conversationService = {
  // Usar endpoints /api/v1/
  getConversations: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value);
      }
    });
    return apiCall(`/api/v1/conversations?${searchParams}`);
  },
  getConversation: (callId, options = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    return apiCall(`/api/v1/conversations/${callId}${queryString ? `?${queryString}` : ''}`);
  },
  getConversationAnalysis: (callId) => apiCall(`/api/v1/conversations/${callId}/analysis`),
  createConversationAnalysis: (data) => apiCall(`/api/v1/conversations/analysis`, 'POST', data),
  
  // Métodos de logging según tu API
  logConversationStart: (data) => apiCall('/api/v1/conversations/start', 'POST', data),
  logMessage: (data) => apiCall('/api/v1/conversations/messages', 'POST', data),
  logToolExecution: (data) => apiCall('/api/v1/conversations/tools', 'POST', data),
  logConversationEnd: (data) => apiCall('/api/v1/conversations/end', 'POST', data),
  
  deleteConversation: (callId) => apiCall(`/api/v1/conversations/${callId}`, 'DELETE'),
  updateConversation: (callId, data) => apiCall(`/api/v1/conversations/${callId}`, 'PUT', data),
};

export const appointmentService = {
  getAppointments: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value);
      }
    });
    return apiCall(`/api/v1/appointments?${searchParams}`);
  },
  getAppointment: (appointmentId) => apiCall(`/api/v1/appointments/${appointmentId}`),
  createAppointment: (data) => apiCall('/api/v1/appointments', 'POST', data),
  updateAppointment: (appointmentId, data) => 
    apiCall(`/api/v1/appointments/${appointmentId}`, 'PUT', data),
  deleteAppointment: (appointmentId) => 
    apiCall(`/api/v1/appointments/${appointmentId}`, 'DELETE'),
  confirmAppointment: (appointmentId) => 
    apiCall(`/api/v1/appointments/${appointmentId}/confirm`, 'POST'),
  cancelAppointment: (appointmentId, reason = '') => 
    apiCall(`/api/v1/appointments/${appointmentId}/cancel`, 'POST', { reason }),
};

export const leadService = {
  getLeads: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value);
      }
    });
    return apiCall(`/api/v1/leads?${searchParams}`);
  },
  getLead: (leadId) => apiCall(`/api/v1/leads/${leadId}`),
  createLead: (data) => apiCall('/api/v1/leads', 'POST', data),
  updateLead: (leadId, data) => apiCall(`/api/v1/leads/${leadId}`, 'PUT', data),
  deleteLead: (leadId) => apiCall(`/api/v1/leads/${leadId}`, 'DELETE'),
  convertLead: (leadId, data) => apiCall(`/api/v1/leads/${leadId}/convert`, 'POST', data),
};

export const dashboardService = {
  // CORREGIDO: usar /api/v1/dashboard/stats
  getStats: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value);
      }
    });
    return apiCall(`/api/v1/dashboard/stats?${searchParams}`);
  },
  getMetrics: (timeRange = '30d') => apiCall(`/api/v1/dashboard/metrics?range=${timeRange}`),
  getRecentActivity: (limit = 10) => apiCall(`/api/v1/dashboard/activity?limit=${limit}`),
};

export const retelliService = {
  // Endpoints de RetelliA según tu documentación
  createResponse: (data) => apiCall('/retelli/responses', 'POST', data),
  getMyResponses: () => apiCall('/retelli/responses/me'),
  getResponse: (responseId) => apiCall(`/retelli/responses/${responseId}`),
  deleteResponse: (responseId) => apiCall(`/retelli/responses/${responseId}`, 'DELETE'),
};

export const webhookService = {
  // Webhook de Retell
  handleRetellWebhook: (data) => apiCall('/webhooks/retell', 'POST', data),
};

export const settingsService = {
  getSettings: () => apiCall('/api/v1/settings'),
  updateSettings: (data) => apiCall('/api/v1/settings', 'PUT', data),
  getNotificationSettings: () => apiCall('/api/v1/settings/notifications'),
  updateNotificationSettings: (data) => apiCall('/api/v1/settings/notifications', 'PUT', data),
};

// SERVICIOS DE SUSCRIPCIÓN CON DATOS MOCK PARA DESARROLLO
export const subscriptionService = {
  // Obtener planes disponibles - MOCK
  getPlans: () => Promise.resolve([
    {
      id: 'basic',
      name: 'Básico',
      price: 49000,
      currency: 'COP',
      interval: 'month',
      features: [
        '100 conversaciones/mes',
        '10 citas programadas/mes',
        'Análisis básico',
        'Soporte por email',
        '1 usuario'
      ],
      maxConversations: 100,
      maxAppointments: 10,
      analytics: 'basic',
      support: 'email',
      users: 1,
      popular: false
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 149000,
      currency: 'COP',
      interval: 'month',
      features: [
        '500 conversaciones/mes',
        '50 citas programadas/mes',
        'Análisis avanzado',
        'Soporte prioritario',
        '5 usuarios',
        'Integraciones avanzadas',
        'Reportes personalizados'
      ],
      maxConversations: 500,
      maxAppointments: 50,
      analytics: 'advanced',
      support: 'priority',
      users: 5,
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 299000,
      currency: 'COP',
      interval: 'month',
      features: [
        'Conversaciones ilimitadas',
        'Citas ilimitadas',
        'Análisis completo + IA',
        'Soporte 24/7',
        'Usuarios ilimitados',
        'API personalizada',
        'Manager dedicado',
        'SLA garantizado'
      ],
      maxConversations: 'unlimited',
      maxAppointments: 'unlimited',
      analytics: 'complete',
      support: '24/7',
      users: 'unlimited',
      popular: false
    }
  ]),
  
  // Obtener suscripción actual del usuario - MOCK
  getCurrentSubscription: () => Promise.resolve({
    id: 'sub_12345',
    planId: 'premium',
    status: 'active',
    currentPeriodStart: new Date(2024, 8, 1),
    currentPeriodEnd: new Date(2024, 9, 1),
    cancelAtPeriodEnd: false,
    usage: {
      conversations: 234,
      appointments: 28
    }
  }),
  
  // Crear nueva suscripción - MOCK
  createSubscription: (data) => {
    console.log('Mock: Creating subscription', data);
    return Promise.resolve({ 
      success: true, 
      subscriptionId: 'sub_' + Date.now(),
      message: 'Suscripción creada exitosamente' 
    });
  },
  
  // Actualizar suscripción (cambiar plan) - MOCK
  updateSubscription: (subscriptionId, planId) => {
    console.log('Mock: Updating subscription', subscriptionId, planId);
    return Promise.resolve({ 
      success: true, 
      message: 'Plan actualizado exitosamente' 
    });
  },
  
  // Cancelar suscripción - MOCK
  cancelSubscription: (subscriptionId, reason = '') => {
    console.log('Mock: Canceling subscription', subscriptionId, reason);
    return Promise.resolve({ 
      success: true, 
      message: 'Suscripción cancelada' 
    });
  },
  
  // Reanudar suscripción cancelada - MOCK
  resumeSubscription: (subscriptionId) => {
    console.log('Mock: Resuming subscription', subscriptionId);
    return Promise.resolve({ 
      success: true, 
      message: 'Suscripción reactivada' 
    });
  },
  
  // Obtener uso actual - MOCK
  getUsage: () => Promise.resolve({
    current_conversations: 234,
    max_conversations: 500,
    current_appointments: 28,
    max_appointments: 50,
    current_users: 2,
    max_users: 5,
    period_start: new Date(2024, 8, 1),
    period_end: new Date(2024, 9, 1)
  }),
  
  // Verificar límites del plan - MOCK
  checkLimits: () => Promise.resolve({
    current_conversations: 234,
    max_conversations: 500,
    current_appointments: 28,
    max_appointments: 50,
    current_users: 2,
    max_users: 5,
    limits_reached: false
  }),
};

export const paymentService = {
  // Obtener métodos de pago del usuario - MOCK
  getPaymentMethods: () => Promise.resolve([
    {
      id: 'pm_1',
      type: 'card',
      card: {
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2025
      },
      isDefault: true
    },
    {
      id: 'pm_2',
      type: 'nequi',
      nequi: {
        phone: '*****1234'
      },
      isDefault: false
    }
  ]),
  
  // Agregar método de pago - MOCK
  addPaymentMethod: (data) => {
    console.log('Mock: Adding payment method', data);
    return Promise.resolve({ 
      success: true, 
      paymentMethodId: 'pm_' + Date.now(),
      message: 'Método de pago agregado' 
    });
  },
  
  // Eliminar método de pago - MOCK
  removePaymentMethod: (methodId) => {
    console.log('Mock: Removing payment method', methodId);
    return Promise.resolve({ 
      success: true, 
      message: 'Método de pago eliminado' 
    });
  },
  
  // Establecer método de pago por defecto - MOCK
  setDefaultPaymentMethod: (methodId) => {
    console.log('Mock: Setting default payment method', methodId);
    return Promise.resolve({ 
      success: true, 
      message: 'Método predeterminado actualizado' 
    });
  },
  
  // Procesar pago manual - MOCK
  processPayment: (data) => {
    console.log('Mock: Processing payment', data);
    return Promise.resolve({ 
      success: true, 
      transactionId: 'tx_' + Date.now(),
      message: 'Pago procesado exitosamente' 
    });
  },
  
  // Obtener configuración de PayPal - MOCK
  getPayPalConfig: () => Promise.resolve({
    clientId: 'mock_paypal_client_id',
    environment: 'sandbox'
  }),
  
  // Crear orden de PayPal - MOCK
  createPayPalOrder: (data) => {
    console.log('Mock: Creating PayPal order', data);
    return Promise.resolve({ 
      orderId: 'pp_order_' + Date.now(),
      approvalUrl: 'https://sandbox.paypal.com/mock-approval'
    });
  },
  
  // Capturar orden de PayPal - MOCK
  capturePayPalOrder: (orderId) => {
    console.log('Mock: Capturing PayPal order', orderId);
    return Promise.resolve({ 
      success: true, 
      transactionId: 'pp_tx_' + Date.now(),
      message: 'Pago PayPal completado' 
    });
  },
  
  // Configuración de Nequi - MOCK
  getNequiConfig: () => Promise.resolve({
    merchantId: 'mock_nequi_merchant',
    environment: 'test'
  }),
  
  // Procesar pago con Nequi - MOCK
  processNequiPayment: (data) => {
    console.log('Mock: Processing Nequi payment', data);
    return Promise.resolve({ 
      success: true, 
      transactionId: 'nequi_' + Date.now(),
      message: 'Pago Nequi procesado' 
    });
  },
  
  // Webhook para pagos - MOCK
  handlePaymentWebhook: (data) => {
    console.log('Mock: Payment webhook received', data);
    return Promise.resolve({ success: true });
  },
};

export const billingService = {
  // Obtener historial de facturas - MOCK
  getInvoices: (params = {}) => {
    console.log('Mock: Getting invoices', params);
    return Promise.resolve([
      {
        id: 'inv_1',
        date: new Date(2024, 8, 1),
        amount: 149000,
        currency: 'COP',
        status: 'paid',
        plan: 'Premium',
        period: 'Sep 2024',
        downloadUrl: '#'
      },
      {
        id: 'inv_2',
        date: new Date(2024, 7, 1),
        amount: 149000,
        currency: 'COP',
        status: 'paid',
        plan: 'Premium',
        period: 'Ago 2024',
        downloadUrl: '#'
      },
      {
        id: 'inv_3',
        date: new Date(2024, 6, 1),
        amount: 49000,
        currency: 'COP',
        status: 'paid',
        plan: 'Básico',
        period: 'Jul 2024',
        downloadUrl: '#'
      }
    ]);
  },
  
  // Obtener factura específica - MOCK
  getInvoice: (invoiceId) => {
    console.log('Mock: Getting invoice', invoiceId);
    return Promise.resolve({
      id: invoiceId,
      date: new Date(),
      amount: 149000,
      currency: 'COP',
      status: 'paid',
      plan: 'Premium',
      period: 'Sep 2024'
    });
  },
  
  // Descargar factura en PDF - MOCK
  downloadInvoice: (invoiceId) => {
    console.log('Mock: Downloading invoice', invoiceId);
    // Crear un blob mock para simular descarga
    const pdfContent = `Factura Mock ${invoiceId}`;
    return Promise.resolve(new Blob([pdfContent], { type: 'application/pdf' }));
  },
  
  // Obtener próxima facturación - MOCK
  getUpcomingInvoice: () => Promise.resolve({
    amount: 149000,
    currency: 'COP',
    date: new Date(2024, 9, 1),
    plan: 'Premium'
  }),
  
  // Obtener historial de pagos - MOCK
  getPaymentHistory: (params = {}) => {
    console.log('Mock: Getting payment history', params);
    return Promise.resolve([
      {
        id: 'pay_1',
        date: new Date(2024, 8, 1),
        amount: 149000,
        currency: 'COP',
        status: 'succeeded',
        method: 'visa_4242',
        description: 'Suscripción Premium - Sep 2024'
      },
      {
        id: 'pay_2',
        date: new Date(2024, 7, 1),
        amount: 149000,
        currency: 'COP',
        status: 'succeeded',
        method: 'visa_4242',
        description: 'Suscripción Premium - Ago 2024'
      }
    ]);
  },
  
  // Reintentar pago fallido - MOCK
  retryPayment: (paymentId) => {
    console.log('Mock: Retrying payment', paymentId);
    return Promise.resolve({ 
      success: true, 
      message: 'Reintento de pago procesado' 
    });
  },
  
  // Obtener resumen de facturación - MOCK
  getBillingSummary: () => Promise.resolve({
    totalPaid: 596000,
    totalInvoices: 4,
    nextPaymentDate: new Date(2024, 9, 1),
    nextPaymentAmount: 149000,
    currency: 'COP'
  }),
};

// Servicio de Analytics actualizado
export const analyticsService = {
  // Obtener métricas generales
  getMetrics: async (days = 30) => {
    try {
      const response = await apiCall(`/api/v1/analytics/metrics?days=${days}`);
      return response;
    } catch (error) {
      console.error('Error getting analytics metrics:', error);
      // Datos de ejemplo para desarrollo
      return {
        data: {
          totalConversations: 1250,
          conversationsChange: 15.3,
          totalAppointments: 89,
          appointmentsChange: 8.7,
          totalLeads: 156,
          leadsChange: 22.1,
          conversionRate: 12.5,
          conversionChange: 3.2,
          avgDailyConversations: 42,
          avgConversationDuration: '8m 32s',
          satisfactionRate: 87,
          appointmentConfirmationRate: 94,
          noShowRate: 6,
          avgResponseTime: '2m 15s',
          avgLeadScore: 73,
          avgConversionTime: '5.2d',
          avgLeadValue: 2500000
        }
      };
    }
  },

  // Obtener datos de conversaciones por día
  getConversationData: async (days = 30) => {
    try {
      const response = await apiCall(`/api/v1/analytics/conversations?days=${days}`);
      return response;
    } catch (error) {
      console.error('Error getting conversation data:', error);
      // Datos de ejemplo
      const mockData = [];
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        mockData.push({
          date: date.toISOString().split('T')[0],
          conversations: Math.floor(Math.random() * 50) + 20
        });
      }
      return { data: mockData };
    }
  },

  // Obtener datos de citas por estado
  getAppointmentData: async (days = 30) => {
    try {
      const response = await apiCall(`/api/v1/analytics/appointments?days=${days}`);
      return response;
    } catch (error) {
      console.error('Error getting appointment data:', error);
      // Datos de ejemplo
      return {
        data: [
          { name: 'Programadas', value: 45 },
          { name: 'Confirmadas', value: 32 },
          { name: 'Completadas', value: 28 },
          { name: 'Canceladas', value: 8 },
          { name: 'No Show', value: 3 }
        ]
      };
    }
  },

  // Obtener fuentes de leads
  getLeadSources: async (days = 30) => {
    try {
      const response = await apiCall(`/api/v1/analytics/lead-sources?days=${days}`);
      return response;
    } catch (error) {
      console.error('Error getting lead sources:', error);
      // Datos de ejemplo
      return {
        data: [
          { source: 'WhatsApp', count: 45 },
          { source: 'Facebook', count: 32 },
          { source: 'Website', count: 28 },
          { source: 'Referidos', count: 18 },
          { source: 'Google', count: 15 },
          { source: 'Otros', count: 8 }
        ]
      };
    }
  },

  // Obtener datos de rendimiento por hora
  getPerformanceData: async (days = 30) => {
    try {
      const response = await apiCall(`/api/v1/analytics/performance?days=${days}`);
      return response;
    } catch (error) {
      console.error('Error getting performance data:', error);
      // Datos de ejemplo
      const mockData = [];
      for (let hour = 0; hour < 24; hour++) {
        mockData.push({
          hour: `${hour}:00`,
          activity: Math.floor(Math.random() * 20) + (hour >= 8 && hour <= 18 ? 15 : 5)
        });
      }
      return { data: mockData };
    }
  },

  // Exportar datos
  exportData: async (format, days = 30) => {
    try {
      const response = await apiCall(`/api/v1/analytics/export?format=${format}&days=${days}`, 'GET', null, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      throw error;
    }
  }
};

export const healthService = {
  check: () => apiCall('/health'),
  detailed: () => apiCall('/health/detailed'),
};

// Utility functions
export const isApiError = (error) => error instanceof ApiError;

export const handleApiError = (error) => {
  if (isApiError(error)) {
    switch (error.status) {
      case 401:
        return 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      case 403:
        return 'No tienes permisos para realizar esta acción.';
      case 404:
        return 'El recurso solicitado no fue encontrado.';
      case 422:
        return error.data?.detail || 'Los datos enviados no son válidos.';
      case 429:
        return 'Has excedido el límite de solicitudes. Intenta nuevamente más tarde.';
      case 500:
        return 'Error interno del servidor. Intenta nuevamente más tarde.';
      default:
        return error.message;
    }
  }
  return 'Error de conexión. Verifica tu conexión a internet.';
};

// Export default service compatible con tus componentes - COMPLETO CON SUSCRIPCIONES
const apiService = {
  // Métodos principales
  get: (endpoint, params) => apiCall(endpoint, 'GET', params),
  post: (endpoint, data) => apiCall(endpoint, 'POST', data),
  put: (endpoint, data) => apiCall(endpoint, 'PUT', data),
  delete: (endpoint) => apiCall(endpoint, 'DELETE'),

  // Servicios específicos EXISTENTES
  auth: authService,
  conversations: conversationService,
  appointments: appointmentService,
  leads: leadService,
  dashboard: dashboardService,
  analytics: analyticsService,
  retelli: retelliService,
  webhooks: webhookService,
  settings: settingsService,
  health: healthService,

  // SERVICIOS DE SUSCRIPCIÓN CON MOCK DATA
  subscriptions: subscriptionService,
  payments: paymentService,
  billing: billingService,

  // Aliases para compatibilidad con componentes existentes
  getAnalytics: analyticsService.getMetrics,
  getConversationStats: () => dashboardService.getStats(),
  getLeadStats: () => leadService.getLeads(),
  getAppointmentStats: () => appointmentService.getAppointments(),
  getSettings: settingsService.getSettings,
  updateSettings: settingsService.updateSettings,
  updateProfile: authService.updateProfile,
  getConversations: conversationService.getConversations,
  getAppointments: appointmentService.getAppointments,
  getLeads: leadService.getLeads,

  // NUEVOS MÉTODOS DE CONVENIENCIA PARA SUSCRIPCIONES
  getSubscriptionPlans: subscriptionService.getPlans,
  getCurrentSubscription: subscriptionService.getCurrentSubscription,
  getPaymentMethods: paymentService.getPaymentMethods,
  getBillingHistory: billingService.getInvoices,
  getSubscriptionUsage: subscriptionService.getUsage,
  checkSubscriptionLimits: subscriptionService.checkLimits,
};

export { ApiError, apiService };
export default apiService;













// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// class ApiError extends Error {
//   constructor(message, status, data) {
//     super(message);
//     this.name = 'ApiError';
//     this.status = status;
//     this.data = data;
//   }
// }

// export const apiCall = async (endpoint, method = 'GET', data = null, options = {}) => {
//   // Usar la misma clave que AuthContext
//   const token = localStorage.getItem('nexusvoz_token');
  
//   const config = {
//     method,
//     headers: {
//       'Content-Type': 'application/json',
//       ...options.headers,
//     },
//     ...options,
//   };

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   // Handle different data types and methods
//   if (data && method !== 'GET') {
//     if (data instanceof FormData) {
//       // For file uploads, remove Content-Type to let browser set it with boundary
//       delete config.headers['Content-Type'];
//       config.body = data;
//     } else {
//       config.body = JSON.stringify(data);
//     }
//   }

//   // Handle GET requests with data as query parameters
//   let url = `${API_BASE_URL}${endpoint}`;
//   if (data && method === 'GET') {
//     const searchParams = new URLSearchParams();
//     Object.entries(data).forEach(([key, value]) => {
//       if (value !== null && value !== undefined && value !== '') {
//         searchParams.append(key, value);
//       }
//     });
//     const queryString = searchParams.toString();
//     if (queryString) {
//       url += (endpoint.includes('?') ? '&' : '?') + queryString;
//     }
//   }

//   try {
//     const response = await fetch(url, config);
    
//     // Handle 401 - Unauthorized (token expired)
//     if (response.status === 401) {
//       localStorage.removeItem('nexusvoz_token');
//       localStorage.removeItem('nexusvoz_user');
//       // Trigger logout event
//       window.dispatchEvent(new CustomEvent('auth:logout'));
//     }
    
//     if (!response.ok) {
//       let errorData = {};
//       const contentType = response.headers.get('content-type');
      
//       if (contentType && contentType.includes('application/json')) {
//         try {
//           errorData = await response.json();
//         } catch {
//           errorData = {};
//         }
//       } else {
//         try {
//           errorData.detail = await response.text();
//         } catch {
//           errorData = {};
//         }
//       }
      
//       throw new ApiError(
//         errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
//         response.status,
//         errorData
//       );
//     }

//     // Handle different response types
//     const contentType = response.headers.get('content-type');
//     if (contentType) {
//       if (contentType.includes('application/json')) {
//         return await response.json();
//       } else if (contentType.includes('text/')) {
//         return await response.text();
//       } else if (contentType.includes('application/octet-stream') || contentType.includes('application/pdf')) {
//         return await response.blob();
//       }
//     }
    
//     // Default to text if no content-type or unknown type
//     const text = await response.text();
//     return text || null;
//   } catch (error) {
//     if (error instanceof ApiError) {
//       throw error;
//     }
//     throw new ApiError(`Network error: ${error.message}`, 0, null);
//   }
// };

// // API Service Methods - ENDPOINTS CORREGIDOS según tu documentación
// export const authService = {
//   // Usar los endpoints reales de tu API
//   login: (email, password) => apiCall('/token', 'POST', new URLSearchParams({
//     username: email,
//     password: password,
//     grant_type: 'password'
//   }), {
//     headers: {
//       'Content-Type': 'application/x-www-form-urlencoded'
//     }
//   }),
//   loginUser: (email, password) => apiCall('/login', 'POST', { email, password }),
//   register: (userData) => apiCall('/register', 'POST', userData),
//   getProfile: () => apiCall('/users/me'),
//   updateProfile: (data) => apiCall('/users/me', 'PUT', data),
//   getProfileFull: () => apiCall('/users/me/full'),
  
//   // Métodos adicionales que podrían existir
//   logout: () => {
//     localStorage.removeItem('nexusvoz_token');
//     localStorage.removeItem('nexusvoz_user');
//     window.dispatchEvent(new CustomEvent('auth:logout'));
//   },
//   refreshToken: () => apiCall('/token/refresh', 'POST'),
//   validateToken: () => apiCall('/users/me', 'GET'), // Usar /users/me para validar
//   forgotPassword: (email) => apiCall('/auth/forgot-password', 'POST', { email }),
//   resetPassword: (token, password) => apiCall('/auth/reset-password', 'POST', { token, password }),
//   changePassword: (oldPassword, newPassword) => 
//     apiCall('/auth/change-password', 'POST', { old_password: oldPassword, new_password: newPassword }),
// };

// export const conversationService = {
//   // Usar endpoints /api/v1/
//   getConversations: (params = {}) => {
//     const searchParams = new URLSearchParams();
//     Object.entries(params).forEach(([key, value]) => {
//       if (value !== null && value !== undefined && value !== '') {
//         searchParams.append(key, value);
//       }
//     });
//     return apiCall(`/api/v1/conversations?${searchParams}`);
//   },
//   getConversation: (callId, options = {}) => {
//     const searchParams = new URLSearchParams();
//     Object.entries(options).forEach(([key, value]) => {
//       if (value !== null && value !== undefined && value !== '') {
//         searchParams.append(key, value);
//       }
//     });
//     const queryString = searchParams.toString();
//     return apiCall(`/api/v1/conversations/${callId}${queryString ? `?${queryString}` : ''}`);
//   },
//   getConversationAnalysis: (callId) => apiCall(`/api/v1/conversations/${callId}/analysis`),
//   createConversationAnalysis: (data) => apiCall(`/api/v1/conversations/analysis`, 'POST', data),
  
//   // Métodos de logging según tu API
//   logConversationStart: (data) => apiCall('/api/v1/conversations/start', 'POST', data),
//   logMessage: (data) => apiCall('/api/v1/conversations/messages', 'POST', data),
//   logToolExecution: (data) => apiCall('/api/v1/conversations/tools', 'POST', data),
//   logConversationEnd: (data) => apiCall('/api/v1/conversations/end', 'POST', data),
  
//   deleteConversation: (callId) => apiCall(`/api/v1/conversations/${callId}`, 'DELETE'),
//   updateConversation: (callId, data) => apiCall(`/api/v1/conversations/${callId}`, 'PUT', data),
// };

// export const appointmentService = {
//   getAppointments: (params = {}) => {
//     const searchParams = new URLSearchParams();
//     Object.entries(params).forEach(([key, value]) => {
//       if (value !== null && value !== undefined && value !== '') {
//         searchParams.append(key, value);
//       }
//     });
//     return apiCall(`/api/v1/appointments?${searchParams}`);
//   },
//   getAppointment: (appointmentId) => apiCall(`/api/v1/appointments/${appointmentId}`),
//   createAppointment: (data) => apiCall('/api/v1/appointments', 'POST', data),
//   updateAppointment: (appointmentId, data) => 
//     apiCall(`/api/v1/appointments/${appointmentId}`, 'PUT', data),
//   deleteAppointment: (appointmentId) => 
//     apiCall(`/api/v1/appointments/${appointmentId}`, 'DELETE'),
//   confirmAppointment: (appointmentId) => 
//     apiCall(`/api/v1/appointments/${appointmentId}/confirm`, 'POST'),
//   cancelAppointment: (appointmentId, reason = '') => 
//     apiCall(`/api/v1/appointments/${appointmentId}/cancel`, 'POST', { reason }),
// };

// export const leadService = {
//   getLeads: (params = {}) => {
//     const searchParams = new URLSearchParams();
//     Object.entries(params).forEach(([key, value]) => {
//       if (value !== null && value !== undefined && value !== '') {
//         searchParams.append(key, value);
//       }
//     });
//     return apiCall(`/api/v1/leads?${searchParams}`);
//   },
//   getLead: (leadId) => apiCall(`/api/v1/leads/${leadId}`),
//   createLead: (data) => apiCall('/api/v1/leads', 'POST', data),
//   updateLead: (leadId, data) => apiCall(`/api/v1/leads/${leadId}`, 'PUT', data),
//   deleteLead: (leadId) => apiCall(`/api/v1/leads/${leadId}`, 'DELETE'),
//   convertLead: (leadId, data) => apiCall(`/api/v1/leads/${leadId}/convert`, 'POST', data),
// };

// export const dashboardService = {
//   // CORREGIDO: usar /api/v1/dashboard/stats
//   getStats: (params = {}) => {
//     const searchParams = new URLSearchParams();
//     Object.entries(params).forEach(([key, value]) => {
//       if (value !== null && value !== undefined && value !== '') {
//         searchParams.append(key, value);
//       }
//     });
//     return apiCall(`/api/v1/dashboard/stats?${searchParams}`);
//   },
//   getMetrics: (timeRange = '30d') => apiCall(`/api/v1/dashboard/metrics?range=${timeRange}`),
//   getRecentActivity: (limit = 10) => apiCall(`/api/v1/dashboard/activity?limit=${limit}`),
// };

// export const retelliService = {
//   // Endpoints de RetelliA según tu documentación
//   createResponse: (data) => apiCall('/retelli/responses', 'POST', data),
//   getMyResponses: () => apiCall('/retelli/responses/me'),
//   getResponse: (responseId) => apiCall(`/retelli/responses/${responseId}`),
//   deleteResponse: (responseId) => apiCall(`/retelli/responses/${responseId}`, 'DELETE'),
// };

// export const webhookService = {
//   // Webhook de Retell
//   handleRetellWebhook: (data) => apiCall('/webhooks/retell', 'POST', data),
// };

// export const settingsService = {
//   getSettings: () => apiCall('/api/v1/settings'),
//   updateSettings: (data) => apiCall('/api/v1/settings', 'PUT', data),
//   getNotificationSettings: () => apiCall('/api/v1/settings/notifications'),
//   updateNotificationSettings: (data) => apiCall('/api/v1/settings/notifications', 'PUT', data),
// };

// // NUEVOS SERVICIOS DE SUSCRIPCIÓN - AGREGADOS SIN ELIMINAR LO EXISTENTE
// export const subscriptionService = {
//   // Obtener planes disponibles
//   getPlans: () => apiCall('/api/v1/subscriptions/plans', 'GET'),
  
//   // Obtener suscripción actual del usuario
//   getCurrentSubscription: () => apiCall('/api/v1/subscriptions/current', 'GET'),
  
//   // Crear nueva suscripción
//   createSubscription: (data) => apiCall('/api/v1/subscriptions', 'POST', data),
  
//   // Actualizar suscripción (cambiar plan)
//   updateSubscription: (subscriptionId, planId) => 
//     apiCall(`/api/v1/subscriptions/${subscriptionId}`, 'PUT', { plan_id: planId }),
  
//   // Cancelar suscripción
//   cancelSubscription: (subscriptionId, reason = '') => 
//     apiCall(`/api/v1/subscriptions/${subscriptionId}/cancel`, 'POST', { reason }),
  
//   // Reanudar suscripción cancelada
//   resumeSubscription: (subscriptionId) => 
//     apiCall(`/api/v1/subscriptions/${subscriptionId}/resume`, 'POST'),
  
//   // Obtener uso actual (conversaciones, citas, etc.)
//   getUsage: () => apiCall('/api/v1/subscriptions/usage', 'GET'),
  
//   // Verificar límites del plan
//   checkLimits: () => apiCall('/api/v1/subscriptions/limits', 'GET'),
// };

// export const paymentService = {
//   // Obtener métodos de pago del usuario
//   getPaymentMethods: () => apiCall('/api/v1/payments/methods', 'GET'),
  
//   // Agregar método de pago
//   addPaymentMethod: (data) => apiCall('/api/v1/payments/methods', 'POST', data),
  
//   // Eliminar método de pago
//   removePaymentMethod: (methodId) => 
//     apiCall(`/api/v1/payments/methods/${methodId}`, 'DELETE'),
  
//   // Establecer método de pago por defecto
//   setDefaultPaymentMethod: (methodId) => 
//     apiCall(`/api/v1/payments/methods/${methodId}/default`, 'PUT'),
  
//   // Procesar pago manual
//   processPayment: (data) => apiCall('/api/v1/payments/process', 'POST', data),
  
//   // Obtener configuración de PayPal
//   getPayPalConfig: () => apiCall('/api/v1/payments/paypal/config', 'GET'),
  
//   // Crear orden de PayPal
//   createPayPalOrder: (data) => apiCall('/api/v1/payments/paypal/create-order', 'POST', data),
  
//   // Capturar orden de PayPal
//   capturePayPalOrder: (orderId) => 
//     apiCall(`/api/v1/payments/paypal/capture-order/${orderId}`, 'POST'),
  
//   // Configuración de Nequi
//   getNequiConfig: () => apiCall('/api/v1/payments/nequi/config', 'GET'),
  
//   // Procesar pago con Nequi
//   processNequiPayment: (data) => apiCall('/api/v1/payments/nequi/process', 'POST', data),
  
//   // Webhook para pagos
//   handlePaymentWebhook: (data) => apiCall('/api/v1/payments/webhook', 'POST', data),
// };

// export const billingService = {
//   // Obtener historial de facturas
//   getInvoices: (params = {}) => {
//     const searchParams = new URLSearchParams();
//     Object.entries(params).forEach(([key, value]) => {
//       if (value !== null && value !== undefined && value !== '') {
//         searchParams.append(key, value);
//       }
//     });
//     return apiCall(`/api/v1/billing/invoices?${searchParams}`);
//   },
  
//   // Obtener factura específica
//   getInvoice: (invoiceId) => apiCall(`/api/v1/billing/invoices/${invoiceId}`),
  
//   // Descargar factura en PDF
//   downloadInvoice: (invoiceId) => 
//     apiCall(`/api/v1/billing/invoices/${invoiceId}/download`, 'GET', null, {
//       responseType: 'blob'
//     }),
  
//   // Obtener próxima facturación
//   getUpcomingInvoice: () => apiCall('/api/v1/billing/upcoming', 'GET'),
  
//   // Obtener historial de pagos
//   getPaymentHistory: (params = {}) => {
//     const searchParams = new URLSearchParams();
//     Object.entries(params).forEach(([key, value]) => {
//       if (value !== null && value !== undefined && value !== '') {
//         searchParams.append(key, value);
//       }
//     });
//     return apiCall(`/api/v1/billing/payments?${searchParams}`);
//   },
  
//   // Reintentar pago fallido
//   retryPayment: (paymentId) => 
//     apiCall(`/api/v1/billing/payments/${paymentId}/retry`, 'POST'),
  
//   // Obtener resumen de facturación
//   getBillingSummary: () => apiCall('/api/v1/billing/summary', 'GET'),
// };

// // Servicio de Analytics actualizado
// export const analyticsService = {
//   // Obtener métricas generales
//   getMetrics: async (days = 30) => {
//     try {
//       const response = await apiCall(`/api/v1/analytics/metrics?days=${days}`);
//       return response;
//     } catch (error) {
//       console.error('Error getting analytics metrics:', error);
//       // Datos de ejemplo para desarrollo
//       return {
//         data: {
//           totalConversations: 1250,
//           conversationsChange: 15.3,
//           totalAppointments: 89,
//           appointmentsChange: 8.7,
//           totalLeads: 156,
//           leadsChange: 22.1,
//           conversionRate: 12.5,
//           conversionChange: 3.2,
//           avgDailyConversations: 42,
//           avgConversationDuration: '8m 32s',
//           satisfactionRate: 87,
//           appointmentConfirmationRate: 94,
//           noShowRate: 6,
//           avgResponseTime: '2m 15s',
//           avgLeadScore: 73,
//           avgConversionTime: '5.2d',
//           avgLeadValue: 2500000
//         }
//       };
//     }
//   },

//   // Obtener datos de conversaciones por día
//   getConversationData: async (days = 30) => {
//     try {
//       const response = await apiCall(`/api/v1/analytics/conversations?days=${days}`);
//       return response;
//     } catch (error) {
//       console.error('Error getting conversation data:', error);
//       // Datos de ejemplo
//       const mockData = [];
//       for (let i = days; i >= 0; i--) {
//         const date = new Date();
//         date.setDate(date.getDate() - i);
//         mockData.push({
//           date: date.toISOString().split('T')[0],
//           conversations: Math.floor(Math.random() * 50) + 20
//         });
//       }
//       return { data: mockData };
//     }
//   },

//   // Obtener datos de citas por estado
//   getAppointmentData: async (days = 30) => {
//     try {
//       const response = await apiCall(`/api/v1/analytics/appointments?days=${days}`);
//       return response;
//     } catch (error) {
//       console.error('Error getting appointment data:', error);
//       // Datos de ejemplo
//       return {
//         data: [
//           { name: 'Programadas', value: 45 },
//           { name: 'Confirmadas', value: 32 },
//           { name: 'Completadas', value: 28 },
//           { name: 'Canceladas', value: 8 },
//           { name: 'No Show', value: 3 }
//         ]
//       };
//     }
//   },

//   // Obtener fuentes de leads
//   getLeadSources: async (days = 30) => {
//     try {
//       const response = await apiCall(`/api/v1/analytics/lead-sources?days=${days}`);
//       return response;
//     } catch (error) {
//       console.error('Error getting lead sources:', error);
//       // Datos de ejemplo
//       return {
//         data: [
//           { source: 'WhatsApp', count: 45 },
//           { source: 'Facebook', count: 32 },
//           { source: 'Website', count: 28 },
//           { source: 'Referidos', count: 18 },
//           { source: 'Google', count: 15 },
//           { source: 'Otros', count: 8 }
//         ]
//       };
//     }
//   },

//   // Obtener datos de rendimiento por hora
//   getPerformanceData: async (days = 30) => {
//     try {
//       const response = await apiCall(`/api/v1/analytics/performance?days=${days}`);
//       return response;
//     } catch (error) {
//       console.error('Error getting performance data:', error);
//       // Datos de ejemplo
//       const mockData = [];
//       for (let hour = 0; hour < 24; hour++) {
//         mockData.push({
//           hour: `${hour}:00`,
//           activity: Math.floor(Math.random() * 20) + (hour >= 8 && hour <= 18 ? 15 : 5)
//         });
//       }
//       return { data: mockData };
//     }
//   },

//   // Exportar datos
//   exportData: async (format, days = 30) => {
//     try {
//       const response = await apiCall(`/api/v1/analytics/export?format=${format}&days=${days}`, 'GET', null, {
//         responseType: 'blob'
//       });
//       return response;
//     } catch (error) {
//       console.error('Error exporting analytics data:', error);
//       throw error;
//     }
//   }
// };

// export const healthService = {
//   check: () => apiCall('/health'),
//   detailed: () => apiCall('/health/detailed'),
// };

// // Utility functions
// export const isApiError = (error) => error instanceof ApiError;

// export const handleApiError = (error) => {
//   if (isApiError(error)) {
//     switch (error.status) {
//       case 401:
//         return 'Sesión expirada. Por favor, inicia sesión nuevamente.';
//       case 403:
//         return 'No tienes permisos para realizar esta acción.';
//       case 404:
//         return 'El recurso solicitado no fue encontrado.';
//       case 422:
//         return error.data?.detail || 'Los datos enviados no son válidos.';
//       case 429:
//         return 'Has excedido el límite de solicitudes. Intenta nuevamente más tarde.';
//       case 500:
//         return 'Error interno del servidor. Intenta nuevamente más tarde.';
//       default:
//         return error.message;
//     }
//   }
//   return 'Error de conexión. Verifica tu conexión a internet.';
// };

// // Export default service compatible con tus componentes - ACTUALIZADO CON SERVICIOS DE SUSCRIPCIÓN
// const apiService = {
//   // Métodos principales
//   get: (endpoint, params) => apiCall(endpoint, 'GET', params),
//   post: (endpoint, data) => apiCall(endpoint, 'POST', data),
//   put: (endpoint, data) => apiCall(endpoint, 'PUT', data),
//   delete: (endpoint) => apiCall(endpoint, 'DELETE'),

//   // Servicios específicos EXISTENTES
//   auth: authService,
//   conversations: conversationService,
//   appointments: appointmentService,
//   leads: leadService,
//   dashboard: dashboardService,
//   analytics: analyticsService,
//   retelli: retelliService,
//   webhooks: webhookService,
//   settings: settingsService,
//   health: healthService,

//   // NUEVOS SERVICIOS DE SUSCRIPCIÓN
//   subscriptions: subscriptionService,
//   payments: paymentService,
//   billing: billingService,

//   // Aliases para compatibilidad con componentes existentes
//   getAnalytics: analyticsService.getMetrics,
//   getConversationStats: () => dashboardService.getStats(),
//   getLeadStats: () => leadService.getLeads(),
//   getAppointmentStats: () => appointmentService.getAppointments(),
//   getSettings: settingsService.getSettings,
//   updateSettings: settingsService.updateSettings,
//   updateProfile: authService.updateProfile,
//   getConversations: conversationService.getConversations,
//   getAppointments: appointmentService.getAppointments,
//   getLeads: leadService.getLeads(),

//   // NUEVOS MÉTODOS DE CONVENIENCIA PARA SUSCRIPCIONES
//   getSubscriptionPlans: subscriptionService.getPlans,
//   getCurrentSubscription: subscriptionService.getCurrentSubscription,
//   getPaymentMethods: paymentService.getPaymentMethods,
//   getBillingHistory: billingService.getInvoices,
//   getSubscriptionUsage: subscriptionService.getUsage,
//   checkSubscriptionLimits: subscriptionService.checkLimits,
// };

// export { ApiError, apiService };
// export default apiService;