// Cartoon SVG avatars for family members

export function EliskaAvatar({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Long blonde hair — back */}
      <ellipse cx="24" cy="35" rx="17" ry="14" fill="#F9D030" />
      {/* Left long hair strand */}
      <rect x="5" y="17" width="8" height="26" rx="4" fill="#F9D030" />
      {/* Right long hair strand */}
      <rect x="35" y="17" width="8" height="26" rx="4" fill="#F9D030" />
      {/* Face */}
      <circle cx="24" cy="25" r="14" fill="#FFD5A8" />
      {/* Hair top */}
      <path d="M10 22 Q10 9 24 9 Q38 9 38 22 Q34 13 24 13 Q14 13 10 22Z" fill="#F9D030" />
      {/* Left ear */}
      <ellipse cx="10" cy="25" rx="2.5" ry="3" fill="#FFD5A8" />
      {/* Right ear */}
      <ellipse cx="38" cy="25" rx="2.5" ry="3" fill="#FFD5A8" />
      {/* Eyes */}
      <circle cx="19.5" cy="23" r="2.4" fill="#3A2A1A" />
      <circle cx="28.5" cy="23" r="2.4" fill="#3A2A1A" />
      <circle cx="20.3" cy="22.2" r="0.8" fill="white" />
      <circle cx="29.3" cy="22.2" r="0.8" fill="white" />
      {/* Smile */}
      <path d="M19 30 Q24 34.5 29 30" stroke="#C06050" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Blush */}
      <ellipse cx="15" cy="27" rx="3.5" ry="2" fill="#FFB0C8" opacity="0.55" />
      <ellipse cx="33" cy="27" rx="3.5" ry="2" fill="#FFB0C8" opacity="0.55" />
    </svg>
  );
}

export function PavelAvatar({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Hair base */}
      <ellipse cx="24" cy="17" rx="15" ry="11" fill="#B07840" />
      {/* Face */}
      <circle cx="24" cy="27" r="14" fill="#FFD5A8" />
      {/* Hair top over face edge */}
      <path d="M9 23 Q9 10 24 10 Q39 10 39 23 Q36 15 24 14 Q12 15 9 23Z" fill="#B07840" />
      {/* Left ear */}
      <ellipse cx="10" cy="27" rx="2.5" ry="3" fill="#FFD5A8" />
      {/* Right ear */}
      <ellipse cx="38" cy="27" rx="2.5" ry="3" fill="#FFD5A8" />
      {/* Eyes */}
      <circle cx="19.5" cy="25" r="2.4" fill="#3A2A1A" />
      <circle cx="28.5" cy="25" r="2.4" fill="#3A2A1A" />
      <circle cx="20.3" cy="24.2" r="0.8" fill="white" />
      <circle cx="29.3" cy="24.2" r="0.8" fill="white" />
      {/* Smile */}
      <path d="M19 32 Q24 36.5 29 32" stroke="#C06050" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Brows */}
      <path d="M17.5 20.5 Q19.5 19.5 21.5 20.5" stroke="#8B6035" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M26.5 20.5 Q28.5 19.5 30.5 20.5" stroke="#8B6035" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function FilipAvatar({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Short fluffy blonde hair */}
      <ellipse cx="24" cy="19" rx="15" ry="12" fill="#F0C430" />
      {/* Face — bigger head ratio for child */}
      <circle cx="24" cy="28" r="14" fill="#FFD5A8" />
      {/* Hair top */}
      <path d="M10 25 Q10 12 24 12 Q38 12 38 25 Q35 16 24 16 Q13 16 10 25Z" fill="#F0C430" />
      {/* Fluffy hair tufts */}
      <ellipse cx="14" cy="16" rx="5" ry="4" fill="#F0C430" />
      <ellipse cx="34" cy="16" rx="5" ry="4" fill="#F0C430" />
      <ellipse cx="24" cy="12" rx="6" ry="4" fill="#F0C430" />
      {/* Left ear */}
      <ellipse cx="10" cy="28" rx="2.5" ry="3" fill="#FFD5A8" />
      {/* Right ear */}
      <ellipse cx="38" cy="28" rx="2.5" ry="3" fill="#FFD5A8" />
      {/* Eyes — bigger for child */}
      <circle cx="19.5" cy="26" r="3" fill="#3A2A1A" />
      <circle cx="28.5" cy="26" r="3" fill="#3A2A1A" />
      <circle cx="20.3" cy="25" r="1" fill="white" />
      <circle cx="29.3" cy="25" r="1" fill="white" />
      {/* Big smile */}
      <path d="M18 33 Q24 38.5 30 33" stroke="#C06050" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Rosy cheeks — prominent for child */}
      <ellipse cx="14" cy="30" rx="4" ry="2.5" fill="#FFB0C8" opacity="0.65" />
      <ellipse cx="34" cy="30" rx="4" ry="2.5" fill="#FFB0C8" opacity="0.65" />
    </svg>
  );
}

export function VsichniAvatar({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* === Eliška — left adult === */}
      {/* long hair back */}
      <ellipse cx="11" cy="26" rx="9" ry="11" fill="#F9D030" />
      <rect x="3" y="16" width="5" height="18" rx="2.5" fill="#F9D030" />
      <rect x="14" y="16" width="5" height="18" rx="2.5" fill="#F9D030" />
      {/* body */}
      <ellipse cx="11" cy="42" rx="8" ry="6" fill="#EA580C" />
      {/* face */}
      <circle cx="11" cy="17" r="8" fill="#FFD5A8" />
      {/* hair top */}
      <path d="M4 16 Q4 8 11 8 Q18 8 18 16 Q16 10 11 10 Q6 10 4 16Z" fill="#F9D030" />

      {/* === Pavel — right adult === */}
      {/* hair */}
      <ellipse cx="37" cy="13" rx="9" ry="7" fill="#B07840" />
      {/* body */}
      <ellipse cx="37" cy="42" rx="8" ry="6" fill="#16A34A" />
      {/* face */}
      <circle cx="37" cy="17" r="8" fill="#FFD5A8" />
      {/* hair top */}
      <path d="M29 16 Q29 8 37 8 Q45 8 45 16 Q43 10 37 10 Q31 10 29 16Z" fill="#B07840" />

      {/* === Filip — small child, center front === */}
      {/* hair */}
      <ellipse cx="24" cy="28" rx="8" ry="6" fill="#F0C430" />
      {/* body */}
      <ellipse cx="24" cy="45" rx="7" ry="5" fill="#CA8A04" />
      {/* face */}
      <circle cx="24" cy="31" r="7" fill="#FFD5A8" />
      {/* hair top */}
      <path d="M17 30 Q17 23 24 23 Q31 23 31 30 Q29 25 24 25 Q19 25 17 30Z" fill="#F0C430" />
      {/* eyes */}
      <circle cx="21.5" cy="30" r="1.8" fill="#3A2A1A" />
      <circle cx="26.5" cy="30" r="1.8" fill="#3A2A1A" />
      {/* smile */}
      <path d="M21 35 Q24 38 27 35" stroke="#C06050" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}
