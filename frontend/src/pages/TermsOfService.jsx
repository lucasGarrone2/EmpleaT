import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div style={{ 
            padding: '4rem 2rem', 
            maxWidth: '900px', 
            margin: '2rem auto', 
            background: 'var(--bg-white)', 
            borderRadius: '24px', 
            boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,214,107,0.1)'
        }}>
            <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold', marginBottom: '2rem', display: 'inline-block' }}>
                &larr; Volver al inicio
            </Link>

            <h1 style={{ color: 'var(--secondary)', marginBottom: '1rem', fontSize: '2.5rem' }}>Términos de Servicio - EmpleaT</h1>
            <p style={{ color: 'var(--text-gray)', fontSize: '1.1rem', marginBottom: '2rem' }}><strong>Última actualización:</strong> Junio 2026. Cumplimiento normativo y reglas de uso de la plataforma.</p>
            
            <hr style={{ border: 'none', borderTop: '2px solid rgba(0,214,107,0.1)', marginBottom: '3rem' }} />

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '2rem' }}>1. Registro y Seguridad de la Cuenta</h2>
                <p style={{ color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                    Al registrarse en EmpleaT, el Usuario se compromete a suministrar información veraz, exacta y actualizada sobre su experiencia, formación y habilidades. Queda estrictamente prohibida la suplantación de identidad de terceros o la creación de cuentas automatizadas (bots). Cada cuenta es personal e intransferible, siendo responsabilidad exclusiva del usuario proteger sus credenciales de acceso.
                </p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '2rem' }}>2. Limitaciones de Uso e Integridad del Sistema</h2>
                <p style={{ color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                    Para garantizar la estabilidad y seguridad de la plataforma, queda expresamente prohibido:
                </p>
                <ul style={{ color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                    <li>Subir archivos o currículums que contengan virus, malware, troyanos o scripts dañinos.</li>
                    <li>Utilizar técnicas de inyección de código o manipulación de instrucciones textuales ocultas dentro de los CVs (como <i>Prompt Injection</i>) destinadas a alterar el comportamiento de la IA evaluadora.</li>
                    <li>Extraer de forma automatizada (mediante <i>scraping</i>, arañas web o bots) ofertas de empleo, datos de contacto de empresas o perfiles de candidatos cargados en el sitio.</li>
                    <li>Realizar ataques de denegación de servicio (DoS/DDoS) o intentar saltarse las medidas de seguridad del backend o de la base de datos (Supabase).</li>
                </ul>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '2rem' }}>3. Moderación y Suspensión de Cuentas</h2>
                <p style={{ color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                    EmpleaT se reserva el derecho de moderar el contenido publicado en la plataforma y suspender, restringir o eliminar de forma definitiva (derecho de admisión) el acceso de cualquier Usuario (candidato o empresa) que incumpla estas normas de uso aceptable, actúe de mala fe, o ponga en riesgo la seguridad de la infraestructura tecnológica o de los datos personales almacenados, sin necesidad de notificación previa y sin lugar a reclamos de indemnización.
                </p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '2rem' }}>4. Propiedad Intelectual</h2>
                <p style={{ color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                    Los derechos de propiedad intelectual sobre la marca EmpleaT, logotipos, código fuente de la aplicación, bases de datos y algoritmos de IA corresponden exclusivamente a los creadores de la plataforma. La descarga de currículums por parte de Empresas asociadas se otorga bajo una licencia de uso limitada exclusivamente para fines de selección.
                </p>
            </section>
        </div>
    );
}
