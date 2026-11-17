import React, { useEffect, useState } from 'react';
import { AbsoluteFill, OffthreadVideo, Img, Sequence, staticFile, useCurrentFrame, delayRender, continueRender, getInputProps } from 'remotion';
import { C, F, clamp, ease, sm, ap, lerp, backE } from './theme.js';
import { Middle, AGENT_END } from './Middle.jsx';
import CFG from './cfg.json';
import ENV from './env.json';
import MP from './mouths.json';
import VIS from './visemes.json';

const DBG = getInputProps() || {};
const FPS = 30;

const useFonts = () => {
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const d = [[F.chalk, 'kalam-latin-700-normal.woff2', '700'], [F.ui, 'space-grotesk-latin-500-normal.woff2', '500'], [F.ui, 'space-grotesk-latin-700-normal.woff2', '700'], [F.mono, 'jetbrains-mono-latin-700-normal.woff2', '700'], [F.bold, 'inter-latin-500-normal.woff2', '500'], [F.bold, 'inter-latin-700-normal.woff2', '700'], [F.bold, 'inter-latin-800-normal.woff2', '800']];
    Promise.all(d.map(([n, f, w]) => new FontFace(n, `url(${staticFile('llm1/fonts/' + f)})`, { weight: w }).load())).then((fs) => { fs.forEach((f) => document.fonts.add(f)); continueRender(h); }).catch(() => continueRender(h));
  }, []);
};

/* ---- homography: map rect (0,0,w,h) onto quad [[x,y]x4: tl,tr,br,bl] as CSS matrix3d ---- */
const solve = (A, b) => { const n = b.length; const M = A.map((r, i) => [...r, b[i]]); for (let i = 0; i < n; i++) { let p = i; for (let k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[p][i])) p = k; [M[i], M[p]] = [M[p], M[i]]; for (let k = i + 1; k < n; k++) { const f = M[k][i] / M[i][i]; for (let j = i; j <= n; j++) M[k][j] -= f * M[i][j]; } } const x = Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; } return x; };
const mat3d = (w, h, q) => {
  const src = [[0, 0], [w, 0], [w, h], [0, h]]; const A = []; const b = [];
  for (let i = 0; i < 4; i++) { const [x, y] = src[i]; const [u, v] = q[i]; A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u); A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v); }
  const [a, bb, c, d, e, f, g, hh] = solve(A, b);
  return `matrix3d(${a},${d},0,${g},${bb},${e},0,${hh},0,0,1,0,${c},${f},0,1)`;
};
const lerpQ = (q1, q2, k) => q1.map((p, i) => [lerp(p[0], q2[i][0], k), lerp(p[1], q2[i][1], k)]);

/* ---- chalk sentence on the board (written before class; persists) ---- */
const BoardSentence = ({ quad, o = 1, compact = false }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: 1000, height: 560, transformOrigin: '0 0', transform: mat3d(1000, 560, quad), opacity: o }}>
    <div style={{ position: 'absolute', left: compact ? 60 : 100, top: compact ? 60 : 200, fontFamily: F.chalk, fontWeight: 700, fontSize: compact ? 170 : 112, lineHeight: 1.15, color: C.chalk, opacity: 0.92, textShadow: '0 0 3px rgba(244,241,230,0.35)', whiteSpace: 'nowrap' }}>
      The cat sat<br />on the <span style={{ color: C.pink }}>mat</span>
    </div>
  </div>
);
// the region of the diagram end frame that goes onto the board
const CROP = { x: 40, y: 250, w: 820, h: 1060 };
const DiagramOnQuad = ({ quad, o = 1 }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: CROP.w, height: CROP.h, transformOrigin: '0 0', transform: mat3d(CROP.w, CROP.h, quad), opacity: o, overflow: 'hidden', borderRadius: 18, boxShadow: '0 0 0 6px rgba(139,94,60,0.9)' }}>
    <div style={{ position: 'absolute', left: -CROP.x, top: -CROP.y, width: 1080, height: 1920 }}><Middle L={AGENT_END} G={null} t={AGENT_END} still /></div>
  </div>
);
// fit the CROP aspect inside the board quad (axis-aligned approximation of the board centre)
const fitQuad = (q, padX = 0.08, padY = 0.06) => {
  const [tl, tr, br, bl] = q; const w = (tr[0] - tl[0] + br[0] - bl[0]) / 2, h = (bl[1] - tl[1] + br[1] - tr[1]) / 2;
  const s = Math.min((w * (1 - 2 * padX)) / CROP.w, (h * (1 - 2 * padY)) / CROP.h); const cw = CROP.w * s, ch = CROP.h * s;
  const cx = (tl[0] + tr[0] + br[0] + bl[0]) / 4, cy = (tl[1] + tr[1] + br[1] + bl[1]) / 4;
  return [[cx - cw / 2, cy - ch / 2], [cx + cw / 2, cy - ch / 2], [cx + cw / 2, cy + ch / 2], [cx - cw / 2, cy + ch / 2]];
};
// sub-region of a board quad (u: across, v: down), bilinear in the corners
const subQ = (q, u0, u1, v0, v1) => { const P = (u, v) => { const [tl, tr, br, bl] = q; const top = [lerp(tl[0], tr[0], u), lerp(tl[1], tr[1], u)], bot = [lerp(bl[0], br[0], u), lerp(bl[1], br[1], u)]; return [lerp(top[0], bot[0], v), lerp(top[1], bot[1], v)]; }; return [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)]; };
const boardQ = (c, q) => (c.id === 'V7' || c.mw ? q : subQ(q, 0.04, 0.70, 0.03, 0.97));
const sentQ = (c, q) => (c.mw ? subQ(q, 0.05, 0.74, 0.36, 0.60) : q);
const FULLQ = [[CROP.x, CROP.y], [CROP.x + CROP.w, CROP.y], [CROP.x + CROP.w, CROP.y + CROP.h], [CROP.x, CROP.y + CROP.h]];

const zoomAt = (c, t) => { const K = c.zk; if (!K) return 1; const r = t - c.t0; if (r <= K[0][0]) return K[0][1];
  for (let i = 0; i < K.length - 1; i++) { const [a, sa] = K[i], [b, sb] = K[i + 1]; if (r <= b) return lerp(sa, sb, sm((r - a) / Math.max(0.01, b - a))); } return K[K.length - 1][1]; };
const quadAt = (c, t) => { if (!c.quads) return c.quad; const i = Math.max(0, Math.min(c.quads.length - 1, Math.round((t - c.t0) * (c.qfps || 24)))); return c.quads[i]; };
const Clip = ({ c, t, vo = 1 }) => {
  const q = quadAt(c, t);
  // camera: optional slow push (scale around a point)
  const s = zoomAt(c, t); const [px, py] = c.pivot || [540, 960];
  return (
    <div style={{ position: 'absolute', inset: 0, transformOrigin: `${px}px ${py}px`, transform: `scale(${s})`, background: vo < 1 ? '#2a3d34' : 'transparent' }}>
      <Sequence from={Math.round(c.t0 * FPS) - Math.round((c.off || 0) * FPS)} layout="none">
        <OffthreadVideo src={staticFile(c.src)} muted style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, objectFit: 'fill', opacity: vo }} />
      </Sequence>
      {c.board === 'sentence' && <BoardSentence quad={sentQ(c, q)} compact={c.id === 'V1'} />}
      {c.board === 'diagram' && <DiagramOnQuad quad={fitQuad(boardQ(c, q))} />}
    </div>
  );
};

/* ---- talking speaker at the bottom of the diagram middle ---- */
const SPK = { P: { img: 'prof_cut.png', key: 'prof', left: 10, label: 'PROFESSOR', col: '#2DD4BF' }, S: { img: 'girl_cut.png', key: 'girl', left: 400, label: 'STUDENT', col: '#F472B6' } };
const SZ = 560, SC = SZ / 1024;
const ampAt = (who, t) => { const E = ENV[who]; const f = Math.floor(t * 30); return clamp(0.5 * (E[Math.max(0, Math.min(E.length - 1, f))] || 0) + 0.5 * (E[Math.max(0, Math.min(E.length - 1, f + 1))] || 0)); };
const whoAt = (t, W) => { let w = 'P'; for (const x of W) { if (x.t0 - 0.15 > t) break; w = x.who; } return w; };
const VK = { P: 'p', S: 'g' };
const blinkAt = (who, t) => { for (const b of VIS.s[who].blink) { const d = t - b; if (d < -0.1) break; if (d >= 0 && d < 0.17) return d < 0.06 ? d / 0.06 : d < 0.09 ? 1 : 1 - (d - 0.09) / 0.08; } return 0; };
const gazeAt = (who, t) => { const G = VIS.s[who].gaze; let i = 0; while (i + 1 < G.length && G[i + 1][0] <= t) i++; const a = G[Math.max(0, i - 1)], b = G[i]; const k = i === 0 ? 1 : Math.min(1, (t - b[0]) / 0.09); const e = k * k * (3 - 2 * k); return [a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e]; };
const visAt = (who, t) => { const A = VIS.w[who]; const f = t * 30; const i = Math.max(0, Math.min(A.length - 2, Math.floor(f))); const u = f - i; return A[i].map((x, j) => x * (1 - u) + A[i + 1][j] * u); };
const Pic = ({ src, box, style }) => <Img src={staticFile('llm1/spk/vis/' + src)} style={{ position: 'absolute', left: box[0] * SC, top: box[1] * SC, width: (box[2] - box[0]) * SC, height: (box[3] - box[1]) * SC, ...style }} />;
const SpeakerBust = ({ who, t, o }) => {
  if (o <= 0.001) return null;
  const S = SPK[who], k = VK[who]; const a = ampAt(who, t);
  const w = visAt(who, t); const order = w.map((x, j) => [x, j]).sort((p, q) => p[0] - q[0]);
  const bl = blinkAt(who, t); const [gx, gy] = gazeAt(who, t); const EY = VIS.eyes[k]; const PT = VIS.patch[k];
  const bob = Math.sin(t * 7.3) * a * 1.6 + Math.sin(t * 1.3) * 0.8; const breathe = 1 + Math.sin(t * 1.9) * 0.006;
  return (
    <div style={{ position: 'absolute', left: S.left, top: 1920 - SZ + 40 + (1 - o) * 120, width: SZ, height: SZ, opacity: o, transformOrigin: '50% 100%', transform: `rotate(${bob * (who === 'S' ? -1 : 1)}deg) scale(${breathe})` }}>
      <div style={{ position: 'absolute', left: SZ * 0.12, top: SZ * 0.18, width: SZ * 0.76, height: SZ * 0.76, borderRadius: '50%', background: `radial-gradient(circle, ${S.col}55, transparent 65%)`, filter: 'blur(10px)' }} />
      <div style={{ position: 'absolute', inset: 0, transform: who === 'S' ? 'scaleX(-1)' : 'none', filter: `drop-shadow(0 0 14px ${S.col}88) drop-shadow(0 10px 20px rgba(0,0,0,0.5))` }}>
        <Img src={staticFile('llm1/spk/' + S.img)} style={{ position: 'absolute', left: 0, top: 0, width: SZ, height: SZ }} />
        {EY.map((e, i) => (
          <div key={i} style={{ position: 'absolute', left: e.box[0] * SC, top: e.box[1] * SC, width: (e.box[2] - e.box[0]) * SC, height: (e.box[3] - e.box[1]) * SC, WebkitMaskImage: `url(${staticFile(`llm1/spk/vis/${k}_eye${i}_mask.png`)})`, WebkitMaskSize: '100% 100%', maskImage: `url(${staticFile(`llm1/spk/vis/${k}_eye${i}_mask.png`)})`, maskSize: '100% 100%' }}>
            <Img src={staticFile(`llm1/spk/vis/${k}_eye${i}_base.png`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
            <Img src={staticFile(`llm1/spk/vis/${k}_eye${i}_iris.png`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: `translate(${gx * SC * (e.r / 15)}px, ${gy * SC * (e.r / 15)}px)` }} />
          </div>))}
        {bl > 0.02 && <Pic src={`${k}_BL_patch.png`} box={PT.BL.box} style={{ opacity: Math.min(1, bl * 1.25) }} />}
        {(() => { const [b2, b1] = order.slice(-2); const tot = Math.min(1, (b1[0] + b2[0]) * 1.35); if (tot < 0.04) return null; const top = b1[0] / Math.max(1e-6, b1[0] + b2[0]);
          return (<>
            {b2[0] > 0.03 && <Pic src={`${k}_${VIS.V[b2[1]]}_patch.png`} box={PT[VIS.V[b2[1]]].box} style={{ opacity: tot }} />}
            <Pic src={`${k}_${VIS.V[b1[1]]}_patch.png`} box={PT[VIS.V[b1[1]]].box} style={{ opacity: b2[0] > 0.03 ? top * tot + (1 - tot) * 0 : tot }} />
          </>); })()}
      </div>
      <div style={{ position: 'absolute', left: who === 'P' ? 330 : 40, top: 70, padding: '6px 14px 7px', borderRadius: 12, border: `1.5px solid ${S.col}`, background: 'rgba(8,16,13,0.6)', fontFamily: F.mono, fontWeight: 700, fontSize: 20, letterSpacing: 3, color: S.col, boxShadow: `0 0 16px ${S.col}66` }}>{S.label}</div>
    </div>
  );
};
const Speakers = ({ t, from, to, W }) => {
  if (t < from - 0.5 || t > to + 0.5) return null;
  const io = clamp((t - from) / 0.5) * (1 - clamp((t - (to - 0.4)) / 0.4));
  // smooth crossfade between speakers
  const look = (dt) => whoAt(t + dt, W);
  let sP = 0; for (let i = -6; i <= 6; i++) sP += look(i * 0.05) === 'P' ? 1 : 0; sP /= 13;
  return (<>
    <SpeakerBust who="P" t={t} o={io * sP} />
    <SpeakerBust who="S" t={t} o={io * (1 - sP)} />
  </>);
};

const Banner = ({ t, B }) => {
  if (t > B.t1 + 0.5) return null;
  const o = ap(t, 0.0, 0.25) * (1 - ap(t, B.t1, 0.45)); const pp = 0.9 + 0.1 * backE(t / 0.5);
  return (
    <div style={{ position: 'absolute', left: 0, top: 955, width: 1080, display: 'flex', justifyContent: 'center', opacity: o }}>
      <div style={{ transform: `scale(${pp})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 44px 30px', borderRadius: 34, background: 'rgba(15,8,2,0.74)', border: '2px solid rgba(255,176,102,0.55)', maxWidth: 940 }}>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: 6, color: '#ffb066' }}>EPISODE 1</div>
        <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 82, color: '#fff', textAlign: 'center', lineHeight: 1.05 }}>What Is an LLM?</div>
        <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 34, color: 'rgba(255,240,215,0.92)', textAlign: 'center' }}>Large Language Models, GPT-2</div>
      </div>
    </div>
  );
};

const Remember = ({ t, RM }) => {
  if (t < RM.t0 - 0.1 || t > RM.t1 + 0.5) return null;
  const o = ap(t, RM.t0, 0.4) * (1 - ap(t, RM.t1, 0.35));
  return (
    <div style={{ position: 'absolute', left: 90, top: 890, width: 900, opacity: o, transform: `translateY(${(1 - o) * 20}px)` }}>
      <div style={{ padding: '26px 34px', borderRadius: 30, background: 'linear-gradient(160deg, rgba(255,255,255,0.18), rgba(20,14,8,0.22))', backdropFilter: 'blur(12px)', border: '2px solid rgba(255,255,255,0.45)', boxShadow: '0 18px 40px rgba(0,0,0,0.35), inset 0 1.5px 0 rgba(255,255,255,0.5)' }}>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: 4, color: '#ffb066', textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>REMEMBER</div>
        <div style={{ fontFamily: F.chalk, fontWeight: 700, fontSize: 54, color: '#fff', lineHeight: 1.25, marginTop: 6, textShadow: '0 2px 10px rgba(0,0,0,0.7)' }}>{RM.a}<br /><span style={{ color: '#ffcf8a' }}>{RM.b}</span></div>
      </div>
    </div>
  );
};

const Follow = ({ t, FB, dur }) => {
  if (t < FB.t0 - 0.05) return null;
  const o = ap(t, FB.t0, 0.45); const pp = 0.85 + 0.15 * backE((t - FB.t0) / 0.5);
  const tapped = t > FB.tap; const press = t > FB.tap - 0.12 && t < FB.tap + 0.18 ? 0.92 : 1;
  const pulse = t > FB.pulse && !tapped ? 1 + 0.05 * Math.sin((t - FB.pulse) * 9) : 1;
  const ring = clamp((t - FB.tap) / 0.6);
  return (
    <div style={{ position: 'absolute', left: 0, top: 560, width: 1080, display: 'flex', justifyContent: 'center', opacity: o * (1 - ap(t, dur - 0.4, 0.3)) }}>
      <div style={{ width: 760, padding: '34px 36px 38px', borderRadius: 40, background: 'rgba(255,255,255,0.95)', boxShadow: '0 24px 60px rgba(0,0,0,0.35)', transform: `scale(${pp})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 168, height: 168, borderRadius: '50%', padding: 7, background: 'conic-gradient(#feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5, #feda75)' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '5px solid #fff', overflow: 'hidden', boxSizing: 'border-box' }}>
            <Img src={staticFile('llm1/pipzo-avatar.png')} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
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
  const idx = W.findIndex((w) => w.t0 > t) - 1;
  if (idx < 0) return null; const cur = W[idx]; if (t > cur.t1 + 0.5) return null;
  let s = idx; while (s > 0 && idx - s < 3 && W[s - 1].who === cur.who && cur.t0 - W[s - 1].t0 < 1.6 && !/[.?!]$/.test(W[s - 1].raw)) s--;
  let e = idx; while (e < W.length - 1 && e - s < 4 && W[e + 1].who === cur.who && W[e + 1].t0 - W[e].t1 < 0.6 && !/[.?!,:]$/.test(W[e].raw)) e++;
  const words = W.slice(s, e + 1);
  return (
    <div style={{ position: 'absolute', left: 40, top, width: 1000, display: 'flex', justifyContent: 'center', zIndex: 5 }}>
      <div style={{ padding: '10px 26px 14px', borderRadius: 26, background: 'rgba(15,8,2,0.66)', fontFamily: F.ui, fontWeight: 700, fontSize: 54, whiteSpace: 'nowrap', display: 'flex', gap: 14, alignItems: 'center' }}>
        {cur.who === 'S' && <span style={{ fontFamily: F.mono, fontSize: 22, color: '#ffb066', border: '2px solid #ffb066', borderRadius: 10, padding: '2px 10px' }}>STUDENT</span>}
        {words.map((w, i) => <span key={i} style={{ color: s + i <= idx ? '#fff' : 'rgba(255,255,255,0.4)' }}>{w.raw}</span>)}
      </div>
    </div>
  );
};

export const Ep1 = () => {
  useFonts();
  const f = useCurrentFrame(); const t = DBG.t != null ? DBG.t : f / FPS;
  const M = CFG.mid; const dur = CFG.total;
  // middle time mapping
  let L = null, G = null;
  if (t >= CFG.push.t1 - 0.4) {
    const tIns = M.t0 + (M.insAt - M.L0);
    if (t < tIns) L = M.L0 + (t - M.t0);
    else if (t < tIns + M.insDur) { G = t - tIns; L = M.insAt; }
    else L = Math.min(M.L0 + (t - M.t0) - M.insDur, AGENT_END);
  }
  const P = CFG.push, PB = CFG.pull;
  const inMid = t >= P.t1 - 0.4 && t < PB.t1;
  // which clip is on screen
  const clip = CFG.clips.find((c) => t >= c.t0 && t < c.t1) || CFG.clips[CFG.clips.length - 1];
  // push-in: zoom into the board word "mat", then the middle takes over
  let pushStyle = null;
  if (t >= P.t0 && t < P.t1 + 0.4) {
    const k = sm((t - P.t0) / (P.t1 - P.t0)); const s = lerp(1, P.zoom, k);
    const c4 = CFG.clips.find((c) => c.id === 'V4'); const zs = zoomAt(c4, P.t1); const [pvx, pvy] = c4.pivot || [540, 960];
    const mx = pvx + (P.target[0] - pvx) * zs, my = pvy + (P.target[1] - pvy) * zs; const tx = lerp(0, 450 - mx * s - (0) , k), ty = lerp(0, 860 - my * s, k);
    pushStyle = { transformOrigin: '0 0', transform: `translate(${lerp(0, 450 - mx * P.zoom, k) + (1 - k) * 0}px, ${lerp(0, 860 - my * P.zoom, k)}px) scale(${s})` };
  }
  const midO = t < P.t1 ? clamp((t - (P.t1 - 0.35)) / 0.35) : 1;
  // pull-back: full-screen diagram crop shrinks onto the board of the pull clip
  const pullK = sm((t - PB.t0) / (PB.t1 - PB.t0));
  const pullClip = CFG.clips.find((c) => c.id === PB.clip);
  const capTop = inMid && t < PB.t0 ? 1270 : t > CFG.follow.t0 - 0.05 ? 1330 : 1235;
  const hdrO = 1;
  return (
    <AbsoluteFill style={{ background: C.ground }}>
      {/* classroom clips */}
      {(!inMid || t < P.t1) && t < PB.t0 && (
        <div style={{ position: 'absolute', inset: 0, ...(pushStyle || {}) }}><Clip c={clip} t={t} vo={pushStyle ? 1 - sm((t - P.t0) / ((P.t1 - P.t0) * 0.55)) : 1} /></div>
      )}
      {/* the diagram middle */}
      {inMid && t < PB.t0 && <div style={{ position: 'absolute', inset: 0, opacity: midO }}><Middle L={L} G={G} gDur={M.insDur} t={t} /></div>}
      {/* pull-back into the classroom */}
      {t >= PB.t0 && t < PB.t1 + 0.01 && (
        <>
          <div style={{ position: 'absolute', inset: 0, opacity: sm((pullK - 0.15) / 0.5) }}><Clip c={{ ...pullClip, board: null }} t={t} /></div>
          <div style={{ position: 'absolute', inset: 0, background: C.ground, opacity: 1 - sm((pullK - 0.1) / 0.45) }} />
          <DiagramOnQuad quad={lerpQ(FULLQ, fitQuad(boardQ(pullClip, quadAt(pullClip, t))), pullK)} />
        </>
      )}
      {t >= PB.t1 && <Clip c={clip} t={t} />}
      {/* overlays */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 300, background: 'linear-gradient(180deg, rgba(20,12,4,0.45), rgba(20,12,4,0))' }} />
      <div style={{ position: 'absolute', left: 60, top: 196, fontFamily: F.mono, fontWeight: 700, fontSize: 22, letterSpacing: 3, color: 'rgba(255,240,215,0.85)', opacity: hdrO }}>LARGE LANGUAGE MODELS, GPT-2 · EP 1</div>
      <div style={{ position: 'absolute', left: 60, top: 232, width: 700, height: 4, borderRadius: 2, background: 'rgba(255,240,215,0.2)' }}><div style={{ width: `${(t / dur) * 100}%`, height: '100%', borderRadius: 2, background: '#ffb066' }} /></div>
      <div style={{ position: 'absolute', right: 60, top: 190, fontFamily: F.ui, fontWeight: 700, fontSize: 26, color: 'rgba(255,240,215,0.9)', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>@pipzo.ai</div>
      <Speakers t={t} from={M.t0 + 0.3} to={PB.t0} W={CFG.words} />
      <Banner t={t} B={CFG.banner} />
      <Remember t={t} RM={CFG.remember} />
      <Follow t={t} FB={CFG.follow} dur={dur} />
      <Captions t={t} W={CFG.words} top={capTop} />
    </AbsoluteFill>
  );
};
