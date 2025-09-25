import React, { useState, useEffect } from 'react';

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

const Settings = () => {
  console.log('🚀 Settings component iniciando...');

  // Usar el AuthContext
  const { token: authToken, user: authUser, isAuthenticated } = useAuth();

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
        'http://localhost:8000/users/me',         // Prioridad 1: FastAPI típico
        '/users/me',                              // Prioridad 2: Relativo 
        'http://localhost:8000/users/me/full',    // Prioridad 3: Endpoint extendido
        'http://localhost:3000/users/me',         // Prioridad 4: Puerto alternativo
        '/users/me/full'                          // Prioridad 5: Endpoint extendido relativo
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
          
          console.log(`📊 Response status: ${response.status} para ${endpoint}`);
          console.log(`📋 Response headers:`, response.headers.get('content-type'));
          
          if (response.ok) {
            // Verificar que la respuesta sea JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              usedEndpoint = endpoint;
              console.log(`✅ Endpoint exitoso: ${endpoint}`);
              break;
            } else {
              console.log(`⚠️ ${endpoint} devolvió ${response.status} pero no es JSON:`, contentType);
              const text = await response.text();
              console.log(`📝 Contenido recibido:`, text.substring(0, 200) + '...');
              allErrors.push(`${endpoint}: Devolvió ${contentType || 'unknown'} en lugar de JSON`);
            }
          } else {
            const text = await response.text();
            console.log(`❌ Endpoint ${endpoint} falló: ${response.status}`);
            console.log(`📝 Error content:`, text.substring(0, 200) + '...');
            allErrors.push(`${endpoint}: ${response.status} - ${text.substring(0, 100)}`);
          }
        } catch (err) {
          console.log(`💥 Error en endpoint ${endpoint}:`, err.message);
          allErrors.push(`${endpoint}: ${err.message}`);
        }
      }

      if (!response || !response.ok) {
        console.log('📋 Resumen de todos los errores:');
        allErrors.forEach((error, index) => {
          console.log(`${index + 1}. ${error}`);
        });
        throw new Error(`Ningún endpoint funcionó. Errores: ${allErrors.slice(0, 2).join('; ')}`);
      }

      if (!response || !response.ok) {
        throw new Error('Ningún endpoint de usuarios funcionó');
      }

      console.log('📊 Status de respuesta:', response.status, 'desde', usedEndpoint);

      const userData = await response.json();
      console.log('✅ Datos de usuario recibidos:', userData);
      
      setUser({
        id: userData.id || '',
        name: userData.name || userData.full_name || userData.username || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || ''
      });

      setDebugInfo(prev => ({ ...prev, userLoaded: true }));
      // Mensaje solo en caso de error, no para carga exitosa
      
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

      // Endpoints para guardar basados en tu API (priorizando puerto 8000)
      const endpoints = [
        'http://localhost:8000/users/me',         // Prioridad 1: FastAPI típico
        '/users/me',                              // Prioridad 2: Relativo
        'http://localhost:3000/users/me'          // Prioridad 3: Alternativo
      ];

      let response = null;
      let usedEndpoint = '';

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Intentando guardar en: ${endpoint}`);
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
            usedEndpoint = endpoint;
            console.log(`✅ Guardado exitoso en: ${endpoint}`);
            break;
          } else {
            console.log(`❌ Guardar en ${endpoint} falló: ${response.status}`);
          }
        } catch (err) {
          console.log(`💥 Error guardando en ${endpoint}:`, err.message);
        }
      }

      if (response && response.ok) {
        // Mensaje solo en caso de error, no para guardado exitoso
        console.log('✅ Datos guardados');
      } else {
        throw new Error('No se pudo guardar en ningún endpoint');
      }
      
    } catch (error) {
      console.log('💥 Error al guardar:', error);
      setMessage(`Error al guardar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Función para cambiar contraseña
  const handlePasswordChange = async () => {
    console.log('🔒 Iniciando cambio de contraseña...');
    
    // Validaciones
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

      // Endpoints para cambio de contraseña según tu API
      const endpoints = [
        'http://localhost:8000/auth/change-password',     // Prioridad 1: FastAPI típico
        '/auth/change-password',                          // Prioridad 2: Relativo
        'http://localhost:8000/users/change-password',    // Prioridad 3: Alternativo
        '/users/change-password',                         // Prioridad 4: Alternativo relativo
        'http://localhost:3000/auth/change-password'      // Prioridad 5: Puerto alternativo
      ];

      let response = null;
      let usedEndpoint = '';
      let allErrors = [];

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Intentando cambio de contraseña en: ${endpoint}`);
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
          
          console.log(`📊 Response status: ${response.status} para ${endpoint}`);
          
          if (response.ok) {
            usedEndpoint = endpoint;
            console.log(`✅ Cambio de contraseña exitoso en: ${endpoint}`);
            break;
          } else {
            const errorText = await response.text();
            console.log(`❌ Cambio de contraseña en ${endpoint} falló: ${response.status}`);
            console.log(`📝 Error content:`, errorText);
            allErrors.push(`${endpoint}: ${response.status} - ${errorText}`);
          }
        } catch (err) {
          console.log(`💥 Error en endpoint ${endpoint}:`, err.message);
          allErrors.push(`${endpoint}: ${err.message}`);
        }
      }

      if (response && response.ok) {
        setPasswordMessage(`✅ Contraseña cambiada exitosamente`);
        console.log('✅ Contraseña cambiada');
        
        // Limpiar los campos de contraseña
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        console.log('📋 Resumen de errores del cambio de contraseña:');
        allErrors.forEach((error, index) => {
          console.log(`${index + 1}. ${error}`);
        });
        
        // Verificar si es error de contraseña incorrecta
        const hasUnauthorized = allErrors.some(error => error.includes('401') || error.includes('403'));
        if (hasUnauthorized) {
          setPasswordMessage('❌ Contraseña actual incorrecta');
        } else {
          setPasswordMessage(`❌ Error al cambiar contraseña: ${allErrors[0]?.split(' - ')[1] || 'Error desconocido'}`);
        }
      }
      
    } catch (error) {
      console.log('💥 Error al cambiar contraseña:', error);
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
    // Limpiar mensaje de error cuando el usuario empiece a escribir
    if (passwordMessage) {
      setPasswordMessage('');
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    console.log('🔄 useEffect ejecutándose...');
    console.log('🔍 AuthContext data:', { authToken: !!authToken, authUser: !!authUser, isAuthenticated });
    loadUserData();
  }, [authToken]); // Recargar si cambia el token del contexto

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px' }}>
        ⚙️ Configuración de Usuario
      </h1>

      {/* Mensaje de estado para perfil */}
      {message && (
        <div style={{
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '20px',
          backgroundColor: message.includes('Error') ? '#f8d7da' : '#d4edda',
          color: message.includes('Error') ? '#721c24' : '#155724',
          border: `1px solid ${message.includes('Error') ? '#f5c6cb' : '#c3e6cb'}`
        }}>
          {message}
        </div>
      )}

      {/* Formulario de perfil */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>👤 Información Personal</h2>
        
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Nombre */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Nombre
            </label>
            <input
              type="text"
              value={user.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ingresa tu nombre completo"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Email
            </label>
            <input
              type="email"
              value={user.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="tu@email.com"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Teléfono */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Teléfono
            </label>
            <input
              type="tel"
              value={user.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Número de teléfono"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Dirección */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Dirección
            </label>
            <textarea
              value={user.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Dirección completa"
              disabled={loading}
              rows={3}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        {/* Botón de guardar */}
        <div style={{ marginTop: '30px', textAlign: 'right' }}>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            style={{
              backgroundColor: loading || saving ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '12px 24px',
              fontSize: '16px',
              cursor: loading || saving ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {saving ? '⏳ Guardando...' : '💾 Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Sección de cambio de contraseña */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>🔒 Cambiar Contraseña</h2>
        <p style={{ color: '#6c757d', marginBottom: '20px', fontSize: '14px' }}>
          Por tu seguridad, necesitamos tu contraseña actual para cambiarla.
        </p>

        {/* Mensaje de estado para contraseña */}
        {passwordMessage && (
          <div style={{
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px',
            backgroundColor: passwordMessage.includes('❌') ? '#f8d7da' : '#d4edda',
            color: passwordMessage.includes('❌') ? '#721c24' : '#155724',
            border: `1px solid ${passwordMessage.includes('❌') ? '#f5c6cb' : '#c3e6cb'}`
          }}>
            {passwordMessage}
          </div>
        )}
        
        <div style={{ display: 'grid', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Contraseña Actual *
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
              placeholder="Ingresa tu contraseña actual"
              disabled={changingPassword}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Nueva Contraseña *
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
              placeholder="Ingresa tu nueva contraseña (mínimo 6 caracteres)"
              disabled={changingPassword}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Confirmar Nueva Contraseña *
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
              placeholder="Confirma tu nueva contraseña"
              disabled={changingPassword}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Botón de cambiar contraseña */}
        <div style={{ marginTop: '30px', textAlign: 'right' }}>
          <button
            onClick={handlePasswordChange}
            disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            style={{
              backgroundColor: changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword ? '#6c757d' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '12px 24px',
              fontSize: '16px',
              cursor: changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {changingPassword ? '⏳ Cambiando...' : '🔒 Cambiar Contraseña'}
          </button>
        </div>
      </div>

      {/* Estado de carga */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: '1000'
        }}>
          ⏳ Cargando datos de usuario...
        </div>
      )}
    </div>
  );
};

export default Settings;



