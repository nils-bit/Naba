'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function Header() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <header className="fixed top-0 left-0 right-0 glass-nav z-50 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <h1 className="text-lg font-semibold text-[#1D1D1F] tracking-tight">
          Tidsrapportering
        </h1>
        <button
          onClick={handleLogout}
          className="text-sm text-[#6E6E73] hover:text-[#1D1D1F] px-3 py-1.5 rounded-xl hover:bg-black/[0.04] transition-all duration-200 press-effect"
        >
          Logga ut
        </button>
      </div>
    </header>
  );
}
