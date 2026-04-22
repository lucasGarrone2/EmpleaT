import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import NotFound from './pages/NotFound';
import TerminosLegales from './pages/TerminosLegales';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<GoogleCallback/>} />
          <Route path="/terminos-legales" element={<TerminosLegales/>} />

          {/* Rutas para cualquier autenticado. Eliminada /ofertas hacia rutas especificas */}
          <Route element={<ProtectedRoute />}>
          </Route>

          {/* Rutas protegidas: solo candidatos */}
          <Route element={<ProtectedRoute requiredRole="candidato" />}>
            <Route path="/ofertas" element={<ListaOfertas />} />
            <Route path="/perfil" element={<PerfilCandidato />} />
            <Route path="/mi-perfil" element={<MiPerfil />} />
          </Route>

          {/* Rutas protegidas: solo empresas */}
          <Route element={<ProtectedRoute requiredRole="empresa" />}>
            <Route path="/dashboard-empresa" element={<EmpresaDashboard />} />
            <Route path="/crear-oferta" element={<CrearOferta />} />
            <Route path="/editar-oferta/:id" element={<EditarOferta />} />
            <Route path="/oferta-empresa/:id" element={<OfertaDetalleEmpresa />} />
            <Route path="/oferta-empresa/:ofertaId/candidato/:candidatoId" element={<PerfilCandidatoParaEmpresa />} />
          </Route>

          {/* Ruta 404: cualquier path no reconocido */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
