import React, { useState, useEffect } from 'react';
import HeroSearch from '../components/HeroSearch';
import FeatureCards from '../components/FeatureCards';
import { Facebook, Twitter, Instagram, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (user) {
        const fetchName = async () => {
            const { data } = await supabase
                .from('candidatos')
                .select('nombre_completo')
                .eq('auth_id', user.id)
                .maybeSingle();
            
            if (data && data.nombre_completo) {
                setUserName(data.nombre_completo.split(' ')[0]); // Usar solo el primer nombre
            } else {
                // Fallback temporal si todavía no subió CV
                const emailName = user.email.split('@')[0];
                setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
            }
        };
        fetchName();
    }
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="landing-page">
      <main>
        <HeroSearch />
        <FeatureCards />

        <section className="history-section" id="history">
          <div className="history-container">
            
            <div className="history-image-wrapper">
              <div className="blob-orange"></div>
              <div className="blob-green"></div>
              
              <div className="history-image-container">
                <img 
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Equipo trabajando rodeado de plantas" 
                  className="history-img"
                />
              </div>

              <div className="floating-badge">
                <h3 className="badge-title">10k+</h3>
                <p>Profesionales<br/>floreciendo hoy mismo</p>
              </div>
            </div>

            <div className="history-content">
              <div className="history-badge-small">NUESTRA HISTORIA</div>
              <h2>Conectando talento con <i className="italic-green">propósito</i></h2>
              <p>
                EmpleaT nació en un garage rodeado de plantas y una visión clara: 
                el mercado laboral estaba roto. Vimos a miles de personas talentosas 
                marchitarse en puestos que no les daban espacio para respirar.
              </p>
              <p>
                Nuestra pasión es la <strong>reforestación profesional</strong>. Creemos que cada 
                individuo es una semilla única que necesita el suelo adecuado para alcanzar 
                su máximo esplendor.
              </p>
              <p className="highlight-text">
                No somos solo un portal de empleo; somos el jardinero que cuida tu futuro.
              </p>
              <button className="btn-link">Conoce más sobre nuestra visión <ArrowRight size={18} /></button>
            </div>

          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-left">
            <div className="logo-footer">EmpleaT</div>
            <p>© 2024 EmpleaT. Growing Careers Naturally.</p>
          </div>
          <div className="footer-links">
            <a href="/terminos-legales">Terminos Legales</a>
            
            <a href="#">Terms of Service</a>
            <a href="#">Cookies</a>
            <a href="#">Contact Us</a>
          </div>
          <div className="social-icons">
            <span className="icon-circle"><Facebook size={18} /></span>
            <span className="icon-circle"><Twitter size={18} /></span>
            <span className="icon-circle"><Instagram size={18} /></span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
