import React from 'react';

const ServicesSection = () => {
  const services = [
    { icon: '🎯', title: 'Lead Generation', description: 'Captación inteligente de leads', color: 'bg-blue-500' },
    { icon: '💬', title: 'Chatbots IA', description: 'Conversaciones automatizadas', color: 'bg-purple-500' },
    { icon: '📊', title: 'Analytics', description: 'Métricas y reportes avanzados', color: 'bg-indigo-500' },
    { icon: '🔗', title: 'Integraciones', description: 'Conecta con tus herramientas', color: 'bg-pink-500' },
  ];

  return (
    <section id="servicios" className="py-20 bg-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Nuestros Servicios</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mb-8"></div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <div key={index} className="glass-effect rounded-xl p-6 card-hover text-center">
              <div className={`w-16 h-16 ${service.color} rounded-full flex items-center justify-center mb-4 mx-auto`}>
                <span className="text-2xl">{service.icon}</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
              <p className="text-gray-300 text-sm">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;