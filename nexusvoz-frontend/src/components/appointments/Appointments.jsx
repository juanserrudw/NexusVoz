// src/components/appointments/Appointments.jsx
import React, { useState, useEffect } from 'react';
import { 
  Calendar, Plus, Search, Filter, Edit, Trash2, 
  Mail, Phone, Clock, User, MapPin, FileText,
  CheckCircle, XCircle, AlertCircle, Eye
} from 'lucide-react';
import { appointmentService } from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { StatusBadge } from '../common/StatusBadge';
import { Modal, ConfirmModal } from '../common/Modal';
import { 
  formatDate, formatTime, formatTimeAgo, 
  formatAppointmentType, formatStatus 
} from '../../utils/formatters';
import { useAsyncOperation } from '../../hooks/useApi';

const AppointmentModal = ({ appointment, isOpen, onClose, onSave, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    appointment_type: 'ventas',
    client_name: '',
    client_email: '',
    client_phone: '',
    appointment_date: '',
    appointment_time: '',
    notes: '',
    status: 'scheduled'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (appointment && mode === 'edit') {
      setFormData({
        appointment_type: appointment.appointment_type || 'ventas',
        client_name: appointment.client_name || '',
        client_email: appointment.client_email || '',
        client_phone: appointment.client_phone || '',
        appointment_date: appointment.appointment_date || '',
        appointment_time: appointment.appointment_time || '',
        notes: appointment.notes || '',
        status: appointment.status || 'scheduled'
      });
    } else if (mode === 'create') {
      setFormData({
        appointment_type: 'ventas',
        client_name: '',
        client_email: '',
        client_phone: '',
        appointment_date: '',
        appointment_time: '',
        notes: '',
        status: 'scheduled'
      });
    }
    setError('');
  }, [appointment, mode, isOpen]);

  const validateForm = () => {
    if (!formData.client_name.trim()) {
      setError('El nombre del cliente es requerido');
      return false;
    }
    if (!formData.client_email.trim()) {
      setError('El email del cliente es requerido');
      return false;
    }
    if (!formData.appointment_date) {
      setError('La fecha es requerida');
      return false;
    }
    if (!formData.appointment_time) {
      setError('La hora es requerida');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.client_email)) {
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
      if (mode === 'create') {
        const appointmentData = {
          appointment_id: `APT-${Date.now()}`,
          appointment_type: formData.appointment_type,
          client_name: formData.client_name.trim(),
          client_email: formData.client_email.trim().toLowerCase(),
          client_phone: formData.client_phone.trim() || null,
          appointment_date: formData.appointment_date,
          appointment_time: formData.appointment_time,
          status: formData.status,
          source: 'manual',
          notes: formData.notes.trim() || null
        };
        
        console.log('Creating appointment with data:', appointmentData);
        const result = await appointmentService.createAppointment(appointmentData);
        console.log('Appointment created successfully:', result);
        
      } else {
        const updateData = {
          appointment_type: formData.appointment_type,
          client_name: formData.client_name.trim(),
          client_email: formData.client_email.trim().toLowerCase(),
          client_phone: formData.client_phone.trim() || null,
          appointment_date: formData.appointment_date,
          appointment_time: formData.appointment_time,
          status: formData.status,
          notes: formData.notes.trim() || null
        };
        
        console.log('Updating appointment with data:', updateData);
        const result = await appointmentService.updateAppointment(appointment.appointment_id, updateData);
        console.log('Appointment updated successfully:', result);
      }
      
      onSave();
      onClose();
      
    } catch (error) {
      console.error('Error saving appointment:', error);
      
      let errorMessage = 'Error al guardar la cita. Intenta nuevamente.';
      
      if (error.status === 422 && error.data?.detail) {
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
    
    if (error) {
      setError('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={
      mode === 'create' ? 'Nueva Cita' : 'Editar Cita'
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
              Tipo de Cita *
            </label>
            <select
              name="appointment_type"
              value={formData.appointment_type}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ventas">Ventas</option>
              <option value="soporte_tecnico">Soporte Técnico</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="scheduled">Programada</option>
              <option value="confirmed">Confirmada</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
              <option value="no_show">No se presentó</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Cliente *
          </label>
          <input
            type="text"
            name="client_name"
            value={formData.client_name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nombre completo del cliente"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="client_email"
              value={formData.client_email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="cliente@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              name="client_phone"
              value={formData.client_phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+57 300 123 4567"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha *
            </label>
            <input
              type="date"
              name="appointment_date"
              value={formData.appointment_date}
              onChange={handleChange}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hora *
            </label>
            <input
              type="time"
              name="appointment_time"
              value={formData.appointment_time}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
            placeholder="Información adicional sobre la cita..."
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
            {mode === 'create' ? 'Crear Cita' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    appointment_type: '',
    status: '',
    date_from: '',
    date_to: ''
  });

  const { loading: operating, execute } = useAsyncOperation();

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [appointments, filters]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        limit: 100,
        skip: 0
      };
      
      console.log('Fetching appointments with params:', params);
      const data = await appointmentService.getAppointments(params);
      console.log('Appointments fetched:', data);
      
      setAppointments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      
      let errorMessage = 'Error al cargar las citas. Intenta nuevamente.';
      
      if (error.status === 401) {
        errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      } else if (error.status === 404) {
        errorMessage = 'Endpoint no encontrado. Verifica la configuración de la API.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...appointments];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(apt => 
        apt.client_name?.toLowerCase().includes(searchLower) ||
        apt.client_email?.toLowerCase().includes(searchLower) ||
        apt.appointment_id?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.appointment_type) {
      filtered = filtered.filter(apt => apt.appointment_type === filters.appointment_type);
    }

    if (filters.status) {
      filtered = filtered.filter(apt => apt.status === filters.status);
    }

    if (filters.date_from) {
      filtered = filtered.filter(apt => 
        apt.appointment_date && new Date(apt.appointment_date) >= new Date(filters.date_from)
      );
    }

    if (filters.date_to) {
      filtered = filtered.filter(apt => 
        apt.appointment_date && new Date(apt.appointment_date) <= new Date(filters.date_to)
      );
    }

    setFilteredAppointments(filtered);
  };

  const handleCreateAppointment = () => {
    setModalMode('create');
    setSelectedAppointment(null);
    setShowModal(true);
  };

  const handleEditAppointment = (appointment) => {
    setModalMode('edit');
    setSelectedAppointment(appointment);
    setShowModal(true);
  };

  const handleDeleteAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDeleteModal(true);
  };

  const confirmDeleteAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      console.log('Deleting appointment:', selectedAppointment.appointment_id);
      await appointmentService.deleteAppointment(selectedAppointment.appointment_id);
      
      setAppointments(prev => 
        prev.filter(apt => apt.appointment_id !== selectedAppointment.appointment_id)
      );
      
      setShowDeleteModal(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      
      let errorMessage = 'Error al eliminar la cita.';
      if (error.message) {
        errorMessage = error.message;
      }
      alert(errorMessage);
    }
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      console.log(`Updating appointment ${appointmentId} status to ${newStatus}`);
      await execute(() => 
        appointmentService.updateAppointment(appointmentId, { status: newStatus })
      );
      await fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      
      let errorMessage = 'Error al actualizar el estado de la cita.';
      if (error.message) {
        errorMessage = error.message;
      }
      alert(errorMessage);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      scheduled: Clock,
      confirmed: CheckCircle,
      completed: CheckCircle,
      cancelled: XCircle,
      no_show: AlertCircle
    };
    return icons[status] || Clock;
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      appointment_type: '',
      status: '',
      date_from: '',
      date_to: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Cargando citas..." />
      </div>
    );
  }

  if (error && appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar las citas</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAppointments}
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
          <h2 className="text-2xl font-bold text-gray-900">Citas Agendadas</h2>
          <p className="text-gray-600">
            {filteredAppointments.length} de {appointments.length} citas
          </p>
        </div>
        <button
          onClick={handleCreateAppointment}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Cita
        </button>
      </div>

      {/* Resumen de tipos y estados */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { type: 'ventas', label: 'Ventas', count: appointments.filter(a => a.appointment_type === 'ventas').length },
          { type: 'soporte_tecnico', label: 'Soporte Técnico', count: appointments.filter(a => a.appointment_type === 'soporte_tecnico').length },
          { status: 'scheduled', label: 'Programadas', count: appointments.filter(a => a.status === 'scheduled').length },
          { status: 'confirmed', label: 'Confirmadas', count: appointments.filter(a => a.status === 'confirmed').length }
        ].map((item) => {
          const IconComponent = item.status ? getStatusIcon(item.status) : Calendar;
          return (
            <div key={item.type || item.status} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="flex justify-center mb-2">
                <IconComponent className="w-6 h-6 text-gray-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{item.count}</div>
              <div className="text-sm text-gray-600">{item.label}</div>
            </div>
          );
        })}
      </div>

      {/* Resumen adicional de estados */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { status: 'completed', label: 'Completadas', count: appointments.filter(a => a.status === 'completed').length },
          { status: 'cancelled', label: 'Canceladas', count: appointments.filter(a => a.status === 'cancelled').length },
          { status: 'no_show', label: 'No asistieron', count: appointments.filter(a => a.status === 'no_show').length }
        ].map((item) => {
          const IconComponent = getStatusIcon(item.status);
          return (
            <div key={item.status} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o ID..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filters.appointment_type}
            onChange={(e) => setFilters({...filters, appointment_type: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los tipos</option>
            <option value="ventas">Ventas</option>
            <option value="soporte_tecnico">Soporte Técnico</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="scheduled">Programada</option>
            <option value="confirmed">Confirmada</option>
            <option value="completed">Completada</option>
            <option value="cancelled">Cancelada</option>
            <option value="no_show">No se presentó</option>
          </select>

          <input
            type="date"
            placeholder="Fecha desde"
            value={filters.date_from}
            onChange={(e) => setFilters({...filters, date_from: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="date"
            placeholder="Fecha hasta"
            value={filters.date_to}
            onChange={(e) => setFilters({...filters, date_to: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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

      {/* Lista de citas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {filteredAppointments.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredAppointments.map((appointment) => (
              <div key={appointment.id || appointment.appointment_id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="font-semibold text-gray-900">{appointment.client_name}</h4>
                      <StatusBadge status={appointment.status} />
                      <StatusBadge 
                        status={appointment.appointment_type} 
                        type="appointment_type" 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{appointment.client_email}</span>
                      </div>
                      
                      {appointment.client_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{appointment.client_phone}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDate(appointment.appointment_date)} - {formatTime(appointment.appointment_time)}
                        </span>
                      </div>
                      
                      {appointment.created_at && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatTimeAgo(appointment.created_at)}</span>
                        </div>
                      )}
                    </div>

                    {appointment.notes && (
                      <div className="mb-3">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded flex-1">
                            {appointment.notes}
                          </p>
                        </div>
                      </div>
                    )}

                    {appointment.confirmation_code && (
                      <div className="text-xs text-gray-500">
                        Código de confirmación: 
                        <span className="font-mono ml-2 bg-gray-100 px-2 py-1 rounded">
                          {appointment.confirmation_code}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <select
                      value={appointment.status}
                      onChange={(e) => updateAppointmentStatus(appointment.appointment_id, e.target.value)}
                      disabled={operating}
                      className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="scheduled">Programada</option>
                      <option value="confirmed">Confirmada</option>
                      <option value="completed">Completada</option>
                      <option value="cancelled">Cancelada</option>
                      <option value="no_show">No se presentó</option>
                    </select>
                    
                    <button
                      onClick={() => handleEditAppointment(appointment)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteAppointment(appointment)}
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
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay citas</h3>
            <p className="text-gray-600 mb-4">
              {appointments.length === 0 
                ? "Aún no se han agendado citas en el sistema."
                : "No se encontraron citas que coincidan con los filtros aplicados."
              }
            </p>
            <div className="flex justify-center gap-3">
              {appointments.length === 0 ? (
                <button
                  onClick={handleCreateAppointment}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Crear Primera Cita
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

      {/* Modal de crear/editar cita */}
      <AppointmentModal
        appointment={selectedAppointment}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedAppointment(null);
        }}
        onSave={fetchAppointments}
        mode={modalMode}
      />

      {/* Modal de confirmación de eliminación */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedAppointment(null);
        }}
        onConfirm={confirmDeleteAppointment}
        title="Eliminar Cita"
        message={`¿Estás seguro de que quieres eliminar la cita de ${selectedAppointment?.client_name}?`}
        confirmText="Eliminar"
        type="danger"
      />
    </div>
  );
};

export default Appointments;