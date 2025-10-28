'use client';

import { FirebaseClientProvider } from '@/firebase';
import Header from '@/components/header';
import { usePathname } from 'next/navigation';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showHeader = pathname !== '/login';

  return (
    <FirebaseClientProvider>
      <div className="flex min-h-screen w-full flex-col">
        {showHeader && <Header />}
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </FirebaseClientProvider>
  );
}
