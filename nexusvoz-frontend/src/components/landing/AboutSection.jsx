import React from 'react';

const AboutSection = () => {
  return (
    <section id="nosotros" className="py-20 bg-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Quiénes Somos</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto"></div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Misión */}
          <div className="glass-effect rounded-2xl p-8 card-hover">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-6 mx-auto">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-center">Misión</h3>
            <p className="text-gray-300 text-center leading-relaxed">
              JcDevelopment Technologies, es una empresa dedicada el desarrollo de sistemas de información que permiten impulsar la transformación de la comunicación empresarial mediante el desarrollo de soluciones de voz inteligentes y personalizadas A través de la innovación constante en Inteligencia Artificial y Procesamiento del Lenguaje Natural, creamos herramientas que permiten a las empresas construir relaciones más eficientes, empáticas y significativas con sus clientes Nuestro compromiso es ofrecer tecnología de vanguardia y un servicio excepcional, y generar un impacto positivo y duradero entre las organizaciones y sus clientes.  
            </p>
          </div>
          
          {/* Visión */}
          <div className="glass-effect rounded-2xl p-8 card-hover">
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-6 mx-auto">
              <span className="text-2xl">🔮</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-center">Visión</h3>
            <p className="text-gray-300 text-center leading-relaxed">
              JcDevelopment Technologies en el 2030 será con una empresa líder en el mercado por ofrecer soluciones de comunicación por voz a nivel nacional. Atreves del desarrollo de soluciones transformaremos la interacción empresarial en los diferentes sectores de la economía, integrando la voz en todos los canales y creando experiencias personalizadas y emocionalmente inteligentes. Seremos referentes en la innovación y la implementación de Inteligencia Artificial en cada uno de nuestros servicios, expandiendo nuestra presencia y consolidando una marca sinónimo de comunicación humana y eficiente en todo el país.
            </p>
          </div>
          
          {/* Valores */}
          <div className="glass-effect rounded-2xl p-8 card-hover">
            <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mb-6 mx-auto">
              <span className="text-2xl">💎</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-center">Valores</h3>
            <p className="text-gray-300 text-center leading-relaxed">
              Innovación constante, transparencia, calidad excepcional y compromiso con el éxito de nuestros clientes. Creemos en la tecnología como herramienta de progreso.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;