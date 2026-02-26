import axios from 'axios'

/**
 * Convert text to speech using Google Cloud Text-to-Speech API
 * Returns base64 encoded MP3 audio
 */
export async function textToSpeech(text: string): Promise<string> {
  try {
    const response = await axios.post(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_CLOUD_API_KEY}`,
      {
        input: { text },
        voice: {
          languageCode: 'hi-IN', // Hindi (India)
          name: 'hi-IN-Wavenet-D', // Male voice
          ssmlGender: 'MALE'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 0.9, // Slightly slower for clarity
          pitch: 0
        }
      }
    )

    return response.data.audioContent // Base64 encoded MP3
  } catch (error) {
    console.error('Text-to-speech error:', error)
    throw new Error('Failed to generate speech')
  }
}

/**
 * Upload audio to temporary storage and return public URL
 * For production, use Supabase Storage or S3
 */
export async function uploadAudioToTwilio(audioBase64: string): Promise<string> {
  // For now, we'll use Twilio's media URL directly
  // In production, upload to Supabase Storage:
  // const { data } = await supabase.storage
  //   .from('audio')
  //   .upload(`tts/${Date.now()}.mp3`, Buffer.from(audioBase64, 'base64'))
  
  // For demo: return data URL (Twilio accepts this for small files)
  return `data:audio/mp3;base64,${audioBase64}`
}
