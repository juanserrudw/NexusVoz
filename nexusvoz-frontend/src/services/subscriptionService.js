// src/services/subscriptionService.js
import React, { useState, useEffect, useCallback } from 'react';
import { apiCall } from './api';

export const subscriptionService = {
  // Obtener planes disponibles
  getPlans: () => apiCall('/api/v1/subscriptions/plans', 'GET'),
  
  // Obtener suscripción actual del usuario
  getCurrentSubscription: () => apiCall('/api/v1/subscriptions/current', 'GET'),
  
  // Crear nueva suscripción
  createSubscription: (data) => apiCall('/api/v1/subscriptions', 'POST', data),
  
  // Actualizar suscripción (cambiar plan)
  updateSubscription: (subscriptionId, planId) => 
    apiCall(`/api/v1/subscriptions/${subscriptionId}`, 'PUT', { plan_id: planId }),
  
  // Cancelar suscripción
  cancelSubscription: (subscriptionId, reason = '') => 
    apiCall(`/api/v1/subscriptions/${subscriptionId}/cancel`, 'POST', { reason }),
  
  // Reanudar suscripción cancelada
  resumeSubscription: (subscriptionId) => 
    apiCall(`/api/v1/subscriptions/${subscriptionId}/resume`, 'POST'),
  
  // Obtener uso actual (conversaciones, citas, etc.)
  getUsage: () => apiCall('/api/v1/subscriptions/usage', 'GET'),
  
  // Verificar límites del plan
  checkLimits: () => apiCall('/api/v1/subscriptions/limits', 'GET'),
};

export const paymentService = {
  // Obtener métodos de pago del usuario
  getPaymentMethods: () => apiCall('/api/v1/payments/methods', 'GET'),
  
  // Agregar método de pago
  addPaymentMethod: (data) => apiCall('/api/v1/payments/methods', 'POST', data),
  
  // Eliminar método de pago
  removePaymentMethod: (methodId) => 
    apiCall(`/api/v1/payments/methods/${methodId}`, 'DELETE'),
  
  // Establecer método de pago por defecto
  setDefaultPaymentMethod: (methodId) => 
    apiCall(`/api/v1/payments/methods/${methodId}/default`, 'PUT'),
  
  // Procesar pago manual
  processPayment: (data) => apiCall('/api/v1/payments/process', 'POST', data),
  
  // Obtener configuración de PayPal
  getPayPalConfig: () => apiCall('/api/v1/payments/paypal/config', 'GET'),
  
  // Crear orden de PayPal
  createPayPalOrder: (data) => apiCall('/api/v1/payments/paypal/create-order', 'POST', data),
  
  // Capturar orden de PayPal
  capturePayPalOrder: (orderId) => 
    apiCall(`/api/v1/payments/paypal/capture-order/${orderId}`, 'POST'),
  
  // Configuración de Nequi
  getNequiConfig: () => apiCall('/api/v1/payments/nequi/config', 'GET'),
  
  // Procesar pago con Nequi
  processNequiPayment: (data) => apiCall('/api/v1/payments/nequi/process', 'POST', data),
  
  // Webhook para pagos
  handlePaymentWebhook: (data) => apiCall('/api/v1/payments/webhook', 'POST', data),
};

export const billingService = {
  // Obtener historial de facturas
  getInvoices: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value);
      }
    });
    return apiCall(`/api/v1/billing/invoices?${searchParams}`);
  },
  
  // Obtener factura específica
  getInvoice: (invoiceId) => apiCall(`/api/v1/billing/invoices/${invoiceId}`),
  
  // Descargar factura en PDF
  downloadInvoice: (invoiceId) => 
    apiCall(`/api/v1/billing/invoices/${invoiceId}/download`, 'GET', null, {
      responseType: 'blob'
    }),
  
  // Obtener próxima facturación
  getUpcomingInvoice: () => apiCall('/api/v1/billing/upcoming', 'GET'),
  
  // Obtener historial de pagos
  getPaymentHistory: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value);
      }
    });
    return apiCall(`/api/v1/billing/payments?${searchParams}`);
  },
  
  // Reintentar pago fallido
  retryPayment: (paymentId) => 
    apiCall(`/api/v1/billing/payments/${paymentId}/retry`, 'POST'),
  
  // Obtener resumen de facturación
  getBillingSummary: () => apiCall('/api/v1/billing/summary', 'GET'),
};

// Hooks personalizados para suscripciones
export const useSubscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubscriptionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [subscriptionData, plansData, usageData] = await Promise.all([
        subscriptionService.getCurrentSubscription(),
        subscriptionService.getPlans(),
        subscriptionService.getUsage()
      ]);
      
      setSubscription(subscriptionData);
      setPlans(plansData);
      setUsage(usageData);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching subscription data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  const changePlan = async (planId) => {
    if (!subscription) return { success: false, error: 'No subscription found' };
    
    try {
      const result = await subscriptionService.updateSubscription(subscription.id, planId);
      await fetchSubscriptionData(); // Refresh data
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const cancelSubscription = async (reason = '') => {
    if (!subscription) return { success: false, error: 'No subscription found' };
    
    try {
      const result = await subscriptionService.cancelSubscription(subscription.id, reason);
      await fetchSubscriptionData(); // Refresh data
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const checkLimits = async () => {
    try {
      const limits = await subscriptionService.checkLimits();
      return { success: true, data: limits };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return {
    subscription,
    plans,
    usage,
    loading,
    error,
    changePlan,
    cancelSubscription,
    checkLimits,
    refresh: fetchSubscriptionData
  };
};

export const usePaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching payment methods:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  const addPaymentMethod = async (methodData) => {
    try {
      const result = await paymentService.addPaymentMethod(methodData);
      await fetchPaymentMethods(); // Refresh data
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const removePaymentMethod = async (methodId) => {
    try {
      await paymentService.removePaymentMethod(methodId);
      await fetchPaymentMethods(); // Refresh data
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const setDefaultMethod = async (methodId) => {
    try {
      await paymentService.setDefaultPaymentMethod(methodId);
      await fetchPaymentMethods(); // Refresh data
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return {
    paymentMethods,
    loading,
    error,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultMethod,
    refresh: fetchPaymentMethods
  };
};

export const useBilling = () => {
  const [invoices, setInvoices] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBillingData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [invoicesData, paymentsData, summaryData] = await Promise.all([
        billingService.getInvoices({ limit: 10 }),
        billingService.getPaymentHistory({ limit: 10 }),
        billingService.getBillingSummary()
      ]);
      
      setInvoices(invoicesData);
      setPaymentHistory(paymentsData);
      setSummary(summaryData);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching billing data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  const downloadInvoice = async (invoiceId) => {
    try {
      const blob = await billingService.downloadInvoice(invoiceId);
      
      // Crear URL para descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `factura-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const retryPayment = async (paymentId) => {
    try {
      const result = await billingService.retryPayment(paymentId);
      await fetchBillingData(); // Refresh data
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return {
    invoices,
    paymentHistory,
    summary,
    loading,
    error,
    downloadInvoice,
    retryPayment,
    refresh: fetchBillingData
  };
};

// Hook especializado para límites
export const useSubscriptionLimits = () => {
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkLimits = useCallback(async () => {
    try {
      setLoading(true);
      const limitsData = await subscriptionService.checkLimits();
      setLimits(limitsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkLimits();
  }, [checkLimits]);

  const isLimitReached = (type) => {
    if (!limits) return false;
    
    switch (type) {
      case 'conversations':
        return limits.current_conversations >= limits.max_conversations;
      case 'appointments':
        return limits.current_appointments >= limits.max_appointments;
      case 'users':
        return limits.current_users >= limits.max_users;
      default:
        return false;
    }
  };

  const getLimitPercentage = (type) => {
    if (!limits) return 0;
    
    switch (type) {
      case 'conversations':
        if (limits.max_conversations === 'unlimited') return 0;
        return (limits.current_conversations / limits.max_conversations) * 100;
      case 'appointments':
        if (limits.max_appointments === 'unlimited') return 0;
        return (limits.current_appointments / limits.max_appointments) * 100;
      case 'users':
        if (limits.max_users === 'unlimited') return 0;
        return (limits.current_users / limits.max_users) * 100;
      default:
        return 0;
    }
  };

  return {
    limits,
    loading,
    error,
    isLimitReached,
    getLimitPercentage,
    refresh: checkLimits
  };
};

// Hook para verificar si el usuario puede realizar una acción
export const useCanPerformAction = () => {
  const { limits, isLimitReached } = useSubscriptionLimits();

  const canCreateConversation = () => !isLimitReached('conversations');
  const canCreateAppointment = () => !isLimitReached('appointments');
  const canAddUser = () => !isLimitReached('users');

  const getUpgradeMessage = (action) => {
    const messages = {
      conversation: 'Has alcanzado el límite de conversaciones de tu plan. Actualiza para continuar.',
      appointment: 'Has alcanzado el límite de citas de tu plan. Actualiza para continuar.',
      user: 'Has alcanzado el límite de usuarios de tu plan. Actualiza para continuar.'
    };
    return messages[action] || 'Has alcanzado un límite de tu plan. Considera actualizar.';
  };

  return {
    canCreateConversation,
    canCreateAppointment,
    canAddUser,
    getUpgradeMessage,
    limits
  };
};

// Utilidades para formateo
export const formatCurrency = (amount, currency = 'COP') => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0
  }).format(amount);
};

export const formatSubscriptionStatus = (status) => {
  const statusMap = {
    'active': { label: 'Activa', color: 'green' },
    'canceled': { label: 'Cancelada', color: 'red' },
    'past_due': { label: 'Vencida', color: 'yellow' },
    'unpaid': { label: 'Sin pagar', color: 'red' },
    'incomplete': { label: 'Incompleta', color: 'yellow' },
    'trialing': { label: 'Prueba', color: 'blue' }
  };
  
  return statusMap[status] || { label: status, color: 'gray' };
};

export const formatPaymentStatus = (status) => {
  const statusMap = {
    'paid': { label: 'Pagado', color: 'green' },
    'pending': { label: 'Pendiente', color: 'yellow' },
    'failed': { label: 'Fallido', color: 'red' },
    'refunded': { label: 'Reembolsado', color: 'blue' },
    'canceled': { label: 'Cancelado', color: 'gray' }
  };
  
  return statusMap[status] || { label: status, color: 'gray' };
};

// Constantes
export const SUBSCRIPTION_PLANS = {
  BASIC: 'basic',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise'
};

export const PAYMENT_METHODS = {
  CARD: 'card',
  PAYPAL: 'paypal',
  NEQUI: 'nequi',
  BANK_TRANSFER: 'bank_transfer'
};

// Validaciones
export const validatePaymentMethod = (method) => {
  const errors = [];
  
  if (method.type === 'card') {
    if (!method.card?.number || method.card.number.length < 16) {
      errors.push('Número de tarjeta inválido');
    }
    if (!method.card?.expMonth || method.card.expMonth < 1 || method.card.expMonth > 12) {
      errors.push('Mes de expiración inválido');
    }
    if (!method.card?.expYear || method.card.expYear < new Date().getFullYear()) {
      errors.push('Año de expiración inválido');
    }
    if (!method.card?.cvc || method.card.cvc.length < 3) {
      errors.push('Código CVC inválido');
    }
  }
  
  if (method.type === 'nequi') {
    if (!method.nequi?.phone || method.nequi.phone.length < 10) {
      errors.push('Número de teléfono inválido');
    }
  }
  
  return errors;
};

// Export por defecto para compatibilidad
const subscriptions = {
  subscriptionService,
  paymentService,
  billingService,
  useSubscription,
  usePaymentMethods,
  useBilling,
  useSubscriptionLimits,
  useCanPerformAction,
  formatCurrency,
  formatSubscriptionStatus,
  formatPaymentStatus,
  validatePaymentMethod,
  SUBSCRIPTION_PLANS,
  PAYMENT_METHODS
};

export default subscriptions;