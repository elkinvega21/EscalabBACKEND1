import nodemailer from 'nodemailer';

// Configurar el transportador SMTP
// Los detalles deben estar en el archivo .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const defaultFrom = process.env.EMAIL_FROM || '"Escalab AI" <info@escalab.co>';

/**
 * Envía el correo de bienvenida al lead.
 * @param {string} toEmail 
 * @param {string} name 
 */
export const sendWelcomeEmail = async (toEmail, name) => {
  try {
    const info = await transporter.sendMail({
      from: defaultFrom,
      to: toEmail,
      subject: '¡Bienvenido a Escalab, tu aliado en automatización! 🚀',
      html: `
        <div style="background-color: #F9F8FA; padding: 40px 20px; font-family: 'Inter', Helvetica, Arial, sans-serif;">
          
          <!-- Logo Superior -->
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://escalabapp.online/escalab-logo.png" alt="Escalab" width="130" style="display: inline-block; border: 0;" />
          </div>

          <!-- Tarjeta Principal -->
          <div style="background-color: #FFFFFF; max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 30px rgba(26, 15, 46, 0.04);">
            
            <!-- Imagen Hero (Reemplazar URL con tu SVG exportado a PNG) -->
            <div style="background-color: #FFF6E8; text-align: center; padding: 40px 20px;">
              <img src="https://escalabapp.online/email-hero.png" alt="Hero Image" style="max-width: 100%; height: auto; border: 0;" />
            </div>

            <!-- Contenido -->
            <div style="padding: 40px 40px 30px;">
              <h2 style="color: #1A0F2E; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 20px; text-align: center;">
                ¡Estás dentro, ${name || ''}!
              </h2>
              
              <p style="font-size: 16px; color: #1A0F2E; margin-bottom: 16px; line-height: 1.6;">
                Te doy la bienvenida a <strong>Escalab</strong>. Hemos recibido tus datos correctamente y, de verdad, nos emociona mucho la posibilidad de conocer más a fondo tu negocio.
              </p>
              
              <p style="font-size: 16px; color: #1A0F2E; margin-bottom: 16px; line-height: 1.6;">
                Entendemos que el crecimiento de una empresa trae consigo procesos tediosos que quitan tiempo. Por eso construimos sistemas que aprenden de ti, venden como tú lo harías y nunca duermen.
              </p>

              <p style="font-size: 16px; color: #1A0F2E; margin-bottom: 30px; line-height: 1.6;">
                En breve, uno de nuestros especialistas se pondrá en contacto contigo para ver tus números y mostrarte una solución a medida. Nada genérico.
              </p>
              
              <div style="text-align: center; margin-top: 35px; margin-bottom: 15px;">
                <a href="https://escalabapp.online" style="background-color: #C4FF3D; color: #1A0F2E; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 16px; display: inline-block;">
                  Conocer más
                </a>
              </div>
            </div>
          </div>

          <!-- Footer Estilo Pitch / Bancolombia -->
          <div style="max-width: 600px; margin: 30px auto 0; text-align: center; color: rgba(26, 15, 46, 0.5); font-size: 12px; line-height: 1.6;">
            <p style="margin: 0 0 10px;">
              © ${new Date().getFullYear()} Escalab. Todos los derechos reservados.<br>
              Construido para escalarte.<br>
              <a href="https://instagram.com/escalabapp" style="color: rgba(26, 15, 46, 0.5); text-decoration: underline; margin: 0 5px;">Instagram</a> | 
              <a href="https://tiktok.com/@escalabapp" style="color: rgba(26, 15, 46, 0.5); text-decoration: underline; margin: 0 5px;">TikTok</a> | 
              <a href="https://escalabapp.online" style="color: rgba(26, 15, 46, 0.5); text-decoration: underline; margin: 0 5px;">Sitio Web</a>
            </p>
            <p style="margin: 0;">
              Recibes este correo porque te registraste en nuestra plataforma.<br>
              Este correo es automático, por favor no respondas a este mensaje.
            </p>
          </div>

        </div>
      `,
    });
    console.log(`✉️ Correo de bienvenida enviado a ${toEmail}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error enviando correo de bienvenida:', error);
    return false;
  }
};

/**
 * Envía el correo explicativo y aviso de contacto por WhatsApp.
 * @param {string} toEmail 
 * @param {string} name 
 */
export const sendHowItWorksEmail = async (toEmail, name) => {
  try {
    const info = await transporter.sendMail({
      from: defaultFrom,
      to: toEmail,
      subject: 'Cómo funciona Escalab y siguientes pasos 📱',
      html: `
        <div style="background-color: #F9F8FA; padding: 40px 20px; font-family: 'Inter', Helvetica, Arial, sans-serif;">
          
          <!-- Logo Superior -->
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://escalabapp.online/escalab-logo.png" alt="Escalab" width="130" style="display: inline-block; border: 0;" />
          </div>

          <!-- Tarjeta Principal -->
          <div style="background-color: #FFFFFF; max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 30px rgba(26, 15, 46, 0.04);">
            
            <!-- Contenido -->
            <div style="padding: 40px;">
              <h2 style="color: #1A0F2E; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 20px; text-align: center;">
                ¿Qué sigue ahora, ${name || 'futuro aliado'}?
              </h2>
              
              <p style="font-size: 16px; color: #1A0F2E; margin-bottom: 25px; line-height: 1.6;">
                Queremos ser muy transparentes sobre cómo trabajamos, para asegurarnos de que Escalab sea el encaje perfecto para tu negocio.
              </p>
              
              <div style="background-color: #FFF6E8; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #C4FF3D;">
                <h3 style="color: #6B2A8E; margin-top: 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Nuestro método en 3 pasos:</h3>
                <ul style="margin: 0; padding-left: 20px; font-size: 15px; color: #1A0F2E; line-height: 1.6;">
                  <li style="margin-bottom: 10px;"><strong>Análisis:</strong> Revisamos a fondo tus procesos actuales de venta y captación de clientes.</li>
                  <li style="margin-bottom: 10px;"><strong>Diseño:</strong> Creamos un flujo conversacional inteligente adaptado estrictamente al tono de tu marca.</li>
                  <li><strong>Despliegue:</strong> Conectamos la IA a tus canales (WhatsApp, Web) para que empiece a atender 24/7.</li>
                </ul>
              </div>

              <h3 style="color: #6B2A8E; font-size: 18px; text-align: center; margin-top: 30px;">Siguientes pasos</h3>
              <p style="font-size: 16px; color: #1A0F2E; margin-bottom: 15px; line-height: 1.6; text-align: center;">
                Un consultor de nuestro equipo <strong>te escribirá pronto a través de WhatsApp</strong> al número que nos proporcionaste para agendar una breve llamada técnica.
              </p>
              
              <div style="text-align: center; margin-top: 35px; margin-bottom: 10px;">
                <a href="https://wa.me/573000000000" style="background-color: #1A0F2E; color: #FFF6E8; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 16px; display: inline-block;">
                  Ir a mi WhatsApp
                </a>
              </div>
            </div>
          </div>

          <!-- Footer Estilo Pitch / Bancolombia -->
          <div style="max-width: 600px; margin: 30px auto 0; text-align: center; color: rgba(26, 15, 46, 0.5); font-size: 12px; line-height: 1.6;">
            <p style="margin: 0 0 10px;">
              © ${new Date().getFullYear()} Escalab. Todos los derechos reservados.<br>
              Construido para escalarte.<br>
              <a href="https://instagram.com/escalabapp" style="color: rgba(26, 15, 46, 0.5); text-decoration: underline; margin: 0 5px;">Instagram</a> | 
              <a href="https://tiktok.com/@escalabapp" style="color: rgba(26, 15, 46, 0.5); text-decoration: underline; margin: 0 5px;">TikTok</a> | 
              <a href="https://escalabapp.online" style="color: rgba(26, 15, 46, 0.5); text-decoration: underline; margin: 0 5px;">Sitio Web</a>
            </p>
            <p style="margin: 0;">
              Recibes este correo porque te registraste en nuestra plataforma.<br>
              Este correo es automático, por favor no respondas a este mensaje.
            </p>
          </div>

        </div>
      `,
    });
    console.log(`✉️ Correo explicativo enviado a ${toEmail}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error enviando correo explicativo:', error);
    return false;
  }
};
