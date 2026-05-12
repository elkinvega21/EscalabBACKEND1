import express from 'express';
import { getVoiceDemo } from '../controllers/voiceController.js';

const router = express.Router();

router.post('/demo', getVoiceDemo);

export default router;
