/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Official Brand Symbol
 * Pure symbol icon without any underlying text as specified by brand guidelines.
 */

interface AdnetiksLogoProps {
  className?: string;
  size?: number | string;
}

export default function AdnetiksLogo({ className = 'w-8 h-8', size }: AdnetiksLogoProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      style={style}
      role="img"
      aria-label="ADNETIKS Symbol"
    >
      <defs>
        {/* Soft shadow for depth */}
        <filter id="adnetiks-shadow" filterUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120">
          <feDropShadow dx="1.5" dy="2.5" stdDeviation="2.5" floodColor="#7f1d1d" floodOpacity="0.45" />
        </filter>

        {/* 3D Glossy Red Sphere Radial Gradient */}
        <radialGradient id="adnetiks-sphere" cx="32%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#FFA39E" />
          <stop offset="22%" stopColor="#FF4D4F" />
          <stop offset="65%" stopColor="#E01E25" />
          <stop offset="100%" stopColor="#8A0C10" />
        </radialGradient>

        {/* Inner floating node gradient (deeper accent) */}
        <radialGradient id="adnetiks-inner-sphere" cx="35%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#FF7875" />
          <stop offset="30%" stopColor="#F5222D" />
          <stop offset="75%" stopColor="#CF1322" />
          <stop offset="100%" stopColor="#5C0011" />
        </radialGradient>

        {/* Connecting Rod Gradient Vertical */}
        <linearGradient id="adnetiks-rod-v" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F5222D" />
          <stop offset="50%" stopColor="#E01E25" />
          <stop offset="100%" stopColor="#CF1322" />
        </linearGradient>

        {/* Connecting Rod Gradient Diagonal */}
        <linearGradient id="adnetiks-rod-d" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5222D" />
          <stop offset="100%" stopColor="#CF1322" />
        </linearGradient>
      </defs>

      {/* Connecting Rod: Top-Left to Bottom-Left */}
      <line
        x1="24"
        y1="22"
        x2="19"
        y2="73"
        stroke="url(#adnetiks-rod-v)"
        strokeWidth="7"
        strokeLinecap="round"
        filter="url(#adnetiks-shadow)"
      />

      {/* Connecting Rod: Top-Left to Mid-Right */}
      <line
        x1="24"
        y1="22"
        x2="80"
        y2="46"
        stroke="url(#adnetiks-rod-d)"
        strokeWidth="7"
        strokeLinecap="round"
        filter="url(#adnetiks-shadow)"
      />

      {/* Node 1: Top-Left Apex Sphere */}
      <circle
        cx="24"
        cy="22"
        r="14"
        fill="url(#adnetiks-sphere)"
        filter="url(#adnetiks-shadow)"
      />

      {/* Node 2: Bottom-Left Base Sphere */}
      <circle
        cx="19"
        cy="73"
        r="14"
        fill="url(#adnetiks-sphere)"
        filter="url(#adnetiks-shadow)"
      />

      {/* Node 3: Mid-Right Sphere */}
      <circle
        cx="80"
        cy="46"
        r="14"
        fill="url(#adnetiks-sphere)"
        filter="url(#adnetiks-shadow)"
      />

      {/* Node 4: Inner Floating Central Sphere */}
      <circle
        cx="39"
        cy="47"
        r="12"
        fill="url(#adnetiks-inner-sphere)"
        filter="url(#adnetiks-shadow)"
      />

      {/* Specular Glint Highlights */}
      <ellipse cx="21" cy="18" rx="4" ry="2.5" fill="#FFFFFF" fillOpacity="0.45" transform="rotate(-25 21 18)" />
      <ellipse cx="16" cy="69" rx="4" ry="2.5" fill="#FFFFFF" fillOpacity="0.45" transform="rotate(-25 16 69)" />
      <ellipse cx="77" cy="42" rx="4" ry="2.5" fill="#FFFFFF" fillOpacity="0.45" transform="rotate(-25 77 42)" />
      <ellipse cx="36.5" cy="43.5" rx="3.5" ry="2" fill="#FFFFFF" fillOpacity="0.4" transform="rotate(-25 36.5 43.5)" />
    </svg>
  );
}
