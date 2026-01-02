// Notatio Sinistra v1 - VexFlow Renderer

import { 
  Renderer, 
  Stave, 
  StaveNote, 
  Voice, 
  Formatter,
  Beam,
  Accidental,
  Dot,
} from 'vexflow';
import type { 
  Score, SinistraScore, Staff, Measure, Note, Chord,
  Pitch, NoteDuration, Clef
} from '../types/notation';

function toVexDuration(duration: NoteDuration, isRest: boolean): string {
  const map: Record<NoteDuration, string> = {
    'whole': 'w',
    'half': 'h',
    'quarter': 'q',
    'eighth': '8',
    '16th': '16',
    '32nd': '32',
  };
  return map[duration] + (isRest ? 'r' : '');
}

function toVexKey(pitch: Pitch): string {
  const accidentalMap: Record<string, string> = {
    'sharp': '#',
    'flat': 'b',
    'natural': 'n',
    'double-sharp': '##',
    'double-flat': 'bb',
  };
  
  const acc = pitch.accidental ? accidentalMap[pitch.accidental] : '';
  return `${pitch.step.toLowerCase()}${acc}/${pitch.octave}`;
}

function toVexClef(clef: Clef): string {
  const map: Record<Clef, string> = {
    'treble': 'treble',
    'bass': 'bass',
    'alto': 'alto',
    'tenor': 'tenor',
  };
  return map[clef];
}

function toVexKeySignature(fifths: number): string {
  const keys = ['Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
  return keys[fifths + 7] || 'C';
}

export interface RenderOptions {
  width: number;
  height: number;
  measuresPerLine: number;
  staveWidth: number;
  staveHeight: number;
  marginLeft: number;
  marginTop: number;
  isSinistra: boolean;
}

const DEFAULT_OPTIONS: RenderOptions = {
  width: 1200,
  height: 800,
  measuresPerLine: 4,
  staveWidth: 250,
  staveHeight: 150,
  marginLeft: 50,
  marginTop: 50,
  isSinistra: true,
};

export class SinistraRenderer {
  private renderer: Renderer;
  private context: ReturnType<Renderer['getContext']>;
  private options: RenderOptions;
  private container: HTMLDivElement;
  
  constructor(containerEl: HTMLElement, options: Partial<RenderOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    this.container = document.createElement('div');
    containerEl.innerHTML = '';
    containerEl.appendChild(this.container);
    
    this.renderer = new Renderer(this.container, Renderer.Backends.SVG);
    this.renderer.resize(this.options.width, this.options.height);
    this.context = this.renderer.getContext();
  }
  
  clear(): void {
    this.container.innerHTML = '';
    this.renderer = new Renderer(this.container, Renderer.Backends.SVG);
    this.renderer.resize(this.options.width, this.options.height);
    this.context = this.renderer.getContext();
  }
  
  resize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;
    this.renderer.resize(width, height);
  }
  
  render(score: Score | SinistraScore): void {
    this.clear();
    
    const isSinistra = 'isTransformed' in score && score.isTransformed;
    let y = this.options.marginTop;
    
    for (const staff of score.staves) {
      y = this.renderStaff(staff, score, y, isSinistra);
    }
  }
  
  private renderStaff(
    staff: Staff, 
    score: Score, 
    startY: number,
    isSinistra: boolean
  ): number {
    const { measuresPerLine, staveWidth, marginLeft, staveHeight } = this.options;
    let y = startY;
    
    const lines: Measure[][] = [];
    for (let i = 0; i < staff.measures.length; i += measuresPerLine) {
      lines.push(staff.measures.slice(i, i + measuresPerLine));
    }
    
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const lineMeasures = lines[lineIdx];
      
      for (let mIdx = 0; mIdx < lineMeasures.length; mIdx++) {
        const measure = lineMeasures[mIdx];
        
        let x: number;
        if (isSinistra) {
          x = this.options.width - marginLeft - staveWidth - (mIdx * staveWidth);
        } else {
          x = marginLeft + (mIdx * staveWidth);
        }
        
        const stave = new Stave(x, y, staveWidth);
        
        if (mIdx === 0 || (isSinistra && mIdx === lineMeasures.length - 1)) {
          const isFirstMeasureOfLine = isSinistra ? mIdx === lineMeasures.length - 1 : mIdx === 0;
          
          if (lineIdx === 0 && isFirstMeasureOfLine) {
            stave.addClef(toVexClef(staff.clef));
            stave.addTimeSignature(`${score.timeSignature.beats}/${score.timeSignature.beatType}`);
            stave.addKeySignature(toVexKeySignature(score.keySignature.fifths));
          } else if (isFirstMeasureOfLine) {
            stave.addClef(toVexClef(staff.clef));
          }
        }
        
        stave.setContext(this.context).draw();
        
        const notes = this.createNotes(measure, staff.clef);
        
        if (notes.length > 0) {
          const voice = new Voice({ 
            numBeats: score.timeSignature.beats, 
            beatValue: score.timeSignature.beatType 
          }).setStrict(false);
          
          voice.addTickables(notes);
          
          new Formatter().joinVoices([voice]).format([voice], staveWidth - 50);
          voice.draw(this.context, stave);
          
          this.drawBeams(notes);
        }
      }
      
      y += staveHeight;
    }
    
    return y;
  }
  
  private createNotes(measure: Measure, clef: Clef): StaveNote[] {
    const notes: StaveNote[] = [];
    
    for (const element of measure.elements) {
      if ('notes' in element) {
        const chord = element as Chord;
        const keys = chord.notes
          .filter(n => n.pitch)
          .map(n => toVexKey(n.pitch!));
        
        if (keys.length > 0) {
          const staveNote = new StaveNote({
            keys,
            duration: toVexDuration(chord.duration, false),
            clef: toVexClef(clef),
          });
          
          chord.notes.forEach((n, idx) => {
            if (n.pitch?.accidental) {
              staveNote.addModifier(new Accidental(
                n.pitch.accidental === 'sharp' ? '#' :
                n.pitch.accidental === 'flat' ? 'b' :
                n.pitch.accidental === 'natural' ? 'n' :
                n.pitch.accidental === 'double-sharp' ? '##' : 'bb'
              ), idx);
            }
          });
          
          for (let d = 0; d < chord.dots; d++) {
            Dot.buildAndAttach([staveNote], { all: true });
          }
          
          notes.push(staveNote);
        }
      } else {
        const note = element as Note;
        
        let keys: string[];
        if (note.isRest) {
          keys = ['b/4'];
        } else if (note.pitch) {
          keys = [toVexKey(note.pitch)];
        } else {
          continue;
        }
        
        const staveNote = new StaveNote({
          keys,
          duration: toVexDuration(note.duration, note.isRest),
          clef: toVexClef(clef),
        });
        
        if (!note.isRest && note.pitch?.accidental) {
          staveNote.addModifier(new Accidental(
            note.pitch.accidental === 'sharp' ? '#' :
            note.pitch.accidental === 'flat' ? 'b' :
            note.pitch.accidental === 'natural' ? 'n' :
            note.pitch.accidental === 'double-sharp' ? '##' : 'bb'
          ), 0);
        }
        
        for (let d = 0; d < note.dots; d++) {
          Dot.buildAndAttach([staveNote], { all: true });
        }
        
        notes.push(staveNote);
      }
    }
    
    return notes;
  }
  
  private drawBeams(notes: StaveNote[]): void {
    const beamableNotes: StaveNote[] = [];
    
    for (const note of notes) {
      const duration = note.getDuration();
      if (['8', '16', '32'].includes(duration.replace('r', ''))) {
        beamableNotes.push(note);
      } else if (beamableNotes.length >= 2) {
        try {
          const beam = new Beam(beamableNotes);
          beam.setContext(this.context).draw();
        } catch {
          // Beaming may fail for certain note combinations
        }
        beamableNotes.length = 0;
      } else {
        beamableNotes.length = 0;
      }
    }
    
    if (beamableNotes.length >= 2) {
      try {
        const beam = new Beam(beamableNotes);
        beam.setContext(this.context).draw();
      } catch {
        // Beaming may fail
      }
    }
  }
  
  getSVG(): string {
    const svg = this.container.querySelector('svg');
    if (svg) {
      return new XMLSerializer().serializeToString(svg);
    }
    return '';
  }
}

export function renderToCanvas(
  score: Score | SinistraScore,
  canvas: HTMLCanvasElement,
  options: Partial<RenderOptions> = {}
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  document.body.appendChild(tempContainer);
  
  const renderer = new SinistraRenderer(tempContainer, options);
  renderer.render(score);
  const svgString = renderer.getSVG();
  
  const img = new Image();
  img.onload = () => {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
  
  document.body.removeChild(tempContainer);
}
