// Natural lip-sync mouth: exactly ONE real drawn mouth per frame (no synthetic in-betweens,
// no crossfades), like a real lip-sync video. Track (30 fps, from lipcal/drive.py) holds a state:
// 0 closed, 1 FV, 2 OO, 3 EE, 4 L, 5 OH, 6 AH. State choice is calibrated to the ElevenLabs
// lip-sync clips and adapts to speaking speed (fast speech holds shapes >=100 ms).
const NAMES = [null, 'FV', 'OO', 'EE', 'L', 'OH', 'AH'];
const PLATE = [null, 'EE', 'OO', 'EE', 'OH', 'OH', 'AH']; // wide plates have no FV/L drawing
export const natAt = (track, t) => track[Math.max(0, Math.min(track.length - 1, Math.round(t * 30)))];
export const mouthName = (state, plate = false) => (plate ? PLATE : NAMES)[state] || null;
