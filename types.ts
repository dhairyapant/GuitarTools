export interface Note {
  name: string;
  frequency: number;
  octave: number;
}

export interface TuningStatus {
  note: Note | null;
  frequency: number;
  deviation: number; // Cents
  isInTune: boolean;
}

export enum StringName {
  STRING_6 = '6',
  STRING_5 = '5',
  STRING_4 = '4',
  STRING_3 = '3',
  STRING_2 = '2',
  STRING_1 = '1',
  AUTO = 'AUTO'
}

export interface GuitarString {
  name: StringName;
  frequency: number;
  label: string;
  octave: number;
}

export interface TuningConfig {
  id: string;
  name: string;
  strings: GuitarString[];
}

export type NoteDetectionConfig = {
  clarityThreshold: number; // 0-1, confidence needed
  sampleRate: number;
  bufferSize: number;
};
