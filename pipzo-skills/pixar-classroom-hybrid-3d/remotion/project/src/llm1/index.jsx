import React, { useEffect, useState } from 'react';
import { registerRoot, Composition, AbsoluteFill, useCurrentFrame, getInputProps, staticFile, delayRender, continueRender } from 'remotion';
import { Ep1 } from './Ep1.jsx';
import { Middle } from './Middle.jsx';
import { F } from './theme.js';
import CFG from './cfg.json';
const MidPrev = () => {
  const [h] = useState(() => delayRender('f'));
  useEffect(() => { Promise.all([['Inter','inter-latin-700-normal.woff2','700'],['Inter','inter-latin-800-normal.woff2','800']].map(([n,f,w])=>new FontFace(n,`url(${staticFile('llm1/fonts/'+f)})`,{weight:w}).load())).then(fs=>{fs.forEach(f=>document.fonts.add(f));continueRender(h);}); }, []);
  const p = getInputProps() || {}; const f = useCurrentFrame();
  const L = p.L != null ? p.L : 24.9 + f / 30; const G = p.G != null ? p.G : null;
  return <AbsoluteFill><Middle L={L} G={G} gDur={2.6} /></AbsoluteFill>;
};
registerRoot(() => (<>
  <Composition id="Ep1" component={Ep1} durationInFrames={Math.ceil(CFG.total * 30)} fps={30} width={1080} height={1920} />
  <Composition id="MidPrev" component={MidPrev} durationInFrames={30 * 82} fps={30} width={1080} height={1920} />
</>));
