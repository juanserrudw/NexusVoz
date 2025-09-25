import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, Users, MessageSquare, 
  PhoneCall, Target, Download, 
  RefreshCw, AlertTriangle, BarChart3, PieChart as PieChartIcon,
  Clock
} from 'lucide-react';
import { 
  dashboardService, 
  conversationService, 
  appointmentService, 
  leadService,
  handleApiError 
} from '../../services/api';
import { formatCurrency } from '../../utils/formatters'; 
import { LoadingSpinner } from '../common/LoadingSpinner';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [metrics, setMetrics] = useState({
    totalConversations: 0,
    totalAppointments: 0,
    totalLeads: 0,
    conversionRate: 0
  });
  const [appointmentData, setAppointmentData] = useState([]);
  const [conversationData, setConversationData] = useState([]);
  const [leadSourceData, setLeadSourceData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [error, setError] = useState('');

  // Colores para los gráficos
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching analytics data...');
      
      // Obtener datos de forma simple y directa
      const appointmentsPromise = appointmentService.getAppointments({ limit: 100, skip: 0 });
      const leadsPromise = leadService.getLeads({ limit: 100, skip: 0 });
      const conversationsPromise = conversationService.getConversations({ limit: 100, skip: 0 });
      
      const [appointmentsResult, leadsResult, conversationsResult] = await Promise.all([
        appointmentsPromise.catch(err => { console.error('Appointments error:', err); return []; }),
        leadsPromise.catch(err => { console.error('Leads error:', err); return []; }),
        conversationsPromise.catch(err => { console.error('Conversations error:', err); return []; })
      ]);

      console.log('Raw results:', { appointmentsResult, leadsResult, conversationsResult });

      const appointments = Array.isArray(appointmentsResult) ? appointmentsResult : [];
      const leads = Array.isArray(leadsResult) ? leadsResult : [];
      const conversations = Array.isArray(conversationsResult) ? conversationsResult : [];

      console.log('Processed data:', {
        appointments: appointments.length,
        leads: leads.length,
        conversations: conversations.length
      });

      // Procesar datos de appointments para gráfico
      const appointmentStatusCount = {};
      appointments.forEach(apt => {
        const status = apt.status || 'scheduled';
        appointmentStatusCount[status] = (appointmentStatusCount[status] || 0) + 1;
      });

      const appointmentChartData = Object.entries(appointmentStatusCount).map(([name, value]) => ({
        name,
        value
      }));

      // Procesar datos de conversaciones por día
      const conversationDailyData = {};
      conversations.forEach(conv => {
        if (conv.created_at) {
          const date = new Date(conv.created_at).toISOString().split('T')[0];
          conversationDailyData[date] = (conversationDailyData[date] || 0) + 1;
        }
      });

      // Generar datos para los últimos 30 días
      const conversationChartData = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        conversationChartData.push({
          date: dateStr,
          conversations: conversationDailyData[dateStr] || 0
        });
      }

      // Procesar fuentes de leads
      const leadSourceCount = {};
      leads.forEach(lead => {
        const source = lead.source || 'Desconocida';
        leadSourceCount[source] = (leadSourceCount[source] || 0) + 1;
      });

      const leadSourceChartData = Object.entries(leadSourceCount)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Procesar actividad por hora
      const hourlyActivity = {};
      for (let hour = 0; hour < 24; hour++) {
        hourlyActivity[hour] = 0;
      }

      conversations.forEach(conv => {
        if (conv.created_at) {
          const hour = new Date(conv.created_at).getHours();
          hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
        }
      });

      const performanceChartData = Object.entries(hourlyActivity).map(([hour, activity]) => ({
        hour: `${hour.padStart(2, '0')}:00`,
        activity
      }));

      // Calcular métricas
      const calculatedMetrics = {
        totalConversations: conversations.length,
        totalAppointments: appointments.length,
        totalLeads: leads.length,
        conversionRate: conversations.length > 0 ? ((appointments.length / conversations.length) * 100).toFixed(1) : 0
      };

      setMetrics(calculatedMetrics);
      setAppointmentData(appointmentChartData);
      setConversationData(conversationChartData);
      setLeadSourceData(leadSourceChartData);
      setPerformanceData(performanceChartData);

      console.log('Final metrics:', calculatedMetrics);
      console.log('Chart data:', {
        appointments: appointmentChartData,
        conversations: conversationChartData.length,
        leadSources: leadSourceChartData,
        performance: performanceChartData.length
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Error al cargar las analíticas. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const MetricCard = ({ icon: Icon, title, value, color = "blue" }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-2">Cargando analíticas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar analíticas</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
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
          <h2 className="text-2xl font-bold text-gray-900">Analíticas</h2>
          <p className="text-gray-600">Insights y métricas de rendimiento</p>
        </div>
        
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
          </select>

          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={MessageSquare}
          title="Total Conversaciones"
          value={metrics.totalConversations}
          color="blue"
        />
        <MetricCard
          icon={PhoneCall}
          title="Citas Programadas"
          value={metrics.totalAppointments}
          color="green"
        />
        <MetricCard
          icon={Users}
          title="Nuevos Leads"
          value={metrics.totalLeads}
          color="purple"
        />
        <MetricCard
          icon={Target}
          title="Tasa Conversión"
          value={`${metrics.conversionRate}%`}
          color="orange"
        />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversaciones por día */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Conversaciones por Día
            </h3>
          </div>
          {conversationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={conversationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString('es-ES')}
                />
                <Line 
                  type="monotone" 
                  dataKey="conversations" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p>No hay datos de conversaciones disponibles</p>
              </div>
            </div>
          )}
        </div>

        {/* Estado de citas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <PieChartIcon className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Estado de Citas</h3>
          </div>
          
          {appointmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={appointmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {appointmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <PhoneCall className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p>No hay datos de citas disponibles</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fuentes de leads */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Fuentes de Leads
            </h3>
          </div>
          {leadSourceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leadSourceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="source" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p>No hay datos de fuentes de leads disponibles</p>
              </div>
            </div>
          )}
        </div>

        {/* Rendimiento por hora */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Actividad por Hora
            </h3>
          </div>
          {performanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="activity" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p>No hay datos de actividad disponibles</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Métricas detalladas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Métricas Detalladas</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Conversaciones</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total</span>
                  <span className="font-medium">{metrics.totalConversations}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Citas</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total programadas</span>
                  <span className="font-medium">{metrics.totalAppointments}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Leads</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total generados</span>
                  <span className="font-medium">{metrics.totalLeads}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;




