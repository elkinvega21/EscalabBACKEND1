import express from 'express';
import { createLead } from '../controllers/leadController.js';

const router = express.Router();

// Ruta para guardar un lead manual desde el formulario
router.post('/', createLead);

export default router;
