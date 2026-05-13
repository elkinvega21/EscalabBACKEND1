import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

// Configuración del Pool de conexiones para PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Inicializa la base de datos de forma asíncrona.
 * Crea las tablas necesarias si no existen.
 */
export const initDb = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conectado exitosamente a PostgreSQL (Supabase)');

    try {
      // Tabla de mensajes (Chat History)
      await client.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          session_id VARCHAR(255),
          is_form BOOLEAN DEFAULT FALSE,
          text TEXT NOT NULL,
          sender VARCHAR(50) NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('📊 Tabla "messages" verificada.');

      // Tabla de leads (Clientes Potenciales)
      await client.query(`
        CREATE TABLE IF NOT EXISTS leads (
          id SERIAL PRIMARY KEY,
          nombre VARCHAR(255),
          email VARCHAR(255) NOT NULL,
          empresa VARCHAR(255),
          telefono VARCHAR(50),
          mensaje TEXT,
          origen VARCHAR(50) DEFAULT 'formulario',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('📊 Tabla "leads" verificada.');

    } finally {
      client.release();
    }
  } catch (err) {
    console.error('❌ Error inicializando la base de datos:', err.message);
    // No matamos el proceso, permitimos que intente reconectar luego
  }
};

// Manejo de errores globales del pool
pool.on('error', (err) => {
  console.error('⚠️ Error inesperado en el pool de PostgreSQL:', err);
});

export default pool;
