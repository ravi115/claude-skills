// LOCKED 3D parts kit for the station boxes and the idea models. Shared by World3D.jsx and content/Models.jsx.
import React from 'react';
import * as THREE from 'three';
export const FLOOR = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);      // clip everything below the floor: things rise out of it
export const NB = { w: 0.42, h: 1.0, cap: 0.045, col: '#2DD4BF' };
export const NEdge = ({ a, b, col, glow }) => {
  const v = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const len = v.length(); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize());
  return (<group position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} quaternion={q}>
    <mesh><cylinderGeometry args={[0.0065, 0.0065, len, 8]} /><meshBasicMaterial color="#8fe3d3" toneMapped={false} clippingPlanes={[FLOOR]} /></mesh>
    <mesh><cylinderGeometry args={[0.015, 0.015, len, 10]} /><meshBasicMaterial color={col} transparent opacity={0.28 * glow} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} clippingPlanes={[FLOOR]} /></mesh>
    <mesh><cylinderGeometry args={[0.036, 0.036, len, 10]} /><meshBasicMaterial color={col} transparent opacity={0.06 * glow} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} clippingPlanes={[FLOOR]} /></mesh>
  </group>); };
export const nbEdges = (w, h, d, y0 = 0) => { const x = w / 2, z = d / 2; const P = (sx, y, sz) => [sx * x, y0 + y, sz * z]; const E = [];
  [0, h].forEach((y) => { E.push([P(-1, y, -1), P(1, y, -1)], [P(1, y, -1), P(1, y, 1)], [P(1, y, 1), P(-1, y, 1)], [P(-1, y, 1), P(-1, y, -1)]); });
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => E.push([P(sx, 0, sz), P(sx, h, sz)])); return E; };
export const Mat = ({ c, e = 0.25, r = 0.3, m = 0.2, dim = 1 }) => <meshStandardMaterial color={c} emissive={c} emissiveIntensity={e * 0.45 * dim} roughness={r} metalness={m} clippingPlanes={[FLOOR]} />;
