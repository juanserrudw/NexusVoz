import React, { useState } from 'react';
import { Phone, LogIn, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const LoginForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    full_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password);
        if (!result.success) {
          setError(result.error);
        }
      } else {
        const result = await register(formData);
        if (result.success) {
          // Mostrar mensaje de éxito
          setSuccessMessage('Usuario registrado exitosamente. Redirigiendo al login...');
          setError('');
          setFormData({ email: '', password: '', username: '', full_name: '' });
          
          // Redireccionar automáticamente después de 2 segundos
          setTimeout(() => {
            setIsLogin(true);
            setSuccessMessage('');
          }, 2000);
        } else {
          setError(result.error);
        }
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-400 to-purple-600 p-3 rounded-full">
              <Phone className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">NexusVoz</h1>
          <p className="text-blue-200">
            {isLogin ? 'Inicia sesión en tu cuenta' : 'Crea tu nueva cuenta'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
              <p className="text-green-200 text-sm">{successMessage}</p>
            </div>
          )}

          <div>
            <label className="block text-blue-200 text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              placeholder="tu@email.com"
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-blue-200 text-sm font-medium mb-2">
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="usuario123"
                />
              </div>
              <div>
                <label className="block text-blue-200 text-sm font-medium mb-2">
                  Nombre completo
                </label>
                <input
                  type="text"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Juan Pérez"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-blue-200 text-sm font-medium mb-2">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccessMessage('');
            }}
            className="text-blue-300 hover:text-blue-200 transition-colors"
          >
            {isLogin 
              ? '¿No tienes cuenta? Regístrate' 
              : '¿Ya tienes cuenta? Inicia sesión'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;