// PER EPISODE: the diagram middle. Cue every element to a spoken word with cue(line, word). The last scene is the
// save-worthy end frame (END_T); it is pinned to the board after the pull-back. Example: Episode 3.
import React from 'react';
import { C, F, clamp, sm, ap, lerp, pop } from '../../llm1/theme.js';
import { Glass, Tilt, Stage, glow, hexA } from '../../llm1/fx.jsx';
import CFG from '../cfg.json';

const L = CFG.lines; const W = CFG.words;
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
export const cue = (line, word, k = 0) => { const h = W.filter((x) => x.line === line && norm(x.raw) === word); return h[k] ? h[k].t0 : (L[line] ? L[line].t0 : 0); };
const CX = 540;
const win = (t, a, b, fi = 0.35, fo = 0.35) => clamp((t - a) / fi) * (1 - clamp((t - (b - fo)) / fo));

const Txt = ({ x, y, text, o = 1, size = 52, color = C.white, w = 900, g = 0, weight = 800, font = F.bold, ls = 0 }) => (
  <div style={{ position: 'absolute', left: x - w / 2, top: y, width: w, textAlign: 'center', fontFamily: font, fontWeight: weight, fontSize: size, letterSpacing: ls, color, opacity: o, lineHeight: 1.1, textShadow: g ? glow(color, g) : '0 4px 18px rgba(0,0,0,0.5)' }}>{text}</div>
);
const Tag = ({ x, y, text, col = C.orange, s = 1, o = 1, size = 40, solid = false }) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${s})`, opacity: o, padding: '8px 22px 11px', borderRadius: 16, whiteSpace: 'nowrap', fontFamily: F.mono, fontWeight: 700, fontSize: size, letterSpacing: 2,
    background: solid ? col : hexA(col, 0.12), color: solid ? '#1a120a' : col, border: `2px solid ${hexA(col, 0.85)}`, boxShadow: `0 0 22px ${hexA(col, 0.45)}` }}>{text}</div>
);

/* an email card */
const Email = ({ x, y, word, hl = 0, o = 1, s = 1, shake = 0 }) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${s}) translateX(${shake}px)`, opacity: o }}>
    <Glass col={C.sage} strong style={{ width: 640, padding: '26px 34px 30px' }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18 }}>
        <svg width="54" height="40" viewBox="0 0 54 40"><rect x="2" y="2" width="50" height="36" rx="6" fill="none" stroke={C.white} strokeWidth="4" /><path d="M4 6 L27 24 L50 6" fill="none" stroke={C.white} strokeWidth="4" /></svg>
        <div style={{ height: 14, width: 260, borderRadius: 7, background: hexA(C.white, 0.35) }} />
      </div>
      <div style={{ fontFamily: F.bold, fontWeight: 800, fontSize: 66, color: C.white }}>
        <span style={{ padding: '0 10px', borderRadius: 10, background: hexA(C.orange, 0.55 * hl), boxShadow: hl > 0.05 ? `0 0 30px ${hexA(C.orange, 0.6 * hl)}` : 'none' }}>{word}</span>
      </div>
      <div style={{ marginTop: 18, height: 12, width: 520, borderRadius: 6, background: hexA(C.white, 0.2) }} />
      <div style={{ marginTop: 12, height: 12, width: 420, borderRadius: 6, background: hexA(C.white, 0.2) }} />
    </Glass>
  </div>
);
const Stamp = ({ x, y, t, at, miss = false, o = 1 }) => {
  if (t < at) return null; const k = clamp((t - at) / 0.22); const sc = lerp(2.2, 1, sm(k));
  const fall = miss ? sm((t - at - 0.35) / 0.6) : 0;
  return <div style={{ position: 'absolute', left: x, top: y + fall * 260, transform: `translate(-50%,-50%) rotate(${-12 + fall * 30}deg) scale(${sc})`, opacity: o * k * (1 - fall * 0.8), padding: '6px 26px 10px', border: `7px solid ${miss ? C.grey : C.orange}`, borderRadius: 14, fontFamily: F.mono, fontWeight: 700, fontSize: 70, letterSpacing: 6, color: miss ? C.grey : C.orange, textShadow: miss ? 'none' : glow(C.orange, 0.5) }}>SPAM</div>;
};
/* a rule card in the growing book */
const RuleCard = ({ x, y, r = 0, o = 1, col = C.white }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: 300, height: 380, transform: `translate(-50%,-50%) rotate(${r}deg)`, opacity: o, borderRadius: 14, background: 'linear-gradient(160deg, #f7f1e1, #d9cfb4)', boxShadow: '0 8px 20px rgba(0,0,0,0.45)', padding: '30px 26px' }}>
    {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} style={{ height: 12, width: i % 2 ? '70%' : '90%', borderRadius: 6, background: hexA('#5b4a33', 0.45), marginBottom: 22 }} />)}
  </div>
);

/* 5-7: the rule chase */
const Chase = ({ t, T }) => {
  const o = win(t, T.b5, T.b8); if (o <= 0) return null;
  const word = t < T.fr33 ? 'free money' : t < T.another ? 'fr33 money' : ['fr€€ money', 'f.r.e.e money', 'fr3e m0ney', 'FREE m-o-n-e-y'][Math.floor(clamp((t - T.another) / (T.b8 - T.another)) * 3.99)];
  const hl = ap(t, T.free) * (t < T.fr33 + 0.1 ? 1 : 0.6);
  const shake = t > T.fr33 && t < T.fr33 + 0.4 ? Math.sin(t * 80) * 10 : 0;
  const nCards = t < T.rule2 ? 1 : t < T.another ? 2 : 2 + Math.floor(clamp((t - T.another) / 2.2) * 18);
  const pile = clamp((t - T.another) / 2.5);
  const count = t < T.another ? null : t < T.another + 1.3 ? '47' : '1,000+';
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <Email x={CX} y={lerp(560, 470, sm((t - T.another) / 0.8))} word={word} hl={hl} s={lerp(1, 0.86, sm((t - T.another) / 0.8))} shake={shake} />
      <Stamp x={CX + 160} y={600} t={t} at={T.spam} miss={false} o={t < T.fr33 ? 1 : 1 - clamp((t - T.fr33) / 0.2)} />
      <Stamp x={CX + 160} y={600} t={t} at={T.fr33 + 0.15} miss />
      {Array.from({ length: Math.min(nCards, 20) }, (_, i) => <RuleCard key={i} x={CX - 20 + (i % 5) * 10 - 20 + (i > 1 ? Math.sin(i * 2.3) * 60 * pile : 0)} y={900 - i * (i > 1 ? 8 : 0)} r={(i % 2 ? 4 : -5) + (i > 1 ? Math.sin(i) * 10 * pile : 0)} o={ap(t, i === 0 ? T.b5 + 0.6 : i === 1 ? T.rule2 : T.another + i * 0.11, 0.2)} />)}
      <Tag x={CX - 360} y={700} text={t < T.rule2 ? 'rule 1' : 'rule 2'} col={C.white} s={pop(t, t < T.rule2 ? T.b5 + 0.6 : T.rule2)} o={1 - ap(t, T.another, 0.3)} size={38} />
      {count && <div style={{ position: 'absolute', left: CX + 230, top: 860, transform: `translate(-50%,-50%) scale(${pop(t, count === '47' ? T.another : T.another + 1.3)})`, fontFamily: F.bold, fontWeight: 800, fontSize: count === '47' ? 110 : 120, color: C.yellow, textShadow: glow(C.yellow, 0.6) }}>{count}</div>}
    </div>
  );
};

/* 8: one job, one machine */
const Machine = ({ x, y, label, lit, o }) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)', opacity: o, filter: lit ? 'none' : 'grayscale(1) brightness(0.55)' }}>
    <div style={{ width: 240, height: 200, borderRadius: 26, background: lit ? 'linear-gradient(160deg, #3b5148, #1b2823)' : '#2a332f', border: `3px solid ${lit ? C.orange : C.grey}`, boxShadow: lit ? `0 0 34px ${hexA(C.orange, 0.5)}` : 'none', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 30, top: 34, width: 56, height: 56, borderRadius: '50%', border: `6px solid ${lit ? C.orange : C.grey}` }} />
      <div style={{ position: 'absolute', left: 110, top: 44, width: 100, height: 12, borderRadius: 6, background: hexA(C.white, 0.4) }} />
      <div style={{ position: 'absolute', left: 110, top: 72, width: 70, height: 12, borderRadius: 6, background: hexA(C.white, 0.3) }} />
      <div style={{ position: 'absolute', left: 30, bottom: 26, width: 180, height: 26, borderRadius: 8, background: hexA('#000', 0.35) }} />
    </div>
    <div style={{ marginTop: 16, textAlign: 'center', fontFamily: F.mono, fontWeight: 700, fontSize: 40, color: lit ? C.orange : C.grey }}>{label}</div>
  </div>
);
const Shelf = ({ t, T }) => {
  const o = win(t, T.b8, T.b9); if (o <= 0) return null;
  const nots = [T.notT, T.notS];
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <Tilt t={t} rx={6} ry={-5}>
        <div style={{ position: 'absolute', left: 120, top: 770, width: 840, height: 22, borderRadius: 8, background: 'linear-gradient(180deg,#8b5e3c,#5a3b24)', boxShadow: '0 12px 24px rgba(0,0,0,0.5)' }} />
        <Machine x={250} y={630} label="spam" lit o={ap(t, T.b8)} />
        <Machine x={540} y={630} label="translate" lit={false} o={ap(t, nots[0] - 0.2)} />
        <Machine x={830} y={630} label="summarise" lit={false} o={ap(t, nots[1] - 0.2)} />
      </Tilt>
      <Txt x={CX} y={900} text="one job, one machine" size={58} color={C.white} o={ap(t, T.b8 + 0.4)} />
    </div>
  );
};

/* 9: the reversal */
const Reversal = ({ t, T }) => {
  const o = win(t, T.b9, T.b10); if (o <= 0) return null;
  const big = ap(t, T.write, 0.5);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      {Array.from({ length: 16 }, (_, i) => <RuleCard key={i} x={CX - 30 + Math.sin(i * 2.3) * 70} y={760 - i * 7} r={(i % 2 ? 4 : -5) + Math.sin(i) * 10} o={0.55} />)}
      <div style={{ position: 'absolute', inset: 0, background: hexA(C.ground2, 0.55 * big) }} />
      <Txt x={CX} y={460} text={<>SOMEONE HAD TO<br /><span style={{ color: C.orange }}>WRITE THEM.</span></>} size={92} o={big} g={0} w={1000} />
    </div>
  );
};

/* 10: proof, old bot vs LLM */
const Bubble = ({ x, y, text, col, o, grey }) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)', opacity: o, maxWidth: 420, padding: '14px 22px 16px', borderRadius: 22, background: grey ? '#3a423e' : hexA(col, 0.2), border: `2px solid ${grey ? C.grey : col}`, fontFamily: F.bold, fontWeight: 700, fontSize: 34, color: grey ? C.grey : C.white, whiteSpace: 'nowrap' }}>{text}</div>
);
const Check = ({ x, y, o, s }) => (
  <svg style={{ position: 'absolute', left: x - 34, top: y - 34, opacity: o, transform: `scale(${s})`, filter: `drop-shadow(0 0 12px ${hexA(C.orange, 0.8)})` }} width="68" height="68" viewBox="0 0 68 68"><circle cx="34" cy="34" r="30" fill={C.orange} /><path d="M18 35 L29 46 L50 22" fill="none" stroke="#1a120a" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const Proof = ({ t, T }) => {
  const o = win(t, T.b10, T.b11); if (o <= 0) return null;
  const Q = ['I lost my card', 'my card is gone', 'someone took my card'];
  const at = (i) => T.three + 0.3 + i * 0.75;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <div style={{ position: 'absolute', left: 540, top: 300, width: 3, height: 760, background: hexA(C.white, 0.2) }} />
      <svg style={{ position: 'absolute', left: 230, top: 290 }} width="80" height="80" viewBox="0 0 80 80"><rect x="10" y="18" width="60" height="46" rx="12" fill="none" stroke={C.grey} strokeWidth="5" /><circle cx="30" cy="40" r="6" fill={C.grey} /><circle cx="50" cy="40" r="6" fill={C.grey} /></svg>
      <div style={{ position: 'absolute', left: 770, top: 290, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle at 40% 35%, #ffd2a8, ${C.orange})`, boxShadow: glow(C.orange, 0.9) }} />
      {Q.map((q, i) => (<React.Fragment key={i}>
        <Bubble x={270} y={470 + i * 200} text={q} col={C.white} o={ap(t, T.b10 + 0.8 + i * 0.5)} />
        <Bubble x={270} y={545 + i * 200} text="I don't understand" grey o={ap(t, at(i) + 0.2)} />
        <Bubble x={810} y={470 + i * 200} text={q} col={C.white} o={ap(t, T.b10 + 0.8 + i * 0.5)} />
        <Check x={810} y={548 + i * 200} o={ap(t, at(i) + 0.2, 0.2)} s={pop(t, at(i) + 0.2)} />
      </React.Fragment>))}
    </div>
  );
};

/* 11-12: one model, many tasks + agent loop */
const Orb = ({ x, y, r, t, k = 1 }) => (
  <div style={{ position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', background: `radial-gradient(circle at 38% 32%, #fff1df, ${C.orange} 45%, #7a2f06)`, boxShadow: `0 0 ${60 * k}px ${hexA(C.orange, 0.7)}, 0 0 ${140 * k}px ${hexA(C.orange, 0.35)}`, transform: `scale(${1 + Math.sin(t * 2.4) * 0.03})` }} />
);
const OneModel = ({ t, T }) => {
  const o = win(t, T.b11, T.b12); if (o <= 0) return null;
  const dissolve = sm((t - T.b11) / 1.2);
  const tasks = [['spam', T.spam2], ['reply', T.replies], ['summary', T.summaries], ['translate', T.translation]];
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      {Array.from({ length: 12 }, (_, i) => <RuleCard key={i} x={CX + Math.sin(i * 2.3) * (60 + dissolve * 500)} y={640 - i * 7 + dissolve * Math.cos(i) * 300} r={Math.sin(i) * 10 + dissolve * 90 * (i % 2 ? 1 : -1)} o={0.55 * (1 - dissolve)} />)}
      <div style={{ opacity: ap(t, T.patterns - 0.4, 0.6) }}><Orb x={CX} y={600} r={130} t={t} /></div>
      {tasks.map(([s, at], i) => { const a = (-150 + i * 100) * Math.PI / 180; const x = CX + Math.cos(a) * 330, y = 600 + Math.sin(a) * 260 + 120; return <Tag key={s} x={x} y={y} text={s} col={C.orange} solid={t > at} s={pop(t, at)} o={ap(t, at)} size={36} />; })}
      <Txt x={CX} y={960} text="one model, many tasks" size={58} o={ap(t, T.spam2 + 0.3)} />
    </div>
  );
};
const Agent = ({ t, T, still }) => {
  const o = still ? 1 : win(t, T.b12, T.mEnd + 3, 0.35, 0.01); if (o <= 0) return null;
  const steps = [['read ticket', T.reads], ['decide', T.decides], ['write reply', T.writes], ['call tool', T.calls]];
  const R = 250, cy = 640; const run = still ? 0 : t;
  const pos = (i) => { const a = (-90 + i * 90) * Math.PI / 180; return [CX + Math.cos(a) * R, cy + Math.sin(a) * R]; };
  const dot = ((run - T.reads) * 0.5) % 1; const da = (-90 + dot * 360) * Math.PI / 180;
  const book = clamp((t - T.reads) / (T.calls + 0.8 - T.reads)); const collapse = still ? 1 : sm((t - T.calls - 0.6) / 0.7);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <svg style={{ position: 'absolute', left: 0, top: 0 }} width="1080" height="1300"><circle cx={CX} cy={cy} r={R} fill="none" stroke={hexA(C.orange, 0.55)} strokeWidth="6" strokeDasharray="14 16" strokeDashoffset={-run * 40} /></svg>
      <Orb x={CX} y={cy} r={70} t={t} k={0.6} />
      {t > T.reads && <div style={{ position: 'absolute', left: CX + Math.cos(da) * R - 14, top: cy + Math.sin(da) * R - 14, width: 28, height: 28, borderRadius: '50%', background: C.yellow, boxShadow: glow(C.yellow, 0.8) }} />}
      {steps.map(([s, at], i) => { const [x, y] = pos(i); return <Tag key={s} x={x} y={y} text={s} col={C.orange} solid={still || t > at} s={still ? 1 : pop(t, at)} o={still ? 1 : ap(t, at)} size={34} />; })}
      {!still && Array.from({ length: Math.ceil(book * 4) }, (_, i) => <div key={i} style={{ position: 'absolute', left: 860 + Math.sin(i * 3) * 8 * collapse, top: 980 - i * 34 + collapse * (i * 34 + 40), width: 150, height: 30, borderRadius: 5, background: 'linear-gradient(90deg,#f7f1e1,#d9cfb4)', transform: `rotate(${collapse * (i % 2 ? 25 : -30)}deg)`, opacity: 0.85 * (1 - collapse * 0.6) }} />)}
      <Txt x={CX} y={980} text="one model, many tasks" size={58} o={still ? 1 : ap(t, T.calls + 0.6)} />
    </div>
  );
};
/* 13: echo of the episode 1 guessing bars, no numbers */
const Echo = ({ t, T }) => {
  const o = win(t, T.b13, T.mEnd + 3, 0.5, 0.01); if (o <= 0) return null;
  const k = ap(t, T.pattern2, 0.6);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <Orb x={CX} y={560} r={110} t={t} k={1.2} />
      {[0.85, 0.35, 0.08].map((h, i) => <div key={i} style={{ position: 'absolute', left: 380 + i * 120, top: 960 - 260 * h * k, width: 80, height: 260 * h * k, borderRadius: 10, background: i === 0 ? C.orange : C.grey, opacity: 0.45 * k }} />)}
    </div>
  );
};

export const T = (() => {
  const s = (k) => (L[k] ? L[k].t0 : 0);
  return {
    b5: s('P05') - 0.3, free: cue('P05', 'free'), spam: cue('P05', 'spam'),
    fr33: cue('P06a', 'fr33'), rule2: cue('P06b', 'rule'),
    another: s('P07a'), b8: s('P08') - 0.3, notT: cue('P08', 'translate'), notS: cue('P08', 'summarise'),
    b9: s('P09') - 0.3, write: cue('P09', 'write'), b10: s('E10a') - 0.3, three: cue('P10', 'three'),
    b11: s('P11a') - 0.3, patterns: cue('P11a', 'patterns'), spam2: cue('P11b', 'spam'), replies: cue('P11b', 'replies'), summaries: cue('P11b', 'summaries'), translation: cue('P11b', 'translation'),
    b12: s('P12a') - 0.3, reads: cue('P12b', 'reads'), decides: cue('P12b', 'decides'), writes: cue('P12b', 'writes'), calls: cue('P12b', 'calls'),
    b13: s('E13') - 0.2, pattern2: cue('P13', 'pattern'), mEnd: CFG.mid.end,
  };
})();
export const END_T = T.calls + 2.5;

export const Middle = ({ t, still = false }) => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
    <Stage t={t} />
    {!still && <><Chase t={t} T={T} /><Shelf t={t} T={T} /><Reversal t={t} T={T} /><Proof t={t} T={T} /><OneModel t={t} T={T} /></>}
    {(still || t < T.b13) && <Agent t={still ? END_T : t} T={T} still={still} />}
    {!still && <Echo t={t} T={T} />}
  </div>
);
