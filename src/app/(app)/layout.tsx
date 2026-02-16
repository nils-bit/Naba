import { AuthGuard } from '@/components/auth-guard';
import { Header } from '@/components/header';
import { BottomNav } from '@/components/bottom-nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Header />
      <main className="pt-14 pb-20 min-h-screen">
        {children}
      </main>
      <BottomNav />
    </AuthGuard>
  );
}
