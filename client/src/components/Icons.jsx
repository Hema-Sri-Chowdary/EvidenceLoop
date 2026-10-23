import React from 'react';

// Pure React SVG Icons (Zero external icon library dependencies)

const defaultSvgProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: '24',
  height: '24',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '2',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const LayoutDashboard = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </svg>
);

export const CheckSquare = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

export const PlusCircle = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12h8" />
    <path d="M12 8v8" />
  </svg>
);

export const Plus = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

export const AlertCircle = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

export const Clock = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const CheckCircle2 = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const ShieldAlert = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

export const ShieldCheck = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const FileQuestion = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <circle cx="10" cy="13" r="2" />
    <path d="m20 17-1.09-1.09a3 3 0 0 0-4.24 0L14 16.5" />
  </svg>
);

export const Search = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" x2="16.65" y1="21" y2="16.65" />
  </svg>
);

export const X = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export const RotateCcw = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

export const Edit3 = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

export const Trash2 = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </svg>
);

export const Eye = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const Link2 = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <path d="M9 17H7A5 5 0 0 1 7 7h2" />
    <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
    <line x1="8" x2="16" y1="12" y2="12" />
  </svg>
);

export const ExternalLink = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" x2="21" y1="14" y2="3" />
  </svg>
);

export const Calendar = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

export const User = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const Tag = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
    <circle cx="7" cy="7" r=".5" fill="currentColor" />
  </svg>
);

export const ArrowLeft = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

export const ArrowRight = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export const ArrowUpRight = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <path d="M7 7h10v10" />
    <path d="M7 17 17 7" />
  </svg>
);

export const Download = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

export const Menu = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

export const Database = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5V19A9 3 0 0 0 21 19V5" />
    <path d="M3 12A9 3 0 0 0 21 12" />
  </svg>
);

export const Loader2 = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={`animate-spin-svg ${className}`} {...props}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export const AlertTriangle = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" x2="12" y1="9" y2="13" />
    <line x1="12" x2="12.01" y1="17" y2="17" />
  </svg>
);

export const Info = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

export const HelpCircle = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" x2="12.01" y1="17" y2="17" />
  </svg>
);

export const ClipboardList = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M12 11h4" />
    <path d="M12 16h4" />
    <path d="M8 11h.01" />
    <path d="M8 16h.01" />
  </svg>
);

export const Save = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

export const RefreshCw = ({ className = '', size = 20, ...props }) => (
  <svg {...defaultSvgProps} width={size} height={size} className={className} {...props}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

export const LinkIcon = Link2;

