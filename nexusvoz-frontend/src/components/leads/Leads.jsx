// src/components/leads/Leads.jsx
import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Eye, Edit, Star, 
  Phone, Mail, Calendar, MessageSquare, 
  TrendingUp, Target, DollarSign, Clock,
  RefreshCw, Download, Plus, MoreHorizontal,
  AlertTriangle, CheckCircle, XCircle, Building,
  CalendarPlus, User, FileText, Trash2
} from 'lucide-react';
import { leadService } from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { StatusBadge } from '../common/StatusBadge';
import { Modal, ConfirmModal } from '../common/Modal';
import { formatDate, formatTimeAgo } from '../../utils/formatters';
import { useAsyncOperation } from '../../hooks/useApi';

const LeadModal = ({ lead, isOpen, onClose, onSave, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    interest_level: 'medium',
    interested_plans: '',
    budget_mentioned: '',
    timeline: '',
    tags: '',
    notes: '',
    conversation_id: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (lead && mode === 'edit') {
      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        interest_level: lead.interest_level || 'medium',
        interested_plans: Array.isArray(lead.interested_plans) 
          ? lead.interested_plans.join(', ') 
          : lead.interested_plans || '',
        budget_mentioned: lead.budget_mentioned || '',
        timeline: lead.timeline || '',
        tags: Array.isArray(lead.tags) 
          ? lead.tags.join(', ') 
          : lead.tags || '',
        notes: lead.notes || '',
        conversation_id: lead.conversation_id || ''
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        interest_level: 'medium',
        interested_plans: '',
        budget_mentioned: '',
        timeline: '',
        tags: '',
        notes: '',
        conversation_id: ''
      });
    }
    setError(''); // Limpiar errores al abrir/cambiar modo
  }, [lead, mode, isOpen]);

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return false;
    }
    if (!formData.email.trim()) {
      setError('El email es requerido');
      return false;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('El formato del email no es válido');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const submitData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        company: formData.company.trim() || null,
        interest_level: formData.interest_level,
        interested_plans: formData.interested_plans 
          ? formData.interested_plans.split(',').map(p => p.trim()).filter(Boolean)
          : [],
        budget_mentioned: formData.budget_mentioned.trim() || null,
        timeline: formData.timeline.trim() || null,
        tags: formData.tags 
          ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
          : [],
        notes: formData.notes.trim() || null
      };

      // Solo incluir conversation_id si tiene valor
      if (formData.conversation_id && !isNaN(formData.conversation_id)) {
        submitData.conversation_id = parseInt(formData.conversation_id);
      }
      
      if (mode === 'create') {
        console.log('Creating lead with data:', submitData);
        const result = await leadService.createLead(submitData);
        console.log('Lead created successfully:', result);
      } else {
        console.log('Updating lead with data:', submitData);
        const result = await leadService.updateLead(lead.id, submitData);
        console.log('Lead updated successfully:', result);
      }
      
      onSave();
      onClose();
      
    } catch (error) {
      console.error('Error saving lead:', error);
      
      // Manejar diferentes tipos de errores
      let errorMessage = 'Error al guardar el lead. Intenta nuevamente.';
      
      if (error.status === 422 && error.data?.detail) {
        // Error de validación - extraer mensajes
        if (Array.isArray(error.data.detail)) {
          const validationErrors = error.data.detail.map(err => err.msg).join(', ');
          errorMessage = `Error de validación: ${validationErrors}`;
        } else {
          errorMessage = `Error de validación: ${error.data.detail}`;
        }
      } else if (error.status === 401) {
        errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      } else if (error.status === 404) {
        errorMessage = 'Endpoint no encontrado. Verifica la configuración de la API.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Limpiar error cuando el usuario empiece a escribir
    if (error) {
      setError('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={
      mode === 'create' ? 'Nuevo Lead' : 'Editar Lead'
    }>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Mostrar errores */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nivel de Interés
            </label>
            <select
              name="interest_level"
              value={formData.interest_level}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Bajo</option>
              <option value="medium">Medio</option>
              <option value="high">Alto</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="email@ejemplo.com"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+57 300 123 4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Empresa
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre de la empresa"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Presupuesto
            </label>
            <input
              type="text"
              name="budget_mentioned"
              value={formData.budget_mentioned}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="$500.000 - $1.000.000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timeline
            </label>
            <input
              type="text"
              name="timeline"
              value={formData.timeline}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="En 1 mes, Urgente..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Planes de Interés
            </label>
            <input
              type="text"
              name="interested_plans"
              value={formData.interested_plans}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Plan básico, Plan premium"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID Conversación
            </label>
            <input
              type="number"
              name="conversation_id"
              value={formData.conversation_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123456"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Etiquetas
          </label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="empresa, tecnología, prioritario"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Información adicional sobre el lead..."
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving && <LoadingSpinner size="sm" showText={false} />}
            {mode === 'create' ? 'Crear Lead' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedLead, setSelectedLead] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    interest_level: '',
    status: '',
    source: ''
  });

  const { loading: operating, execute } = useAsyncOperation();

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [leads, filters]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching leads...');
      const data = await leadService.getLeads();
      console.log('Leads fetched:', data);
      
      setLeads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      
      // Manejar errores de forma segura
      let errorMessage = 'Error al cargar los leads. Intenta nuevamente.';
      
      if (error.status === 401) {
        errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      } else if (error.status === 404) {
        errorMessage = 'Endpoint no encontrado. Verifica la configuración de la API.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...leads];

    // Filtrar por búsqueda de texto
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(lead => 
        lead.name?.toLowerCase().includes(searchLower) ||
        lead.email?.toLowerCase().includes(searchLower) ||
        lead.company?.toLowerCase().includes(searchLower) ||
        lead.phone?.toLowerCase().includes(searchLower)
      );
    }

    // Filtrar por nivel de interés
    if (filters.interest_level) {
      filtered = filtered.filter(lead => lead.interest_level === filters.interest_level);
    }

    // Filtrar por estado
    if (filters.status) {
      filtered = filtered.filter(lead => lead.status === filters.status);
    }

    // Filtrar por fuente
    if (filters.source) {
      filtered = filtered.filter(lead => lead.source === filters.source);
    }

    setFilteredLeads(filtered);
  };

  const handleCreateLead = () => {
    setModalMode('create');
    setSelectedLead(null);
    setShowModal(true);
  };

  const handleEditLead = (lead) => {
    setModalMode('edit');
    setSelectedLead(lead);
    setShowModal(true);
  };

  const handleDeleteLead = (lead) => {
    setSelectedLead(lead);
    setShowDeleteModal(true);
  };

  const confirmDeleteLead = async () => {
    if (!selectedLead) return;

    try {
      console.log('Deleting lead:', selectedLead.id);
      await leadService.deleteLead(selectedLead.id);
      
      // Remover de la lista local
      setLeads(prev => prev.filter(lead => lead.id !== selectedLead.id));
      
      setShowDeleteModal(false);
      setSelectedLead(null);
    } catch (error) {
      console.error('Error deleting lead:', error);
      
      // Mostrar error de forma segura
      let errorMessage = 'Error al eliminar el lead.';
      if (error.message) {
        errorMessage = error.message;
      }
      alert(errorMessage);
    }
  };

  const getInterestLevelColor = (level) => {
    const colors = {
      low: 'text-gray-700 bg-gray-50 border-gray-200',
      medium: 'text-yellow-700 bg-yellow-50 border-yellow-200',
      high: 'text-red-700 bg-red-50 border-red-200'
    };
    return colors[level] || colors.medium;
  };

  const getInterestStars = (level) => {
    const stars = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
    return Array.from({ length: 3 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < stars ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      interest_level: '',
      status: '',
      source: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Cargando leads..." />
      </div>
    );
  }

  if (error && leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar los leads</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchLeads}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Leads</h2>
          <p className="text-gray-600">
            {filteredLeads.length} de {leads.length} leads
          </p>
        </div>
        <button
          onClick={handleCreateLead}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Lead
        </button>
      </div>

      {/* Resumen de estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', count: leads.length, icon: Users },
          { label: 'Alto Interés', count: leads.filter(l => l.interest_level === 'high').length, icon: Star },
          { label: 'Con Empresa', count: leads.filter(l => l.company).length, icon: Building },
          { label: 'Con Conversación', count: leads.filter(l => l.conversation_id).length, icon: MessageSquare }
        ].map((item, index) => {
          const IconComponent = item.icon;
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="flex justify-center mb-2">
                <IconComponent className="w-6 h-6 text-gray-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{item.count}</div>
              <div className="text-sm text-gray-600">{item.label}</div>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o empresa..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filters.interest_level}
            onChange={(e) => setFilters({...filters, interest_level: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los niveles</option>
            <option value="high">Alto interés</option>
            <option value="medium">Interés medio</option>
            <option value="low">Bajo interés</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="new">Nuevo</option>
            <option value="contacted">Contactado</option>
            <option value="qualified">Calificado</option>
            <option value="converted">Convertido</option>
            <option value="lost">Perdido</option>
          </select>

          <select
            value={filters.source}
            onChange={(e) => setFilters({...filters, source: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las fuentes</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="website">Sitio Web</option>
            <option value="social_media">Redes Sociales</option>
            <option value="referral">Referido</option>
            <option value="other">Otro</option>
          </select>
        </div>

        {Object.values(filters).some(Boolean) && (
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

      {/* Lista de leads */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {filteredLeads.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="font-semibold text-gray-900">{lead.name}</h4>
                      {lead.status && <StatusBadge status={lead.status} />}
                      <div className="flex items-center space-x-0.5">
                        {getInterestStars(lead.interest_level)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                      
                      {lead.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                      
                      {lead.company && (
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          <span>{lead.company}</span>
                        </div>
                      )}
                      
                      {lead.created_at && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatTimeAgo(lead.created_at)}</span>
                        </div>
                      )}
                    </div>

                    {(lead.budget_mentioned || lead.timeline) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                        {lead.budget_mentioned && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            <span>{lead.budget_mentioned}</span>
                          </div>
                        )}
                        {lead.timeline && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{lead.timeline}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {lead.tags && lead.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {lead.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {lead.tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{lead.tags.length - 3} más
                          </span>
                        )}
                      </div>
                    )}

                    {lead.notes && (
                      <div className="mb-3">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded flex-1">
                            {lead.notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEditLead(lead)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteLead(lead)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay leads</h3>
            <p className="text-gray-600 mb-4">
              {leads.length === 0 
                ? "Aún no se han creado leads en el sistema."
                : "No se encontraron leads que coincidan con los filtros aplicados."
              }
            </p>
            <div className="flex justify-center gap-3">
              {leads.length === 0 ? (
                <button
                  onClick={handleCreateLead}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Crear Primer Lead
                </button>
              ) : (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de crear/editar lead */}
      <LeadModal
        lead={selectedLead}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedLead(null);
        }}
        onSave={fetchLeads}
        mode={modalMode}
      />

      {/* Modal de confirmación de eliminación */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedLead(null);
        }}
        onConfirm={confirmDeleteLead}
        title="Eliminar Lead"
        message={`¿Estás seguro de que quieres eliminar el lead de ${selectedLead?.name}?`}
        confirmText="Eliminar"
        type="danger"
      />
    </div>
  );
};

export default Leads;



