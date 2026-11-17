import React from 'react';
import { C, F, clamp, ease, sm, ap, lerp, pop } from './theme.js';
import { Glass, Tilt, Bar3D, Stage, SectionChip, Flow, glow, hexA } from './fx.jsx';

// L = time on the professor's long take (seconds). G = time inside the inserted student line (or null).
// Content column: x 70..830 (right 230px kept clear for the Instagram UI), y 330..1240.
const CX = 450;
const win = (L, a, b, fi = 0.35, fo = 0.35) => clamp((L - a) / fi) * (1 - clamp((L - (b - fo)) / fo));

const GlowText = ({ x, y, text, o = 1, size = 44, color = C.white, w = 760, g = 0, weight = 800 }) => (
  <div style={{ position: 'absolute', left: x - w / 2, top: y, width: w, textAlign: 'center', fontFamily: F.bold, fontWeight: weight, fontSize: size, color, opacity: o, lineHeight: 1.12, textShadow: g ? glow(color, g) : '0 4px 18px rgba(0,0,0,0.5)' }}>{text}</div>
);
const Pill = ({ x, y, text, col, s = 1, o = 1, size = 46, solid = true }) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${s})`, opacity: o, padding: '10px 26px 14px', borderRadius: 20, whiteSpace: 'nowrap', fontFamily: F.bold, fontWeight: 800, fontSize: size,
    background: solid ? `linear-gradient(180deg, ${hexA('#ffffff', 0.35)}, ${col} 40%, ${hexA(col, 0.85)})` : hexA(col, 0.1), color: solid ? '#10201a' : col,
    border: `2px solid ${solid ? hexA('#ffffff', 0.4) : hexA(col, 0.8)}`, boxShadow: `0 0 26px ${hexA(col, 0.6)}, 0 12px 26px rgba(0,0,0,0.45), inset 0 2px 0 rgba(255,255,255,0.45)` }}>{text}</div>
);

/* ---------- 1. why: everyone uses it ---------- */
const Person = () => (
  <svg width="120" height="200" viewBox="0 0 120 200">
    <defs>
      <radialGradient id="ph" cx="38%" cy="32%" r="70%"><stop offset="0" stopColor="#d9f3e6" /><stop offset="0.45" stopColor={C.sage} /><stop offset="1" stopColor="#2c4a3e" /></radialGradient>
      <linearGradient id="pb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9cc9b4" /><stop offset="1" stopColor="#2a453a" /></linearGradient>
    </defs>
    <circle cx="60" cy="42" r="31" fill="url(#ph)" />
    <rect x="16" y="82" width="88" height="112" rx="40" fill="url(#pb)" />
  </svg>
);
const Why = ({ L }) => {
  const o = win(L, 25.1, 31.75);
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <Tilt t={L} rx={14} ry={0}>
        {[0, 1, 2, 3, 4].map((i) => {
          const at = 26.64 + i * 0.22; const p = pop(L, at); const x = 150 + i * 150; const y = 760 + (i % 2) * 30;
          const q = L > 28.7 ? ap(L, 28.76 + i * 0.12, 0.3) : 0;
          return (
            <div key={i} style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${p})` }}>
              <div style={{ position: 'absolute', left: -10, top: 170, width: 140, height: 30, borderRadius: '50%', background: `radial-gradient(${hexA(C.teal, 0.5)}, transparent 70%)` }} />
              <Person />
              <div style={{ position: 'absolute', left: 66, top: -92 }}>
                <Glass col={q > 0.5 ? C.orange : C.sage} strong={q > 0.5} style={{ width: 92, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 18 }}>
                  <div style={{ fontFamily: F.bold, fontWeight: 800, fontSize: 42, color: q > 0.5 ? C.orange : C.white, textShadow: q > 0.5 ? glow(C.orange, 0.6) : 'none' }}>{q > 0.5 ? '?' : '…'}</div>
                </Glass>
              </div>
            </div>
          );
        })}
      </Tilt>
      <GlowText x={CX} y={1010} text="used daily" o={ap(L, 27.2)} size={64} />
      <GlowText x={CX} y={1092} text="rarely understood" o={ap(L, 29.1)} size={64} color={C.orange} g={0.8} />
    </div>
  );
};

/* ---------- 2. what you'll understand: three cards ---------- */
const Three = ({ L }) => {
  const o = win(L, 31.7, 39.2);
  if (o <= 0) return null;
  const cards = [['1', 'what it is', 33.28], ['2', 'its one job', 34.72], ['3', 'why that is enough', 36.5]];
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <Tilt t={L} rx={8} ry={-12}>
        {cards.map(([n, txt, at], i) => {
          const p = ap(L, at, 0.5); const y = 470 + i * 240; const hot = i === 1 && L > 34.6 && L < 36.6;
          const col = i === 1 ? C.orange : C.teal;
          return (
            <div key={i} style={{ position: 'absolute', left: 90, top: y, width: 720, opacity: p, transform: `translateX(${(1 - p) * -90}px)` }}>
              <Glass col={hot ? C.orange : C.teal} strong={hot} shine={clamp((L - at) / 0.9)} style={{ height: 180, display: 'flex', alignItems: 'center', gap: 34, paddingLeft: 40 }}>
                <div style={{ width: 100, height: 100, borderRadius: 50, background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${col} 45%, ${hexA(col, 0.6)} 100%)`, color: '#10201a', fontFamily: F.bold, fontWeight: 800, fontSize: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: glow(col, 0.7) }}>{n}</div>
                <div style={{ fontFamily: F.bold, fontWeight: 800, fontSize: 58, color: C.white }}>{txt}</div>
              </Glass>
            </div>
          );
        })}
      </Tilt>
    </div>
  );
};

/* ---------- 3+4+5. sentence, scores, the loop ---------- */
const WORDS = [['The', 44.24], ['cat', 44.4], ['sat', 44.72], ['on', 45.12], ['the', 45.36]];
const CLOUD = ['sofa', 'mat', 'banana', 'floor', 'chair', 'roof', 'bed', 'moon', 'rug', 'tree', 'car', 'box', 'idea', 'sky'];
const Tile = ({ w, o, y = 0, col = C.teal, hot = false }) => (
  <div style={{ opacity: o, transform: `translateY(${y}px)` }}>
    <Glass col={hot ? C.pink : col} strong={hot} style={{ padding: '8px 22px 14px', borderRadius: 18 }}>
      <div style={{ fontFamily: F.bold, fontWeight: 800, fontSize: 64, color: hot ? C.pink : C.white, textShadow: hot ? glow(C.pink, 0.7) : 'none' }}>{w}</div>
    </Glass>
  </div>
);
const Sentence = ({ L }) => {
  const o = win(L, 39.2, 65.0, 0.35, 0.4);
  if (o <= 0) return null;
  const up = sm((L - 47.1) / 0.7) * 170 - sm((L - 57.5) / 0.6) * 60;
  const matIn = pop(L, 46.49, 0.5);
  const y0 = 560 - up;
  const lab = ap(L, 40.7) * (1 - ap(L, 47.0, 0.3));
  const labY = lerp(680, 340, sm((L - 43.6) / 0.6)); const labS = lerp(86, 56, sm((L - 43.6) / 0.6));
  const loopP = ap(L, 57.6, 0.5);
  const email = L > 61.3;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <GlowText x={CX} y={labY - lerp(130, 90, sm((L - 43.6) / 0.6))} text="LLM =" o={lab * (1 - sm((L - 43.6) / 0.6))} size={labS} />
      <GlowText x={CX} y={labY} text="next-word predictor" o={lab} size={labS} color={C.orange} g={0.9} />
      {!email && (
        <Tilt t={L} rx={12} ry={-6} amp={0.6}>
          <div style={{ position: 'absolute', left: 70, top: y0, width: 760, display: 'flex', flexWrap: 'wrap', gap: '18px 16px', justifyContent: 'center', alignItems: 'center' }}>
            {WORDS.map(([w, at], i) => <Tile key={i} w={w} o={ap(L, at, 0.25)} y={(1 - ap(L, at, 0.3)) * 30} />)}
            <div style={{ minWidth: 170, height: 104, borderRadius: 18, border: matIn > 0.02 ? 'none' : `3px dashed ${hexA(C.pink, 0.7)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: ap(L, 45.6, 0.3) }}>
              {matIn > 0 && <div style={{ transform: `scale(${matIn})` }}><Tile w="mat" o={1} hot={loopP < 0.5} /></div>}
            </div>
            {loopP > 0 && <div style={{ minWidth: 120, height: 104, borderRadius: 18, border: `3px dashed ${C.pink}`, boxShadow: glow(C.pink, 0.5), opacity: loopP, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bold, fontWeight: 800, fontSize: 64, color: C.pink }}>{L > 59.3 ? '.' : '?'}</div>}
          </div>
        </Tilt>
      )}
      <Scores L={L} />
      <Loop L={L} />
      <Email L={L} />
    </div>
  );
};

const Scores = ({ L }) => {
  const o = win(L, 47.1, 57.6, 0.4, 0.4);
  if (o <= 0) return null;
  const cloud = ap(L, 48.9, 0.5) * (1 - ap(L, 50.9, 0.5));
  // bar height = score x scale (illustrative ranking, no numbers)
  const bars = [['mat', 0.82, C.orange, 52.4], ['sofa', 0.3, C.sage, 53.8], ['banana', 0.03, C.tealGrey, 55.28]];
  const base = 1120, scale = 400;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      {cloud > 0 && CLOUD.map((w, i) => {
        const a = (i / CLOUD.length) * Math.PI * 2 + L * 0.15; const r = 250 + (i % 3) * 55; const z = Math.sin(a);
        return <div key={i} style={{ position: 'absolute', left: CX + Math.cos(a) * r, top: 880 + z * r * 0.38, transform: `translate(-50%,-50%) scale(${0.75 + 0.3 * (z + 1) / 2})`, opacity: cloud * ap(L, 48.9 + i * 0.05, 0.3) * (0.45 + 0.55 * (z + 1) / 2), zIndex: Math.round(z * 10) + 10 }}>
          <Glass col={C.teal} style={{ padding: '4px 16px 8px', borderRadius: 14 }}><div style={{ fontFamily: F.bold, fontWeight: 700, fontSize: 40, color: C.white }}>{w}</div></Glass>
        </div>;
      })}
      {cloud > 0 && <GlowText x={CX} y={1150} text="every word gets a score" o={cloud} size={44} color={C.teal} g={0.5} />}
      <Tilt t={L} rx={6} ry={-14} amp={0.5}>
        <div style={{ position: 'absolute', left: 80, top: base - 6, width: 760, height: 14, borderRadius: 7, background: `linear-gradient(90deg, ${hexA(C.teal, 0.1)}, ${hexA(C.teal, 0.55)}, ${hexA(C.teal, 0.1)})`, boxShadow: glow(C.teal, 0.6), opacity: ap(L, 50.9) }} />
        {bars.map(([w, v, col, at], i) => {
          const g = ap(L, Math.min(at, 51.0 + i * 0.25), 0.7); const x = 190 + i * 250; const lit = L > at - 0.1 ? 1 : 0.4;
          return (
            <div key={i} style={{ opacity: ap(L, 50.9 + i * 0.15, 0.3) }}>
              <Bar3D x={x} base={base} h={v * scale * g} col={col} lit={lit} />
              <div style={{ position: 'absolute', left: x - 120, top: base + 22, width: 240, textAlign: 'center', fontFamily: F.bold, fontWeight: 800, fontSize: 48, color: i === 0 ? C.orange : C.white, opacity: lit, textShadow: i === 0 ? glow(C.orange, 0.6) : 'none' }}>{w}</div>
            </div>
          );
        })}
      </Tilt>
    </div>
  );
};

const Ring = ({ L, R, cy, t0, spinFrom }) => {
  const spin = L > spinFrom ? (L - spinFrom) * 2.3 : 0;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width="1080" height="1920">
      <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={C.teal} /><stop offset="0.5" stopColor={C.orange} /><stop offset="1" stopColor={C.pink} /></linearGradient></defs>
      <ellipse cx={CX} cy={cy + 26} rx={R} ry={R * 0.62} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="14" style={{ filter: 'blur(8px)' }} opacity={ap(L, t0)} />
      <ellipse cx={CX} cy={cy} rx={R} ry={R * 0.62} fill="none" stroke="url(#rg)" strokeWidth="11" opacity={0.9 * ap(L, t0)} style={{ filter: `drop-shadow(0 0 14px ${hexA(C.teal, 0.9)})` }} />
      <ellipse cx={CX} cy={cy} rx={R - 30} ry={(R - 30) * 0.62} fill="none" stroke={hexA(C.teal, 0.3)} strokeWidth="2" strokeDasharray="6 10" strokeDashoffset={-spin * 40} opacity={ap(L, t0)} />
      {L > spinFrom && [0, 0.1, 0.2].map((d, i) => <circle key={i} cx={CX + Math.cos(spin - d * 2 - Math.PI / 2) * R} cy={cy + Math.sin(spin - d * 2 - Math.PI / 2) * R * 0.62} r={16 - i * 4} fill={C.orange} opacity={1 - i * 0.3} style={{ filter: `drop-shadow(0 0 12px ${C.orange})` }} />)}
    </svg>
  );
};

const Loop = ({ L }) => {
  const o = win(L, 57.5, 61.4, 0.4, 0.35);
  if (o <= 0) return null;
  const steps = [['guess', 57.6, C.orange], ['add', 58.16, C.pink], ['repeat', 60.32, C.teal]];
  const R = 240, cy = 1000;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <Ring L={L} R={R} cy={cy} t0={57.5} spinFrom={59.0} />
      {steps.map(([t, at, col], i) => {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 3;
        return <Pill key={i} x={CX + Math.cos(a) * R} y={cy + Math.sin(a) * R * 0.62} text={t} col={col} s={pop(L, at)} size={46} />;
      })}
    </div>
  );
};

const EMAIL = 'Hi Sam, thanks for the notes. I will send the draft today.'.split(' ');
const Email = ({ L }) => {
  const o = win(L, 61.3, 65.3, 0.4, 0.3);
  if (o <= 0) return null;
  const n = Math.floor(clamp((L - 61.5) / 3.1) * EMAIL.length + (L > 61.5 ? 1 : 0));
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <Tilt t={L} rx={10} ry={-16}>
        <div style={{ position: 'absolute', left: 100, top: 430, width: 700 }}>
          <Glass col={C.teal} strong shine={clamp((L - 61.4) / 1.2)} style={{ height: 620, borderRadius: 34 }}>
            <div style={{ height: 92, borderBottom: `2px solid ${hexA(C.teal, 0.35)}`, display: 'flex', alignItems: 'center', gap: 16, paddingLeft: 40, fontFamily: F.mono, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: C.teal }}>
              <div style={{ width: 14, height: 14, borderRadius: 7, background: C.teal, boxShadow: glow(C.teal, 0.6) }} />REPLY
            </div>
            <div style={{ padding: '34px 40px', fontFamily: F.bold, fontWeight: 700, fontSize: 54, lineHeight: 1.35, color: C.white, display: 'flex', flexWrap: 'wrap', gap: '0 14px' }}>
              {EMAIL.slice(0, n).map((w, i) => <span key={i} style={{ color: i === n - 1 ? C.orange : C.white, textShadow: i === n - 1 ? glow(C.orange, 0.6) : 'none' }}>{w}</span>)}
              <span style={{ display: 'inline-block', width: 6, height: 58, background: C.orange, boxShadow: glow(C.orange, 0.5), opacity: Math.floor(L * 3) % 2 ? 1 : 0.2, marginTop: 8 }} />
            </div>
          </Glass>
        </div>
      </Tilt>
      <GlowText x={CX} y={1130} text="one word at a time" o={ap(L, 63.4)} size={52} color={C.orange} g={0.8} />
    </div>
  );
};

/* ---------- inserted student line: "...a whole report?" ---------- */
const Report = ({ G, gDur }) => {
  if (G == null) return null;
  const o = clamp(G / 0.3) * (1 - clamp((G - (gDur - 0.25)) / 0.25));
  const lines = Math.floor(clamp(G / (gDur * 0.85)) * 14);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <Tilt t={G + 60} rx={12} ry={-18}>
        {[3, 2, 1, 0].map((k) => (
          <div key={k} style={{ position: 'absolute', left: 170 + k * 30, top: 400 - k * 30, width: 560 }}>
            <Glass col={k ? C.tealGrey : C.teal} strong={!k} style={{ height: 760, borderRadius: 20 }}>
              {!k && Array.from({ length: lines }, (_, i) => <div key={i} style={{ height: 18, margin: '30px 44px 0', borderRadius: 9, width: `${60 + ((i * 37) % 35)}%`, background: i === 0 ? C.orange : hexA(C.white, 0.55), boxShadow: i === 0 ? glow(C.orange, 0.5) : 'none' }} />)}
            </Glass>
          </div>
        ))}
      </Tilt>
    </div>
  );
};

/* ---------- 6. autocomplete, grown up ---------- */
const Auto = ({ L }) => {
  const o = win(L, 65.3, 78.7, 0.4, 0.4);
  if (o <= 0) return null;
  const typed = "I'm going to the";
  const nT = Math.floor(clamp((L - 68.1) / 1.4) * typed.length);
  const sug = ap(L, 69.9, 0.3);
  const tap = L > 70.5;
  const grow = sm((L - 72.9) / 1.1);
  const pw = lerp(440, 680, grow), ph = lerp(820, 780, grow);
  const books = ap(L, 75.0, 0.5);
  const col = grow > 0.5 ? C.orange : C.teal;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <Tilt t={L} rx={8} ry={lerp(-22, -10, grow)}>
        <div style={{ position: 'absolute', left: CX - pw / 2, top: 330, width: pw }}>
          <Glass col={col} strong shine={clamp((L - 72.9) / 1.4)} style={{ height: ph, borderRadius: lerp(58, 34, grow), background: 'linear-gradient(160deg, rgba(255,255,255,0.14), rgba(8,16,13,0.92) 30%, rgba(8,16,13,0.95))' }}>
            {grow < 0.5 ? (
              <div style={{ opacity: 1 - grow * 2 }}>
                <div style={{ margin: '110px 28px 0', padding: '22px 24px', borderRadius: 20, background: hexA(C.white, 0.92), fontFamily: F.bold, fontWeight: 700, fontSize: 40, color: C.ground, minHeight: 56, boxShadow: glow(C.teal, 0.4) }}>
                  {typed.slice(0, nT)}{tap ? <span style={{ color: C.orange }}> store</span> : ''}<span style={{ opacity: Math.floor(L * 3) % 2 ? 1 : 0.2 }}>|</span>
                </div>
                <div style={{ position: 'absolute', left: 0, top: 440, width: '100%', display: 'flex', justifyContent: 'space-around', opacity: sug * (tap ? 0.45 : 1) }}>
                  {['store', 'gym', 'park'].map((s, i) => <div key={i} style={{ padding: '10px 18px 14px', borderRadius: 16, fontFamily: F.bold, fontWeight: 800, fontSize: 38, color: i === 0 ? '#10201a' : C.white, background: i === 0 ? C.orange : hexA(C.white, 0.1), boxShadow: i === 0 ? glow(C.orange, 0.6) : 'none', transform: `scale(${i === 0 && L > 70.35 && L < 70.6 ? 0.9 : 1})` }}>{s}</div>)}
                </div>
                <div style={{ position: 'absolute', left: 0, top: 530, width: '100%', height: 290, display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 8, padding: 16, boxSizing: 'border-box' }}>
                  {Array.from({ length: 30 }, (_, i) => <div key={i} style={{ borderRadius: 8, background: hexA(C.teal, 0.14), border: `1px solid ${hexA(C.teal, 0.25)}` }} />)}
                </div>
              </div>
            ) : (
              <div style={{ opacity: (grow - 0.5) * 2, padding: '46px 46px' }}>
                <div style={{ fontFamily: F.bold, fontWeight: 800, fontSize: 70, color: C.orange, marginBottom: 20, textShadow: glow(C.orange, 0.8) }}>LLM</div>
                {Array.from({ length: 11 }, (_, i) => <div key={i} style={{ height: 22, marginTop: 24, borderRadius: 11, width: `${55 + ((i * 29) % 40)}%`, background: i < Math.floor(clamp((L - 74) / 4) * 11) ? hexA(C.white, 0.75) : hexA(C.white, 0.1) }} />)}
              </div>
            )}
          </Glass>
        </div>
        <div style={{ position: 'absolute', left: CX - 280, top: 1160 - 120 * books, width: 560, opacity: books, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[C.teal, C.sage, C.teal].map((c, i) => <div key={i} style={{ height: 30, borderRadius: 8, marginLeft: i * 20, marginRight: (2 - i) * 20, background: `linear-gradient(180deg, ${hexA('#ffffff', 0.4)}, ${c} 35%, ${hexA(c, 0.6)})`, boxShadow: `0 0 20px ${hexA(c, 0.5)}, 0 8px 0 ${hexA(c, 0.35)}` }} />)}
        </div>
      </Tilt>
      <GlowText x={CX} y={1190} text="autocomplete, grown up" o={ap(L, 73.6)} size={52} color={C.orange} g={0.8} />
    </div>
  );
};

/* ---------- 7. at work: chat, email, summary ---------- */
const Icon = ({ kind, col }) => (
  <svg width="130" height="130" viewBox="0 0 150 150" style={{ filter: `drop-shadow(0 0 12px ${hexA(col, 0.8)})` }}>
    {kind === 'chat' && <><rect x="14" y="22" width="122" height="84" rx="22" fill={col} /><path d="M40 104 L34 132 L66 106 Z" fill={col} /></>}
    {kind === 'email' && <><rect x="12" y="32" width="126" height="88" rx="12" fill={col} /><path d="M14 38 L75 84 L136 38" stroke={C.ground} strokeWidth="9" fill="none" /></>}
    {kind === 'summary' && <><rect x="30" y="12" width="90" height="126" rx="10" fill={col} />{[38, 58, 78, 98].map((y, i) => <rect key={i} x="46" y={y} width={i === 3 ? 34 : 58} height="9" rx="4" fill={C.ground} />)}</>}
  </svg>
);
const Work = ({ L }) => {
  const o = win(L, 78.6, 87.3, 0.4, 0.4);
  if (o <= 0) return null;
  const items = [['chat', 80.96, C.teal], ['email', 82.08, C.white], ['summary', 83.44, C.sage]];
  const merge = sm((L - 84.6) / 0.9);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <GlowText x={CX} y={430} text="at work" o={ap(L, 79.2) * (1 - merge)} size={60} color={C.teal} g={0.6} />
      <Tilt t={L} rx={12} ry={-10}>
        {items.map(([k, at, col], i) => {
          const x = lerp(185 + i * 265, CX, merge * 0.6), y = lerp(700, 760, merge);
          return (
            <div key={i} style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${pop(L, at)})` }}>
              <Glass col={col === C.white ? C.teal : col} style={{ width: 210, height: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <Icon kind={k} col={col} />
                <div style={{ fontFamily: F.bold, fontWeight: 800, fontSize: 40, color: C.white, opacity: 1 - merge }}>{k}</div>
              </Glass>
            </div>
          );
        })}
      </Tilt>
      {[0, 1, 2].map((i) => <Flow key={i} x1={185 + i * 265} y1={850} x2={CX} y2={970} t={L + i * 0.3} col={C.orange} o={merge * 0.9} />)}
      {merge > 0 && <Pill x={CX} y={1010} text="next word, very fast" col={C.orange} s={(0.8 + 0.2 * merge) * (1 + 0.03 * Math.sin(L * 9))} o={merge} size={54} />}
      <GlowText x={CX} y={1140} text="one prediction, everywhere" o={ap(L, 85.0)} size={46} color={C.white} />
    </div>
  );
};

/* ---------- 8. predicts, not looks up ---------- */
const Careful = ({ L }) => {
  const o = win(L, 87.2, 96.4, 0.4, 0.4);
  if (o <= 0) return null;
  const chk = ap(L, 92.9, 0.4); const doc = sm((L - 94.3) / 0.9);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <GlowText x={CX} y={360} text="predicts ≠ looks up" o={ap(L, 87.9)} size={68} color={C.white} g={0.4} />
      <Tilt t={L} rx={8} ry={-12}>
        <div style={{ position: 'absolute', left: 120, top: 560, width: 540, opacity: ap(L, 90.3) }}>
          <Glass col={C.sage} strong style={{ padding: '30px 36px 40px', fontFamily: F.bold, fontWeight: 800, fontSize: 52, color: C.white }}>"Definitely!"</Glass>
          <div style={{ position: 'absolute', right: -44, top: -46, width: 100, height: 100, borderRadius: 50, background: `radial-gradient(circle at 35% 30%, #fff6c4, ${C.yellow} 50%, #b88f00)`, color: C.ground, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bold, fontWeight: 800, fontSize: 64, transform: `scale(${pop(L, 91.84)})`, boxShadow: glow(C.yellow, 0.8) }}>?</div>
        </div>
        <div style={{ position: 'absolute', left: 140, top: 820, opacity: chk }}>
          <Glass col={C.green} strong style={{ display: 'flex', alignItems: 'center', gap: 26, padding: '16px 34px 18px 18px' }}>
            <div style={{ width: 92, height: 92, borderRadius: 46, background: `radial-gradient(circle at 35% 30%, #eafff2, ${C.green} 55%, #3f9d68)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: glow(C.green, 0.6) }}>
              <svg width="56" height="56" viewBox="0 0 56 56"><path d="M10 30 L23 42 L46 14" stroke={C.ground} strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray="60" strokeDashoffset={60 * (1 - ap(L, 93.0, 0.4))} /></svg>
            </div>
            <div style={{ fontFamily: F.bold, fontWeight: 800, fontSize: 52, color: C.white }}>check it</div>
          </Glass>
        </div>
        <div style={{ position: 'absolute', left: 140, top: 1000, opacity: ap(L, 94.3) }}>
          <Glass col={C.teal} strong shine={clamp((L - 94.3) / 1.0)} style={{ display: 'flex', alignItems: 'center', gap: 26, padding: '16px 34px 18px 22px' }}>
            <div style={{ transform: `translateX(${(1 - doc) * -80}px)` }}>
              <svg width="92" height="110" viewBox="0 0 92 110" style={{ filter: `drop-shadow(0 0 10px ${hexA(C.teal, 0.8)})` }}><path d="M6 6 H60 L86 32 V104 H6 Z" fill={C.white} /><path d="M60 6 V32 H86" fill="none" stroke={C.ground} strokeWidth="5" />{[46, 62, 78].map((y) => <rect key={y} x="18" y={y} width="56" height="7" rx="3" fill={C.tealGrey} />)}</svg>
            </div>
            <div style={{ fontFamily: F.bold, fontWeight: 800, fontSize: 52, color: C.white }}>give it your docs</div>
          </Glass>
        </div>
      </Tilt>
    </div>
  );
};

/* ---------- 9. agents: the same loop, one level up (end frame) ---------- */
export const AGENT_END = 106.0;
const Agents = ({ L }) => {
  const o = win(L, 96.3, 1e9, 0.45, 0.01);
  if (o <= 0) return null;
  const R = 250, cy = 880;
  const nodes = [['plan', 101.6, C.orange], ['act', 102.24, C.pink], ['check', 103.2, C.teal]];
  const center = pop(L, 104.6, 0.5);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <div style={{ position: 'absolute', left: CX, top: 440, transform: `translate(-50%,-50%) scale(${pop(L, 98.9)})` }}>
        <Glass col={C.teal} strong style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '12px 28px 14px 16px' }}>
          <Icon kind="chat" col={C.teal} /><div style={{ fontFamily: F.bold, fontWeight: 800, fontSize: 48, color: C.white, whiteSpace: 'nowrap' }}>drafts replies</div>
        </Glass>
      </div>
      {L > 101.4 && <Ring L={L} R={R} cy={cy} t0={101.5} spinFrom={103.6} />}
      {nodes.map(([t, at, col], i) => {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 3;
        return <Pill key={i} x={CX + Math.cos(a) * R} y={cy + Math.sin(a) * R * 0.62} text={t} col={col} s={pop(L, at)} size={46} />;
      })}
      <Pill x={CX} y={cy} text="next word" col={C.orange} s={center} size={40} solid={false} />
      <GlowText x={CX} y={1130} text="one prediction → whole systems" o={ap(L, 104.0)} size={46} w={820} g={0.3} />
    </div>
  );
};

/* ---------- the handoff word: pink "mat" from the board, parked as a teaser ---------- */
const Teaser = ({ L }) => {
  const k = sm((L - 24.9) / 0.9);
  const gone = ap(L, 39.0, 0.4);
  if (L > 39.5) return null;
  const x = lerp(CX, 760, k), y = lerp(860, 300, k), s = lerp(4.2, 0.7, k);
  return <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${s})`, opacity: 1 - gone, padding: '6px 26px 12px', borderRadius: 22, background: `linear-gradient(180deg, #ffd0e8, ${C.pink} 45%)`, color: '#2a0f1f', fontFamily: F.bold, fontWeight: 800, fontSize: 84, boxShadow: glow(C.pink, 0.8) }}>mat</div>;
};

const SECTIONS = [[25.1, 39.2, 'WHY IT MATTERS'], [39.2, 65.3, 'THE ONE JOB'], [65.3, 78.7, 'AN ANALOGY'], [78.7, 96.4, 'AT WORK'], [96.4, 1e9, 'AGENTS']];
export const Middle = ({ L, G, gDur, t, still = false }) => {
  const sec = SECTIONS.find(([a, b]) => L >= a && L < b);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Stage t={t != null ? t : L} />
      {sec && !still && <SectionChip text={sec[2]} o={clamp((L - sec[0]) / 0.4) * (G != null ? 0.6 : 1)} col={sec[2] === 'THE ONE JOB' ? C.orange : C.teal} />}
      <Teaser L={L} />
      <Why L={L} />
      <Three L={L} />
      <div style={{ position: 'absolute', inset: 0, opacity: G != null ? 1 - clamp(G / 0.35) : 1 }}><Sentence L={G != null ? 64.95 : L} /></div>
      <Report G={G} gDur={gDur} />
      {G == null && <><Auto L={L} /><Work L={L} /><Careful L={L} /><Agents L={L} /></>}
    </div>
  );
};
