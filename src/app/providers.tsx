"use client";

import { useEffect } from 'react';
import '@/polyfills';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Garantir que os polyfills estão carregados
    if (typeof window !== 'undefined') {
      // Já importado via polyfills.ts
    }
  }, []);

  return <>{children}</>;
} 