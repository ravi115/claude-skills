import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, Audio, interpolate, Easing } from 'remotion';
import { Face } from '../rig/Face';
const T0 = 6.4;
const ease = (x) => Easing.inOut(Easing.cubic)(Math.max(0, Math.min(1, x)));
export const ClassTest = () => {
  const f = useCurrentFrame(); const lt = f / 30; const t = T0 + lt;
  const A = lt < 3.5;
  const breathe = 1 + Math.sin(lt * 1.9) * 0.004;
  if (A) {
    const s = 1.0 + 0.12 * ease(lt / 3.5);
    return (<AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '540px 640px', transform: `scale(${s})` }}>
        <Img src={staticFile('llm2/mw_talk_hd_test.jpg')} style={{ width: 1080, height: 1920 }} />
      </div>
    </AbsoluteFill>);
  }
  const u = lt - 3.5; const s = 1.04 + 0.05 * ease(u / 6.5); const bob = Math.sin(lt * 1.3) * 0.6;
  return (<AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
    <Img src={staticFile('llm2/cu_bg_test.jpg')} style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, objectFit: 'cover', transform: `scale(${1.05 + 0.03 * ease(u / 6.5)})` }} />
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 75% 30%, rgba(255,190,110,0.25), transparent 60%)' }} />
    <div style={{ position: 'absolute', left: -170, top: 560, width: 1400, height: 1400, transformOrigin: '50% 100%', transform: `scale(${s * breathe}) rotate(${bob}deg)` }}>
      <Face who="P" t={t} size={1400} filter="sepia(0.18) saturate(1.12) brightness(1.03) contrast(1.03)" />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, transparent 55%, rgba(255,170,80,0.18))', mixBlendMode: 'soft-light' }} />
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 260, background: 'linear-gradient(transparent, rgba(0,0,0,0.35))' }} />
  </AbsoluteFill>);
};
