import React from 'react';
import { registerRoot, Composition } from 'remotion';
import { ClassTest } from './ClassTest';
import { Ep2 } from './Ep2';
import CFG from './cfg2.json';
const Root = () => (<>
  <Composition id="Ep2" component={Ep2} durationInFrames={Math.round(CFG.total * 30)} fps={30} width={1080} height={1920} />
  <Composition id="ClassTest" component={ClassTest} durationInFrames={300} fps={30} width={1080} height={1920} />
</>);
registerRoot(Root);
