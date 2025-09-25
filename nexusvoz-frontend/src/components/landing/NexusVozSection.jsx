import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const NexusVozSection = ({ onGoToNexusVoz }) => {
  const [stats, setStats] = useState({
    conversations: 1250,
    leads: 156,
    appointments: 89
  });
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadRealStats();
    }
  }, [isAuthenticated]);

  const loadRealStats = async () => {
    try {
      setIsLoading(true);
      const response = await dashboardService.getStats();
      
      if (response && response.data) {
        setStats({
          conversations: response.data.totalConversations || stats.conversations,
          leads: response.data.totalLeads || stats.leads,
          appointments: response.data.totalAppointments || stats.appointments
        });
      }
    } catch (error) {
      console.log('Error loading stats, using demo data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-white">Conoce <span className="text-blue-400">NexusVoz</span></h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Nuestra plataforma de IA conversacional que revoluciona la gestión de leads y comunicación empresarial
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="glass-effect rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {isLoading ? '...' : stats.conversations.toLocaleString()}+
            </div>
            <div className="text-gray-300">Conversaciones Procesadas</div>
          </div>
          <div className="glass-effect rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {isLoading ? '...' : stats.leads.toLocaleString()}+
            </div>
            <div className="text-gray-300">Leads Generados</div>
          </div>
          <div className="glass-effect rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-indigo-400 mb-2">
              {isLoading ? '...' : stats.appointments.toLocaleString()}+
            </div>
            <div className="text-gray-300">Citas Programadas</div>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🤖</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">IA Conversacional Avanzada</h3>
                  <p className="text-gray-300">Automatiza conversaciones inteligentes que se adaptan a cada cliente</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📊</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Gestión de Leads</h3>
                  <p className="text-gray-300">Captura, clasifica y gestiona leads automáticamente</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📈</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Analytics en Tiempo Real</h3>
                  <p className="text-gray-300">Obtén insights valiosos sobre tus conversaciones y rendimiento</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="glass-effect rounded-3xl p-8 transform hover:scale-105 transition-all duration-500">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-1 mb-6">
                <div className="bg-gray-900 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    {/* Logo Red Neural pequeño en la demo */}
                    <svg width="32" height="24" viewBox="0 0 64 32">
                      <defs>
                        <linearGradient id="neuralDemo" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{stopColor:"#06B6D4", stopOpacity:1}} />
                          <stop offset="50%" style={{stopColor:"#3B82F6", stopOpacity:1}} />
                          <stop offset="100%" style={{stopColor:"#8B5CF6", stopOpacity:1}} />
                        </linearGradient>
                      </defs>
                      
                      <g transform="translate(8, 16)">
                        <circle cx="0" cy="-6" r="2" fill="url(#neuralDemo)"/>
                        <circle cx="0" cy="0" r="2.5" fill="url(#neuralDemo)"/>
                        <circle cx="0" cy="6" r="2" fill="url(#neuralDemo)"/>
                        
                        <circle cx="16" cy="-4" r="2.5" fill="url(#neuralDemo)"/>
                        <circle cx="16" cy="0" r="3" fill="url(#neuralDemo)"/>
                        <circle cx="16" cy="4" r="2.5" fill="url(#neuralDemo)"/>
                        
                        <circle cx="32" cy="-2" r="2.5" fill="url(#neuralDemo)"/>
                        <circle cx="32" cy="2" r="2.5" fill="url(#neuralDemo)"/>
                        
                        <circle cx="44" cy="0" r="3" fill="url(#neuralDemo)"/>
                        
                        <line x1="0" y1="0" x2="16" y2="-4" stroke="url(#neuralDemo)" strokeWidth="1.5" opacity="0.8"/>
                        <line x1="0" y1="0" x2="16" y2="0" stroke="url(#neuralDemo)" strokeWidth="2" opacity="1"/>
                        <line x1="0" y1="0" x2="16" y2="4" stroke="url(#neuralDemo)" strokeWidth="1.5" opacity="0.8"/>
                        
                        <line x1="16" y1="0" x2="32" y2="-2" stroke="url(#neuralDemo)" strokeWidth="1.5" opacity="0.8"/>
                        <line x1="16" y1="0" x2="32" y2="2" stroke="url(#neuralDemo)" strokeWidth="1.5" opacity="0.8"/>
                        
                        <line x1="32" y1="-2" x2="44" y2="0" stroke="url(#neuralDemo)" strokeWidth="1.5" opacity="0.8"/>
                        <line x1="32" y1="2" x2="44" y2="0" stroke="url(#neuralDemo)" strokeWidth="1.5" opacity="0.8"/>
                      </g>
                    </svg>
                    <span className="font-semibold text-white">NexusVoz IA</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="bg-gray-800 rounded-lg p-3 text-white">¡Hola! ¿En qué puedo ayudarte hoy?</div>
                    <div className="bg-blue-500 rounded-lg p-3 ml-8 text-white">Quiero información sobre sus servicios</div>
                    <div className="bg-gray-800 rounded-lg p-3 text-white">Perfecto, te ayudo con eso...</div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <button 
                  onClick={onGoToNexusVoz}
                  className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent hover:scale-105 transition-transform"
                >
                  Probar NexusVoz IA →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NexusVozSection;