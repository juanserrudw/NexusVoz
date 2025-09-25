import React from 'react';

const LandingFooter = () => {
  return (
    <footer className="bg-black py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">JC</span>
              </div>
              <span className="text-lg font-bold">JCDevelopment</span>
            </div>
            <p className="text-gray-400 text-sm">
              Transformando el futuro con IA
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Productos</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-blue-400">NexusVoz</a></li>
              <li><a href="#" className="hover:text-blue-400">Chatbots IA</a></li>
              <li><a href="#" className="hover:text-blue-400">Analytics</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-blue-400">Nosotros</a></li>
              <li><a href="#" className="hover:text-blue-400">Blog</a></li>
              <li><a href="#" className="hover:text-blue-400">Careers</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Soporte</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-blue-400">Documentación</a></li>
              <li><a href="#" className="hover:text-blue-400">Ayuda</a></li>
              <li><a href="#" className="hover:text-blue-400">Contacto</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          © 2024 JCDevelopment Technologies. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;