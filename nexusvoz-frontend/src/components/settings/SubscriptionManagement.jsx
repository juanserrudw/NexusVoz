import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Check, 
  Star, 
  Shield, 
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Calendar,
  DollarSign,
  Users,
  Zap,
  Crown,
  Building
} from 'lucide-react';

// Mock de servicios de suscripción
const subscriptionService = {
  getPlans: () => Promise.resolve([
    {
      id: 'basic',
      name: 'Básico',
      price: 500000,
      currency: 'COP',
      interval: 'month',
      features: [
        '500 conversaciones/mes',
        '30 citas programadas/mes',
        'Análisis básico',
        'Soporte por email',
        '20 usuario'
      ],
      maxConversations: 100,
      maxAppointments: 10,
      analytics: 'basic',
      support: 'email',
      users: 1,
      popular: false
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 180000,
      currency: 'COP',
      interval: 'month',
      features: [
        '4000+ conversaciones/mes',
        '1000 citas programadas/mes',
        'Análisis avanzado',
        'Soporte prioritario',
        '500 usuarios',
        'Integraciones avanzadas',
        'Reportes personalizados'
      ],
      maxConversations: 4000,
      maxAppointments: 1000,
      analytics: 'advanced',
      support: 'priority',
      users: 5,
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 2000000,
      currency: 'COP',
      interval: 'month',
      features: [
        'Conversaciones ilimitadas',
        'Citas ilimitadas',
        'Análisis completo + IA',
        'Soporte 24/7',
        'Usuarios ilimitados',
        'API personalizada',
        'Manager dedicado',
        'SLA garantizado'
      ],
      maxConversations: 'unlimited',
      maxAppointments: 'unlimited',
      analytics: 'complete',
      support: '24/7',
      users: 'unlimited',
      popular: false
    }
  ]),
  
  getCurrentSubscription: () => Promise.resolve({
    id: 'sub_12345',
    planId: 'premium',
    status: 'active',
    currentPeriodStart: new Date(2024, 8, 1),
    currentPeriodEnd: new Date(2024, 9, 1),
    cancelAtPeriodEnd: false,
    usage: {
      conversations: 234,
      appointments: 28
    }
  }),

  getPaymentMethods: () => Promise.resolve([
    {
      id: 'pm_1',
      type: 'card',
      card: {
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2025
      },
      isDefault: true
    },
    {
      id: 'pm_2',
      type: 'nequi',
      nequi: {
        phone: '*****1234'
      },
      isDefault: false
    }
  ]),

  getInvoices: () => Promise.resolve([
    {
      id: 'inv_1',
      date: new Date(2024, 8, 1),
      amount: 1800000,
      currency: 'COP',
      status: 'paid',
      plan: 'Premium',
      period: 'Sep 2024'
    },
    {
      id: 'inv_2',
      date: new Date(2024, 7, 1),
      amount: 1800000,
      currency: 'COP',
      status: 'paid',
      plan: 'Premium',
      period: 'Ago 2024'
    },
    {
      id: 'inv_3',
      date: new Date(2024, 6, 1),
      amount: 500000,
      currency: 'COP',
      status: 'paid',
      plan: 'Básico',
      period: 'Jul 2024'
    }
  ])
};

const SubscriptionManagement = () => {
  const [activeTab, setActiveTab] = useState('plans');
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansData, subscriptionData, paymentMethodsData, invoicesData] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getCurrentSubscription(),
        subscriptionService.getPaymentMethods(),
        subscriptionService.getInvoices()
      ]);
      
      setPlans(plansData);
      setCurrentSubscription(subscriptionData);
      setPaymentMethods(paymentMethodsData);
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency = 'COP') => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  const getPlanIcon = (planId) => {
    switch (planId) {
      case 'basic': return <Zap className="w-8 h-8" />;
      case 'premium': return <Crown className="w-8 h-8" />;
      case 'enterprise': return <Building className="w-8 h-8" />;
      default: return <Star className="w-8 h-8" />;
    }
  };

  const getPlanColor = (planId) => {
    switch (planId) {
      case 'basic': return 'from-blue-500 to-blue-600';
      case 'premium': return 'from-purple-500 to-purple-600';
      case 'enterprise': return 'from-gray-800 to-gray-900';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando suscripciones...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Suscripciones</h2>
          <p className="text-gray-600 mt-1">Gestiona tu plan y métodos de pago</p>
        </div>
      </div>

      {/* Current Plan Status */}
      {currentSubscription && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Plan Actual: {plans.find(p => p.id === currentSubscription.planId)?.name}</h3>
              <p className="opacity-90">Activo hasta {formatDate(currentSubscription.currentPeriodEnd)}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {formatCurrency(plans.find(p => p.id === currentSubscription.planId)?.price || 0)}
              </div>
              <div className="opacity-90">por mes</div>
            </div>
          </div>
          
          {/* Usage Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-sm opacity-90">Conversaciones este mes</div>
              <div className="text-2xl font-bold">{currentSubscription.usage.conversations}</div>
              <div className="text-sm opacity-75">
                de {plans.find(p => p.id === currentSubscription.planId)?.maxConversations === 'unlimited' 
                  ? '∞' 
                  : plans.find(p => p.id === currentSubscription.planId)?.maxConversations}
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-sm opacity-90">Citas este mes</div>
              <div className="text-2xl font-bold">{currentSubscription.usage.appointments}</div>
              <div className="text-sm opacity-75">
                de {plans.find(p => p.id === currentSubscription.planId)?.maxAppointments === 'unlimited' 
                  ? '∞' 
                  : plans.find(p => p.id === currentSubscription.planId)?.maxAppointments}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'plans', label: 'Planes', icon: Star },
            { id: 'payment', label: 'Métodos de Pago', icon: CreditCard },
            { id: 'billing', label: 'Historial de Pagos', icon: Calendar }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-lg ${
                plan.popular 
                  ? 'border-purple-500 ring-2 ring-purple-500 ring-opacity-20' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Más Popular
                  </span>
                </div>
              )}
              
              <div className="p-6">
                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className={`inline-flex p-3 rounded-full bg-gradient-to-r ${getPlanColor(plan.id)} text-white mb-4`}>
                    {getPlanIcon(plan.id)}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-gray-600 ml-1">/mes</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={currentSubscription?.planId === plan.id}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    currentSubscription?.planId === plan.id
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : plan.popular
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  {currentSubscription?.planId === plan.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Plan Actual
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      Seleccionar Plan
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'payment' && (
        <div className="space-y-6">
          {/* Payment Methods */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Métodos de Pago</h3>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Agregar Método
              </button>
            </div>

            <div className="space-y-4">
              {paymentMethods.map(method => (
                <div
                  key={method.id}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                    method.isDefault 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      {method.type === 'card' ? (
                        <>
                          <div className="font-medium text-gray-900">
                            **** **** **** {method.card.last4}
                          </div>
                          <div className="text-sm text-gray-600">
                            {method.card.brand.toUpperCase()} • Expira {method.card.expMonth}/{method.card.expYear}
                          </div>
                        </>
                      ) : method.type === 'nequi' ? (
                        <>
                          <div className="font-medium text-gray-900">Nequi</div>
                          <div className="text-sm text-gray-600">{method.nequi.phone}</div>
                        </>
                      ) : null}
                      {method.isDefault && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 mt-1">
                          <Check className="w-3 h-3 mr-1" />
                          Por defecto
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!method.isDefault && (
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Hacer predeterminado
                      </button>
                    )}
                    <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supported Payment Methods */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Métodos de Pago Soportados</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Tarjetas', desc: 'Visa, MasterCard, Amex' },
                { name: 'PayPal', desc: 'Pago seguro con PayPal' },
                { name: 'Nequi', desc: 'Pago con Nequi' },
                { name: 'Transferencia', desc: 'Transferencia bancaria' }
              ].map(method => (
                <div key={method.name} className="text-center p-4 border border-gray-200 rounded-lg">
                  <div className="font-medium text-gray-900">{method.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{method.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Historial de Facturación</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(invoice.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.plan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {invoice.period}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invoice.status === 'paid' 
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {invoice.status === 'paid' ? 'Pagado' : 
                         invoice.status === 'pending' ? 'Pendiente' : 'Fallido'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        Descargar
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        Ver detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Actualizar a {selectedPlan.name}
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(selectedPlan.price)}
              </div>
              <div className="text-gray-600">por mes</div>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Tu suscripción se actualizará inmediatamente y se facturará proporcionalmente.
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;