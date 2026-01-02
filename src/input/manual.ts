// Notatio Sinistra v1 - Manual Note Entry

import type { 
  Score, Measure, Note, 
  Pitch, NoteDuration, Clef, TimeSignature, KeySignature 
} from '../types/notation';

export interface ManualEntryState {
  currentMeasure: number;
  currentBeat: number;
  clef: Clef;
  timeSignature: TimeSignature;
  keySignature: KeySignature;
  measures: Measure[];
}

export function createEmptyState(): ManualEntryState {
  return {
    currentMeasure: 1,
    currentBeat: 1,
    clef: 'treble',
    timeSignature: { beats: 4, beatType: 4 },
    keySignature: { fifths: 0, mode: 'major' },
    measures: [{
      number: 1,
      elements: [],
    }],
  };
}

export function addNote(
  state: ManualEntryState,
  step: Pitch['step'],
  octave: number,
  duration: NoteDuration,
  accidental: Pitch['accidental'] = null
): ManualEntryState {
  const note: Note = {
    pitch: { step, octave, accidental },
    duration,
    dots: 0,
    isRest: false,
    voice: 1,
  };
  
  const newMeasures = [...state.measures];
  const currentMeasureIdx = state.currentMeasure - 1;
  
  if (currentMeasureIdx >= newMeasures.length) {
    newMeasures.push({
      number: state.currentMeasure,
      elements: [note],
    });
  } else {
    newMeasures[currentMeasureIdx] = {
      ...newMeasures[currentMeasureIdx],
      elements: [...newMeasures[currentMeasureIdx].elements, note],
    };
  }
  
  return {
    ...state,
    measures: newMeasures,
  };
}

export function addRest(
  state: ManualEntryState,
  duration: NoteDuration
): ManualEntryState {
  const rest: Note = {
    pitch: null,
    duration,
    dots: 0,
    isRest: true,
    voice: 1,
  };
  
  const newMeasures = [...state.measures];
  const currentMeasureIdx = state.currentMeasure - 1;
  
  if (currentMeasureIdx >= newMeasures.length) {
    newMeasures.push({
      number: state.currentMeasure,
      elements: [rest],
    });
  } else {
    newMeasures[currentMeasureIdx] = {
      ...newMeasures[currentMeasureIdx],
      elements: [...newMeasures[currentMeasureIdx].elements, rest],
    };
  }
  
  return {
    ...state,
    measures: newMeasures,
  };
}

export function nextMeasure(state: ManualEntryState): ManualEntryState {
  const newMeasureNum = state.currentMeasure + 1;
  const newMeasures = [...state.measures];
  
  if (newMeasureNum > newMeasures.length) {
    newMeasures.push({
      number: newMeasureNum,
      elements: [],
    });
  }
  
  return {
    ...state,
    currentMeasure: newMeasureNum,
    currentBeat: 1,
    measures: newMeasures,
  };
}

export function setClef(state: ManualEntryState, clef: Clef): ManualEntryState {
  return { ...state, clef };
}

export function setTimeSignature(
  state: ManualEntryState, 
  beats: number, 
  beatType: number
): ManualEntryState {
  return {
    ...state,
    timeSignature: { beats, beatType },
  };
}

export function setKeySignature(
  state: ManualEntryState,
  fifths: number,
  mode: 'major' | 'minor' = 'major'
): ManualEntryState {
  return {
    ...state,
    keySignature: { fifths, mode },
  };
}

export function stateToScore(state: ManualEntryState, title?: string): Score {
  return {
    title,
    timeSignature: state.timeSignature,
    keySignature: state.keySignature,
    staves: [{
      clef: state.clef,
      measures: state.measures.map((m, idx) => ({
        ...m,
        timeSignature: idx === 0 ? state.timeSignature : undefined,
        keySignature: idx === 0 ? state.keySignature : undefined,
        clef: idx === 0 ? state.clef : undefined,
      })),
    }],
  };
}

export function clearState(): ManualEntryState {
  return createEmptyState();
}

export function removeLastNote(state: ManualEntryState): ManualEntryState {
  const newMeasures = [...state.measures];
  const currentMeasureIdx = state.currentMeasure - 1;
  
  if (currentMeasureIdx < newMeasures.length) {
    const measure = newMeasures[currentMeasureIdx];
    if (measure.elements.length > 0) {
      newMeasures[currentMeasureIdx] = {
        ...measure,
        elements: measure.elements.slice(0, -1),
      };
    } else if (currentMeasureIdx > 0) {
      return {
        ...state,
        currentMeasure: state.currentMeasure - 1,
        measures: newMeasures.slice(0, -1),
      };
    }
  }
  
  return {
    ...state,
    measures: newMeasures,
  };
}
