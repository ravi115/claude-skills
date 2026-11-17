// Board geometry for the HD classroom plates. Locked: shared by every episode.
import { lerp } from '../../llm1/theme.js';
const solve = (A, b) => { const n = b.length; const M = A.map((r, i) => [...r, b[i]]); for (let i = 0; i < n; i++) { let p = i; for (let k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[p][i])) p = k; [M[i], M[p]] = [M[p], M[i]]; for (let k = i + 1; k < n; k++) { const f = M[k][i] / M[i][i]; for (let j = i; j <= n; j++) M[k][j] -= f * M[i][j]; } } const x = Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; } return x; };
const homog = (w, h, q) => { const src = [[0, 0], [w, 0], [w, h], [0, h]]; const A = []; const b = []; for (let i = 0; i < 4; i++) { const [x, y] = src[i]; const [u, v] = q[i]; A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u); A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v); } return solve(A, b); };
export const mat3d = (w, h, q) => { const [a, bb, c, d, e, f, g, hh] = homog(w, h, q); return `matrix3d(${a},${d},0,${g},${bb},${e},0,${hh},0,0,1,0,${c},${f},0,1)`; };
export const mapPt = (w, h, q, x, y) => { const [a, b, c, d, e, f, g, hh] = homog(w, h, q); const z = g * x + hh * y + 1; return [(a * x + b * y + c) / z, (d * x + e * y + f) / z]; };
export const subQ = (q, u0, u1, v0, v1) => { const P = (u, v) => { const [tl, tr, br, bl] = q; const top = [lerp(tl[0], tr[0], u), lerp(tl[1], tr[1], u)], bot = [lerp(bl[0], br[0], u), lerp(bl[1], br[1], u)]; return [lerp(top[0], bot[0], v), lerp(top[1], bot[1], v)]; }; return [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)]; };
export const lerpQ = (q1, q2, k) => q1.map((p, i) => [lerp(p[0], q2[i][0], k), lerp(p[1], q2[i][1], k)]);
// board corners in the talk (mw) and pointing (pt) plates
export const BQ = { mw: [[500, 40], [1080, 0], [1080, 985], [500, 980]], pt: [[498, 30], [1080, 0], [1080, 1022], [500, 1018]] };
// chalk drawings live in a 1000x560 canvas mapped onto board v 0.40-0.72
export const DW = 1000, DH = 560;
export const DRAWQ = (k) => subQ(BQ[k], 0.04, 0.96, 0.40, 0.72);
export const fitQuad = (q, crop, padX = 0.06, padY = 0.05) => {
  const x0 = Math.max(q[0][0], q[3][0]), x1 = Math.min(q[1][0], q[2][0]), y0 = Math.max(q[0][1], q[1][1]), y1 = Math.min(q[2][1], q[3][1]);
  const w = x1 - x0, h = y1 - y0; const s = Math.min((w * (1 - 2 * padX)) / crop.w, (h * (1 - 2 * padY)) / crop.h); const cw = crop.w * s, ch = crop.h * s; const cx = x0 + w / 2, cy = y0 + h * 0.46;
  return [[cx - cw / 2, cy - ch / 2], [cx + cw / 2, cy - ch / 2], [cx + cw / 2, cy + ch / 2], [cx - cw / 2, cy + ch / 2]];
};
// where the middle's end frame sits on the board after the pull-back (board v 0.16-0.78)
export const DIAGQ = (k, crop) => fitQuad(subQ(BQ[k], 0.0, 1.0, 0.16, 0.78), crop, 0.07, 0.03);
export const FULLQ = (crop) => [[crop.x, crop.y], [crop.x + crop.w, crop.y], [crop.x + crop.w, crop.y + crop.h], [crop.x, crop.y + crop.h]];
