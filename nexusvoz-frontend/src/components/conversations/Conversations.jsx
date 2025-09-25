// src/components/conversations/Conversations.jsx
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Eye, Download, Mail, Clock, 
  Activity, X, MessageSquare, User, Bot, Play,
  Pause, ChevronLeft, ChevronRight
} from 'lucide-react';
import { conversationService } from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { 
  formatDateTime, formatDuration, formatTimeAgo, 
  truncateText, formatId 
} from '../../utils/formatters';
import { useAsyncOperation } from '../../hooks/useApi';

const ConversationModal = ({ conversation, isOpen, onClose }) => {
  if (!conversation) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalles de Conversación" size="xl">
      <div className="p-6 space-y-6">
        {/* Información básica */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="font-medium text-gray-700">Call ID</label>
              <p className="text-gray-900">{conversation.call_id}</p>
            </div>
            <div>
              <label className="font-medium text-gray-700">Estado</label>
              <div className="mt-1">
                <StatusBadge status={conversation.status} />
              </div>
            </div>
            <div>
              <label className="font-medium text-gray-700">Duración</label>
              <p className="text-gray-900">{formatDuration(conversation.duration_seconds)}</p>
            </div>
            <div>
              <label className="font-medium text-gray-700">Inicio</label>
              <p className="text-gray-900">{formatDateTime(conversation.started_at)}</p>
            </div>
            <div>
              <label className="font-medium text-gray-700">Cliente</label>
              <p className="text-gray-900">{conversation.client_email || 'No identificado'}</p>
            </div>
            <div>
              <label className="font-medium text-gray-700">Teléfono</label>
              <p className="text-gray-900">{conversation.phone_number || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Intención detectada */}
        {conversation.intent_detected && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Intención Detectada</h4>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
              {conversation.intent_detected}
            </span>
          </div>
        )}

        {/* Mensajes */}
        {conversation.messages && conversation.messages.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Conversación ({conversation.messages.length} mensajes)</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {conversation.messages.map((message, index) => (
                <div key={index} className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}>
                  <div className={`flex items-start gap-3 max-w-3xl ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {message.role === 'user' ? 
                        <User className="w-4 h-4 text-blue-600" /> : 
                        <Bot className="w-4 h-4 text-gray-600" />
                      }
                    </div>
                    <div className={`rounded-lg p-3 ${
                      message.role === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-75">
                          {message.role === 'user' ? 'Cliente' : 'Asistente'}
                        </span>
                        <span className="text-xs opacity-75">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Herramientas ejecutadas */}
        {conversation.tool_executions && conversation.tool_executions.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Herramientas Ejecutadas</h4>
            <div className="space-y-3">
              {conversation.tool_executions.map((tool, index) => (
                <div key={index} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-purple-800">{tool.tool_name}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(tool.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {tool.arguments && (
                    <div className="mb-2">
                      <label className="text-xs font-medium text-gray-600">Argumentos:</label>
                      <pre className="text-xs bg-white p-2 rounded border mt-1 overflow-x-auto">
                        {JSON.stringify(tool.arguments, null, 2)}
                      </pre>
                    </div>
                  )}
                  {tool.result && (
                    <div>
                      <label className="text-xs font-medium text-gray-600">Resultado:</label>
                      <pre className="text-xs bg-white p-2 rounded border mt-1 overflow-x-auto">
                        {JSON.stringify(tool.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

const Conversations = () => {
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    intent: '',
    dateFrom: '',
    dateTo: ''
  });

  const { loading: fetching, execute } = useAsyncOperation();

  useEffect(() => {
    fetchConversations();
  }, [currentPage]);

  useEffect(() => {
    applyFilters();
  }, [conversations, filters]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const params = {
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage
      };
      const data = await conversationService.getConversations(params);
      setConversations(Array.isArray(data) ? data : []);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...conversations];

    if (filters.search) {
      filtered = filtered.filter(conv => 
        conv.call_id?.toLowerCase().includes(filters.search.toLowerCase()) ||
        conv.client_email?.toLowerCase().includes(filters.search.toLowerCase()) ||
        conv.phone_number?.includes(filters.search)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(conv => conv.status === filters.status);
    }

    if (filters.intent) {
      filtered = filtered.filter(conv => conv.intent_detected === filters.intent);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(conv => 
        new Date(conv.started_at) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(conv => 
        new Date(conv.started_at) <= new Date(filters.dateTo)
      );
    }

    setFilteredConversations(filtered);
  };

  const viewDetails = async (callId) => {
    try {
      const data = await execute(() => 
        conversationService.getConversation(callId, {
          include_messages: true,
          include_tools: true
        })
      );
      setSelectedConversation(data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching conversation details:', error);
    }
  };

  const exportConversations = () => {
    const csvData = filteredConversations.map(conv => ({
      call_id: conv.call_id,
      status: conv.status,
      client_email: conv.client_email || '',
      phone_number: conv.phone_number || '',
      started_at: conv.started_at,
      duration_seconds: conv.duration_seconds || 0,
      intent_detected: conv.intent_detected || ''
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversaciones_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      intent: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Cargando conversaciones..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Conversaciones</h2>
          <p className="text-gray-600">
            {filteredConversations.length} de {conversations.length} conversaciones
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportConversations}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button
            onClick={() => execute(fetchConversations)}
            disabled={fetching}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Activity className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por ID, email o teléfono..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activa</option>
            <option value="completed">Completada</option>
            <option value="failed">Fallida</option>
          </select>

          <select
            value={filters.intent}
            onChange={(e) => setFilters({...filters, intent: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las intenciones</option>
            <option value="pricing_inquiry">Consulta de precios</option>
            <option value="appointment_request">Solicitud de cita</option>
            <option value="support_request">Solicitud de soporte</option>
          </select>

          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {(filters.search || filters.status || filters.intent || filters.dateFrom || filters.dateTo) && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              Filtros activos: {Object.values(filters).filter(Boolean).length}
            </span>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Lista de conversaciones */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Lista de Conversaciones
          </h3>
        </div>

        {filteredConversations.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredConversations.map((conversation) => (
              <div key={conversation.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono font-medium text-gray-900">
                        {formatId(conversation.call_id, 12)}
                      </span>
                      <StatusBadge status={conversation.status} />
                      {conversation.intent_detected && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                          {conversation.intent_detected.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatTimeAgo(conversation.started_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        <span>Duración: {formatDuration(conversation.duration_seconds)}</span>
                      </div>
                      {conversation.client_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{conversation.client_email}</span>
                        </div>
                      )}
                      {conversation.phone_number && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">#</span>
                          <span>{conversation.phone_number}</span>
                        </div>
                      )}
                    </div>

                    {conversation.client_name && (
                      <div className="mt-2">
                        <span className="text-sm text-gray-800 font-medium">
                          Cliente: {conversation.client_name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => viewDetails(conversation.call_id)}
                      disabled={fetching}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Descargar"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay conversaciones</h3>
            <p className="text-gray-600">
              {conversations.length === 0 
                ? "Aún no se han registrado conversaciones en el sistema."
                : "No se encontraron conversaciones que coincidan con los filtros aplicados."
              }
            </p>
            {Object.values(filters).some(Boolean) && (
              <button
                onClick={clearFilters}
                className="mt-4 text-blue-600 hover:text-blue-800 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {/* Paginación */}
        {filteredConversations.length > 0 && totalPages > 1 && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 text-sm font-medium">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      <ConversationModal 
        conversation={selectedConversation}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedConversation(null);
        }}
      />
    </div>
  );
};

export default Conversations;


