import React from 'react';

/**
 * Custom Bespoke FormSaathi Brandmark (SVG)
 * An organic paper sheet integrated with voice wave and guidance node.
 */
export const FormSaathiLogo: React.FC<{ size?: number; className?: string }> = ({
  size = 28,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Organic base shape */}
      <rect
        x="2"
        y="2"
        width="32"
        height="32"
        rx="9"
        ry="5"
        className="fill-teal-brand"
      />
      {/* Subtle organic contour line */}
      <path
        d="M6 10C12 7 24 7 30 10"
        stroke="#496A60"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
      {/* Folded paper contour */}
      <path
        d="M10 13C10 11.8954 10.8954 11 12 11H21L26 16V24C26 25.1046 25.1046 26 24 26H12C10.8954 26 10 25.1046 10 24V13Z"
        fill="#F7F6F1"
      />
      {/* Corner fold */}
      <path
        d="M21 11V15C21 15.5523 21.4477 16 22 16H26L21 11Z"
        fill="#DCE8E2"
      />
      {/* Voice soundwave lines inside form */}
      <path
        d="M13 19C13 18.4477 13.4477 18 14 18C14.5523 18 15 18.4477 15 19V21C15 21.5523 14.5523 22 14 22C13.4477 22 13 21.5523 13 21V19Z"
        fill="#174B4F"
      />
      <path
        d="M16 16C16 15.4477 16.4477 15 17 15C17.5523 15 18 15.4477 18 16V23C18 23.5523 17.5523 24 17 24C16.4477 24 16 23.5523 16 23V16Z"
        fill="#174B4F"
      />
      <path
        d="M19 18C19 17.4477 19.4477 17 20 17C20.5523 17 21 17.4477 21 18V21C21 21.5523 20.5523 22 20 22C19.4477 22 19 21.5523 19 21V18Z"
        fill="#A96F2D"
      />
      <circle cx="23" cy="22.5" r="1.5" fill="#287A52" />
    </svg>
  );
};

/**
 * Bespoke Editorial Form Assistance Artwork
 * Represents form completion via guided voice and natural interaction.
 */
export const FormAssistIllustration: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <svg
      viewBox="0 0 220 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full max-w-[210px] mx-auto select-none ${className}`}
    >
      <defs>
        <linearGradient id="sageGlow" x1="0" y1="0" x2="220" y2="110" gradientUnits="userSpaceOnUse">
          <stop stopColor="#DCE8E2" stopOpacity="0.4" />
          <stop offset="1" stopColor="#496A60" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Layer 1: Background organic halo */}
      <path
        d="M18 50C18 26 50 12 90 12C145 12 195 24 204 55C212 85 160 102 110 102C55 102 18 80 18 50Z"
        fill="url(#sageGlow)"
      />

      {/* Layer 2: Abstract floating form card (editorial perspective) */}
      <rect
        x="42"
        y="22"
        width="132"
        height="72"
        rx="10"
        fill="#FFFFFF"
        stroke="#E3E5DD"
        strokeWidth="1.2"
        filter="drop-shadow(0px 3px 6px rgba(23, 75, 79, 0.08))"
      />

      {/* Header bar of form card */}
      <path
        d="M42 32C42 26.4772 46.4772 22 52 22H164C169.523 22 174 26.4772 174 32V35H42V32Z"
        fill="#DCE8E2"
        fillOpacity="0.5"
      />
      <circle cx="53" cy="28.5" r="2.5" fill="#174B4F" />
      <rect x="61" y="27" width="40" height="3" rx="1.5" fill="#496A60" fillOpacity="0.7" />

      {/* Form field lines */}
      <rect x="52" y="44" width="34" height="2.5" rx="1.2" fill="#263433" fillOpacity="0.4" />
      <rect
        x="52"
        y="50"
        width="112"
        height="12"
        rx="3.5"
        fill="#F7F6F1"
        stroke="#E3E5DD"
        strokeWidth="0.8"
      />
      {/* Filled text highlight */}
      <rect x="58" y="54.5" width="48" height="3" rx="1.5" fill="#174B4F" />
      <path d="M154 56L156.5 58.5L160.5 54.5" stroke="#287A52" strokeWidth="1.2" strokeLinecap="round" />

      {/* Voice soundwave ribbon interacting with the field */}
      <path
        d="M26 65C40 65 48 56 65 56C80 56 86 64 100 64C114 64 122 55 138 55C152 55 160 62 178 62C188 62 196 58 202 54"
        stroke="#174B4F"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M32 70C46 70 54 62 70 62C84 62 90 69 104 69C118 69 126 62 142 62C156 62 164 68 184 68"
        stroke="#A96F2D"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeDasharray="2 3"
      />

      {/* Subtle guidance node */}
      <circle cx="100" cy="64" r="3.5" fill="#FFFFFF" stroke="#174B4F" strokeWidth="1.5" />
      <circle cx="100" cy="64" r="1.5" fill="#A96F2D" />

      {/* Small floating status pill */}
      <g filter="drop-shadow(0px 2px 4px rgba(38, 52, 51, 0.08))">
        <rect x="122" y="74" width="62" height="18" rx="9" fill="#174B4F" />
        <circle cx="132" cy="83" r="2.5" fill="#DCE8E2" />
        <rect x="139" y="81.5" width="34" height="3" rx="1.5" fill="#FFFFFF" />
      </g>
    </svg>
  );
};

/**
 * Editorial Asymmetric Curved Hero Surface
 * Creates a sculptural boundary between the Deep Teal hero and Paper Ivory content.
 */
export const CurvedHeroBoundary: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-full overflow-hidden leading-none ${className}`}>
      <svg
        viewBox="0 0 400 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-8 block"
        preserveAspectRatio="none"
      >
        {/* Soft Sage underlay curve */}
        <path
          d="M0 0C60 18 160 32 260 22C330 15 375 26 400 34V36H0V0Z"
          fill="#DCE8E2"
          fillOpacity="0.5"
        />
        {/* Primary Teal asymmetric organic curve */}
        <path
          d="M0 0C70 20 180 34 290 18C340 11 380 18 400 24V0H0Z"
          className="fill-teal-brand"
        />
      </svg>
    </div>
  );
};

/**
 * Subtle Background Contour Lines
 * Adds quiet editorial depth to paper ivory background without clutter.
 */
export const ContourLines: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none opacity-[0.035] overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="contour-pattern"
            width="120"
            height="120"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 20C40 10 80 30 120 20M0 60C30 50 70 70 120 60M0 100C50 90 90 110 120 100"
              fill="none"
              stroke="#174B4F"
              strokeWidth="1.2"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#contour-pattern)" />
      </svg>
    </div>
  );
};
