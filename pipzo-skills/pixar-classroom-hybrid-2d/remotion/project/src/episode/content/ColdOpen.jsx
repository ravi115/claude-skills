// PER EPISODE: what the cold-open device shows (shot "device" in episode.json).
// Use the locked frames from ../lib/Devices.jsx: <Phone> or <Laptop>. Only the screen content changes.
// Example: Episode 3, Emily's bank chatbot.
import React from 'react';
import { F, clamp, ap } from '../../llm1/theme.js';
import { Phone } from '../lib/Devices.jsx';

export const ColdOpen = ({ t }) => {
  const typed = 'I lost my card'; const n = Math.floor(clamp((t - 0.1) / 0.9) * typed.length);
  const sent = t > 1.05; const reply = t > 1.6;
  return (
    <Phone t={t}>
      <div style={{ height: 150, background: '#1f3b5c', display: 'flex', alignItems: 'center', gap: 22, padding: '0 34px' }}>
        <div style={{ width: 74, height: 74, borderRadius: '50%', background: '#cfd8e3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bold, fontWeight: 800, fontSize: 34, color: '#1f3b5c' }}>B</div>
        <div style={{ fontFamily: F.bold, fontWeight: 700, fontSize: 40, color: '#fff' }}>Bank assistant</div>
      </div>
      {sent && <div style={{ position: 'absolute', right: 30, top: 230, maxWidth: 480, padding: '20px 28px', borderRadius: 30, background: '#2f6fed', color: '#fff', fontFamily: F.bold, fontWeight: 700, fontSize: 44, opacity: ap(t, 1.05, 0.2) }}>I lost my card</div>}
      {reply && <div style={{ position: 'absolute', left: 30, top: 380, maxWidth: 560, padding: '20px 28px', borderRadius: 30, background: '#d9dde3', color: '#3b4048', fontFamily: F.bold, fontWeight: 700, fontSize: 42, lineHeight: 1.2, opacity: ap(t, 1.6, 0.2) }}>I don't understand. Try 'balance' or 'statement'.</div>}
      <div style={{ position: 'absolute', left: 24, right: 24, bottom: 24, height: 110, borderRadius: 55, background: '#fff', border: '3px solid #d0d4da', display: 'flex', alignItems: 'center', padding: '0 34px', fontFamily: F.bold, fontWeight: 600, fontSize: 42, color: '#222' }}>{sent ? '' : typed.slice(0, n)}<span style={{ opacity: Math.sin(t * 9) > 0 && !sent ? 1 : 0 }}>|</span></div>
    </Phone>
  );
};
