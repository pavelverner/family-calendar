// Cartoon SVG avatars for family members

export function EliskaAvatar({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Large hair mass — clearly visible above and around face */}
      <ellipse cx="24" cy="17" rx="20" ry="19" fill="#F5C030" />
      {/* Long flowing side strands */}
      <rect x="3" y="24" width="11" height="22" rx="5.5" fill="#F5C030" />
      <rect x="34" y="24" width="11" height="22" rx="5.5" fill="#F5C030" />
      {/* Hair bottom fill */}
      <ellipse cx="24" cy="43" rx="14" ry="7" fill="#F5C030" />
      {/* Face — smaller and lower so hair clearly frames it */}
      <circle cx="24" cy="30" r="12" fill="#FFD5A8" />
      {/* Ears */}
      <ellipse cx="12" cy="30" rx="2.5" ry="3" fill="#FFD5A8" />
      <ellipse cx="36" cy="30" rx="2.5" ry="3" fill="#FFD5A8" />
      {/* Eyes */}
      <circle cx="20" cy="28" r="2.4" fill="#3A2A1A" />
      <circle cx="28" cy="28" r="2.4" fill="#3A2A1A" />
      <circle cx="20.8" cy="27.2" r="0.8" fill="white" />
      <circle cx="28.8" cy="27.2" r="0.8" fill="white" />
      {/* Smile */}
      <path d="M20 34 Q24 38.5 28 34" stroke="#C06050" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Blush */}
      <ellipse cx="16" cy="31" rx="3" ry="2" fill="#FFB0C8" opacity="0.55" />
      <ellipse cx="32" cy="31" rx="3" ry="2" fill="#FFB0C8" opacity="0.55" />
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
      {/* Ears */}
      <ellipse cx="10" cy="28" rx="2.5" ry="3" fill="#FFD5A8" />
      <ellipse cx="38" cy="28" rx="2.5" ry="3" fill="#FFD5A8" />
      {/* Eyes — bigger for child */}
      <circle cx="19.5" cy="26" r="3" fill="#3A2A1A" />
      <circle cx="28.5" cy="26" r="3" fill="#3A2A1A" />
      <circle cx="20.3" cy="25" r="1" fill="white" />
      <circle cx="29.3" cy="25" r="1" fill="white" />
      {/* Big smile */}
      <path d="M18 33 Q24 38.5 30 33" stroke="#C06050" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Rosy cheeks */}
      <ellipse cx="14" cy="30" rx="4" ry="2.5" fill="#FFB0C8" opacity="0.65" />
      <ellipse cx="34" cy="30" rx="4" ry="2.5" fill="#FFB0C8" opacity="0.65" />
    </svg>
  );
}

export function VsichniAvatar({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">

      {/* === ELIŠKA — left adult === */}
      {/* Long blonde hair behind face */}
      <ellipse cx="11" cy="21" rx="10" ry="15" fill="#F9D030" />
      <rect x="2"  y="16" width="6" height="20" rx="3" fill="#F9D030" />
      <rect x="14" y="16" width="6" height="20" rx="3" fill="#F9D030" />
      {/* Body */}
      <ellipse cx="11" cy="43" rx="8" ry="6" fill="#EA580C" />
      {/* Face */}
      <circle cx="11" cy="18" r="8" fill="#FFD5A8" />
      {/* Hair top over face */}
      <ellipse cx="11" cy="11" rx="8" ry="6" fill="#F9D030" />
      {/* Eyes */}
      <circle cx="8.5"  cy="17" r="1.5" fill="#3A2A1A" />
      <circle cx="13.5" cy="17" r="1.5" fill="#3A2A1A" />
      <circle cx="9"    cy="16.4" r="0.5" fill="white" />
      <circle cx="14"   cy="16.4" r="0.5" fill="white" />
      {/* Smile */}
      <path d="M8.5 21 Q11 24 13.5 21" stroke="#C06050" strokeWidth="1.2" strokeLinecap="round" fill="none" />

      {/* === PAVEL — right adult === */}
      {/* Hair */}
      <ellipse cx="37" cy="13" rx="9" ry="7" fill="#B07840" />
      {/* Body */}
      <ellipse cx="37" cy="43" rx="8" ry="6" fill="#16A34A" />
      {/* Face */}
      <circle cx="37" cy="18" r="8" fill="#FFD5A8" />
      {/* Hair top */}
      <path d="M29 17 Q29 9 37 9 Q45 9 45 17 Q43 11 37 11 Q31 11 29 17Z" fill="#B07840" />
      {/* Eyes */}
      <circle cx="34.5" cy="17" r="1.5" fill="#3A2A1A" />
      <circle cx="39.5" cy="17" r="1.5" fill="#3A2A1A" />
      <circle cx="35"   cy="16.4" r="0.5" fill="white" />
      <circle cx="40"   cy="16.4" r="0.5" fill="white" />
      {/* Smile */}
      <path d="M34.5 21 Q37 24 39.5 21" stroke="#C06050" strokeWidth="1.2" strokeLinecap="round" fill="none" />

      {/* === FILIP — small child, center front === */}
      {/* Hair */}
      <ellipse cx="24" cy="26" rx="8" ry="7" fill="#F0C430" />
      {/* Body */}
      <ellipse cx="24" cy="45" rx="7" ry="5" fill="#CA8A04" />
      {/* Face */}
      <circle cx="24" cy="31" r="7" fill="#FFD5A8" />
      {/* Hair top */}
      <path d="M17 30 Q17 23 24 23 Q31 23 31 30 Q29 25 24 25 Q19 25 17 30Z" fill="#F0C430" />
      {/* Eyes */}
      <circle cx="21.5" cy="30" r="1.6" fill="#3A2A1A" />
      <circle cx="26.5" cy="30" r="1.6" fill="#3A2A1A" />
      <circle cx="22"   cy="29.4" r="0.5" fill="white" />
      <circle cx="27"   cy="29.4" r="0.5" fill="white" />
      {/* Smile */}
      <path d="M21.5 34 Q24 37 26.5 34" stroke="#C06050" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      {/* Blush */}
      <ellipse cx="19.5" cy="32" rx="2.5" ry="1.5" fill="#FFB0C8" opacity="0.6" />
      <ellipse cx="28.5" cy="32" rx="2.5" ry="1.5" fill="#FFB0C8" opacity="0.6" />

    </svg>
  );
}
