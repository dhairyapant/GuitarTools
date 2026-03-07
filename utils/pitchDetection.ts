/**
 * Implements the YIN Pitch Detection Algorithm with pre-processing.
 * See: http://audition.ens.fr/adc/pdf/2002_JASA_YIN.pdf
 */

// Frequency range for standard guitar tuning (plus headroom)
// Low E is ~82Hz. High E (12th fret) is ~660Hz.
// We allow a bit wider range for drop tunings or user error, but cap it to avoid high freq noise.
const MIN_FREQ = 65;
const MAX_FREQ = 1000;

// Threshold for the absolute threshold step (Step 3)
const YIN_THRESHOLD = 0.15;

export interface PitchResult {
  frequency: number;  // detected frequency in Hz, or -1 for silence/invalid
  clarity: number;    // 0.0 (noisy) to 1.0 (pure tone)
}

export const getRMS = (buffer: Float32Array): number => {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
};

export const autoCorrelate = (rawBuffer: Float32Array, sampleRate: number): PitchResult => {
  const SILENCE: PitchResult = { frequency: -1, clarity: 0 };

  // 1. RMS Check for Silence
  const rms = getRMS(rawBuffer);
  // Slightly higher noise floor threshold to reject background hum
  if (rms < 0.015) {
    return SILENCE;
  }

  // 2. Pre-processing: Simple Low-Pass Filter (Moving Average)
  // This helps suppress high-frequency harmonics and noise, making the fundamental clearer for YIN.
  const bufferLength = rawBuffer.length;
  const buffer = new Float32Array(bufferLength);
  for (let i = 0; i < bufferLength; i++) {
    if (i === 0 || i === bufferLength - 1) {
      buffer[i] = rawBuffer[i];
    } else {
      // 3-point moving average
      buffer[i] = (rawBuffer[i - 1] + rawBuffer[i] + rawBuffer[i + 1]) / 3;
    }
  }

  // We process up to half the buffer size to ensure overlap
  const yinBufferLength = Math.floor(bufferLength / 2);
  const yinBuffer = new Float32Array(yinBufferLength);

  // --- Step 1: Difference Function ---
  for (let tau = 0; tau < yinBufferLength; tau++) {
    yinBuffer[tau] = 0;
    for (let i = 0; i < yinBufferLength; i++) {
      const delta = buffer[i] - buffer[i + tau];
      yinBuffer[tau] += delta * delta;
    }
  }

  // --- Step 2: Cumulative Mean Normalized Difference Function ---
  yinBuffer[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < yinBufferLength; tau++) {
    runningSum += yinBuffer[tau];
    if (runningSum === 0) {
      yinBuffer[tau] = 1;
    } else {
      yinBuffer[tau] *= tau / runningSum;
    }
  }

  // --- Step 3: Absolute Threshold ---
  let tauEstimate = -1;
  for (let tau = 2; tau < yinBufferLength; tau++) {
    if (yinBuffer[tau] < YIN_THRESHOLD) {
      while (tau + 1 < yinBufferLength && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      tauEstimate = tau;
      break;
    }
  }

  // Fallback to global minimum if no threshold match
  let yinDipValue = 0; // Track the YIN dip for clarity calculation
  if (tauEstimate === -1) {
    let globalMin = 100;
    for (let tau = 2; tau < yinBufferLength; tau++) {
      if (yinBuffer[tau] < globalMin) {
        globalMin = yinBuffer[tau];
        tauEstimate = tau;
      }
    }
    // Stricter probability check for fallback
    if (globalMin > 0.3) {
      return SILENCE;
    }
    yinDipValue = globalMin;
  } else {
    yinDipValue = yinBuffer[tauEstimate];
  }

  // --- Step 4: Parabolic Interpolation ---
  let betterTau = tauEstimate;
  if (tauEstimate > 0 && tauEstimate < yinBufferLength - 1) {
    const s0 = yinBuffer[tauEstimate - 1];
    const s1 = yinBuffer[tauEstimate];
    const s2 = yinBuffer[tauEstimate + 1];
    const denom = 2 * s1 - s2 - s0;
    if (denom !== 0) {
      const adjustment = (s2 - s0) / (2 * denom);
      betterTau += adjustment;
    }
  }

  const frequency = sampleRate / betterTau;

  // --- Step 5: Frequency Range Sanity Check ---
  if (frequency < MIN_FREQ || frequency > MAX_FREQ) {
    return SILENCE;
  }

  // Clarity: 1.0 = perfect periodicity, 0.0 = noise
  // YIN dip of 0 means perfect match, so clarity = 1 - dip
  const clarity = Math.max(0, Math.min(1, 1 - yinDipValue));

  return { frequency, clarity };
};

export const noteFromPitch = (frequency: number) => {
  const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
  return Math.round(noteNum) + 69;
};

export const frequencyFromNoteNumber = (note: number) => {
  return 440 * Math.pow(2, (note - 69) / 12);
};

export const centsOffFromPitch = (frequency: number, note: number) => {
  return Math.floor(1200 * Math.log(frequency / frequencyFromNoteNumber(note)) / Math.log(2));
};
