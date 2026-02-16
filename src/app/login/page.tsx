'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setLoading(false);
    if (!error) setSent(true);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,122,255,0.08)_0%,rgba(147,51,234,0.05)_50%,transparent_80%)]" />

        <div className="relative animate-slide-up text-center glass-card p-10 max-w-sm w-full mx-4">
          {/* Success icon */}
          <div className="w-16 h-16 rounded-full bg-[#34C759]/10 flex items-center justify-center mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#34C759"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#1D1D1F] mb-3">
            Kolla din e-post
          </h2>
          <p className="text-[#6E6E73] text-sm leading-relaxed">
            Vi har skickat en inloggningslank till{' '}
            <span className="font-medium text-[#1D1D1F]">{email}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,122,255,0.08)_0%,rgba(147,51,234,0.05)_50%,transparent_80%)]" />

      <form
        onSubmit={handleLogin}
        className="relative animate-slide-up glass-card p-8 w-full max-w-sm mx-4"
      >
        {/* App icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#007AFF] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#007AFF]/20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-[#1D1D1F] text-center mb-1">
          Tidsrapportering
        </h1>
        <p className="text-sm text-[#6E6E73] text-center mb-8">
          Logga in for att borja tracka tid
        </p>

        <input
          type="email"
          placeholder="din@email.se"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 bg-white/80 border border-black/[0.06] rounded-xl text-sm text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40 focus:border-transparent transition-all duration-200 mb-4"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.97] text-white rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 shadow-sm shadow-[#007AFF]/20"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Skickar...
            </span>
          ) : (
            'Skicka inloggningslank'
          )}
        </button>
      </form>
    </div>
  );
}
