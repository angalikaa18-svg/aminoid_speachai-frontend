export const SUPPORTED_AUDIO_EXTENSIONS = [
  '.wav',
  '.mp3',
  '.ogg',
  '.flac',
  '.m4a',
  '.webm',
  '.aac',
  '.wma',
];

export const MAX_AUDIO_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

export function isAudioFormatSupported(filename) {
  if (!filename) return false;
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  return SUPPORTED_AUDIO_EXTENSIONS.includes(ext);
}

export function isValidHttpUrl(string) {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
}

export function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
