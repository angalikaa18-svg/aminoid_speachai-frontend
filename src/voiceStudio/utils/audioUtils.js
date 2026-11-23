/**
 * Audio Utilities for Voice Studio
 * Handles browser-side audio validation, duration extraction, and format checks.
 */

import { AUDIO_CONSTRAINTS } from '../types/voiceStudioTypes';

/**
 * Validate an audio file against supported constraints.
 */
export function validateAudioFile(file) {
  if (!file) {
    return { valid: false, error: 'No audio file provided.' };
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!AUDIO_CONSTRAINTS.supportedFormats.includes(extension)) {
    return {
      valid: false,
      error: `Unsupported format ".${extension}". Supported formats: ${AUDIO_CONSTRAINTS.supportedFormats.join(', ').toUpperCase()}`,
    };
  }

  const maxBytes = AUDIO_CONSTRAINTS.maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds maximum allowed ${AUDIO_CONSTRAINTS.maxSizeMB} MB.`,
    };
  }

  return { valid: true };
}

/**
 * Measure audio duration in browser using HTMLAudioElement.
 */
export function getAudioDuration(fileOrBlob) {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(fileOrBlob);
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(audio.duration || 0);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(0);
      };
      audio.src = url;
    } catch {
      resolve(0);
    }
  });
}

/**
 * Format bytes into human readable string.
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
