import type { Confidence } from '../types';

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function pillsLabel(n: number): string {
  return n === 1 ? 'compressa' : 'compresse';
}

/** 0,5 -> "½", 1,5 -> "1½": più leggibile di 0.5 su schermo piccolo. */
export function formatPills(n: number): string {
  const whole = Math.floor(n);
  const half = n - whole >= 0.5;
  if (whole === 0) return half ? '½' : '0';
  return half ? `${whole}½` : `${whole}`;
}

export function formatGrams(g: number): string {
  if (g > 0 && g < 0.1) return '<0,1';
  return g.toFixed(1).replace('.', ',');
}


const CONFIDENCE_HINTS: Record<Confidence, string> = {
  high: 'Gli ingredienti principali sono certi.',
  medium: 'Una parte del lattosio dipende da ingredienti probabili.',
  low: 'Molto dipende da ingredienti incerti: ti proponiamo la dose prudente.',
};

export function confidenceHint(confidence: Confidence): string {
  return CONFIDENCE_HINTS[confidence];
}
