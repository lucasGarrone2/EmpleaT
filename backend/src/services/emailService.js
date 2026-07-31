import { Resend } from 'resend';

// Inicialización de la SDK de Resend utilizando la clave de entorno
const resend = new Resend(process.env.RESEND_API_KEY);

// Remitente preconfigurado con el dominio verificado empleat.com.ar
const EMAIL_SENDER = 'EmpleaT <no-reply@empleat.com.ar>';

/**
 * Plantilla Base HTML para correos de EmpleaT
 * Garantiza compatibilidad con clientes modernos y legacy (Gmail, Outlook, Apple Mail, Yahoo)
 */
const generarLayoutEmail = ({ titulo, contenidoHtml, ctaText, ctaUrl }) => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f7fa; padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Contenedor Principal (Max 600px para responsividad) -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);">
          
          <!-- Encabezado con Identidad Visual -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 36px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
                Emplea<span style="color: #60a5fa;">T</span>
              </h1>
              <p style="margin: 6px 0 0 0; color: #93c5fd; font-size: 13px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase;">
                Portal de Empleo & Oportunidades
              </p>
            </td>
          </tr>

          <!-- Cuerpo del Mensaje -->
          <tr>
            <td style="padding: 40px; color: #334155; font-size: 16px; line-height: 1.6;">
              ${contenidoHtml}

              <!-- Botón Call To Action (Opcional) -->
              ${ctaText && ctaUrl ? `
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-top: 32px; width: 100%;">
                  <tr>
                    <td align="center">
                      <a href="${ctaUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
                        ${ctaText}
                      </a>
                    </td>
                  </tr>
                </table>
              ` : ''}
            </td>
          </tr>

          <!-- Pie de Página -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5;">
              <p style="margin: 0 0 8px 0;">Este es un correo transaccional enviado automáticamente por <strong>EmpleaT</strong>.</p>
              <p style="margin: 0;">© ${new Date().getFullYear()} EmpleaT Argentina (empleat.com.ar). Todos los derechos reservados.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Envía un correo con el enlace de confirmación de cuenta antes de permitir el ingreso.
 * 
 * @param {string} emailDestino - Correo del usuario registrado.
 * @param {string} nombre - Nombre del usuario.
 * @param {string} confirmLink - URL de confirmación / verificación de correo.
 * @returns {Promise<{success: boolean, data?: object, error?: any}>}
 */
export async function enviarEmailConfirmacion(emailDestino, nombre, confirmLink) {
  try {
    if (!emailDestino || !confirmLink) {
      throw new Error('Parametros incompletos: emailDestino y confirmLink son obligatorios.');
    }

    const asunto = `Confirma tu cuenta en EmpleaT ✉️`;
    const contenidoHtml = `
      <h2 style="margin-top: 0; color: #0f172a; font-size: 22px; font-weight: 700;">¡Hola${nombre ? `, ${nombre}` : ''}!</h2>
      <p style="margin-bottom: 20px;">Gracias por registrarte en <strong>EmpleaT</strong>. Para poder ingresar a la plataforma y utilizar tu cuenta, necesitamos que confirmes tu dirección de correo electrónico.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #64748b;">Haz clic en el siguiente botón para activar tu cuenta:</p>
      </div>

      <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">Si no creaste una cuenta en EmpleaT, puedes ignorar este mensaje.</p>
    `;

    const htmlFinal = generarLayoutEmail({
      titulo: asunto,
      contenidoHtml,
      ctaText: 'Confirmar mi Correo Electrónico',
      ctaUrl: confirmLink
    });

    const { data, error } = await resend.emails.send({
      from: EMAIL_SENDER,
      to: [emailDestino],
      subject: asunto,
      html: htmlFinal,
    });

    if (error) {
      console.error('[EmailService] Error devuelto por Resend SDK:', error);
      return { success: false, error: error.message || error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[EmailService Exception] Error al enviar email de confirmación:', error.message || error);
    return { success: false, error: error.message || error };
  }
}

/**
 * Envía un correo de bienvenida cuando un usuario se registra y confirma su cuenta.
 * 
 * @param {string} emailDestino - Correo electrónico del usuario registrado.
 * @param {string} nombre - Nombre o razón social del usuario.
 * @returns {Promise<{success: boolean, data?: object, error?: any}>}
 */
export async function enviarEmailBienvenida(emailDestino, nombre) {
  try {
    if (!emailDestino || !nombre) {
      throw new Error('Parametros incompletos: emailDestino y nombre son obligatorios.');
    }

    const asunto = `¡Bienvenido/a a EmpleaT, ${nombre}! 🚀`;
    const contenidoHtml = `
      <h2 style="margin-top: 0; color: #0f172a; font-size: 22px; font-weight: 700;">¡Hola, ${nombre}!</h2>
      <p style="margin-bottom: 20px;">Nos alegra darte la bienvenida a <strong>EmpleaT</strong>, la plataforma donde conectamos el mejor talento laboral con las mejores empresas del país.</p>
      
      <div style="background-color: #f1f5f9; border-left: 4px solid #2563eb; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 15px; color: #1e293b; font-weight: 500;">
          💡 <strong>Próximos pasos recomendados:</strong>
        </p>
        <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #475569; font-size: 14px;">
          <li>Completa tu perfil profesional para aumentar tus posibilidades.</li>
          <li>Sube tu Curriculum Vitae actualizado para recibir análisis inteligente de IA.</li>
          <li>Explora y postulate a las búsquedas laborales destacadas.</li>
        </ul>
      </div>

      <p style="margin-bottom: 0;">Estamos para acompañarte en tu crecimiento profesional.</p>
    `;

    const htmlFinal = generarLayoutEmail({
      titulo: asunto,
      contenidoHtml,
      ctaText: 'Ir a mi Panel de EmpleaT',
      ctaUrl: process.env.FRONTEND_URL || 'https://empleat.com.ar'
    });

    const { data, error } = await resend.emails.send({
      from: EMAIL_SENDER,
      to: [emailDestino],
      subject: asunto,
      html: htmlFinal,
    });

    if (error) {
      console.error('[EmailService] Error devuelto por Resend SDK:', error);
      return { success: false, error: error.message || error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[EmailService Exception] Error al enviar email de bienvenida:', error.message || error);
    return { success: false, error: error.message || error };
  }
}

/**
 * Función genérica para enviar notificaciones del sistema.
 * 
 * @param {string} emailDestino - Correo del destinatario.
 * @param {string} asunto - Asunto del correo electrónico.
 * @param {string} mensaje - Mensaje principal.
 * @returns {Promise<{success: boolean, data?: object, error?: any}>}
 */
export async function enviarEmailNotificacion(emailDestino, asunto, mensaje) {
  try {
    if (!emailDestino || !asunto || !mensaje) {
      throw new Error('Parametros incompletos: emailDestino, asunto y mensaje son obligatorios.');
    }

    const mensajeFormateado = mensaje.includes('<p>') || mensaje.includes('<div>')
      ? mensaje
      : mensaje.replace(/\n/g, '<br/>');

    const contenidoHtml = `
      <h2 style="margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700;">Notificación del Sistema</h2>
      <div style="font-size: 15px; color: #334155; line-height: 1.6;">
        ${mensajeFormateado}
      </div>
    `;

    const htmlFinal = generarLayoutEmail({
      titulo: asunto,
      contenidoHtml,
      ctaText: 'Ver en EmpleaT',
      ctaUrl: process.env.FRONTEND_URL || 'https://empleat.com.ar'
    });

    const { data, error } = await resend.emails.send({
      from: EMAIL_SENDER,
      to: [emailDestino],
      subject: asunto,
      html: htmlFinal,
    });

    if (error) {
      console.error('[EmailService] Error devuelto por Resend SDK:', error);
      return { success: false, error: error.message || error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[EmailService Exception] Error al enviar email de notificación:', error.message || error);
    return { success: false, error: error.message || error };
  }
}
