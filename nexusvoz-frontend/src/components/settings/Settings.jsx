import React, { useState, useEffect } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Settings as SettingsIcon, 
  Save, 
  Eye, 
  EyeOff,
  AlertCircle,
  Check,
  Crown,
  Star,
  Calendar,
  DollarSign,
  Zap,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

// Hook para usar el AuthContext (asumiendo que está disponible)
const useAuth = () => {
  const context = React.useContext(React.createContext(null));
  // Si no hay contexto disponible, simular datos básicos
  if (!context) {
    console.warn('⚠️ AuthContext no disponible, usando localStorage directamente');
    return {
      token: localStorage.getItem('nexusvoz_token') || localStorage.getItem('access_token'),
      user: null,
      isAuthenticated: !!(localStorage.getItem('nexusvoz_token') || localStorage.getItem('access_token'))
    };
  }
  return context;
};

// Mock de settings service para las nuevas funciones - ACTUALIZADO CON PRECIOS REALES DE NEXUSVOZ
const settingsService = {
  getNotifications: () => Promise.resolve({
    email_conversations: true,
    email_appointments: true,
    email_leads: false,
    sms_appointments: true,
    sms_reminders: true,
    push_notifications: true,
    weekly_reports: true
  }),
  
  updateNotifications: (data) => Promise.resolve({ success: true, ...data }),
  
  getPreferences: () => Promise.resolve({
    language: 'es',
    date_format: 'DD/MM/YYYY',
    time_format: '24h',
    currency: 'COP',
    theme: 'light',
    timezone: 'America/Bogota'
  }),
  
  updatePreferences: (data) => Promise.resolve({ success: true, ...data }),
  
  getSecurity: () => Promise.resolve({
    two_factor_enabled: false,
    login_notifications: true,
    password_last_changed: '2024-08-15T10:30:00Z'
  }),
  
  enable2FA: () => Promise.resolve({ 
    success: true, 
    qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    secret: 'JBSWY3DPEHPK3PXP'
  }),
  
  disable2FA: () => Promise.resolve({ success: true })
};

const Settings = () => {
  console.log('🚀 Settings component iniciando...');

  // Usar el AuthContext
  const { token: authToken, user: authUser, isAuthenticated } = useAuth();

  // Estado de pestañas
  const [activeTab, setActiveTab] = useState('profile');
  const [activeSubTab, setActiveSubTab] = useState('plans');

  const [user, setUser] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Estados para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Estados para nuevas funcionalidades
  const [notifications, setNotifications] = useState({});
  const [preferences, setPreferences] = useState({});
  const [security, setSecurity] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState({
    hasToken: false,
    tokenPreview: '',
    userLoaded: false,
    authContextData: null
  });

  // Función para obtener el token (priorizar AuthContext)
  const getToken = () => {
    console.log('🔑 Obteniendo token...');
    
    // Prioridad 1: Token del AuthContext
    if (authToken) {
      console.log('✅ Token encontrado en AuthContext');
      return authToken;
    }
    
    // Prioridad 2: nexusvoz_token de localStorage  
    const nexusToken = localStorage.getItem('nexusvoz_token');
    if (nexusToken) {
      console.log('✅ Token encontrado en nexusvoz_token');
      return nexusToken;
    }
    
    // Prioridad 3: access_token de localStorage
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      console.log('✅ Token encontrado en access_token');
      return accessToken;
    }
    
    console.log('❌ No se encontró token');
    return null;
  };

  // Función para cargar datos del usuario
  const loadUserData = async () => {
    console.log('👤 Iniciando carga de datos de usuario...');
    setLoading(true);
    
    try {
      const token = getToken();
      
      if (!token) {
        console.log('❌ No hay token disponible');
        setLoading(false);
        return;
      }

      setDebugInfo(prev => ({ 
        ...prev, 
        hasToken: true, 
        tokenPreview: token.substring(0, 20) + '...',
        authContextData: { 
          hasAuthToken: !!authToken, 
          hasAuthUser: !!authUser, 
          isAuthenticated 
        }
      }));

      console.log('📡 Haciendo petición a los endpoints de tu API...');
      
      // Endpoints basados en tu documentación API (priorizando puerto 8000)
      const endpoints = [
        'http://localhost:8000/users/me',         
        '/users/me',                              
        'http://localhost:8000/users/me/full',    
        'http://localhost:3000/users/me',         
        '/users/me/full'                          
      ];

      let response = null;
      let usedEndpoint = '';
      let allErrors = [];

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Intentando endpoint: ${endpoint}`);
          response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              usedEndpoint = endpoint;
              break;
            }
          }
        } catch (err) {
          allErrors.push(`${endpoint}: ${err.message}`);
        }
      }

      if (response && response.ok) {
        const userData = await response.json();
        
        setUser({
          id: userData.id || '',
          name: userData.name || userData.full_name || userData.username || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || ''
        });

        setDebugInfo(prev => ({ ...prev, userLoaded: true }));
        
        // Cargar configuraciones adicionales
        const notificationsData = await settingsService.getNotifications();
        const preferencesData = await settingsService.getPreferences();
        const securityData = await settingsService.getSecurity();
        
        setNotifications(notificationsData);
        setPreferences(preferencesData);
        setSecurity(securityData);
      }
      
    } catch (error) {
      console.log('💥 Error en la petición:', error);
      setMessage(`Error de conexión: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para guardar cambios del perfil
  const handleSave = async () => {
    console.log('💾 Iniciando guardado...');
    setSaving(true);
    
    try {
      const token = getToken();
      
      if (!token) {
        setMessage('No hay token de autenticación');
        setSaving(false);
        return;
      }

      const endpoints = [
        'http://localhost:8000/users/me',         
        '/users/me',                              
        'http://localhost:3000/users/me'          
      ];

      let response = null;

      for (const endpoint of endpoints) {
        try {
          response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: user.name,
              email: user.email,
              phone: user.phone,
              address: user.address
            })
          });
          
          if (response.ok) {
            break;
          }
        } catch (err) {
          console.log(`💥 Error guardando en ${endpoint}:`, err.message);
        }
      }

      if (response && response.ok) {
        setMessage('✅ Datos guardados correctamente');
      } else {
        throw new Error('No se pudo guardar en ningún endpoint');
      }
      
    } catch (error) {
      setMessage(`Error al guardar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Función para cambiar contraseña
  const handlePasswordChange = async () => {
    console.log('🔒 Iniciando cambio de contraseña...');
    
    if (!passwordData.currentPassword) {
      setPasswordMessage('La contraseña actual es requerida');
      return;
    }
    
    if (!passwordData.newPassword) {
      setPasswordMessage('La nueva contraseña es requerida');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage('Las contraseñas no coinciden');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordMessage('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setChangingPassword(true);
    setPasswordMessage('');
    
    try {
      const token = getToken();
      
      if (!token) {
        setPasswordMessage('No hay token de autenticación');
        setChangingPassword(false);
        return;
      }

      const endpoints = [
        'http://localhost:8000/auth/change-password',     
        '/auth/change-password',                          
        'http://localhost:8000/users/change-password',    
        '/users/change-password',                         
        'http://localhost:3000/auth/change-password'      
      ];

      let response = null;
      let allErrors = [];

      for (const endpoint of endpoints) {
        try {
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              old_password: passwordData.currentPassword,
              new_password: passwordData.newPassword
            })
          });
          
          if (response.ok) {
            break;
          } else {
            const errorText = await response.text();
            allErrors.push(`${endpoint}: ${response.status} - ${errorText}`);
          }
        } catch (err) {
          allErrors.push(`${endpoint}: ${err.message}`);
        }
      }

      if (response && response.ok) {
        setPasswordMessage(`✅ Contraseña cambiada exitosamente`);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const hasUnauthorized = allErrors.some(error => error.includes('401') || error.includes('403'));
        if (hasUnauthorized) {
          setPasswordMessage('❌ Contraseña actual incorrecta');
        } else {
          setPasswordMessage('❌ Error al cambiar contraseña');
        }
      }
      
    } catch (error) {
      setPasswordMessage(`❌ Error de conexión: ${error.message}`);
    } finally {
      setChangingPassword(false);
    }
  };

  // Función para manejar cambios en inputs de perfil
  const handleInputChange = (field, value) => {
    setUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para manejar cambios en inputs de contraseña
  const handlePasswordInputChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
    if (passwordMessage) {
      setPasswordMessage('');
    }
  };

  // Funciones para manejar nuevas configuraciones
  const handleNotificationChange = (key, value) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await settingsService.updateNotifications(notifications);
      setMessage('✅ Notificaciones guardadas correctamente');
    } catch (error) {
      setMessage('❌ Error al guardar notificaciones');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await settingsService.updatePreferences(preferences);
      setMessage('✅ Preferencias guardadas correctamente');
    } catch (error) {
      setMessage('❌ Error al guardar preferencias');
    } finally {
      setSaving(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    console.log('🔄 useEffect ejecutándose...');
    loadUserData();
  }, [authToken]);

  // Configuración de pestañas
  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'subscriptions', label: 'Suscripciones', icon: CreditCard },
    { id: 'preferences', label: 'Preferencias', icon: SettingsIcon }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando configuración...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">⚙️ Configuración de Usuario</h2>
        <p className="text-gray-600 mt-1">Gestiona tu cuenta y preferencias</p>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.includes('❌') || message.includes('Error') 
            ? 'bg-red-50 border-red-200 text-red-800' 
            : 'bg-green-50 border-green-200 text-green-800'
        }`}>
          <div className="flex items-center gap-2">
            {message.includes('❌') || message.includes('Error') ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {message}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <nav className="space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">👤 Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={user.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Ingresa tu nombre completo"
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="tu@email.com"
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={user.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Número de teléfono"
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección
                    </label>
                    <textarea
                      value={user.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Dirección completa"
                      disabled={loading}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={loading || saving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">🔔 Preferencias de Notificaciones</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Notificaciones por Email</h4>
                    <div className="space-y-3">
                      {[
                        { key: 'email_conversations', label: 'Nuevas conversaciones' },
                        { key: 'email_appointments', label: 'Citas programadas' },
                        { key: 'email_leads', label: 'Nuevos leads' },
                        { key: 'weekly_reports', label: 'Reportes semanales' }
                      ].map(item => (
                        <label key={item.key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={notifications[item.key] || false}
                            onChange={(e) => handleNotificationChange(item.key, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Notificaciones SMS</h4>
                    <div className="space-y-3">
                      {[
                        { key: 'sms_appointments', label: 'Recordatorios de citas' },
                        { key: 'sms_reminders', label: 'Recordatorios importantes' }
                      ].map(item => (
                        <label key={item.key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={notifications[item.key] || false}
                            onChange={(e) => handleNotificationChange(item.key, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">🔒 Configuración de Seguridad</h3>
                
                {/* Password Message */}
                {passwordMessage && (
                  <div className={`p-4 rounded-lg border ${
                    passwordMessage.includes('❌') 
                      ? 'bg-red-50 border-red-200 text-red-800' 
                      : 'bg-green-50 border-green-200 text-green-800'
                  }`}>
                    {passwordMessage}
                  </div>
                )}
                
                {/* Change Password */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Cambiar Contraseña</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Por tu seguridad, necesitamos tu contraseña actual para cambiarla.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contraseña Actual *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                          placeholder="Ingresa tu contraseña actual"
                          disabled={changingPassword}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nueva Contraseña *
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                        placeholder="Ingresa tu nueva contraseña (mínimo 6 caracteres)"
                        disabled={changingPassword}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmar Nueva Contraseña *
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                        placeholder="Confirma tu nueva contraseña"
                        disabled={changingPassword}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <button
                      onClick={handlePasswordChange}
                      disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {changingPassword ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Cambiando...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4" />
                          Cambiar Contraseña
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Two Factor Auth */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-md font-medium text-gray-900">Autenticación de Dos Factores</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Agrega una capa extra de seguridad a tu cuenta
                      </p>
                    </div>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                      {security?.two_factor_enabled ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
                
                {/* Login History */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-2">Historial de Acceso</h4>
                  <p className="text-sm text-gray-600">
                    Última contraseña cambiada: {security?.password_last_changed ? 
                      new Date(security.password_last_changed).toLocaleDateString('es-ES') : 
                      'No disponible'
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Subscriptions Tab */}
            {activeTab === 'subscriptions' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">💳 Gestión de Suscripciones</h3>
                
                {/* Current Plan Status */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">Plan Actual: Plan Crecimiento</h3>
                      <p className="opacity-90">Para Empresas en Expansión - Activo hasta 1 de octubre de 2024</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">$1,800,000</div>
                      <div className="opacity-90">por mes</div>
                      <div className="text-sm opacity-75 mt-1">$1,530,000/mes anual</div>
                    </div>
                  </div>
                  
                  {/* Usage Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/20 rounded-lg p-4">
                      <div className="text-sm opacity-90">Conversaciones este mes</div>
                      <div className="text-2xl font-bold">4</div>
                      <div className="text-sm opacity-75">Ilimitadas con IA avanzada</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-4">
                      <div className="text-sm opacity-90">Citas programadas</div>
                      <div className="text-2xl font-bold">4</div>
                      <div className="text-sm opacity-75">Análisis predictivo</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-4">
                      <div className="text-sm opacity-90">Disponibilidad</div>
                      <div className="text-2xl font-bold">24/7</div>
                      <div className="text-sm opacity-75">Soporte prioritario</div>
                    </div>
                  </div>
                </div>

                {/* Subscription Tabs */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex space-x-8">
                    {[
                      { id: 'plans', label: 'Planes', icon: Star },
                      { id: 'payment', label: 'Métodos de Pago', icon: CreditCard },
                      { id: 'billing', label: 'Historial de Pagos', icon: Calendar }
                    ].map(subtab => {
                      const Icon = subtab.icon;
                      return (
                        <button
                          key={subtab.id}
                          onClick={() => setActiveSubTab(subtab.id)}
                          className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeSubTab === subtab.id
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {subtab.label}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Plans Section */}
                {activeSubTab === 'plans' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      {
                        id: 'esencial',
                        name: 'Plan Esencial',
                        subtitle: 'Para Emprendimientos y PYMES',
                        price: 500000,
                        priceAnnual: 425000,
                        features: [
                          'Plataforma principal NexusVoz con voz humana personalizada',
                          'Reconocimiento de voz contextual y PLN básico',
                          'Gestión de preguntas frecuentes y tareas repetitivas',
                          'Alta disponibilidad en horas laborales',
                          'Soporte técnico estándar'
                        ],
                        popular: false,
                        current: false,
                        discount: '15% descuento anual'
                      },
                      {
                        id: 'crecimiento',
                        name: 'Plan Crecimiento',
                        subtitle: 'Para Empresas en Expansión',
                        price: 1800000,
                        priceAnnual: 1530000,
                        features: [
                          'Todas las características del Plan Esencial',
                          'IA avanzada con personalización predictiva',
                          'Aprendizaje continuo automático',
                          'Alta disponibilidad 24/7 ininterrumpida',
                          'Análisis avanzado con reportes personalizados',
                          'Dashboards avanzados de interacciones',
                          'Soporte técnico prioritario'
                        ],
                        popular: true,
                        current: true,
                        discount: '15% descuento anual'
                      },
                      {
                        id: 'corporativo',
                        name: 'Plan Corporativo',
                        subtitle: 'Soluciones a Medida',
                        price: 2000000,
                        priceLabel: 'Desde',
                        features: [
                          'Todas las características del Plan Crecimiento',
                          'Funcionalidades de IA totalmente personalizables',
                          'Desarrollo de flujos de conversación complejos',
                          'Soporte técnico premium 24/7 con SLA personalizado',
                          'Consultoría estratégica continua',
                          'Auditorías de seguridad avanzadas',
                          'Integraciones complejas vía API',
                          'Desarrollo completamente a medida'
                        ],
                        popular: false,
                        current: false,
                        customPricing: true
                      }
                    ].map(plan => (
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
                          <div className="text-center mb-6">
                            <div className={`inline-flex p-3 rounded-full ${
                              plan.id === 'esencial' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                              plan.id === 'crecimiento' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                              'bg-gradient-to-r from-gray-800 to-gray-900'
                            } text-white mb-4`}>
                              {plan.id === 'esencial' && <Zap className="w-8 h-8" />}
                              {plan.id === 'crecimiento' && <Crown className="w-8 h-8" />}
                              {plan.id === 'corporativo' && <Star className="w-8 h-8" />}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{plan.subtitle}</p>
                            <div className="mt-2">
                              <span className="text-3xl font-bold text-gray-900">
                                {plan.priceLabel && `${plan.priceLabel} `}
                                ${plan.price.toLocaleString('es-CO')}
                              </span>
                              <span className="text-gray-600 ml-1">/mes</span>
                              {plan.priceAnnual && (
                                <div className="text-sm text-green-600 mt-1">
                                  ${plan.priceAnnual.toLocaleString('es-CO')}/mes anual
                                </div>
                              )}
                              {plan.discount && (
                                <div className="text-xs text-blue-600 mt-1">{plan.discount}</div>
                              )}
                            </div>
                          </div>

                          <ul className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-600 text-sm leading-relaxed">{feature}</span>
                              </li>
                            ))}
                          </ul>

                          <button
                            disabled={plan.current}
                            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                              plan.current
                                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                : plan.customPricing
                                ? 'bg-gray-900 hover:bg-gray-800 text-white'
                                : plan.popular
                                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {plan.current ? (
                              <div className="flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Plan Actual
                              </div>
                            ) : plan.customPricing ? (
                              <div className="flex items-center justify-center gap-2">
                                Solicitar Cotización
                                <ArrowRight className="w-4 h-4" />
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

                {/* Payment Methods Section */}
                {activeSubTab === 'payment' && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-semibold text-gray-900">Métodos de Pago</h4>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Agregar Método
                      </button>
                    </div>

                    <div className="space-y-4 mb-8">
                      {[
                        {
                          id: 'pm_1',
                          type: 'bank_transfer',
                          name: 'Transferencia Bancaria',
                          description: 'Pago directo a cuentas bancarias designadas en COP',
                          isDefault: true
                        },
                        {
                          id: 'pm_2',
                          type: 'card',
                          name: '**** **** **** 4242',
                          description: 'VISA • Expira 12/2025',
                          isDefault: false
                        },
                        {
                          id: 'pm_3',
                          type: 'pse',
                          name: 'PSE Débito Automático',
                          description: 'Débito Automático PSE (Pagos Seguros en Línea)',
                          isDefault: false
                        }
                      ].map(method => (
                        <div
                          key={method.id}
                          className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                            method.isDefault 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <CreditCard className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{method.name}</div>
                              <div className="text-sm text-gray-600">{method.description}</div>
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

                    {/* Supported Payment Methods */}
                    <div className="pt-6 border-t border-gray-200">
                      <h5 className="text-md font-semibold text-gray-900 mb-4">Métodos de Pago Soportados</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { 
                            name: 'Transferencia Bancaria', 
                            desc: 'Pago directo a cuentas bancarias designadas en pesos colombianos'
                          },
                          { 
                            name: 'Tarjetas de Crédito/Débito', 
                            desc: 'Pagos seguros con las principales tarjetas, transacción rápida y segura'
                          },
                          { 
                            name: 'PSE Débito Automático', 
                            desc: 'Pagos recurrentes automáticos para suscripciones mensuales o anuales'
                          }
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

                {/* Billing History Section */}
                {activeSubTab === 'billing' && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900">Historial de Facturación</h4>
                      <p className="text-sm text-gray-600 mt-1">Revisa tus pagos y descargas las facturas</p>
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
                          {[
                            { date: '1 Sep 2025', plan: 'Plan Crecimiento', amount: 1530000, period: 'Agosto 2025', type: 'mensual' }
                          ].map((invoice, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {invoice.date}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div>
                                  {invoice.plan}
                                  <div className="text-xs text-gray-500">{invoice.type}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {invoice.period}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                ${invoice.amount.toLocaleString('es-CO')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Pagado
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
                    
                    {/* Billing Summary */}
                    <div className="p-6 border-t border-gray-200 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">$1,530,000</div>
                          <div className="text-sm text-gray-600">Total pagado este año</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">1 Oct 2024</div>
                          <div className="text-sm text-gray-600">Próximo pago</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">$1,530,000</div>
                          <div className="text-sm text-gray-600">Monto próximo pago</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Preferencias Generales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Idioma
                    </label>
                    <select
                      value={preferences.language || 'es'}
                      onChange={(e) => handlePreferenceChange('language', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zona Horaria
                    </label>
                    <select
                      value={preferences.timezone || 'America/Bogota'}
                      onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="America/Bogota">Bogotá (GMT-5)</option>
                      <option value="America/New_York">Nueva York (GMT-5)</option>
                      <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                      <option value="America/Lima">Lima (GMT-5)</option>
                      <option value="America/Santiago">Santiago (GMT-3)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Formato de Fecha
                    </label>
                    <select
                      value={preferences.date_format || 'DD/MM/YYYY'}
                      onChange={(e) => handlePreferenceChange('date_format', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Formato de Hora
                    </label>
                    <select
                      value={preferences.time_format || '24h'}
                      onChange={(e) => handlePreferenceChange('time_format', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="24h">24 horas (14:30)</option>
                      <option value="12h">12 horas (2:30 PM)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Moneda
                    </label>
                    <select
                      value={preferences.currency || 'COP'}
                      onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="COP">Peso Colombiano (COP)</option>
                      <option value="USD">Dólar Americano (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="MXN">Peso Mexicano (MXN)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tema
                    </label>
                    <select
                      value={preferences.theme || 'light'}
                      onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="light">Claro</option>
                      <option value="dark">Oscuro</option>
                      <option value="auto">Automático</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSavePreferences}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
















// import React, { useState, useEffect } from 'react';
// import { 
//   User, 
//   Bell, 
//   Shield, 
//   CreditCard, 
//   Settings as SettingsIcon, 
//   Save, 
//   Eye, 
//   EyeOff,
//   AlertCircle,
//   Check,
//   Crown,
//   Star,
//   Calendar,
//   DollarSign,
//   Zap,
//   CheckCircle,
//   ArrowRight
// } from 'lucide-react';

// // Hook para usar el AuthContext (asumiendo que está disponible)
// const useAuth = () => {
//   const context = React.useContext(React.createContext(null));
//   // Si no hay contexto disponible, simular datos básicos
//   if (!context) {
//     console.warn('⚠️ AuthContext no disponible, usando localStorage directamente');
//     return {
//       token: localStorage.getItem('nexusvoz_token') || localStorage.getItem('access_token'),
//       user: null,
//       isAuthenticated: !!(localStorage.getItem('nexusvoz_token') || localStorage.getItem('access_token'))
//     };
//   }
//   return context;
// };

// // Mock de settings service para las nuevas funciones
// const settingsService = {
//   getNotifications: () => Promise.resolve({
//     email_conversations: true,
//     email_appointments: true,
//     email_leads: false,
//     sms_appointments: true,
//     sms_reminders: true,
//     push_notifications: true,
//     weekly_reports: true
//   }),
  
//   updateNotifications: (data) => Promise.resolve({ success: true, ...data }),
  
//   getPreferences: () => Promise.resolve({
//     language: 'es',
//     date_format: 'DD/MM/YYYY',
//     time_format: '24h',
//     currency: 'COP',
//     theme: 'light',
//     timezone: 'America/Bogota'
//   }),
  
//   updatePreferences: (data) => Promise.resolve({ success: true, ...data }),
  
//   getSecurity: () => Promise.resolve({
//     two_factor_enabled: false,
//     login_notifications: true,
//     password_last_changed: '2024-08-15T10:30:00Z'
//   }),
  
//   enable2FA: () => Promise.resolve({ 
//     success: true, 
//     qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
//     secret: 'JBSWY3DPEHPK3PXP'
//   }),
  
//   disable2FA: () => Promise.resolve({ success: true })
// };

// const Settings = () => {
//   console.log('🚀 Settings component iniciando...');

//   // Usar el AuthContext
//   const { token: authToken, user: authUser, isAuthenticated } = useAuth();

//   // Estado de pestañas
//   const [activeTab, setActiveTab] = useState('profile');
//   const [activeSubTab, setActiveSubTab] = useState('plans');

//   const [user, setUser] = useState({
//     id: '',
//     name: '',
//     email: '',
//     phone: '',
//     address: ''
//   });

//   // Estados para cambio de contraseña
//   const [passwordData, setPasswordData] = useState({
//     currentPassword: '',
//     newPassword: '',
//     confirmPassword: ''
//   });

//   // Estados para nuevas funcionalidades
//   const [notifications, setNotifications] = useState({});
//   const [preferences, setPreferences] = useState({});
//   const [security, setSecurity] = useState({});
//   const [showPassword, setShowPassword] = useState(false);

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [changingPassword, setChangingPassword] = useState(false);
//   const [message, setMessage] = useState('');
//   const [passwordMessage, setPasswordMessage] = useState('');
//   const [debugInfo, setDebugInfo] = useState({
//     hasToken: false,
//     tokenPreview: '',
//     userLoaded: false,
//     authContextData: null
//   });

//   // Función para obtener el token (priorizar AuthContext)
//   const getToken = () => {
//     console.log('🔑 Obteniendo token...');
    
//     // Prioridad 1: Token del AuthContext
//     if (authToken) {
//       console.log('✅ Token encontrado en AuthContext');
//       return authToken;
//     }
    
//     // Prioridad 2: nexusvoz_token de localStorage  
//     const nexusToken = localStorage.getItem('nexusvoz_token');
//     if (nexusToken) {
//       console.log('✅ Token encontrado en nexusvoz_token');
//       return nexusToken;
//     }
    
//     // Prioridad 3: access_token de localStorage
//     const accessToken = localStorage.getItem('access_token');
//     if (accessToken) {
//       console.log('✅ Token encontrado en access_token');
//       return accessToken;
//     }
    
//     console.log('❌ No se encontró token');
//     return null;
//   };

//   // Función para cargar datos del usuario
//   const loadUserData = async () => {
//     console.log('👤 Iniciando carga de datos de usuario...');
//     setLoading(true);
    
//     try {
//       const token = getToken();
      
//       if (!token) {
//         console.log('❌ No hay token disponible');
//         setLoading(false);
//         return;
//       }

//       setDebugInfo(prev => ({ 
//         ...prev, 
//         hasToken: true, 
//         tokenPreview: token.substring(0, 20) + '...',
//         authContextData: { 
//           hasAuthToken: !!authToken, 
//           hasAuthUser: !!authUser, 
//           isAuthenticated 
//         }
//       }));

//       console.log('📡 Haciendo petición a los endpoints de tu API...');
      
//       // Endpoints basados en tu documentación API (priorizando puerto 8000)
//       const endpoints = [
//         'http://localhost:8000/users/me',         // Prioridad 1: FastAPI típico
//         '/users/me',                              // Prioridad 2: Relativo 
//         'http://localhost:8000/users/me/full',    // Prioridad 3: Endpoint extendido
//         'http://localhost:3000/users/me',         // Prioridad 4: Puerto alternativo
//         '/users/me/full'                          // Prioridad 5: Endpoint extendido relativo
//       ];

//       let response = null;
//       let usedEndpoint = '';
//       let allErrors = [];

//       for (const endpoint of endpoints) {
//         try {
//           console.log(`🔄 Intentando endpoint: ${endpoint}`);
//           response = await fetch(endpoint, {
//             method: 'GET',
//             headers: {
//               'Authorization': `Bearer ${token}`,
//               'Content-Type': 'application/json'
//             }
//           });
          
//           console.log(`📊 Response status: ${response.status} para ${endpoint}`);
//           console.log(`📋 Response headers:`, response.headers.get('content-type'));
          
//           if (response.ok) {
//             // Verificar que la respuesta sea JSON
//             const contentType = response.headers.get('content-type');
//             if (contentType && contentType.includes('application/json')) {
//               usedEndpoint = endpoint;
//               console.log(`✅ Endpoint exitoso: ${endpoint}`);
//               break;
//             } else {
//               console.log(`⚠️ ${endpoint} devolvió ${response.status} pero no es JSON:`, contentType);
//               const text = await response.text();
//               console.log(`📝 Contenido recibido:`, text.substring(0, 200) + '...');
//               allErrors.push(`${endpoint}: Devolvió ${contentType || 'unknown'} en lugar de JSON`);
//             }
//           } else {
//             const text = await response.text();
//             console.log(`❌ Endpoint ${endpoint} falló: ${response.status}`);
//             console.log(`📝 Error content:`, text.substring(0, 200) + '...');
//             allErrors.push(`${endpoint}: ${response.status} - ${text.substring(0, 100)}`);
//           }
//         } catch (err) {
//           console.log(`💥 Error en endpoint ${endpoint}:`, err.message);
//           allErrors.push(`${endpoint}: ${err.message}`);
//         }
//       }

//       if (!response || !response.ok) {
//         console.log('📋 Resumen de todos los errores:');
//         allErrors.forEach((error, index) => {
//           console.log(`${index + 1}. ${error}`);
//         });
//         throw new Error(`Ningún endpoint funcionó. Errores: ${allErrors.slice(0, 2).join('; ')}`);
//       }

//       console.log('📊 Status de respuesta:', response.status, 'desde', usedEndpoint);

//       const userData = await response.json();
//       console.log('✅ Datos de usuario recibidos:', userData);
      
//       setUser({
//         id: userData.id || '',
//         name: userData.name || userData.full_name || userData.username || '',
//         email: userData.email || '',
//         phone: userData.phone || '',
//         address: userData.address || ''
//       });

//       setDebugInfo(prev => ({ ...prev, userLoaded: true }));
      
//       // Cargar configuraciones adicionales (mock data para demo)
//       const notificationsData = await settingsService.getNotifications();
//       const preferencesData = await settingsService.getPreferences();
//       const securityData = await settingsService.getSecurity();
      
//       setNotifications(notificationsData);
//       setPreferences(preferencesData);
//       setSecurity(securityData);
      
//     } catch (error) {
//       console.log('💥 Error en la petición:', error);
//       setMessage(`Error de conexión: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Función para guardar cambios del perfil
//   const handleSave = async () => {
//     console.log('💾 Iniciando guardado...');
//     setSaving(true);
    
//     try {
//       const token = getToken();
      
//       if (!token) {
//         setMessage('No hay token de autenticación');
//         setSaving(false);
//         return;
//       }

//       // Endpoints para guardar basados en tu API (priorizando puerto 8000)
//       const endpoints = [
//         'http://localhost:8000/users/me',         // Prioridad 1: FastAPI típico
//         '/users/me',                              // Prioridad 2: Relativo
//         'http://localhost:3000/users/me'          // Prioridad 3: Alternativo
//       ];

//       let response = null;
//       let usedEndpoint = '';

//       for (const endpoint of endpoints) {
//         try {
//           console.log(`🔄 Intentando guardar en: ${endpoint}`);
//           response = await fetch(endpoint, {
//             method: 'PUT',
//             headers: {
//               'Authorization': `Bearer ${token}`,
//               'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//               name: user.name,
//               email: user.email,
//               phone: user.phone,
//               address: user.address
//             })
//           });
          
//           if (response.ok) {
//             usedEndpoint = endpoint;
//             console.log(`✅ Guardado exitoso en: ${endpoint}`);
//             break;
//           } else {
//             console.log(`❌ Guardar en ${endpoint} falló: ${response.status}`);
//           }
//         } catch (err) {
//           console.log(`💥 Error guardando en ${endpoint}:`, err.message);
//         }
//       }

//       if (response && response.ok) {
//         setMessage('✅ Datos guardados correctamente');
//         console.log('✅ Datos guardados');
//       } else {
//         throw new Error('No se pudo guardar en ningún endpoint');
//       }
      
//     } catch (error) {
//       console.log('💥 Error al guardar:', error);
//       setMessage(`Error al guardar: ${error.message}`);
//     } finally {
//       setSaving(false);
//     }
//   };

//   // Función para cambiar contraseña
//   const handlePasswordChange = async () => {
//     console.log('🔒 Iniciando cambio de contraseña...');
    
//     // Validaciones
//     if (!passwordData.currentPassword) {
//       setPasswordMessage('La contraseña actual es requerida');
//       return;
//     }
    
//     if (!passwordData.newPassword) {
//       setPasswordMessage('La nueva contraseña es requerida');
//       return;
//     }
    
//     if (passwordData.newPassword !== passwordData.confirmPassword) {
//       setPasswordMessage('Las contraseñas no coinciden');
//       return;
//     }
    
//     if (passwordData.newPassword.length < 6) {
//       setPasswordMessage('La nueva contraseña debe tener al menos 6 caracteres');
//       return;
//     }
    
//     setChangingPassword(true);
//     setPasswordMessage('');
    
//     try {
//       const token = getToken();
      
//       if (!token) {
//         setPasswordMessage('No hay token de autenticación');
//         setChangingPassword(false);
//         return;
//       }

//       // Endpoints para cambio de contraseña según tu API
//       const endpoints = [
//         'http://localhost:8000/auth/change-password',     // Prioridad 1: FastAPI típico
//         '/auth/change-password',                          // Prioridad 2: Relativo
//         'http://localhost:8000/users/change-password',    // Prioridad 3: Alternativo
//         '/users/change-password',                         // Prioridad 4: Alternativo relativo
//         'http://localhost:3000/auth/change-password'      // Prioridad 5: Puerto alternativo
//       ];

//       let response = null;
//       let usedEndpoint = '';
//       let allErrors = [];

//       for (const endpoint of endpoints) {
//         try {
//           console.log(`🔄 Intentando cambio de contraseña en: ${endpoint}`);
//           response = await fetch(endpoint, {
//             method: 'POST',
//             headers: {
//               'Authorization': `Bearer ${token}`,
//               'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//               old_password: passwordData.currentPassword,
//               new_password: passwordData.newPassword
//             })
//           });
          
//           console.log(`📊 Response status: ${response.status} para ${endpoint}`);
          
//           if (response.ok) {
//             usedEndpoint = endpoint;
//             console.log(`✅ Cambio de contraseña exitoso en: ${endpoint}`);
//             break;
//           } else {
//             const errorText = await response.text();
//             console.log(`❌ Cambio de contraseña en ${endpoint} falló: ${response.status}`);
//             console.log(`📝 Error content:`, errorText);
//             allErrors.push(`${endpoint}: ${response.status} - ${errorText}`);
//           }
//         } catch (err) {
//           console.log(`💥 Error en endpoint ${endpoint}:`, err.message);
//           allErrors.push(`${endpoint}: ${err.message}`);
//         }
//       }

//       if (response && response.ok) {
//         setPasswordMessage(`✅ Contraseña cambiada exitosamente`);
//         console.log('✅ Contraseña cambiada');
        
//         // Limpiar los campos de contraseña
//         setPasswordData({
//           currentPassword: '',
//           newPassword: '',
//           confirmPassword: ''
//         });
//       } else {
//         console.log('📋 Resumen de errores del cambio de contraseña:');
//         allErrors.forEach((error, index) => {
//           console.log(`${index + 1}. ${error}`);
//         });
        
//         // Verificar si es error de contraseña incorrecta
//         const hasUnauthorized = allErrors.some(error => error.includes('401') || error.includes('403'));
//         if (hasUnauthorized) {
//           setPasswordMessage('❌ Contraseña actual incorrecta');
//         } else {
//           setPasswordMessage(`❌ Error al cambiar contraseña: ${allErrors[0]?.split(' - ')[1] || 'Error desconocido'}`);
//         }
//       }
      
//     } catch (error) {
//       console.log('💥 Error al cambiar contraseña:', error);
//       setPasswordMessage(`❌ Error de conexión: ${error.message}`);
//     } finally {
//       setChangingPassword(false);
//     }
//   };

//   // Función para manejar cambios en inputs de perfil
//   const handleInputChange = (field, value) => {
//     setUser(prev => ({
//       ...prev,
//       [field]: value
//     }));
//   };

//   // Función para manejar cambios en inputs de contraseña
//   const handlePasswordInputChange = (field, value) => {
//     setPasswordData(prev => ({
//       ...prev,
//       [field]: value
//     }));
//     // Limpiar mensaje de error cuando el usuario empiece a escribir
//     if (passwordMessage) {
//       setPasswordMessage('');
//     }
//   };

//   // Funciones para manejar nuevas configuraciones
//   const handleNotificationChange = (key, value) => {
//     setNotifications(prev => ({
//       ...prev,
//       [key]: value
//     }));
//   };

//   const handlePreferenceChange = (key, value) => {
//     setPreferences(prev => ({
//       ...prev,
//       [key]: value
//     }));
//   };

//   const handleSaveNotifications = async () => {
//     setSaving(true);
//     try {
//       await settingsService.updateNotifications(notifications);
//       setMessage('✅ Notificaciones guardadas correctamente');
//     } catch (error) {
//       setMessage('❌ Error al guardar notificaciones');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleSavePreferences = async () => {
//     setSaving(true);
//     try {
//       await settingsService.updatePreferences(preferences);
//       setMessage('✅ Preferencias guardadas correctamente');
//     } catch (error) {
//       setMessage('❌ Error al guardar preferencias');
//     } finally {
//       setSaving(false);
//     }
//   };

//   // Cargar datos al montar el componente
//   useEffect(() => {
//     console.log('🔄 useEffect ejecutándose...');
//     console.log('🔍 AuthContext data:', { authToken: !!authToken, authUser: !!authUser, isAuthenticated });
//     loadUserData();
//   }, [authToken]); // Recargar si cambia el token del contexto

//   // Configuración de pestañas
//   const tabs = [
//     { id: 'profile', label: 'Perfil', icon: User },
//     { id: 'notifications', label: 'Notificaciones', icon: Bell },
//     { id: 'security', label: 'Seguridad', icon: Shield },
//     { id: 'subscriptions', label: 'Suscripciones', icon: CreditCard },
//     { id: 'preferences', label: 'Preferencias', icon: SettingsIcon }
//   ];

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//         <span className="ml-3 text-gray-600">Cargando configuración...</span>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-6xl mx-auto space-y-6 p-4">
//       {/* Header */}
//       <div>
//         <h2 className="text-3xl font-bold text-gray-900">⚙️ Configuración de Usuario</h2>
//         <p className="text-gray-600 mt-1">Gestiona tu cuenta y preferencias</p>
//       </div>

//       {/* Message Alert */}
//       {message && (
//         <div className={`p-4 rounded-lg border ${
//           message.includes('❌') || message.includes('Error') 
//             ? 'bg-red-50 border-red-200 text-red-800' 
//             : 'bg-green-50 border-green-200 text-green-800'
//         }`}>
//           <div className="flex items-center gap-2">
//             {message.includes('❌') || message.includes('Error') ? (
//               <AlertCircle className="w-4 h-4" />
//             ) : (
//               <Check className="w-4 h-4" />
//             )}
//             {message}
//           </div>
//         </div>
//       )}

//       <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
//         {/* Sidebar Navigation */}
//         <div className="lg:col-span-1">
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
//             <nav className="space-y-2">
//               {tabs.map(tab => {
//                 const Icon = tab.icon;
//                 return (
//                   <button
//                     key={tab.id}
//                     onClick={() => setActiveTab(tab.id)}
//                     className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
//                       activeTab === tab.id
//                         ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
//                         : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
//                     }`}
//                   >
//                     <Icon className="w-5 h-5" />
//                     {tab.label}
//                   </button>
//                 );
//               })}
//             </nav>
//           </div>
//         </div>

//         {/* Content Area */}
//         <div className="lg:col-span-3">
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200">
//             {/* Profile Tab */}
//             {activeTab === 'profile' && (
//               <div className="p-6">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-6">👤 Información Personal</h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Nombre Completo
//                     </label>
//                     <input
//                       type="text"
//                       value={user.name}
//                       onChange={(e) => handleInputChange('name', e.target.value)}
//                       placeholder="Ingresa tu nombre completo"
//                       disabled={loading}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     />
//                   </div>
                  
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Email
//                     </label>
//                     <input
//                       type="email"
//                       value={user.email}
//                       onChange={(e) => handleInputChange('email', e.target.value)}
//                       placeholder="tu@email.com"
//                       disabled={loading}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     />
//                   </div>
                  
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Teléfono
//                     </label>
//                     <input
//                       type="tel"
//                       value={user.phone}
//                       onChange={(e) => handleInputChange('phone', e.target.value)}
//                       placeholder="Número de teléfono"
//                       disabled={loading}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     />
//                   </div>
                  
//                   <div className="md:col-span-2">
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Dirección
//                     </label>
//                     <textarea
//                       value={user.address}
//                       onChange={(e) => handleInputChange('address', e.target.value)}
//                       placeholder="Dirección completa"
//                       disabled={loading}
//                       rows={3}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
//                     />
//                   </div>
//                 </div>
                
//                 <div className="mt-6 flex justify-end">
//                   <button
//                     onClick={handleSave}
//                     disabled={loading || saving}
//                     className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
//                   >
//                     <Save className="w-4 h-4" />
//                     {saving ? 'Guardando...' : '💾 Guardar Cambios'}
//                   </button>
//                 </div>
//               </div>
//             )}

//             {/* Notifications Tab */}
//             {activeTab === 'notifications' && (
//               <div className="p-6">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-6">🔔 Preferencias de Notificaciones</h3>
//                 <div className="space-y-6">
//                   <div>
//                     <h4 className="text-md font-medium text-gray-900 mb-3">Notificaciones por Email</h4>
//                     <div className="space-y-3">
//                       {[
//                         { key: 'email_conversations', label: 'Nuevas conversaciones' },
//                         { key: 'email_appointments', label: 'Citas programadas' },
//                         { key: 'email_leads', label: 'Nuevos leads' },
//                         { key: 'weekly_reports', label: 'Reportes semanales' }
//                       ].map(item => (
//                         <label key={item.key} className="flex items-center">
//                           <input
//                             type="checkbox"
//                             checked={notifications[item.key] || false}
//                             onChange={(e) => handleNotificationChange(item.key, e.target.checked)}
//                             className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//                           />
//                           <span className="ml-2 text-sm text-gray-700">{item.label}</span>
//                         </label>
//                       ))}
//                     </div>
//                   </div>
                  
//                   <div>
//                     <h4 className="text-md font-medium text-gray-900 mb-3">Notificaciones SMS</h4>
//                     <div className="space-y-3">
//                       {[
//                         { key: 'sms_appointments', label: 'Recordatorios de citas' },
//                         { key: 'sms_reminders', label: 'Recordatorios importantes' }
//                       ].map(item => (
//                         <label key={item.key} className="flex items-center">
//                           <input
//                             type="checkbox"
//                             checked={notifications[item.key] || false}
//                             onChange={(e) => handleNotificationChange(item.key, e.target.checked)}
//                             className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//                           />
//                           <span className="ml-2 text-sm text-gray-700">{item.label}</span>
//                         </label>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
                
//                 <div className="mt-6 flex justify-end">
//                   <button
//                     onClick={handleSaveNotifications}
//                     disabled={saving}
//                     className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
//                   >
//                     <Save className="w-4 h-4" />
//                     {saving ? 'Guardando...' : 'Guardar Cambios'}
//                   </button>
//                 </div>
//               </div>
//             )}

//             {/* Security Tab */}
//             {activeTab === 'security' && (
//               <div className="p-6 space-y-6">
//                 <h3 className="text-lg font-semibold text-gray-900">🔒 Configuración de Seguridad</h3>
                
//                 {/* Password Message */}
//                 {passwordMessage && (
//                   <div className={`p-4 rounded-lg border ${
//                     passwordMessage.includes('❌') 
//                       ? 'bg-red-50 border-red-200 text-red-800' 
//                       : 'bg-green-50 border-green-200 text-green-800'
//                   }`}>
//                     {passwordMessage}
//                   </div>
//                 )}
                
//                 {/* Change Password */}
//                 <div className="border border-gray-200 rounded-lg p-4">
//                   <h4 className="text-md font-medium text-gray-900 mb-4">Cambiar Contraseña</h4>
//                   <p className="text-sm text-gray-600 mb-4">
//                     Por tu seguridad, necesitamos tu contraseña actual para cambiarla.
//                   </p>
//                   <div className="space-y-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Contraseña Actual *
//                       </label>
//                       <div className="relative">
//                         <input
//                           type={showPassword ? "text" : "password"}
//                           value={passwordData.currentPassword}
//                           onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
//                           placeholder="Ingresa tu contraseña actual"
//                           disabled={changingPassword}
//                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
//                         />
//                         <button
//                           type="button"
//                           onClick={() => setShowPassword(!showPassword)}
//                           className="absolute inset-y-0 right-0 pr-3 flex items-center"
//                         >
//                           {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
//                         </button>
//                       </div>
//                     </div>
                    
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Nueva Contraseña *
//                       </label>
//                       <input
//                         type={showPassword ? "text" : "password"}
//                         value={passwordData.newPassword}
//                         onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
//                         placeholder="Ingresa tu nueva contraseña (mínimo 6 caracteres)"
//                         disabled={changingPassword}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                       />
//                     </div>
                    
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Confirmar Nueva Contraseña *
//                       </label>
//                       <input
//                         type={showPassword ? "text" : "password"}
//                         value={passwordData.confirmPassword}
//                         onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
//                         placeholder="Confirma tu nueva contraseña"
//                         disabled={changingPassword}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                       />
//                     </div>
                    
//                     <button
//                       onClick={handlePasswordChange}
//                       disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
//                       className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//                     >
//                       {changingPassword ? (
//                         <>
//                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//                           Cambiando...
//                         </>
//                       ) : (
//                         <>
//                           <Shield className="w-4 h-4" />
//                           Cambiar Contraseña
//                         </>
//                       )}
//                     </button>
//                   </div>
//                 </div>
                
//                 {/* Two Factor Auth */}
//                 <div className="border border-gray-200 rounded-lg p-4">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <h4 className="text-md font-medium text-gray-900">Autenticación de Dos Factores</h4>
//                       <p className="text-sm text-gray-600 mt-1">
//                         Agrega una capa extra de seguridad a tu cuenta
//                       </p>
//                     </div>
//                     <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
//                       {security?.two_factor_enabled ? 'Desactivar' : 'Activar'}
//                     </button>
//                   </div>
//                 </div>
                
//                 {/* Login History */}
//                 <div className="border border-gray-200 rounded-lg p-4">
//                   <h4 className="text-md font-medium text-gray-900 mb-2">Historial de Acceso</h4>
//                   <p className="text-sm text-gray-600">
//                     Última contraseña cambiada: {security?.password_last_changed ? 
//                       new Date(security.password_last_changed).toLocaleDateString('es-ES') : 
//                       'No disponible'
//                     }
//                   </p>
//                 </div>
//               </div>
//             )}

//             {/* Subscriptions Tab */}
//             {activeTab === 'subscriptions' && (
//               <div className="p-6">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-6">💳 Gestión de Suscripciones</h3>
                
//                 {/* Current Plan Status */}
//                 <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white mb-6">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <h3 className="text-xl font-semibold">Plan Actual: Premium</h3>
//                       <p className="opacity-90">Activo hasta 1 de octubre de 2024</p>
//                     </div>
//                     <div className="text-right">
//                       <div className="text-2xl font-bold">$500000</div>
//                       <div className="opacity-90">por mes</div>
//                     </div>
//                   </div>
                  
//                   {/* Usage Stats */}
//                   <div className="grid grid-cols-2 gap-4 mt-6">
//                     <div className="bg-white/20 rounded-lg p-4">
//                       <div className="text-sm opacity-90">Conversaciones este mes</div>
//                       <div className="text-2xl font-bold">3</div>
//                       <div className="text-sm opacity-75">de 4000</div>
//                     </div>
//                     <div className="bg-white/20 rounded-lg p-4">
//                       <div className="text-sm opacity-90">Citas este mes</div>
//                       <div className="text-2xl font-bold">2</div>
//                       <div className="text-sm opacity-75">de 100</div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Subscription Tabs */}
//                 <div className="border-b border-gray-200 mb-6">
//                   <nav className="-mb-px flex space-x-8">
//                     {[
//                       { id: 'plans', label: 'Planes', icon: Star },
//                       { id: 'payment', label: 'Métodos de Pago', icon: CreditCard },
//                       { id: 'billing', label: 'Historial de Pagos', icon: Calendar }
//                     ].map(subtab => {
//                       const Icon = subtab.icon;
//                       return (
//                         <button
//                           key={subtab.id}
//                           onClick={() => setActiveSubTab(subtab.id)}
//                           className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
//                             activeSubTab === subtab.id
//                               ? 'border-blue-500 text-blue-600'
//                               : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                           }`}
//                         >
//                           <Icon className="w-4 h-4" />
//                           {subtab.label}
//                         </button>
//                       );
//                     })}
//                   </nav>
//                 </div>

//                 {/* Plans Section */}
//                 {activeSubTab === 'plans' && (
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//                   {[
//                     {
//                       id: 'basic',
//                       name: 'Básico',
//                       price: 49000,
//                       features: [
//                         '100 conversaciones/mes',
//                         '10 citas programadas/mes', 
//                         'Análisis básico',
//                         'Soporte por email',
//                         '1 usuario'
//                       ],
//                       popular: false,
//                       current: false
//                     },
//                     {
//                       id: 'premium',
//                       name: 'Premium',
//                       price: 149000,
//                       features: [
//                         '500 conversaciones/mes',
//                         '50 citas programadas/mes',
//                         'Análisis avanzado', 
//                         'Soporte prioritario',
//                         '5 usuarios',
//                         'Integraciones avanzadas'
//                       ],
//                       popular: true,
//                       current: true
//                     },
//                     {
//                       id: 'enterprise',
//                       name: 'Enterprise',
//                       price: 299000,
//                       features: [
//                         'Conversaciones ilimitadas',
//                         'Citas ilimitadas',
//                         'Análisis completo + IA',
//                         'Soporte 24/7',
//                         'Usuarios ilimitados',
//                         'API personalizada'
//                       ],
//                       popular: false,
//                       current: false
//                     }
//                   ].map(plan => (
//                     <div
//                       key={plan.id}
//                       className={`relative bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-lg ${
//                         plan.popular 
//                           ? 'border-purple-500 ring-2 ring-purple-500 ring-opacity-20' 
//                           : 'border-gray-200 hover:border-gray-300'
//                       }`}
//                     >
//                       {plan.popular && (
//                         <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
//                           <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
//                             Más Popular
//                           </span>
//                         </div>
//                       )}
                      
//                       <div className="p-6">
//                         {/* Plan Header */}
//                         <div className="text-center mb-6">
//                           <div className={`inline-flex p-3 rounded-full ${
//                             plan.id === 'basic' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
//                             plan.id === 'premium' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
//                             'bg-gradient-to-r from-gray-800 to-gray-900'
//                           } text-white mb-4`}>
//                             {plan.id === 'basic' && <Zap className="w-8 h-8" />}
//                             {plan.id === 'premium' && <Crown className="w-8 h-8" />}
//                             {plan.id === 'enterprise' && <Star className="w-8 h-8" />}
//                           </div>
//                           <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
//                           <div className="mt-2">
//                             <span className="text-3xl font-bold text-gray-900">
//                               ${plan.price.toLocaleString('es-CO')}
//                             </span>
//                             <span className="text-gray-600 ml-1">/mes</span>
//                           </div>
//                         </div>

//                         {/* Features */}
//                         <ul className="space-y-3 mb-6">
//                           {plan.features.map((feature, index) => (
//                             <li key={index} className="flex items-center gap-3">
//                               <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
//                               <span className="text-gray-600">{feature}</span>
//                             </li>
//                           ))}
//                         </ul>

//                         {/* Action Button */}
//                         <button
//                           disabled={plan.current}
//                           className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
//                             plan.current
//                               ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
//                               : plan.popular
//                               ? 'bg-purple-600 hover:bg-purple-700 text-white'
//                               : 'bg-gray-900 hover:bg-gray-800 text-white'
//                           }`}
//                         >
//                           {plan.current ? (
//                             <div className="flex items-center justify-center gap-2">
//                               <CheckCircle className="w-4 h-4" />
//                               Plan Actual
//                             </div>
//                           ) : (
//                             <div className="flex items-center justify-center gap-2">
//                               Seleccionar Plan
//                               <ArrowRight className="w-4 h-4" />
//                             </div>
//                           )}
//                         </button>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//                 )}

//                 {/* Payment Methods Section */}
//                 {activeSubTab === 'payment' && (
//                 <div className="bg-gray-50 rounded-xl p-6 mb-6">
//                   <div className="flex items-center justify-between mb-6">
//                     <h4 className="text-lg font-semibold text-gray-900">Métodos de Pago</h4>
//                     <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
//                       Agregar Método
//                     </button>
//                   </div>

//                   <div className="space-y-4">
//                     {[
//                       {
//                         id: 'pm_1',
//                         type: 'card',
//                         card: { brand: 'visa', last4: '4242', expMonth: 12, expYear: 2025 },
//                         isDefault: true
//                       },
//                       {
//                         id: 'pm_2', 
//                         type: 'nequi',
//                         nequi: { phone: '*****1234' },
//                         isDefault: false
//                       }
//                     ].map(method => (
//                       <div
//                         key={method.id}
//                         className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
//                           method.isDefault 
//                             ? 'border-green-200 bg-green-50' 
//                             : 'border-gray-200 bg-white'
//                         }`}
//                       >
//                         <div className="flex items-center gap-4">
//                           <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
//                             <CreditCard className="w-6 h-6 text-gray-600" />
//                           </div>
//                           <div>
//                             {method.type === 'card' ? (
//                               <>
//                                 <div className="font-medium text-gray-900">
//                                   **** **** **** {method.card.last4}
//                                 </div>
//                                 <div className="text-sm text-gray-600">
//                                   {method.card.brand.toUpperCase()} • Expira {method.card.expMonth}/{method.card.expYear}
//                                 </div>
//                               </>
//                             ) : (
//                               <>
//                                 <div className="font-medium text-gray-900">Nequi</div>
//                                 <div className="text-sm text-gray-600">{method.nequi.phone}</div>
//                               </>
//                             )}
//                             {method.isDefault && (
//                               <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 mt-1">
//                                 <Check className="w-3 h-3 mr-1" />
//                                 Por defecto
//                               </span>
//                             )}
//                           </div>
//                         </div>
                        
//                         <div className="flex items-center gap-2">
//                           {!method.isDefault && (
//                             <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
//                               Hacer predeterminado
//                             </button>
//                           )}
//                           <button className="text-red-600 hover:text-red-800 text-sm font-medium">
//                             Eliminar
//                           </button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//                 )}

//                 {/* Billing History Section */}
//                 {activeSubTab === 'billing' && (
//                 <div className="bg-white rounded-xl shadow-sm border border-gray-200">
//                   <div className="p-6 border-b border-gray-200">
//                     <h4 className="text-lg font-semibold text-gray-900">Historial de Facturación</h4>
//                   </div>
                  
//                   <div className="overflow-x-auto">
//                     <table className="min-w-full divide-y divide-gray-200">
//                       <thead className="bg-gray-50">
//                         <tr>
//                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                             Fecha
//                           </th>
//                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                             Plan
//                           </th>
//                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                             Monto
//                           </th>
//                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                             Estado
//                           </th>
//                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                             Acciones
//                           </th>
//                         </tr>
//                       </thead>
//                       <tbody className="bg-white divide-y divide-gray-200">
//                         {[
//                           { date: '1 Sep 2024', plan: 'Premium', amount: 149000, status: 'paid' },
//                           { date: '1 Ago 2024', plan: 'Premium', amount: 149000, status: 'paid' },
//                           { date: '1 Jul 2024', plan: 'Básico', amount: 49000, status: 'paid' }
//                         ].map((invoice, index) => (
//                           <tr key={index} className="hover:bg-gray-50">
//                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                               {invoice.date}
//                             </td>
//                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                               {invoice.plan}
//                             </td>
//                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                               ${invoice.amount.toLocaleString('es-CO')}
//                             </td>
//                             <td className="px-6 py-4 whitespace-nowrap">
//                               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
//                                 Pagado
//                               </span>
//                             </td>
//                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                               <button className="text-blue-600 hover:text-blue-900 mr-3">
//                                 Descargar
//                               </button>
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//                 )}
//               </div>
//             )}

//             {/* Preferences Tab */}
//             {activeTab === 'preferences' && (
//               <div className="p-6">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-6">Preferencias Generales</h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Idioma
//                     </label>
//                     <select
//                       value={preferences.language || 'es'}
//                       onChange={(e) => handlePreferenceChange('language', e.target.value)}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     >
//                       <option value="es">Español</option>
//                       <option value="en">English</option>
//                     </select>
//                   </div>
                  
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Zona Horaria
//                     </label>
//                     <select
//                       value={preferences.timezone || 'America/Bogota'}
//                       onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     >
//                       <option value="America/Bogota">Bogotá (GMT-5)</option>
//                       <option value="America/New_York">Nueva York (GMT-5)</option>
//                       <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
//                       <option value="America/Lima">Lima (GMT-5)</option>
//                       <option value="America/Santiago">Santiago (GMT-3)</option>
//                     </select>
//                   </div>
                  
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Formato de Fecha
//                     </label>
//                     <select
//                       value={preferences.date_format || 'DD/MM/YYYY'}
//                       onChange={(e) => handlePreferenceChange('date_format', e.target.value)}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     >
//                       <option value="DD/MM/YYYY">DD/MM/YYYY</option>
//                       <option value="MM/DD/YYYY">MM/DD/YYYY</option>
//                       <option value="YYYY-MM-DD">YYYY-MM-DD</option>
//                     </select>
//                   </div>
                  
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Formato de Hora
//                     </label>
//                     <select
//                       value={preferences.time_format || '24h'}
//                       onChange={(e) => handlePreferenceChange('time_format', e.target.value)}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     >
//                       <option value="24h">24 horas (14:30)</option>
//                       <option value="12h">12 horas (2:30 PM)</option>
//                     </select>
//                   </div>
                  
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Moneda
//                     </label>
//                     <select
//                       value={preferences.currency || 'COP'}
//                       onChange={(e) => handlePreferenceChange('currency', e.target.value)}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     >
//                       <option value="COP">Peso Colombiano (COP)</option>
//                       <option value="USD">Dólar Americano (USD)</option>
//                       <option value="EUR">Euro (EUR)</option>
//                       <option value="MXN">Peso Mexicano (MXN)</option>
//                     </select>
//                   </div>
                  
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Tema
//                     </label>
//                     <select
//                       value={preferences.theme || 'light'}
//                       onChange={(e) => handlePreferenceChange('theme', e.target.value)}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     >
//                       <option value="light">Claro</option>
//                       <option value="dark">Oscuro</option>
//                       <option value="auto">Automático</option>
//                     </select>
//                   </div>
//                 </div>
                
//                 <div className="mt-6 flex justify-end">
//                   <button
//                     onClick={handleSavePreferences}
//                     disabled={saving}
//                     className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
//                   >
//                     <Save className="w-4 h-4" />
//                     {saving ? 'Guardando...' : 'Guardar Cambios'}
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Settings;














// import React, { useState, useEffect } from 'react';

// // Hook para usar el AuthContext (asumiendo que está disponible)
// const useAuth = () => {
//   const context = React.useContext(React.createContext(null));
//   // Si no hay contexto disponible, simular datos básicos
//   if (!context) {
//     console.warn('⚠️ AuthContext no disponible, usando localStorage directamente');
//     return {
//       token: localStorage.getItem('nexusvoz_token') || localStorage.getItem('access_token'),
//       user: null,
//       isAuthenticated: !!(localStorage.getItem('nexusvoz_token') || localStorage.getItem('access_token'))
//     };
//   }
//   return context;
// };

// const Settings = () => {
//   console.log('🚀 Settings component iniciando...');

//   // Usar el AuthContext
//   const { token: authToken, user: authUser, isAuthenticated } = useAuth();

//   const [user, setUser] = useState({
//     id: '',
//     name: '',
//     email: '',
//     phone: '',
//     address: ''
//   });

//   // Estados para cambio de contraseña
//   const [passwordData, setPasswordData] = useState({
//     currentPassword: '',
//     newPassword: '',
//     confirmPassword: ''
//   });

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [changingPassword, setChangingPassword] = useState(false);
//   const [message, setMessage] = useState('');
//   const [passwordMessage, setPasswordMessage] = useState('');
//   const [debugInfo, setDebugInfo] = useState({
//     hasToken: false,
//     tokenPreview: '',
//     userLoaded: false,
//     authContextData: null
//   });

//   // Función para obtener el token (priorizar AuthContext)
//   const getToken = () => {
//     console.log('🔑 Obteniendo token...');
    
//     // Prioridad 1: Token del AuthContext
//     if (authToken) {
//       console.log('✅ Token encontrado en AuthContext');
//       return authToken;
//     }
    
//     // Prioridad 2: nexusvoz_token de localStorage  
//     const nexusToken = localStorage.getItem('nexusvoz_token');
//     if (nexusToken) {
//       console.log('✅ Token encontrado en nexusvoz_token');
//       return nexusToken;
//     }
    
//     // Prioridad 3: access_token de localStorage
//     const accessToken = localStorage.getItem('access_token');
//     if (accessToken) {
//       console.log('✅ Token encontrado en access_token');
//       return accessToken;
//     }
    
//     console.log('❌ No se encontró token');
//     return null;
//   };

//   // Función para cargar datos del usuario
//   const loadUserData = async () => {
//     console.log('👤 Iniciando carga de datos de usuario...');
//     setLoading(true);
    
//     try {
//       const token = getToken();
      
//       if (!token) {
//         console.log('❌ No hay token disponible');
//         setLoading(false);
//         return;
//       }

//       setDebugInfo(prev => ({ 
//         ...prev, 
//         hasToken: true, 
//         tokenPreview: token.substring(0, 20) + '...',
//         authContextData: { 
//           hasAuthToken: !!authToken, 
//           hasAuthUser: !!authUser, 
//           isAuthenticated 
//         }
//       }));

//       console.log('📡 Haciendo petición a los endpoints de tu API...');
      
//       // Endpoints basados en tu documentación API (priorizando puerto 8000)
//       const endpoints = [
//         'http://localhost:8000/users/me',         // Prioridad 1: FastAPI típico
//         '/users/me',                              // Prioridad 2: Relativo 
//         'http://localhost:8000/users/me/full',    // Prioridad 3: Endpoint extendido
//         'http://localhost:3000/users/me',         // Prioridad 4: Puerto alternativo
//         '/users/me/full'                          // Prioridad 5: Endpoint extendido relativo
//       ];

//       let response = null;
//       let usedEndpoint = '';
//       let allErrors = [];

//       for (const endpoint of endpoints) {
//         try {
//           console.log(`🔄 Intentando endpoint: ${endpoint}`);
//           response = await fetch(endpoint, {
//             method: 'GET',
//             headers: {
//               'Authorization': `Bearer ${token}`,
//               'Content-Type': 'application/json'
//             }
//           });
          
//           console.log(`📊 Response status: ${response.status} para ${endpoint}`);
//           console.log(`📋 Response headers:`, response.headers.get('content-type'));
          
//           if (response.ok) {
//             // Verificar que la respuesta sea JSON
//             const contentType = response.headers.get('content-type');
//             if (contentType && contentType.includes('application/json')) {
//               usedEndpoint = endpoint;
//               console.log(`✅ Endpoint exitoso: ${endpoint}`);
//               break;
//             } else {
//               console.log(`⚠️ ${endpoint} devolvió ${response.status} pero no es JSON:`, contentType);
//               const text = await response.text();
//               console.log(`📝 Contenido recibido:`, text.substring(0, 200) + '...');
//               allErrors.push(`${endpoint}: Devolvió ${contentType || 'unknown'} en lugar de JSON`);
//             }
//           } else {
//             const text = await response.text();
//             console.log(`❌ Endpoint ${endpoint} falló: ${response.status}`);
//             console.log(`📝 Error content:`, text.substring(0, 200) + '...');
//             allErrors.push(`${endpoint}: ${response.status} - ${text.substring(0, 100)}`);
//           }
//         } catch (err) {
//           console.log(`💥 Error en endpoint ${endpoint}:`, err.message);
//           allErrors.push(`${endpoint}: ${err.message}`);
//         }
//       }

//       if (!response || !response.ok) {
//         console.log('📋 Resumen de todos los errores:');
//         allErrors.forEach((error, index) => {
//           console.log(`${index + 1}. ${error}`);
//         });
//         throw new Error(`Ningún endpoint funcionó. Errores: ${allErrors.slice(0, 2).join('; ')}`);
//       }

//       if (!response || !response.ok) {
//         throw new Error('Ningún endpoint de usuarios funcionó');
//       }

//       console.log('📊 Status de respuesta:', response.status, 'desde', usedEndpoint);

//       const userData = await response.json();
//       console.log('✅ Datos de usuario recibidos:', userData);
      
//       setUser({
//         id: userData.id || '',
//         name: userData.name || userData.full_name || userData.username || '',
//         email: userData.email || '',
//         phone: userData.phone || '',
//         address: userData.address || ''
//       });

//       setDebugInfo(prev => ({ ...prev, userLoaded: true }));
//       // Mensaje solo en caso de error, no para carga exitosa
      
//     } catch (error) {
//       console.log('💥 Error en la petición:', error);
//       setMessage(`Error de conexión: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Función para guardar cambios del perfil
//   const handleSave = async () => {
//     console.log('💾 Iniciando guardado...');
//     setSaving(true);
    
//     try {
//       const token = getToken();
      
//       if (!token) {
//         setMessage('No hay token de autenticación');
//         setSaving(false);
//         return;
//       }

//       // Endpoints para guardar basados en tu API (priorizando puerto 8000)
//       const endpoints = [
//         'http://localhost:8000/users/me',         // Prioridad 1: FastAPI típico
//         '/users/me',                              // Prioridad 2: Relativo
//         'http://localhost:3000/users/me'          // Prioridad 3: Alternativo
//       ];

//       let response = null;
//       let usedEndpoint = '';

//       for (const endpoint of endpoints) {
//         try {
//           console.log(`🔄 Intentando guardar en: ${endpoint}`);
//           response = await fetch(endpoint, {
//             method: 'PUT',
//             headers: {
//               'Authorization': `Bearer ${token}`,
//               'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//               name: user.name,
//               email: user.email,
//               phone: user.phone,
//               address: user.address
//             })
//           });
          
//           if (response.ok) {
//             usedEndpoint = endpoint;
//             console.log(`✅ Guardado exitoso en: ${endpoint}`);
//             break;
//           } else {
//             console.log(`❌ Guardar en ${endpoint} falló: ${response.status}`);
//           }
//         } catch (err) {
//           console.log(`💥 Error guardando en ${endpoint}:`, err.message);
//         }
//       }

//       if (response && response.ok) {
//         // Mensaje solo en caso de error, no para guardado exitoso
//         console.log('✅ Datos guardados');
//       } else {
//         throw new Error('No se pudo guardar en ningún endpoint');
//       }
      
//     } catch (error) {
//       console.log('💥 Error al guardar:', error);
//       setMessage(`Error al guardar: ${error.message}`);
//     } finally {
//       setSaving(false);
//     }
//   };

//   // Función para cambiar contraseña
//   const handlePasswordChange = async () => {
//     console.log('🔒 Iniciando cambio de contraseña...');
    
//     // Validaciones
//     if (!passwordData.currentPassword) {
//       setPasswordMessage('La contraseña actual es requerida');
//       return;
//     }
    
//     if (!passwordData.newPassword) {
//       setPasswordMessage('La nueva contraseña es requerida');
//       return;
//     }
    
//     if (passwordData.newPassword !== passwordData.confirmPassword) {
//       setPasswordMessage('Las contraseñas no coinciden');
//       return;
//     }
    
//     if (passwordData.newPassword.length < 6) {
//       setPasswordMessage('La nueva contraseña debe tener al menos 6 caracteres');
//       return;
//     }
    
//     setChangingPassword(true);
//     setPasswordMessage('');
    
//     try {
//       const token = getToken();
      
//       if (!token) {
//         setPasswordMessage('No hay token de autenticación');
//         setChangingPassword(false);
//         return;
//       }

//       // Endpoints para cambio de contraseña según tu API
//       const endpoints = [
//         'http://localhost:8000/auth/change-password',     // Prioridad 1: FastAPI típico
//         '/auth/change-password',                          // Prioridad 2: Relativo
//         'http://localhost:8000/users/change-password',    // Prioridad 3: Alternativo
//         '/users/change-password',                         // Prioridad 4: Alternativo relativo
//         'http://localhost:3000/auth/change-password'      // Prioridad 5: Puerto alternativo
//       ];

//       let response = null;
//       let usedEndpoint = '';
//       let allErrors = [];

//       for (const endpoint of endpoints) {
//         try {
//           console.log(`🔄 Intentando cambio de contraseña en: ${endpoint}`);
//           response = await fetch(endpoint, {
//             method: 'POST',
//             headers: {
//               'Authorization': `Bearer ${token}`,
//               'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//               old_password: passwordData.currentPassword,
//               new_password: passwordData.newPassword
//             })
//           });
          
//           console.log(`📊 Response status: ${response.status} para ${endpoint}`);
          
//           if (response.ok) {
//             usedEndpoint = endpoint;
//             console.log(`✅ Cambio de contraseña exitoso en: ${endpoint}`);
//             break;
//           } else {
//             const errorText = await response.text();
//             console.log(`❌ Cambio de contraseña en ${endpoint} falló: ${response.status}`);
//             console.log(`📝 Error content:`, errorText);
//             allErrors.push(`${endpoint}: ${response.status} - ${errorText}`);
//           }
//         } catch (err) {
//           console.log(`💥 Error en endpoint ${endpoint}:`, err.message);
//           allErrors.push(`${endpoint}: ${err.message}`);
//         }
//       }

//       if (response && response.ok) {
//         setPasswordMessage(`✅ Contraseña cambiada exitosamente`);
//         console.log('✅ Contraseña cambiada');
        
//         // Limpiar los campos de contraseña
//         setPasswordData({
//           currentPassword: '',
//           newPassword: '',
//           confirmPassword: ''
//         });
//       } else {
//         console.log('📋 Resumen de errores del cambio de contraseña:');
//         allErrors.forEach((error, index) => {
//           console.log(`${index + 1}. ${error}`);
//         });
        
//         // Verificar si es error de contraseña incorrecta
//         const hasUnauthorized = allErrors.some(error => error.includes('401') || error.includes('403'));
//         if (hasUnauthorized) {
//           setPasswordMessage('❌ Contraseña actual incorrecta');
//         } else {
//           setPasswordMessage(`❌ Error al cambiar contraseña: ${allErrors[0]?.split(' - ')[1] || 'Error desconocido'}`);
//         }
//       }
      
//     } catch (error) {
//       console.log('💥 Error al cambiar contraseña:', error);
//       setPasswordMessage(`❌ Error de conexión: ${error.message}`);
//     } finally {
//       setChangingPassword(false);
//     }
//   };

//   // Función para manejar cambios en inputs de perfil
//   const handleInputChange = (field, value) => {
//     setUser(prev => ({
//       ...prev,
//       [field]: value
//     }));
//   };

//   // Función para manejar cambios en inputs de contraseña
//   const handlePasswordInputChange = (field, value) => {
//     setPasswordData(prev => ({
//       ...prev,
//       [field]: value
//     }));
//     // Limpiar mensaje de error cuando el usuario empiece a escribir
//     if (passwordMessage) {
//       setPasswordMessage('');
//     }
//   };

//   // Cargar datos al montar el componente
//   useEffect(() => {
//     console.log('🔄 useEffect ejecutándose...');
//     console.log('🔍 AuthContext data:', { authToken: !!authToken, authUser: !!authUser, isAuthenticated });
//     loadUserData();
//   }, [authToken]); // Recargar si cambia el token del contexto

//   return (
//     <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
//       <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px' }}>
//         ⚙️ Configuración de Usuario
//       </h1>

//       {/* Mensaje de estado para perfil */}
//       {message && (
//         <div style={{
//           padding: '12px',
//           borderRadius: '6px',
//           marginBottom: '20px',
//           backgroundColor: message.includes('Error') ? '#f8d7da' : '#d4edda',
//           color: message.includes('Error') ? '#721c24' : '#155724',
//           border: `1px solid ${message.includes('Error') ? '#f5c6cb' : '#c3e6cb'}`
//         }}>
//           {message}
//         </div>
//       )}

//       {/* Formulario de perfil */}
//       <div style={{
//         backgroundColor: 'white',
//         borderRadius: '8px',
//         padding: '30px',
//         boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
//         marginBottom: '20px'
//       }}>
//         <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>👤 Información Personal</h2>
        
//         <div style={{ display: 'grid', gap: '20px' }}>
//           {/* Nombre */}
//           <div>
//             <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
//               Nombre
//             </label>
//             <input
//               type="text"
//               value={user.name}
//               onChange={(e) => handleInputChange('name', e.target.value)}
//               placeholder="Ingresa tu nombre completo"
//               disabled={loading}
//               style={{
//                 width: '100%',
//                 padding: '10px',
//                 border: '1px solid #ddd',
//                 borderRadius: '6px',
//                 fontSize: '16px',
//                 boxSizing: 'border-box'
//               }}
//             />
//           </div>

//           {/* Email */}
//           <div>
//             <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
//               Email
//             </label>
//             <input
//               type="email"
//               value={user.email}
//               onChange={(e) => handleInputChange('email', e.target.value)}
//               placeholder="tu@email.com"
//               disabled={loading}
//               style={{
//                 width: '100%',
//                 padding: '10px',
//                 border: '1px solid #ddd',
//                 borderRadius: '6px',
//                 fontSize: '16px',
//                 boxSizing: 'border-box'
//               }}
//             />
//           </div>

//           {/* Teléfono */}
//           <div>
//             <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
//               Teléfono
//             </label>
//             <input
//               type="tel"
//               value={user.phone}
//               onChange={(e) => handleInputChange('phone', e.target.value)}
//               placeholder="Número de teléfono"
//               disabled={loading}
//               style={{
//                 width: '100%',
//                 padding: '10px',
//                 border: '1px solid #ddd',
//                 borderRadius: '6px',
//                 fontSize: '16px',
//                 boxSizing: 'border-box'
//               }}
//             />
//           </div>

//           {/* Dirección */}
//           <div>
//             <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
//               Dirección
//             </label>
//             <textarea
//               value={user.address}
//               onChange={(e) => handleInputChange('address', e.target.value)}
//               placeholder="Dirección completa"
//               disabled={loading}
//               rows={3}
//               style={{
//                 width: '100%',
//                 padding: '10px',
//                 border: '1px solid #ddd',
//                 borderRadius: '6px',
//                 fontSize: '16px',
//                 boxSizing: 'border-box',
//                 resize: 'vertical'
//               }}
//             />
//           </div>
//         </div>

//         {/* Botón de guardar */}
//         <div style={{ marginTop: '30px', textAlign: 'right' }}>
//           <button
//             onClick={handleSave}
//             disabled={loading || saving}
//             style={{
//               backgroundColor: loading || saving ? '#6c757d' : '#28a745',
//               color: 'white',
//               border: 'none',
//               borderRadius: '6px',
//               padding: '12px 24px',
//               fontSize: '16px',
//               cursor: loading || saving ? 'not-allowed' : 'pointer',
//               display: 'inline-flex',
//               alignItems: 'center',
//               gap: '8px'
//             }}
//           >
//             {saving ? '⏳ Guardando...' : '💾 Guardar Cambios'}
//           </button>
//         </div>
//       </div>

//       {/* Sección de cambio de contraseña */}
//       <div style={{
//         backgroundColor: 'white',
//         borderRadius: '8px',
//         padding: '30px',
//         boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
//       }}>
//         <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>🔒 Cambiar Contraseña</h2>
//         <p style={{ color: '#6c757d', marginBottom: '20px', fontSize: '14px' }}>
//           Por tu seguridad, necesitamos tu contraseña actual para cambiarla.
//         </p>

//         {/* Mensaje de estado para contraseña */}
//         {passwordMessage && (
//           <div style={{
//             padding: '12px',
//             borderRadius: '6px',
//             marginBottom: '20px',
//             backgroundColor: passwordMessage.includes('❌') ? '#f8d7da' : '#d4edda',
//             color: passwordMessage.includes('❌') ? '#721c24' : '#155724',
//             border: `1px solid ${passwordMessage.includes('❌') ? '#f5c6cb' : '#c3e6cb'}`
//           }}>
//             {passwordMessage}
//           </div>
//         )}
        
//         <div style={{ display: 'grid', gap: '20px' }}>
//           <div>
//             <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
//               Contraseña Actual *
//             </label>
//             <input
//               type="password"
//               value={passwordData.currentPassword}
//               onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
//               placeholder="Ingresa tu contraseña actual"
//               disabled={changingPassword}
//               style={{
//                 width: '100%',
//                 padding: '10px',
//                 border: '1px solid #ddd',
//                 borderRadius: '6px',
//                 fontSize: '16px',
//                 boxSizing: 'border-box'
//               }}
//             />
//           </div>
          
//           <div>
//             <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
//               Nueva Contraseña *
//             </label>
//             <input
//               type="password"
//               value={passwordData.newPassword}
//               onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
//               placeholder="Ingresa tu nueva contraseña (mínimo 6 caracteres)"
//               disabled={changingPassword}
//               style={{
//                 width: '100%',
//                 padding: '10px',
//                 border: '1px solid #ddd',
//                 borderRadius: '6px',
//                 fontSize: '16px',
//                 boxSizing: 'border-box'
//               }}
//             />
//           </div>
          
//           <div>
//             <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
//               Confirmar Nueva Contraseña *
//             </label>
//             <input
//               type="password"
//               value={passwordData.confirmPassword}
//               onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
//               placeholder="Confirma tu nueva contraseña"
//               disabled={changingPassword}
//               style={{
//                 width: '100%',
//                 padding: '10px',
//                 border: '1px solid #ddd',
//                 borderRadius: '6px',
//                 fontSize: '16px',
//                 boxSizing: 'border-box'
//               }}
//             />
//           </div>
//         </div>

//         {/* Botón de cambiar contraseña */}
//         <div style={{ marginTop: '30px', textAlign: 'right' }}>
//           <button
//             onClick={handlePasswordChange}
//             disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
//             style={{
//               backgroundColor: changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword ? '#6c757d' : '#dc3545',
//               color: 'white',
//               border: 'none',
//               borderRadius: '6px',
//               padding: '12px 24px',
//               fontSize: '16px',
//               cursor: changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword ? 'not-allowed' : 'pointer',
//               display: 'inline-flex',
//               alignItems: 'center',
//               gap: '8px'
//             }}
//           >
//             {changingPassword ? '⏳ Cambiando...' : '🔒 Cambiar Contraseña'}
//           </button>
//         </div>
//       </div>

//       {/* Estado de carga */}
//       {loading && (
//         <div style={{
//           position: 'fixed',
//           top: '50%',
//           left: '50%',
//           transform: 'translate(-50%, -50%)',
//           backgroundColor: 'white',
//           padding: '20px',
//           borderRadius: '8px',
//           boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
//           zIndex: '1000'
//         }}>
//           ⏳ Cargando datos de usuario...
//         </div>
//       )}
//     </div>
//   );
// };

// export default Settings;



