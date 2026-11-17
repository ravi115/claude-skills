import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, delayRender, continueRender, getInputProps } from 'remotion';
import { C, F, clamp, sm, ap, lerp, backE } from '../llm1/theme.js';
import { Face, blinkAt } from '../rig/Face';
import { Middle2, END_T } from './Middle2.jsx';
import CFG from './cfg2.json';
import VIS2 from './vis2.json';
import NAT from './visnat.json'; // one mouth state per frame per speaker, from python/lipsync_drive.py
import { natAt, mouthName } from '../rig/natMouth';
import MWP from './mwpatch.json';
import PTP from './ptpatch.json';

const DBG = getInputProps() || {};
const FPS = 30; const EP = 2; const TITLE = 'Why "Large"?';

const useFonts = () => {
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const d = [[F.chalk, 'kalam-latin-700-normal.woff2', '700'], [F.ui, 'space-grotesk-latin-500-normal.woff2', '500'], [F.ui, 'space-grotesk-latin-700-normal.woff2', '700'], [F.mono, 'jetbrains-mono-latin-700-normal.woff2', '700'], [F.bold, 'inter-latin-500-normal.woff2', '500'], [F.bold, 'inter-latin-700-normal.woff2', '700'], [F.bold, 'inter-latin-800-normal.woff2', '800']];
    Promise.all(d.map(([n, f, w]) => new FontFace(n, `url(${staticFile('llm1/fonts/' + f)})`, { weight: w }).load())).then((fs) => { fs.forEach((f) => document.fonts.add(f)); continueRender(h); }).catch(() => continueRender(h));
  }, []);
};

/* ---- geometry ---- */
const solve = (A, b) => { const n = b.length; const M = A.map((r, i) => [...r, b[i]]); for (let i = 0; i < n; i++) { let p = i; for (let k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[p][i])) p = k; [M[i], M[p]] = [M[p], M[i]]; for (let k = i + 1; k < n; k++) { const f = M[k][i] / M[i][i]; for (let j = i; j <= n; j++) M[k][j] -= f * M[i][j]; } } const x = Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; } return x; };
const homog = (w, h, q) => { const src = [[0, 0], [w, 0], [w, h], [0, h]]; const A = []; const b = []; for (let i = 0; i < 4; i++) { const [x, y] = src[i]; const [u, v] = q[i]; A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u); A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v); } return solve(A, b); };
const mat3d = (w, h, q) => { const [a, bb, c, d, e, f, g, hh] = homog(w, h, q); return `matrix3d(${a},${d},0,${g},${bb},${e},0,${hh},0,0,1,0,${c},${f},0,1)`; };
const mapPt = (w, h, q, x, y) => { const [a, b, c, d, e, f, g, hh] = homog(w, h, q); const z = g * x + hh * y + 1; return [(a * x + b * y + c) / z, (d * x + e * y + f) / z]; };
const subQ = (q, u0, u1, v0, v1) => { const P = (u, v) => { const [tl, tr, br, bl] = q; const top = [lerp(tl[0], tr[0], u), lerp(tl[1], tr[1], u)], bot = [lerp(bl[0], br[0], u), lerp(bl[1], br[1], u)]; return [lerp(top[0], bot[0], v), lerp(top[1], bot[1], v)]; }; return [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)]; };
const lerpQ = (q1, q2, k) => q1.map((p, i) => [lerp(p[0], q2[i][0], k), lerp(p[1], q2[i][1], k)]);
const BQ = { mw: [[500, 40], [1080, 0], [1080, 985], [500, 980]], pt: [[498, 30], [1080, 0], [1080, 1022], [500, 1018]] };
const DRAWQ = (k) => subQ(BQ[k], 0.04, 0.96, 0.40, 0.72);
const DW = 1000, DH = 560, DIAL = [120, 330];

/* ---- chalk drawing on the board: a small model full of dials ---- */
const chalk = { stroke: C.chalk, strokeWidth: 6, fill: 'none', strokeLinecap: 'round', opacity: 0.9 };
const ChalkDial = ({ x, y, a, pink }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r="44" {...chalk} stroke={pink ? C.pink : C.chalk} strokeWidth={pink ? 8 : 6} />
    <line x1="0" y1="0" x2={Math.sin(a) * 32} y2={-Math.cos(a) * 32} {...chalk} stroke={pink ? C.pink : C.chalk} strokeWidth="7" />
    <circle r="6" fill={pink ? C.pink : C.chalk} />
  </g>
);
const BoardDrawing = ({ quad }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: DW, height: DH, transformOrigin: '0 0', transform: mat3d(DW, DH, quad) }}>
    <div style={{ position: 'absolute', left: 50, top: 6, fontFamily: F.chalk, fontWeight: 700, fontSize: 64, color: C.chalk, opacity: 0.92 }}>a small model</div>
    <svg width={DW} height={DH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
      <rect x="40" y="120" width="620" height="300" rx="34" {...chalk} />
      {[0, 1].map((r) => [0, 1, 2, 3].map((c) => <ChalkDial key={`${r}${c}`} x={120 + c * 150} y={190 + r * 140} a={[-0.8, 0.4, -0.2, 1.0, 0.9, -1.1, 0.3, -0.5][r * 4 + c]} pink={r === 1 && c === 0} />))}
    </svg>
    <div style={{ position: 'absolute', left: 690, top: 150, fontFamily: F.chalk, fontWeight: 700, fontSize: 50, color: C.chalk, opacity: 0.9, lineHeight: 1.2 }}>big ones:<br /><span style={{ color: '#ffcf8a' }}>175B</span><br />dials</div>
  </div>
);

/* ---- the diagram end frame, pinned to the board after the pull-back ---- */
const CROP = { x: 40, y: 300, w: 820, h: 960 };
const DiagramOnQuad = ({ quad }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: CROP.w, height: CROP.h, transformOrigin: '0 0', transform: mat3d(CROP.w, CROP.h, quad), overflow: 'hidden', borderRadius: 18, boxShadow: '0 0 0 6px rgba(139,94,60,0.9)' }}>
    <div style={{ position: 'absolute', left: -CROP.x, top: -CROP.y, width: 1080, height: 1920 }}><Middle2 t={END_T} still /></div>
  </div>
);
const fitQuad = (q, padX = 0.06, padY = 0.05) => {
  const xs = q.map((p) => p[0]), ys = q.map((p) => p[1]); const x0 = Math.max(...[q[0][0], q[3][0]]), x1 = Math.min(q[1][0], q[2][0]), y0 = Math.max(q[0][1], q[1][1]), y1 = Math.min(q[2][1], q[3][1]);
  const w = x1 - x0, h = y1 - y0; const s = Math.min((w * (1 - 2 * padX)) / CROP.w, (h * (1 - 2 * padY)) / CROP.h); const cw = CROP.w * s, ch = CROP.h * s; const cx = x0 + w / 2, cy = y0 + h * 0.46;
  return [[cx - cw / 2, cy - ch / 2], [cx + cw / 2, cy - ch / 2], [cx + cw / 2, cy + ch / 2], [cx - cw / 2, cy + ch / 2]];
};
const DIAGQ = (k) => fitQuad(subQ(BQ[k], 0.0, 1.0, 0.16, 0.78), 0.07, 0.03);
const FULLQ = [[CROP.x, CROP.y], [CROP.x + CROP.w, CROP.y], [CROP.x + CROP.w, CROP.y + CROP.h], [CROP.x, CROP.y + CROP.h]];

/* ---- camera ---- */
const zoomAt = (s, t) => { const K = s.zk; const r = t - s.t0; if (r <= K[0][0]) return K[0][1]; for (let i = 0; i < K.length - 1; i++) { const [a, sa] = K[i], [b, sb] = K[i + 1]; if (r <= b) return lerp(sa, sb, sm((r - a) / Math.max(0.01, b - a))); } return K[K.length - 1][1]; };
const visAt = (who, t) => { const A = VIS2.w[who]; const f = t * 30; const i = Math.max(0, Math.min(A.length - 2, Math.floor(f))); const u = f - i; return A[i].map((x, j) => x * (1 - u) + A[i + 1][j] * u); };

/* ---- HD classroom plate with mouth + blink patches ---- */
const MWV = ['AH', 'EE', 'OH', 'OO'];
const PlateFace = ({ k, t }) => {
  const w6 = visAt('P', t); const w = [w6[0] + w6[5] * 0.8, w6[1] + w6[4] * 0.6, w6[2], w6[3]];
  const order = w.map((x, j) => [x, j]).sort((a, b) => a[0] - b[0]); const [b2, b1] = order.slice(-2);
  const tot = Math.min(1, (b1[0] + b2[0]) * 1.35); const top = b1[0] / Math.max(1e-6, b1[0] + b2[0]);
  const PP = k === 'mw' ? MWP : PTP; const pre = k === 'mw' ? 'mw' : 'pt';
  const Pic = ({ v, o }) => { const [x0, y0, x1, y1] = PP[v].box; return <Img src={staticFile(`llm2/${pre}_${v}_patch.png`)} style={{ position: 'absolute', left: x0 / 2, top: y0 / 2, width: (x1 - x0) / 2, height: (y1 - y0) / 2, opacity: o }} />; };
  const bl = blinkAt('P', t, VIS2.s);
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
      {board === 'drawing' && <BoardDrawing quad={DRAWQ(k)} />}
      {board === 'diagram' && <DiagramOnQuad quad={DIAGQ(k)} />}
    </div>
  );
};

/* ---- close-ups: HD bust over the blurred classroom ---- */
const CloseUp = ({ s, t }) => {
  const z = zoomAt(s, t); const who = s.kind === 'cuP' ? 'P' : 'S';
  const bob = Math.sin(t * 1.3) * 0.6; const breathe = 1 + Math.sin(t * 1.9) * 0.004;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Img src={staticFile(`llm2/cu_bg${who}.jpg`)} style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${1.04 + (z - 1) * 0.5})` }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 75% 28%, rgba(255,190,110,0.22), transparent 60%)' }} />
      <div style={{ position: 'absolute', left: who === 'P' ? -170 : -150, top: 560, width: 1400, height: 1400, transformOrigin: '50% 100%', transform: `scale(${z * breathe}) rotate(${who === 'P' ? bob : -bob}deg)` }}>
        <Face who={who} t={t} size={1400} vis={VIS2.w} sched={VIS2.s} nat={NAT.w} mirror={who === 'S'} filter="sepia(0.16) saturate(1.1) brightness(1.03) contrast(1.03)" />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(${who === 'P' ? 100 : 260}deg, transparent 55%, rgba(255,170,80,0.16))`, mixBlendMode: 'soft-light' }} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 300, background: 'linear-gradient(transparent, rgba(0,0,0,0.3))' }} />
    </div>
  );
};

/* ---- talking busts during the diagram middle ---- */
/* Bottom portraits (Episode 3 layout): both on screen, active speaker brighter. Professor left 10, Emily left 480 (40 px more gap than Ep3, still clear of the Instagram buttons). */
const SPK = { P: { left: 10, label: 'PROFESSOR', col: '#2DD4BF' }, S: { left: 480, label: 'EMILY', col: '#F472B6' } };
const SZ = 470;
const Bust = ({ who, t, o }) => {
  if (o <= 0.001) return null; const S = SPK[who]; const w = visAt(who, t); const a = Math.min(1, w.reduce((x, y) => x + y, 0));
  const bob = Math.sin(t * 7.3) * a * 1.6 + Math.sin(t * 1.3) * 0.8; const breathe = 1 + Math.sin(t * 1.9) * 0.006;
  return (
    <div style={{ position: 'absolute', left: S.left, top: 1920 - SZ + 40 + (1 - o) * 120, width: SZ, height: SZ, opacity: o, transformOrigin: '50% 100%', transform: `rotate(${bob * (who === 'S' ? -1 : 1)}deg) scale(${breathe})` }}>
      <div style={{ position: 'absolute', left: SZ * 0.12, top: SZ * 0.18, width: SZ * 0.76, height: SZ * 0.76, borderRadius: '50%', background: `radial-gradient(circle, ${S.col}55, transparent 65%)`, filter: 'blur(10px)' }} />
      <div style={{ position: 'absolute', inset: 0, filter: `drop-shadow(0 0 14px ${S.col}88) drop-shadow(0 10px 20px rgba(0,0,0,0.5))` }}>
        <Face who={who} t={t} size={SZ} vis={VIS2.w} sched={VIS2.s} nat={NAT.w} mirror={who === 'S'} />
      </div>
      <div style={{ position: 'absolute', left: who === 'P' ? 270 : 30, top: 60, padding: '6px 14px 7px', borderRadius: 12, border: `1.5px solid ${S.col}`, background: 'rgba(8,16,13,0.6)', fontFamily: F.mono, fontWeight: 700, fontSize: 20, letterSpacing: 3, color: S.col, boxShadow: `0 0 16px ${S.col}66` }}>{S.label}</div>
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
  if (t > B.t1 + 0.5) return null;
  const o = ap(t, 0.0, 0.25) * (1 - ap(t, B.t1, 0.45)); const pp = 0.9 + 0.1 * backE(t / 0.5);
  return (
    <div style={{ position: 'absolute', left: 0, top: 1020, width: 1080, display: 'flex', justifyContent: 'center', opacity: o }}>
      <div style={{ transform: `scale(${pp})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 44px 30px', borderRadius: 34, background: 'rgba(15,8,2,0.74)', border: '2px solid rgba(255,176,102,0.55)', maxWidth: 940 }}>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: 5, color: '#ffb066' }}>EPISODE {EP}</div>
        <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 76, color: '#fff', lineHeight: 1.05 }}>{TITLE}</div>
        <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 30, color: 'rgba(255,240,215,0.85)' }}>Parameters and data</div>
      </div>
    </div>
  );
};
const Remember = ({ t, RM }) => {
  if (t < RM.t0 - 0.1 || t > RM.t1 + 0.5) return null;
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
/* the Pipzo robot avatar, blinking */
const BlinkBot = ({ t }) => {
  // blink every ~2.2 s, double-blink sometimes; eyelid covers the white eye squares
  const cyc = (t * 1.0) % 2.2; const b = cyc < 0.08 ? cyc / 0.08 : cyc < 0.12 ? 1 : cyc < 0.2 ? 1 - (cyc - 0.12) / 0.08 : 0;
  const k = 144 / 640; // avatar drawn at ~144px inside the ring
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
const Follow = ({ t, FB, dur }) => {
  if (t < FB.t0 - 0.05) return null;
  const o = ap(t, FB.t0, 0.45); const pp = 0.85 + 0.15 * backE((t - FB.t0) / 0.5);
  const tapped = t > FB.tap; const press = t > FB.tap - 0.12 && t < FB.tap + 0.18 ? 0.92 : 1;
  const pulse = t > FB.pulse && !tapped ? 1 + 0.05 * Math.sin((t - FB.pulse) * 9) : 1; const ring = clamp((t - FB.tap) / 0.6);
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
const Captions = ({ t, W, top }) => {
  const n = W.findIndex((w) => w.t0 > t); const i0 = n === -1 ? W.length - 1 : n - 1;
  if (i0 < 0) return null; const cur = W[i0]; if (t > cur.t1 + 0.5) return null;
  let s = i0; while (s > 0 && i0 - s < 3 && W[s - 1].who === cur.who && cur.t0 - W[s - 1].t0 < 1.6 && !/[.?!]$/.test(W[s - 1].raw)) s--;
  let e = i0; while (e < W.length - 1 && e - s < 4 && W[e + 1].who === cur.who && W[e + 1].t0 - W[e].t1 < 0.6 && !/[.?!,:]$/.test(W[e].raw)) e++;
  const words = W.slice(s, e + 1);
  return (
    <div style={{ position: 'absolute', left: 40, top, width: 1000, display: 'flex', justifyContent: 'center', zIndex: 5 }}>
      <div style={{ padding: '10px 26px 14px', borderRadius: 26, background: 'rgba(15,8,2,0.66)', fontFamily: F.ui, fontWeight: 700, fontSize: 54, whiteSpace: 'nowrap', display: 'flex', gap: 14, alignItems: 'center' }}>
        {cur.who === 'S' && <span style={{ fontFamily: F.mono, fontSize: 22, color: '#ffb066', border: '2px solid #ffb066', borderRadius: 10, padding: '2px 10px' }}>STUDENT</span>}
        {words.map((w, i) => <span key={i} style={{ color: s + i <= i0 ? '#fff' : 'rgba(255,255,255,0.4)' }}>{w.raw}</span>)}
      </div>
    </div>
  );
};

export const Ep2 = () => {
  useFonts();
  const f = useCurrentFrame(); const t = DBG.t != null ? DBG.t : f / FPS;
  const dur = CFG.total; const P = CFG.push, PB = CFG.pull, M = CFG.mid;
  const shots = CFG.shots.filter((s) => s.kind !== 'mid');
  const shot = shots.find((s) => t >= s.t0 && t < s.t1) || shots[shots.length - 1];
  const preMid = t < M.t0 + 0.4; const inMid = t >= P.t1 - 0.4 && t < PB.t1; const afterPull = t >= PB.t0;
  const board = (s) => (s.diagram ? 'diagram' : s.t0 < M.t0 ? 'drawing' : null);
  // push-in into the pink dial on the board
  let pushStyle = null;
  if (t >= P.t0 && t < P.t1 + 0.4) {
    const ps = shots.find((s) => P.t0 >= s.t0 && P.t0 < s.t1); const zs = zoomAt(ps, P.t0); const [pvx, pvy] = ps.pivot;
    const [dx, dy] = mapPt(DW, DH, DRAWQ(ps.kind), DIAL[0], DIAL[1]); const mx = pvx + (dx - pvx) * zs, my = pvy + (dy - pvy) * zs;
    const k = sm((t - P.t0) / (P.t1 - P.t0)); const sc = lerp(1, P.zoom, k);
    pushStyle = { transformOrigin: '0 0', transform: `translate(${lerp(0, 450 - mx * P.zoom, k)}px, ${lerp(0, 860 - my * P.zoom, k)}px) scale(${sc})` };
  }
  const midO = t < P.t1 ? clamp((t - (P.t1 - 0.35)) / 0.35) : 1;
  const pullK = sm((t - PB.t0) / (PB.t1 - PB.t0));
  const isCU = shot.kind === 'cuP' || shot.kind === 'cuS';
  const capTop = inMid && t < PB.t0 ? 1270 : t > CFG.follow.t0 - 0.05 ? 1400 : 1235;
  const renderShot = (s, extra = {}) => (s.kind === 'mw' || s.kind === 'pt' ? <Plate s={s} t={t} board={extra.board !== undefined ? extra.board : board(s)} /> : <CloseUp s={s} t={t} />);
  return (
    <AbsoluteFill style={{ background: C.ground }}>
      {/* classroom before the middle */}
      {preMid && t < P.t1 + 0.4 && (
        <div style={{ position: 'absolute', inset: 0, ...(pushStyle || {}) }}>
          <div style={{ position: 'absolute', inset: 0, opacity: pushStyle ? 1 - sm((t - P.t0) / ((P.t1 - P.t0) * 0.8)) * 0.85 : 1 }}>{renderShot(shot)}</div>
        </div>
      )}
      {/* diagram middle */}
      {inMid && t < PB.t0 && <div style={{ position: 'absolute', inset: 0, opacity: midO }}><Middle2 t={t} /></div>}
      {/* pull-back */}
      {t >= PB.t0 && t < PB.t1 + 0.01 && (() => { const ps = shots.find((s) => s.t0 >= PB.t0 - 0.01); return (<>
        <div style={{ position: 'absolute', inset: 0, opacity: sm((pullK - 0.15) / 0.5) }}><Plate s={ps} t={t} board={null} /></div>
        <div style={{ position: 'absolute', inset: 0, background: C.ground, opacity: 1 - sm((pullK - 0.1) / 0.45) }} />
        <DiagramOnQuad quad={lerpQ(FULLQ, DIAGQ(ps.kind), pullK)} />
      </>); })()}
      {t >= PB.t1 && renderShot(shot)}
      {/* overlays */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 300, background: 'linear-gradient(180deg, rgba(20,12,4,0.45), rgba(20,12,4,0))' }} />
      <div style={{ position: 'absolute', left: 60, top: 196, fontFamily: F.mono, fontWeight: 700, fontSize: 22, letterSpacing: 3, color: 'rgba(255,240,215,0.85)' }}>LARGE LANGUAGE MODELS, GPT-2 · EP {EP}</div>
      <div style={{ position: 'absolute', left: 60, top: 232, width: 700, height: 4, borderRadius: 2, background: 'rgba(255,240,215,0.2)' }}><div style={{ width: `${(t / dur) * 100}%`, height: '100%', borderRadius: 2, background: '#ffb066' }} /></div>
      <div style={{ position: 'absolute', right: 60, top: 190, fontFamily: F.ui, fontWeight: 700, fontSize: 26, color: 'rgba(255,240,215,0.9)', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>@pipzo.ai</div>
      <Speakers t={t} from={M.t0 + 0.3} to={PB.t0} />
      <Banner t={t} B={CFG.banner} />
      <Remember t={t} RM={CFG.remember} />
      <Follow t={t} FB={CFG.follow} dur={dur} />
      <Captions t={t} W={CFG.words} top={capTop} />
    </AbsoluteFill>
  );
};
