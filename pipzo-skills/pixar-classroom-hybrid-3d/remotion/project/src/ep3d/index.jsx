import React from 'react';
import { registerRoot, Composition } from 'remotion';
import { Episode3D } from './Episode3D';
import CFG from './cfg.json';
registerRoot(() => <Composition id="Ep3D" component={Episode3D} durationInFrames={Math.round(CFG.total * 30)} fps={30} width={1080} height={1920} />);
