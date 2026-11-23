import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global Neural Green Theme Stylesheets
import './styles/variables.css';
import './styles/global.css';
import './styles/layout.css';
import './styles/dashboard.css';
import './styles/stt.css';
import './styles/tts.css';
import './styles/webhooks.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
