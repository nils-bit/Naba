import { AuthGuard } from '@/components/auth-guard';
import { Header } from '@/components/header';
import { BottomNav } from '@/components/bottom-nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Header />
      <main className="pt-14 pb-24 min-h-screen bg-[#F5F5F7]">
        {children}
      </main>
      <BottomNav />
    </AuthGuard>
  );
}
