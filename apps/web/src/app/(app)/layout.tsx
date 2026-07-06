import type { ReactNode } from 'react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';

/** Shell autenticado de la aplicación (Blueprint §1.5.2). */
export default function AppLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-surface">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1 p-6 md:p-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
