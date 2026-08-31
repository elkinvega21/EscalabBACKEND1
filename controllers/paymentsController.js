import crypto from 'crypto';
import pool from '../database.js';

// ─── Catálogo de planes (fuente de verdad del backend) ────────────────────────
const PLANS = [
  { id: 'arranque', name: 'Arranque', amountInCents: 15000000 }, // $150.000 COP
  { id: 'escala',   name: 'Escala',   amountInCents: 35000000 }, // $350.000 COP
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Genera la referencia única de la orden.
 * Formato: ESC-<planId>-<timestamp>-<random4>
 */
function buildReference(planId) {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ESC-${planId.toUpperCase()}-${ts}-${rand}`;
}

/**
 * Calcula la firma de integridad SHA-256 que exige Wompi.
 * Cadena: reference + amountInCents + currency + integritySecret
 *
 * @param {string} reference
 * @param {number} amountInCents
 * @param {string} currency
 * @returns {string} hash hex SHA-256
 */
function buildIntegrityHash(reference, amountInCents, currency) {
  const secret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!secret) throw new Error('WOMPI_INTEGRITY_SECRET no configurado en el backend');
  const raw = `${reference}${amountInCents}${currency}${secret}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// ─── Controladores ────────────────────────────────────────────────────────────

/**
 * GET /payments/plans
 * Devuelve el catálogo de planes con precios reales.
 */
export async function getPlans(req, res) {
  try {
    res.json(PLANS);
  } catch (err) {
    console.error('getPlans error:', err);
    res.status(500).json({ error: 'Error al obtener los planes' });
  }
}

/**
 * POST /payments/orders
 * Crea la orden, calcula la firma y devuelve los datos firmados al frontend.
 *
 * Body esperado:
 * {
 *   planId, companyName, industry, companySize, primaryGoal,
 *   fullName, email, phoneNumber, phoneNumberPrefix,
 *   password, legalId, legalIdType
 * }
 */
export async function createOrder(req, res) {
  try {
    const {
      planId, companyName, industry, companySize, primaryGoal,
      fullName, email, phoneNumber, phoneNumberPrefix,
      password, legalId, legalIdType,
    } = req.body;

    // Validaciones básicas
    if (!planId || !email || !fullName) {
      return res.status(400).json({ error: 'planId, email y fullName son requeridos' });
    }

    // Buscar el plan
    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) {
      return res.status(400).json({ error: `Plan "${planId}" no encontrado` });
    }

    // Verificar si el email ya está registrado como orden aprobada
    const existing = await pool.query(
      `SELECT id FROM orders WHERE email = $1 AND status = 'APPROVED'`,
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Ese correo electrónico ya está registrado con una suscripción activa' });
    }

    const reference = buildReference(planId);
    const currency = 'COP';
    const { amountInCents } = plan;

    const integrity = buildIntegrityHash(reference, amountInCents, currency);

    // Guardar la orden pendiente en la BD
    await pool.query(
      `INSERT INTO orders
         (reference, plan_id, amount_in_cents, currency, status,
          email, full_name, company_name, industry, company_size,
          primary_goal, phone_number, phone_prefix, legal_id, legal_id_type)
       VALUES ($1,$2,$3,$4,'PENDING',$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        reference, planId, amountInCents, currency,
        email, fullName, companyName, industry, companySize,
        primaryGoal, phoneNumber, phoneNumberPrefix, legalId, legalIdType,
      ]
    );

    console.log(`✅ Orden creada: ${reference} | plan=${planId} | email=${email}`);

    return res.status(201).json({
      reference,
      amountInCents,
      currency,
      signature: integrity,                                      // hash puro (string)
      publicKey: process.env.WOMPI_PUBLIC_KEY || '',
      redirectUrl: process.env.WOMPI_REDIRECT_URL || '',
    });
  } catch (err) {
    console.error('createOrder error:', err);
    res.status(500).json({ error: 'Error interno al crear la orden' });
  }
}

/**
 * GET /payments/orders/status/:reference
 * Devuelve el estado de la orden según lo que guardó el webhook (o PENDING si aún no).
 */
export async function getOrderStatus(req, res) {
  try {
    const { reference } = req.params;
    if (!reference) return res.status(400).json({ error: 'reference requerida' });

    const result = await pool.query(
      `SELECT status FROM orders WHERE reference = $1`,
      [reference]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    return res.json({ status: result.rows[0].status });
  } catch (err) {
    console.error('getOrderStatus error:', err);
    res.status(500).json({ error: 'Error al consultar el estado' });
  }
}

/**
 * POST /payments/webhook
 * Recibe los eventos de Wompi y actualiza el estado de la orden.
 * Wompi envía un header `x-wompi-event` y firma el payload con HMAC-SHA256.
 */
export async function wompiWebhook(req, res) {
  try {
    const secret = process.env.WOMPI_EVENTS_SECRET;
    if (secret) {
      const signature = req.headers['x-wompi-signature'] || '';
      const hash = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== hash) {
        console.warn('⚠️  Webhook Wompi: firma inválida');
        return res.status(401).json({ error: 'Firma inválida' });
      }
    }

    const { event, data } = req.body;

    if (event === 'transaction.updated') {
      const { reference, status } = data?.transaction || {};
      if (reference && status) {
        await pool.query(
          `UPDATE orders SET status = $1, updated_at = NOW() WHERE reference = $2`,
          [status, reference]
        );
        console.log(`🔔 Webhook: orden ${reference} → ${status}`);
      }
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('wompiWebhook error:', err);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
}
