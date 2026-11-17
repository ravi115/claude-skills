// PER EPISODE: the chalk drawing on the board before the push-in, and the handoff object the camera pushes into.
// Draw in the 1000x560 board canvas (KalamX chalk font). Example: Episode 4, the DECODER box.
import React from 'react';
import { C, F } from '../../llm1/theme.js';

// DIAL: the handoff object's point in the 1000x560 canvas. The push-in zooms into it.
export const DIAL = [493, 290];
// CROP: the part of the world's end frame (public/ep3d/end.jpg) pinned to the board after the pull-back.
export const CROP = { x: 50, y: 240, w: 980, h: 840 };

/* ---- chalk drawing on the board: the DECODER box ---- */
const chalk = { stroke: C.chalk, strokeWidth: 6, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round', opacity: 0.92 };
export const BoardDrawing = () => (<>
    <svg width={1000} height={560} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
      <path d="M250 150 L730 140 L736 430 L256 440 Z" {...chalk} stroke="#ffb36b" strokeWidth="8" />
      <path d="M250 150 L300 100 L780 92 L730 140 M780 92 L786 382 L736 430" {...chalk} strokeWidth="5" />
      <path d="M140 300 L240 300 M215 280 L240 300 L215 320" {...chalk} strokeWidth="5" />
      <path d="M745 290 L860 290 M835 270 L860 290 L835 310" {...chalk} strokeWidth="5" />
    </svg>
    <div style={{ position: 'absolute', left: 250, top: 236, width: 486, textAlign: 'center', fontFamily: F.chalk, fontWeight: 700, fontSize: 104, color: '#ffb36b', transform: 'rotate(-1.5deg)' }}>DECODER</div>
</>);
