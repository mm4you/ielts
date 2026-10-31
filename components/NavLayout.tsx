'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import GameViewport from './GameViewport';
import StudyBackdrop from './StudyBackdrop';
import Header from './Header';
import Footer from './Footer';

export default function NavLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname=usePathname();
  const games=['/typing','/spelling-bee','/word-rain','/match','/speedrun','/sniper','/blockblast','/collocations','/context-practice','/spelling-hunt'];
  if(games.includes(pathname)||pathname.startsWith('/rooms/'))return <GameViewport room={pathname.startsWith('/rooms/')}>{children}</GameViewport>;
  return <div className="app-shell" data-collapsed={collapsed}>
    <Header collapsed={collapsed} onCollapse={() => setCollapsed(value => !value)} />
    <div className="app-workspace"><StudyBackdrop />
      <main id="main-content" className="app-content" tabIndex={-1}>{children}</main>
      <Footer />
    </div>
  </div>;
}
