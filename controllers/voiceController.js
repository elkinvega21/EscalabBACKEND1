import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Genera audio usando OpenAI TTS (funciona desde servidores cloud, sin restricciones de free tier).
 * Voz: nova (la más natural en español), Modelo: tts-1-hd (alta calidad).
 */
export const getVoiceDemo = async (req, res) => {
  const { text } = req.body;

  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1-hd',   // Máxima calidad
      voice: 'nova',        // Voz femenina, la más natural para español
      input: text,
      speed: 1.0,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
    });
    res.send(buffer);

  } catch (error) {
    console.error('[OpenAI TTS] Error:', error?.message || error);
    res.status(500).json({
      error: 'Error al generar audio',
      detail: error?.message,
    });
  }
};
