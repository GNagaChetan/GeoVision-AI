import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showWordmark = true,
  theme = 'light',
  className = '',
}) => {
  const iconDimensions = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  }[size];

  const wordmarkSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      {/* Precision Geospatial Vector Mark */}
      <div className={`relative ${iconDimensions} flex-shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          <defs>
            {/* Earth Horizon Radial Gradient */}
            <linearGradient id="earthGrad" x1="6" y1="36" x2="42" y2="12" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#102A43" />
              <stop offset="50%" stopColor="#176B87" />
              <stop offset="100%" stopColor="#2E7D5B" />
            </linearGradient>

            {/* Satellite Orbital Glow */}
            <linearGradient id="orbitGrad" x1="4" y1="14" x2="44" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#176B87" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#2E7D5B" stopOpacity="0.1" />
            </linearGradient>

            {/* Atmosphere Horizon Arc */}
            <linearGradient id="atmoGrad" x1="12" y1="24" x2="36" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#DDF3FA" />
              <stop offset="100%" stopColor="#78A86B" />
            </linearGradient>
          </defs>

          {/* Planetary Earth Horizon Disk */}
          <circle cx="24" cy="25" r="16" fill="url(#earthGrad)" />

          {/* Topographic Contour Lines */}
          <path
            d="M 12 30 C 17 24, 25 32, 36 26"
            stroke="url(#atmoGrad)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray="0.5 0.5"
            opacity="0.85"
          />
          <path
            d="M 15 35 C 21 31, 28 36, 33 33"
            stroke="#D6BE8A"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity="0.7"
          />

          {/* Inclined Satellite Orbit Ring */}
          <ellipse
            cx="24"
            cy="24"
            rx="20"
            ry="9"
            transform="rotate(-28 24 24)"
            stroke="url(#orbitGrad)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Orbiting Satellite Node (North-East Apex) */}
          <circle cx="39" cy="16" r="3" fill="#38BDF8" />
          <circle cx="39" cy="16" r="5" stroke="#38BDF8" strokeWidth="1" opacity="0.5" />
          <line x1="39" y1="13" x2="39" y2="10" stroke="#38BDF8" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="42" y1="16" x2="45" y2="16" stroke="#38BDF8" strokeWidth="1.2" strokeLinecap="round" />

          {/* Central Ground Focus Beacon */}
          <circle cx="24" cy="24" r="2.2" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Clean Wordmark */}
      {showWordmark && (
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`${wordmarkSizes} tracking-tight font-extrabold ${
              theme === 'dark' ? 'text-white' : 'text-[#08162B]'
            }`}
          >
            GeoVision
          </span>
          <span className="bg-gradient-to-r from-[#176B87] to-[#2E7D5B] text-white text-[11px] font-bold px-1.5 py-0.5 rounded tracking-wider shadow-sm">
            AI
          </span>
        </div>
      )}
    </div>
  );
};
