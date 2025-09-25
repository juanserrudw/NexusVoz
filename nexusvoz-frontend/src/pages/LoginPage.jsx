import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Tu hook existente
import LoadingSpinner from '../components/ui/LoadingSpinner';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  
  const { login, loading } = useAuth(); // Usar tu contexto existente
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Por favor completa todos los campos');
      return;
    }

    try {
      setError('');
      
      // Usar tu método login existente
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError('Error inesperado al iniciar sesión');
    }
  };

  const goToLanding = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 relative">
      <button 
        onClick={goToLanding}
        className="absolute top-4 left-4 text-white hover:text-blue-400 transition-colors flex items-center space-x-2"
      >
        <span>←</span>
        <span>Volver al inicio</span>
      </button>
      
      <div className="glass-effect rounded-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📞</span>
          </div>
          <h3 className="text-2xl font-bold mb-2 text-white">NexusVoz</h3>
          <p className="text-gray-300">Inicia sesión en tu cuenta</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Email
            </label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none text-white placeholder-gray-400" 
              placeholder="tu@email.com"
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Contraseña
            </label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none text-white placeholder-gray-400" 
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold hover:shadow-lg transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                <span className="ml-2">Iniciando sesión...</span>
              </>
            ) : (
              '→ Iniciar Sesión'
            )}
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-400 mt-4">
          ¿No tienes cuenta? {' '}
          <Link to="/register" className="text-blue-400 hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;