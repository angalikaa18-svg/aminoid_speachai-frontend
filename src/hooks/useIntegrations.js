/**
 * React Hook for External Platform Integrations, API Keys & Webhook Management.
 */

import { useState, useEffect, useCallback } from 'react';
import { integrationApi } from '../api/integrationApi';

export function useIntegrations() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'platforms' | 'apikeys' | 'webhooks' | 'deliveries' | 'testing'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states
  const [overview, setOverview] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [voices, setVoices] = useState([]);
  const [callzenzaStatus, setCallzenzaStatus] = useState(null);
  const [eventCatalog, setEventCatalog] = useState({ categories: [], events: [] });

  // Selected base URL mode for code generator: 'localhost' | 'lan' | 'custom'
  const [urlMode, setUrlMode] = useState('localhost');
  const [customBaseUrl, setCustomBaseUrl] = useState('https://speech.yourcompany.com');

  // New API Key Modal state (shows raw key only once)
  const [createdKeyData, setCreatedKeyData] = useState(null);

  // Delivery filter state
  const [deliveryFilter, setDeliveryFilter] = useState({ event_name: '', status: '' });

  // Diagnostics test runner state
  const [diagnostics, setDiagnostics] = useState(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);

  // CallZenza operations state
  const [isConnectingCallZenza, setIsConnectingCallZenza] = useState(false);
  const [isTestingCallZenza, setIsTestingCallZenza] = useState(false);

  const runDiagnostics = useCallback(async (payload = {}) => {
    setIsRunningDiagnostics(true);
    try {
      const res = await integrationApi.runDiagnostics(payload);
      setDiagnostics(res);
      return res;
    } finally {
      setIsRunningDiagnostics(false);
    }
  }, []);

  // Load all initial data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ovRes, platRes, keysRes, whRes, delivRes, vRes, czRes, catRes] = await Promise.allSettled([
        integrationApi.getOverview(),
        integrationApi.getPlatforms(),
        integrationApi.getApiKeys(),
        integrationApi.getWebhookSubscriptions(),
        integrationApi.getDeliveries(deliveryFilter),
        integrationApi.getVoices(),
        integrationApi.getCallZenzaStatus(),
        integrationApi.getEventCatalog()
      ]);

      if (ovRes.status === 'fulfilled') setOverview(ovRes.value);
      if (platRes.status === 'fulfilled') setPlatforms(platRes.value?.platforms || []);
      if (keysRes.status === 'fulfilled') setApiKeys(keysRes.value?.keys || []);
      if (whRes.status === 'fulfilled') setWebhooks(whRes.value?.subscriptions || []);
      if (delivRes.status === 'fulfilled') setDeliveries(delivRes.value?.deliveries || []);
      if (vRes.status === 'fulfilled') setVoices(vRes.value?.voices || []);
      if (czRes.status === 'fulfilled') setCallzenzaStatus(czRes.value);
      if (catRes.status === 'fulfilled') setEventCatalog(catRes.value || { categories: [], events: [] });

      if (ovRes.status === 'rejected') {
        setError(ovRes.reason?.message || 'Failed to connect to integration backend.');
      }
    } catch (err) {
      setError(err.message || 'Error loading integration data');
    } finally {
      setIsLoading(false);
    }
  }, [deliveryFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh CallZenza status specifically
  const refreshCallZenza = async () => {
    try {
      const res = await integrationApi.getCallZenzaStatus();
      setCallzenzaStatus(res);
      return res;
    } catch (err) {
      console.error('Failed to refresh CallZenza status:', err);
    }
  };

  const connectCallZenza = async (payload) => {
    setIsConnectingCallZenza(true);
    try {
      const res = await integrationApi.connectCallZenza(payload);
      await loadData();
      return res;
    } finally {
      setIsConnectingCallZenza(false);
    }
  };

  const disconnectCallZenza = async () => {
    setIsConnectingCallZenza(true);
    try {
      const res = await integrationApi.disconnectCallZenza();
      await loadData();
      return res;
    } finally {
      setIsConnectingCallZenza(false);
    }
  };

  const testCallZenza = async (payload = {}) => {
    setIsTestingCallZenza(true);
    try {
      const res = await integrationApi.testCallZenza(payload);
      await refreshDeliveries(deliveryFilter);
      return res;
    } finally {
      setIsTestingCallZenza(false);
    }
  };

  const simulateCallZenzaSession = async (payload = {}) => {
    try {
      const res = await integrationApi.simulateCallZenzaSession(payload);
      await refreshDeliveries(deliveryFilter);
      return res;
    } catch (err) {
      throw err;
    }
  };

  // Refresh deliveries specifically when filter changes
  const refreshDeliveries = async (filters = {}) => {
    try {
      const res = await integrationApi.getDeliveries(filters);
      setDeliveries(res?.deliveries || []);
    } catch (err) {
      console.error('Failed to refresh deliveries:', err);
    }
  };

  // Compute active base URL for code samples and connectivity
  const getActiveBaseUrl = () => {
    if (urlMode === 'lan' && overview?.network?.lan_url) {
      return overview.network.lan_url;
    }
    if (urlMode === 'custom' && customBaseUrl) {
      return customBaseUrl.replace(/\/+$/, '');
    }
    return overview?.network?.localhost_url || integrationApi.getBaseUrl();
  };

  // ---------------------------------------------------------------------------
  // Dynamic Code Generation
  // ---------------------------------------------------------------------------
  const getSnippets = (lang, apiKey = 'YOUR_AMINOID_API_KEY', voiceId = 'actual_voice_id') => {
    const baseUrl = getActiveBaseUrl();
    const effectiveVoiceId = voices.length > 0 ? voices[0].voice_id : voiceId;

    if (lang === 'python') {
      return {
        stt: `# AMINOID Speech-to-Text (Python)
import requests

url = "${baseUrl}/api/v1/integrations/stt/transcribe"
headers = {
    "X-API-Key": "${apiKey}"
}
files = {
    "audio": open("recording.wav", "rb")
}
data = {
    "vad_filter": "true",
    "language": "auto"
}

response = requests.post(url, headers=headers, files=files, data=data)
print(response.json())
`,
        tts: `# AMINOID Text-to-Speech (Python)
import requests

url = "${baseUrl}/api/v1/integrations/tts/generate"
headers = {
    "X-API-Key": "${apiKey}",
    "Content-Type": "application/json"
}
payload = {
    "text": "Hello, this speech was generated by the local AMINOID AI engine.",
    "voice_id": "${effectiveVoiceId}",
    "format": "wav",
    "rate": 175
}

response = requests.post(url, headers=headers, json=payload)
result = response.json()
print("Generated audio URL:", result.get("audio_url"))
`,
        webhook_verify: `# AMINOID Webhook Signature Verification (Python / FastAPI / Flask)
import hmac
import hashlib

def verify_aminoid_signature(payload_bytes: bytes, timestamp: str, signature_header: str, secret_key: str) -> bool:
    """Verifies HMAC-SHA256 signature from X-Aminoid-Signature header."""
    signed_content = f"{timestamp}.".encode("utf-8") + payload_bytes
    expected_digest = hmac.new(secret_key.encode("utf-8"), signed_content, hashlib.sha256).hexdigest()
    expected_signature = f"sha256={expected_digest}"
    return hmac.compare_digest(expected_signature, signature_header)
`
      };
    }

    if (lang === 'nodejs' || lang === 'javascript') {
      return {
        stt: `// AMINOID Speech-to-Text (Node.js)
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function transcribeSpeech() {
  const form = new FormData();
  form.append('audio', fs.createReadStream('recording.wav'));
  form.append('vad_filter', 'true');

  const response = await axios.post('${baseUrl}/api/v1/integrations/stt/transcribe', form, {
    headers: {
      ...form.getHeaders(),
      'X-API-Key': '${apiKey}'
    }
  });
  console.log('Transcript:', response.data.text);
}
transcribeSpeech();
`,
        tts: `// AMINOID Text-to-Speech (Node.js)
const axios = require('axios');

async function synthesizeVoice() {
  const response = await axios.post('${baseUrl}/api/v1/integrations/tts/generate', {
    text: 'Hello, this speech was generated by the local AMINOID AI engine.',
    voice_id: '${effectiveVoiceId}',
    format: 'wav',
    rate: 175
  }, {
    headers: {
      'X-API-Key': '${apiKey}',
      'Content-Type': 'application/json'
    }
  });

  console.log('Audio URL:', response.data.audio_url);
}
synthesizeVoice();
`,
        webhook_verify: `// AMINOID Webhook Signature Verification (Node.js Express)
const crypto = require('crypto');

function verifyAminoidWebhook(rawBody, timestamp, signatureHeader, secretKey) {
  const signedContent = \`\${timestamp}.\${rawBody}\`;
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(signedContent);
  const expectedSignature = \`sha256=\${hmac.digest('hex')}\`;
  return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expectedSignature));
}
`
      };
    }

    // Default: cURL
    return {
      stt: `# AMINOID Speech-to-Text (cURL)
curl -X POST "${baseUrl}/api/v1/integrations/stt/transcribe" \\
  -H "X-API-Key: ${apiKey}" \\
  -F "audio=@recording.wav" \\
  -F "vad_filter=true"
`,
      tts: `# AMINOID Text-to-Speech (cURL)
curl -X POST "${baseUrl}/api/v1/integrations/tts/generate" \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Hello, this speech was generated by the local AMINOID AI engine.",
    "voice_id": "${effectiveVoiceId}",
    "format": "wav"
  }'
`,
      webhook_verify: `# Test Webhook Delivery via cURL
curl -X POST "${baseUrl}/api/v1/integrations/webhooks/test" \\
  -H "Content-Type: application/json" \\
  -d '{
    "target_url": "https://your-webhook-receiver.com/events",
    "secret_key": "YOUR_WEBHOOK_SECRET",
    "event_name": "stt.completed"
  }'
`
    };
  };

  return {
    activeTab,
    setActiveTab,
    isLoading,
    error,
    overview,
    platforms,
    apiKeys,
    webhooks,
    deliveries,
    voices,
    urlMode,
    setUrlMode,
    customBaseUrl,
    setCustomBaseUrl,
    createdKeyData,
    setCreatedKeyData,
    deliveryFilter,
    setDeliveryFilter,
    diagnostics,
    isRunningDiagnostics,
    runDiagnostics,
    callzenzaStatus,
    eventCatalog,
    isConnectingCallZenza,
    isTestingCallZenza,
    connectCallZenza,
    disconnectCallZenza,
    testCallZenza,
    simulateCallZenzaSession,
    refreshCallZenza,
    refreshAll: loadData,
    refreshDeliveries,
    getActiveBaseUrl,
    getSnippets
  };
}

export default useIntegrations;
