import React, { useState, useRef, useEffect } from 'react';
import { 
  HomeIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BellIcon,
  ArrowPathIcon,
  UserCircleIcon,
  PhoneIcon,
  WrenchScrewdriverIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import logo from '../../assets/logo.png';
import { authService } from '../../services/api';

const HeaderNavigation = ({ currentView, setCurrentView, user, onGoToLanding }) => {
  const [notifications] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(user);
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);

  // Cargar perfil completo del usuario al montar el componente
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        console.log('Usuario actual:', user); // Debug: ver qué datos tiene el usuario
        const profile = await authService.getProfile();
        console.log('Perfil obtenido de API:', profile); // Debug: ver qué devuelve la API
        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Usar los datos del usuario que ya tenemos
        setUserProfile(user);
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user]);
  
  // Remover configuración del menú principal
  const menuItems = [
    { 
      id: 'dashboard', 
      name: 'Dashboard', 
      icon: HomeIcon,
      color: 'from-blue-500 to-blue-600'
    },
    { 
      id: 'conversations', 
      name: 'Conversaciones', 
      icon: ChatBubbleLeftRightIcon,
      color: 'from-green-500 to-green-600'
    },
    { 
      id: 'appointments', 
      name: 'Citas', 
      icon: CalendarDaysIcon,
      color: 'from-purple-500 to-purple-600'
    },
    { 
      id: 'leads', 
      name: 'Leads', 
      icon: UserGroupIcon,
      color: 'from-orange-500 to-orange-600'
    },
    { 
      id: 'analytics', 
      name: 'Analíticas', 
      icon: ChartBarIcon,
      color: 'from-pink-500 to-pink-600'
    }
  ];

  // Menú sin API Test
  const allMenuItems = menuItems;

  const handleRefresh = () => {
    // Animación visual
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.style.transform = 'rotate(360deg)';
      setTimeout(() => {
        refreshBtn.style.transform = 'rotate(0deg)';
      }, 500);
    }

    // Funcionalidad real según la vista actual
    switch (currentView) {
      case 'dashboard':
        // Disparar evento personalizado para que Dashboard se actualice
        window.dispatchEvent(new CustomEvent('refresh-dashboard'));
        break;
      case 'conversations':
        // Disparar evento personalizado para Conversaciones
        window.dispatchEvent(new CustomEvent('refresh-conversations'));
        break;
      case 'appointments':
        // Disparar evento personalizado para Citas
        window.dispatchEvent(new CustomEvent('refresh-appointments'));
        break;
      case 'leads':
        // Disparar evento personalizado para Leads
        window.dispatchEvent(new CustomEvent('refresh-leads'));
        break;
      case 'analytics':
        // Disparar evento personalizado para Analytics
        window.dispatchEvent(new CustomEvent('refresh-analytics'));
        break;
      case 'profile':
        // Disparar evento personalizado para Profile
        window.dispatchEvent(new CustomEvent('refresh-profile'));
        break;
      case 'settings':
        // Para Settings, recargar datos del usuario
        window.dispatchEvent(new CustomEvent('refresh-settings'));
        break;
      default:
        // Fallback: recargar página completa si no hay vista específica
        window.location.reload();
        break;
    }

    // Mostrar feedback visual temporal
    console.log(`Actualizando datos de ${currentView}...`);
  };

  const handleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
  };

  // Lista de notificaciones (puedes hacer esto dinámico con props o API)
  const notificationsList = [
    {
      id: 1,
      title: "Nueva conversación",
      message: "Conversación con cliente iniciada",
      time: "hace 5 min",
      read: false,
      type: "conversation"
    },
    {
      id: 2,
      title: "Cita programada",
      message: "Cita confirmada para mañana",
      time: "hace 1 hora",
      read: true,
      type: "appointment"
    },
    {
      id: 3,
      title: "Lead calificado",
      message: "Nuevo lead de alta prioridad",
      time: "hace 2 horas",
      read: false,
      type: "lead"
    }
  ];

  const unreadCount = notificationsList.filter(n => !n.read).length;

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleSettingsClick = () => {
    setCurrentView('settings');
    setDropdownOpen(false);
  };

  // ✅ FUNCIÓN DE LOGOUT ACTUALIZADA PARA IR A LANDING
  const handleLogout = async () => {
    try {
      setDropdownOpen(false);
      
      // Si tenemos la función onGoToLanding, usarla para ir a la landing
      if (onGoToLanding) {
        onGoToLanding(); 
      } else {
        // Fallback: limpiar flag manualmente
        localStorage.removeItem('nexusvoz_visited_landing');
        if (setCurrentView) {
          setCurrentView('landing');
        }
      }
      
      // Hacer logout después de cambiar la vista
      await authService.logout();
      
    } catch (error) {
      console.error('Error during logout:', error);
      // Forzar logout local si hay error
      authService.logout();
      
      // Asegurar que vaya a landing incluso si hay error
      if (onGoToLanding) {
        onGoToLanding();
      } else {
        localStorage.removeItem('nexusvoz_visited_landing');
        window.location.reload();
      }
    }
  };

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Función para obtener las iniciales del usuario
  const getUserInitials = (userData) => {
    // Intentar diferentes propiedades que puede tener el usuario
    const name = userData?.name || userData?.full_name || userData?.first_name;
    const email = userData?.email || userData?.username;
    
    if (name) {
      const names = name.split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
      }
      return name[0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = (userData) => {
    // Intentar diferentes propiedades para el nombre
    return userData?.name || 
           userData?.full_name || 
           userData?.first_name || 
           (userData?.first_name && userData?.last_name ? `${userData.first_name} ${userData.last_name}` : null) ||
           userData?.username ||
           'Usuario';
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-gray-300 to-gray-600 shadow-2xl backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          
          {/* Logo */}
          <div className="flex items-center space-x-3">
             <div className="h-full flex items-center">
              <img src={logo} alt="NexusVoz Logo" className="h-40 lg:h-48 object-contain" />
             </div>
          </div>

          {/* Navigation Menu - Hidden on mobile, visible on desktop */}
          <nav className="hidden lg:flex items-center space-x-2">
            {allMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105
                    ${isActive 
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg` 
                      : 'text-white/80 bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 hover:text-white'
                    }
                    ${item.id === 'api-test' ? 'relative' : ''}
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden xl:inline">{item.name}</span>
                  {item.id === 'api-test' && (
                    <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs px-1 py-0.5 rounded-full font-bold">
                      DEV
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          
          {/* Mobile Navigation Menu */}
          <nav className="lg:hidden flex items-center space-x-1">
            {allMenuItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`
                    relative p-2 rounded-lg transition-all duration-300
                    ${isActive 
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg` 
                      : 'text-white/80 bg-white/10 backdrop-blur-lg border border-white/20'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {item.id === 'api-test' && (
                    <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs px-1 py-0.5 rounded-full font-bold">
                      D
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Header Actions */}
          <div className="flex items-center space-x-2 lg:space-x-3">

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={handleNotifications}
                className="relative w-10 h-10 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
              >
                <BellIcon className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown de notificaciones */}
              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                        {unreadCount} nuevas
                      </span>
                    )}
                  </div>

                  {/* Lista de notificaciones */}
                  <div className="max-h-64 overflow-y-auto">
                    {notificationsList.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 ${
                          !notification.read 
                            ? 'border-blue-500 bg-blue-50/30' 
                            : 'border-transparent'
                        }`}
                        onClick={() => {
                          // Aquí puedes agregar lógica para marcar como leída o navegar
                          console.log('Notification clicked:', notification.id);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icono según tipo */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            notification.type === 'conversation' ? 'bg-green-500' :
                            notification.type === 'appointment' ? 'bg-purple-500' :
                            notification.type === 'lead' ? 'bg-orange-500' : 'bg-gray-500'
                          }`}>
                            {notification.type === 'conversation' ? '💬' :
                             notification.type === 'appointment' ? '📅' :
                             notification.type === 'lead' ? '👤' : '🔔'}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-medium text-gray-900 ${
                                !notification.read ? 'font-semibold' : ''
                              }`}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2 border-t border-gray-100">
                    <button
                      onClick={() => {
                        // Aquí puedes agregar lógica para ver todas las notificaciones
                        setNotificationsOpen(false);
                      }}
                      className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Ver todas las notificaciones
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Refresh */}
            <button
              id="refresh-btn"
              onClick={handleRefresh}
              className="w-10 h-10 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-500 hover:scale-110"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-2 lg:space-x-3 px-3 py-2 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105"
              >
                {/* Avatar con iniciales */}
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {getUserInitials(userProfile)}
                </div>
                
                {/* Nombre del usuario - Hidden on mobile */}
                <span className="hidden lg:block text-white/90 text-sm font-medium max-w-32 truncate">
                  {getUserDisplayName(userProfile)}
                </span>
                
                {/* Icono de chevron */}
                <ChevronDownIcon 
                  className={`w-4 h-4 text-white/70 transition-transform duration-200 ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`} 
                />
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 backdrop-blur-lg">
                  {/* Info del usuario */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {getUserInitials(userProfile)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {getUserDisplayName(userProfile)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Opciones del menú */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        // Navegar a perfil si tienes esa vista
                        setCurrentView('profile');
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <UserCircleIcon className="w-5 h-5 text-gray-500" />
                      <span className="font-medium">Mi Perfil</span>
                    </button>

                    <button
                      onClick={handleSettingsClick}
                      className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Cog6ToothIcon className="w-5 h-5 text-gray-500" />
                      <span className="font-medium">Configuración</span>
                    </button>
                  </div>

                  {/* Separador */}
                  <div className="border-t border-gray-100 my-2"></div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    <span className="font-medium">Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation for remaining items */}
      <div className="lg:hidden border-t border-white/20 bg-white/10 backdrop-blur-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-6 py-2">
            {/* Analytics siempre visible */}
            {allMenuItems.slice(4).map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`
                    relative flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-300 text-xs
                    ${isActive 
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg` 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderNavigation;









