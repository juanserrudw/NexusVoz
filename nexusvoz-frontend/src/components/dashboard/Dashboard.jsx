// src/components/dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Calendar, Users, TrendingUp, 
  CheckCircle, Clock, Activity, Phone, Eye, ArrowUp, ArrowDown
} from 'lucide-react';
import { dashboardService, conversationService } from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { StatusBadge } from '../common/StatusBadge';
import { formatTimeAgo, formatDuration, formatPercentage } from '../../utils/formatters';
import { useAsyncOperation } from '../../hooks/useApi';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_conversations: 0,
    total_appointments: 0,
    total_leads: 0,
    conversations_today: 0,
    appointments_today: 0,
    leads_today: 0,
    conversion_rate: 0,
    avg_conversation_duration: 0,
    top_intents: {},
    appointment_types_breakdown: {}
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const { loading: refreshing, execute: executeRefresh } = useAsyncOperation();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, activityData] = await Promise.all([
        dashboardService.getStats(),
        conversationService.getConversations({ limit: 5 })
      ]);
      
      setStats(statsData);
      setRecentActivity(activityData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await executeRefresh(fetchDashboardData);
  };

  const statCards = [
    {
      title: 'Conversaciones Totales',
      value: stats.total_conversations,
      today: stats.conversations_today,
      icon: MessageSquare,
      color: 'from-blue-500 to-blue-600',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Citas Agendadas',
      value: stats.total_appointments,
      today: stats.appointments_today,
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Leads Generados',
      value: stats.total_leads,
      today: stats.leads_today,
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: 'Tasa de Conversión',
      value: `${stats.conversion_rate}%`,
      today: null,
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      change: '-2%',
      changeType: 'negative'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Cargando dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con botón refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">Resumen general del sistema NexusVoz</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Activity className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Cards de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    {card.today !== null && (
                      <span className="text-sm text-green-600 font-medium">
                        +{card.today} hoy
                      </span>
                    )}
                    {card.change && (
                      <div className={`flex items-center gap-1 text-sm font-medium ${
                        card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {card.changeType === 'positive' ? 
                          <ArrowUp className="w-3 h-3" /> : 
                          <ArrowDown className="w-3 h-3" />
                        }
                        {card.change}
                      </div>
                    )}
                  </div>
                </div>
                <div className={`p-3 rounded-full bg-gradient-to-r ${card.color} group-hover:scale-110 transition-transform`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className={`h-1 bg-gradient-to-r ${card.color}`}></div>
          </div>
        ))}
      </div>

      {/* Sección principal con 3 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actividad reciente */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
              <button className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                Ver todo
              </button>
            </div>
          </div>

          <div className="p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">
                          Conversación {item.call_id?.substring(0, 8)}...
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(item.started_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={item.status} size="xs" />
                        <span className="text-sm text-gray-600">
                          Duración: {formatDuration(item.duration_seconds)}
                        </span>
                        {item.client_email && (
                          <span className="text-sm text-gray-600">• {item.client_email}</span>
                        )}
                      </div>
                      {item.intent_detected && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                            {item.intent_detected}
                          </span>
                        </div>
                      )}
                    </div>
                    <button className="text-gray-400 hover:text-blue-600 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay actividad reciente</p>
              </div>
            )}
          </div>
        </div>

        {/* Panel lateral con métricas */}
        <div className="space-y-6">
          {/* Métricas de rendimiento */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rendimiento</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Duración Promedio</span>
                <span className="font-medium text-gray-900">
                  {formatDuration(Math.round(stats.avg_conversation_duration))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tasa de Éxito</span>
                <span className="font-medium text-green-600">
                  {formatPercentage(stats.conversion_rate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Llamadas Activas</span>
                <span className="font-medium text-blue-600">3</span>
              </div>
            </div>
          </div>

          {/* Top intenciones */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Intenciones Principales</h3>
            <div className="space-y-3">
              {Object.entries(stats.top_intents || {}).slice(0, 4).map(([intent, count], index) => {
                const maxCount = Math.max(...Object.values(stats.top_intents || {}));
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 capitalize">
                        {intent.replace('_', ' ')}
                      </span>
                      <span className="font-medium text-gray-900">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${colors[index % colors.length]} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Estado del sistema */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del Sistema</h3>
            <div className="space-y-3">
              {[
                { name: 'API FastAPI', status: 'operational', color: 'green' },
                { name: 'Base de Datos', status: 'operational', color: 'green' },
                { name: 'Retell AI', status: 'operational', color: 'green' },
                { name: 'Webhooks', status: 'degraded', color: 'yellow' }
              ].map((service, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{service.name}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-${service.color}-500`}></div>
                    <span className={`text-xs font-medium text-${service.color}-600`}>
                      {service.status === 'operational' ? 'Operacional' : 'Degradado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

