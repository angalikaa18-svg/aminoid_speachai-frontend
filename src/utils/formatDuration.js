/**
 * Format duration in seconds to mm:ss or hh:mm:ss.
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return '0:00';
  }
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const paddedSecs = secs < 10 ? `0${secs}` : `${secs}`;

  if (hrs > 0) {
    const paddedMins = mins < 10 ? `0${mins}` : `${mins}`;
    return `${hrs}:${paddedMins}:${paddedSecs}`;
  }
  return `${mins}:${paddedSecs}`;
}

/**
 * Format timestamp for segments [00:01.23]
 */
export function formatTimestamp(seconds) {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return '00:00.00';
  }
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);
  const paddedMins = mins < 10 ? `0${mins}` : `${mins}`;
  const paddedSecs = Number(secs) < 10 ? `0${secs}` : `${secs}`;
  return `${paddedMins}:${paddedSecs}`;
}
