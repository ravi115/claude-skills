import React from 'react';
import { C, F, clamp, sm, lerp } from './theme.js';

// "3D shine" kit: glass cards with neon rims, glowing text, light sweeps, 3D bars, grid floor, particles.
export const hexA = (hex, a) => { const h = hex.replace('#', ''); const n = parseInt(h, 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export const glow = (col, k = 1) => `0 0 ${14 * k}px ${hexA(col, 0.85)}, 0 0 ${40 * k}px ${hexA(col, 0.45)}`;

export const Glass = ({ col = C.sage, style = {}, children, shine = null, strong = false }) => (
  <div style={{
    position: 'relative', borderRadius: 26, overflow: 'hidden',
    background: `linear-gradient(160deg, ${hexA('#ffffff', strong ? 0.16 : 0.10)} 0%, ${hexA('#ffffff', 0.03)} 45%, ${hexA(col, 0.10)} 100%)`,
    border: `2px solid ${hexA(col, strong ? 0.95 : 0.6)}`,
    boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.28), inset 0 -10px 24px ${hexA(col, 0.12)}, 0 0 ${strong ? 36 : 22}px ${hexA(col, strong ? 0.55 : 0.28)}, 0 22px 44px rgba(0,0,0,0.5)`,
    ...style,
  }}>
    {children}
    {shine != null && shine > 0 && shine < 1 && (
      <div style={{ position: 'absolute', top: -40, bottom: -40, left: `${lerp(-60, 160, shine)}%`, width: '38%', transform: 'skewX(-20deg)', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.22), rgba(255,255,255,0))', pointerEvents: 'none' }} />
    )}
  </div>
);

// 3D tilt wrapper with a slow float
export const Tilt = ({ t, rx = 10, ry = -8, amp = 1, children, origin = '50% 50%' }) => (
  <div style={{ position: 'absolute', inset: 0, perspective: 1500, perspectiveOrigin: '50% 40%' }}>
    <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transformOrigin: origin, transform: `rotateX(${rx + Math.sin(t * 0.7) * 1.5 * amp}deg) rotateY(${ry + Math.sin(t * 0.5 + 1) * 2 * amp}deg)` }}>{children}</div>
  </div>
);

// extruded 3D column: front + top + side faces
export const Bar3D = ({ x, base, w = 130, h, col, d = 34, lit = 1 }) => {
  const H = Math.max(4, h);
  return (
    <div style={{ position: 'absolute', left: x - w / 2, top: base - H, width: w + d, height: H + d, opacity: lit }}>
      {/* side */}
      <div style={{ position: 'absolute', left: w, top: d * 0.0, width: d, height: H, transformOrigin: '0 0', transform: `skewY(-45deg)`, background: `linear-gradient(180deg, ${hexA(col, 0.75)}, ${hexA(col, 0.35)})` }} />
      {/* top */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: d, transformOrigin: '0 100%', transform: `translateY(-${d}px) skewX(-45deg)`, background: `linear-gradient(90deg, ${hexA('#ffffff', 0.55)}, ${hexA(col, 0.95)})` }} />
      {/* front */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: H, borderRadius: '2px', background: `linear-gradient(180deg, ${col}, ${hexA(col, 0.55)})`, boxShadow: `0 0 40px ${hexA(col, 0.6)}, inset 0 2px 0 rgba(255,255,255,0.5)` }} />
    </div>
  );
};

export const Particles = ({ t, n = 26, col = '#c8ffe6' }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const hx = hash(i * 3.1), hy = hash(i * 5.7), sp = 8 + hash(i * 9) * 14, sz = 2 + hash(i * 2.3) * 4;
      const x = ((hx * 1150 + t * sp * 0.5 + Math.sin(t * 0.6 + i) * 20) % 1150) - 40;
      const y = 1400 - ((hy * 1300 + t * sp) % 1300);
      return <div key={i} style={{ position: 'absolute', left: x, top: y, width: sz, height: sz, borderRadius: '50%', background: col, opacity: 0.12 + 0.4 * Math.abs(Math.sin(t * 0.8 + i * 1.7)), boxShadow: `0 0 10px ${col}` }} />;
    })}
  </>
);

// perspective grid floor + horizon glow
export const Stage = ({ t }) => (
  <>
    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 70% 48% at 45% 42%, #2d4a3f 0%, ${C.ground} 45%, #101a16 100%)` }} />
    <div style={{ position: 'absolute', left: -600, top: 900, width: 2280, height: 1400, perspective: 600 }}>
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '50% 0%', transform: 'rotateX(72deg)', backgroundImage: `linear-gradient(${hexA(C.teal, 0.22)} 2px, transparent 2px), linear-gradient(90deg, ${hexA(C.teal, 0.22)} 2px, transparent 2px)`, backgroundSize: '90px 90px', backgroundPosition: `0px ${(t * 30) % 90}px`, WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0) 70%)' }} />
    </div>
    <div style={{ position: 'absolute', left: 0, top: 860, width: 1080, height: 120, background: `radial-gradient(ellipse 60% 50% at 45% 50%, ${hexA(C.teal, 0.18)}, transparent)` }} />
    <Particles t={t} />
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)' }} />
  </>
);

export const SectionChip = ({ text, o, col = C.teal }) => (
  <div style={{ position: 'absolute', left: 70, top: 268, opacity: o, display: 'flex', alignItems: 'center', gap: 12, padding: '8px 18px 9px', borderRadius: 16, border: `1.5px solid ${hexA(col, 0.6)}`, background: hexA(col, 0.08), fontFamily: F.mono, fontWeight: 700, fontSize: 22, letterSpacing: 3, color: hexA('#ffffff', 0.85) }}>
    <div style={{ width: 10, height: 10, borderRadius: 5, background: col, boxShadow: glow(col, 0.6) }} />{text}
  </div>
);

// dotted connector with a travelling light
export const Flow = ({ x1, y1, x2, y2, t, col = C.teal, o = 1 }) => {
  const len = Math.hypot(x2 - x1, y2 - y1); const k = ((t * 0.9) % 1);
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, opacity: o, overflow: 'visible' }} width="1080" height="1920">
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={hexA(col, 0.5)} strokeWidth="4" strokeDasharray="4 12" strokeLinecap="round" />
      <circle cx={lerp(x1, x2, k)} cy={lerp(y1, y2, k)} r="7" fill={col} style={{ filter: `drop-shadow(0 0 8px ${col})` }} />
    </svg>
  );
};
