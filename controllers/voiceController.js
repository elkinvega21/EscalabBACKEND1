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
      let errorBody = '';
      try {
        const errorData = await response.json();
        errorBody = JSON.stringify(errorData);
        console.error(`[ElevenLabs] Status ${response.status}:`, errorBody);
        return res.status(500).json({ 
          error: 'Error desde ElevenLabs', 
          status: response.status,
          detail: errorData 
        });
      } catch {
        errorBody = await response.text();
        console.error(`[ElevenLabs] Status ${response.status} (non-JSON):`, errorBody);
        return res.status(500).json({ error: 'Error desde ElevenLabs', detail: errorBody });
      }
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
    });
    res.send(buffer);

  } catch (error) {
    console.error('[Voice Controller] Error inesperado:', error.message);
    res.status(500).json({ error: 'Error al generar el audio de prueba', detail: error.message });
  }
};
