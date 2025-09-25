import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage'; // Tu página de login existente
import RegisterPage from './pages/RegisterPage'; // Tu página de registro existente
import Dashboard from './pages/Dashboard'; // Tu dashboard existente
import ProtectedRoute from './components/auth/ProtectedRoute'; // Si tienes protección de rutas
import './index.css'; // Importar estilos globales

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Página de landing pública */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Páginas de autenticación */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Rutas protegidas de NexusVoz */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;