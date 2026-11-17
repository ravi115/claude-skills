import React, { useEffect, useState } from 'react';
import { registerRoot, Composition, AbsoluteFill, Img, staticFile, getInputProps, delayRender, continueRender } from 'remotion';

/* Reasoning from Scratch cover template (locked layout, see the pixar-style-classroom-video skill, Part 6B).
   Only the background frame, the episode number and the topic change between episodes. */
const P = getInputProps() || {};
const useFonts = () => {
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const d = [['Hero', 'lilita-one-latin-400-normal.woff2', '400'], ['Nun', 'nunito-latin-600-normal.woff2', '600'], ['Nun', 'nunito-latin-700-normal.woff2', '700'], ['Nun', 'nunito-latin-900-normal.woff2', '900']];
    Promise.all(d.map(([n, f, w]) => new FontFace(n, `url(${staticFile('cover/' + f)})`, { weight: w }).load()))
      .then((fs) => { fs.forEach((f) => document.fonts.add(f)); continueRender(h); }).catch(() => continueRender(h));
  }, []);
};
const heroText = (txt, size) => (
  <div style={{ position: 'relative', fontFamily: 'Hero', fontSize: size, lineHeight: 0.98, letterSpacing: 2, textAlign: 'center' }}>
    {/* deep shadow layer for the 3D look */}
    <div style={{ position: 'absolute', inset: 0, color: '#7a2a08', transform: 'translate(0px, 10px)', WebkitTextStroke: '14px #7a2a08' }}>{txt}</div>
    <div style={{ position: 'absolute', inset: 0, color: 'transparent', WebkitTextStroke: '14px #b5440f' }}>{txt}</div>
    <div style={{ position: 'relative', background: 'linear-gradient(180deg, #ffe08a 0%, #ffb340 38%, #ff8a1e 62%, #f2680c 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{txt}</div>
  </div>
);
export const Cover = () => {
  useFonts();
  const ep = P.ep || 1, topic = P.topic || 'Topic', bg = P.bg || 'cover/bg_e01.jpg';
  return (
    <AbsoluteFill style={{ background: '#1b120b' }}>
      <Img src={staticFile(bg)} style={{ position: 'absolute', inset: 0, width: 1080, height: 1920, objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,6,3,0.55) 0%, rgba(10,6,3,0.25) 42%, rgba(10,6,3,0.15) 60%, rgba(10,6,3,0.55) 100%)' }} />
      <div style={{ position: 'absolute', left: 0, top: 245, width: 1080, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {heroText(P.h1 || 'REASONING', P.s1 || 168)}
        <div style={{ height: 6 }} />
        {heroText(P.h2 || 'FROM SCRATCH', P.s2 || 132)}
        <div style={{ marginTop: 44, padding: '14px 46px 16px', borderRadius: 60, background: 'linear-gradient(180deg, #ff9a3c, #f06a10)', boxShadow: '0 6px 0 #a6400a, 0 10px 24px rgba(0,0,0,0.35)', fontFamily: 'Nun', fontWeight: 900, fontSize: 50, color: '#fff', letterSpacing: 3 }}>EPISODE {ep}</div>
        <div style={{ marginTop: 26, fontFamily: 'Nun', fontWeight: 700, fontSize: 64, color: '#fff', textAlign: 'center', maxWidth: 960, lineHeight: 1.15, textShadow: '0 3px 14px rgba(0,0,0,0.75), 0 1px 2px rgba(0,0,0,0.9)' }}>{topic}</div>
      </div>
      <Img src={staticFile('cover/robot.png')} style={{ position: 'absolute', left: 540 - 270, top: 815, width: 540, height: 644, filter: 'drop-shadow(0 26px 30px rgba(0,0,0,0.45))' }} />
      <div style={{ position: 'absolute', left: 0, top: 1418, width: 1080, display: 'flex', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'Nun', fontWeight: 900, fontSize: 140, letterSpacing: 1, color: '#0e4a59', WebkitTextStroke: '16px #ffffff', paintOrder: 'stroke fill', filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.45))' }}>@pipzo.ai</div>
      </div>
    </AbsoluteFill>
  );
};
registerRoot(() => <Composition id="Cover" component={Cover} durationInFrames={1} fps={30} width={1080} height={1920} />);
