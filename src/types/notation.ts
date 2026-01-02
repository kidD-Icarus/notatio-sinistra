// Notatio Sinistra v1 - Core Types

export type NoteDuration = 'whole' | 'half' | 'quarter' | 'eighth' | '16th' | '32nd';
export type Accidental = 'sharp' | 'flat' | 'natural' | 'double-sharp' | 'double-flat' | null;
export type Clef = 'treble' | 'bass' | 'alto' | 'tenor';

export interface Pitch {
  step: 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
  octave: number;
  accidental: Accidental;
}

export interface Note {
  pitch: Pitch | null; // null for rests
  duration: NoteDuration;
  dots: number;
  isRest: boolean;
  tied?: boolean;
  slurred?: boolean;
  voice: number;
  beam?: 'begin' | 'continue' | 'end' | null;
}

export interface Chord {
  notes: Note[];
  duration: NoteDuration;
  dots: number;
}

export type MeasureElement = Note | Chord;

export interface TimeSignature {
  beats: number;
  beatType: number;
}

export interface KeySignature {
  fifths: number; // -7 to 7, negative = flats, positive = sharps
  mode: 'major' | 'minor';
}

export interface Measure {
  number: number;
  elements: MeasureElement[];
  timeSignature?: TimeSignature;
  keySignature?: KeySignature;
  clef?: Clef;
}

export interface Staff {
  clef: Clef;
  measures: Measure[];
}

export interface Score {
  title?: string;
  composer?: string;
  timeSignature: TimeSignature;
  keySignature: KeySignature;
  tempo?: number;
  staves: Staff[];
}

// Sinistra-specific: transformed score ready for RTL rendering
export interface SinistraScore extends Score {
  isTransformed: true;
  originalDirection: 'ltr';
}
