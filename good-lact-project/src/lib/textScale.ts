export type TextScale = 'normal' | 'large' | 'xlarge';

/** Dimensione base del testo (px): tutta l'interfaccia usa rem, quindi segue questa. */
export const TEXT_SCALE_PX: Record<TextScale, number> = { normal: 16, large: 18, xlarge: 20 };

export const TEXT_SCALE_LABEL: Record<TextScale, string> = { normal: 'Normale', large: 'Grande', xlarge: 'Molto grande' };

export const isTextScale = (v: unknown): v is TextScale => v === 'normal' || v === 'large' || v === 'xlarge';

export function applyTextScale(scale: TextScale, root: HTMLElement = document.documentElement): void {
  root.style.fontSize = `${TEXT_SCALE_PX[scale]}px`;
}
