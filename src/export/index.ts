// Notatio Sinistra v1 - Export Utilities

import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import type { Score, SinistraScore } from '../types/notation';
import { SinistraRenderer } from '../renderer/vexflow';

export interface ExportOptions {
  filename: string;
  width: number;
  height: number;
  measuresPerLine: number;
  isSinistra: boolean;
}

const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  filename: 'sinistra-score',
  width: 1200,
  height: 800,
  measuresPerLine: 4,
  isSinistra: true,
};

export function exportSVG(
  score: Score | SinistraScore,
  options: Partial<ExportOptions> = {}
): void {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);
  
  try {
    const renderer = new SinistraRenderer(container, {
      width: opts.width,
      height: opts.height,
      measuresPerLine: opts.measuresPerLine,
      isSinistra: opts.isSinistra,
    });
    
    renderer.render(score);
    const svgString = renderer.getSVG();
    
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    saveAs(blob, `${opts.filename}.svg`);
  } finally {
    document.body.removeChild(container);
  }
}

export async function exportPNG(
  score: Score | SinistraScore,
  options: Partial<ExportOptions> = {}
): Promise<void> {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);
  
  try {
    const renderer = new SinistraRenderer(container, {
      width: opts.width,
      height: opts.height,
      measuresPerLine: opts.measuresPerLine,
      isSinistra: opts.isSinistra,
    });
    
    renderer.render(score);
    const svgString = renderer.getSVG();
    
    const canvas = document.createElement('canvas');
    canvas.width = opts.width;
    canvas.height = opts.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG'));
      };
      img.src = url;
    });
    
    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `${opts.filename}.png`);
      }
    }, 'image/png');
    
  } finally {
    document.body.removeChild(container);
  }
}

export async function exportPDF(
  score: Score | SinistraScore,
  options: Partial<ExportOptions> = {}
): Promise<void> {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);
  
  try {
    const renderer = new SinistraRenderer(container, {
      width: opts.width,
      height: opts.height,
      measuresPerLine: opts.measuresPerLine,
      isSinistra: opts.isSinistra,
    });
    
    renderer.render(score);
    const svgString = renderer.getSVG();
    
    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = opts.width * scale;
    canvas.height = opts.height * scale;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    ctx.scale(scale, scale);
    
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, opts.width, opts.height);
        ctx.drawImage(img, 0, 0, opts.width, opts.height);
        URL.revokeObjectURL(url);
        resolve();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG'));
      };
      img.src = url;
    });
    
    const pdf = new jsPDF({
      orientation: opts.width > opts.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [opts.width, opts.height],
    });
    
    if (score.title) {
      pdf.setFontSize(16);
      pdf.text(score.title, opts.width / 2, 30, { align: 'center' });
    }
    
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, score.title ? 40 : 0, opts.width, opts.height);
    
    pdf.save(`${opts.filename}.pdf`);
    
  } finally {
    document.body.removeChild(container);
  }
}

export function getSVGString(
  score: Score | SinistraScore,
  options: Partial<ExportOptions> = {}
): string {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);
  
  try {
    const renderer = new SinistraRenderer(container, {
      width: opts.width,
      height: opts.height,
      measuresPerLine: opts.measuresPerLine,
      isSinistra: opts.isSinistra,
    });
    
    renderer.render(score);
    return renderer.getSVG();
  } finally {
    document.body.removeChild(container);
  }
}
