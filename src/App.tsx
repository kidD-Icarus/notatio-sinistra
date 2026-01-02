// Notatio Sinistra v1.1 - Main Application

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Score, SinistraScore, NoteDuration, Pitch, Clef } from './types/notation';
import { parseMusicXML } from './parsers/musicxml';
import { parseMIDI } from './parsers/midi';
import { transformToSinistra } from './transform/sinistra';
import { SinistraRenderer } from './renderer/vexflow';
import { exportSVG, exportPNG, exportPDF } from './export';
import { 
  createEmptyState, 
  addNote, 
  addRest, 
  nextMeasure, 
  setClef, 
  setTimeSignature,
  setKeySignature,
  stateToScore,
  removeLastNote,
  clearState,
  type ManualEntryState 
} from './input/manual';
import { HelpModal } from './components/HelpModal';
import './App.css';

type InputMode = 'file' | 'manual';

const DURATION_LABELS: Record<NoteDuration, string> = {
  'whole': '𝅝',
  'half': '𝅗𝅥',
  'quarter': '♩',
  'eighth': '♪',
  '16th': '𝅘𝅥𝅯',
  '32nd': '𝅘𝅥𝅰',
};

const KEY_SIGNATURES = [
  { fifths: -7, label: 'C♭ Major / A♭ minor' },
  { fifths: -6, label: 'G♭ Major / E♭ minor' },
  { fifths: -5, label: 'D♭ Major / B♭ minor' },
  { fifths: -4, label: 'A♭ Major / F minor' },
  { fifths: -3, label: 'E♭ Major / C minor' },
  { fifths: -2, label: 'B♭ Major / G minor' },
  { fifths: -1, label: 'F Major / D minor' },
  { fifths: 0, label: 'C Major / A minor' },
  { fifths: 1, label: 'G Major / E minor' },
  { fifths: 2, label: 'D Major / B minor' },
  { fifths: 3, label: 'A Major / F♯ minor' },
  { fifths: 4, label: 'E Major / C♯ minor' },
  { fifths: 5, label: 'B Major / G♯ minor' },
  { fifths: 6, label: 'F♯ Major / D♯ minor' },
  { fifths: 7, label: 'C♯ Major / A♯ minor' },
];

function App() {
  const [inputMode, setInputMode] = useState<InputMode>('file');
  const [score, setScore] = useState<Score | null>(null);
  const [sinistraScore, setSinistraScore] = useState<SinistraScore | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [manualState, setManualState] = useState<ManualEntryState>(createEmptyState());
  const [selectedDuration, setSelectedDuration] = useState<NoteDuration>('quarter');
  const [selectedOctave, setSelectedOctave] = useState(4);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  const renderContainerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<SinistraRenderer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (renderContainerRef.current && !rendererRef.current) {
      rendererRef.current = new SinistraRenderer(renderContainerRef.current, {
        width: 1100,
        height: 600,
        measuresPerLine: 4,
        isSinistra: true,
      });
    }
  }, []);
  
  useEffect(() => {
    if (rendererRef.current) {
      const scoreToRender = showOriginal ? score : sinistraScore;
      if (scoreToRender) {
        rendererRef.current.render(scoreToRender);
      } else {
        rendererRef.current.clear();
      }
    }
  }, [score, sinistraScore, showOriginal]);
  
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setError(null);
    setIsLoading(true);
    
    try {
      let parsedScore: Score;
      
      if (file.name.endsWith('.xml') || file.name.endsWith('.musicxml') || file.name.endsWith('.mxl')) {
        const text = await file.text();
        parsedScore = parseMusicXML(text);
      } else if (file.name.endsWith('.mid') || file.name.endsWith('.midi')) {
        const buffer = await file.arrayBuffer();
        parsedScore = await parseMIDI(buffer);
      } else {
        throw new Error('Unsupported file type. Please use MusicXML (.xml, .musicxml) or MIDI (.mid, .midi)');
      }
      
      setScore(parsedScore);
      setSinistraScore(transformToSinistra(parsedScore));
      setTitle(parsedScore.title || file.name.replace(/\.[^/.]+$/, ''));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setScore(null);
      setSinistraScore(null);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleAddNote = useCallback((step: Pitch['step'], accidental: Pitch['accidental'] = null) => {
    setManualState(prev => {
      const newState = addNote(prev, step, selectedOctave, selectedDuration, accidental);
      const newScore = stateToScore(newState, title || 'Untitled');
      setScore(newScore);
      setSinistraScore(transformToSinistra(newScore));
      return newState;
    });
  }, [selectedOctave, selectedDuration, title]);
  
  const handleAddRest = useCallback(() => {
    setManualState(prev => {
      const newState = addRest(prev, selectedDuration);
      const newScore = stateToScore(newState, title || 'Untitled');
      setScore(newScore);
      setSinistraScore(transformToSinistra(newScore));
      return newState;
    });
  }, [selectedDuration, title]);
  
  const handleNextMeasure = useCallback(() => {
    setManualState(prev => {
      const newState = nextMeasure(prev);
      const newScore = stateToScore(newState, title || 'Untitled');
      setScore(newScore);
      setSinistraScore(transformToSinistra(newScore));
      return newState;
    });
  }, [title]);
  
  const handleUndo = useCallback(() => {
    setManualState(prev => {
      const newState = removeLastNote(prev);
      const newScore = stateToScore(newState, title || 'Untitled');
      setScore(newScore);
      setSinistraScore(transformToSinistra(newScore));
      return newState;
    });
  }, [title]);
  
  const handleClear = useCallback(() => {
    setManualState(clearState());
    setScore(null);
    setSinistraScore(null);
  }, []);
  
  const handleClefChange = useCallback((clef: Clef) => {
    setManualState(prev => {
      const newState = setClef(prev, clef);
      if (prev.measures[0]?.elements.length > 0) {
        const newScore = stateToScore(newState, title || 'Untitled');
        setScore(newScore);
        setSinistraScore(transformToSinistra(newScore));
      }
      return newState;
    });
  }, [title]);
  
  const handleTimeSignatureChange = useCallback((beats: number, beatType: number) => {
    setManualState(prev => {
      const newState = setTimeSignature(prev, beats, beatType);
      if (prev.measures[0]?.elements.length > 0) {
        const newScore = stateToScore(newState, title || 'Untitled');
        setScore(newScore);
        setSinistraScore(transformToSinistra(newScore));
      }
      return newState;
    });
  }, [title]);
  
  const handleKeySignatureChange = useCallback((fifths: number) => {
    setManualState(prev => {
      const newState = setKeySignature(prev, fifths);
      if (prev.measures[0]?.elements.length > 0) {
        const newScore = stateToScore(newState, title || 'Untitled');
        setScore(newScore);
        setSinistraScore(transformToSinistra(newScore));
      }
      return newState;
    });
  }, [title]);
  
  const handleExportSVG = useCallback(() => {
    const scoreToExport = showOriginal ? score : sinistraScore;
    if (scoreToExport) {
      exportSVG(scoreToExport, { 
        filename: `${title || 'sinistra-score'}${showOriginal ? '-original' : '-sinistra'}`,
        isSinistra: !showOriginal,
      });
    }
  }, [score, sinistraScore, showOriginal, title]);
  
  const handleExportPNG = useCallback(async () => {
    const scoreToExport = showOriginal ? score : sinistraScore;
    if (scoreToExport) {
      await exportPNG(scoreToExport, { 
        filename: `${title || 'sinistra-score'}${showOriginal ? '-original' : '-sinistra'}`,
        isSinistra: !showOriginal,
      });
    }
  }, [score, sinistraScore, showOriginal, title]);
  
  const handleExportPDF = useCallback(async () => {
    const scoreToExport = showOriginal ? score : sinistraScore;
    if (scoreToExport) {
      await exportPDF(scoreToExport, { 
        filename: `${title || 'sinistra-score'}${showOriginal ? '-original' : '-sinistra'}`,
        isSinistra: !showOriginal,
      });
    }
  }, [score, sinistraScore, showOriginal, title]);
  
  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo">
              <span className="logo-text">NOTATIO</span>
              <span className="logo-sinistra">SINISTRA</span>
            </div>
            <div className="tagline">Right-to-Left Music Notation</div>
          </div>
          <button className="help-btn" onClick={() => setShowHelp(true)}>
            Have a PDF?
          </button>
        </div>
      </header>
      
      <main className="main">
        <div className="mode-selector">
          <button 
            className={`mode-btn ${inputMode === 'file' ? 'active' : ''}`}
            onClick={() => setInputMode('file')}
          >
            Import File
          </button>
          <button 
            className={`mode-btn ${inputMode === 'manual' ? 'active' : ''}`}
            onClick={() => setInputMode('manual')}
          >
            Manual Entry
          </button>
        </div>
        
        {inputMode === 'file' && (
          <div className="input-section file-input">
            <div className="file-drop-zone" onClick={() => fileInputRef.current?.click()}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xml,.musicxml,.mxl,.mid,.midi"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <div className="drop-icon">📄</div>
              <div className="drop-text">
                Drop a file here or click to browse
              </div>
              <div className="drop-formats">
                MusicXML (.xml, .musicxml) • MIDI (.mid, .midi)
              </div>
              <button 
                className="pdf-help-link"
                onClick={(e) => { e.stopPropagation(); setShowHelp(true); }}
              >
                Have a PDF? Learn how to convert it →
              </button>
            </div>
          </div>
        )}
        
        {inputMode === 'manual' && (
          <div className="input-section manual-input">
            <div className="manual-controls">
              <div className="control-group">
                <label>Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Score title"
                />
              </div>
              
              <div className="control-group">
                <label>Clef</label>
                <div className="button-group">
                  {(['treble', 'bass', 'alto'] as Clef[]).map(clef => (
                    <button
                      key={clef}
                      className={manualState.clef === clef ? 'active' : ''}
                      onClick={() => handleClefChange(clef)}
                    >
                      {clef === 'treble' ? '𝄞' : clef === 'bass' ? '𝄢' : '𝄡'}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="control-group">
                <label>Time</label>
                <div className="button-group">
                  {[[4,4], [3,4], [2,4], [6,8]].map(([beats, type]) => (
                    <button
                      key={`${beats}/${type}`}
                      className={manualState.timeSignature.beats === beats && 
                                manualState.timeSignature.beatType === type ? 'active' : ''}
                      onClick={() => handleTimeSignatureChange(beats, type)}
                    >
                      {beats}/{type}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="control-group">
                <label>Key</label>
                <select 
                  value={manualState.keySignature.fifths}
                  onChange={(e) => handleKeySignatureChange(parseInt(e.target.value, 10))}
                >
                  {KEY_SIGNATURES.map(({ fifths, label }) => (
                    <option key={fifths} value={fifths}>{label}</option>
                  ))}
                </select>
              </div>
              
              <div className="control-group">
                <label>Duration</label>
                <div className="button-group duration-group">
                  {(Object.keys(DURATION_LABELS) as NoteDuration[]).map(dur => (
                    <button
                      key={dur}
                      className={selectedDuration === dur ? 'active' : ''}
                      onClick={() => setSelectedDuration(dur)}
                      title={dur}
                    >
                      {DURATION_LABELS[dur]}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="control-group">
                <label>Octave</label>
                <div className="button-group">
                  {[2, 3, 4, 5, 6].map(oct => (
                    <button
                      key={oct}
                      className={selectedOctave === oct ? 'active' : ''}
                      onClick={() => setSelectedOctave(oct)}
                    >
                      {oct}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="control-group note-input">
                <label>Notes</label>
                <div className="note-buttons">
                  {(['C', 'D', 'E', 'F', 'G', 'A', 'B'] as Pitch['step'][]).map(note => (
                    <div key={note} className="note-button-group">
                      <button 
                        className="note-btn flat"
                        onClick={() => handleAddNote(note, 'flat')}
                      >
                        ♭
                      </button>
                      <button 
                        className="note-btn natural"
                        onClick={() => handleAddNote(note)}
                      >
                        {note}
                      </button>
                      <button 
                        className="note-btn sharp"
                        onClick={() => handleAddNote(note, 'sharp')}
                      >
                        ♯
                      </button>
                    </div>
                  ))}
                  <button className="note-btn rest" onClick={handleAddRest}>
                    𝄽
                  </button>
                </div>
              </div>
              
              <div className="control-group actions">
                <button onClick={handleNextMeasure}>Next Measure →</button>
                <button onClick={handleUndo}>Undo</button>
                <button onClick={handleClear} className="danger">Clear All</button>
              </div>
              
              <div className="state-info">
                Measure {manualState.currentMeasure} • {manualState.measures[manualState.currentMeasure - 1]?.elements.length || 0} notes
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {isLoading && (
          <div className="loading">
            Processing...
          </div>
        )}
        
        <div className="render-section">
          <div className="render-header">
            <h2>{title || 'Score Preview'}</h2>
            <div className="view-toggle">
              <button
                className={!showOriginal ? 'active' : ''}
                onClick={() => setShowOriginal(false)}
              >
                ← Sinistra (RTL)
              </button>
              <button
                className={showOriginal ? 'active' : ''}
                onClick={() => setShowOriginal(true)}
              >
                Original (LTR) →
              </button>
            </div>
          </div>
          
          <div 
            ref={renderContainerRef} 
            className={`render-container ${showOriginal ? 'ltr' : 'rtl'}`}
          />
          
          {(score || sinistraScore) && (
            <div className="export-section">
              <button onClick={handleExportSVG}>Export SVG</button>
              <button onClick={handleExportPNG}>Export PNG</button>
              <button onClick={handleExportPDF}>Export PDF</button>
            </div>
          )}
        </div>
      </main>
      
      <footer className="footer">
        <div className="footer-brand">
          <span className="ki-logo">k.I.</span>
          <span>kidDicarus Inc.</span>
        </div>
        <div className="footer-text">
          Notatio Sinistra v1.1
        </div>
      </footer>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}

export default App;
