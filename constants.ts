import { GuitarString, StringName, TuningConfig } from './types';

export const TUNINGS: TuningConfig[] = [
  {
    id: 'standard',
    name: 'Standard',
    strings: [
      { name: StringName.STRING_6, frequency: 82.41, label: 'E', octave: 2 },
      { name: StringName.STRING_5, frequency: 110.00, label: 'A', octave: 2 },
      { name: StringName.STRING_4, frequency: 146.83, label: 'D', octave: 3 },
      { name: StringName.STRING_3, frequency: 196.00, label: 'G', octave: 3 },
      { name: StringName.STRING_2, frequency: 246.94, label: 'B', octave: 3 },
      { name: StringName.STRING_1, frequency: 329.63, label: 'e', octave: 4 },
    ]
  },
  {
    id: 'drop_d',
    name: 'Drop D',
    strings: [
      { name: StringName.STRING_6, frequency: 73.42, label: 'D', octave: 2 },
      { name: StringName.STRING_5, frequency: 110.00, label: 'A', octave: 2 },
      { name: StringName.STRING_4, frequency: 146.83, label: 'D', octave: 3 },
      { name: StringName.STRING_3, frequency: 196.00, label: 'G', octave: 3 },
      { name: StringName.STRING_2, frequency: 246.94, label: 'B', octave: 3 },
      { name: StringName.STRING_1, frequency: 329.63, label: 'e', octave: 4 },
    ]
  },
  {
    id: 'open_d',
    name: 'Open D',
    strings: [
      { name: StringName.STRING_6, frequency: 73.42, label: 'D', octave: 2 },
      { name: StringName.STRING_5, frequency: 110.00, label: 'A', octave: 2 },
      { name: StringName.STRING_4, frequency: 146.83, label: 'D', octave: 3 },
      { name: StringName.STRING_3, frequency: 185.00, label: 'F#', octave: 3 },
      { name: StringName.STRING_2, frequency: 220.00, label: 'A', octave: 3 },
      { name: StringName.STRING_1, frequency: 293.66, label: 'd', octave: 4 },
    ]
  },
  {
    id: 'open_g',
    name: 'Open G',
    strings: [
      { name: StringName.STRING_6, frequency: 73.42, label: 'D', octave: 2 },
      { name: StringName.STRING_5, frequency: 98.00, label: 'G', octave: 2 },
      { name: StringName.STRING_4, frequency: 146.83, label: 'D', octave: 3 },
      { name: StringName.STRING_3, frequency: 196.00, label: 'G', octave: 3 },
      { name: StringName.STRING_2, frequency: 246.94, label: 'B', octave: 3 },
      { name: StringName.STRING_1, frequency: 293.66, label: 'd', octave: 4 },
    ]
  }
];

export const PITCH_OFFSETS = [
  { value: 1, label: '+½ Step Up' },
  { value: 0, label: 'Standard' },
  { value: -1, label: '-½ Step' },
  { value: -2, label: '-1 Step' },
  { value: -3, label: '-1½ Steps' },
  { value: -4, label: '-2 Steps' },
];

export const STANDARD_TUNING = TUNINGS[0].strings;

export const ALL_NOTES: string[] = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
];

// Audio Context Constants
export const BUFFER_SIZE = 4096;
export const CLARITY_THRESHOLD = 0.9;
export const IN_TUNE_THRESHOLD_CENTS = 5; 
