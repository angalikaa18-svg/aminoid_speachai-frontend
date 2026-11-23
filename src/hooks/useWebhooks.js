import { useState } from 'react';
import { getApiBaseUrl } from '../api/apiClient';
import { WEBHOOK_BACKEND_STATUS, PROPOSED_WEBHOOK_EVENTS } from '../api/webhookApi';

export function useWebhooks() {
  const baseUrl = getApiBaseUrl();
  const [selectedLanguage, setSelectedLanguage] = useState('python'); // 'python' | 'javascript' | 'curl'
  const [activeTab, setActiveTab] = useState('callzenza'); // 'callzenza' | 'webhooks'

  // Code snippets for CallZenza integration
  const getCallZenzaSnippets = () => {
    return {
      python: `# CallZenza Local Speech AI Integration
# 100% Offline STT & TTS Connection

import requests

BASE_URL = "${baseUrl}"

def callzenza_transcribe_audio(file_path: str):
    """CallZenza Speech-to-Text via local Whisper engine."""
    with open(file_path, "rb") as f:
        files = {"file": f}
        data = {"vad_filter": "true", "language": "auto"}
        response = requests.post(f"{BASE_URL}/transcribe", files=files, data=data)
        response.raise_for_status()
        return response.json()

def callzenza_synthesize_voice(text: str, voice_id: str = None, rate: int = 175):
    """CallZenza Text-to-Speech via local engine."""
    payload = {
        "text": text,
        "voice_id": voice_id,
        "rate": rate,
        "volume": 1.0,
        "pitch": 50
    }
    response = requests.post(f"{BASE_URL}/api/v1/tts/generate", json=payload)
    response.raise_for_status()
    result = response.json()
    # Download or stream the generated audio
    audio_url = f"{BASE_URL}{result['audio_url']}"
    return {"audio_url": audio_url, "duration": result["duration"]}
`,
      javascript: `// CallZenza Local Speech AI Integration
// 100% Offline STT & TTS Connection (Node.js / Express / Fastify)

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const BASE_URL = '${baseUrl}';

// 1. Speech-to-Text: Transcribe Audio
async function callzenzaTranscribeAudio(filePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('vad_filter', 'true');
  form.append('language', 'auto');

  const response = await axios.post(\`\${BASE_URL}/transcribe\`, form, {
    headers: form.getHeaders(),
  });
  return response.data; // { text, language, duration, segments, srt }
}

// 2. Text-to-Speech: Synthesize Speech
async function callzenzaSynthesizeVoice(text, voiceId = null, rate = 175) {
  const response = await axios.post(\`\${BASE_URL}/api/v1/tts/generate\`, {
    text,
    voice_id: voiceId,
    rate,
    volume: 1.0,
    pitch: 50
  });
  return response.data; // { success, audio_url, filename, duration }
}

module.exports = { callzenzaTranscribeAudio, callzenzaSynthesizeVoice };
`,
      curl: `# 1. Transcribe Local Audio via STT
curl -X POST "${baseUrl}/transcribe" \\
  -F "file=@sample.wav" \\
  -F "vad_filter=true" \\
  -F "language=auto"

# 2. Synthesize Speech via TTS
curl -X POST "${baseUrl}/api/v1/tts/generate" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Hello, this is CallZenza speaking through local neural speech.",
    "rate": 175,
    "volume": 1.0,
    "pitch": 50
  }'

# 3. Retrieve Generated Audio File
curl -O "${baseUrl}/api/v1/tts/audio/{filename}.wav"
`,
    };
  };

  return {
    baseUrl,
    backendStatus: WEBHOOK_BACKEND_STATUS,
    events: PROPOSED_WEBHOOK_EVENTS,
    selectedLanguage,
    setSelectedLanguage,
    activeTab,
    setActiveTab,
    snippets: getCallZenzaSnippets(),
  };
}

export default useWebhooks;
