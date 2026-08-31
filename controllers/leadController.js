import db from '../database.js';
import { sendWelcomeEmail, sendHowItWorksEmail } from '../services/emailService.js';

// Guardar un lead desde el formulario web
export const createLead = async (req, res) => {
  const { nombre, email, empresa, telefono, mensaje, origen } = req.body;

  if (!nombre || !email) {
    return res.status(400).json({ error: 'El nombre y correo electrónico son obligatorios.' });
  }

  try {
    const result = await db.query(
      'INSERT INTO landing_leads (nombre, email, empresa, telefono, mensaje, origen) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [nombre, email, empresa, telefono || null, mensaje || null, origen || 'formulario_web']
    );

    // Enviar correos de manera asíncrona sin bloquear la respuesta al usuario
    sendWelcomeEmail(email, nombre);
    
    // Podemos enviarlo con un ligero retraso de 1 minuto o de inmediato
    // Para simplificar, lo enviamos de inmediato también de forma asíncrona.
    setTimeout(() => {
      sendHowItWorksEmail(email, nombre);
    }, 5000); // Enviar 5 segundos después del de bienvenida

    res.status(201).json({ success: true, leadId: result.rows[0].id, message: 'Lead guardado con éxito' });
  } catch (error) {
    console.error('Error al guardar lead desde el formulario:', error);
    res.status(500).json({ error: 'Ocurrió un error al procesar la solicitud.' });
  }
};
