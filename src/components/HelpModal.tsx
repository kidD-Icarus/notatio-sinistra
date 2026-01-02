// Notatio Sinistra - PDF Conversion Help Modal

import { useState } from 'react';
import './HelpModal.css';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<'pdf' | 'about'>('pdf');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-tabs">
          <button 
            className={activeTab === 'pdf' ? 'active' : ''}
            onClick={() => setActiveTab('pdf')}
          >
            Convert PDFs
          </button>
          <button 
            className={activeTab === 'about' ? 'active' : ''}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
        </div>

        {activeTab === 'pdf' && (
          <div className="modal-body">
            <h2>Have a PDF? Here's how to convert it.</h2>
            
            <p className="intro">
              Most sheet music exists as PDFs or scanned images. Notatio Sinistra works with 
              MusicXML and MIDI files. Use <strong>Audiveris</strong> (free, open-source) to 
              convert your PDFs first.
            </p>

            <div className="steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Download Audiveris</h3>
                  <p>Free, open-source music recognition software.</p>
                  <a 
                    href="https://github.com/Audiveris/audiveris/releases" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="download-link"
                  >
                    Download for Windows / Mac / Linux →
                  </a>
                  <p className="note">Requires Java 17+ (included in some installers)</p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Open your PDF in Audiveris</h3>
                  <p>File → Input → select your PDF or image file.</p>
                  <p>Audiveris will analyze the score automatically.</p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Review & correct (optional)</h3>
                  <p>Check the recognition results. Fix any errors Audiveris made.</p>
                  <p className="note">Clean, printed scores work best. Handwritten scores may need more corrections.</p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>Export as MusicXML</h3>
                  <p>Book → Export Book → choose MusicXML format.</p>
                  <p>You can also export as MIDI if preferred.</p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">5</div>
                <div className="step-content">
                  <h3>Upload to Notatio Sinistra</h3>
                  <p>Bring your MusicXML file here and transform it to RTL notation.</p>
                </div>
              </div>
            </div>

            <div className="alternatives">
              <h3>Alternative Tools</h3>
              <ul>
                <li><strong>PlayScore 2</strong> — Mobile app (iOS/Android), free tier available</li>
                <li><strong>ScanScore</strong> — Desktop app (~$50)</li>
                <li><strong>SmartScore</strong> — Desktop app (~$200, highest accuracy)</li>
                <li><strong>PhotoScore</strong> — Sibelius companion app</li>
              </ul>
            </div>

            <div className="tips">
              <h3>Tips for Best Results</h3>
              <ul>
                <li>Use high-resolution scans (300 DPI or higher)</li>
                <li>Ensure the page is straight, not skewed</li>
                <li>Clean, modern printed scores convert better than old/faded ones</li>
                <li>Single-staff melodies are easier than full orchestral scores</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="modal-body">
            <h2>About Notatio Sinistra</h2>
            
            <p className="intro">
              Right-to-left music notation for those who read naturally from right to left.
            </p>

            <div className="about-section">
              <h3>Why RTL Notation?</h3>
              <p>
                Some musicians process visual information more naturally from right to left. 
                Traditional Western music notation flows left-to-right, creating a cognitive 
                barrier for these readers. Notatio Sinistra removes that barrier.
              </p>
            </div>

            <div className="about-section">
              <h3>How It Works</h3>
              <p>
                Upload a MusicXML or MIDI file. Notatio Sinistra transforms the notation:
              </p>
              <ul>
                <li>Measures flow right-to-left (first measure on right)</li>
                <li>Notes within measures are mirrored</li>
                <li>Clefs, key signatures, time signatures move to the right edge</li>
                <li>Export as SVG, PNG, or PDF</li>
              </ul>
            </div>

            <div className="about-section">
              <h3>Credits</h3>
              <p>
                Created by <strong>kidDicarus Inc.</strong><br/>
                Built with VexFlow, React, and TypeScript.<br/>
                Part of the Notatio Sinistra system (v1.1).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
