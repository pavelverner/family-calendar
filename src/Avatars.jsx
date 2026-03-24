// Cartoon SVG avatars for Pavel and Eliška

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
      {/* Eye shine */}
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
      {/* Eye shine */}
      <circle cx="20.3" cy="24.2" r="0.8" fill="white" />
      <circle cx="29.3" cy="24.2" r="0.8" fill="white" />
      {/* Smile */}
      <path d="M19 32 Q24 36.5 29 32" stroke="#C06050" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Subtle brow strokes */}
      <path d="M17.5 20.5 Q19.5 19.5 21.5 20.5" stroke="#8B6035" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M26.5 20.5 Q28.5 19.5 30.5 20.5" stroke="#8B6035" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
