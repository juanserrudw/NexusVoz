import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext'; 
import { ToastProvider } from '../components/ToastNotifications'; 

// Custom render function con todos los providers
export const renderWithProviders = (ui, options = {}) => {
  const {
    initialEntries = ['/'],
    user = { name: 'Test User', role: 'admin' },
    ...renderOptions
  } = options;

  const Wrapper = ({ children }) => (
    <BrowserRouter initialEntries={initialEntries}>
      <AuthProvider value={{ user, isAuthenticated: true }}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mocks comunes para tests
export const mockApiResponse = (data, delay = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

export const mockApiError = (error = 'API Error', delay = 100) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(error)), delay);
  });
};

// Datos mock para testing
export const mockData = {
  conversations: [
    {
      id: '1',
      customerName: 'Juan Pérez',
      phone: '+57 300 123 4567',
      lastMessage: 'Hola, necesito información sobre sus servicios',
      timestamp: '2024-09-08T10:30:00Z',
      status: 'active',
      messageCount: 5,
      intent: 'información'
    },
    {
      id: '2',
      customerName: 'María García',
      phone: '+57 310 456 7890',
      lastMessage: 'Gracias por la información',
      timestamp: '2024-09-08T09:15:00Z',
      status: 'completed',
      messageCount: 3,
      intent: 'agradecimiento'
    }
  ],

  appointments: [
    {
      id: '1',
      customerName: 'Ana López',
      phone: '+57 320 789 0123',
      email: 'ana@email.com',
      service: 'Consulta General',
      date: '2024-09-10',
      time: '14:00',
      status: 'confirmed',
      notes: 'Primera visita',
      confirmationCode: 'APT001'
    }
  ],

  leads: [
    {
      id: '1',
      customerName: 'Carlos Rodríguez',
      phone: '+57 300 111 2222',
      email: 'carlos@email.com',
      source: 'whatsapp',
      interestLevel: 4,
      potentialValue: 500000,
      status: 'qualified',
      tags: ['interesado', 'seguimiento'],
      lastContact: '2024-09-08T15:30:00Z',
      notes: 'Muy interesado en el servicio premium'
    }
  ],

  stats: {
    conversations: 156,
    appointments: 23,
    leads: 89,
    conversionRate: 0.15,
    responseTime: 120,
    customerSatisfaction: 0.95
  }
};