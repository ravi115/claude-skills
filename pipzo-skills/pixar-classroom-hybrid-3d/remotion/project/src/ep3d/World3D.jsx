// LOCKED 3D WORLD. Do not edit per episode: the stations come from cfg.json (built from episode.json) and the
// models from content/Models.jsx.
// The middle of a 3D episode: the universe look (universe/Universe.jsx: black sky, warm stars, planets, glass-deck floor), or the teal sky + grid when world.look is "teal".
// The Professor and Emily walk toward the camera and stop at each station. One model: an angled walnut pedestal
// rises out of the floor to the Professor's hand height, its top lands, and the realistic model appears on its cue
// word. Two or more: each model pops out of the floor Pixar style to its own spot. Approved on LLM-GPT2 Episode 5.
import RESEQ from './reseq.json';
import React, { useMemo, useState, useEffect } from 'react';
import { delayRender, continueRender } from 'remotion';
import * as THREE from 'three';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import { Img, staticFile } from 'remotion';
import { F, clamp, sm, lerp, backE } from '../llm1/theme.js';
import CFG from './cfg.json';
import META from './sprites.json';
import { FLOOR, NB, NEdge, nbEdges } from './lib/kit3d.jsx';
import { MODELS } from './content/Models.jsx';
import { UniverseSky, GlassFloor, setUniverseT0, UNIVERSE_BG, UNIVERSE_FOG } from './universe/Universe.jsx';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
const useRBox = (w, h, d, r) => useMemo(() => new RoundedBoxGeometry(w, h, d, 4, r), [w, h, d, r]);
const wrnd = (s) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const useWood = () => useMemo(() => { const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  g.fillStyle = '#c8956a'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 140; i++) { const x = wrnd(i * 7.1) * S, w = 1 + wrnd(i * 3.3) * 4; g.strokeStyle = `rgba(${90 + wrnd(i) * 40},${50 + wrnd(i + 1) * 25},${25 + wrnd(i + 2) * 15},${0.12 + wrnd(i + 3) * 0.25})`; g.lineWidth = w; g.beginPath();
    for (let y = 0; y <= S; y += 16) { const xx = x + Math.sin(y * 0.02 + i) * 6 + Math.sin(y * 0.005 + i * 2) * 14; if (y) g.lineTo(xx, y); else g.moveTo(xx, y); } g.stroke(); }
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.anisotropy = 8; return tx; }, []);
// studio environment: soft realistic reflections on every material (no glow, no neon)
export const StudioEnv = ({ k = 0.55 }) => { const { gl, scene } = useThree(); useMemo(() => { const pm = new THREE.PMREMGenerator(gl); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = k * 0.7; }, [gl, scene]); return null; };


const Wd = 1080, Hd = 1920, FOV = 36;
const SEGS = CFG.world.segs; const LN = CFG.lines;
const SPEED = META.speed; const RAMP = 0.4;
const walks = SEGS.filter((s) => s[0] === 'walk'); const TW = walks[0][2] - walks[0][1];
const GAP = SPEED * (TW - RAMP);
const ZK = (k) => -k * GAP;
const PX = 0.32, EX = -0.65, EZ = 0.9;  // Professor centre-left, Emily half a step behind on his right with a clear gap between them; frees the left column
const OX = PX - 0.2;                        // warm key light, just screen-left of the Professor's head
const ORANGE = '#F97316', WARM = '#F5F1E8', TEAL = '#2DD4BF', PURPLE = '#A78BFA', GREY = '#7d8b85';
// Per-episode look (cfg.theme). Episode 4 used 'teal-neon'; rotate themes so the series doesn't repeat one neon.
const THEMES = {
  'teal-neon':   { grid: '45,212,191',  bg: '#06100d', fog: '#0d1f1a', floor: '#0b1714', horizon: '#123029', neb: ['45,212,191', '167,139,250', '249,115,22'], ideas: ['#F97316', '#38BDF8', '#A78BFA', '#FACC15', '#F472B6', '#4ADE80'] },
  'violet-dusk': { grid: '167,139,250', bg: '#0b0816', fog: '#16112a', floor: '#100c1e', horizon: '#251b45', neb: ['167,139,250', '244,114,182', '56,189,248'], ideas: ['#F97316', '#2DD4BF', '#FACC15', '#38BDF8', '#F472B6', '#4ADE80'] },
  'amber-night': { grid: '251,191,36',  bg: '#0f0b05', fog: '#1d150a', floor: '#140f07', horizon: '#33240d', neb: ['251,191,36', '249,115,22', '45,212,191'], ideas: ['#38BDF8', '#A78BFA', '#2DD4BF', '#F472B6', '#4ADE80', '#F97316'] },
  'blue-ice':    { grid: '56,189,248',  bg: '#050b13', fog: '#0b1726', floor: '#08111c', horizon: '#123049', neb: ['56,189,248', '167,139,250', '45,212,191'], ideas: ['#F97316', '#FACC15', '#F472B6', '#A78BFA', '#4ADE80', '#2DD4BF'] },
};
const TH = THEMES['teal-neon'];   // approved series look (teal sky, green neon grid). Other themes were tried and rejected.
const ICOL = (k) => TH.ideas[k % TH.ideas.length];
const ISEG = [64, 6, 4, 3, 8, 5]; // each idea's pad has its own shape: circle, hexagon, diamond, triangle, octagon, pentagon
/* ---------- where they are ---------- */
const segAt = (t) => SEGS.find((s) => t >= s[1] && t < s[2]) || (t < SEGS[0][1] ? ['stop', -1e9, SEGS[0][1], -1] : SEGS[SEGS.length - 1]);
const walkDist = (u, T) => { const r = RAMP; if (u <= 0) return 0; if (u >= T) return SPEED * (T - r); if (u < r) return SPEED * u * u / (2 * r); if (u > T - r) { const w = T - u; return SPEED * (T - r) - SPEED * w * w / (2 * r); } return SPEED * (u - r / 2); };
export const charZ = (t) => { const s = segAt(t); if (s[3] < 0) return ZK(0) + GAP; if (s[0] === 'walk') return ZK(s[3]) + GAP - walkDist(t - s[1], s[2] - s[1]); return ZK(s[3]); };
const stopK = (t) => { let k = 0; for (const s of SEGS) { if (s[0] !== 'stop') continue; const a = sm((t - s[1] + 0.2) / 0.9), b = 1 - sm((t - (s[2] - 0.1)) / 0.6); k = Math.max(k, Math.min(a, b)); } return k; };
// the camera settles in front of each station; it pulls back to the next one just before they set off,
// so they walk *toward* us and toward the next idea
const camBaseZ = (t) => {
  let z = ZK(0) + GAP - 7.6;
  for (const w of walks) { const k = sm((t - (w[1] - 0.7)) / 1.6); z = lerp(z, ZK(w[3]) - 7.6, k); }
  return z;
};
export const camPose = (t) => {
  const zc = camBaseZ(t); const k = stopK(t); const zs = charZ(t);
  const sway = Math.sin(t * 0.29) * 0.18, bob = Math.sin(t * 0.43) * 0.05;
  // on each walk the camera swings in from the side (alternating left/right) and settles as they arrive,
  // so they always seem to be walking toward the board that has just risen
  const w = SEGS.find((x) => x[0] === 'walk' && t >= x[1] - 0.3 && t < x[2] + 0.9); let orb = 0;
  if (w) { const u = clamp((t - (w[1] - 0.3)) / (w[2] - w[1] + 1.2)); orb = (1 - sm(u)) * Math.sin(Math.PI * Math.min(1, u * 1.6 + 0.35)) * 1.1 * (w[3] % 2 ? 1 : -1); }
  const wp = [-0.15 + sway + orb, 2.05 + bob, zc], wl = [0.35 + orb * 0.35, 0.95, zs + 0.5];
  const orb2 = Math.sin(t * 0.22) * 0.2; // slow orbit while they talk: motion parallax shows the depth of the objects
  const sp = [1.9 + orb2, 2.05 + bob, zs - 7.4], sl = [0.75, 1.25, zs - 0.6];
  return { pos: wp.map((v, i) => lerp(v, sp[i], k)), look: wl.map((v, i) => lerp(v, sl[i], k)) };
};
const projCam = new THREE.PerspectiveCamera(FOV, Wd / Hd, 0.1, 400);
export const project = (t, x, y, z) => { const c = camPose(t); projCam.position.set(...c.pos); projCam.lookAt(...c.look); projCam.updateMatrixWorld(); projCam.updateProjectionMatrix(); const v = new THREE.Vector3(x, y, z); const d = v.distanceTo(projCam.position); v.project(projCam); return [(v.x + 1) / 2 * Wd, (1 - v.y) / 2 * Hd, d, v.z < 1]; };
const CamRig = ({ t }) => { const { camera } = useThree(); const c = camPose(t); camera.fov = FOV; camera.far = 400; camera.position.set(...c.pos); camera.lookAt(...c.look); camera.updateProjectionMatrix(); return null; };

const rnd = (s) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
// sky looks (prop "sky"); 'teal' = the current look. Only the sky changes; the floor grid stays.
const SKIES = {
  teal:     { top: '#05090f', mid: TH.fog, horizon: TH.horizon, bg: TH.bg, fog: TH.fog, neb: TH.neb, sun: 'rgba(255,214,170,0.55)' },
  midnight: { top: '#03050f', mid: '#0d1638', horizon: '#1d2f6b', bg: '#050918', fog: '#0f1a3d', neb: ['96,165,250', '129,140,248', '56,189,248'], sun: 'rgba(200,220,255,0.5)' },
  violet:   { top: '#07030f', mid: '#1c0f38', horizon: '#3b1d6e', bg: '#0b0618', fog: '#1d1238', neb: ['167,139,250', '232,121,249', '99,102,241'], sun: 'rgba(240,200,255,0.5)' },
  sunset:   { top: '#060816', mid: '#2a1636', horizon: '#7a3b2e', bg: '#0a0a16', fog: '#2b1a2e', neb: ['251,146,60', '244,114,182', '129,140,248'], sun: 'rgba(255,190,120,0.75)' },
  aurora:   { top: '#030812', mid: '#0a1a33', horizon: '#173a5a', bg: '#050c18', fog: '#0c1d33', neb: ['52,211,153', '167,139,250', '244,114,182'], sun: 'rgba(220,240,255,0.5)' },
  rose:     { top: '#0a0408', mid: '#2a0f22', horizon: '#5a1f3e', bg: '#10060d', fog: '#2a1020', neb: ['244,114,182', '251,146,60', '192,132,252'], sun: 'rgba(255,200,210,0.6)' },
};
const SKY = SKIES.teal;   // approved: the teal sky. Other looks were tried and rejected.
const useSky = () => useMemo(() => {
  const W = 2048, H = 1024, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, SKY.top); bg.addColorStop(0.45, SKY.mid); bg.addColorStop(0.5, SKY.horizon); bg.addColorStop(0.56, TH.floor); bg.addColorStop(1, '#05090a');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const blob = (x, y, r, c) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); };
  for (let i = 0; i < 26; i++) { const x = rnd(i) * W, y = 120 + rnd(i + 50) * 380; const c = [[SKY.neb[0], 0.12], [SKY.neb[1], 0.14], [SKY.neb[2], 0.09]][i % 3]; blob(x, y, 120 + rnd(i + 9) * 260, `rgba(${c[0]},${c[1]})`); }
  blob(W * 0.73, H * 0.3, 70, SKY.sun); // a warm distant sun
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = THREE.RepeatWrapping; return tx;
}, []);
// floor grid colours (prop "grid"): main lines, fine lines
const GRIDS = { teal: [TH.grid, TH.grid], white: ['235,240,245', '235,240,245'], yellow: ['250,204,21', '250,204,21'], blue: ['56,189,248', '56,189,248'],
  violet: ['167,139,250', '167,139,250'], orange: ['249,115,22', '249,115,22'], pink: ['244,114,182', '244,114,182'], tealviolet: [TH.grid, '167,139,250'], blueyellow: ['56,189,248', '250,204,21'] };
const GRID = GRIDS.teal; // approved: the teal (green neon) grid.
const useGrid = () => useMemo(() => {
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  g.fillStyle = TH.floor; g.fillRect(0, 0, S, S);
  for (let n = 0; n < 1600; n++) { g.fillStyle = `rgba(120,200,180,${0.015 + rnd(n) * 0.03})`; g.fillRect(rnd(n * 2.3) * S, rnd(n * 5.1) * S, 2, 2); }
  g.strokeStyle = `rgba(${GRID[0]},0.55)`; g.lineWidth = 3; g.shadowColor = `rgba(${GRID[0]},0.9)`; g.shadowBlur = 8;
  g.beginPath(); g.moveTo(0, 1.5); g.lineTo(S, 1.5); g.moveTo(1.5, 0); g.lineTo(1.5, S); g.stroke();
  g.strokeStyle = `rgba(${GRID[1]},0.14)`; g.lineWidth = 1.5; g.shadowBlur = 0; [0.25, 0.5, 0.75].forEach((p) => { g.beginPath(); g.moveTo(0, p * S); g.lineTo(S, p * S); g.moveTo(p * S, 0); g.lineTo(p * S, S); g.stroke(); });
  const tx = new THREE.CanvasTexture(cv); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(60, 220); tx.anisotropy = 16; tx.colorSpace = THREE.SRGBColorSpace; return tx;
}, []);
const useBlob = () => useMemo(() => { const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d'); const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); gr.addColorStop(0, 'rgba(0,4,3,0.8)'); gr.addColorStop(0.5, 'rgba(0,4,3,0.35)'); gr.addColorStop(1, 'rgba(0,4,3,0)'); g.fillStyle = gr; g.fillRect(0, 0, S, S); return new THREE.CanvasTexture(cv); }, []);

// Cinematic star field: three depth layers (far = tiny and dense, mid = small and crisp, near = few bright stars
// with a soft glow). Each layer drifts at its own slow speed (parallax) and every star twinkles on its own phase.
const useDot = (soft) => useMemo(() => { const S = 64, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  if (soft) { gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.12, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.28, 'rgba(255,240,220,0.35)'); gr.addColorStop(1, 'rgba(255,240,220,0)'); }
  else { gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); }
  g.fillStyle = gr; g.fillRect(0, 0, S, S); const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; return tx; }, [soft]);
const LAYERS = [ // n, pixel size (at 1080 wide), brightness, drift (rad/s), twinkle depth, seed
  { n: 3200, size: 2.2, bright: 0.85, drift: 0.0025, tw: 0.45, seed: 1, soft: false },  // far: tiny, dense, slow
  { n: 700, size: 3.6, bright: 1.0, drift: 0.005, tw: 0.5, seed: 2, soft: false },     // mid: small and crisp
  { n: 90, size: 16.0, bright: 1.0, drift: 0.009, tw: 0.3, seed: 3, soft: true },       // near: a few bright stars with a soft glow
];
const useLayer = (L) => useMemo(() => {
  const pos = new Float32Array(L.n * 3), col = new Float32Array(L.n * 3), ph = new Float32Array(L.n * 3);
  for (let i = 0; i < L.n; i++) { const q = i * 3.17 + L.seed * 101;
    // the camera looks down +z with a narrow portrait lens: put the stars in the sky band it actually sees
    const a = Math.PI / 2 + (rnd(q) - 0.5) * 2.4, e = 0.015 + Math.pow(rnd(q + 1.3), 1.15) * 0.62, r = 150;
    pos[i * 3] = Math.cos(a) * Math.cos(e) * r; pos[i * 3 + 1] = Math.sin(e) * r * 0.9 + 2; pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
    ph[i * 3] = rnd(q + 2.1) * 6.283; ph[i * 3 + 1] = 0.5 + rnd(q + 3.7) * 1.8; ph[i * 3 + 2] = 0.55 + rnd(q + 5.9) * 0.45; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return { g, col, ph }; }, [L.seed]);
const StarLayer = ({ t, z0, L }) => { const { g, col, ph } = useLayer(L); const tx = useDot(L.soft);
  for (let i = 0; i < L.n; i++) { const tw = 1 - L.tw * (0.5 + 0.5 * Math.sin(t * ph[i * 3 + 1] + ph[i * 3])); const b = L.bright * ph[i * 3 + 2] * tw; const warm = rnd(i + L.seed) > 0.8; col[i * 3] = b; col[i * 3 + 1] = b * (warm ? 0.92 : 0.98); col[i * 3 + 2] = b * (warm ? 0.8 : 1.0); }
  g.attributes.color.needsUpdate = true;
  return (<points geometry={g} position={[0, 0, z0]} rotation={[0.02 * Math.sin(t * 0.05 + L.seed), t * L.drift, 0]}><pointsMaterial map={tx} size={L.size} sizeAttenuation={false} vertexColors transparent alphaTest={0.02} depthWrite={false} fog={false} blending={THREE.AdditiveBlending} /></points>); };
const Stars = ({ t, z0 }) => <>{LAYERS.map((L) => <StarLayer key={L.seed} t={t} z0={z0} L={L} />)}</>;
// world.look: "universe" (default, approved 2026-11-17: black sky, warm stars, planets, glass-deck floor) or "teal" (Episode 5 sky + green grid)
const LOOK = CFG.world.look || 'universe', UNI = LOOK === 'universe';
if (UNI && SEGS.length) setUniverseT0((SEGS[0][1] + SEGS[SEGS.length - 1][2]) / 2);   // planet motion is centred on the middle of the 3D section
const Space = ({ t }) => {
  const sky = useSky(), grid = useGrid(); const z0 = charZ(t);
  return (<>
    <color attach="background" args={[UNI ? UNIVERSE_BG : SKY.bg]} />
    <fog attach="fog" args={[UNI ? UNIVERSE_FOG : SKY.fog, 18, 95]} />
    {UNI ? <UniverseSky t={t} z0={z0} /> : (<>
      <mesh position={[0, 0, z0]} rotation={[0, t * 0.004, 0]}><sphereGeometry args={[180, 48, 32]} /><meshBasicMaterial map={sky} side={THREE.BackSide} fog={false} /></mesh>
      <Stars t={t} z0={z0} /></>)}
    <hemisphereLight args={['#ffe6c4', '#0b1714', 0.7]} />
    <ambientLight intensity={0.25} />
    <directionalLight position={[3, 9, z0 - 6]} intensity={1.0} color="#ffe0b6" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-camera-far={40} shadow-bias={-0.0004} target-position={[0, 0, z0 - 2]} />
    <pointLight position={[OX, 3.2, z0 - 1.4]} intensity={14} distance={10} decay={2} color="#ffc98a" />
    <pointLight position={[-2.5, 2.5, z0 - 3]} intensity={6} distance={9} decay={2} color="#7ee8d6" />
    {UNI ? <GlassFloor t={t} z0={z0} zc={-GAP * 6} /> : <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -GAP * 6]} receiveShadow><planeGeometry args={[240, 880]} /><meshStandardMaterial map={grid} emissiveMap={grid} emissive="#ffffff" emissiveIntensity={0.55} roughness={0.32} metalness={0.25} /></mesh>}
  </>);
};

const BF = F.bold; let fontsOk = false;
const useFontsReady = () => { const [ok, setOk] = useState(fontsOk);
  useEffect(() => { if (ok) return; const h = delayRender('tile fonts'); let n = 0;
    const tick = () => { if (document.fonts.check(`800 40px ${BF}`)) { fontsOk = true; setOk(true); continueRender(h); } else if (n++ < 200) setTimeout(tick, 25); else continueRender(h); }; tick(); }, [ok]);
  return ok; };
const stopOf = (k) => SEGS.find((s) => s[0] === 'stop' && s[3] === k);
// popT = the frame the first tile breaks the floor (mix3d.py puts the rise SFX peak here, cfg.world.pops)
export const popT = (k) => (CFG.world.pops && CFG.world.pops[k] != null ? CFG.world.pops[k] : (stopOf(k) ? stopOf(k)[1] - 0.5 : 1e9));
const sinkT = (k) => (k === (CFG.world.stations || []).length - 1 ? 1e9 : stopOf(k) ? stopOf(k)[2] - 0.2 : 1e9);   // the last box stays up: it is the end frame pinned to the board       // sinks back into the floor as they set off
// pedestal layout (solved with a projection check so nothing touches a character and the left edge keeps a gap):
// one model: a 0.48 m pedestal turned 0.7 rad. LAY[2]/LAY[3] are only used if a multi-model table is ever forced.
const LAY = { 1: { x: 1.45, z: 0.0, yaw: 0.7 }, 2: { x: 1.3, z: -0.35, yaw: 0.55 }, 3: { x: 1.3, z: -0.1, yaw: 0.65, sp: 0.36 } };
// two or more models: no table. Each pops out of the floor to its own spot (Pixar pop) and hovers; the first at hand
// height screen-left, the next higher and further back, so the station reads in depth and never crowds the Professor.
const FSLOT = [[1.5, 0.62, -0.9], [1.45, 1.5, 0.9], [1.25, 2.15, 2.0]];   // solved: >= 60 px from the left edge, >= 70 px from his hand, labels clear
const FSCALE = [1.4, 1.8, 2.0];   // per slot: further-back slots are bigger so every object reads the same size
const PSCALE = 1.25;               // objects on the single pedestal
const labelY = (kind, ms) => ((MODELS[kind] && MODELS[kind].h) || 0.34) * 1.15 * ms + 0.12;
const lay = (n) => LAY[Math.min(3, Math.max(1, n))];
const AX = 1.3, AZ = -0.6;
const K = (t, c, d = 0.5) => (c == null ? 0 : clamp((t - c) / d));
const useNameTex = (txt, ready) => useMemo(() => { const W = 900, H = 200, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  let fs = 120; g.font = `800 ${fs}px ${BF}`; while (g.measureText(txt).width > W - 40 && fs > 50) { fs -= 4; g.font = `800 ${fs}px ${BF}`; } g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = 'rgba(0,0,0,0.85)'; g.shadowBlur = 16; g.fillStyle = '#fbf6ee'; g.fillText(txt, W / 2, H / 2 + 6); g.shadowBlur = 0; g.fillText(txt, W / 2, H / 2 + 6);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; return tx; }, [txt, ready]);

// one model on the cap: pops up on its cue word, turns slowly; when switched off (greyed) it dims and shrinks
const ModelOn = ({ m, t, x, face, lface = face, ready, H0, ly = 0.66, grow = true, ms = 1 }) => {
  const R = MODELS[m.kind]; const name3 = useNameTex(m.label || (R ? R.label : m.kind.toUpperCase()), ready);   // hook first, every frame
  const sc = grow ? backE(K(t, m.at, 0.6)) : (t >= m.at - 0.15 ? 1 : 0); if (sc <= 0.001) return null; const off = m.off != null ? K(t, m.off, 0.6) : 0;
  const M = R ? R.C : null; if (!M) return null;
  return (<group position={[x, H0, 0]}>
    <group rotation={[0, face + 0.18 * Math.sin(t * 0.5 + x * 4), 0]}><group scale={[1 - off * 0.25, 1 - off * 0.25, 1 - off * 0.25]}><M t={t} s={sc * 1.15 * ms} /></group></group>
    {off > 0.02 && <mesh position={[0, 0.3, 0]}><sphereGeometry args={[0.3, 20, 16]} /><meshBasicMaterial color="#0b1311" transparent opacity={0.55 * off} depthWrite={false} clippingPlanes={[FLOOR]} /></mesh>}
    <mesh position={[0, ly, 0]} rotation={[0, lface, 0]}><planeGeometry args={[0.44, 0.098]} /><meshBasicMaterial map={name3} transparent opacity={clamp(sc) * (1 - off * 0.6)} toneMapped={false} depthWrite={false} clippingPlanes={[FLOOR]} /></mesh>
  </group>); };
const STATIONS = CFG.world.stations || [];
// the station box: rises through the floor to hand height (1.4 s from popT), the cap lands (popT + 1.25 s),
// the models appear on their cues, an arrow joins neighbours, and it all sinks back as they walk on
const NeonBoxStation = ({ k, t }) => {
  // all hooks first (same order every frame), then the early return
  const models = (STATIONS[k] && STATIONS[k].models) || []; const n = Math.max(1, models.length); const multi = n > 1;
  const SP = (lay(n).sp || 0.42); const H = NB.h, W = multi ? SP * n - 0.02 : NB.w + 0.06, D = NB.w + 0.06;
  const ready = useFontsReady(); const wood = useWood(); const gBody = useRBox(W, H, D, 0.02); const gFoot = useRBox(W + 0.03, 0.06, D + 0.03, 0.012); const gTop = useRBox(W + 0.06, NB.cap, D + 0.06, 0.012);
  const p0 = popT(k); const rise = sm(K(t, p0, 1.4)); const down = sm(K(t, sinkT(k), 0.8)); if (rise <= 0.001 || down >= 0.999) return null;
  const y0 = -H * (1 - rise) - (H + 1.0) * down;
  const cap = backE(K(t, p0 + 1.25, 0.35)); const glow = 0.9 + 0.1 * Math.sin(t * 2.4);
  const L0 = lay(n); const c = camPose(t).pos; const face = Math.atan2(c[0] - L0.x, c[2] - (ZK(k) + L0.z)); const YAW = L0.yaw;
  const X = (i) => (i - (n - 1) / 2) * SP;
  return (<group rotation={[0, face + YAW, 0]}>
    <group position={[0, y0, 0]}>
      {/* pedestal body: warm walnut, rounded edges, a darker plinth at the foot, two brass inlays */}
      <mesh position={[0, H / 2, 0]} geometry={gBody}><meshPhysicalMaterial map={wood} color="#b07a52" roughness={0.55} clearcoat={0.35} clearcoatRoughness={0.4} clippingPlanes={[FLOOR]} /></mesh>
      <mesh position={[0, 0.03, 0]} geometry={gFoot}><meshPhysicalMaterial color="#3b2416" roughness={0.6} clippingPlanes={[FLOOR]} /></mesh>
      {[0.32, 0.68].map((f) => <mesh key={f} position={[0, H * f, D / 2 + 0.0015]}><boxGeometry args={[W * 0.86, 0.006, 0.003]} /><meshStandardMaterial color="#c9a46a" roughness={0.3} metalness={0.8} clippingPlanes={[FLOOR]} /></mesh>)}
      {cap > 0.001 && (<group position={[0, H + lerp(0.06, 0, clamp(cap)), 0]}>
        {/* the top: a lighter oak slab on a thin brass edge */}
        <mesh position={[0, NB.cap / 2, 0]} geometry={gTop}><meshPhysicalMaterial map={wood} color="#8a5a38" roughness={0.6} clearcoat={0.15} clearcoatRoughness={0.5} clippingPlanes={[FLOOR]} /></mesh>
        <mesh position={[0, 0.004, 0]}><boxGeometry args={[W + 0.065, 0.006, D + 0.065]} /><meshStandardMaterial color="#c9a46a" roughness={0.3} metalness={0.85} clippingPlanes={[FLOOR]} /></mesh>
        {models.map((m, i) => <ModelOn key={i} m={m} t={t} x={X(i)} face={-YAW * 0.55} lface={-YAW} ready={ready} H0={NB.cap} ly={Math.max(0.66, labelY(m.kind, PSCALE))} ms={PSCALE} />)}
        {models.slice(1).map((m, i) => { if (K(t, models[i].at, 0.6) < 1 || K(t, m.at, 0.6) < 1) return null; const a = sm(K(t, m.at + 0.3, 0.5)); const Ln = 0.12 * a;
          return <group key={'ar' + i} position={[(X(i) + X(i + 1)) / 2, NB.cap + 0.3, 0]} rotation={[0, 0, Math.PI / 2]}><mesh position={[0, Ln / 2 - 0.06, 0]}><cylinderGeometry args={[0.007, 0.007, Ln, 8]} /><meshStandardMaterial color="#e8e2d6" roughness={0.4} clippingPlanes={[FLOOR]} /></mesh>{a > 0.9 && <mesh position={[0, 0.07, 0]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.018, 0.04, 12]} /><meshStandardMaterial color="#e8e2d6" roughness={0.4} clippingPlanes={[FLOOR]} /></mesh>}</group>; })}
      </group>)}
    </group>
    {/* soft contact shadow on the floor instead of a neon glow */}
    <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[multi ? 0.3 * n : 0.4, 48]} /><meshBasicMaterial color="#000000" transparent opacity={0.45 * rise * (1 - down)} depthWrite={false} /></mesh>
  </group>); };
// Pixar pop: a light flash on the floor (anticipation), the object shoots up stretched, overshoots its spot, squashes
// as it settles with a damped wobble, then hovers and turns; a soft shadow under it shrinks as it rises. On exit it
// does a small hop and pops back down into the floor.
const popCurve = (t, at, ty, ex) => {
  const u = (t - (at - 0.15)) / 0.55;                          // 0.15 s anticipation before the cue word, 0.55 s flight
  if (u <= 0) return null;
  let y, sy;
  if (u < 1) { const e = 1 - Math.pow(1 - u, 3); y = ty * (e + 0.12 * Math.sin(Math.PI * u)); sy = 1 + 0.35 * Math.sin(Math.PI * Math.min(1, u * 1.4)); }
  else { const w = u - 1; const d = Math.exp(-5 * w) * Math.sin(13 * w); y = ty + 0.04 * d; sy = 1 - 0.18 * d; }
  y += 0.025 * Math.sin(t * 1.7 + ty * 5) * clamp(u - 1.2);   // hover
  let k = 1; if (ex != null) { const v = clamp((t - ex) / 0.45); y += 0.08 * Math.sin(Math.PI * Math.min(1, v * 1.6)); k = 1 - sm(clamp((v - 0.35) / 0.65)); }
  const sxz = 1 / Math.sqrt(sy); return { y, sy: sy * k, sxz: sxz * k, u };
};
const FloatStation = ({ k, t }) => {
  const models = (STATIONS[k] && STATIONS[k].models) || []; const ready = useFontsReady(); const ex = sinkT(k) < 1e8 ? sinkT(k) : null;
  const msOf = (kind, i) => FSCALE[i % 3] * ((MODELS[kind] && MODELS[kind].fs) || 1);
  // each next object floats above the previous one's label, so a tall object never pushes its label into the next
  const baseOf = (i) => { let y = FSLOT[0][1]; for (let j = 1; j <= i; j++) y = Math.max(FSLOT[j % 3][1], y + labelY(models[j - 1].kind, msOf(models[j - 1].kind, j - 1)) + 0.12); return y; };
  return (<group position={[0, 0, ZK(k)]}>{models.map((m, i) => {
    const [x, ty0, z] = FSLOT[i % FSLOT.length]; const ms = msOf(m.kind, i); const ty = i ? Math.max(ty0, baseOf(i - 1) + labelY(models[i - 1].kind, msOf(models[i - 1].kind, i - 1)) + 0.12) : ty0;
    const at = m.at != null ? m.at : popT(k) + 0.6; const p = popCurve(t, at, ty, ex);
    if (!p || p.sy <= 0.01) return null; const c = camPose(t).pos; const face = Math.atan2(c[0] - x, c[2] - (ZK(k) + z));
    const flash = Math.exp(-Math.max(0, t - (at - 0.15)) * 4); const sh = clamp(1 - p.y / 2.2) * Math.min(1, p.sxz);
    return (<group key={i} position={[x, 0, z]}>
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.1, 0.17 + 0.1 * (1 - flash), 48]} /><meshBasicMaterial color="#fff1d6" transparent opacity={0.85 * flash} toneMapped={false} depthWrite={false} /></mesh>
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.2, 40]} /><meshBasicMaterial color="#000000" transparent opacity={0.5 * sh} depthWrite={false} /></mesh>
      <group position={[0, p.y, 0]} scale={[p.sxz, p.sy, p.sxz]}><ModelOn m={{ ...m, at }} t={t} x={0} face={face + 0.35} lface={face} ready={ready} H0={0} ly={labelY(m.kind, ms)} grow={false} ms={ms} /></group>
    </group>); })}</group>);
};
const Station = ({ k, t }) => { const n = ((STATIONS[k] && STATIONS[k].models) || []).length; if (n > 1) return <FloatStation k={k} t={t} />; const L0 = lay(n); return <group position={[L0.x, 0, ZK(k) + L0.z]}><NeonBoxStation k={k} t={t} /></group>; };
const stationVisible = (t, k) => { const s = stopOf(k); return s && t > popT(k) - 1 && t < sinkT(k) + 1.0; };
/* ---------- the two characters ---------- */
// which clip each person shows, and where in it: walking loop, idle loop, or their lip-synced chunk
// talk windows come from the script's lines inside the 3D part (any episode), not from any ElevenLabs clip
const talkWin = (who) => Object.values(LN).filter((l) => l.who === who && l.t0 >= CFG.mid.t0 - 0.5 && l.t1 <= CFG.pull.t0 + 0.5).map((l) => ({ a: l.t0 - 0.12, b: l.t1 + 0.3 }));
const TW_P = talkWin('P'), TW_E = talkWin('S');
// Remotion lip sync for 3D: real lip-sync frames re-sequenced to the line (lipcal/three/reseq.py)
const RS = (who, t) => { const r = RESEQ[who === 'P' ? 'P' : 'S']; return r && r[Math.round(t * 30)]; };
const clipAt = (who, t) => {
  const s = segAt(t); const k = stopK(t);
  if (s[0] === 'walk' || k < 0.3) return [{ clip: `walk${who}`, ct: t, o: 1 }];
  const W = who === 'P' ? TW_P : TW_E;
  const w = W.find((x) => t >= x.a - 0.2 && t < x.b + 0.2);
  if (!w) return [{ clip: `idle${who}`, ct: t - s[1], o: 1 }];
  const fin = clamp((t - (w.a - 0.2)) / 0.2) * (1 - clamp((t - w.b) / 0.2));
  const r = RS(who, t);
  // Remotion lip sync for 3D: real talking frames re-sequenced to this line (python/reseq.py -> reseq.json)
  if (r) return fin >= 0.5 ? [{ clip: r[0], fixed: r[1], o: 1 }] : [{ clip: `idle${who}`, ct: t - s[1], o: 1 }];   // hard cut: a dissolve shows two bodies
  return [{ clip: `idle${who}`, ct: t - s[1], o: 1 }];
};
const Sprite = ({ who, t }) => {
  const x = who === 'P' ? PX : EX; const z = charZ(t) + (who === 'P' ? 0 : EZ * stopK(t));
  const [fx, fy, d] = project(t, x, 0, z); const [, hy] = project(t, x, 1.72, z);
  return clipAt(who, t).filter((c) => c.o > 0.01).map((c, i) => {
    const m = META[c.clip]; const f = c.fixed != null ? c.fixed : c.once ? Math.min(m.n - 1, Math.floor(c.ct * m.fps)) : Math.floor(((c.ct * m.fps) % m.n + m.n) % m.n);
    const s = (fy - hy) / m.h; const W = m.w * s, H = m.H * s;
    return <Img key={i} src={staticFile(`ep3d/${m.dir || c.clip}/${String(f).padStart(4, '0')}.png`)} style={{ position: 'absolute', left: fx - m.cx * s, top: fy - m.feet * s, width: W, height: H, opacity: c.o, filter: 'saturate(1.05) contrast(1.04) brightness(0.97)' }} />;
  });
};
const Blobs = ({ t }) => { const tx = useBlob(); const z = charZ(t); return [PX, EX].map((x, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, z + (i ? EZ * stopK(t) : 0)]}><planeGeometry args={[0.95, 0.5]} /><meshBasicMaterial map={tx} transparent depthWrite={false} /></mesh>); };

/* ---------- composed ---------- */
const enableClip = ({ gl }) => { gl.localClippingEnabled = true; };
export const World3D = ({ t }) => {
  const ks = STATIONS.map((_, k) => k).filter((k) => stationVisible(t, k)); const zc = charZ(t);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <ThreeCanvas width={Wd} height={Hd} shadows camera={{ fov: FOV, near: 0.1, far: 400, position: [0, 2, 6] }} gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <CamRig t={t} />
        <Space t={t} />
        <Blobs t={t} />
      </ThreeCanvas>
      <Sprite who="P" t={t} />
      <Sprite who="E" t={t} />
      {ks.length > 0 && (
        <ThreeCanvas width={Wd} height={Hd} style={{ position: 'absolute', inset: 0 }} onCreated={enableClip} camera={{ fov: FOV, near: 0.1, far: 400, position: [0, 2, 6] }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}>
          <CamRig t={t} /><StudioEnv /><hemisphereLight args={['#fff4e6', '#1a2622', 0.7]} /><directionalLight position={[2.5, 5, zc - 6]} intensity={1.6} color="#ffe8cc" /><directionalLight position={[-3, 2.5, zc - 4]} intensity={0.5} color="#cfe8ff" /><ambientLight intensity={0.2} />
          {ks.map((k) => <Station key={k} k={k} t={t} />)}
        </ThreeCanvas>
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 46%, transparent 58%, rgba(2,6,5,0.5))', pointerEvents: 'none' }} />
    </div>
  );
};
export const WORLD_END_T = CFG.pull.t0 - 0.05;
