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
                <p style={{ color: 'var(--text-dark)', lineHeight: '1.6' }}>En <strong>EmpleaT</strong>, valoramos su privacidad tanto como su desarrollo profesional. Esta política explica de forma clara y detallada cómo y por qué recopilamos, tratamos y almacenamos sus datos personales.</p>
                
                <h3 style={{ marginTop: '1.5rem', color: 'var(--secondary)' }}>1.1. Información que Recopilamos</h3>
                <p style={{ color: 'var(--text-gray)', lineHeight: '1.6' }}>Al utilizar EmpleaT y subir su Currículum Vitae (CV) en formato PDF, nuestro sistema extrae y procesa los siguientes Datos Personales:</p>
                <ul style={{ color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                    <li><strong>Datos de Identificación y Contacto:</strong> Nombre completo, correo electrónico, teléfono.</li>
                    <li><strong>Información Profesional:</strong> Experiencia laboral, educación, habilidades (skills).</li>
                    <li><strong>Datos Técnicos:</strong> Direcciones IP y datos de autenticación recogidos al crear su cuenta.</li>
                </ul>

                <h3 style={{ marginTop: '1.5rem', color: 'var(--secondary)' }}>1.2. Tratamiento de Datos por IA (Gemma / Gemini)</h3>
                <p style={{ color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                    Utilizamos herramientas avanzadas de Inteligencia Artificial (la API de <strong>Google Gemini / Gemma</strong>) para automatizar la extracción de datos, clasificar habilidades conforme al marco ESCO y calcular la compatibilidad con ofertas de empleo.
                    El texto extraído de su CV es enviado de forma segura (cifrado HTTPS/TLS) a las APIs de Google LLC para su análisis. Aseguramos contractualmente que <strong>sus datos personales y el contenido de su CV NO son almacenados de forma permanente por el proveedor ni utilizados para entrenar modelos públicos de lenguaje</strong>.
                    El procesamiento automatizado de la IA es de carácter puramente asistencial y predictivo, no implicando decisiones vinculantes automatizadas (las cuales son tomadas en última instancia por humanos en los equipos de selección).
                </p>

                <h3 style={{ marginTop: '1.5rem', color: 'var(--secondary)' }}>1.3. Derechos ARCO y Derecho al Olvido</h3>
                <p style={{ color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                    De conformidad con la Ley N° 25.326 y las normativas internacionales de protección de datos (como el GDPR), usted dispone del derecho de Acceso, Rectificación, Cancelación y Oposición (Derechos ARCO).
                    Puede actualizar o rectificar sus datos manualmente en cualquier momento desde "Mi Perfil". Asimismo, puede solicitar la eliminación total de sus datos y de todos sus archivos de currículum almacenados en nuestros servidores y buckets (Supabase Storage) haciendo clic en el botón de eliminación de cuenta o enviando un correo a <strong><a href="mailto:support@empleat.com.ar" style={{ color: 'var(--primary)' }}>support@empleat.com.ar</a></strong>.
                </p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '2rem' }}>2. Términos y Condiciones (Candidatos)</h2>
                
                <h3 style={{ marginTop: '1.5rem', color: 'var(--secondary)' }}>2.1. Reglas de Uso Aceptable</h3>
                <p style={{ color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '1.5rem' }}>El usuario se compromete a utilizar la plataforma de buena fe. Queda estrictamente prohibido subir documentos maliciosos o incluir en el CV instrucciones ocultas diseñadas para manipular la Inteligencia Artificial (Prompt Injection).</p>

                <h3 style={{ marginTop: '1.5rem', color: 'var(--secondary)' }}>2.2. Limitación de Responsabilidad de la IA</h3>
                <p style={{ color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '1.5rem' }}>Los modelos de Inteligencia Artificial son probabilísticos. La extracción y clasificación de su CV puede contener errores o "alucinaciones". Es responsabilidad exclusiva del candidato revisar y validar que la información mostrada en su perfil sea correcta antes de aplicar a ofertas.</p>

                <h3 style={{ marginTop: '1.5rem', color: 'var(--secondary)' }}>2.3. Políticas de Suscripción, Reembolso y Botón de Arrepentimiento</h3>
                <p style={{ color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                    De conformidad con el artículo 34 de la Ley N° 24.240 de Defensa del Consumidor, el Usuario dispone de un derecho de revocación de la contratación (arrepentimiento) dentro del plazo de 10 (diez) días corridos contados a partir de la suscripción, el cual puede ejercerse directamente a través del "Botón de Arrepentimiento" visible en el perfil del usuario.
                    <br /><br />
                    <strong>Excepción legal por consumo del servicio:</strong> En caso de que el Usuario haga un uso efectivo y sustancial del servicio digital Premium durante dicho período (realizar más de 1 simulación de entrevista técnica con IA o completar cuestionarios técnicos de habilidades para la obtención de insignias), se considerará que la prestación del servicio ha comenzado con su consentimiento expreso, quedando sin efecto la posibilidad de solicitar reembolsos de los cargos correspondientes al periodo en curso, de conformidad con las excepciones del artículo 1116 del Código Civil y Comercial de la Nación.
                </p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '2rem' }}>3. Términos y Condiciones (Empresas)</h2>
                
                <h3 style={{ marginTop: '1.5rem', color: 'var(--secondary)' }}>3.1. Uso de Datos y Confidencialidad</h3>
                <p style={{ color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '1.5rem' }}>La Empresa se compromete a utilizar los datos de los candidatos única y exclusivamente para fines de selección de personal y a eliminarlos del sistema propio una vez finalizado el proceso de selección o si el candidato ejerce su derecho al olvido, actuando como Encargado de Tratamiento.</p>

                <h3 style={{ marginTop: '1.5rem', color: 'var(--secondary)' }}>3.2. Prohibición de Discriminación Algorítmica</h3>
                <p style={{ color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '1.5rem' }}>EmpleaT proporciona filtros de candidatos basados en IA. La Empresa se compromete a no utilizar dichas herramientas para promover o generar actos de discriminación ilegal (raza, género, edad, orientación social, etc.). Los algoritmos de EmpleaT son asistencia (*Copilot*) y las decisiones finales deben ser evaluadas por humanos.</p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '2rem' }}>4. Términos de Servicio y Normas de Uso Aceptable</h2>
                
                <h3 style={{ marginTop: '1.5rem', color: 'var(--secondary)' }}>4.1. Registro y Seguridad de Cuenta</h3>
                <p style={{ color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                    Al registrarse en EmpleaT, el Usuario se compromete a suministrar información veraz, exacta y actualizada sobre su experiencia, formación y habilidades. Queda estrictamente prohibida la suplantación de identidad de terceros o la creación de cuentas automatizadas (bots). Cada cuenta es personal e intransferible, siendo responsabilidad exclusiva del usuario proteger sus credenciales de acceso.
                </p>

                <h3 style={{ marginTop: '1.5rem', color: 'var(--secondary)' }}>4.2. Limitaciones de Uso e Integridad del Sistema</h3>
                <p style={{ color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                    Para garantizar la estabilidad y seguridad de la plataforma, queda expresamente prohibido:
                </p>
                <ul style={{ color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                    <li>Subir archivos o currículums que contengan virus, malware, troyanos o scripts dañinos.</li>
                    <li>Utilizar técnicas de inyección de código o manipulación de instrucciones textuales ocultas dentro de los CVs (como <i>Prompt Injection</i>) destinadas a alterar el comportamiento de la IA evaluadora.</li>
                    <li>Extraer de forma automatizada (mediante <i>scraping</i>, arañas web o bots) ofertas de empleo, datos de contacto de empresas o perfiles de candidatos cargados en el sitio.</li>
                    <li>Realizar ataques de denegación de servicio (DoS/DDoS) o intentar saltarse las medidas de seguridad del backend o de la base de datos (Supabase).</li>
                </ul>

                <h3 style={{ marginTop: '1.5rem', color: 'var(--secondary)' }}>4.3. Moderación y Suspensión de Cuentas</h3>
                <p style={{ color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                    EmpleaT se reserva el derecho de moderar el contenido publicado en la plataforma y suspender, restringir o eliminar de forma definitiva (derecho de admisión) el acceso de cualquier Usuario (candidato o empresa) que incumpla estas normas de uso aceptable, actúe de mala fe, o ponga en riesgo la seguridad de la infraestructura tecnológica o de los datos personales almacenados, sin necesidad de notificación previa y sin lugar a reclamos de indemnización.
                </p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '2rem' }}>5. Contacto y Atención a Usuarios</h2>
                <p style={{ color: 'var(--text-gray)', lineHeight: '1.6' }}>
                    Para consultas técnicas, soporte de cuenta, reclamos o ejercicio de derechos de privacidad, podés escribir directamente a nuestro equipo de atención en <strong><a href="mailto:support@empleat.com.ar" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>support@empleat.com.ar</a></strong>.
                </p>
            </section>
        </div>
    );
}

