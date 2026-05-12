import express from 'express';
import { getMessages, sendMessage, getReaction, analyzeOnboarding } from '../controllers/chatController.js';

const router = express.Router();

// Ruta para obtener todos los mensajes
router.get('/messages', getMessages);

// Ruta para enviar un nuevo mensaje (y generar respuesta IA)
router.post('/message', sendMessage);

// Ruta para reaccionar a una categoría
router.post('/react', getReaction);

// Ruta para analizar el onboarding y generar resumen
router.post('/analyze', analyzeOnboarding);

export default router;
