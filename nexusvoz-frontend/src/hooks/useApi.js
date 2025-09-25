// src/hooks/useApi.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiCall, handleApiError } from '../services/api';

export const useApi = (endpoint, method = 'GET', data = null, dependencies = []) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  // Convertir data a string para comparación estable
  const dataString = useMemo(() => {
    return data ? JSON.stringify(data) : null;
  }, [data]);

  // Memoizar las dependencias para evitar recreaciones innecesarias
  const memoizedDependencies = useMemo(() => dependencies, [dependencies.join(',')]);

  // Crear función fetchData con useCallback para evitar recreaciones innecesarias
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall(endpoint, method, data);
      setResponse(result);
    } catch (err) {
      // Usar handleApiError si está disponible, sino usar err.message
      const errorMessage = handleApiError ? handleApiError(err) : err.message;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [endpoint, method, dataString]); // Usar dataString para evitar warning

  useEffect(() => {
    fetchData();
  }, [fetchData, ...memoizedDependencies]); // Usar dependencias memoizadas

  const refetch = useCallback(async (newData = null) => {
    try {
      setLoading(true);
      setError(null);
      // Usar newData si se proporciona, sino usar data original
      const dataToUse = newData !== null ? newData : data;
      const result = await apiCall(endpoint, method, dataToUse);
      setResponse(result);
      return result;
    } catch (err) {
      const errorMessage = handleApiError ? handleApiError(err) : err.message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [endpoint, method, dataString]); // Usar dataString para evitar warning

  // Función para limpiar el estado
  const reset = useCallback(() => {
    setResponse(null);
    setError(null);
    setLoading(false);
  }, []);

  // Función para actualizar solo los datos sin hacer nueva llamada
  const updateData = useCallback((newData) => {
    setResponse(newData);
  }, []);

  return { 
    data: response, 
    loading, 
    error, 
    refetch,
    reset,
    updateData
  };
};

export const useAsyncOperation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (operation) => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      return result;
    } catch (err) {
      const errorMessage = handleApiError ? handleApiError(err) : err.message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return { loading, error, execute, reset };
};

// Hook especializado para usar con tus servicios específicos
export const useConversations = (params = {}) => {
  // Pasar params como data para que tu api.js los maneje como query parameters
  return useApi('/api/v1/conversations', 'GET', params, [JSON.stringify(params)]);
};

export const useAppointments = (params = {}) => {
  return useApi('/api/v1/appointments', 'GET', params, [JSON.stringify(params)]);
};

export const useLeads = (params = {}) => {
  return useApi('/api/v1/leads', 'GET', params, [JSON.stringify(params)]);
};

export const useDashboardStats = (params = {}) => {
  return useApi('/api/v1/dashboard/stats', 'GET', params, [JSON.stringify(params)]);
};

// Hooks especializados para operaciones específicas usando tus servicios
export const useConversationDetails = (callId, options = {}) => {
  return useApi(`/api/v1/conversations/${callId}`, 'GET', options, [callId, JSON.stringify(options)]);
};

export const useAppointmentDetails = (appointmentId) => {
  return useApi(`/api/v1/appointments/${appointmentId}`, 'GET', null, [appointmentId]);
};

export const useConversationAnalysis = (callId) => {
  return useApi(`/api/v1/conversations/${callId}/analysis`, 'GET', null, [callId]);
};
