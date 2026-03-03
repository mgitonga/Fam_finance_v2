'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" data-testid="app-shell">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuToggle={() => setMobileMenuOpen((prev) => !prev)} />
        <main id="main-content" className="flex-1 overflow-y-auto p-4 lg:p-6" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}
