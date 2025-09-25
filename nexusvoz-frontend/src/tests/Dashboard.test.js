import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Dashboard from '../pages/Dashboard';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../components/ToastNotifications';

// Mock de los hooks y servicios
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { name: 'Test User', role: 'admin' },
    isAuthenticated: true
  })
}));

jest.mock('../services/api', () => ({
  getDashboardStats: jest.fn(() => Promise.resolve({
    conversations: 156,
    appointments: 23,
    leads: 89,
    conversionRate: 0.15
  })),
  getRecentActivity: jest.fn(() => Promise.resolve([
    {
      id: 1,
      type: 'conversation',
      message: 'Nueva conversación con Juan Pérez',
      timestamp: '2024-09-08T10:30:00Z'
    }
  ]))
}));

// Wrapper de testing con providers
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dashboard with loading state', () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('displays stats cards after loading', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('156')).toBeInTheDocument();
      expect(screen.getByText('Conversaciones')).toBeInTheDocument();
      expect(screen.getByText('23')).toBeInTheDocument();
      expect(screen.getByText('Citas')).toBeInTheDocument();
    });
  });

  test('handles stat card clicks', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      const conversationsCard = screen.getByText('Conversaciones').closest('div');
      fireEvent.click(conversationsCard);
    });

    // Verificar que se navega a la página correcta
    expect(window.location.pathname).toBe('/conversations');
  });

  test('displays recent activity', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Actividad Reciente')).toBeInTheDocument();
      expect(screen.getByText('Nueva conversación con Juan Pérez')).toBeInTheDocument();
    });
  });
});