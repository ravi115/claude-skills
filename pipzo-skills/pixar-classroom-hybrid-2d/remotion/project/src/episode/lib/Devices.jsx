// Reusable cold-open devices. Locked frames; the screen content comes from content/ColdOpen.jsx.
import React from 'react';
import { Img, staticFile } from 'remotion';

// Phone over the blurred classroom (Episode 3 cold open). children = what is on the screen (720 x 1200 area).
export const Phone = ({ t, children, bg = 'llm2/cu_bgS.jpg' }) => {
  const z = 1 + t * 0.012;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Img src={staticFile(bg)} style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, filter: 'blur(14px) brightness(0.55)', transform: 'scale(1.1)' }} />
      <div style={{ position: 'absolute', left: 150, top: 330, width: 780, height: 1320, borderRadius: 80, background: '#0d0f12', boxShadow: '0 40px 90px rgba(0,0,0,0.6), inset 0 0 0 10px #22262c', transform: `scale(${z})`, transformOrigin: '50% 60%' }}>
        <div style={{ position: 'absolute', left: 40, right: 40, top: 60, bottom: 60, borderRadius: 50, background: '#f4f5f7', overflow: 'hidden' }}>{children}</div>
      </div>
    </div>
  );
};

// Laptop over the blurred classroom (Episode 5 cold open). children = what is on the screen (888 x 588 area).
export const Laptop = ({ t, children, bg = 'llm2/cu_bgP.jpg' }) => {
  const z = 1 + t * 0.01;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Img src={staticFile(bg)} style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, filter: 'blur(14px) brightness(0.5)', transform: 'scale(1.1)' }} />
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${z})`, transformOrigin: '50% 45%' }}>
        <div style={{ position: 'absolute', left: 70, top: 470, width: 940, height: 640, borderRadius: 34, background: '#1d1d1f', boxShadow: '0 40px 90px rgba(0,0,0,0.6)', padding: 26, boxSizing: 'border-box' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: 14, background: 'linear-gradient(180deg, #f7f5ef, #e9e5da)', position: 'relative', overflow: 'hidden' }}>{children}</div>
        </div>
        <div style={{ position: 'absolute', left: 20, top: 1110, width: 1040, height: 40, borderRadius: '0 0 30px 30px', background: 'linear-gradient(180deg, #2b2b2e, #141416)' }} />
      </div>
    </div>
  );
};
