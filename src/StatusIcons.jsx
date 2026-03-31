// Custom SVG status icons for Boleslav and AFI (both with Škoda winged-arrow badge)

function SkodaBadge({ cx, cy, r = 5 }) {
  // Simplified Škoda winged arrow inside a green circle
  const ax = cx - r * 0.45; // arrow start X
  const bx = cx + r * 0.55; // arrowhead tip X
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#16A34A" />
      {/* Arrow shaft */}
      <line x1={ax} y1={cy} x2={bx} y2={cy} stroke="white" strokeWidth={r * 0.28} strokeLinecap="round" />
      {/* Arrowhead */}
      <polyline
        points={`${bx - r * 0.35},${cy - r * 0.35} ${bx},${cy} ${bx - r * 0.35},${cy + r * 0.35}`}
        stroke="white" strokeWidth={r * 0.28} fill="none"
        strokeLinejoin="round" strokeLinecap="round"
      />
      {/* Upper wing */}
      <path d={`M${ax + r * 0.25},${cy} C${ax + r * 0.1},${cy - r * 0.5} ${ax - r * 0.15},${cy - r * 0.7} ${ax - r * 0.4},${cy - r}`}
        stroke="white" strokeWidth={r * 0.22} fill="none" strokeLinecap="round" />
      {/* Lower wing */}
      <path d={`M${ax + r * 0.25},${cy} C${ax + r * 0.1},${cy + r * 0.5} ${ax - r * 0.15},${cy + r * 0.7} ${ax - r * 0.4},${cy + r}`}
        stroke="white" strokeWidth={r * 0.22} fill="none" strokeLinecap="round" />
    </g>
  );
}

export function BoleslaveIcon({ size = 24 }) {
  return (
    <svg viewBox="0 0 28 28" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      {/* Factory body */}
      <rect x="2" y="13" width="22" height="13" rx="1" fill="#64748B" />
      {/* Sawtooth roof */}
      <polygon points="2,13 5,8 8,13 11,8 14,13 17,8 20,13 24,13 24,14 2,14" fill="#475569" />
      {/* Chimneys */}
      <rect x="3" y="4"  width="3.5" height="9" rx="1" fill="#475569" />
      <rect x="9" y="6"  width="3"   height="7" rx="1" fill="#475569" />
      {/* Windows */}
      <rect x="4"  y="16" width="4" height="5" rx="0.5" fill="#7DD3FC" />
      <rect x="11" y="16" width="4" height="5" rx="0.5" fill="#7DD3FC" />
      {/* Škoda badge top-right */}
      <SkodaBadge cx={22} cy={6} r={5.5} />
    </svg>
  );
}

export function AfiIcon({ size = 24 }) {
  return (
    <svg viewBox="0 0 28 28" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      {/* Main tall tower */}
      <rect x="9"  y="2"  width="11" height="26" rx="1" fill="#475569" />
      {/* Window rows on tower */}
      {[4, 7, 10, 13, 16, 19, 22].map(y => (
        <g key={y}>
          <rect x="11"   y={y} width="2.5" height="2" rx="0.3" fill="#7DD3FC" />
          <rect x="14.5" y={y} width="2.5" height="2" rx="0.3" fill="#7DD3FC" />
        </g>
      ))}
      {/* Side wing */}
      <rect x="2" y="10" width="8" height="18" rx="1" fill="#64748B" />
      {[12, 16, 20, 24].map(y => (
        <rect key={y} x="4" y={y} width="4" height="2.5" rx="0.3" fill="#7DD3FC" />
      ))}
      {/* Škoda badge top-right */}
      <SkodaBadge cx={23} cy={5} r={5} />
    </svg>
  );
}

// Map for easy lookup by iconKey from STATUSES
export const STATUS_ICON_COMPONENTS = {
  boleslav: BoleslaveIcon,
  afi: AfiIcon,
};
