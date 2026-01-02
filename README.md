# Notatio Sinistra v1.0

**Right-to-Left Music Notation System**

Converts standard sheet music (LTR) to Sinistra format (RTL) for musicians who read right-to-left.

## Features

- **Import**: MusicXML (.xml, .musicxml) and MIDI (.mid, .midi)
- **Manual Entry**: Note-by-note input with clef, key, and time signature selection
- **Transform**: Automatic LTR → RTL conversion
- **Export**: SVG, PNG, PDF
- **Toggle View**: Switch between Sinistra (RTL) and Original (LTR)

## Quick Start

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run build
```

Deploy the `dist` folder to Netlify, Vercel, or any static host.

## Tech Stack

- React + TypeScript
- Vite
- VexFlow (music notation rendering)
- @tonejs/midi (MIDI parsing)
- jsPDF (PDF export)

## Transform Rules

1. Measures flow right-to-left (first measure on right)
2. Notes within measures flip position (first beat on right)
3. Clef, key sig, time sig move to right edge of system
4. Stems, flags, beams mirror appropriately

## Roadmap

- [ ] PDF/Image OCR import (Audiveris integration)
- [ ] RJJSJJJS color coding (Root=red, Jumps=blue, Steps=green)
- [ ] VST plugin version
- [ ] MuseScore plugin

---

**kidDicarus Inc.**

*They tried to silence the waves. But we are the tide.*