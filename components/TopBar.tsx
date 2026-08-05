'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Just the brand + the digital-literacy/AI tab switcher. There used to be a 💎 gem
// counter here — a second currency derived from the same stars as the XP meter, so
// it said nothing the home page didn't already say. Removing it also removes the
// last reason this component needed to be re-read on every navigation.
export default function TopBar() {
  const pathname = usePathname();
  const onAi = pathname?.startsWith('/ai');

  return (
    <div className="topbar">
      <Link href="/" className="brand">
        <span className="brand-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>
        </span>
        <span className="brand-name">ทักษะ<span>คอมพิวเตอร์</span></span>
      </Link>
      <div className="toptabs">
        <Link href="/" className={`toptab${!onAi ? ' active' : ''}`}>📚 ทักษะดิจิทัล</Link>
        <Link href="/ai" className={`toptab ai${onAi ? ' active' : ''}`}>🤖 ทักษะ AI</Link>
      </div>
    </div>
  );
}
