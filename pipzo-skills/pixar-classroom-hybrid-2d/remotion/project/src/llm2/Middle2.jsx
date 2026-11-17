import React from 'react';
import { C, F, clamp, ease, sm, ap, lerp, pop } from '../llm1/theme.js';
import { Glass, Tilt, Bar3D, Stage, SectionChip, glow, hexA } from '../llm1/fx.jsx';
import CFG from './cfg2.json';

// cue = global time of a spoken word (k-th occurrence in that line)
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
export const cue = (line, word, k = 0) => { const h = CFG.words.filter((x) => x.line === line && norm(x.raw) === word); return h[k] ? h[k].t0 : (console.warn('cue missing', line, word), 0); };
const CX = 450;
const win = (t, a, b, fi = 0.35, fo = 0.35) => clamp((t - a) / fi) * (1 - clamp((t - (b - fo)) / fo));
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const GlowText = ({ x, y, text, o = 1, size = 52, color = C.white, w = 780, g = 0, weight = 800 }) => (
  <div style={{ position: 'absolute', left: x - w / 2, top: y, width: w, textAlign: 'center', fontFamily: F.bold, fontWeight: weight, fontSize: size, color, opacity: o, lineHeight: 1.12, textShadow: g ? glow(color, g) : '0 4px 18px rgba(0,0,0,0.5)' }}>{text}</div>
);
const Pill = ({ x, y, text, col, s = 1, o = 1, size = 46, solid = true }) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${s})`, opacity: o, padding: '10px 26px 14px', borderRadius: 20, whiteSpace: 'nowrap', fontFamily: F.bold, fontWeight: 800, fontSize: size,
    background: solid ? `linear-gradient(180deg, ${hexA('#ffffff', 0.35)}, ${col} 40%, ${hexA(col, 0.85)})` : hexA(col, 0.1), color: solid ? '#10201a' : col,
    border: `2px solid ${solid ? hexA('#ffffff', 0.4) : hexA(col, 0.8)}`, boxShadow: `0 0 26px ${hexA(col, 0.6)}, 0 12px 26px rgba(0,0,0,0.45), inset 0 2px 0 rgba(255,255,255,0.45)` }}>{text}</div>
);

// a glowing 3D-ish dial: ring, ticks, needle
export const Dial = ({ x, y, r, col = C.teal, ang = -40, o = 1, k = 1 }) => (
  <svg style={{ position: 'absolute', left: x - r * 1.3, top: y - r * 1.3, overflow: 'visible', opacity: o, filter: k > 0 ? `drop-shadow(0 0 ${10 * k}px ${hexA(col, 0.8)})` : 'none' }} width={r * 2.6} height={r * 2.6} viewBox="-130 -130 260 260">
    <defs><radialGradient id={`dg${col.slice(1)}`} cx="40%" cy="35%" r="75%"><stop offset="0" stopColor={hexA('#ffffff', 0.35)} /><stop offset="0.5" stopColor={hexA(col, 0.25)} /><stop offset="1" stopColor={hexA('#000000', 0.35)} /></radialGradient></defs>
    <circle r="100" fill={`url(#dg${col.slice(1)})`} stroke={col} strokeWidth="9" />
    {Array.from({ length: 11 }, (_, i) => { const a = (-135 + i * 27) * Math.PI / 180; return <line key={i} x1={Math.sin(a) * 74} y1={-Math.cos(a) * 74} x2={Math.sin(a) * 88} y2={-Math.cos(a) * 88} stroke={hexA('#ffffff', 0.7)} strokeWidth="6" strokeLinecap="round" />; })}
    <g transform={`rotate(${ang})`}><line x1="0" y1="12" x2="0" y2="-70" stroke={C.white} strokeWidth="11" strokeLinecap="round" /></g>
    <circle r="14" fill={col} stroke={C.white} strokeWidth="4" />
  </svg>
);

/* 1. why: the pink dial from the board */
const Why = ({ t, T }) => {
  const o = win(t, T.mid0, T.two);
  if (o <= 0) return null;
  const shrink = sm((t - T.large) / 0.8);
  const ang = -40 + Math.sin(t * 2.1) * 25;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <Dial x={CX} y={lerp(860, 620, shrink)} r={lerp(170, 120, shrink)} col={C.pink} ang={ang} k={1.4} />
      <Pill x={CX} y={900} text={'"large" ≠ marketing'} col={C.orange} s={pop(t, T.large)} size={52} />
      <GlowText x={CX} y={1010} text="it's why the guessing works" o={ap(t, T.its)} size={50} />
    </div>
  );
};

/* 2. two things: parameters + data */
const Two = ({ t, T }) => {
  const o = win(t, T.two, T.first);
  if (o <= 0) return null;
  const Card = ({ y, n, label, col, at, icon }) => (
    <div style={{ position: 'absolute', left: 120, top: y, opacity: ap(t, at), transform: `translateX(${(1 - ap(t, at)) * -60}px)` }}>
      <Glass col={col} strong shine={clamp((t - at) / 1.0)} style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '22px 40px 24px 26px', width: 620 }}>
        <div style={{ width: 120, height: 120, position: 'relative' }}>{icon}</div>
        <div><div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: 4, color: col }}>{n}</div><div style={{ fontFamily: F.bold, fontWeight: 800, fontSize: 60, color: C.white }}>{label}</div></div>
      </Glass>
    </div>
  );
  const lines = <svg width="120" height="120" viewBox="0 0 120 120">{[20, 44, 68, 92].map((y, i) => <rect key={y} x="10" y={y} width={i === 3 ? 60 : 100} height="12" rx="6" fill={C.orange} opacity={0.9 - i * 0.12} />)}</svg>;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <GlowText x={CX} y={420} text="what makes it large" size={54} color={C.dim} weight={700} o={ap(t, T.two)} />
      <Tilt t={t} rx={8} ry={-6}>
        <Card y={560} n="01" label="parameters" col={C.teal} at={T.what} icon={<div style={{ position: 'absolute', left: 60, top: 60 }}><Dial x={0} y={0} r={46} col={C.teal} ang={-30 + Math.sin(t * 2) * 20} k={0.6} /></div>} />
        <Card y={820} n="02" label="data" col={C.orange} at={T.why2} icon={lines} />
      </Tilt>
    </div>
  );
};

/* 3. parameters: one dial -> a wall of dials -> 124M vs 175B */
const Params = ({ t, T }) => {
  const o = win(t, T.first, T.second);
  if (o <= 0) return null;
  const wall = sm((t - T.tiny) / 1.4);
  const bars = ap(t, T.n124, 0.5);
  const wallFade = 1 - 0.75 * ap(t, T.gpt2, 0.6);
  const big = sm((t - T.n175) / 1.2);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <Tilt t={t} rx={18} ry={-10}>
        <div style={{ position: 'absolute', inset: 0, opacity: wallFade }}>
          {Array.from({ length: 48 }, (_, i) => {
            const c = i % 6, r = Math.floor(i / 6); const x = 150 + c * 118, y = 420 + r * 100;
            const d = Math.hypot(c - 2.5, r - 3.5) / 5; const s = clamp((wall - d * 0.6) / 0.4);
            if (i === 21) return <Dial key={i} x={x} y={y} r={lerp(120, 40, wall)} col={C.pink} ang={-40 + Math.sin(t * 2 + i) * 30} k={1} />;
            return s > 0 ? <Dial key={i} x={x} y={y} r={40 * s} col={C.teal} ang={hash(i) * 260 - 130 + Math.sin(t * 1.5 + i) * 8} k={0.4} /> : null;
          })}
        </div>
      </Tilt>
      <GlowText x={CX} y={1170} text="parameter = one dial" o={ap(t, T.tiny) * (1 - ap(t, T.gpt2, 0.4))} size={52} color={C.teal} g={0.4} />
      {bars > 0 && (
        <div style={{ position: 'absolute', inset: 0, opacity: bars }}>
          <Bar3D x={250} base={1150} w={140} h={22} col={C.teal} />
          <GlowText x={285} y={1170} w={300} text="GPT-2" size={40} color={C.teal} />
          <GlowText x={285} y={1050} w={300} text="124M" size={64} color={C.white} o={ap(t, T.n124)} />
          {big > 0 && <Bar3D x={620} base={1150} w={160} h={big * 700} col={C.orange} />}
          {big > 0 && <GlowText x={655} y={1170} w={320} text="GPT-3" size={40} color={C.orange} />}
          {big > 0 && <GlowText x={655} y={1150 - big * 700 - 120} w={360} text="175B" size={84} color={C.yellow} g={0.6} o={ap(t, T.n175 + 0.3)} />}
          {big > 0.8 && <Pill x={300} y={560} text="≈1,400× more" col={C.yellow} s={pop(t, T.n175 + 1.2)} size={44} solid={false} />}
        </div>
      )}
    </div>
  );
};

/* 4. data: text flows in, random dials settle, 300B tokens */
const WORDS = ['the', 'cat', 'sat', 'on', 'a', 'book', 'web', 'story', 'news', 'code', 'letter', 'wiki', 'poem', 'mat'];
const Data = ({ t, T }) => {
  const o = win(t, T.second, T.aEnd + 0.3);
  if (o <= 0) return null;
  const settle = sm((t - T.they) / 3.2);
  const flow = clamp((t - T.data) / 0.8);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      {flow > 0 && Array.from({ length: 18 }, (_, i) => {
        const sp = 260 + hash(i) * 140; const ph = (t * sp / 900 + hash(i * 7)) % 1; const x = -120 + ph * 760; const y = 470 + hash(i * 3) * 260 + Math.sin(t * 2 + i) * 12;
        const fade = clamp(ph / 0.15) * (1 - clamp((ph - 0.75) / 0.25));
        return <div key={i} style={{ position: 'absolute', left: x, top: y, opacity: fade * flow, padding: '6px 14px 8px', borderRadius: 12, background: hexA(C.green, 0.18), border: `1.5px solid ${hexA(C.green, 0.7)}`, fontFamily: F.bold, fontWeight: 700, fontSize: 30, color: C.green, boxShadow: glow(C.green, 0.25) }}>{WORDS[i % WORDS.length]}</div>;
      })}
      <Tilt t={t} rx={14} ry={-14}>
        {Array.from({ length: 12 }, (_, i) => {
          const c = i % 3, r = Math.floor(i / 3); const x = 620 + c * 110, y = 470 + r * 105;
          const rnd = hash(i * 4.3) * 300 - 150 + Math.sin(t * 6 + i) * 30 * (1 - settle); const tgt = -60 + hash(i * 1.7) * 120;
          return <Dial key={i} x={x} y={y} r={40} col={settle > 0.9 ? C.teal : C.grey} ang={lerp(rnd, tgt, settle)} k={settle * 0.7} />;
        })}
      </Tilt>
      <GlowText x={CX} y={360} text="dials start random" o={ap(t, T.start) * (1 - ap(t, T.they, 0.4))} size={46} color={C.dim} weight={700} />
      <Pill x={CX} y={980} text="guess the next word" col={C.green} s={pop(t, T.guess)} size={42} solid={false} />
      <GlowText x={CX} y={1080} text="300B tokens" o={ap(t, T.n300)} size={96} color={C.yellow} g={0.7} />
      <GlowText x={CX} y={1190} text="GPT-3's reading list" o={ap(t, T.n300 + 0.5)} size={40} color={C.dim} weight={700} />
    </div>
  );
};

/* 5. jars: one book vs a library */
const Jar = ({ x, y, w, h, col, fill, label, lit, children }) => (
  <div style={{ position: 'absolute', left: x - w / 2, top: y - h, width: w, height: h }}>
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${fill * 100}%`, borderRadius: '0 0 40px 40px', background: `linear-gradient(180deg, ${hexA(col, 0.65)}, ${hexA(col, 0.25)})`, boxShadow: `0 0 ${40 * lit}px ${hexA(col, 0.7)}` }} />
    <div style={{ position: 'absolute', inset: 0, borderRadius: '24px 24px 44px 44px', border: `4px solid ${hexA('#ffffff', 0.55)}`, background: 'linear-gradient(100deg, rgba(255,255,255,0.18), rgba(255,255,255,0.02) 40%, rgba(255,255,255,0.1))', boxShadow: `inset 0 0 30px rgba(255,255,255,0.08), 0 0 ${30 * lit}px ${hexA(col, 0.5 * lit)}` }} />
    {children}
    <div style={{ position: 'absolute', left: -60, right: -60, top: h + 18, textAlign: 'center', fontFamily: F.bold, fontWeight: 800, fontSize: 44, color: lit > 0.5 ? col : C.white, textShadow: lit > 0.5 ? glow(col, 0.5) : 'none' }}>{label}</div>
  </div>
);
const Jars = ({ t, T }) => {
  const o = win(t, T.g0, T.but);
  if (o <= 0) return null;
  const a = pop(t, T.g0 + 0.5), b = pop(t, T.library);
  const chips = [['styles', T.styles, C.pink], ['facts', T.facts, C.teal], ['ideas connect', T.ideas, C.orange]];
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <Tilt t={t} rx={6} ry={-4}>
        <div style={{ position: 'absolute', left: 0, top: 0, transform: `scale(${a})`, transformOrigin: '220px 1050px' }}><Jar x={220} y={1060} w={170} h={220} col={C.grey} fill={0.3} label="1 book" lit={ap(t, T.oneBook)} /></div>
        <div style={{ position: 'absolute', left: 0, top: 0, transform: `scale(${b})`, transformOrigin: '590px 1060px' }}>
          <Jar x={590} y={1060} w={340} h={520} col={C.orange} fill={0.25 + 0.6 * sm((t - T.aLib) / 3)} label="a library" lit={ap(t, T.aLib)} />
        </div>
      </Tilt>
      {chips.map(([txt, at, col], i) => {
        const k = sm((t - at) / 0.9); if (t < at) return null;
        return <Pill key={i} x={lerp(170 + i * 240, 590, k * 0.9)} y={lerp(420, 700 + i * 70, k)} text={txt} col={col} s={lerp(1, 0.75, k)} size={40} />;
      })}
      <GlowText x={CX} y={340} text="more dials hold more" o={ap(t, T.more)} size={52} color={C.teal} g={0.4} />
    </div>
  );
};

/* 6. cost */
const Cost = ({ t, T }) => {
  const o = win(t, T.but, T.soWork);
  if (o <= 0) return null;
  const coins = clamp((t - T.every) / 0.3);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <div style={{ position: 'absolute', left: CX, top: 640, transform: `translate(-50%,-50%) scale(${pop(t, T.train)}) rotate(-6deg)` }}>
        <Glass col={C.yellow} strong shine={clamp((t - T.n46) / 1)} style={{ padding: '30px 54px 34px', textAlign: 'center' }}>
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: 4, color: C.yellow }}>GPT-3 TRAINING (EST.)</div>
          <div style={{ fontFamily: F.bold, fontWeight: 800, fontSize: 130, color: C.white, textShadow: glow(C.yellow, ap(t, T.n46) * 0.7) }}>{t < T.n46 ? '$ ?' : '$4.6M'}</div>
        </Glass>
      </div>
      {coins > 0 && (
        <div style={{ position: 'absolute', inset: 0, opacity: coins }}>
          <GlowText x={CX} y={900} text="every answer costs" size={48} color={C.dim} weight={700} />
          {Array.from({ length: 7 }, (_, i) => { const at = T.every + 0.5 + i * 0.35; const p = pop(t, at, 0.3); return <div key={i} style={{ position: 'absolute', left: 230 + i * 70, top: 1010, width: 60, height: 60, borderRadius: 30, transform: `scale(${p}) translateY(${(1 - p) * -40}px)`, background: `radial-gradient(circle at 35% 30%, #fff5c2, ${C.yellow} 45%, #b88a00)`, boxShadow: glow(C.yellow, 0.5), border: '3px solid #fff3b0' }} />; })}
        </div>
      )}
    </div>
  );
};

/* 7. balance scale: huge general vs small, your data */
const Scale = ({ t, T }) => {
  const o = win(t, T.soWork, T.inAgent);
  if (o <= 0) return null;
  const tip = sm((t - T.beat) / 1.0) * 14;
  const Pan = ({ x, y, label, sub, col, at }) => (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,0) scale(${pop(t, at)})` }}>
      <Glass col={col} strong={col === C.teal && tip > 6} style={{ padding: '16px 26px 18px', textAlign: 'center', width: 300 }}>
        <div style={{ fontFamily: F.bold, fontWeight: 800, fontSize: 46, color: C.white }}>{label}</div>
        <div style={{ fontFamily: F.bold, fontWeight: 700, fontSize: 30, color: col }}>{sub}</div>
      </Glass>
    </div>
  );
  const L = [CX - 230, 760 - tip * 6], R = [CX + 230, 760 + tip * 6];
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width="1080" height="1920">
        <rect x={CX - 12} y={640} width="24" height="520" rx="10" fill={hexA(C.white, 0.75)} />
        <rect x={CX - 120} y={1150} width="240" height="22" rx="10" fill={hexA(C.white, 0.6)} />
        <g transform={`rotate(${tip} ${CX} 640)`}><rect x={CX - 260} y={632} width="520" height="16" rx="8" fill={C.white} style={{ filter: `drop-shadow(0 0 8px ${hexA(C.teal, 0.6)})` }} /></g>
        <line x1={CX - 230} y1={640 - tip * 4} x2={L[0]} y2={L[1]} stroke={hexA(C.white, 0.6)} strokeWidth="4" />
        <line x1={CX + 230} y1={640 + tip * 4} x2={R[0]} y2={R[1]} stroke={hexA(C.white, 0.6)} strokeWidth="4" />
      </svg>
      <Pan x={L[0]} y={L[1]} label="huge model" sub="general, costly" col={C.orange} at={T.soWork + 0.3} />
      <Pan x={R[0]} y={R[1]} label="small model" sub="your own data" col={C.teal} at={T.smaller} />
      <Pill x={R[0]} y={R[1] + 190} text="one narrow job" col={C.teal} s={pop(t, T.narrow)} size={38} solid={false} />
      <Pill x={CX} y={440} text="beats the giant" col={C.teal} s={pop(t, T.beat + 0.2)} size={48} />
      <Pill x={R[0]} y={R[1] + 280} text="🔒 private" col={C.white} s={pop(t, T.keeps)} size={38} solid={false} />
    </div>
  );
};

/* 8. agents: size is a budget (end frame) */
export const Agents = ({ t, T }) => {
  const o = win(t, T.inAgent, 1e9, 0.45, 0.01);
  if (o <= 0) return null;
  const steps = [['plan', C.orange], ['act', C.pink], ['check', C.teal]];
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <GlowText x={CX} y={380} text="size is a budget" o={ap(t, T.budget)} size={58} color={C.yellow} g={0.5} />
      {steps.map(([s, col], i) => {
        const at = T.inAgent + 0.4 + i * 0.35; const x = 190 + i * 260; const y = 640;
        const meter = clamp((t - T.everyStep - i * 0.45) / 0.6);
        return (
          <div key={i} style={{ position: 'absolute', left: 0, top: 0 }}>
            {i < 2 && <div style={{ position: 'absolute', left: x + 90, top: y - 4, width: 80 * ap(t, at + 0.3), height: 8, borderRadius: 4, background: hexA(C.white, 0.5) }} />}
            <Pill x={x} y={y} text={s} col={col} s={pop(t, at)} size={46} />
            <div style={{ position: 'absolute', left: x - 55, top: y + 70, width: 110, height: 110, opacity: ap(t, at) }}>
              <Dial x={55} y={55} r={44} col={meter > 0.5 ? C.yellow : C.grey} ang={lerp(-120, -120 + 80 + i * 30, meter)} k={meter * 0.7} />
            </div>
            <GlowText x={x} y={y + 200} w={240} text="compute" size={30} color={C.dim} weight={700} o={ap(t, T.everyStep + i * 0.45)} />
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: CX, top: 1050, transform: `translate(-50%,-50%) scale(${pop(t, T.smallest, 0.5)})` }}>
        <Glass col={C.teal} strong shine={clamp((t - T.smallest) / 1.2)} style={{ padding: '22px 44px 26px', display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ width: 90, height: 90, position: 'relative' }}><Dial x={45} y={45} r={36} col={C.teal} ang={-20} k={0.8} /></div>
          <div style={{ fontFamily: F.bold, fontWeight: 800, fontSize: 54, color: C.white, whiteSpace: 'nowrap' }}>smallest model that works</div>
        </Glass>
      </div>
    </div>
  );
};

export const T = (() => {
  const M = CFG.mid;
  return {
    mid0: M.t0, two: cue('MA', 'so') - 0.15, large: cue('MA', 'large'), its: cue('MA', 'its'), what: cue('MA', 'what'), why2: cue('MA', 'why', 1),
    first: cue('MA', 'large', 1) - 0.1, tiny: cue('MA', 'tiny'), gpt2: cue('MA', 'gpt2'), n124: cue('MA', '124'), n175: cue('MA', '175'),
    second: cue('MA', 'second') - 0.1, data: cue('MA', 'data'), start: cue('MA', 'start'), they: cue('MA', 'they'), guess: cue('MA', 'guessing', 1), n300: cue('MA', '300'), aEnd: CFG.lines.MA.t1,
    g0: M.g0, library: cue('G2', 'library'), oneBook: cue('MB', 'one'), aLib: cue('MB', 'library'), styles: cue('MB', 'styles'), facts: cue('MB', 'facts'), ideas: cue('MB', 'ideas'), more: cue('MB', 'more'),
    but: cue('MB', 'but') - 0.1, train: cue('MB', 'training'), n46: cue('MB', '46'), every: cue('MB', 'every'),
    soWork: cue('MB', 'so') - 0.1, smaller: cue('MB', 'smaller'), narrow: cue('MB', 'narrow'), beat: cue('MB', 'beat'), keeps: cue('MB', 'keeps'),
    inAgent: cue('MB', 'in') - 0.1, budget: cue('MB', 'budget'), everyStep: cue('MB', 'every', 1), smallest: cue('MB', 'smallest'),
  };
})();
export const END_T = T.smallest + 2.5;
const SECTIONS = [['two', 'WHY IT MATTERS'], ['first', 'PARAMETERS'], ['second', 'DATA'], ['g0', 'AN ANALOGY'], ['but', 'THE COST'], ['soWork', 'AT WORK'], ['inAgent', 'AGENTS']];

export const Middle2 = ({ t, still = false }) => {
  let sec = null; for (const [k, s] of SECTIONS) if (t >= T[k]) sec = [T[k], s];
  if (t < T.two) sec = [T.mid0, 'WHY IT MATTERS'];
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Stage t={t} />
      {sec && !still && <SectionChip text={sec[1]} o={clamp((t - sec[0]) / 0.4)} col={sec[1] === 'PARAMETERS' ? C.orange : C.teal} />}
      {!still && <><Why t={t} T={T} /><Two t={t} T={T} /><Params t={t} T={T} /><Data t={t} T={T} /><Jars t={t} T={T} /><Cost t={t} T={T} /><Scale t={t} T={T} /></>}
      <Agents t={t} T={T} />
    </div>
  );
};
