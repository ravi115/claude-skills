// PER EPISODE: Episode 5 "Pretrain, Then Finetune". The board's two-stage timeline, pre-drawn before the episode starts.
// Pink handoff object: the big STAGE 1 block (the push-in lands on it). Stage 2 is the small chalk block.
import React from 'react';
import { C, F } from '../../llm1/theme.js';

// DIAL: centre of the pink Stage 1 block in the 1000x560 canvas.
export const DIAL = [515, 290];
// CROP: the part of the world end frame (public/ep3d/end.jpg) pinned to the board after the pull-back.
export const CROP = { x: 20, y: 570, w: 1040, h: 891 };   // includes the whole pedestal and both characters

const chalk = { stroke: C.chalk, strokeWidth: 6, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round', opacity: 0.92 };
// FINGER (pointing plate): the Professor's fingertip lands at about canvas (217, 312). Keep every drawn mark at least
// 40 px clear of it, with the pointed-at object starting to its right (x >= 280), so the 2D hand never sits inside chalk.
export const BoardDrawing = () => (<>
  <svg width={1000} height={560} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
    <line x1="40" y1="490" x2="950" y2="490" {...chalk} />
    <path d="M925,472 L955,490 L925,508" {...chalk} />
    <rect x="285" y="150" width="460" height="280" rx="30" {...chalk} stroke={C.pink} strokeWidth="9" />
    <rect x="818" y="350" width="132" height="80" rx="18" {...chalk} />
    <path d="M760,390 L805,390 M793,378 L807,390 L793,402" {...chalk} />
  </svg>
  <div style={{ position: 'absolute', left: 285, top: 192, width: 460, textAlign: 'center', fontFamily: F.chalk, fontWeight: 700, fontSize: 66, lineHeight: 1.15, color: C.pink, opacity: 0.95 }}>STAGE 1<br />PRETRAIN</div>
</>);
