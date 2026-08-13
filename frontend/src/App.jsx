import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { supabase } from './supabase';
import './App.css';

// Carga Inmediata (Crítico para LCP en Landing)
import LandingPage from './pages/LandingPage';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';

// Dynamic Imports (Code Splitting por ruta)
const Register = lazy(() => import('./pages/Register'));
const Login = lazy(() => import('./pages/Login'));
const PerfilCandidato = lazy(() => import('./pages/PerfilCandidato'));
const MiPerfil = lazy(() => import('./pages/MiPerfil'));
const EmpresaDashboard = lazy(() => import('./pages/EmpresaDashboard'));
const CrearOferta = lazy(() => import('./pages/CrearOferta'));
const OfertaDetalleEmpresa = lazy(() => import('./pages/OfertaDetalleEmpresa'));
const ListaOfertas = lazy(() => import('./pages/ListaOfertas'));
const EditarOferta = lazy(() => import('./pages/EditarOferta'));
const PerfilCandidatoParaEmpresa = lazy(() => import('./pages/PerfilCandidatoParaEmpresa'));
const GoogleCallback = lazy(() => import('./pages/GoogleCallback'));
const NotFound = lazy(() => import('./pages/NotFound'));
const TerminosLegales = lazy(() => import('./pages/TerminosLegales'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const SkillQuiz = lazy(() => import('./pages/SkillQuiz'));
const Pricing = lazy(() => import('./pages/Pricing'));
const MisPostulaciones = lazy(() => import('./pages/MisPostulaciones'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const MisChats = lazy(() => import('./pages/MisChats'));
const EmpresaAnalytics = lazy(() => import('./pages/EmpresaAnalytics'));
const BusquedaCandidatos = lazy(() => import('./pages/BusquedaCandidatos'));
const EmpresaPricing = lazy(() => import('./pages/EmpresaPricing'));
const AceptarInvitacion = lazy(() => import('./pages/AceptarInvitacion'));

function RecoveryGuard() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkRecovery = async () => {
      const isRecovering = sessionStorage.getItem('is_recovering_password') === 'true';
      const isResetPath = location.pathname === '/reset-password';

      if (isRecovering && !isResetPath) {
        sessionStorage.removeItem('is_recovering_password');
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
      }

      const isAcceptingInvite = sessionStorage.getItem('is_accepting_invitation') === 'true';
      const isInvitePath = location.pathname === '/aceptar-invitacion';

      if (isAcceptingInvite && !isInvitePath) {
        sessionStorage.removeItem('is_accepting_invitation');
      }
    };
    checkRecovery();
  }, [location.pathname, navigate]);

  return null;
}

function LoadingFallback() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(79, 70, 229, 0.1)',
        borderRadius: '50%',
        borderTopColor: '#4f46e5',
        animation: 'spin 1s ease-in-out infinite'
      }} />
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Analytics />
        <SpeedInsights />
        <RecoveryGuard />
        <Navbar />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Rutas públicas accesibles para todos */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth/callback" element={<GoogleCallback/>} />
            <Route path="/terminos-legales" element={<TerminosLegales/>} />
            <Route path="/terms-of-service" element={<TermsOfService/>} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/pricing-empresa" element={<EmpresaPricing />} />
            <Route path="/aceptar-invitacion" element={<AceptarInvitacion />} />

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
        </Suspense>
      </div>
    </Router>
  );
}

export default App;

