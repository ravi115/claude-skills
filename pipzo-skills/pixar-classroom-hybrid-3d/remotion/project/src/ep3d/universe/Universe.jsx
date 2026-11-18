// UNIVERSE LOOK for the 3D middle (approved on LLM-GPT2 Episode 4, 2026-11-17).
// Night-black sky with warm glowing stars and a barely-there Milky Way, nine spinning planets of mixed sizes (one huge
// planet showing only its lower half along the top edge), and a dark glass-deck floor with stars visible below it.
// Used by World3D.jsx when episode.json sets world.look = "universe" (the default). Do not edit per episode.
import React, { useMemo } from 'react';
import * as THREE from 'three';
const rnd = (s) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
// motion is measured from the middle of the 3D section (T0) and bounded, so long middles never wheel planets out of view
let T0 = 0; export const setUniverseT0 = (t) => { T0 = t; };
const swing = (t, rate, A = 0.3) => A * Math.sin(((t - T0) * rate) / A);
const useDot = (soft) => useMemo(() => { const S = 64, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  if (soft) { gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.12, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.28, 'rgba(255,240,220,0.35)'); gr.addColorStop(1, 'rgba(255,240,220,0)'); }
  else { gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); }
  g.fillStyle = gr; g.fillRect(0, 0, S, S); const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; return tx; }, [soft]);
// equirect sky: deep space, a Milky Way band (tilted, wavy) with a warm core, dark dust lanes, coloured nebula and ~70k stars
const useMilkyWay = () => useMemo(() => {
  const W = 4096, H = 2048, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.fillStyle = '#020203'; g.fillRect(0, 0, W, H);   // night black, no blue
  const yAt = (x) => H * (0.45 + 0.012 * Math.sin((x / W) * Math.PI * 4 + 0.6));
  const blob = (x, y, rx, ry, c) => { g.save(); g.translate(x, y); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(-rx, -rx, 2 * rx, 2 * rx); g.restore(); };
  g.globalCompositeOperation = 'lighter';
  // a very faint warm Milky Way haze, barely there
  for (let i = 0; i < 260; i++) { const x = rnd(i * 1.7) * W; const y = yAt(x) + (rnd(i * 2.3) - 0.5) * 70;
    blob(x, y, 120 + rnd(i * 4.4) * 260, 20 + rnd(i * 6.6) * 30, `rgba(255,236,210,${0.008 + 0.01 * rnd(i * 9)})`); }
  // stars: warm white points; brighter ones get a soft glow
  const star = (x, y, r, a, warm) => { const c = warm ? '255,226,190' : '255,248,236';
    if (r > 1.2) { const gr = g.createRadialGradient(x, y, 0, x, y, r * 5); gr.addColorStop(0, `rgba(${c},${a * 0.55})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r * 5, y - r * 5, r * 10, r * 10); }
    g.fillStyle = `rgba(${c},${a})`; g.beginPath(); g.arc(x, y, r * 0.6, 0, 6.283); g.fill(); };
  for (let i = 0; i < 9000; i++) { const x = rnd(i * 0.37 + 3) * W; const nearBand = rnd(i * 0.91 + 7) < 0.35;
    const y = nearBand ? yAt(x) + (rnd(i * 1.13) + rnd(i * 1.77) - 1) * 80 : rnd(i * 1.39 + 11) * H * 0.5;
    if (y > H * 0.5) continue; const b = rnd(i * 2.71);
    star(x, y, b > 0.992 ? 3.2 : b > 0.96 ? 1.8 : 1.0, b > 0.96 ? 0.95 : 0.35 + b * 0.4, rnd(i * 3.3) < 0.45); }
  g.globalCompositeOperation = 'source-over';
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = THREE.RepeatWrapping; tx.anisotropy = 8; return tx; }, []);
// planet surface textures, drawn in code: banded gas giants, cratered rock, icy worlds
const usePlanetTex = (kind, seed) => useMemo(() => {
  const W = 1024, H = 512, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const P = {
    giant: ['#c98f5a', '#e8c79a', '#a8683e', '#f1dcb6', '#8c5634'], ice: ['#7fb8e6', '#b9dcf5', '#5b93c9', '#e2f1fb', '#4a7fb5'],
    lav: ['#8f9bc9', '#c3cbeb', '#6b76a8', '#e4e8f7', '#545e8f'],
    rose: ['#c86f8f', '#e9a7bd', '#9d4f6d', '#f3cfdc', '#7d3a55'], teal: ['#3fae9e', '#7fd6c8', '#2b8577', '#bdeee6', '#1f6359'],
  }[kind] || ['#8a7a6a', '#a89888', '#6b5b4b', '#c9b9a9', '#544434'];
  if (kind === 'rock') {
    g.fillStyle = P[0]; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 2600; i++) { const x = rnd(i + seed) * W, y = rnd(i * 1.3 + seed) * H, r = 1 + Math.pow(rnd(i * 2.1 + seed), 6) * 40; g.fillStyle = rnd(i * 4 + seed) < 0.5 ? P[2] : P[3]; g.globalAlpha = 0.25; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); }
    g.globalAlpha = 1;
  } else {
    for (let x = 0; x < W; x += 4) for (let y = 0; y < H; y += 2) { const u = x / W, v = y / H;   // wavy bands that change with longitude
      const w = v + 0.035 * Math.sin(u * 6.283 * 3 + seed + v * 9) + 0.02 * Math.sin(u * 6.283 * 7 + seed * 3);
      const k = Math.floor((Math.sin(w * 38 + seed) * 0.5 + 0.5) * 4.99 + Math.sin(w * 9 + seed * 2) * 0.8); g.fillStyle = P[Math.max(0, Math.min(4, k))]; g.fillRect(x, y, 4, 2); }
    for (let i = 0; i < 40; i++) { const x = rnd(i * 7 + seed) * W, y = (0.15 + 0.7 * rnd(i * 11 + seed)) * H; g.fillStyle = P[(i + 1) % 5]; g.globalAlpha = 0.5; g.beginPath(); g.ellipse(x, y, 14 + rnd(i * 3) * 50, 5 + rnd(i * 5) * 12, 0, 0, 6.283); g.fill(); }   // swirls and spots
    g.globalAlpha = 0.18; for (let i = 0; i < 900; i++) { const y = rnd(i + seed) * H; g.fillStyle = P[i % 5]; g.fillRect(0, y, W, 1 + rnd(i * 3) * 4); }   // fine streaks
    g.globalAlpha = 1;
    if (kind === 'giant') { g.fillStyle = 'rgba(170,80,50,0.55)'; g.beginPath(); g.ellipse(W * 0.62, H * 0.62, 90, 38, 0, 0, 6.283); g.fill(); }   // a storm spot
  }
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; return tx; }, [kind, seed]);
const useRingTex = () => useMemo(() => { const W = 1024, cv = document.createElement('canvas'); cv.width = W; cv.height = 8; const g = cv.getContext('2d');
  for (let x = 0; x < W; x++) { const u = x / W; const a = (0.35 + 0.45 * Math.abs(Math.sin(u * 40)) * (0.6 + 0.4 * Math.sin(u * 7))) * (u < 0.08 || u > 0.96 ? 0 : 1) * (Math.abs(u - 0.62) < 0.02 ? 0.1 : 1);
    g.fillStyle = `rgba(${225 - u * 40},${200 - u * 50},${165 - u * 50},${a})`; g.fillRect(x, 0, 1, 8); }
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; return tx; }, []);
// a ring geometry with radial UVs, so the ring texture runs from the inner edge to the outer edge
const useRingGeo = (r0, r1) => useMemo(() => { const geo = new THREE.RingGeometry(r0, r1, 128, 1); const pos = geo.attributes.position, uv = geo.attributes.uv; const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); uv.setXY(i, (v.length() - r0) / (r1 - r0), 0.5); } return geo; }, [r0, r1]);
const Planet = ({ t, kind, seed, r, az, el, dist, spin, tilt = 0.3, ring, drift = 0, glow = 0 }) => {
  az = az + swing(t, drift);
  const tex = usePlanetTex(kind, seed); const ringTex = useRingTex(); const ringGeo = useRingGeo(r * 1.35, r * 2.3);
  const p = [Math.cos(az) * Math.cos(el) * dist, Math.sin(el) * dist, Math.sin(az) * Math.cos(el) * dist];
  return (<group position={p} rotation={[tilt, 0, 0.25]}>
    <mesh rotation={[0, t * spin, 0]}><sphereGeometry args={[r, 64, 48]} /><meshStandardMaterial map={tex} roughness={0.85} metalness={0} fog={false} emissive={glow ? "#ffffff" : "#1a1f3a"} emissiveMap={glow ? tex : null} emissiveIntensity={glow || 0.15} /></mesh>
    {/* thin atmosphere rim */}
    <mesh scale={[1.04, 1.04, 1.04]}><sphereGeometry args={[r, 48, 32]} /><meshBasicMaterial color={kind === 'ice' ? '#9fd4ff' : kind === 'teal' ? '#7ff0dc' : '#ffd9a8'} transparent opacity={0.07} side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>
    {ring && <mesh geometry={ringGeo} rotation={[Math.PI / 2 - 0.2, 0, 0]}><meshStandardMaterial map={ringTex} transparent side={THREE.DoubleSide} roughness={0.9} fog={false} depthWrite={false} /></mesh>}
  </group>); };
// the planets: a mix of sizes and distances, all turning on their axes while the whole sky slowly wheels
const PLANETS = [   // visible sky in this portrait frame: about 0-12 deg up, +-11 deg across (+az = screen-left)
  { kind: 'lav', seed: 1, r: 8.5, az: Math.PI / 2 - 0.09, el: 0.135, dist: 140, spin: 0.35, ring: true },
  { kind: 'ice', seed: 2, r: 3.6, az: Math.PI / 2 + 0.11, el: 0.16, dist: 130, spin: 0.6 },
  { kind: 'rose', seed: 4, r: 2.0, az: Math.PI / 2 + 0.17, el: 0.075, dist: 135, spin: 0.7 },
  { kind: 'rock', seed: 3, r: 0.9, az: Math.PI / 2 + 0.02, el: 0.19, dist: 120, spin: 0.9 },
  { kind: 'teal', seed: 5, r: 1.2, az: Math.PI / 2 - 0.19, el: 0.07, dist: 125, spin: 1.0 },
  { kind: 'rock', seed: 6, r: 0.55, az: Math.PI / 2 - 0.01, el: 0.06, dist: 115, spin: 1.1 },
  { kind: 'ice', seed: 7, r: 1.4, az: Math.PI / 2 + 0.3, el: 0.12, dist: 130, spin: 0.5 },
  { kind: 'giant', seed: 9, r: 30, az: Math.PI / 2 + 0.05, el: 0.34, dist: 150, spin: 0.12, tilt: 0.15, drift: -0.012, glow: 0.45 },   // huge, only its lower half shows, sliding along the top edge
  { kind: 'giant', seed: 8, r: 2.6, az: Math.PI / 2 - 0.32, el: 0.13, dist: 135, spin: 0.45 },
];
export const UniverseSky = ({ t, z0 }) => { const mw = useMilkyWay();
  return (<group position={[0, 0, z0]}>
    <mesh rotation={[0, (t - T0) * 0.012, 0]}><sphereGeometry args={[180, 64, 48]} /><meshBasicMaterial map={mw} side={THREE.BackSide} fog={false} /></mesh>
    <group rotation={[0, swing(t, 0.008), 0]}>{PLANETS.map((pl, i) => <Planet key={i} t={t} {...pl} />)}</group>
    <directionalLight position={[-80, 40, 60]} intensity={2.2} color="#fff1dc" />
  </group>); };

/* ---------- glass-deck floor: dark tinted glass panels with thin frosted seams, stars visible below ---------- */
const canvasTex = (S, draw, rep) => { const cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d'); draw(g, S);
  const tx = new THREE.CanvasTexture(cv); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; if (rep) tx.repeat.set(rep[0], rep[1]); tx.anisotropy = 16; tx.colorSpace = THREE.SRGBColorSpace; return tx; };
const useSeams = () => useMemo(() => canvasTex(512, (g, S) => { g.clearRect(0, 0, S, S); g.fillStyle = 'rgba(10,16,32,0.0)';
  g.strokeStyle = 'rgba(159,180,200,0.5)'; g.lineWidth = 7; g.strokeRect(1.5, 1.5, S - 3, S - 3);
  g.strokeStyle = 'rgba(159,180,200,0.16)'; g.lineWidth = 3; g.strokeRect(22, 22, S - 44, S - 44); }, [80, 290]), []);
const UnderStars = ({ t, z0 }) => { const geo = useMemo(() => { const n = 2600, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (rnd(i * 1.1) - 0.5) * 60; pos[i * 3 + 1] = -2 - rnd(i * 2.2) * 10; pos[i * 3 + 2] = rnd(i * 3.3) * 120 - 10; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); return g; }, []); const tx = useDot(true);
  return <points geometry={geo} position={[0, 0, z0]} renderOrder={1}><pointsMaterial map={tx} size={9} sizeAttenuation={false} color="#fff1dc" transparent depthWrite={false} fog={false} blending={THREE.AdditiveBlending} /></points>; };
export const GlassFloor = ({ t, z0, zc }) => { const seams = useSeams(); const G = <planeGeometry args={[240, 880]} />;
  return (<>
    <UnderStars t={t} z0={z0} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, zc]} receiveShadow renderOrder={2}>{G}<meshStandardMaterial color="#0a1020" roughness={0.15} metalness={0.4} transparent opacity={0.72} polygonOffset polygonOffsetFactor={4} polygonOffsetUnits={4} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, zc]} renderOrder={3}>{G}<meshBasicMaterial map={seams} transparent depthWrite={false} /></mesh>
  </>); };
// world.look = "universe": background and fog colours for the Space scene
export const UNIVERSE_BG = '#020203', UNIVERSE_FOG = '#030405';
