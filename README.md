# AMINOID Local Speech AI Studio — Frontend

Production React frontend for **AMINOID Local Speech AI Studio**, a 100% offline, privacy-first Speech-to-Text (Faster-Whisper) and Text-to-Speech (SAPI5/Piper) engine.

Designed under the **Neural Green** design system with dark forest backgrounds, deep-green glass surfaces, mint-green interactive accents, and client-side audio waveforms.

---

## 1. Design System — Exact Neural Green Theme

- **Forest Black**: `#0C1514` (Page Canvas & Background)
- **Deep Green**: `#192B26` (Cards, Surfaces, Sidebar)
- **Moss Green**: `#416B58` (Borders, Accents, Secondary Controls)
- **Mint Green**: `#65E6A5` (Primary Actions, Active Badges, Glowing Highlights)
- **Mist White**: `#E4F2EB` (Primary Headings & High-Contrast Typography)
- **Muted Green-Grey**: `#9BB3A8` (Secondary & Helper Prose)

---

## 2. Architecture & Directory Structure

```
deepgram frontend/
├── package.json               # Dependencies (React 18, Vite, React Router, Axios, Lucide)
├── vite.config.js             # Vite development server configuration
├── index.html                 # Entry HTML with preloaded typography
├── .env.example               # Frontend environment template
├── .env                       # Configured backend URL (VITE_API_BASE_URL)
│
├── src/
│   ├── main.jsx               # React entry point with global stylesheets
│   ├── App.jsx                # Root application with Toast & Router providers
│   │
│   ├── router/
│   │   └── AppRouter.jsx      # Navigation layout, sidebar toggle, route mappings
│   │
│   ├── api/
│   │   ├── apiClient.js       # Central Axios client with error normalization
│   │   ├── healthApi.js       # Backend connection monitoring & health checks
│   │   ├── sttApi.js          # Speech-to-Text transcription & language discovery
│   │   ├── ttsApi.js          # Text-to-Speech synthesis & voice discovery
│   │   ├── modelApi.js        # Model status and offline activation
│   │   ├── historyApi.js      # Activity history for STT & TTS records
│   │   └── webhookApi.js      # Webhook specification & backend readiness audit
│   │
│   ├── hooks/
│   │   ├── useHealth.js       # Auto-polling health & hardware monitor
│   │   ├── useSTT.js          # Audio file handling, mic recording, transcription
│   │   ├── useTTS.js          # Speech synthesis parameters & voice manager
│   │   └── useWebhooks.js     # CallZenza dynamic code generators & webhook specs
│   │
│   ├── components/
│   │   ├── Sidebar.jsx        # Persistent, collapsible sidebar with security badge
│   │   ├── Topbar.jsx         # Connection status, engine badge, hardware monitor
│   │   ├── StatusBadge.jsx    # Reusable Neural Green status pill
│   │   ├── StatCard.jsx       # Dynamic metric card with glowing hover
│   │   ├── AudioWaveform.jsx  # Real HTML5 canvas audio waveform renderer
│   │   ├── AudioPlayer.jsx    # Complete audio playback & seek bar
│   │   ├── FileUpload.jsx     # Drag-and-drop zone + in-browser microphone recording
│   │   ├── LoadingState.jsx   # Mint-green pulsing loader
│   │   ├── ErrorMessage.jsx   # Dismissible error alert banner
│   │   ├── EmptyState.jsx     # Visual empty state
│   │   ├── Toast.jsx          # Non-intrusive notification system
│   │   └── ConfirmDialog.jsx  # Modal confirmation dialog
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx      # Metric cards + side-by-side quick STT/TTS studio
│   │   ├── STTPage.jsx        # Dedicated STT workspace with timestamps & exports
│   │   ├── TTSPage.jsx        # Dedicated TTS studio with voice audition & audio player
│   │   ├── ModelsPage.jsx     # Real model status & activation
│   │   ├── VoiceLibraryPage.jsx # Local voice catalog with live test synthesis
│   │   ├── WebhooksPage.jsx   # CallZenza developer bridge + webhook specifications
│   │   ├── HistoryPage.jsx    # Real backend transcription & audio playback history
│   │   ├── SettingsPage.jsx   # Base URL settings, inference defaults, latency test
│   │   └── AboutPage.jsx      # Architecture, security guarantees & specifications
│   │
│   ├── utils/
│   │   ├── formatDuration.js  # mm:ss and timestamp formatters
│   │   ├── downloadFile.js    # Browser download triggers for Blob/TXT/SRT/JSON
│   │   ├── audioUtils.js      # Native Web Audio API waveform amplitude extractor
│   │   └── validators.js      # Audio format and URL validation
│   │
│   ├── styles/
│   │   ├── variables.css      # Neural Green color palette and tokens
│   │   ├── global.css         # Reset, buttons, inputs, scrollbars, cards
│   │   ├── layout.css         # Sidebar, topbar, mobile drawer layouts
│   │   ├── dashboard.css      # Stat cards & split workspace styles
│   │   ├── stt.css            # Dropzone & segment timestamp list
│   │   ├── tts.css            # Large text editor & audio player controls
│   │   └── webhooks.css       # CallZenza code cards & webhook specification styles
│   │
│   └── assets/
│       └── logo.svg           # Neural Green studio SVG brand mark
│
└── README.md
```

---

## 3. Real Backend API Integrations

All data displayed in the dashboard is retrieved dynamically from the backend at `http://127.0.0.1:8080`. No data or model names are hardcoded.

| Service | HTTP Method | Route | Description |
|---|---|---|---|
| Health & Mode | `GET` | `/health` | Live backend health, offline status, engine hardware |
| STT Transcribe | `POST` | `/transcribe` | Faster-Whisper local audio transcription |
| STT Alternate | `POST` | `/api/v1/stt/transcribe` | REST endpoint for speech recognition |
| STT Languages | `GET` | `/api/v1/stt/languages` | Supported spoken languages catalog |
| STT Models | `GET` | `/api/v1/stt/models` | Installed Whisper models |
| STT History | `GET` | `/api/v1/stt/history` | Real logged transcription records |
| TTS Generate | `POST` | `/api/v1/tts/generate` | Local SAPI5/Piper speech synthesis |
| TTS Voices | `GET` | `/api/v1/tts/voices` | Installed Windows SAPI5 voices |
| TTS Languages | `GET` | `/api/v1/tts/languages` | Supported voice synthesis languages |
| TTS Audio Stream | `GET` | `/api/v1/tts/audio/{filename}` | Direct WAV audio streaming and playback |
| TTS History | `GET` | `/api/v1/tts/history` | Real logged speech synthesis records |
| Model Status | `GET` | `/api/v1/models/status` | Active STT & TTS loaded states |
| Model Activate | `POST` | `/api/v1/models/activate` | Activate local model (e.g. `faster-whisper-tiny`) |

---

## 4. CallZenza Integration

CallZenza can immediately integrate with this local Speech AI engine without external cloud APIs.

### A. Speech-to-Text (STT) for Inbound Call Audio
Submit caller audio to:
```bash
POST http://127.0.0.1:8080/transcribe
Content-Type: multipart/form-data
file=@caller_stream.wav
vad_filter=true
language=auto
```
Returns:
```json
{
  "text": "Hello, I would like to schedule an appointment.",
  "language": "en",
  "duration": 3.45,
  "segments": [...]
}
```

### B. Text-to-Speech (TTS) for Voice Responses
Synthesize agent responses:
```bash
POST http://127.0.0.1:8080/api/v1/tts/generate
Content-Type: application/json

{
  "text": "Certainly, I can help you schedule that appointment right now.",
  "rate": 175,
  "volume": 1.0,
  "pitch": 50
}
```
Returns:
```json
{
  "success": true,
  "audio_url": "/api/v1/tts/audio/tts_abc123.wav",
  "filename": "tts_abc123.wav",
  "duration": 4.12
}
```

---

## 5. Webhook Status & Transparency

The current local backend does not include a dynamic webhook dispatcher daemon. The Webhooks page transparently informs developers and provides:
1. **Working REST endpoints** that CallZenza can use today.
2. **Technical specifications** for the required backend webhook daemon (`/api/v1/webhooks`, `/api/v1/webhooks/deliveries`) for future implementation.

---

## 6. How to Run the Frontend

### Prerequisites
- Node.js `v18+` (Tested on `v24.21.0`)
- npm `v9+` (Tested on `v11.19.0`)
- Local backend running at `http://127.0.0.1:8080`

### Step 1: Install Dependencies
```bash
cd "deepgram frontend"
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```
The studio will launch at:
`http://localhost:5173`

### Step 3: Production Build
```bash
npm run build
```
Generates optimized static assets in `dist/`.
