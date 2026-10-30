'use client';
import { useState } from 'react';
import StudyBackdrop from './StudyBackdrop';
import Header from './Header';
import Footer from './Footer';

export default function NavLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return <div className="app-shell" data-collapsed={collapsed}>
    <Header collapsed={collapsed} onCollapse={() => setCollapsed(value => !value)} />
    <div className="app-workspace"><StudyBackdrop />
      <main id="main-content" className="app-content" tabIndex={-1}>{children}</main>
      <Footer />
    </div>
  </div>;
}
