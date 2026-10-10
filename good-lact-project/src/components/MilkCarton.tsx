import { useId } from 'react';

interface Props {
  /** Quota di latte rimasta: 1 = pieno, 0 = vuoto. */
  level: number;
  className?: string;
}

const BODY_TOP = 112;
const BODY_BOTTOM = 280;
const WAVE = 'M0 0 Q 25 -7 50 0 T 100 0 T 150 0 T 200 0 T 250 0 T 300 0 T 350 0 V 220 H 0 Z';

/** Cartone di latte che si svuota con onde animate. Puramente decorativo (aria-hidden). */
export function MilkCarton({ level, className }: Props) {
  const clipId = useId();
  const clamped = Math.min(1, Math.max(0, level));
  const surfaceY = BODY_BOTTOM - clamped * (BODY_BOTTOM - BODY_TOP - 8);
  const empty = clamped <= 0.001;

  return (
    <svg viewBox="24 30 152 260" className={className} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={clipId}>
          <path d="M44 112 H156 V268 Q156 280 144 280 H56 Q44 280 44 268 Z" />
        </clipPath>
        <linearGradient id={`${clipId}-milk`} x1="0" x2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f3f8fd" />
        </linearGradient>
      </defs>

      {/* tetto a falda e linguetta */}
      <path d="M44 112 L72 62 H128 L156 112 Z" fill="#dbeafe" stroke="#2c7bb6" strokeWidth="4" strokeLinejoin="round" />
      <path d="M72 62 L78 40 H122 L128 62 Z" fill="#bfdbfe" stroke="#2c7bb6" strokeWidth="4" strokeLinejoin="round" />

      {/* interno del cartone */}
      <path d="M44 112 H156 V268 Q156 280 144 280 H56 Q44 280 44 268 Z" fill="#bcd6ea" />

      {/* latte */}
      <g clipPath={`url(#${clipId})`}>
        <g style={{ transform: `translateY(${surfaceY}px)`, transition: 'transform 1s linear' }}>
          <g className="milk-wave-b" opacity="0.55" transform="translate(0 3)">
            <path d={WAVE} fill="#e8f1f9" />
          </g>
          <g className="milk-wave-a">
            <path d={WAVE} fill={`url(#${clipId}-milk)`} />
          </g>
        </g>
      </g>

      {/* tacche di livello */}
      {[0.25, 0.5, 0.75].map((t) => (
        <line
          key={t}
          x1="156"
          x2="146"
          y1={BODY_BOTTOM - t * (BODY_BOTTOM - BODY_TOP - 8)}
          y2={BODY_BOTTOM - t * (BODY_BOTTOM - BODY_TOP - 8)}
          stroke="#2c7bb6"
          strokeOpacity="0.35"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}

      {/* contorno e scritta */}
      <path d="M44 112 H156 V268 Q156 280 144 280 H56 Q44 280 44 268 Z" fill="none" stroke="#2c7bb6" strokeWidth="4" strokeLinejoin="round" />
      <text x="100" y="206" textAnchor="middle" fontSize="13" fontWeight="900" letterSpacing="1" fill="#2c7bb6" opacity={empty ? 0.65 : 0.9}>
        GOOD LACT
      </text>
    </svg>
  );
}
