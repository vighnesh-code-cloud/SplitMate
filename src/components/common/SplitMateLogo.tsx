import React from 'react';

interface SplitMateLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const SplitMateLogo: React.FC<SplitMateLogoProps> = ({
  size = 'md',
  showWordmark = true,
  showTagline = false,
  className = '',
  onClick,
}) => {
  const iconDimensions = {
    sm: 24,
    md: 32,
    lg: 42,
    xl: 60,
  }[size];

  const textSize = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }[size];

  const taglineSize = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-sm',
  }[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${
        onClick ? 'cursor-pointer group' : ''
      } ${className}`}
    >
      {/* Precision Geometric Logo Mark: Interlocking geometric friendship forms with hairline split */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          width={iconDimensions}
          height={iconDimensions}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 group-hover:scale-105"
        >
          {/* Subtle Outer Frame in Charcoal */}
          <rect
            x="2"
            y="2"
            width="44"
            height="44"
            rx="12"
            fill="#14171C"
            stroke="#2B2F36"
            strokeWidth="1.5"
          />

          {/* Upper interlocking node (Member 1 - Matte Silver/Off-White forming upper curve of S) */}
          <path
            d="M14 19C14 14.5817 17.5817 11 22 11H30C32.2091 11 34 12.7909 34 15C34 17.2091 32.2091 19 30 19H20C17.7909 19 16 20.7909 16 23C16 23.4 16.06 23.78 16.17 24.14L12.4 25.4C12.14 24.34 12 23.19 12 22C12 20.9 12.18 19.84 12.5 18.84"
            fill="#E5E7EB"
            className="transition-colors duration-200"
          />

          {/* Lower interlocking node (Member 2 - Sage Green forming the M / shared foundation) */}
          <path
            d="M34 29C34 33.4183 30.4183 37 26 37H18C15.7909 37 14 35.2091 14 33C14 30.7909 15.7909 29 18 29H28C30.2091 29 32 27.2091 32 25C32 24.6 31.94 24.22 31.83 23.86L35.6 22.6C35.86 23.66 36 24.81 36 26C36 27.1 35.82 28.16 35.5 29.16"
            fill="#8FAF9A"
            className="transition-colors duration-200"
          />

          {/* The Hairline Split Channel (Diagonal dividing line symbolizing shared expense) */}
          <line
            x1="13"
            y1="34"
            x2="35"
            y2="14"
            stroke="#0B0C0E"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="13"
            y1="34"
            x2="35"
            y2="14"
            stroke="#8FAF9A"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeDasharray="2 3"
            opacity="0.85"
          />

          {/* Central geometric equilibrium anchor (the shared connection / trust point) */}
          <circle cx="24" cy="24" r="3.2" fill="#0B0C0E" stroke="#8FAF9A" strokeWidth="1.5" />
          <circle cx="24" cy="24" r="1.5" fill="#F5F5F5" />
        </svg>
      </div>

      {/* Brand Wordmark & Optional Tagline */}
      {showWordmark && (
        <div className="flex flex-col">
          <div className={`font-bold tracking-tight text-[#F5F5F5] flex items-center ${textSize}`}>
            <span>Split</span>
            <span className="text-[#8FAF9A] font-semibold ml-0.5">Mate</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#8FAF9A] ml-1 inline-block"></span>
          </div>
          {showTagline && (
            <span className={`text-[#A0A5AE] tracking-wide font-normal -mt-0.5 ${taglineSize}`}>
              Break the bill, not the bond.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
