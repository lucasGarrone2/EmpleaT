import React, { useState, useEffect } from 'react';
import HeroSearch from '../components/HeroSearch';
import FeatureCards from '../components/FeatureCards';
import { Facebook, Twitter, Instagram, ArrowRight, Sparkles, Zap, Shield, Award, Check, MessageSquare } from 'lucide-react';
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
                <p>Profesionales<br />floreciendo hoy mismo</p>
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

        {/* SECCIÓN PREMIUM */}
        <section className="premium-section" id="premium">
          <div className="premium-container">
            <div className="premium-badge-wrapper">
              <span className="premium-badge-sparkle">
                <Sparkles size={16} style={{ marginRight: '6px' }} /> EMPLEAT PREMIUM
              </span>
            </div>

            <h2 className="premium-main-title">
              Impulsa tu éxito con <span className="gradient-gold">herramientas de élite</span>
            </h2>
            <p className="premium-subtitle">
              Accede a funciones avanzadas diseñadas con inteligencia artificial para destacarte y conseguir el empleo de tus sueños más rápido.
            </p>

            {/* Grid de Beneficios */}
            <div className="benefits-grid">
              <div className="benefit-card">
                <div className="benefit-icon-container purple-glow">
                  <MessageSquare size={32} />
                </div>
                <h3>Simulador de Entrevistas con IA</h3>
                <p>Practica tus respuestas técnicas y blandas con nuestro tutor virtual por IA. Recibe feedback en tiempo real y detallado para brillar en tu entrevista real.</p>
              </div>

              <div className="benefit-card">
                <div className="benefit-icon-container green-glow">
                  <Zap size={32} />
                </div>
                <h3>Match Booster (+5%)</h3>
                <p>Resuelve cuestionarios específicos sobre los requisitos de las vacantes. Si apruebas, suma un +5% a tu afinidad al instante y sube puestos ante los reclutadores.</p>
              </div>

              <div className="benefit-card">
                <div className="benefit-icon-container gold-glow">
                  <Award size={32} />
                </div>
                <h3>Insignias de Habilidades</h3>
                <p>Valida tus conocimientos en React, Python, SQL y más con pruebas técnicas integradas. Tus insignias se verán en tu perfil y captarán la mirada de las mejores empresas.</p>
              </div>

              <div className="benefit-card">
                <div className="benefit-icon-container blue-glow">
                  <Shield size={32} />
                </div>
                <h3>Prioridad y Destacado</h3>
                <p>Los candidatos Premium aparecen al tope de la lista en el panel de las empresas, garantizando una visibilidad de primer nivel frente a los usuarios estándar.</p>
              </div>
            </div>

            {/* Simulador Interactivo de Match Boost en la Landing Page */}
            <div className="interactive-match-demo">
              <div className="demo-text">
                <h3>Visualiza el efecto de <span>Match Boost</span></h3>
                <p>Al responder con éxito el cuestionario de preguntas técnicas de una vacante, tu perfil recibe un impulso de afinidad automático de +5%.</p>
                <div className="demo-steps">
                  <div className="demo-step">
                    <span className="step-num">1</span>
                    <span>Te postulas a tu oferta deseada.</span>
                  </div>
                  <div className="demo-step">
                    <span className="step-num">2</span>
                    <span>Respondes el cuestionario de 3 preguntas de nivel medio.</span>
                  </div>
                  <div className="demo-step">
                    <span className="step-num">3</span>
                    <span>¡Tu afinidad aumenta y escalas al primer tier destacado en tiempo real!</span>
                  </div>
                </div>
              </div>

              <div className="demo-card-preview">
                <div className="demo-recruiter-header">PANEL DEL RECLUTADOR</div>
                <div className="demo-candidate-row">
                  <div className="demo-avatar">S</div>
                  <div className="demo-info">
                    <div className="demo-name-row">
                      <h4>Sofia Dominguez</h4>
                      <span className="premium-label">PREMIUM</span>
                      <span className="boost-label pulse">⚡ BOOSTED</span>
                    </div>
                    <p>Desarrollador Full Stack · 3 años exp.</p>
                  </div>
                  <div className="demo-affinity-box">
                    <span className="affinity-label">AFINIDAD</span>
                    <span className="affinity-val font-boost">95%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Planes de Precios Simplificados */}
            <div className="pricing-showcase-title">
              <h2>Nuestros Planes Premium</h2>
              <p>Invierte en tu futuro laboral hoy mismo y acelera tu inserción en el mercado.</p>
            </div>

            <div className="pricing-grid-landing">
              <div className="price-card-landing">
                <h3>Suscripción Mensual</h3>
                <div className="price-val-landing">$5.000 <span className="currency">ARS</span></div>
                <p className="price-desc-landing">Ideal para probar las funciones y preparar tus primeras entrevistas.</p>
                <ul className="price-features-list">
                  <li><Check size={16} /> Simulaciones con IA</li>
                  <li><Check size={16} /> Quizzes de habilidades ilimitados</li>
                  <li><Check size={16} /> Insignias para tu perfil</li>
                  <li><Check size={16} /> Match Boost activado</li>
                </ul>
                <button className="pricing-btn-landing" onClick={() => navigate('/pricing')}>Comenzar Ahora</button>
              </div>

              <div className="price-card-landing featured-card-landing">
                <div className="best-tag">MÁS POPULAR · 17% AHORRO</div>
                <h3>Suscripción 6 Meses</h3>
                <div className="price-val-landing">$25.000 <span className="currency">ARS</span></div>
                <p className="price-desc-landing">El plan recomendado para una búsqueda de empleo sólida y exitosa.</p>
                <ul className="price-features-list">
                  <li><Check size={16} /> Simulaciones con IA</li>
                  <li><Check size={16} /> Quizzes de habilidades ilimitados</li>
                  <li><Check size={16} /> Insignias para tu perfil</li>
                  <li><Check size={16} /> Match Boost activado</li>
                </ul>
                <button className="pricing-btn-landing btn-featured-landing" onClick={() => navigate('/pricing')}>Comenzar Ahora</button>
              </div>

              <div className="price-card-landing">
                <div className="best-tag green-tag">25% AHORRO</div>
                <h3>Suscripción Anual</h3>
                <div className="price-val-landing">$45.000 <span className="currency">ARS</span></div>
                <p className="price-desc-landing">Acceso a largo plazo para asegurar un desarrollo profesional continuo.</p>
                <ul className="price-features-list">
                  <li><Check size={16} /> Simulaciones con IA</li>
                  <li><Check size={16} /> Quizzes de habilidades ilimitados</li>
                  <li><Check size={16} /> Insignias para tu perfil</li>
                  <li><Check size={16} /> Match Boost activado</li>
                </ul>
                <button className="pricing-btn-landing" onClick={() => navigate('/pricing')}>Comenzar Ahora</button>
              </div>
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
