// PER EPISODE: the 3D models that stand on the station caps. Everything here must be real 3D geometry
// (boxes, rounded slabs, tubes, spheres, cones), never a flat picture. Only the name label above a model is flat text.
// Build new models from the kit (Mat = lit colour material, NEdge/nbEdges = neon edges) and keep each one inside
// about 0.36 wide x 0.5 tall at scale 1. Register every model in MODELS with its label.
// Examples (Episode 4): the Transformer encoder and decoder.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { FLOOR, NB, NEdge, nbEdges, Mat } from '../lib/kit3d.jsx';

// thick 3D model of the encoder: green token cubes go up through a pink attention slab (with links between tokens)
// and an orange feed-forward slab, inside a glowing teal frame; blue output vectors come out of the top
export const Encoder3D = ({ t, s }) => {
  const xs = [-0.105, -0.035, 0.035, 0.105]; const rg = useMemo(() => new RoundedBoxGeometry(0.29, 0.05, 0.11, 3, 0.015), []);
  const flow = (t * 0.45) % 1;
  return (<group scale={[s, s, s]}>
    {xs.map((x, i) => <mesh key={'tk' + i} position={[x, 0.025, 0.0]}><boxGeometry args={[0.045, 0.045, 0.045]} /><Mat c="#4ADE80" e={0.35} /></mesh>)}
    <mesh geometry={rg} position={[0, 0.12, 0]}><Mat c="#F472B6" e={0.3} /></mesh>
    {[[0, 2], [1, 3], [0, 3]].map(([a, b], i) => { const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(xs[a], 0.15, -0.058), new THREE.Vector3((xs[a] + xs[b]) / 2, 0.215, -0.058), new THREE.Vector3(xs[b], 0.15, -0.058));
      return <mesh key={'ln' + i}><tubeGeometry args={[c, 20, 0.006, 8, false]} /><meshBasicMaterial color="#ffffff" toneMapped={false} clippingPlanes={[FLOOR]} /></mesh>; })}
    <mesh geometry={rg} position={[0, 0.27, 0]}><Mat c="#F97316" e={0.3} /></mesh>
    {xs.map((x, i) => <mesh key={'ff' + i} position={[x, 0.27, -0.058]}><boxGeometry args={[0.012, 0.035, 0.006]} /><meshBasicMaterial color="#fff" toneMapped={false} clippingPlanes={[FLOOR]} /></mesh>)}
    {/* the encoder frame: neon edges around both layers */}
    {nbEdges(0.34, 0.33, 0.15, 0.06).map(([a, b], i) => <NEdge key={'fr' + i} a={a} b={b} col={NB.col} glow={1} />)}
    {/* data moving up: small glowing beads on each column */}
    {xs.map((x, i) => { const u = (flow + i * 0.17) % 1; return <mesh key={'bd' + i} position={[x, 0.05 + u * 0.42, -0.06]}><sphereGeometry args={[0.009, 10, 8]} /><meshBasicMaterial color="#e6fffa" toneMapped={false} clippingPlanes={[FLOOR]} /></mesh>; })}
    {xs.map((x, i) => [0, 1, 2].map((j) => <mesh key={'ov' + i + j} position={[x, 0.43 + j * 0.028, 0]}><boxGeometry args={[0.045 * (0.55 + 0.45 * Math.abs(Math.sin(i * 3 + j * 1.7))), 0.016, 0.03]} /><Mat c="#38BDF8" e={0.45} /></mesh>))}
  </group>); };
// thick 3D model of the decoder: the same two slabs, but attention only looks back (links run leftward to earlier
// tokens), and on top it writes ONE new token (yellow) that loops back down to join the input, one word at a time
export const Decoder3D = ({ t, s }) => {
  const xs = [-0.105, -0.035, 0.035, 0.105]; const rg = useMemo(() => new RoundedBoxGeometry(0.29, 0.05, 0.11, 3, 0.015), []);
  const cyc = (t * 0.55) % 1; const flow = (t * 0.45) % 1;
  const loop = useMemo(() => new THREE.CatmullRomCurve3([new THREE.Vector3(0.105, 0.47, 0), new THREE.Vector3(0.19, 0.48, 0), new THREE.Vector3(0.215, 0.25, 0), new THREE.Vector3(0.19, 0.03, 0), new THREE.Vector3(0.15, 0.025, 0)]), []);
  const bead = loop.getPoint(cyc);
  return (<group scale={[s, s, s]}>
    {xs.map((x, i) => <mesh key={'tk' + i} position={[x, 0.025, 0.0]}><boxGeometry args={[0.045, 0.045, 0.045]} /><Mat c={i === 3 ? '#FACC15' : '#4ADE80'} e={0.35} /></mesh>)}
    <mesh geometry={rg} position={[0, 0.12, 0]}><Mat c="#F472B6" e={0.3} /></mesh>
    {[[3, 0], [3, 1], [3, 2], [2, 0], [2, 1]].map(([a, b], i) => { const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(xs[a], 0.15, -0.058), new THREE.Vector3((xs[a] + xs[b]) / 2, 0.205, -0.058), new THREE.Vector3(xs[b], 0.15, -0.058));
      return <mesh key={'ln' + i}><tubeGeometry args={[c, 20, 0.0055, 8, false]} /><meshBasicMaterial color="#e8e8e8" toneMapped={false} clippingPlanes={[FLOOR]} /></mesh>; })}
    <mesh geometry={rg} position={[0, 0.27, 0]}><Mat c="#F97316" e={0.3} /></mesh>
    {nbEdges(0.34, 0.33, 0.15, 0.06).map(([a, b], i) => <NEdge key={'fr' + i} a={a} b={b} col="#F472B6" glow={1} />)}
    {xs.map((x, i) => { const u = (flow + i * 0.17) % 1; return <mesh key={'bd' + i} position={[x, 0.05 + u * 0.38, -0.06]}><sphereGeometry args={[0.008, 10, 8]} /><meshBasicMaterial color="#d9f7f0" toneMapped={false} clippingPlanes={[FLOOR]} /></mesh>; })}
    {/* the new word it writes, and the loop that feeds it back in */}
    <mesh position={[0.105, 0.45 + Math.sin(cyc * Math.PI) * 0.02, 0]} scale={[1, 1, 1]}><boxGeometry args={[0.05, 0.05, 0.05]} /><Mat c="#FACC15" e={0.4} /></mesh>
    <mesh><tubeGeometry args={[loop, 40, 0.005, 8, false]} /><meshBasicMaterial color="#FACC15" transparent opacity={0.7} toneMapped={false} clippingPlanes={[FLOOR]} /></mesh>
    <mesh position={[bead.x, bead.y, bead.z]}><sphereGeometry args={[0.012, 12, 10]} /><meshBasicMaterial color="#fde68a" toneMapped={false} clippingPlanes={[FLOOR]} /></mesh>
  </group>); };

// kind (used in episode.json "stations") -> model component and its label
export const MODELS = {
  encoder: { C: Encoder3D, label: 'ENCODER' },
  decoder: { C: Decoder3D, label: 'DECODER' },
};
