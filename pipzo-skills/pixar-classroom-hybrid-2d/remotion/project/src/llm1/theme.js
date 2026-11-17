// Classroom Green Dark Keynote — fixed series theme (DECISION-PACKAGE.md, 14 Nov 2026)
export const C = {
  ground: '#22312B',
  ground2: '#1B2823',
  white: '#F5F1E8',
  dim: 'rgba(245,241,232,0.55)',
  orange: '#F97316', // winner / emphasis only
  pink: '#F472B6', // handoff word, query
  indigo: '#818CF8',
  teal: '#2DD4BF',
  sage: '#7A9B8A',
  tealGrey: '#5F7A72',
  yellow: '#FACC15', // numbers only
  green: '#86EFAC', // tokens
  blue: '#7DD3FC', // embeddings
  grey: '#93A39B',
  chalk: '#F4F1E6',
};
export const F = { ui: 'SG2', bold: 'Inter', chalk: 'KalamX', mono: 'JB2' };
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
export const sm = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const ap = (t, at, d = 0.4) => ease((t - at) / d);
export const lerp = (a, b, x) => a + (b - a) * x;
export const backE = (x) => { x = clamp(x); const c = 1.4; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
export const pop = (t, at, d = 0.45) => (t < at ? 0 : backE((t - at) / d));
