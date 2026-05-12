import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chatRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors()); // Permitir peticiones desde el frontend
app.use(express.json()); // Permitir parsing de JSON en el body

// Rutas base
app.use('/api/chat', chatRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/voice', voiceRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor Backend de Escalab funcionando' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend escuchando en el puerto ${PORT}`);
});
