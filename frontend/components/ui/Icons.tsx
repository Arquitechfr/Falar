import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import type { ComponentType, ReactNode } from 'react';

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const DEFAULT_SIZE = 24;
const DEFAULT_STROKE = 2;

function createIcon(
  paths: (elements: { Path: typeof Path; Circle: typeof Circle; Line: typeof Line; Rect: typeof Rect }) => ReactNode,
): ComponentType<IconProps> {
  return function Icon({ size = DEFAULT_SIZE, color = '#1F1F1F', strokeWidth = DEFAULT_STROKE }: IconProps) {
    return (
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths({ Path, Circle, Line, Rect })}
      </Svg>
    );
  };
}

export const ChevronLeft = createIcon(({ Path }) => (
  <Path d="M15 18l-6-6 6-6" />
));

export const ChevronRight = createIcon(({ Path }) => (
  <Path d="M9 18l6-6-6-6" />
));

export const ChevronDown = createIcon(({ Path }) => (
  <Path d="M6 9l6 6 6-6" />
));

export const Search = createIcon(({ Path, Circle }) => (
  <>
    <Circle cx="11" cy="11" r="8" />
    <Path d="M21 21l-4.35-4.35" />
  </>
));

export const Plus = createIcon(({ Path }) => (
  <Path d="M12 5v14M5 12h14" />
));

export const Send = createIcon(({ Path }) => (
  <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
));

export const Check = createIcon(({ Path }) => (
  <Path d="M20 6L9 17l-5-5" />
));

export const CheckDouble = createIcon(({ Path }) => (
  <Path d="M18 7L7.5 17.5L3 13M22 7L11.5 17.5L10.5 16.5" />
));

export const Clock = createIcon(({ Path, Circle }) => (
  <>
    <Circle cx="12" cy="12" r="9" />
    <Path d="M12 7v5l3 2" />
  </>
));

export const X = createIcon(({ Path }) => (
  <>
    <Path d="M18 6L6 18" />
    <Path d="M6 6l12 12" />
  </>
));

export const XCircle = createIcon(({ Path, Circle }) => (
  <>
    <Circle cx="12" cy="12" r="9" />
    <Path d="M15 9l-6 6M9 9l6 6" />
  </>
));

export const Eye = createIcon(({ Path, Circle }) => (
  <>
    <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <Circle cx="12" cy="12" r="3" />
  </>
));

export const EyeOff = createIcon(({ Path, Line }) => (
  <>
    <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-10-8-10-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 10 8 10 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <Line x1="1" y1="1" x2="23" y2="23" />
  </>
));

export const Phone = createIcon(({ Path }) => (
  <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
));

export const User = createIcon(({ Path, Circle }) => (
  <>
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </>
));

export const Settings = createIcon(({ Path, Circle }) => (
  <>
    <Circle cx="12" cy="12" r="3" />
    <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </>
));

export const LogOut = createIcon(({ Path }) => (
  <>
    <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <Path d="M16 17l5-5-5-5M21 12H9" />
  </>
));

export const Camera = createIcon(({ Path, Circle }) => (
  <>
    <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <Circle cx="12" cy="13" r="4" />
  </>
));

export const Mic = createIcon(({ Path, Line }) => (
  <>
    <Path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <Path d="M19 10v2a7 7 0 01-14 0v-2" />
    <Line x1="12" y1="19" x2="12" y2="23" />
    <Line x1="8" y1="23" x2="16" y2="23" />
  </>
));

export const MessageCircle = createIcon(({ Path }) => (
  <Path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
));

export const MoreHorizontal = createIcon(({ Circle }) => (
  <>
    <Circle cx="12" cy="12" r="1" fill="currentColor" />
    <Circle cx="19" cy="12" r="1" fill="currentColor" />
    <Circle cx="5" cy="12" r="1" fill="currentColor" />
  </>
));

export const MoreVertical = createIcon(({ Circle }) => (
  <>
    <Circle cx="12" cy="12" r="1" fill="currentColor" />
    <Circle cx="12" cy="5" r="1" fill="currentColor" />
    <Circle cx="12" cy="19" r="1" fill="currentColor" />
  </>
));

export const Archive = createIcon(({ Path, Rect }) => (
  <>
    <Rect x="2" y="3" width="20" height="5" rx="1" />
    <Path d="M4 8v11a2 2 0 002 2h12a2 2 0 002-2V8" />
    <Path d="M10 12h4" />
  </>
));

export const Pin = createIcon(({ Path }) => (
  <Path d="M12 17v5M9 10.76a6 6 0 016 0V6a2 2 0 00-2-2H11a2 2 0 00-2 2v4.76z M5 10h14l-1.5 2h-11L5 10z" />
));

export const Trash = createIcon(({ Path, Line }) => (
  <>
    <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    <Line x1="10" y1="11" x2="10" y2="17" />
    <Line x1="14" y1="11" x2="14" y2="17" />
  </>
));

export const Bell = createIcon(({ Path }) => (
  <>
    <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <Path d="M13.73 21a2 2 0 01-3.46 0" />
  </>
));

export const Moon = createIcon(({ Path }) => (
  <Path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
));

export const Sun = createIcon(({ Path, Circle, Line }) => (
  <>
    <Circle cx="12" cy="12" r="5" />
    <Line x1="12" y1="1" x2="12" y2="3" />
    <Line x1="12" y1="21" x2="12" y2="23" />
    <Line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <Line x1="1" y1="12" x2="3" y2="12" />
    <Line x1="21" y1="12" x2="23" y2="12" />
    <Line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <Line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </>
));

export const Info = createIcon(({ Path, Circle, Line }) => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="16" x2="12" y2="12" />
    <Line x1="12" y1="8" x2="12.01" y2="8" />
  </>
));

export const Shield = createIcon(({ Path }) => (
  <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
));

export const Paperclip = createIcon(({ Path }) => (
  <Path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
));

export const ArrowDown = createIcon(({ Path, Line }) => (
  <>
    <Line x1="12" y1="5" x2="12" y2="19" />
    <Path d="M19 12l-7 7-7-7" />
  </>
));

export const Edit = createIcon(({ Path }) => (
  <>
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </>
));

export const AlertCircle = createIcon(({ Path, Circle, Line }) => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="8" x2="12" y2="12" />
    <Line x1="12" y1="16" x2="12.01" y2="16" />
  </>
));

export const CheckCircle = createIcon(({ Path, Circle }) => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Path d="M8 12l3 3 5-5" />
  </>
));

export const BellOff = createIcon(({ Path, Line }) => (
  <>
    <Path d="M13.73 21a2 2 0 01-3.46 0" />
    <Path d="M18.63 13A17.89 17.89 0 0118 8" />
    <Path d="M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14" />
    <Path d="M18 8a6 6 0 00-9.33-5" />
    <Line x1="1" y1="1" x2="23" y2="23" />
  </>
));

export const Video = createIcon(({ Path, Polygon, Rect }) => (
  <>
    <Polygon points="23 7 16 12 23 17 23 7" />
    <Rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </>
));

export const VideoOff = createIcon(({ Path, Line }) => (
  <>
    <Path d="M16 2v4M8 2v4M3 10h18M5 6h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
    <Line x1="1" y1="1" x2="23" y2="23" />
  </>
));

export const Mic = createIcon(({ Path, Line }) => (
  <>
    <Path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <Path d="M19 10v2a7 7 0 01-14 0v-2" />
    <Line x1="12" y1="19" x2="12" y2="23" />
    <Line x1="8" y1="23" x2="16" y2="23" />
  </>
));

export const MicOff = createIcon(({ Path, Line }) => (
  <>
    <Line x1="1" y1="1" x2="23" y2="23" />
    <Path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
    <Path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23" />
    <Line x1="12" y1="19" x2="12" y2="23" />
    <Line x1="8" y1="23" x2="16" y2="23" />
  </>
));

export const Volume2 = createIcon(({ Path }) => (
  <>
    <Path d="M11 5L6 9H2v6h4l5 4V5z" />
    <Path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
  </>
));

export const Bluetooth = createIcon(({ Path }) => (
  <Path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11" />
));

export const Grid = createIcon(({ Path, Rect }) => (
  <>
    <Rect x="3" y="3" width="7" height="7" rx="1" />
    <Rect x="14" y="3" width="7" height="7" rx="1" />
    <Rect x="14" y="14" width="7" height="7" rx="1" />
    <Rect x="3" y="14" width="7" height="7" rx="1" />
  </>
));

export const Star = createIcon(({ Path }) => (
  <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
));

export const Block = createIcon(({ Circle, Line }) => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </>
));

export const QrCode = createIcon(({ Path, Rect }) => (
  <>
    <Rect x="3" y="3" width="7" height="7" rx="1" />
    <Rect x="14" y="3" width="7" height="7" rx="1" />
    <Rect x="3" y="14" width="7" height="7" rx="1" />
    <Path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20v1" />
  </>
));

export const Share = createIcon(({ Path, Circle, Line }) => (
  <>
    <Circle cx="18" cy="5" r="3" />
    <Circle cx="6" cy="12" r="3" />
    <Circle cx="18" cy="19" r="3" />
    <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </>
));

export const Camera = createIcon(({ Path, Circle }) => (
  <>
    <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <Circle cx="12" cy="13" r="4" />
  </>
));

export const ImageIcon = createIcon(({ Path, Rect, Circle }) => (
  <>
    <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <Circle cx="8.5" cy="8.5" r="1.5" />
    <Path d="M21 15l-5-5L5 21" />
  </>
));

export const FileText = createIcon(({ Path }) => (
  <>
    <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </>
));

export const PhoneOff = createIcon(({ Path, Line }) => (
  <>
    <Path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7 2 2 0 011.72 2v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L10.68 13.31" />
    <Line x1="1" y1="1" x2="23" y2="23" />
  </>
));

export const PhoneCall = createIcon(({ Path }) => (
  <>
    <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    <Path d="M15.05 5.05a7 7 0 010 9.9" />
  </>
));
