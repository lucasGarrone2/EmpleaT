import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import LandingPage from './pages/LandingPage';
import Register from './pages/Register';
import Login from './pages/Login';
import './App.css';
import PerfilCandidato from './pages/PerfilCandidato';
import MiPerfil from './pages/MiPerfil';
import Navbar from './components/Navbar';
import EmpresaDashboard from './pages/EmpresaDashboard';
import CrearOferta from './pages/CrearOferta';
import OfertaDetalleEmpresa from './pages/OfertaDetalleEmpresa';
import ListaOfertas from './pages/ListaOfertas';
import EditarOferta from './pages/EditarOferta';
import PerfilCandidatoParaEmpresa from './pages/PerfilCandidatoParaEmpresa';
import GoogleCallback from './pages/GoogleCallback';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import NotFound from './pages/NotFound';
import TerminosLegales from './pages/TerminosLegales';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import SkillQuiz from './pages/SkillQuiz';
import Pricing from './pages/Pricing';
import MisPostulaciones from './pages/MisPostulaciones';
import TermsOfService from './pages/TermsOfService';
import MisChats from './pages/MisChats';
import EmpresaAnalytics from './pages/EmpresaAnalytics';
import BusquedaCandidatos from './pages/BusquedaCandidatos';
import EmpresaPricing from './pages/EmpresaPricing';

function RecoveryGuard() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkRecovery = async () => {
      const isRecovering = sessionStorage.getItem('is_recovering_password') === 'true';
      const isResetPath = location.pathname === '/reset-password';

      if (isRecovering && !isResetPath) {
        // Forzamos cerrar sesión si el usuario en recuperación intenta navegar a otra ruta
        sessionStorage.removeItem('is_recovering_password');
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
      }
    };
    checkRecovery();
  }, [location.pathname, navigate]);

  return null;
}

function App() {
  return (
    <Router>
      <div className="App">
        <RecoveryGuard />
        <Navbar />
        <Routes>
          {/* Rutas públicas accesibles para todos */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/callback" element={<GoogleCallback/>} />
          <Route path="/terminos-legales" element={<TerminosLegales/>} />
          <Route path="/terms-of-service" element={<TermsOfService/>} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/pricing-empresa" element={<EmpresaPricing />} />

          {/* Rutas exclusivas para invitados (no logueados) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Rutas para cualquier autenticado */}
          <Route element={<ProtectedRoute />}>
            <Route path="/mis-chats" element={<MisChats />} />
          </Route>

          {/* Rutas protegidas: solo candidatos */}
          <Route element={<ProtectedRoute requiredRole="candidato" />}>
            <Route path="/ofertas" element={<ListaOfertas />} />
            <Route path="/perfil" element={<PerfilCandidato />} />
            <Route path="/mi-perfil" element={<MiPerfil />} />
            <Route path="/quiz/:skill" element={<SkillQuiz />} />
            <Route path="/mis-postulaciones" element={<MisPostulaciones />} />
          </Route>

          {/* Rutas protegidas: solo empresas */}
          <Route element={<ProtectedRoute requiredRole="empresa" />}>
            <Route path="/dashboard-empresa" element={<EmpresaDashboard />} />
            <Route path="/crear-oferta" element={<CrearOferta />} />
            <Route path="/editar-oferta/:id" element={<EditarOferta />} />
            <Route path="/oferta-empresa/:id" element={<OfertaDetalleEmpresa />} />
            <Route path="/oferta-empresa/:ofertaId/candidato/:candidatoId" element={<PerfilCandidatoParaEmpresa />} />
            <Route path="/empresa-analytics/:ofertaId" element={<EmpresaAnalytics />} />
            <Route path="/buscar-candidatos" element={<BusquedaCandidatos />} />
          </Route>

          {/* Rutas protegidas: solo administradores */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Ruta 404: cualquier path no reconocido */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
