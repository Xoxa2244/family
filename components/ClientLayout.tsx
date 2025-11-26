'use client';

import Navigation from './Navigation';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem 2rem' }}>
        {children}
      </main>
    </>
  );
}

