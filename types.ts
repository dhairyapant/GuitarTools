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
  E2 = 'E2',
  A2 = 'A2',
  D3 = 'D3',
  G3 = 'G3',
  B3 = 'B3',
  E4 = 'E4',
  AUTO = 'AUTO'
}

export interface GuitarString {
  name: StringName;
  frequency: number;
  label: string;
}

export type NoteDetectionConfig = {
  clarityThreshold: number; // 0-1, confidence needed
  sampleRate: number;
  bufferSize: number;
};
