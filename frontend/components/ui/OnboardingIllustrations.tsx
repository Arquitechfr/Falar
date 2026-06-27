import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop, Line } from 'react-native-svg';

const PRIMARY = '#C96B4A';
const PRIMARY_LIGHT = '#D98969';
const PRIMARY_DARK = '#A85337';
const WHITE = '#FFFFFF';

const SIZE = 220;

export function OnboardingIllustration1() {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 220 220" fill="none">
      <Defs>
        <LinearGradient id="ob1-bubble-mine" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={PRIMARY_LIGHT} />
          <Stop offset="1" stopColor={PRIMARY} />
        </LinearGradient>
      </Defs>

      {/* Background circle */}
      <Circle cx="110" cy="110" r="100" fill={PRIMARY} opacity="0.08" />

      {/* Chat bubble 1 (other, top-left) */}
      <Rect x="30" y="35" width="120" height="48" rx="20" fill={WHITE} opacity="0.9" />
      <Path d="M45 82 L45 95 L58 82 Z" fill={WHITE} opacity="0.9" />
      <Rect x="48" y="48" width="84" height="6" rx="3" fill={PRIMARY} opacity="0.3" />
      <Rect x="48" y="60" width="60" height="6" rx="3" fill={PRIMARY} opacity="0.2" />

      {/* Chat bubble 2 (mine, bottom-right) */}
      <Rect x="70" y="110" width="120" height="48" rx="20" fill="url(#ob1-bubble-mine)" />
      <Path d="M175 157 L175 170 L162 157 Z" fill={PRIMARY} />
      <Rect x="88" y="123" width="84" height="6" rx="3" fill={WHITE} opacity="0.5" />
      <Rect x="88" y="135" width="60" height="6" rx="3" fill={WHITE} opacity="0.4" />

      {/* Small decorative dots */}
      <Circle cx="195" cy="50" r="4" fill={PRIMARY_LIGHT} opacity="0.4" />
      <Circle cx="25" cy="160" r="3" fill={PRIMARY_LIGHT} opacity="0.3" />
      <Circle cx="200" cy="180" r="5" fill={PRIMARY} opacity="0.2" />
    </Svg>
  );
}

export function OnboardingIllustration2() {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 220 220" fill="none">
      <Defs>
        <LinearGradient id="ob2-shield" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={PRIMARY_LIGHT} />
          <Stop offset="1" stopColor={PRIMARY_DARK} />
        </LinearGradient>
      </Defs>

      {/* Background circle */}
      <Circle cx="110" cy="110" r="100" fill={PRIMARY} opacity="0.08" />

      {/* Decorative rays */}
      <Line x1="110" y1="15" x2="110" y2="30" stroke={PRIMARY_LIGHT} strokeWidth="2" opacity="0.3" strokeLinecap="round" />
      <Line x1="110" y1="190" x2="110" y2="205" stroke={PRIMARY_LIGHT} strokeWidth="2" opacity="0.3" strokeLinecap="round" />
      <Line x1="15" y1="110" x2="30" y2="110" stroke={PRIMARY_LIGHT} strokeWidth="2" opacity="0.3" strokeLinecap="round" />
      <Line x1="190" y1="110" x2="205" y2="110" stroke={PRIMARY_LIGHT} strokeWidth="2" opacity="0.3" strokeLinecap="round" />

      {/* Shield */}
      <Path
        d="M110 40 L155 58 L155 110 Q155 145 110 170 Q65 145 65 110 L65 58 Z"
        fill="url(#ob2-shield)"
      />

      {/* Lock body */}
      <Rect x="92" y="95" width="36" height="30" rx="6" fill={WHITE} opacity="0.95" />
      {/* Lock shackle */}
      <Path
        d="M98 95 L98 88 Q98 78 110 78 Q122 78 122 88 L122 95"
        stroke={WHITE}
        strokeWidth="4"
        fill="none"
        opacity="0.95"
      />
      {/* Keyhole */}
      <Circle cx="110" cy="108" r="4" fill={PRIMARY_DARK} />
      <Rect x="108" y="108" width="4" height="10" rx="2" fill={PRIMARY_DARK} />

      {/* Checkmark inside shield */}
      <Path
        d="M100 135 L108 143 L122 128"
        stroke={WHITE}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </Svg>
  );
}

export function OnboardingIllustration3() {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 220 220" fill="none">
      <Defs>
        <LinearGradient id="ob3-circle" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={PRIMARY_LIGHT} />
          <Stop offset="1" stopColor={PRIMARY_DARK} />
        </LinearGradient>
      </Defs>

      {/* Background circle */}
      <Circle cx="110" cy="110" r="100" fill={PRIMARY} opacity="0.08" />

      {/* Main circle */}
      <Circle cx="110" cy="110" r="55" fill="url(#ob3-circle)" />

      {/* Lightning bolt (speed) */}
      <Path
        d="M118 78 L95 115 L108 115 L100 142 L125 105 L112 105 Z"
        fill={WHITE}
        opacity="0.95"
      />

      {/* Three checkmarks around */}
      {/* Check 1 — top */}
      <Circle cx="110" cy="35" r="16" fill={WHITE} opacity="0.9" />
      <Path d="M104 35 L109 40 L117 31" stroke={PRIMARY} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Check 2 — bottom-left */}
      <Circle cx="45" cy="160" r="16" fill={WHITE} opacity="0.9" />
      <Path d="M39 160 L44 165 L52 156" stroke={PRIMARY} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Check 3 — bottom-right */}
      <Circle cx="175" cy="160" r="16" fill={WHITE} opacity="0.9" />
      <Path d="M169 160 L174 165 L182 156" stroke={PRIMARY} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Connecting lines */}
      <Line x1="110" y1="51" x2="110" y2="55" stroke={PRIMARY_LIGHT} strokeWidth="2" opacity="0.3" strokeLinecap="round" />
      <Line x1="58" y1="150" x2="70" y2="140" stroke={PRIMARY_LIGHT} strokeWidth="2" opacity="0.3" strokeLinecap="round" />
      <Line x1="162" y1="150" x2="150" y2="140" stroke={PRIMARY_LIGHT} strokeWidth="2" opacity="0.3" strokeLinecap="round" />
    </Svg>
  );
}
