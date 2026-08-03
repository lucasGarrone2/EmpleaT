import React, { useState, useEffect } from 'react';
import HeroSearch from '../components/HeroSearch';
import FeatureCards from '../components/FeatureCards';
import { Facebook, Twitter, Instagram, ArrowRight, Sparkles, Zap, Shield, Award, Check, MessageSquare, Mail, Copy, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userName, setUserName] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('support@empleat.com.ar');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                <h3 className="badge-title">100%</h3>
                <p>Acceso Gratuito<br />sin costos ocultos</p>
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
                      <span className="boost-label pulse" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Zap size={10} fill="currentColor" /> BOOSTED
                      </span>
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
              <div className="price-card-landing" style={{ minHeight: '260px', justifyContent: 'space-between' }}>
                <div>
                  <h3>Suscripción Mensual</h3>
                  <div className="price-val-landing">$5.000 <span className="currency">ARS</span></div>
                  <p className="price-desc-landing">Ideal para probar las funciones y preparar tus primeras entrevistas.</p>
                </div>
                <button className="pricing-btn-landing" onClick={() => navigate('/pricing')}>Comenzar Ahora</button>
              </div>

              <div className="price-card-landing featured-card-landing" style={{ minHeight: '260px', justifyContent: 'space-between' }}>
                <div className="best-tag">MÁS POPULAR · 17% AHORRO</div>
                <div>
                  <h3>Suscripción 6 Meses</h3>
                  <div className="price-val-landing">$25.000 <span className="currency">ARS</span></div>
                  <p className="price-desc-landing">El plan recomendado para una búsqueda de empleo sólida y exitosa.</p>
                </div>
                <button className="pricing-btn-landing btn-featured-landing" onClick={() => navigate('/pricing')}>Comenzar Ahora</button>
              </div>

              <div className="price-card-landing" style={{ minHeight: '260px', justifyContent: 'space-between' }}>
                <div className="best-tag green-tag">25% AHORRO</div>
                <div>
                  <h3>Suscripción Anual</h3>
                  <div className="price-val-landing">$45.000 <span className="currency">ARS</span></div>
                  <p className="price-desc-landing">Acceso a largo plazo para asegurar un desarrollo profesional continuo.</p>
                </div>
                <button className="pricing-btn-landing" onClick={() => navigate('/pricing')}>Comenzar Ahora</button>
              </div>
            </div>

            {/* Grid de Beneficios Premium */}
            <div style={{
              background: 'white',
              borderRadius: '24px',
              padding: '2.5rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.05)',
              marginBottom: '2.5rem'
            }}>
              <h3 style={{
                fontSize: '1.2rem',
                color: 'var(--text-dark)',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <Sparkles size={20} color="#FFB020" fill="#FFB020" /> ¿Qué incluye tu Membresía Premium?
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '1.2rem', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(255,176,32,0.08) 0%, rgba(255,176,32,0.02) 100%)', border: '1px solid rgba(255,176,32,0.2)' }}>
                  <div style={{ background: '#FFB020', borderRadius: '50%', width: '24px', height: '24px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={14} strokeWidth={3} /></div>
                  <div>
                    <span style={{ fontSize: '0.95rem', color: '#333', lineHeight: '1.5', fontWeight: 'bold' }}>
                      Simulador de Entrevistas con IA (¡NUEVO!)
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '1.2rem', borderRadius: '16px', background: '#FAFAFB', border: '1px solid rgba(0,0,0,0.03)' }}>
                  <div style={{ background: 'var(--primary)', borderRadius: '50%', width: '24px', height: '24px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={14} strokeWidth={3} /></div>
                  <div>
                    <span style={{ fontSize: '0.95rem', color: '#333', lineHeight: '1.5', fontWeight: '500' }}>
                      Métricas Avanzadas de Ranking en Postulaciones
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '1.2rem', borderRadius: '16px', background: '#FAFAFB', border: '1px solid rgba(0,0,0,0.03)' }}>
                  <div style={{ background: 'var(--primary)', borderRadius: '50%', width: '24px', height: '24px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={14} strokeWidth={3} /></div>
                  <div>
                    <span style={{ fontSize: '0.95rem', color: '#333', lineHeight: '1.5', fontWeight: '500' }}>
                      Quizzes de Habilidades Ilimitados
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '1.2rem', borderRadius: '16px', background: '#FAFAFB', border: '1px solid rgba(0,0,0,0.03)' }}>
                  <div style={{ background: 'var(--primary)', borderRadius: '50%', width: '24px', height: '24px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={14} strokeWidth={3} /></div>
                  <div>
                    <span style={{ fontSize: '0.95rem', color: '#333', lineHeight: '1.5', fontWeight: '500' }}>
                      Insignias Exclusivas para tu Perfil
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '1.2rem', borderRadius: '16px', background: '#FAFAFB', border: '1px solid rgba(0,0,0,0.03)' }}>
                  <div style={{ background: 'var(--primary)', borderRadius: '50%', width: '24px', height: '24px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={14} strokeWidth={3} /></div>
                  <div>
                    <span style={{ fontSize: '0.95rem', color: '#333', lineHeight: '1.5', fontWeight: '500' }}>
                      Match Boost (+5%) en Postulaciones
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '1.2rem', borderRadius: '16px', background: '#FAFAFB', border: '1px solid rgba(0,0,0,0.03)' }}>
                  <div style={{ background: 'var(--primary)', borderRadius: '50%', width: '24px', height: '24px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={14} strokeWidth={3} /></div>
                  <div>
                    <span style={{ fontSize: '0.95rem', color: '#333', lineHeight: '1.5', fontWeight: '500' }}>
                      Posicionamiento Destacado ante Reclutadores
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-container">
          <div className="logo-footer">EmpleaT</div>
          <div className="footer-links">
            <a href="/terminos-legales">Términos Legales</a>
            <a href="/terms-of-service">Política de Privacidad</a>
            <button
              onClick={(e) => { e.preventDefault(); setShowContactModal(true); }}
              style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', padding: 0 }}
            >
              Contacto
            </button>
          </div>
        </div>
      </footer>

      {/* Modal de Contacto y Soporte */}
      {showContactModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999999, padding: '1rem'
        }} onClick={() => setShowContactModal(false)}>
          <div style={{
            background: 'white', borderRadius: '24px', maxWidth: '440px', width: '100%',
            padding: '32px 24px 24px', position: 'relative', boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
            boxSizing: 'border-box'
          }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowContactModal(false)} style={{
              position: 'absolute', top: '18px', right: '18px', background: 'rgba(0,0,0,0.05)',
              border: 'none', borderRadius: '50%', width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#666'
            }}>
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(0, 214, 107, 0.12)', color: 'var(--primary, #00D66B)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
              }}>
                <Mail size={32} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 700, color: '#1a1a1a' }}>
                Contacto y Soporte
              </h3>
              <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>
                Para consultas, soporte o asistencia técnica, podés escribir a nuestro equipo:
              </p>

              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px',
                padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '20px', gap: '8px'
              }}>
                <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.98rem', wordBreak: 'break-all' }}>
                  support@empleat.com.ar
                </span>
                <button
                  onClick={handleCopyEmail}
                  style={{
                    background: copied ? 'var(--primary, #00D66B)' : '#e2e8f0',
                    color: copied ? 'white' : '#334155',
                    border: 'none', borderRadius: '8px', padding: '6px 12px',
                    fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s', flexShrink: 0
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href="mailto:support@empleat.com.ar"
                  style={{
                    flex: 1, textDecoration: 'none', background: 'var(--primary, #00D66B)',
                    color: 'white', border: 'none', borderRadius: '12px', padding: '12px',
                    fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '6px'
                  }}
                >
                  <Mail size={16} /> Abrir app de correo
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
