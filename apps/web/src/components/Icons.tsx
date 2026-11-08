import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const Icon = ({ children, ...props }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

export const ArrowIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

export const RouteIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="6" cy="18" r="2.2" />
    <circle cx="18" cy="6" r="2.2" />
    <path d="M8.2 18h2.3a2.5 2.5 0 0 0 0-5H9.8a2.5 2.5 0 0 1 0-5H15.8" />
  </Icon>
);

export const PinIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="2.5" />
  </Icon>
);

export const CalendarIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" />
  </Icon>
);

export const ClockIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </Icon>
);

export const SparkIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m12 3 1.3 4.2L17 9l-3.7 1.8L12 15l-1.3-4.2L7 9l3.7-1.8L12 3ZM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15ZM19 13l.7 1.8 1.8.7-1.8.7L19 18l-.7-1.8-1.8-.7 1.8-.7L19 13Z" />
  </Icon>
);

export const PlusIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const CloseIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Icon>
);

export const BackIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m15 18-6-6 6-6" />
  </Icon>
);

export const TrashIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" />
  </Icon>
);

export const LogOutIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M10 17l5-5-5-5M15 12H3M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" />
  </Icon>
);

export const MapIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
    <path d="M9 3v15M15 6v15" />
  </Icon>
);
