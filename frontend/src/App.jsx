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

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/perfil" element={<PerfilCandidato/>}/>
          <Route path="/mi-perfil" element={<MiPerfil/>}/>
          <Route path="/ofertas" element={<ListaOfertas />}/>
          <Route path="/dashboard-empresa" element={<EmpresaDashboard/>}/>
          <Route path="/crear-oferta" element={<CrearOferta/>}/>
          <Route path="/oferta-empresa/:id" element={<OfertaDetalleEmpresa/>}/>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
