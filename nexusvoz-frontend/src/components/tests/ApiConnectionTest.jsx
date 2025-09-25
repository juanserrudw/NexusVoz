import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';


const ApiConnectionTest = () => {
  const { user, token } = useAuth(); // Usa tu contexto de auth
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedTest, setSelectedTest] = useState('all');

  // Configuración de la API - ajusta según tu configuración
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const testEndpoints = [
    {
      name: 'Health Check',
      endpoint: '/health',
      method: 'GET',
      requiresAuth: false,
      category: 'system'
    },
    {
      name: 'Dashboard Stats',
      endpoint: '/api/v1/dashboard/stats',
      method: 'GET',
      requiresAuth: true,
      category: 'dashboard'
    },
    {
      name: 'User Profile',
      endpoint: '/users/me',
      method: 'GET',
      requiresAuth: true,
      category: 'auth'
    },
    {
      name: 'Leads List',
      endpoint: '/api/v1/leads',
      method: 'GET',
      requiresAuth: true,
      category: 'leads'
    },
    {
      name: 'Conversations List',
      endpoint: '/api/v1/conversations',
      method: 'GET',
      requiresAuth: true,
      category: 'conversations'
    },
    {
      name: 'Appointments List',
      endpoint: '/api/v1/appointments',
      method: 'GET',
      requiresAuth: true,
      category: 'appointments'
    }
  ];

  const testEndpoint = async (test) => {
    try {
      console.log(`🔄 Testing ${test.name}...`);
      
      const headers = {
        'Content-Type': 'application/json'
      };

      // Usar el token del contexto de auth
      if (test.requiresAuth && token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else if (test.requiresAuth && !token) {
        return {
          status: 'error',
          message: 'No hay token de acceso disponible',
          data: null
        };
      }

      const response = await fetch(`${API_BASE_URL}${test.endpoint}`, {
        method: test.method,
        headers
      });

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (response.ok) {
        console.log(`✅ ${test.name} - Success:`, data);
        return {
          status: 'success',
          statusCode: response.status,
          data: data,
          responseTime: Date.now()
        };
      } else {
        console.error(`❌ ${test.name} - Error ${response.status}:`, data);
        return {
          status: 'error',
          statusCode: response.status,
          message: data?.detail || data?.message || 'Error desconocido',
          data: data
        };
      }
    } catch (error) {
      console.error(`❌ ${test.name} - Network Error:`, error);
      return {
        status: 'error',
        message: `Error de conexión: ${error.message}`,
        data: null
      };
    }
  };

  const runTests = async (category = 'all') => {
    setLoading(true);
    setResults({});
    
    const testsToRun = category === 'all' 
      ? testEndpoints 
      : testEndpoints.filter(test => test.category === category);
    
    const newResults = {};
    
    for (const test of testsToRun) {
      const startTime = Date.now();
      const result = await testEndpoint(test);
      const endTime = Date.now();
      
      newResults[test.name] = {
        ...result,
        responseTime: endTime - startTime
      };
      
      setResults({ ...newResults });
      
      // Pausa pequeña entre tests
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const categories = ['all', 'system', 'auth', 'dashboard', 'leads', 'conversations', 'appointments'];

  useEffect(() => {
    // Test automático al cargar
    const runInitialTests = () => {
      runTests();
    };
    
    runInitialTests();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          🔍 Test de Conexión API
        </h1>
        <p className="mt-2 opacity-90">
          Verificando conectividad con los endpoints de NextusVoz
        </p>
        <div className="mt-3 text-sm opacity-75">
          <strong>API URL:</strong> {API_BASE_URL}
        </div>
        {user && (
          <div className="mt-1 text-sm opacity-75">
            <strong>Usuario:</strong> {user.email || user.username || 'Usuario autenticado'}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Categoría:</label>
            <select 
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => runTests(selectedTest)}
            disabled={loading}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              loading
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? '🔄 Probando...' : '🚀 Ejecutar Tests'}
          </button>
          
          {/* Botón de diagnóstico */}
          <button
            onClick={() => {
              const contextToken = token;
              const localToken = localStorage.getItem('nexusvoz_token');
              const accessToken = localStorage.getItem('access_token');
              const userData = localStorage.getItem('nexusvoz_user');
              
              console.log('=== DIAGNÓSTICO DE AUTH ===');
              console.log('Token del contexto:', contextToken);
              console.log('Token nexusvoz_token:', localToken);
              console.log('Token access_token:', accessToken);
              console.log('Usuario guardado:', userData);
              console.log('Usuario del contexto:', user);
              console.log('¿Está autenticado?:', !!user && !!contextToken);
              
              alert(`
                Contexto token: ${contextToken ? 'SÍ' : 'NO'}
                nexusvoz_token: ${localToken ? 'SÍ' : 'NO'}
                access_token: ${accessToken ? 'SÍ' : 'NO'}
                Usuario: ${user ? 'SÍ' : 'NO'}
                Revisa la consola para detalles
              `);
            }}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium"
          >
            🔍 Diagnóstico Auth
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {testEndpoints
          .filter(test => selectedTest === 'all' || test.category === selectedTest)
          .map((test) => {
            const result = results[test.name];
            
            return (
              <div 
                key={test.name}
                className={`border rounded-xl p-4 transition-all hover:shadow-lg ${
                  result ? getStatusColor(result.status) : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg">
                    {result ? getStatusIcon(result.status) : '⏳'} {test.name}
                  </h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                    {test.category}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Endpoint:</span> 
                    <code className="ml-1 px-1 bg-gray-100 rounded text-xs">
                      {test.method} {test.endpoint}
                    </code>
                  </div>

                  <div>
                    <span className="font-medium">Auth:</span>
                    {test.requiresAuth ? (
                      <span className={`ml-1 ${token ? 'text-green-600' : 'text-red-600'}`}>
                        {token ? 'Autenticado ✅' : 'Token faltante ❌'}
                      </span>
                    ) : (
                      <span className="ml-1 text-gray-600">No requerida</span>
                    )}
                  </div>

                  {result && (
                    <>
                      <div>
                        <span className="font-medium">Status:</span>
                        <span className="ml-1 capitalize">
                          {result.status}
                          {result.statusCode && ` (${result.statusCode})`}
                        </span>
                      </div>
                      
                      {result.responseTime && (
                        <div>
                          <span className="font-medium">Tiempo:</span>
                          <span className="ml-1">{result.responseTime}ms</span>
                        </div>
                      )}
                      
                      {result.message && (
                        <div className="text-xs text-red-600 mt-2">
                          {result.message}
                        </div>
                      )}
                      
                      {result.data && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-xs font-medium hover:text-blue-600">
                            📄 Ver respuesta
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-800 text-green-400 rounded text-xs overflow-auto max-h-32">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-800 mb-3">📋 Instrucciones de uso:</h3>
        <ul className="space-y-2 text-sm text-blue-700">
          <li>• Asegúrate de que tu API backend esté corriendo</li>
          <li>• Los tests con ✅ indican conexión exitosa</li>
          <li>• Los tests con ❌ muestran el error específico</li>
          <li>• Abre DevTools (F12) → Console para logs detallados</li>
          <li>• Revisa la pestaña Network para ver las peticiones HTTP</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiConnectionTest;






