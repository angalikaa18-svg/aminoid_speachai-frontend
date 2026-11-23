/**
 * Webhook API Client
 * 
 * NOTE: The local backend does not currently have Webhook management endpoints implemented.
 * This module explicitly declares the feature status as unavailable on the backend
 * and documents the required backend contracts for future implementation.
 */

export const WEBHOOK_BACKEND_STATUS = {
  isAvailable: false,
  requiredEndpoints: [
    'GET /api/v1/webhooks',
    'POST /api/v1/webhooks',
    'DELETE /api/v1/webhooks/{id}',
    'POST /api/v1/webhooks/{id}/test',
    'GET /api/v1/webhooks/deliveries',
  ],
  message: 'Backend Webhook Management API is not implemented in the current backend engine.',
};

export const PROPOSED_WEBHOOK_EVENTS = [
  { id: 'stt.transcription.completed', label: 'Transcription Completed', desc: 'Triggered when local Whisper finishes audio transcription.' },
  { id: 'stt.transcription.failed', label: 'Transcription Failed', desc: 'Triggered when audio processing or Whisper fails.' },
  { id: 'tts.generation.completed', label: 'Speech Generation Completed', desc: 'Triggered when local SAPI5/Piper finishes audio generation.' },
  { id: 'tts.generation.failed', label: 'Speech Generation Failed', desc: 'Triggered when speech synthesis fails.' },
  { id: 'model.status.changed', label: 'Model Status Changed', desc: 'Triggered when an STT or TTS model is activated/swapped.' },
];

export const webhookApi = {
  getStatus() {
    return WEBHOOK_BACKEND_STATUS;
  },

  getAvailableEvents() {
    return PROPOSED_WEBHOOK_EVENTS;
  },
};

export default webhookApi;
