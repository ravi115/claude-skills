// PER EPISODE: the cold open (shot "device" in episode.json). Example: Episode 4, a translation app on Emily's phone.
// For a standard phone or laptop frame, use <Phone> / <Laptop> from ../lib/Devices.jsx and draw only the screen content.
import React from 'react';
import { Img, staticFile } from 'remotion';
import { F, clamp } from '../../llm1/theme.js';

const KEYS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const HI_IN = 'आज शाम को बारिश होगी।', EN_OUT = 'It will rain this evening.';
const REQ = 'write a birthday message for my mum', HI_BACK = 'मेरी माँ के लिए जन्मदिन का संदेश लिखो';
export const ColdOpen = ({ t }) => {
  const paste = t > 0.25, tr1 = clamp((t - 0.7) / 0.35);                      // pasted Hindi -> perfect English
  const T0 = 2.55, T1 = 4.55; const n = Math.floor(clamp((t - T0) / (T1 - T0)) * REQ.length); // she types the request
  const cur = n > 0 && t < T1 + 0.05 ? REQ[n - 1] : null; const tap = t > 4.62 && t < 4.78;
  const tr2 = clamp((t - 5.25) / 0.35);                                          // ...and it just translates it back
  const z = 1 + t * 0.008;
  const Key = ({ c, w = 58 }) => <div style={{ width: w, height: 62, borderRadius: 12, background: c === cur ? '#9fb4d6' : '#fff', boxShadow: '0 2px 0 #b9bec6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bold, fontWeight: 500, fontSize: 32, color: '#222', transform: c === cur ? 'translateY(-6px) scale(1.12)' : 'none' }}>{c}</div>;
  const Pane = ({ top, lang, children, hl }) => <div style={{ position: 'absolute', left: 22, right: 22, top, minHeight: 150, borderRadius: 22, background: hl ? '#eef4ff' : '#fff', border: '2px solid #dfe3ea', padding: '16px 22px', boxSizing: 'border-box' }}><div style={{ fontFamily: F.bold, fontWeight: 700, fontSize: 22, color: '#2f6fed', marginBottom: 8, letterSpacing: 1 }}>{lang}</div>{children}</div>;
  const txt = (o, fam = F.bold) => ({ fontFamily: fam, fontWeight: 600, fontSize: 36, color: '#1f2430', lineHeight: 1.3, opacity: o });
  const second = t > T0 - 0.2;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Img src={staticFile('llm2/cu_bgS.jpg')} style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, filter: 'blur(14px) brightness(0.5)', transform: 'scale(1.1)' }} />
      <div style={{ position: 'absolute', left: 190, top: 250, width: 700, height: 1060, borderRadius: 74, background: '#0d0f12', boxShadow: '0 40px 90px rgba(0,0,0,0.6), inset 0 0 0 10px #22262c', transform: `scale(${z})`, transformOrigin: '50% 40%' }}>
        <div style={{ position: 'absolute', left: 36, right: 36, top: 52, bottom: 52, borderRadius: 48, background: '#f4f5f7', overflow: 'hidden' }}>
          <div style={{ height: 112, background: '#2f6fed', display: 'flex', alignItems: 'center', gap: 18, padding: '0 28px' }}>
            <div style={{ width: 62, height: 62, borderRadius: 16, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'NotoDeva', fontWeight: 700, fontSize: 32, color: '#2f6fed' }}>अ</div>
            <div style={{ fontFamily: F.bold, fontWeight: 700, fontSize: 36, color: '#fff' }}>Translate</div>
            <div style={{ marginLeft: 'auto', fontFamily: F.bold, fontWeight: 700, fontSize: 24, color: '#dbe6ff' }}>{second ? 'English → हिन्दी' : 'हिन्दी → English'}</div>
          </div>
          {!second && <>
            <Pane top={134} lang="HINDI"><div style={txt(paste ? 1 : 0, 'NotoDeva')}>{HI_IN}</div></Pane>
            <Pane top={312} lang="ENGLISH" hl><div style={txt(tr1)}>{EN_OUT}</div></Pane>
          </>}
          {second && <>
            <Pane top={134} lang="ENGLISH"><div style={txt(1)}>{REQ.slice(0, n)}<span style={{ opacity: Math.sin(t * 9) > 0 && t < T1 + 0.3 ? 1 : 0, color: '#2f6fed' }}>|</span></div></Pane>
            <Pane top={312} lang="HINDI" hl><div style={txt(tr2, 'NotoDeva')}>{HI_BACK}</div></Pane>
          </>}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 330, background: '#d1d5db', padding: '18px 8px', boxSizing: 'border-box' }}>
            {KEYS.map((r, i) => <div key={i} style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 8 }}>{r.split('').map((c) => <Key key={c} c={c} />)}</div>)}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}><Key c=" " w={340} /><div style={{ width: 150, height: 62, borderRadius: 12, background: tap ? '#1f4fc0' : '#2f6fed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bold, fontWeight: 700, fontSize: 26 }}>Translate</div></div>
          </div>
        </div>
      </div>
    </div>
  );
};
