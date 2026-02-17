'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  {
    href: '/timer',
    label: 'Timer',
    icon: (active: boolean) =>
      active ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="#007AFF"
          className="w-6 h-6"
        >
          <circle cx="12" cy="12" r="10" opacity="0.15" />
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="#007AFF"
            strokeWidth={2}
          />
          <polyline
            points="12 6 12 12 16 14"
            fill="none"
            stroke="#007AFF"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#AEAEB2"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
  },
  {
    href: '/week',
    label: 'Vecka',
    icon: (active: boolean) =>
      active ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="#007AFF"
          className="w-6 h-6"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" opacity="0.15" />
          <rect
            x="3"
            y="4"
            width="18"
            height="18"
            rx="2"
            ry="2"
            fill="none"
            stroke="#007AFF"
            strokeWidth={2}
          />
          <line x1="16" y1="2" x2="16" y2="6" stroke="#007AFF" strokeWidth={2} strokeLinecap="round" />
          <line x1="8" y1="2" x2="8" y2="6" stroke="#007AFF" strokeWidth={2} strokeLinecap="round" />
          <line x1="3" y1="10" x2="21" y2="10" stroke="#007AFF" strokeWidth={2} />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#AEAEB2"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
  },
  {
    href: '/projects',
    label: 'Projekt',
    icon: (active: boolean) =>
      active ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="#007AFF"
          className="w-6 h-6"
        >
          <path
            d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
            opacity="0.15"
          />
          <path
            d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
            fill="none"
            stroke="#007AFF"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#AEAEB2"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
  },
  {
    href: '/reports',
    label: 'Rapporter',
    icon: (active: boolean) =>
      active ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="#007AFF"
          className="w-6 h-6"
        >
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            opacity="0.15"
          />
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            fill="none"
            stroke="#007AFF"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline points="14 2 14 8 20 8" fill="none" stroke="#007AFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <line x1="16" y1="13" x2="8" y2="13" stroke="#007AFF" strokeWidth={2} strokeLinecap="round" />
          <line x1="16" y1="17" x2="8" y2="17" stroke="#007AFF" strokeWidth={2} strokeLinecap="round" />
          <polyline points="10 9 9 9 8 9" fill="none" stroke="#007AFF" strokeWidth={2} strokeLinecap="round" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#AEAEB2"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-nav z-50 shadow-[0_-1px_3px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 max-w-[640px] mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] px-3 py-2 transition-all duration-200 scale-tap"
            >
              {item.icon(isActive)}
              <span
                className={`text-[10px] font-medium ${
                  isActive ? 'text-[#007AFF]' : 'text-[#AEAEB2]'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
