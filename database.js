import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

// Conectar a la base de datos Supabase usando la URL del .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Requerido por algunos servicios en la nube como Supabase
  }
});

// Probar la conexión e inicializar tablas
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error conectando a Supabase:', err.stack);
  } else {
    console.log('Conectado exitosamente a PostgreSQL (Supabase)');
    
    // Crear tabla de mensajes
    client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255),
        is_form BOOLEAN DEFAULT FALSE,
        text TEXT NOT NULL,
        sender VARCHAR(50) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creando tabla messages:', err);
      } else {
        console.log('Tabla "messages" lista en PostgreSQL.');
        // Migración: Asegurar que session_id existe si la tabla ya fue creada
        client.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS session_id VARCHAR(255)')
          .catch(e => console.log('La columna session_id ya existe o no se pudo agregar.'));
        // Migración: Asegurar que is_form existe
        client.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_form BOOLEAN DEFAULT FALSE')
          .catch(e => console.log('La columna is_form ya existe o no se pudo agregar.'));
      }
    });

    // Crear tabla de leads (clientes potenciales)
    client.query(`
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
    `, (err) => {
      if (err) {
        console.error('Error creando tabla leads:', err);
      } else {
        console.log('Tabla "leads" lista en PostgreSQL.');
        
        // Intentar agregar la columna telefono por si la tabla ya existía
        client.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS telefono VARCHAR(50)')
          .catch(e => console.log('La columna telefono ya existe o no se pudo agregar.'));
      }
      release(); // Liberar el cliente
    });
  }
});

export default pool;
