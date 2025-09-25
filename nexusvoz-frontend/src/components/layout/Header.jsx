import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, RefreshCw, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth'; // Ajusta la ruta según tu estructura

const Header = ({ currentView, setSidebarOpen }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const { user, logout } = useAuth(); // Obtener datos del usuario y función logout

  const getViewTitle = (view) => {
    const titles = {
      dashboard: 'Dashboard',
      conversations: 'Conversaciones',
      appointments: 'Citas',
      leads: 'Leads',
      analytics: 'Analíticas',
      settings: 'Configuración'
    };
    return titles[view] || 'Dashboard';
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const handleSettingsClick = () => {
    // Aquí puedes agregar la lógica para ir a configuración
    // Por ejemplo, si usas un setter para cambiar la vista:
    // setCurrentView('settings');
    setShowUserMenu(false);
  };

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {getViewTitle(currentView)}
          </h1>
        </div>
                
        <div className="flex items-center gap-4">
          {/* Notificaciones */}
          <button className="relative text-gray-600 hover:text-gray-900 transition-colors">
            <Bell className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>
        
          {/* Menú de usuario */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium">
                {user?.full_name || user?.username || user?.email || 'Usuario'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.full_name || user?.username || 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email || 'email@ejemplo.com'}
                  </p>
                </div>
                
                <button
                  onClick={handleSettingsClick}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Configuración
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;















// import React from 'react';
// import { Menu, Bell, RefreshCw } from 'lucide-react';

// const Header = ({ currentView, setSidebarOpen }) => {
//   const getViewTitle = (view) => {
//     const titles = {
//       dashboard: 'Dashboard',
//       conversations: 'Conversaciones',
//       appointments: 'Citas',
//       leads: 'Leads',
//       analytics: 'Analíticas',
//       settings: 'Configuración'
//     };
//     return titles[view] || 'Dashboard';
//   };

//   const handleRefresh = () => {
//     window.location.reload();
//   };

//   return (
//     <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-4">
//           <h1 className="text-2xl font-bold text-gray-900">
//             {getViewTitle(currentView)}
//           </h1>
//         </div>
        
//         <div className="flex items-center gap-4">
//           <button className="relative text-gray-600 hover:text-gray-900 transition-colors">
//             <Bell className="w-6 h-6" />
//             <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
//           </button>
//           <button 
//             onClick={handleRefresh}
//             className="text-gray-600 hover:text-gray-900 transition-colors"
//             title="Actualizar"
//           >
//             <RefreshCw className="w-5 h-5" />
//           </button>
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Header;