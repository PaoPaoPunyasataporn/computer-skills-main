'use client';

import { useState } from 'react';
import { speak } from '@/lib/speak';

// A 🔊 button that reads its own label out loud. It sits next to anything a child
// has to choose between — every quiz option in the competition area, and both
// choices in the "leave the test?" dialog.
//
// Deliberately a <span role="button">, not a <button>: these are often placed
// INSIDE a choice button, and a nested <button> stops receiving clicks the moment
// its parent is disabled — exactly when a child is most likely to want to re-read
// the option. It stops the event from reaching the parent, so pressing the speaker
// never picks the answer.
export default function Speaker({ say, size = 'md' }: { say: string; size?: 'sm' | 'md' }) {
  const [playing, setPlaying] = useState(false);

  function play(e: React.SyntheticEvent) {
    e.stopPropagation();
    e.preventDefault();
    speak(say);
    setPlaying(true);
    setTimeout(() => setPlaying(false), 1100);
  }

  return (
    <span
      role="button"
      tabIndex={0}
      title="ฟังเสียง"
      aria-label={`ฟังเสียง: ${say}`}
      className={`cs-spk${size === 'sm' ? ' sm' : ''}${playing ? ' playing' : ''}`}
      onClick={play}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') play(e); }}
    >
      🔊
    </span>
  );
}
