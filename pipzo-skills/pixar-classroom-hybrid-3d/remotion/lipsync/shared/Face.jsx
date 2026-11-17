// Reusable talking face rig: base cutout + eye layers (moving iris, blinks) + viseme mouth crossfade.
import React from 'react';
import { Img, staticFile } from 'remotion';
import VIS from '../llm1/visemes.json';
import { natAt, mouthName } from './natMouth';
const VK = { P: 'p', S: 'g' };
const IMG = { P: 'llm1/spk/prof_cut.png', S: 'llm1/spk/girl_cut.png' };
export const blinkAt = (who, t, SS = VIS.s) => { for (const b of SS[who].blink) { const d = t - b; if (d < -0.1) break; if (d >= 0 && d < 0.17) return d < 0.06 ? d / 0.06 : d < 0.09 ? 1 : 1 - (d - 0.09) / 0.08; } return 0; };
export const gazeAt = (who, t, SS = VIS.s) => { const G = SS[who].gaze; let i = 0; while (i + 1 < G.length && G[i + 1][0] <= t) i++; const a = G[Math.max(0, i - 1)], b = G[i]; const k = i === 0 ? 1 : Math.min(1, (t - b[0]) / 0.09); const e = k * k * (3 - 2 * k); return [a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e]; };
export const visAt = (who, t, W = VIS.w) => { const A = W[who]; const f = t * 30; const i = Math.max(0, Math.min(A.length - 2, Math.floor(f))); const u = f - i; return A[i].map((x, j) => x * (1 - u) + A[i + 1][j] * u); };
// size: rendered px of the 1024 square; vis: optional override track {P:[[6]..],S:..}
export const Face = ({ who, t, size, vis, sched, nat, mirror = false, filter = 'none' }) => {
  const SC = size / 1024, k = VK[who], EY = VIS.eyes[k], PT = VIS.patch[k];
  const w = visAt(who, t, vis || VIS.w); const order = w.map((x, j) => [x, j]).sort((p, q) => p[0] - q[0]);
  const bl = blinkAt(who, t, sched || VIS.s); const [gx, gy] = gazeAt(who, t, sched || VIS.s);
  const Pic = ({ src, box, o }) => <Img src={staticFile('llm1/spk/vis/' + src)} style={{ position: 'absolute', left: box[0] * SC, top: box[1] * SC, width: (box[2] - box[0]) * SC, height: (box[3] - box[1]) * SC, opacity: o }} />;
  const [b2, b1] = order.slice(-2); const tot = Math.min(1, (b1[0] + b2[0]) * 1.35); const top = b1[0] / Math.max(1e-6, b1[0] + b2[0]);
  return (
    <div style={{ position: 'absolute', inset: 0, width: size, height: size, transform: mirror ? 'scaleX(-1)' : 'none', filter }}>
      <Img src={staticFile(IMG[who])} style={{ position: 'absolute', left: 0, top: 0, width: size, height: size }} />
      {EY.map((e, i) => {
        const m = staticFile(`llm1/spk/vis/${k}_eye${i}_mask.png`);
        return (<div key={i} style={{ position: 'absolute', left: e.box[0] * SC, top: e.box[1] * SC, width: (e.box[2] - e.box[0]) * SC, height: (e.box[3] - e.box[1]) * SC, WebkitMaskImage: `url(${m})`, WebkitMaskSize: '100% 100%', maskImage: `url(${m})`, maskSize: '100% 100%' }}>
          <Img src={staticFile(`llm1/spk/vis/${k}_eye${i}_base.png`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
          <Img src={staticFile(`llm1/spk/vis/${k}_eye${i}_iris.png`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: `translate(${gx * SC * (e.r / 15)}px, ${gy * SC * (e.r / 15)}px)` }} />
        </div>);
      })}
      {bl > 0.02 && <Pic src={`${k}_BL_patch.png`} box={PT.BL.box} o={Math.min(1, bl * 1.25)} />}
      {!nat && tot >= 0.04 && b2[0] > 0.03 && <Pic src={`${k}_${VIS.V[b2[1]]}_patch.png`} box={PT[VIS.V[b2[1]]].box} o={tot} />}
      {!nat && tot >= 0.04 && <Pic src={`${k}_${VIS.V[b1[1]]}_patch.png`} box={PT[VIS.V[b1[1]]].box} o={b2[0] > 0.03 ? top * tot : tot} />}
      {nat && (() => { const n = mouthName(natAt(nat[who], t)); return n ? <Pic src={`${k}_${n}_patch.png`} box={PT[n].box} o={1} /> : null; })()}
    </div>
  );
};
