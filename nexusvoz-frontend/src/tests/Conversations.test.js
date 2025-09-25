import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Conversations from '../pages/Conversations';
import { renderWithProviders, mockApiResponse, mockData } from '../utils/testUtils';

jest.mock('../services/api', () => ({
  getConversations: jest.fn(),
  getConversationDetails: jest.fn()
}));

describe('Conversations Component', () => {
  const mockGetConversations = require('../services/api').getConversations;
  const mockGetConversationDetails = require('../services/api').getConversationDetails;

  beforeEach(() => {
    mockGetConversations.mockResolvedValue(mockData.conversations);
    mockGetConversationDetails.mockResolvedValue({
      id: '1',
      messages: [
        { id: '1', text: 'Hola', sender: 'customer', timestamp: '2024-09-08T10:30:00Z' },
        { id: '2', text: '¡Hola! ¿En qué puedo ayudarte?', sender: 'bot', timestamp: '2024-09-08T10:31:00Z' }
      ]
    });
  });

  test('renders conversations list', async () => {
    renderWithProviders(<Conversations />);

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('María García')).toBeInTheDocument();
    });
  });

  test('filters conversations by status', async () => {
    renderWithProviders(<Conversations />);

    await waitFor(() => {
      const activeFilter = screen.getByText('Activas');
      fireEvent.click(activeFilter);
    });

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.queryByText('María García')).not.toBeInTheDocument();
    });
  });

  test('opens conversation details modal', async () => {
    renderWithProviders(<Conversations />);

    await waitFor(() => {
      const conversationItem = screen.getByText('Juan Pérez').closest('div');
      fireEvent.click(conversationItem);
    });

    await waitFor(() => {
      expect(screen.getByText('Detalles de la Conversación')).toBeInTheDocument();
      expect(screen.getByText('Hola')).toBeInTheDocument();
    });
  });

  test('searches conversations', async () => {
    renderWithProviders(<Conversations />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/buscar conversaciones/i);
      fireEvent.change(searchInput, { target: { value: 'Juan' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.queryByText('María García')).not.toBeInTheDocument();
    });
  });
});