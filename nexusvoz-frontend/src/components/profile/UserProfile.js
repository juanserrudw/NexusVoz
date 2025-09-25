import React, { useState, useEffect } from 'react';

// Hook para usar el AuthContext
const useAuth = () => {
  const context = React.useContext(React.createContext(null));
  if (!context) {
    return {
      token: localStorage.getItem('nexusvoz_token') || localStorage.getItem('access_token'),
      user: null,
      isAuthenticated: !!(localStorage.getItem('nexusvoz_token') || localStorage.getItem('access_token'))
    };
  }
  return context;
};

const UserProfile = () => {
  const { token: authToken, user: authUser, isAuthenticated } = useAuth();

  const [user, setUser] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    created_at: '',
    last_login: '',
    role: '',
    status: 'active'
  });

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalAppointments: 0,
    totalLeads: 0,
    memberSince: ''
  });

  // Función para obtener el token
  const getToken = () => {
    if (authToken) return authToken;
    const nexusToken = localStorage.getItem('nexusvoz_token');
    if (nexusToken) return nexusToken;
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) return accessToken;
    return null;
  };

  // Función para cargar datos del usuario
  const loadUserData = async () => {
    setLoading(true);
    
    try {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // Cargar perfil completo del usuario
      const endpoints = [
        'http://localhost:8000/users/me/full',
        'http://localhost:8000/users/me',
        '/users/me/full',
        '/users/me'
      ];

      let response = null;
      for (const endpoint of endpoints) {
        try {
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
              break;
            }
          }
        } catch (err) {
          continue;
        }
      }

      if (response && response.ok) {
        const userData = await response.json();
        
        setUser({
          id: userData.id || '',
          name: userData.name || userData.full_name || userData.username || 'Carlos Ortiz',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
          created_at: userData.created_at || userData.createdAt || '',
          last_login: userData.last_login || userData.lastLogin || '',
          role: userData.role || 'Usuario',
          status: userData.status || userData.is_active ? 'active' : 'inactive'
        });

        // Calcular estadísticas básicas
        const memberSinceDate = userData.created_at || userData.createdAt;
        let memberSince = '';
        
        if (memberSinceDate) {
          const date = new Date(memberSinceDate);
          memberSince = date.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        }

        setStats({
          totalConversations: userData.total_conversations || 0,
          totalAppointments: userData.total_appointments || 0,
          totalLeads: userData.total_leads || 0,
          memberSince: memberSince || 'No disponible'
        });
      }
      
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'No disponible';
    }
  };

  // Función para obtener las iniciales del usuario
  const getUserInitials = (name) => {
    if (!name) return 'CO';
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadUserData();
  }, [authToken]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px' }}>
        👤 Mi Perfil
      </h1>

      {/* Tarjeta principal del perfil */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '1px solid #eee'
        }}>
          {/* Avatar grande */}
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '28px',
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
          }}>
            {getUserInitials(user.name)}
          </div>

          <div>
            <h2 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              margin: '0 0 5px 0',
              color: '#2d3748'
            }}>
              {user.name}
            </h2>
            <p style={{ 
              color: '#718096', 
              margin: '0 0 5px 0',
              fontSize: '16px'
            }}>
              {user.email}
            </p>
            <div style={{
              display: 'inline-block',
              backgroundColor: user.status === 'active' ? '#48bb78' : '#ed8936',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}>
              {user.status === 'active' ? 'Activo' : 'Inactivo'}
            </div>
          </div>
        </div>

        {/* Información del perfil en grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          <div>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#4a5568',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              📧 Email
            </h3>
            <p style={{ 
              fontSize: '16px', 
              color: '#2d3748',
              margin: 0,
              backgroundColor: '#f7fafc',
              padding: '8px 12px',
              borderRadius: '6px'
            }}>
              {user.email || 'No especificado'}
            </p>
          </div>

          <div>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#4a5568',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              📱 Teléfono
            </h3>
            <p style={{ 
              fontSize: '16px', 
              color: '#2d3748',
              margin: 0,
              backgroundColor: '#f7fafc',
              padding: '8px 12px',
              borderRadius: '6px'
            }}>
              {user.phone || 'No especificado'}
            </p>
          </div>

          <div>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#4a5568',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              🏠 Dirección
            </h3>
            <p style={{ 
              fontSize: '16px', 
              color: '#2d3748',
              margin: 0,
              backgroundColor: '#f7fafc',
              padding: '8px 12px',
              borderRadius: '6px'
            }}>
              {user.address || 'No especificada'}
            </p>
          </div>

          <div>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#4a5568',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              👥 Rol
            </h3>
            <p style={{ 
              fontSize: '16px', 
              color: '#2d3748',
              margin: 0,
              backgroundColor: '#f7fafc',
              padding: '8px 12px',
              borderRadius: '6px'
            }}>
              {user.role}
            </p>
          </div>

          <div>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#4a5568',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              📅 Miembro desde
            </h3>
            <p style={{ 
              fontSize: '16px', 
              color: '#2d3748',
              margin: 0,
              backgroundColor: '#f7fafc',
              padding: '8px 12px',
              borderRadius: '6px'
            }}>
              {stats.memberSince}
            </p>
          </div>

          <div>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#4a5568',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              🕐 Último acceso
            </h3>
            <p style={{ 
              fontSize: '16px', 
              color: '#2d3748',
              margin: 0,
              backgroundColor: '#f7fafc',
              padding: '8px 12px',
              borderRadius: '6px'
            }}>
              {formatDate(user.last_login)}
            </p>
          </div>
        </div>
      </div>

      {/* Tarjeta de estadísticas */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '25px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: '#2d3748'
        }}>
          📊 Resumen de Actividad
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '20px',
            backgroundColor: '#f0f8ff',
            borderRadius: '10px',
            border: '1px solid #e1f5fe'
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#1976d2',
              marginBottom: '5px'
            }}>
              {stats.totalConversations}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#555',
              fontWeight: '500'
            }}>
              Conversaciones
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '20px',
            backgroundColor: '#f0fff4',
            borderRadius: '10px',
            border: '1px solid #c6f6d5'
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#38a169',
              marginBottom: '5px'
            }}>
              {stats.totalAppointments}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#555',
              fontWeight: '500'
            }}>
              Citas
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '20px',
            backgroundColor: '#fffaf0',
            borderRadius: '10px',
            border: '1px solid #fed7aa'
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#d69e2e',
              marginBottom: '5px'
            }}>
              {stats.totalLeads}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#555',
              fontWeight: '500'
            }}>
              Leads
            </div>
          </div>
        </div>
      </div>

      {/* CSS para la animación del spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default UserProfile;