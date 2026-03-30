import React from 'react';
import { Leaf, Search, MapPin, ArrowRight, TrendingUp, BrainCircuit, HeartHandshake, ShieldCheck } from 'lucide-react';
import './HeroSearch.css';

const HeroSearch = () => {
  return (
    <section className="hero-section">
      <div className="hero-badge">
        <Leaf size={16} className="icon-green" />
        <span>NUEVA ERA LABORAL</span>
      </div>
      
      <h1 className="hero-title">
        El trabajo que <span>te entiende</span>
      </h1>
      
      <p className="hero-subtitle">
        Subí tu CV y encontrá ofertas que vibran con vos. Usamos
        inteligencia natural para conectar tu propósito con el lugar ideal.
      </p>

      <div className="search-container">
        <div className="search-input-group">
          <Search size={20} className="search-icon" />
          <input type="text" placeholder="Puesto o palabra clave" />
        </div>
        <div className="divider"></div>
        <div className="search-input-group">
          <MapPin size={20} className="search-icon" />
          <input type="text" placeholder="Ubicación (remoto o ciudad)" />
        </div>
        <button className="btn-search">
          Buscar <ArrowRight size={18} />
        </button>
      </div>

      <div className="badges-container">
        <div className="badge-item">
          <div className="badge-icon bg-green"><TrendingUp size={24} /></div>
          <span>Crecimiento real</span>
        </div>
        <div className="badge-item">
          <div className="badge-icon bg-teal"><BrainCircuit size={24} /></div>
          <span>IA Intuitiva</span>
        </div>
        <div className="badge-item">
          <div className="badge-icon bg-orange"><HeartHandshake size={24} /></div>
          <span>Match Cultural</span>
        </div>
        <div className="badge-item">
          <div className="badge-icon bg-green-dark"><ShieldCheck size={24} /></div>
          <span>Empresas TOP</span>
        </div>
      </div>
    </section>
  );
};

export default HeroSearch;
