import React from 'react';

const ContactSection = ({ onGoToNexusVoz }) => {
  return (
    <section id="contacto" className="py-20 bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-8">¿Listo para transformar tu negocio?</h2>
        <p className="text-xl text-gray-300 mb-8">
          Únete a la revolución de la IA conversacional con NexusVoz
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={onGoToNexusVoz}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-lg font-semibold hover:shadow-2xl transition-all transform hover:scale-105"
          >
            🚀 Comenzar Ahora
          </button>
          <button className="px-8 py-4 glass-effect rounded-full text-lg font-semibold hover:bg-white hover:bg-opacity-10 transition-all">
            📞 Contactar Ventas
          </button>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;