// Notatio Sinistra v1 - MusicXML Parser

import type { 
  Score, Staff, Measure, Note, Chord, 
  Pitch, NoteDuration, Accidental, Clef, 
  TimeSignature, KeySignature 
} from '../types/notation';

function parseAccidental(acc: string | null): Accidental {
  if (!acc) return null;
  const map: Record<string, Accidental> = {
    'sharp': 'sharp',
    'flat': 'flat',
    'natural': 'natural',
    'double-sharp': 'double-sharp',
    'double-flat': 'double-flat',
  };
  return map[acc] || null;
}

function parseDuration(type: string): NoteDuration {
  const map: Record<string, NoteDuration> = {
    'whole': 'whole',
    'half': 'half',
    'quarter': 'quarter',
    'eighth': 'eighth',
    '16th': '16th',
    '32nd': '32nd',
  };
  return map[type] || 'quarter';
}

function parseClef(clefNode: Element): Clef {
  const sign = clefNode.querySelector('sign')?.textContent?.toUpperCase();
  const line = clefNode.querySelector('line')?.textContent;
  
  if (sign === 'G' && line === '2') return 'treble';
  if (sign === 'F' && line === '4') return 'bass';
  if (sign === 'C' && line === '3') return 'alto';
  if (sign === 'C' && line === '4') return 'tenor';
  
  return 'treble';
}

function parseTimeSignature(attrNode: Element): TimeSignature | undefined {
  const timeNode = attrNode.querySelector('time');
  if (!timeNode) return undefined;
  
  const beats = parseInt(timeNode.querySelector('beats')?.textContent || '4', 10);
  const beatType = parseInt(timeNode.querySelector('beat-type')?.textContent || '4', 10);
  
  return { beats, beatType };
}

function parseKeySignature(attrNode: Element): KeySignature | undefined {
  const keyNode = attrNode.querySelector('key');
  if (!keyNode) return undefined;
  
  const fifths = parseInt(keyNode.querySelector('fifths')?.textContent || '0', 10);
  const mode = keyNode.querySelector('mode')?.textContent === 'minor' ? 'minor' : 'major';
  
  return { fifths, mode };
}

function parseNote(noteNode: Element): Note | null {
  const isRest = noteNode.querySelector('rest') !== null;
  
  const typeText = noteNode.querySelector('type')?.textContent || 'quarter';
  const duration = parseDuration(typeText);
  const dots = noteNode.querySelectorAll('dot').length;
  const voice = parseInt(noteNode.querySelector('voice')?.textContent || '1', 10);
  
  let pitch: Pitch | null = null;
  
  if (!isRest) {
    const pitchNode = noteNode.querySelector('pitch');
    if (pitchNode) {
      const step = (pitchNode.querySelector('step')?.textContent || 'C') as Pitch['step'];
      const octave = parseInt(pitchNode.querySelector('octave')?.textContent || '4', 10);
      const accidentalText = noteNode.querySelector('accidental')?.textContent || null;
      const alter = pitchNode.querySelector('alter')?.textContent;
      
      let accidental = parseAccidental(accidentalText);
      if (!accidental && alter) {
        const alterNum = parseInt(alter, 10);
        if (alterNum === 1) accidental = 'sharp';
        else if (alterNum === -1) accidental = 'flat';
        else if (alterNum === 2) accidental = 'double-sharp';
        else if (alterNum === -2) accidental = 'double-flat';
      }
      
      pitch = { step, octave, accidental };
    }
  }
  
  const tieNode = noteNode.querySelector('tie');
  const tied = tieNode !== null;
  
  const slurNode = noteNode.querySelector('notations > slur');
  const slurred = slurNode !== null;
  
  const beamNode = noteNode.querySelector('beam');
  let beam: Note['beam'] = null;
  if (beamNode) {
    const beamText = beamNode.textContent;
    if (beamText === 'begin') beam = 'begin';
    else if (beamText === 'continue') beam = 'continue';
    else if (beamText === 'end') beam = 'end';
  }
  
  return {
    pitch,
    duration,
    dots,
    isRest,
    tied,
    slurred,
    voice,
    beam,
  };
}

function parseMeasure(measureNode: Element, measureNumber: number): Measure {
  const elements: (Note | Chord)[] = [];
  
  const attrNode = measureNode.querySelector('attributes');
  let clef: Clef | undefined;
  let timeSignature: TimeSignature | undefined;
  let keySignature: KeySignature | undefined;
  
  if (attrNode) {
    const clefNode = attrNode.querySelector('clef');
    if (clefNode) clef = parseClef(clefNode);
    timeSignature = parseTimeSignature(attrNode);
    keySignature = parseKeySignature(attrNode);
  }
  
  const noteNodes = measureNode.querySelectorAll('note');
  let currentChord: Note[] = [];
  
  noteNodes.forEach((noteNode) => {
    const note = parseNote(noteNode);
    if (!note) return;
    
    const isChordMember = noteNode.querySelector('chord') !== null;
    
    if (isChordMember && currentChord.length > 0) {
      currentChord.push(note);
    } else {
      if (currentChord.length > 1) {
        const chord: Chord = {
          notes: currentChord,
          duration: currentChord[0].duration,
          dots: currentChord[0].dots,
        };
        elements.push(chord);
      } else if (currentChord.length === 1) {
        elements.push(currentChord[0]);
      }
      
      currentChord = [note];
    }
  });
  
  if (currentChord.length > 1) {
    const chord: Chord = {
      notes: currentChord,
      duration: currentChord[0].duration,
      dots: currentChord[0].dots,
    };
    elements.push(chord);
  } else if (currentChord.length === 1) {
    elements.push(currentChord[0]);
  }
  
  return {
    number: measureNumber,
    elements,
    timeSignature,
    keySignature,
    clef,
  };
}

export function parseMusicXML(xmlString: string): Score {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid MusicXML: ' + parseError.textContent);
  }
  
  const title = doc.querySelector('work > work-title')?.textContent || 
                doc.querySelector('movement-title')?.textContent || 
                undefined;
  const composer = doc.querySelector('identification > creator[type="composer"]')?.textContent || undefined;
  
  const partNodes = doc.querySelectorAll('part');
  const staves: Staff[] = [];
  
  let defaultTimeSignature: TimeSignature = { beats: 4, beatType: 4 };
  let defaultKeySignature: KeySignature = { fifths: 0, mode: 'major' };
  let defaultClef: Clef = 'treble';
  
  partNodes.forEach((partNode) => {
    const measureNodes = partNode.querySelectorAll('measure');
    const measures: Measure[] = [];
    let currentClef: Clef = defaultClef;
    
    measureNodes.forEach((measureNode, idx) => {
      const measureNum = parseInt(measureNode.getAttribute('number') || `${idx + 1}`, 10);
      const measure = parseMeasure(measureNode, measureNum);
      
      if (measure.clef) currentClef = measure.clef;
      
      if (idx === 0) {
        if (measure.timeSignature) defaultTimeSignature = measure.timeSignature;
        if (measure.keySignature) defaultKeySignature = measure.keySignature;
        if (measure.clef) defaultClef = measure.clef;
      }
      
      measures.push(measure);
    });
    
    staves.push({
      clef: currentClef,
      measures,
    });
  });
  
  return {
    title,
    composer,
    timeSignature: defaultTimeSignature,
    keySignature: defaultKeySignature,
    staves,
  };
}
