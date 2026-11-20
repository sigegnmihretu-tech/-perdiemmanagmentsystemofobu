import React from 'react';

interface ObuCrestProps {
  size?: number;
  className?: string;
  onDark?: boolean;
}

/**
 * Renders the unmodified official Oda Bultum University logo retrieved from https://obu.edu.et/.
 * Does not redraw, alter, or regenerate the institutional emblem.
 */
export const ObuCrest: React.FC<ObuCrestProps> = ({
  size = 44,
  className = '',
  onDark = true,
}) => {
  return (
    <span
      style={{ width: size, height: size }}
      className={`inline-flex items-center justify-center rounded-full shrink-0 overflow-hidden ${
        onDark ? 'bg-white p-[2px] ring-1 ring-[#D4AF37]/70 shadow-sm' : 'bg-white'
      } ${className}`}
    >
      <img
        src="/assets/obu/obu-logo.png"
        alt="Oda Bultum University Official Logo"
        width={size}
        height={size}
        className="w-full h-full object-contain rounded-full select-none"
      />
    </span>
  );
};
