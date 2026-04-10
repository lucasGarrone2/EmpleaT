import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function TerminosLegales() {
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

            <h1 style={{ color: 'var(--secondary)', marginBottom: '1rem', fontSize: '2.5rem' }}>Documentación Legal - EmpleaT</h1>
            <p style={{ color: 'var(--text-gray)', fontSize: '1.1rem', marginBottom: '2rem' }}><strong>Jurisdicción Aplicable:</strong> Estándar Global con cumplimiento específico de GDPR (Europa) y Ley 25.326 de Protección de Datos Personales (Argentina).</p>
            
            <hr style={{ border: 'none', borderTop: '2px solid rgba(0,214,107,0.1)', marginBottom: '3rem' }} />

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '2rem' }}>1. Política de Privacidad</h2>
                <p style={{ color: 'var(--text-dark)', lineHeight: '1.6' }}>En <strong>EmpleaT</strong>, valoramos su privacidad tanto como su desarrollo profesional. Esta política explica explícitamente cómo y por qué recopilamos y tratamos sus datos.</p>
                
                <h3 style={{ marginTop: '1.5rem', color: 'var(--secondary)' }}>1.1. Información que Recopilamos</h3>
                <p style={{ color: 'var(--text-gray)', lineHeight: '1.6' }}>Al utilizar EmpleaT y subir su Currículum Vitae (CV) en formato PDF, nuestro sistema extrae y procesa los siguientes Datos Personales:</p>
                <ul style={{ color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                    <li><strong>Datos de Identificación y Contacto:</strong> Nombre completo, correo electrónico, teléfono.</li>
                    <li><strong>Información Profesional:</strong> Experiencia laboral, educación, habilidades (skills).</li>
                    <li><strong>Datos Técnicos:</strong> Direcciones IP y datos de autenticación recogidos al crear su cuenta.</li>
                </ul>

                <h3 style={{ marginTop: '1.5rem', color: 'var(--secondary)' }}>1.2. Tratamiento de Datos por IA</h3>
                <p style={{ color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '1.5rem' }}>Utilizamos la API de <strong>Google Gemini</strong> para leer y estructurar la información de su CV. El texto extraído de su CV es enviado de forma segura a los servidores de Google exclusivamente para su análisis. Aseguramos por contrato que <strong>sus datos personales NO son utilizados para entrenar modelos públicos</strong>.</p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '2rem' }}>2. Términos y Condiciones (Candidatos)</h2>
                
                <h3 style={{ marginTop: '1.5rem', color: 'var(--secondary)' }}>2.1. Reglas de Uso Aceptable</h3>
                <p style={{ color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '1.5rem' }}>El usuario se compromete a utilizar la plataforma de buena fe. Queda estrictamente prohibido subir documentos maliciosos o incluir en el CV instrucciones ocultas diseñadas para manipular la Inteligencia Artificial (Prompt Injection).</p>

                <h3 style={{ marginTop: '1.5rem', color: 'var(--secondary)' }}>2.2. Limitación de Responsabilidad de la IA</h3>
                <p style={{ color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '1.5rem' }}>Los modelos de Inteligencia Artificial son probabilísticos. La extracción y clasificación de su CV puede contener errores o "alucinaciones". Es responsabilidad exclusiva del candidato revisar y validar que la información mostrada en su perfil sea correcta antes de aplicar a ofertas.</p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '2rem' }}>3. Términos y Condiciones (Empresas)</h2>
                
                <h3 style={{ marginTop: '1.5rem', color: 'var(--secondary)' }}>3.1. Uso de Datos y Confidencialidad</h3>
                <p style={{ color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '1.5rem' }}>La Empresa se compromete a utilizar los datos de los candidatos única y exclusivamente para fines de selección de personal y a eliminarlos del sistema propio una vez finalizado el proceso de selección o si el candidato ejerce su derecho al olvido, actuando como Encargado de Tratamiento.</p>

                <h3 style={{ marginTop: '1.5rem', color: 'var(--secondary)' }}>3.2. Prohibición de Discriminación Algorítmica</h3>
                <p style={{ color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '1.5rem' }}>EmpleaT proporciona filtros de candidatos basados en IA. La Empresa se compromete a no utilizar dichas herramientas para promover o generar actos de discriminación ilegal (raza, género, edad, orientación social, etc.). Los algoritmos de EmpleaT son asistencia (*Copilot*) y las decisiones finales deben ser evaluadas por humanos.</p>
            </section>
        </div>
    );
}

