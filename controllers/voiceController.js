import 'dotenv/config';

export const getVoiceDemo = async (req, res) => {
  const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL' } = req.body; // Default voice: Bella

  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVEN_LABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail?.message || 'Error from ElevenLabs');
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
    });
    res.send(buffer);

  } catch (error) {
    console.error('Error generating voice:', error);
    res.status(500).json({ error: 'Error al generar el audio de prueba' });
  }
};
