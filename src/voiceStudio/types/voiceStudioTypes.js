/**
 * Voice Studio Types & Constants
 * Aligned with Qwen3-TTS architecture specification.
 */

export const QWEN_MODELS = [
  {
    id: 'Qwen/Qwen3-TTS-12Hz-1.7B-Base',
    name: 'Qwen3-TTS 1.7B Base (Voice Cloning)',
    type: 'base',
    size: '1.7B parameters (~3.5 GB)',
    features: ['3-Second Rapid Voice Clone', 'Speaker Embedding Extraction (x-vector)', 'In-Context Learning (ICL)'],
    languages: ['Chinese', 'English', 'Japanese', 'Korean', 'German', 'French', 'Russian', 'Portuguese', 'Spanish', 'Italian'],
    device: 'CUDA / CPU (int8/bf16)',
    status: 'Merged in qwen_tts (Weights download pending)',
  },
  {
    id: 'Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign',
    name: 'Qwen3-TTS 1.7B Voice Design',
    type: 'voice_design',
    size: '1.7B parameters (~3.5 GB)',
    features: ['Natural Language Voice Description', 'Timbre Synthesis', 'Emotion & Prosody Control'],
    languages: ['Chinese', 'English', 'Japanese', 'Korean', 'German', 'French', 'Russian', 'Portuguese', 'Spanish', 'Italian'],
    device: 'CUDA / CPU (int8/bf16)',
    status: 'Merged in qwen_tts (Weights download pending)',
  },
  {
    id: 'Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice',
    name: 'Qwen3-TTS 1.7B Custom Voice',
    type: 'custom_voice',
    size: '1.7B parameters (~3.5 GB)',
    features: ['9 Premium Speaker Personas', 'Instruction-Guided Emotion Control', 'Multi-Dialectal Voice Profiles'],
    languages: ['Chinese', 'English', 'Japanese', 'Korean', 'German', 'French', 'Russian', 'Portuguese', 'Spanish', 'Italian'],
    device: 'CUDA / CPU (int8/bf16)',
    status: 'Merged in qwen_tts (Weights download pending)',
  },
  {
    id: 'Qwen/Qwen3-TTS-12Hz-0.6B-Base',
    name: 'Qwen3-TTS 0.6B Base (Lightweight)',
    type: 'base',
    size: '0.6B parameters (~1.2 GB)',
    features: ['Low-Latency Voice Clone', 'CPU-Friendly Inference'],
    languages: ['Chinese', 'English', 'Japanese', 'Korean', 'German', 'French', 'Russian', 'Portuguese', 'Spanish', 'Italian'],
    device: 'Local CPU / GPU',
    status: 'Merged in qwen_tts (Weights download pending)',
  },
  {
    id: 'Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice',
    name: 'Qwen3-TTS 0.6B Custom Voice (Lightweight)',
    type: 'custom_voice',
    size: '0.6B parameters (~1.2 GB)',
    features: ['Fast Persona Synthesis', 'Low Memory Footprint'],
    languages: ['Chinese', 'English', 'Japanese', 'Korean', 'German', 'French', 'Russian', 'Portuguese', 'Spanish', 'Italian'],
    device: 'Local CPU / GPU',
    status: 'Merged in qwen_tts (Weights download pending)',
  },
];

export const SUPPORTED_LANGUAGES = [
  'Auto',
  'English',
  'Chinese',
  'Japanese',
  'Korean',
  'German',
  'French',
  'Russian',
  'Portuguese',
  'Spanish',
  'Italian',
];

export const AUDIO_CONSTRAINTS = {
  supportedFormats: ['wav', 'mp3', 'flac', 'ogg', 'm4a', 'webm'],
  maxSizeMB: 50,
  minDurationSeconds: 2,
  recommendedDurationSeconds: 15,
  maxDurationSeconds: 60,
};

export const DEFAULT_GENERATION_KWARGS = {
  max_new_tokens: 2048,
  temperature: 0.9,
  top_k: 50,
  top_p: 1.0,
  repetition_penalty: 1.05,
  do_sample: true,
};
