// PER EPISODE: Episode 5 cold open (beat 1). A real 3D laptop (aluminium body, screen as wide as the base, keyboard
// with lettered keys, trackpad) open on a vendor's quote page for a medical chatbot; the price ticks up
// ($1 -> $100,000, six figures) in time with the tick cue (E1 + 0.05 s, every 0.45 s).
// Emily's portrait (lip-synced, she speaks the hook) sits under it, above the caption (1680).
import React, { useMemo } from 'react';
import { Img, staticFile } from 'remotion';
import * as THREE from 'three';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { clamp } from '../../llm1/theme.js';
import { Face } from '../../rig/Face';
import CFG from '../cfg.json';
import VIS from '../vis.json';
import NAT from '../visnat.json';

const PINK = '#F472B6';
const Env = () => { const { gl, scene } = useThree(); useMemo(() => { const pm = new THREE.PMREMGenerator(gl); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.9; }, [gl, scene]); return null; };
const Cam = ({ d }) => { const { camera } = useThree(); camera.position.set(0, 0.78, 2.55 - d); camera.lookAt(0, 0.25, -0.1); camera.updateProjectionMatrix(); return null; };

// keyboard deck texture: dark keycaps with their characters, the trackpad below
const ROWS = [['esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', '⏻'],
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'delete'], ['tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
  ['caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'return'], ['shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'shift'],
  ['fn', 'ctrl', 'opt', 'cmd', '', 'cmd', 'opt', '◀', '▲▼', '▶']];
const WIDE = { delete: 1.5, tab: 1.5, caps: 1.8, return: 1.8, shift: 2.35, '': 5.6, cmd: 1.25, esc: 1.5 };
const useKeyboardTex = () => useMemo(() => {
  const Wc = 2048, Hc = 1434, cv = document.createElement('canvas'); cv.width = Wc; cv.height = Hc; const g = cv.getContext('2d');
  const al = g.createLinearGradient(0, 0, 0, Hc); al.addColorStop(0, '#45484e'); al.addColorStop(1, '#3a3d42'); g.fillStyle = al; g.fillRect(0, 0, Wc, Hc);
  const x0 = 150, x1 = Wc - 150; let y = 60;
  ROWS.forEach((row, r) => { const h = r === 0 ? 62 : 108; const units = row.reduce((a, k) => a + (WIDE[k] || 1), 0); const gap = 12; const u = (x1 - x0 - gap * (row.length - 1)) / units; let x = x0;
    row.forEach((k) => { const w = u * (WIDE[k] || 1);
      g.fillStyle = '#0d0e10'; g.beginPath(); g.roundRect(x, y, w, h, 12); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.05)'; g.beginPath(); g.roundRect(x + 3, y + 3, w - 6, h * 0.45, 10); g.fill();
      g.fillStyle = '#e9eaec'; g.font = `500 ${k.length > 2 || r === 0 ? 30 : 44}px Inter, sans-serif`; g.textAlign = k.length > 2 ? 'left' : 'center'; g.textBaseline = 'middle';
      g.fillText(k, k.length > 2 ? x + 18 : x + w / 2, y + h / 2 + 2); x += w + gap; });
    y += h + 14; });
  g.fillStyle = 'rgba(255,255,255,0.05)'; g.beginPath(); g.roundRect(Wc / 2 - 380, y + 40, 760, Hc - y - 80, 26); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 3; g.stroke();
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 16; return tx; }, []);

// the screen: a browser open on the vendor's quote page, redrawn every frame (the price ticks)
const drawPage = (g, Wc, Hc, num, bump) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, Wc, Hc);
  g.fillStyle = '#dee1e6'; g.fillRect(0, 0, Wc, 92);
  [['#ff5f57', 40], ['#febc2e', 82], ['#28c840', 124]].forEach(([c, x]) => { g.fillStyle = c; g.beginPath(); g.arc(x, 46, 15, 0, 7); g.fill(); });
  g.fillStyle = '#fff'; g.beginPath(); g.roundRect(180, 22, 520, 70, [18, 18, 0, 0]); g.fill();
  g.fillStyle = '#2563eb'; g.beginPath(); g.roundRect(206, 42, 30, 30, 7); g.fill();
  g.fillStyle = '#3c4043'; g.font = '500 30px Inter, sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText('Your quote · MedAssist AI', 252, 58);
  g.fillStyle = '#fff'; g.fillRect(0, 92, Wc, 96); g.fillStyle = '#f1f3f4'; g.beginPath(); g.roundRect(170, 112, Wc - 340, 58, 29); g.fill();
  g.fillStyle = '#5f6368'; g.font = '400 30px Inter, sans-serif'; g.fillText('medassist.ai/quote/medical-chatbot', 210, 142);
  g.fillStyle = '#9aa0a6'; g.font = '400 44px Inter, sans-serif'; g.fillText('‹   ›', 40, 140);
  g.fillStyle = '#e8eaed'; g.fillRect(0, 188, Wc, 2);
  g.fillStyle = '#1d4ed8'; g.beginPath(); g.roundRect(80, 230, 64, 64, 14); g.fill();
  g.fillStyle = '#0f172a'; g.font = '700 40px Inter, sans-serif'; g.fillText('MedAssist AI', 166, 264);
  g.fillStyle = '#64748b'; g.font = '500 30px Inter, sans-serif'; g.textAlign = 'right'; g.fillText('Solutions      Pricing      Contact', Wc - 80, 264); g.textAlign = 'left';
  g.fillStyle = '#f8fafc'; g.strokeStyle = '#e2e8f0'; g.lineWidth = 3; g.beginPath(); g.roundRect(80, 340, Wc - 160, Hc - 400, 28); g.fill(); g.stroke();
  g.fillStyle = '#334155'; g.font = '600 40px Inter, sans-serif'; g.fillText('Custom medical chatbot — build & train', 130, 420);
  g.fillStyle = '#94a3b8'; g.font = '400 30px Inter, sans-serif'; g.fillText('Answers patient questions · 12-month licence', 130, 472);
  g.save(); g.translate(Wc / 2, 720); g.scale(bump, bump); g.fillStyle = '#0f172a'; g.font = '800 250px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('$' + num, 0, 0); g.restore();
  g.fillStyle = '#2563eb'; g.beginPath(); g.roundRect(Wc / 2 - 230, Hc - 210, 460, 96, 48); g.fill();
  g.fillStyle = '#fff'; g.font = '600 38px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('Accept quote', Wc / 2, Hc - 162); g.textAlign = 'left';
};
const useScreenTex = (num, bump) => { const st = useMemo(() => { const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 1300; const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 16; return { cv, tx }; }, []);
  drawPage(st.cv.getContext('2d'), 2048, 1300, num, bump); st.tx.needsUpdate = true; return st.tx; };

const Laptop3D = ({ num, bump, t }) => {
  const kb = useKeyboardTex(); const scr = useScreenTex(num, bump);
  const base = useMemo(() => new RoundedBoxGeometry(1.0, 0.03, 0.7, 4, 0.012), []); const lid = useMemo(() => new RoundedBoxGeometry(1.0, 0.66, 0.012, 4, 0.006), []);
  const alu = <meshPhysicalMaterial color="#4a4d53" metalness={0.8} roughness={0.38} clearcoat={0.2} />;   // space grey
  return (<group rotation={[0, Math.sin(t * 0.4) * 0.03, 0]}>
    <mesh geometry={base} position={[0, 0.015, 0]}>{alu}</mesh>
    <mesh position={[0, 0.0305, 0.03]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.94, 0.94 * 1434 / 2048]} /><meshStandardMaterial map={kb} roughness={0.55} metalness={0.2} /></mesh>
    <group position={[0, 0.03, -0.344]} rotation={[-0.3, 0, 0]}>
      <mesh geometry={lid} position={[0, 0.33, 0]}>{alu}</mesh>
      <mesh position={[0, 0.33, 0.0062]}><planeGeometry args={[0.99, 0.65]} /><meshBasicMaterial color="#09090a" /></mesh>
      <mesh position={[0, 0.345, 0.0068]}><planeGeometry args={[0.9, 0.9 * 1300 / 2048]} /><meshBasicMaterial map={scr} toneMapped={false} /></mesh>
    </group>
  </group>);
};

export const ColdOpen = ({ t }) => {
  const t0 = CFG.lines.E1 ? CFG.lines.E1.t0 + 0.05 : 0.35;
  const zeros = Math.max(0, Math.min(5, Math.floor((t - t0) / 0.45) + 1));
  const num = ('1' + '0'.repeat(zeros)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const ph = (((t - t0) % 0.45) + 0.45) % 0.45 / 0.45; const bump = t > t0 && zeros < 5 ? 1 + 0.05 * (1 - ph) : 1;
  const io = clamp(t / 0.35); const SZ = 540; const dolly = t * 0.025;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Img src={staticFile('llm2/cu_bgS.jpg')} style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, filter: 'blur(16px) brightness(0.5)', transform: 'scale(1.1)' }} />
      <div style={{ position: 'absolute', left: 140, top: 830, width: 800, height: 90, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(0,0,0,0.55), transparent 70%)', filter: 'blur(8px)' }} />
      <ThreeCanvas width={1080} height={1000} style={{ position: 'absolute', left: 0, top: 150 }} camera={{ fov: 30, position: [0, 0.62, 1.95], near: 0.05, far: 20 }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}>
        <Cam d={dolly} /><Env />
        <directionalLight position={[1.2, 2.5, 2]} intensity={1.6} color="#ffe6c8" /><directionalLight position={[-2, 1, 1]} intensity={0.4} color="#d6e6ff" /><ambientLight intensity={0.25} />
        <Laptop3D num={num} bump={bump} t={t} />
      </ThreeCanvas>
      {/* Emily's portrait under the laptop: she speaks the hook */}
      <div style={{ position: 'absolute', left: (1080 - SZ) / 2, top: 1650 - SZ + (1 - io) * 80, width: SZ, height: SZ, opacity: io }}>
        <div style={{ position: 'absolute', left: SZ * 0.12, top: SZ * 0.18, width: SZ * 0.76, height: SZ * 0.76, borderRadius: '50%', background: `radial-gradient(circle, ${PINK}55, transparent 65%)`, filter: 'blur(10px)' }} />
        <div style={{ position: 'absolute', inset: 0, filter: `drop-shadow(0 0 14px ${PINK}88) drop-shadow(0 10px 20px rgba(0,0,0,0.5))` }}>
          <Face who="S" t={t} size={SZ} vis={VIS.w} sched={VIS.s} nat={NAT.w} mirror />
        </div>
      </div>
    </div>
  );
};
