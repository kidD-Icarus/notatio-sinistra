# Notatio Sinistra v1.1

**Right-to-Left Music Notation System**

Converts standard sheet music (LTR) to Sinistra format (RTL) for musicians who read right-to-left.

## Features

- **Import**: MusicXML (.xml, .musicxml) and MIDI (.mid, .midi)
- **Manual Entry**: Note-by-note input with clef, key, and time signature selection
- **Transform**: Automatic LTR → RTL conversion
- **Export**: SVG, PNG, PDF
- **Toggle View**: Switch between Sinistra (RTL) and Original (LTR)
- **PDF Guide**: Built-in help for converting PDFs via Audiveris

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

## Converting PDFs

Most sheet music exists as PDFs. Use **Audiveris** (free, open-source) to convert:

1. Download [Audiveris](https://github.com/Audiveris/audiveris/releases)
2. Open your PDF in Audiveris
3. Let it process → export as MusicXML
4. Upload MusicXML to Notatio Sinistra
5. Transform to RTL

### Alternative Tools
- **PlayScore 2** — Mobile app (iOS/Android), free tier
- **ScanScore** — Desktop (~$50)
- **SmartScore** — Desktop (~$200, highest accuracy)

### Tips for Best Results
- Use high-resolution scans (300 DPI+)
- Keep pages straight, not skewed
- Clean printed scores convert better than old/faded ones

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

- [x] PDF conversion guide (Audiveris workflow)
- [ ] RJJSJJJS color coding (Root=red, Jumps=blue, Steps=green)
- [ ] VST plugin version
- [ ] MuseScore plugin
- [ ] Direct Audiveris integration (server-side)

---

**kidDicarus Inc.**

*They tried to silence the waves. But we are the tide.*
