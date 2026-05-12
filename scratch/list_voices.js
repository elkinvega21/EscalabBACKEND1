async function listPublicVoices() {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices');
    const data = await response.json();
    if (data.voices) {
      console.log('PUBLIC_VOICES_START');
      console.log(JSON.stringify(data.voices.slice(0, 10).map(v => ({ id: v.voice_id, name: v.name })), null, 2));
      console.log('PUBLIC_VOICES_END');
    } else {
      console.log('ERROR:', JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.log('FETCH_ERROR:', e.message);
  }
}

listPublicVoices();
