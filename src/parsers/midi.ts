// Notatio Sinistra v1 - MIDI Parser

import { Midi } from '@tonejs/midi';
import type { 
  Score, Staff, Measure, Note, 
  Pitch, NoteDuration, TimeSignature, KeySignature, Clef 
} from '../types/notation';

function midiNoteToPitch(midiNote: number): Pitch {
  const noteNames: Pitch['step'][] = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B'];
  const accidentals: (Pitch['accidental'])[] = [null, 'sharp', null, 'sharp', null, null, 'sharp', null, 'sharp', null, 'sharp', null];
  
  const octave = Math.floor(midiNote / 12) - 1;
  const noteIndex = midiNote % 12;
  
  return {
    step: noteNames[noteIndex],
    octave,
    accidental: accidentals[noteIndex],
  };
}

function durationToNoteDuration(durationSecs: number, tempo: number): NoteDuration {
  const quarterNoteDuration = 60 / tempo;
  const ratio = durationSecs / quarterNoteDuration;
  
  if (ratio >= 3.5) return 'whole';
  if (ratio >= 1.75) return 'half';
  if (ratio >= 0.875) return 'quarter';
  if (ratio >= 0.4375) return 'eighth';
  if (ratio >= 0.21875) return '16th';
  return '32nd';
}

function determineClef(notes: { midi: number }[]): Clef {
  if (notes.length === 0) return 'treble';
  
  const avgMidi = notes.reduce((sum, n) => sum + n.midi, 0) / notes.length;
  
  if (avgMidi < 48) return 'bass';
  if (avgMidi < 60) return 'bass';
  return 'treble';
}

export async function parseMIDI(arrayBuffer: ArrayBuffer): Promise<Score> {
  const midi = new Midi(arrayBuffer);
  
  const tempo = midi.header.tempos.length > 0 ? midi.header.tempos[0].bpm : 120;
  
  const timeSigEvent = midi.header.timeSignatures[0];
  const timeSignature: TimeSignature = timeSigEvent 
    ? { beats: timeSigEvent.timeSignature[0], beatType: timeSigEvent.timeSignature[1] }
    : { beats: 4, beatType: 4 };
  
  const keySignature: KeySignature = { fifths: 0, mode: 'major' };
  
  const staves: Staff[] = [];
  
  for (const track of midi.tracks) {
    if (track.notes.length === 0) continue;
    
    const clef = determineClef(track.notes);
    const measures: Measure[] = [];
    
    const measureDuration = (timeSignature.beats * 60) / tempo;
    
    const notesByMeasure = new Map<number, typeof track.notes>();
    
    for (const note of track.notes) {
      const measureNum = Math.floor(note.time / measureDuration) + 1;
      if (!notesByMeasure.has(measureNum)) {
        notesByMeasure.set(measureNum, []);
      }
      notesByMeasure.get(measureNum)!.push(note);
    }
    
    const maxMeasure = Math.max(...notesByMeasure.keys(), 1);
    
    for (let m = 1; m <= maxMeasure; m++) {
      const measureNotes = notesByMeasure.get(m) || [];
      const elements: Note[] = [];
      
      measureNotes.sort((a, b) => a.time - b.time);
      
      for (const midiNote of measureNotes) {
        const pitch = midiNoteToPitch(midiNote.midi);
        const duration = durationToNoteDuration(midiNote.duration, tempo);
        
        const note: Note = {
          pitch,
          duration,
          dots: 0,
          isRest: false,
          voice: 1,
        };
        
        elements.push(note);
      }
      
      if (elements.length === 0) {
        elements.push({
          pitch: null,
          duration: 'whole',
          dots: 0,
          isRest: true,
          voice: 1,
        });
      }
      
      measures.push({
        number: m,
        elements,
        timeSignature: m === 1 ? timeSignature : undefined,
        keySignature: m === 1 ? keySignature : undefined,
        clef: m === 1 ? clef : undefined,
      });
    }
    
    staves.push({
      clef,
      measures,
    });
  }
  
  if (staves.length === 0) {
    staves.push({
      clef: 'treble',
      measures: [{
        number: 1,
        elements: [{
          pitch: null,
          duration: 'whole',
          dots: 0,
          isRest: true,
          voice: 1,
        }],
        timeSignature,
        keySignature,
        clef: 'treble',
      }],
    });
  }
  
  return {
    title: midi.name || undefined,
    timeSignature,
    keySignature,
    tempo,
    staves,
  };
}
