'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onDone: () => void;
}

export function Toast({ message, type = 'success', onDone }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  const bg = type === 'success'
    ? 'bg-[var(--success)] text-white'
    : 'bg-[var(--danger)] text-white';

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl text-sm font-medium shadow-lg transition-all duration-300 ${bg} ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      {message}
    </div>
  );
}
