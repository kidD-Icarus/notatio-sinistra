// Notatio Sinistra v1 - RTL Transform
// Mirrors standard LTR notation to RTL (Sinistra) format

import type { 
  Score, SinistraScore, Staff, Measure, Note, Chord, MeasureElement 
} from '../types/notation';

function mirrorNote(note: Note): Note {
  return {
    ...note,
  };
}

function mirrorChord(chord: Chord): Chord {
  return {
    ...chord,
    notes: chord.notes.map(mirrorNote),
  };
}

function mirrorMeasure(measure: Measure): Measure {
  const reversedElements: MeasureElement[] = [...measure.elements].reverse().map((el) => {
    if ('notes' in el) {
      return mirrorChord(el as Chord);
    }
    return mirrorNote(el as Note);
  });
  
  return {
    ...measure,
    elements: reversedElements,
  };
}

function mirrorStaff(staff: Staff): Staff {
  const reversedMeasures = [...staff.measures].reverse().map(mirrorMeasure);
  
  return {
    ...staff,
    measures: reversedMeasures,
  };
}

export function transformToSinistra(score: Score): SinistraScore {
  const transformedStaves = score.staves.map(mirrorStaff);
  
  return {
    ...score,
    staves: transformedStaves,
    isTransformed: true,
    originalDirection: 'ltr',
  };
}

export function isSinistraScore(score: Score | SinistraScore): score is SinistraScore {
  return 'isTransformed' in score && score.isTransformed === true;
}

export function getMeasureAtPosition(staff: Staff, position: number, isSinistra: boolean): Measure | undefined {
  if (isSinistra) {
    return staff.measures[position];
  }
  return staff.measures[position];
}

export function calculateSystemLayout(
  staff: Staff, 
  measuresPerSystem: number,
  _isSinistra: boolean
): { systems: Measure[][] } {
  const systems: Measure[][] = [];
  
  for (let i = 0; i < staff.measures.length; i += measuresPerSystem) {
    const systemMeasures = staff.measures.slice(i, i + measuresPerSystem);
    systems.push(systemMeasures);
  }
  
  return { systems };
}
