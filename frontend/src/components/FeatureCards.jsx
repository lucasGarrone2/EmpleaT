import React from 'react';
import { FileText, Sparkles, Sprout } from 'lucide-react';
import './FeatureCards.css';

const FeatureCards = () => {
  const features = [
    {
      icon: <FileText size={28} />,
      title: 'Siembra tu Talento',
      description: 'Subí tu CV. Nuestra IA analiza no solo tu experiencia, sino tus habilidades latentes y potencial de crecimiento.',
      bgColor: 'var(--bg-white)',
      textColor: 'var(--text-dark)',
      iconBg: 'var(--primary)',
      iconColor: 'var(--secondary)'
    },
    {
      icon: <Sparkles size={28} />,
      title: 'Nutrición de Datos',
      description: 'Conectamos tus pasiones con las necesidades reales del mercado. Creamos un ecosistema donde tu perfil brilla frente a las empresas correctas.',
      bgColor: 'var(--secondary)',
      textColor: 'var(--bg-white)',
      iconBg: '#1f4233',
      iconColor: 'var(--primary)',
      isDark: true
    },
    {
      icon: <Sprout size={28} />,
      title: 'Cosecha Resultados',
      description: 'Recibí ofertas personalizadas. Solo verás vacantes que resuenen con tu estilo de vida y ambiciones profesionales.',
      bgColor: 'var(--bg-white)',
      textColor: 'var(--text-dark)',
      iconBg: '#E5E7EB',
      iconColor: 'var(--text-gray)'
    }
  ];

  return (
    <section className="features-section" id="how">
      <div className="features-header">
        <h2>¿Cómo funciona EmpleaT?</h2>
        <p>Nuestra tecnología de IA no solo lee palabras, entiende el ecosistema de tu carrera.</p>
      </div>
      
      <div className="cards-container">
        {features.map((feature, index) => (
          <div 
            key={index} 
            className={`feature-card ${feature.isDark ? 'dark-card' : ''}`}
            style={{ backgroundColor: feature.bgColor, color: feature.textColor }}
          >
            <div 
              className="card-icon" 
              style={{ backgroundColor: feature.iconBg, color: feature.iconColor }}
            >
              {feature.icon}
            </div>
            <h3>{feature.title}</h3>
            <p className="card-desc" style={{ color: feature.isDark ? '#e2e8f0' : 'var(--text-gray)' }}>
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeatureCards;
