// PER EPISODE: the chalk drawing on the board before the push-in, and the pink handoff object.
// Example: Episode 3, the thick RULES book. Draw in the 1000x560 board canvas (KalamX font, chalk #F4F1E6, pink #F472B6).
import React from 'react';
import { C, F } from '../../llm1/theme.js';

// DIAL: the point of the handoff object in the 1000x560 canvas. The push-in zooms into it.
export const DIAL = [480, 290];
// CROP: the part of the middle's end frame that is pinned to the board after the pull-back (1080x1920 coordinates).
export const CROP = { x: 50, y: 240, w: 980, h: 840 };

const chalk = { stroke: C.chalk, strokeWidth: 6, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round', opacity: 0.92 };
export const BoardDrawing = () => (<>
  <svg width={1000} height={560} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
    <path d="M300 120 L640 90 L700 140 L700 470 L360 500 L300 450 Z" {...chalk} />
    <path d="M300 120 L300 450 M640 90 L640 420 L300 450 M640 420 L700 470" {...chalk} strokeWidth="5" />
    {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1={648} y1={150 + i * 50} x2={694} y2={198 + i * 50} {...chalk} strokeWidth="3" />)}
  </svg>
  <div style={{ position: 'absolute', left: 340, top: 210, width: 280, textAlign: 'center', fontFamily: F.chalk, fontWeight: 700, fontSize: 96, color: '#ffcf8a', transform: 'rotate(-4deg)' }}>RULES</div>
</>);
