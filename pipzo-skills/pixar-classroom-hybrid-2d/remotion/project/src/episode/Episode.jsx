// LOCKED EPISODE TEMPLATE. Do not edit per episode.
// Everything an episode changes lives in content/ (Board, ColdOpen, Middle) and in cfg.json, built from episode.json.
// Approved reference: LLM-GPT2 Episode 3. This file owns, for every episode:
//   classroom plates and close-ups with the frozen lip sync, the push-in, BOTH bottom portraits in the middle,
//   the pull-back that pins the end frame onto the board, neon word captions, the closing Follow card over the
//   classroom with the blinking Pipzo robot, the header, banner, Remember card, character motions and the audio.
import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame, delayRender, continueRender, getInputProps } from 'remotion';
import { C, F, clamp, sm, ap, lerp, backE } from '../llm1/theme.js';
import { Face, blinkAt } from '../rig/Face';
import { natAt, mouthName } from '../rig/natMouth';
import { mat3d, mapPt, lerpQ, DW, DH, DRAWQ, DIAGQ, FULLQ } from './lib/geometry.js';
import { Middle, END_T } from './content/Middle.jsx';
import { BoardDrawing, DIAL, CROP } from './content/Board.jsx';
import { ColdOpen } from './content/ColdOpen.jsx';
import CFG from './cfg.json';
import VIS from './vis.json';
import NAT from './visnat.json';
import MWP from './mwpatch.json';
import PTP from './ptpatch.json';

const DBG = getInputProps() || {};
const FPS = 30;
// Character colours (series constants): Professor = teal-green neon, Emily = pink neon (approved Episodes 2-4).
export const COL = { P: '#2DD4BF', S: '#F472B6' };
const NAME = { P: 'PROFESSOR', S: 'EMILY' };

const useFonts = () => {
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const d = [[F.chalk, 'kalam-latin-700-normal.woff2', '700'], [F.ui, 'space-grotesk-latin-500-normal.woff2', '500'], [F.ui, 'space-grotesk-latin-700-normal.woff2', '700'], [F.mono, 'jetbrains-mono-latin-700-normal.woff2', '700'], [F.bold, 'inter-latin-500-normal.woff2', '500'], [F.bold, 'inter-latin-700-normal.woff2', '700'], [F.bold, 'inter-latin-800-normal.woff2', '800']];
    Promise.all(d.map(([n, f, w]) => new FontFace(n, `url(${staticFile('llm1/fonts/' + f)})`, { weight: w }).load())).then((fs) => { fs.forEach((f) => document.fonts.add(f)); continueRender(h); }).catch(() => continueRender(h));
  }, []);
};

/* ---- motions: small head moves from episode.json ("motion"), applied to close-ups and portraits ---- */
const MOTION = {
  nod: (u) => ({ dy: Math.sin(u * Math.PI * 2) * 14 * (1 - u), rot: 0, s: 1 }), // 0.7 s
  tilt: (u) => ({ dy: 0, rot: 4 * Math.sin(Math.min(1, u * 1.6) * Math.PI / 2) * (u > 0.75 ? 1 - (u - 0.75) / 0.25 : 1), s: 1 }), // 1.6 s
  lean: (u) => ({ dy: -12 * Math.sin(u * Math.PI), rot: 0, s: 1 + 0.04 * Math.sin(u * Math.PI) }), // 1.4 s
  bounce: (u) => ({ dy: -Math.abs(Math.sin(u * Math.PI * 3)) * 16 * (1 - u), rot: 0, s: 1 }), // 1.0 s
  shake: (u) => ({ dy: 0, rot: Math.sin(u * Math.PI * 4) * 3 * (1 - u), s: 1 }), // 0.9 s
  pop: (u) => ({ dy: -10 * (1 - u), rot: 0, s: 1 + 0.05 * Math.sin(Math.min(1, u * 3) * Math.PI / 2) * (1 - u) }), // 0.8 s
};
const MDUR = { nod: 0.7, tilt: 1.6, lean: 1.4, bounce: 1.0, shake: 0.9, pop: 0.8 };
const motionAt = (who, t) => {
  let dy = 0, rot = 0, s = 1;
  for (const m of CFG.motions || []) {
    if (m.who !== who || t < m.t || t > m.t + MDUR[m.type]) continue;
    const r = MOTION[m.type]((t - m.t) / MDUR[m.type]); dy += r.dy; rot += r.rot; s *= r.s;
  }
  return { dy, rot, s };
};

/* ---- board drawing and the pinned end frame ---- */
const BoardOnQuad = ({ quad }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: DW, height: DH, transformOrigin: '0 0', transform: mat3d(DW, DH, quad) }}><BoardDrawing /></div>
);
const DiagramOnQuad = ({ quad }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: CROP.w, height: CROP.h, transformOrigin: '0 0', transform: mat3d(CROP.w, CROP.h, quad), overflow: 'hidden', borderRadius: 18, boxShadow: '0 0 0 6px rgba(139,94,60,0.9)' }}>
    <div style={{ position: 'absolute', left: -CROP.x, top: -CROP.y, width: 1080, height: 1920 }}><Middle t={END_T} still /></div>
  </div>
);

/* ---- camera ---- */
const zoomAt = (s, t) => { const K = s.zk; const r = t - s.t0; if (r <= K[0][0]) return K[0][1]; for (let i = 0; i < K.length - 1; i++) { const [a, sa] = K[i], [b, sb] = K[i + 1]; if (r <= b) return lerp(sa, sb, sm((r - a) / Math.max(0.01, b - a))); } return K[K.length - 1][1]; };
const visAt = (who, t) => { const A = VIS.w[who]; const f = t * 30; const i = Math.max(0, Math.min(A.length - 2, Math.floor(f))); const u = f - i; return A[i].map((x, j) => x * (1 - u) + A[i + 1][j] * u); };

/* ---- HD classroom plate with mouth + blink patches (frozen lip sync: one real mouth per frame) ---- */
const PlateFace = ({ k, t }) => {
  const PP = k === 'mw' ? MWP : PTP; const pre = k === 'mw' ? 'mw' : 'pt';
  const Pic = ({ v, o }) => { const [x0, y0, x1, y1] = PP[v].box; return <Img src={staticFile(`llm2/${pre}_${v}_patch.png`)} style={{ position: 'absolute', left: x0 / 2, top: y0 / 2, width: (x1 - x0) / 2, height: (y1 - y0) / 2, opacity: o }} />; };
  const bl = blinkAt('P', t, VIS.s);
  return (<>
    {bl > 0.02 && <Pic v="BL" o={Math.min(1, bl * 1.25)} />}
    {(() => { const n = mouthName(natAt(NAT.w.P, t), true); return n ? <Pic v={n} o={1} /> : null; })()}
  </>);
};
const Plate = ({ s, t, board }) => {
  const k = s.kind; const z = zoomAt(s, t); const [px, py] = s.pivot; const sway = Math.sin(t * 0.37) * 3;
  return (
    <div style={{ position: 'absolute', inset: 0, transformOrigin: `${px}px ${py}px`, transform: `translate(${sway}px, 0) scale(${z})` }}>
      <Img src={staticFile(`llm2/${k === 'mw' ? 'talk' : 'point'}_hd.jpg`)} style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920 }} />
      <PlateFace k={k} t={t} />
      {board === 'drawing' && <BoardOnQuad quad={DRAWQ(k)} />}
      {board === 'diagram' && <DiagramOnQuad quad={DIAGQ(k, CROP)} />}
    </div>
  );
};

/* ---- close-ups: HD bust over the blurred classroom ---- */
const CloseUp = ({ s, t }) => {
  const z = zoomAt(s, t); const who = s.kind === 'cuP' ? 'P' : 'S';
  const bob = Math.sin(t * 1.3) * 0.6; const breathe = 1 + Math.sin(t * 1.9) * 0.004; const m = motionAt(who, t);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Img src={staticFile(`llm2/cu_bg${who}.jpg`)} style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${1.04 + (z - 1) * 0.5})` }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 75% 28%, rgba(255,190,110,0.22), transparent 60%)' }} />
      <div style={{ position: 'absolute', left: who === 'P' ? -170 : -150, top: 560 + m.dy * 2, width: 1400, height: 1400, transformOrigin: '50% 100%', transform: `scale(${z * breathe * m.s}) rotate(${(who === 'P' ? bob : -bob) + (who === 'P' ? m.rot : -m.rot)}deg)` }}>
        <Face who={who} t={t} size={1400} vis={VIS.w} sched={VIS.s} nat={NAT.w} mirror={who === 'S'} filter="sepia(0.16) saturate(1.1) brightness(1.03) contrast(1.03)" />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(${who === 'P' ? 100 : 260}deg, transparent 55%, rgba(255,170,80,0.16))`, mixBlendMode: 'soft-light' }} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 300, background: 'linear-gradient(transparent, rgba(0,0,0,0.3))' }} />
    </div>
  );
};

/* ---- BOTH portraits at the bottom of the middle (Episode 3 layout). Always both; the speaker is brighter. ---- */
const SPK = { P: { left: 10 }, S: { left: 480 } };
const SZ = 470;
const Bust = ({ who, t, o }) => {
  if (o <= 0.001) return null; const col = COL[who]; const w = visAt(who, t); const a = Math.min(1, w.reduce((x, y) => x + y, 0)); const m = motionAt(who, t);
  const bob = Math.sin(t * 7.3) * a * 1.6 + Math.sin(t * 1.3) * 0.8 + m.rot; const breathe = (1 + Math.sin(t * 1.9) * 0.006) * m.s;
  return (
    <div style={{ position: 'absolute', left: SPK[who].left, top: 1920 - SZ + 40 + (1 - o) * 120 + m.dy, width: SZ, height: SZ, opacity: o, transformOrigin: '50% 100%', transform: `rotate(${bob * (who === 'S' ? -1 : 1)}deg) scale(${breathe})` }}>
      <div style={{ position: 'absolute', left: SZ * 0.12, top: SZ * 0.18, width: SZ * 0.76, height: SZ * 0.76, borderRadius: '50%', background: `radial-gradient(circle, ${col}55, transparent 65%)`, filter: 'blur(10px)' }} />
      <div style={{ position: 'absolute', inset: 0, filter: `drop-shadow(0 0 14px ${col}88) drop-shadow(0 10px 20px rgba(0,0,0,0.5))` }}>
        <Face who={who} t={t} size={SZ} vis={VIS.w} sched={VIS.s} nat={NAT.w} mirror={who === 'S'} />
      </div>
      <div style={{ position: 'absolute', left: who === 'P' ? 270 : 30, top: 60, padding: '6px 14px 7px', borderRadius: 12, border: `1.5px solid ${col}`, background: 'rgba(8,16,13,0.6)', fontFamily: F.mono, fontWeight: 700, fontSize: 20, letterSpacing: 3, color: col, boxShadow: `0 0 16px ${col}66` }}>{NAME[who]}</div>
    </div>
  );
};
const whoAt = (t) => { let w = 'P'; for (const x of CFG.words) { if (x.t0 - 0.15 > t) break; w = x.who; } return w; };
const Speakers = ({ t, from, to }) => {
  if (t < from - 0.5 || t > to + 0.5) return null;
  const io = clamp((t - from) / 0.5) * (1 - clamp((t - (to - 0.4)) / 0.4));
  let sP = 0; for (let i = -6; i <= 6; i++) sP += whoAt(t + i * 0.05) === 'P' ? 1 : 0; sP /= 13;
  return (<><Bust who="P" t={t} o={io * (0.72 + 0.28 * sP)} /><Bust who="S" t={t} o={io * (0.72 + 0.28 * (1 - sP))} /></>);
};

/* ---- overlays ---- */
const Banner = ({ t, B }) => {
  if (!B || t > B.t1 + 0.5) return null;
  const o = ap(t, 0.0, 0.25) * (1 - ap(t, B.t1, 0.45)); const pp = 0.9 + 0.1 * backE(t / 0.5);
  return (
    <div style={{ position: 'absolute', left: 0, top: 1020, width: 1080, display: 'flex', justifyContent: 'center', opacity: o }}>
      <div style={{ transform: `scale(${pp})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 44px 30px', borderRadius: 34, background: 'rgba(15,8,2,0.74)', border: '2px solid rgba(255,176,102,0.55)', maxWidth: 940 }}>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: 5, color: '#ffb066' }}>EPISODE {CFG.meta.ep}</div>
        <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 76, color: '#fff', lineHeight: 1.05, textAlign: 'center' }}>{CFG.meta.title}</div>
        {B.sub && <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 30, color: 'rgba(255,240,215,0.85)' }}>{B.sub}</div>}
      </div>
    </div>
  );
};
const Remember = ({ t, RM }) => {
  if (!RM || t < RM.t0 - 0.1 || t > RM.t1 + 0.5) return null;
  const o = ap(t, RM.t0, 0.4) * (1 - ap(t, RM.t1, 0.35));
  return (
    <div style={{ position: 'absolute', left: 70, top: 975, width: 940, opacity: o, transform: `translateY(${(1 - o) * 20}px)` }}>
      <div style={{ padding: '26px 34px', borderRadius: 30, background: 'linear-gradient(160deg, rgba(255,255,255,0.18), rgba(20,14,8,0.22))', backdropFilter: 'blur(12px)', border: '2px solid rgba(255,255,255,0.45)', boxShadow: '0 18px 40px rgba(0,0,0,0.35), inset 0 1.5px 0 rgba(255,255,255,0.5)' }}>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: 4, color: '#ffb066', textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>REMEMBER</div>
        <div style={{ fontFamily: F.chalk, fontWeight: 700, fontSize: 46, color: '#fff', lineHeight: 1.22, marginTop: 6, textShadow: '0 2px 10px rgba(0,0,0,0.7)' }}>{RM.a}<br /><span style={{ color: '#ffcf8a' }}>{RM.b}</span></div>
      </div>
    </div>
  );
};
/* the Pipzo robot avatar, blinking every ~2.2 s */
const BlinkBot = ({ t }) => {
  const cyc = (t * 1.0) % 2.2; const b = cyc < 0.08 ? cyc / 0.08 : cyc < 0.12 ? 1 : cyc < 0.2 ? 1 - (cyc - 0.12) / 0.08 : 0;
  const k = 144 / 640;
  const Lid = ({ x, y, w, h }) => (
    <div style={{ position: 'absolute', left: (x - 4) * k, top: (y - 4) * k, width: (w + 8) * k, height: (h + 8) * k, overflow: 'hidden', borderRadius: 6 * k }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: `${b * 100}%`, background: 'linear-gradient(180deg, #f07a2a, #e2621a)', borderBottom: b > 0.05 ? `${Math.max(1.2, 5 * k)}px solid #2a1206` : 'none', boxSizing: 'border-box' }} />
    </div>
  );
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Img src={staticFile('llm1/pipzo-avatar.png')} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      <Lid x={232} y={278} w={49} h={66} /><Lid x={364} y={277} w={50} h={67} />
    </div>
  );
};
/* closing Follow card over the classroom (Episode 3): robot blinks, Follow pulses, optional tap to "Following ✓" */
const Follow = ({ t, FB, dur }) => {
  if (t < FB.t0 - 0.05) return null;
  const o = ap(t, FB.t0, 0.45); const pp = 0.85 + 0.15 * backE((t - FB.t0) / 0.5);
  const tapped = FB.tap != null && t > FB.tap; const press = FB.tap != null && t > FB.tap - 0.12 && t < FB.tap + 0.18 ? 0.92 : 1;
  const pulse = t > FB.pulse && !tapped ? 1 + 0.05 * Math.sin((t - FB.pulse) * 9) : 1; const ring = FB.tap != null ? clamp((t - FB.tap) / 0.6) : 0;
  return (
    <div style={{ position: 'absolute', left: 0, top: 640, width: 1080, display: 'flex', justifyContent: 'center', opacity: o * (1 - ap(t, dur - 0.4, 0.3)) }}>
      <div style={{ width: 760, padding: '34px 36px 38px', borderRadius: 40, background: 'rgba(255,255,255,0.95)', boxShadow: '0 24px 60px rgba(0,0,0,0.35)', transform: `scale(${pp})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 168, height: 168, borderRadius: '50%', padding: 7, background: 'conic-gradient(#feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5, #feda75)' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '5px solid #fff', overflow: 'hidden', boxSizing: 'border-box', position: 'relative' }}><BlinkBot t={t} /></div>
        </div>
        <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 44, color: '#111' }}>@pipzo.ai</div>
        <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 30, color: '#555', textAlign: 'center', lineHeight: 1.3 }}>Next · Episode {FB.n}<br /><span style={{ color: '#111', fontWeight: 700 }}>{FB.title}</span></div>
        <div style={{ position: 'relative', marginTop: 8 }}>
          {ring > 0 && ring < 1 && <div style={{ position: 'absolute', left: '50%', top: '50%', width: 420 * (0.6 + ring), height: 110 * (0.6 + ring), marginLeft: -210 * (0.6 + ring), marginTop: -55 * (0.6 + ring), borderRadius: 60, border: '4px solid rgba(0,149,246,0.5)', opacity: 1 - ring }} />}
          <div style={{ width: 420, height: 96, borderRadius: 20, background: tapped ? '#efefef' : '#0095f6', color: tapped ? '#111' : '#fff', fontFamily: F.ui, fontWeight: 700, fontSize: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${press * pulse})` }}>{tapped ? 'Following ✓' : 'Follow'}</div>
        </div>
      </div>
    </div>
  );
};
/* captions: the spoken word lights up in the speaker's neon colour; Emily's lines carry her tag */
const Captions = ({ t, W, top }) => {
  const n = W.findIndex((w) => w.t0 > t); const i0 = n === -1 ? W.length - 1 : n - 1;
  if (i0 < 0) return null; const cur = W[i0]; if (t > cur.t1 + 0.5) return null;
  let s = i0; while (s > 0 && i0 - s < 3 && W[s - 1].who === cur.who && cur.t0 - W[s - 1].t0 < 1.6 && !/[.?!]$/.test(W[s - 1].raw)) s--;
  let e = i0; while (e < W.length - 1 && e - s < 4 && W[e + 1].who === cur.who && W[e + 1].t0 - W[e].t1 < 0.6 && !/[.?!,:]$/.test(W[e].raw)) e++;
  const words = W.slice(s, e + 1); const col = COL[cur.who];
  return (
    <div style={{ position: 'absolute', left: 40, top, width: 1000, display: 'flex', justifyContent: 'center', zIndex: 5 }}>
      <div style={{ padding: '10px 26px 14px', borderRadius: 26, background: 'rgba(15,8,2,0.66)', fontFamily: F.ui, fontWeight: 700, fontSize: 54, whiteSpace: 'nowrap', display: 'flex', gap: 14, alignItems: 'center' }}>
        {cur.who === 'S' && <span style={{ fontFamily: F.mono, fontSize: 22, color: col, border: `2px solid ${col}`, borderRadius: 10, padding: '2px 10px', boxShadow: `0 0 10px ${col}66` }}>EMILY</span>}
        {words.map((w, i) => { const k = s + i; const now = k === i0 && t <= w.t1 + 0.12; return <span key={i} style={{ color: now ? col : k <= i0 ? '#fff' : 'rgba(255,255,255,0.4)', textShadow: now ? `0 0 14px ${col}, 0 0 4px ${col}` : 'none' }}>{w.raw}</span>; })}
      </div>
    </div>
  );
};

export const Episode = () => {
  useFonts();
  const f = useCurrentFrame(); const t = DBG.t != null ? DBG.t : f / FPS;
  const dur = CFG.total; const P = CFG.push, PB = CFG.pull, M = CFG.mid;
  const shots = CFG.shots.filter((s) => s.kind !== 'mid');
  const shot = shots.find((s) => t >= s.t0 && t < s.t1) || shots[shots.length - 1];
  const punch = (CFG.punch || []).find((p) => t >= p.t0 && t < p.t1);
  const preMid = t < M.t0 + 0.4; const inMid = t >= P.t1 - 0.4 && t < PB.t1;
  const board = (s) => (s.diagram ? 'diagram' : s.t0 < M.t0 ? 'drawing' : null);
  // push-in into the pink handoff object on the board
  let pushStyle = null;
  if (t >= P.t0 && t < P.t1 + 0.4) {
    const ps = shots.find((s) => P.t0 >= s.t0 && P.t0 < s.t1) || shot; const zs = zoomAt(ps, P.t0); const [pvx, pvy] = ps.pivot;
    const [dx, dy] = mapPt(DW, DH, DRAWQ(ps.kind === 'mw' ? 'mw' : 'pt'), DIAL[0], DIAL[1]); const mx = pvx + (dx - pvx) * zs, my = pvy + (dy - pvy) * zs;
    const k = sm((t - P.t0) / (P.t1 - P.t0)); const sc = lerp(1, P.zoom, k);
    pushStyle = { transformOrigin: '0 0', transform: `translate(${lerp(0, 450 - mx * P.zoom, k)}px, ${lerp(0, 860 - my * P.zoom, k)}px) scale(${sc})` };
  }
  const midO = t < P.t1 ? clamp((t - (P.t1 - 0.35)) / 0.35) : 1;
  const pullK = sm((t - PB.t0) / (PB.t1 - PB.t0));
  const following = t > CFG.follow.t0 - 0.05;
  const capTop = punch ? 1235 : inMid && t < PB.t0 ? 1300 : following ? 1400 : shot.kind === 'device' ? 1680 : 1235;
  const renderShot = (s) => (s.kind === 'device' ? <ColdOpen t={t} /> : s.kind === 'mw' || s.kind === 'pt' ? <Plate s={s} t={t} board={board(s)} /> : <CloseUp s={s} t={t} />);
  const M0 = CFG.meta;
  return (
    <AbsoluteFill style={{ background: C.ground }}>
      {!DBG.muted && <Audio src={staticFile('llm2/mix.wav')} />}
      {/* classroom before the middle, then the push-in */}
      {preMid && t < P.t1 + 0.4 && (
        <div style={{ position: 'absolute', inset: 0, ...(pushStyle || {}) }}>
          <div style={{ position: 'absolute', inset: 0, opacity: pushStyle ? 1 - sm((t - P.t0) / ((P.t1 - P.t0) * 0.8)) * 0.85 : 1 }}>{renderShot(shot)}</div>
        </div>
      )}
      {/* diagram middle */}
      {inMid && t < PB.t0 && <div style={{ position: 'absolute', inset: 0, opacity: midO }}><Middle t={t} /></div>}
      {punch && t < PB.t0 && <CloseUp s={punch} t={t} />}
      {/* pull-back: the end frame shrinks onto the board while the classroom comes back around it */}
      {t >= PB.t0 && t < PB.t1 + 0.01 && (() => { const ps = shots.find((s) => s.t0 >= PB.t0 - 0.01) || shot; const k = ps.kind === 'pt' ? 'pt' : 'mw'; return (<>
        <div style={{ position: 'absolute', inset: 0, opacity: sm((pullK - 0.15) / 0.5) }}><Plate s={{ ...ps, kind: k }} t={t} board={null} /></div>
        <div style={{ position: 'absolute', inset: 0, background: C.ground, opacity: 1 - sm((pullK - 0.1) / 0.45) }} />
        <DiagramOnQuad quad={lerpQ(FULLQ(CROP), DIAGQ(k, CROP), pullK)} />
      </>); })()}
      {t >= PB.t1 && renderShot(shot)}
      {/* overlays */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 300, background: 'linear-gradient(180deg, rgba(20,12,4,0.45), rgba(20,12,4,0))' }} />
      <div style={{ position: 'absolute', left: 60, top: 196, fontFamily: F.mono, fontWeight: 700, fontSize: 22, letterSpacing: 3, color: 'rgba(255,240,215,0.85)' }}>{M0.series.toUpperCase()} · EP {M0.ep}</div>
      <div style={{ position: 'absolute', left: 60, top: 232, width: 700, height: 4, borderRadius: 2, background: 'rgba(255,240,215,0.2)' }}><div style={{ width: `${(t / dur) * 100}%`, height: '100%', borderRadius: 2, background: '#ffb066' }} /></div>
      {M0.handle && <div style={{ position: 'absolute', right: 60, top: 190, fontFamily: F.ui, fontWeight: 700, fontSize: 26, color: 'rgba(255,240,215,0.9)', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>@pipzo.ai</div>}
      {!(punch && t < PB.t0) && <Speakers t={t} from={M.t0 + 0.3} to={PB.t0} />}
      <Banner t={t} B={CFG.banner} />
      <Remember t={t} RM={CFG.remember} />
      <Follow t={t} FB={CFG.follow} dur={dur} />
      <Captions t={t} W={CFG.words} top={capTop} />
    </AbsoluteFill>
  );
};
