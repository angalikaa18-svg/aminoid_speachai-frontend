/**
 * Triggers a browser download for text content.
 * @param {string} content 
 * @param {string} filename 
 * @param {string} mimeType 
 */
export function downloadText(content, filename, mimeType = 'text/plain;charset=utf-8') {
  if (!content) return;
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

/**
 * Triggers a browser download for a Blob object.
 * @param {Blob} blob 
 * @param {string} filename 
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download a remote or local audio URL.
 * @param {string} url 
 * @param {string} filename 
 */
export function downloadUrl(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'audio.wav';
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
