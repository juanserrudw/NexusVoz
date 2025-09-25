import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Tu hook existente
import LoadingSpinner from '../components/ui/LoadingSpinner';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { register, loading } = useAuth(); // Usar tu contexto existente
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validaciones locales
    if (!formData.full_name || !formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Por favor completa todos los campos');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      // Usar tu método register existente
      const result = await register({
        full_name: formData.full_name,
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      
      if (result.success) {
        setSuccess(result.message || 'Cuenta creada exitosamente');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(result.error || 'Error al crear la cuenta');
      }
    } catch (error) {
      console.error('Register failed:', error);
      setError('Error inesperado al crear la cuenta');
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
          <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚀</span>
          </div>
          <h3 className="text-2xl font-bold mb-2 text-white">Únete a NexusVoz</h3>
          <p className="text-gray-300">Crea tu cuenta gratuita</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg">
            <p className="text-green-200 text-sm">{success}</p>
          </div>
        )}
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Nombre completo
            </label>
            <input 
              type="text" 
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-white placeholder-gray-400" 
              placeholder="Tu nombre completo"
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Nombre de usuario
            </label>
            <input 
              type="text" 
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-white placeholder-gray-400" 
              placeholder="usuario123"
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Email
            </label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-white placeholder-gray-400" 
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
              className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-white placeholder-gray-400" 
              placeholder="••••••••"
              disabled={loading}
              required
              minLength={6}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Confirmar Contraseña
            </label>
            <input 
              type="password" 
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-white placeholder-gray-400" 
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg font-semibold hover:shadow-lg transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                <span className="ml-2">Creando cuenta...</span>
              </>
            ) : (
              '🚀 Crear Cuenta'
            )}
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-400 mt-4">
          ¿Ya tienes cuenta? {' '}
          <Link to="/login" className="text-purple-400 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;