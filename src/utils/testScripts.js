/**
 * Standard Voice Testing Scripts for AMINOID Speech AI Studio
 * Designed to evaluate:
 * - Voice clarity
 * - Pronunciation
 * - Naturalness
 * - Speaking speed
 * - Sentence flow
 * - Question intonation
 * - Numbers & Phone numbers
 * - Dates & Times
 * - Names & Email addresses
 * - Pauses & Conversational quality
 */

export const DEFAULT_ENGLISH_TEST_SCRIPT =
  `Hello, welcome to AminoidSpeech. I am here to assist you today. How can I help you?\n` +
  `Our office is open from Monday to Friday, between 9:00 AM and 6:00 PM.\n` +
  `Your appointment is scheduled for November 25th, 2026, at 10:30 AM.\n` +
  `You can contact our support team at 9876543210 or send an email to support@aminoid.in.\n` +
  `Thank you for calling. Have a wonderful day!`;

export const LANGUAGE_TEST_SCRIPTS = {
  en: {
    label: 'English',
    langCode: 'en',
    script: DEFAULT_ENGLISH_TEST_SCRIPT,
  },
  hi: {
    label: 'Hindi (हिन्दी)',
    langCode: 'hi',
    script:
      `नमस्ते, अमिनॉइड स्पीच में आपका स्वागत है। आज मैं आपकी किस प्रकार सहायता कर सकता हूँ?\n` +
      `हमारा कार्यालय सोमवार से शुक्रवार, सुबह 9:00 बजे से शाम 6:00 बजे तक खुला रहता है।\n` +
      `आपका अपॉइंटमेंट 25 नवंबर 2026 को सुबह 10:30 बजे निर्धारित है।\n` +
      `आप हमारी सहायता टीम से 9876543210 पर संपर्क कर सकते हैं या support@aminoid.in पर ईमेल भेज सकते हैं।\n` +
      `कॉल करने के लिए धन्यवाद। आपका दिन शुभ हो!`,
  },
  ta: {
    label: 'Tamil (தமிழ்)',
    langCode: 'ta',
    script:
      `வணக்கம், அமினாய்டு ஸ்பீச்சிற்கு வரவேற்கிறோம். இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?\n` +
      `எங்கள் அலுவலகம் திங்கள் முதல் வெள்ளி வரை, காலை 9:00 மணி முதல் மாலை 6:00 மணி வரை இயங்கும்.\n` +
      `உங்கள் சந்திப்பு நவம்பர் 25, 2026 அன்று காலை 10:30 மணிக்கு திட்டமிடப்பட்டுள்ளது.\n` +
      `எங்கள் ஆதரவு குழுவை 9876543210 என்ற எண்ணில் தொடர்பு கொள்ளலாம் அல்லது support@aminoid.in என்ற மின்னஞ்சலுக்கு அனுப்பலாம்.\n` +
      `அழைத்ததற்கு நன்றி. நல்ல நாளாக அமையட்டும்!`,
  },
  te: {
    label: 'Telugu (తెలుగు)',
    langCode: 'te',
    script:
      `నమస్కారం, అమినాయిడ్ స్పీచ్‌కి స్వాగతం. ఈరోజు నేను మీకు ఎలా సహాయపడగలను?\n` +
      `మా కార్యాలయం సోమవారం నుండి శుక్రవారం వరకు ఉదయం 9:00 నుండి సాయంత్రం 6:00 వరకు తెరిచి ఉంటుంది.\n` +
      `మీ అపాయింట్‌మెంట్ నవంబర్ 25, 2026 ఉదయం 10:30 గంటలకు నిర్ణయించబడింది.\n` +
      `మీరు మా సపోర్ట్ బృందాన్ని 9876543210 లో సంప్రదించవచ్చు లేదా support@aminoid.in కి ఇమెయిల్ పంపవచ్చు.\n` +
      `కాల్ చేసినందుకు ధన్యవాదాలు. మీకు మంచి రోజు కలగాలని కోరుకుంటున్నాము!`,
  },
  ml: {
    label: 'Malayalam (മലയാളം)',
    langCode: 'ml',
    script:
      `നമസ്കാരം, അമിനോയിഡ് സ്പീച്ചിലേക്ക് സ്വാഗതം. ഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കണം?\n` +
      `ഞങ്ങളുടെ ഓഫീസ് തിങ്കൾ മുതൽ വെള്ളി വരെ രാവിലെ 9:00 മുതൽ വൈകുന്നേരം 6:00 വരെ പ്രവർത്തിക്കുന്നു.\n` +
      `നിങ്ങളുടെ അപ്പോയിന്റ്മെന്റ് 2026 നവംബർ 25-ന് രാവിലെ 10:30-ന് നിശ്ചയിച്ചിരിക്കുന്നു.\n` +
      `നിങ്ങൾക്ക് ഞങ്ങളുടെ പിന്തുണാ ടീമിനെ 9876543210 എന്ന നമ്പറിൽ ബന്ധപ്പെടാം അല്ലെങ്കിൽ support@aminoid.in എന്ന ഇമെയിലിലേക്ക് അയക്കാം.\n` +
      `വിളിച്ചതിന് നന്ദി. നല്ലൊരു ദിവസം ആശംസിക്കുന്നു!`,
  },
};

const STORAGE_KEY = 'aminoid_custom_voice_test_script';

/**
 * Get active test script dynamically for a specific voice.
 * Checks for user custom script first; if none, selects the language-aware default script.
 */
export function getScriptForVoice(voice, customScript = null) {
  if (customScript && typeof customScript === 'string' && customScript.trim()) {
    return customScript.trim();
  }

  if (!voice) return DEFAULT_ENGLISH_TEST_SCRIPT;

  const lang = (voice.language || '').toLowerCase().trim();

  if (lang.startsWith('ta')) return LANGUAGE_TEST_SCRIPTS.ta.script;
  if (lang.startsWith('hi')) return LANGUAGE_TEST_SCRIPTS.hi.script;
  if (lang.startsWith('te')) return LANGUAGE_TEST_SCRIPTS.te.script;
  if (lang.startsWith('ml')) return LANGUAGE_TEST_SCRIPTS.ml.script;
  if (lang.startsWith('en')) return LANGUAGE_TEST_SCRIPTS.en.script;

  // Generic fallback
  return DEFAULT_ENGLISH_TEST_SCRIPT;
}

/**
 * Get language label for a voice based on metadata.
 */
export function getLanguageScriptLabel(voice) {
  if (!voice) return 'English';
  const lang = (voice.language || '').toLowerCase().trim();
  if (lang.startsWith('ta')) return 'Tamil';
  if (lang.startsWith('hi')) return 'Hindi';
  if (lang.startsWith('te')) return 'Telugu';
  if (lang.startsWith('ml')) return 'Malayalam';
  return 'English';
}

/**
 * LocalStorage helpers for custom testing scripts.
 */
export function getSavedCustomScript() {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function saveCustomScript(script) {
  try {
    if (script && script.trim()) {
      localStorage.setItem(STORAGE_KEY, script.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function clearCustomScript() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}
