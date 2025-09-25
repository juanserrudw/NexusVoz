import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/api'; // ✅ Esto debería funcionar ahora

// Crear el contexto
const AuthContext = createContext(null);

// Provider component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Escuchar eventos de logout
  useEffect(() => {
    const handleLogout = () => {
      console.log('🔄 Evento logout detectado');
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  useEffect(() => {
    console.log('🔄 Inicializando AuthContext...');
    
    // Verificar tokens guardados
    const storedToken = localStorage.getItem('nexusvoz_token');
    const storedAccessToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('nexusvoz_user');
    
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
      console.log('✅ Token encontrado en localStorage');

    if (!storedAccessToken) {
      console.log('🔄 Copiando nexusvoz_token a access_token');
      localStorage.setItem('access_token', storedToken);
    }
      
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          console.log('✅ Usuario cargado:', userData);
        } catch (e) {
          console.error('❌ Error parsing user data:', e);
          localStorage.removeItem('nexusvoz_user');
        }
      } else {
        // Si tenemos token pero no usuario, intentar obtenerlo
        fetchUserProfile().then(result => {
          if (!result.success) {
            console.log('⚠️ No se pudo obtener perfil del usuario');
          }
        });
      }
    }
    
    setLoading(false);
    console.log('✅ AuthContext inicializado');
  }, []);

  // ✅ LOGIN USANDO EL MÉTODO CORRECTO
  const login = async (email, password) => {
    try {
      setLoading(true);
      console.log('🔄 Procesando login...', { email });
      
      // Validación básica
      if (!email || !password) {
        return { success: false, error: 'Email y contraseña son requeridos' };
      }
      
      if (password.length < 6) {
        return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
      }

      // ✅ INTENTAR PRIMERO CON EL MÉTODO /login (más simple)
      let data;
      try {
        console.log('🔄 Intentando con /login endpoint...');
        data = await authService.loginUser(email, password);
        console.log('✅ Login con /login exitoso:', data);
      } catch (loginError) {
        console.log('⚠️ /login falló, intentando con /token...', loginError.message);
        
        // Si falla, intentar con OAuth2
        try {
          data = await authService.login(email, password);
          console.log('✅ Login con /token exitoso:', data);
        } catch (tokenError) {
          console.error('❌ Ambos métodos fallaron:', { loginError, tokenError });
          throw tokenError; // Lanzar el último error
        }
      }
      
      // ✅ EXTRAER EL TOKEN CORRECTAMENTE
      const authToken = data.access_token || data.token;
      
      if (!authToken) {
        console.error('❌ Token no encontrado en respuesta:', data);
        return { success: false, error: 'Token no recibido del servidor' };
      }
      
      // Guardar token inmediatamente
      localStorage.setItem('nexusvoz_token', authToken);
      localStorage.setItem('access_token', authToken);  // ← AGREGAR ESTA LÍNEA
      setToken(authToken);
      setIsAuthenticated(true);
      
      // ✅ OBTENER DATOS DEL USUARIO
      let userData = null;
      try {
        console.log('🔄 Obteniendo perfil del usuario...');
        userData = await authService.getProfile();
        console.log('✅ Perfil obtenido:', userData);
        
        // Guardar usuario
        localStorage.setItem('nexusvoz_user', JSON.stringify(userData));
        setUser(userData);
      } catch (profileError) {
        console.warn('⚠️ No se pudo obtener perfil del usuario:', profileError);
        // No es crítico, podemos continuar sin los datos del usuario
      }
      
      console.log('✅ Login completado exitosamente');
      return { success: true, user: userData, token: authToken };
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      
      // Limpiar estado en caso de error
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      localStorage.removeItem('nexusvoz_token');
      localStorage.removeItem('nexusvoz_user');
      
      // Manejar errores específicos de la API
      if (error.status === 401) {
        return { success: false, error: 'Email o contraseña incorrectos' };
      } else if (error.status === 422) {
        return { success: false, error: 'Datos de login inválidos' };
      } else if (error.status === 0 || error.message?.includes('fetch')) {
        return { success: false, error: 'No se pudo conectar con el servidor. Verifica que esté ejecutándose en http://localhost:8000' };
      }
      
      return { success: false, error: error.message || 'Error de conexión con el servidor' };
    } finally {
      setLoading(false);
    }
  };

  // ✅ REGISTRO USANDO AUTHSERVICE
  const register = async (userData) => {
    try {
      setLoading(true);
      console.log('🔄 Procesando registro...', { 
        email: userData.email, 
        username: userData.username 
      });
      
      // Validaciones
      if (!userData.email || !userData.password || !userData.username || !userData.full_name) {
        return { success: false, error: 'Todos los campos son requeridos' };
      }
      
      if (userData.password.length < 6) {
        return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
      }
      
      if (userData.username.length < 3) {
        return { success: false, error: 'El nombre de usuario debe tener al menos 3 caracteres' };
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        return { success: false, error: 'Email inválido' };
      }

      // ✅ USAR EL AUTHSERVICE
      const data = await authService.register({
        email: userData.email,
        password: userData.password,
        username: userData.username,
        full_name: userData.full_name
      });
      
      console.log('✅ Registro exitoso:', data);
      return { 
        success: true, 
        message: data.message || 'Usuario registrado exitosamente. Ahora puedes iniciar sesión.',
        data: data
      };
      
    } catch (error) {
      console.error('❌ Error en registro:', error);
      
      // Manejar errores específicos
      if (error.status === 400 || error.status === 409) {
        return { success: false, error: 'El email o username ya está en uso' };
      } else if (error.status === 422) {
        const errorDetail = error.data?.detail;
        if (Array.isArray(errorDetail)) {
          const fieldErrors = errorDetail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
          return { success: false, error: `Datos inválidos: ${fieldErrors}` };
        }
        return { success: false, error: 'Datos de registro inválidos' };
      } else if (error.status === 0 || error.message?.includes('fetch')) {
        return { success: false, error: 'No se pudo conectar con el servidor. Verifica que esté ejecutándose.' };
      }
      
      return { success: false, error: error.message || 'Error de conexión con el servidor' };
    } finally {
      setLoading(false);
    }
  };

  // ✅ VERIFICAR TOKEN
  const verifyToken = async () => {
    if (!token) {
      console.log('⚠️ No hay token para verificar');
      return false;
    }
    
    try {
      console.log('🔄 Verificando token...');
      await authService.getProfile(); // Usar getProfile en lugar de validateToken
      console.log('✅ Token válido');
      return true;
    } catch (error) {
      console.error('❌ Token inválido:', error);
      if (error.status === 401) {
        console.log('🚪 Token expirado, cerrando sesión...');
        logout();
        return false;
      }
      return false;
    }
  };

  // ✅ OBTENER PERFIL DEL USUARIO
  const fetchUserProfile = async () => {
    if (!token) {
      console.log('⚠️ No hay token para obtener perfil');
      return { success: false, error: 'No hay token' };
    }
    
    try {
      console.log('🔄 Obteniendo perfil del usuario...');
      const userData = await authService.getProfile();
      
      setUser(userData);
      localStorage.setItem('nexusvoz_user', JSON.stringify(userData));
      
      console.log('✅ Perfil obtenido exitosamente:', userData);
      return { success: true, user: userData };
    } catch (error) {
      console.error('❌ Error obteniendo perfil:', error);
      if (error.status === 401) {
        console.log('🚪 Sesión expirada al obtener perfil');
        logout();
        return { success: false, error: 'Sesión expirada' };
      }
      return { success: false, error: error.message || 'Error de conexión' };
    }
  };

  // ✅ LOGOUT MEJORADO
  const logout = () => {
    console.log('🚪 Cerrando sesión...');
    
    // Usar el método del authService si existe
    try {
      authService.logout();
    } catch (error) {
      console.warn('⚠️ Error en logout del servicio:', error);
    }
    
    // Limpiar localStorage (redundante pero seguro)
    localStorage.removeItem('nexusvoz_token');
    localStorage.removeItem('nexusvoz_user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Limpiar estado
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    
    console.log('✅ Sesión cerrada completamente');
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    verifyToken,
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook para usar el contexto
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

// Exports
export { AuthProvider, AuthContext };
export default AuthProvider;








