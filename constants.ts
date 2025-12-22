import { GuitarString, StringName, Note } from './types';

export const STANDARD_TUNING: GuitarString[] = [
  { name: StringName.E2, frequency: 82.41, label: 'E' },
  { name: StringName.A2, frequency: 110.00, label: 'A' },
  { name: StringName.D3, frequency: 146.83, label: 'D' },
  { name: StringName.G3, frequency: 196.00, label: 'G' },
  { name: StringName.B3, frequency: 246.94, label: 'B' },
  { name: StringName.E4, frequency: 329.63, label: 'e' },
];

export const ALL_NOTES: string[] = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
];

// Audio Context Constants
export const BUFFER_SIZE = 2048;
export const CLARITY_THRESHOLD = 0.9;
export const IN_TUNE_THRESHOLD_CENTS = 5; 
