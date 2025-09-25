
import { useState, useCallback, useEffect } from 'react';
import { storage } from '../utils/formatters';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Cargar notificaciones del localStorage al inicializar
  useEffect(() => {
    const savedNotifications = storage.get('notifications', []);
    setNotifications(savedNotifications);
    updateUnreadCount(savedNotifications);
  }, []);

  // Actualizar localStorage cuando cambien las notificaciones
  useEffect(() => {
    storage.set('notifications', notifications);
    updateUnreadCount(notifications);
  }, [notifications]);

  const updateUnreadCount = (notificationList) => {
    const unread = notificationList.filter(n => !n.read).length;
    setUnreadCount(unread);
  };

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
      type: 'info', // info, success, warning, error
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Mostrar notificación del navegador si está permitido
    if (Notification.permission === 'granted') {
      new Notification(notification.title || 'Nueva notificación', {
        body: notification.message,
        icon: '/favicon.ico'
      });
    }

    return newNotification.id;
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Solicitar permisos de notificación
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  // Notificaciones específicas del negocio
  const notifyNewConversation = useCallback((conversationData) => {
    return addNotification({
      type: 'info',
      title: 'Nueva conversación',
      message: `Nueva conversación con ${conversationData.customerName}`,
      data: conversationData,
      action: {
        label: 'Ver conversación',
        url: `/conversations/${conversationData.id}`
      }
    });
  }, [addNotification]);

  const notifyNewAppointment = useCallback((appointmentData) => {
    return addNotification({
      type: 'success',
      title: 'Nueva cita agendada',
      message: `Cita programada para ${appointmentData.date} con ${appointmentData.customerName}`,
      data: appointmentData,
      action: {
        label: 'Ver cita',
        url: `/appointments/${appointmentData.id}`
      }
    });
  }, [addNotification]);

  const notifyNewLead = useCallback((leadData) => {
    return addNotification({
      type: 'success',
      title: 'Nuevo lead generado',
      message: `Lead calificado: ${leadData.customerName} - Interés: ${leadData.interestLevel}`,
      data: leadData,
      action: {
        label: 'Ver lead',
        url: `/leads/${leadData.id}`
      }
    });
  }, [addNotification]);

  const notifyMissedMessage = useCallback((messageData) => {
    return addNotification({
      type: 'warning',
      title: 'Mensaje sin respuesta',
      message: `Mensaje de ${messageData.customerName} sin responder desde hace ${messageData.timeAgo}`,
      data: messageData,
      action: {
        label: 'Responder',
        url: `/conversations/${messageData.conversationId}`
      }
    });
  }, [addNotification]);

  const notifyAppointmentReminder = useCallback((appointmentData) => {
    return addNotification({
      type: 'info',
      title: 'Recordatorio de cita',
      message: `Cita en 1 hora con ${appointmentData.customerName}`,
      data: appointmentData,
      action: {
        label: 'Ver cita',
        url: `/appointments/${appointmentData.id}`
      }
    });
  }, [addNotification]);

  const notifySystemAlert = useCallback((alertData) => {
    return addNotification({
      type: 'error',
      title: 'Alerta del sistema',
      message: alertData.message,
      data: alertData,
      persistent: true // No se auto-elimina
    });
  }, [addNotification]);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    requestNotificationPermission,
    // Notificaciones específicas
    notifyNewConversation,
    notifyNewAppointment,
    notifyNewLead,
    notifyMissedMessage,
    notifyAppointmentReminder,
    notifySystemAlert
  };
};

// Hook para toast notifications (notificaciones temporales)
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now().toString();
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      ...toast
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Métodos de conveniencia
  const showSuccess = useCallback((message, options = {}) => {
    return addToast({
      type: 'success',
      title: 'Éxito',
      message,
      ...options
    });
  }, [addToast]);

  const showError = useCallback((message, options = {}) => {
    return addToast({
      type: 'error',
      title: 'Error',
      message,
      duration: 8000, // Errores duran más tiempo
      ...options
    });
  }, [addToast]);

  const showWarning = useCallback((message, options = {}) => {
    return addToast({
      type: 'warning',
      title: 'Advertencia',
      message,
      ...options
    });
  }, [addToast]);

  const showInfo = useCallback((message, options = {}) => {
    return addToast({
      type: 'info',
      title: 'Información',
      message,
      ...options
    });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};