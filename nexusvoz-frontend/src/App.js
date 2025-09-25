import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { FullPageLoader } from './components/common/LoadingSpinner';
import UserProfile from './components/profile/UserProfile';

// Layout Components
import HeaderNavigation from './components/layout/HeaderNavigation';

// Page Components (tus componentes existentes)
import LoginForm from './components/auth/LoginForm';
import Dashboard from './components/dashboard/Dashboard';
import Conversations from './components/conversations/Conversations';
import Appointments from './components/appointments/Appointments';
import Leads from './components/leads/Leads';
import Analytics from './components/analytics/Analytics';
import Settings from './components/settings/Settings';

// Nuevos componentes de Landing
import LandingPage from './components/landing/LandingPage';
import RegisterForm from './components/auth/RegisterForm';

const AppContent = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState('landing'); // SIEMPRE INICIA EN LANDING
  const [showLanding, setShowLanding] = useState(true);

  // ✅ LÓGICA CORREGIDA: Solo cambiar a dashboard si está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      // Si está autenticado, ir directo al dashboard
      setCurrentView('dashboard');
      setShowLanding(false);
    } else {
      // Si NO está autenticado, SIEMPRE mostrar landing primero
      setCurrentView('landing');
      setShowLanding(true);
      // Limpiar cualquier flag previo para asegurar que empiece desde landing
      localStorage.removeItem('nexusvoz_visited_landing');
    }
  }, [isAuthenticated]);

  const handleGoToLogin = () => {
    localStorage.setItem('nexusvoz_visited_landing', 'true');
    setCurrentView('login');
    setShowLanding(false);
  };

  const handleGoToRegister = () => {
    localStorage.setItem('nexusvoz_visited_landing', 'true');
    setCurrentView('register');
    setShowLanding(false);
  };

  const handleGoToLanding = () => {
    localStorage.removeItem('nexusvoz_visited_landing');
    setCurrentView('landing');
    setShowLanding(true);
  };

  const renderView = () => {
    console.log('Vista actual:', currentView);
    
    // Si no está autenticado, manejar vistas públicas
    if (!isAuthenticated) {
      switch (currentView) {
        case 'landing':
          return (
            <LandingPage 
              onGoToLogin={handleGoToLogin}
              onGoToRegister={handleGoToRegister}
            />
          );
        case 'register':
          return (
            <RegisterForm 
              onGoToLogin={() => setCurrentView('login')}
              onGoToLanding={handleGoToLanding}
            />
          );
        case 'login':
          return (
            <LoginForm 
              onGoToRegister={() => setCurrentView('register')}
              onGoToLanding={handleGoToLanding}
            />
          );
        default:
          // ✅ FALLBACK: Si por alguna razón hay una vista incorrecta, volver a landing
          return (
            <LandingPage 
              onGoToLogin={handleGoToLogin}
              onGoToRegister={handleGoToRegister}
            />
          );
      }
    }

    // Vistas autenticadas (tu lógica existente)
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'conversations':
        return <Conversations />;
      case 'appointments':
        return <Appointments />;
      case 'leads':
        return <Leads />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      case 'profile':
        console.log('Cargando UserProfile');
        return <UserProfile />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return <FullPageLoader text="Cargando aplicación..." />;
  }

  // Si estamos en la landing page, mostrarla sin el layout principal
  if (showLanding && currentView === 'landing') {
    return renderView();
  }

  // Si no está autenticado pero no está en landing, mostrar formularios sin layout
  if (!isAuthenticated && (currentView === 'login' || currentView === 'register')) {
    return renderView();
  }

  // Layout principal para usuarios autenticados
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <HeaderNavigation 
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={user}
        onGoToLanding={handleGoToLanding}
      />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 min-h-[calc(100vh-140px)]">
          <div className="p-6">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;








