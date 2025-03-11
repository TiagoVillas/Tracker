"use client";

import { AuthProvider } from "@/lib/contexts/AuthContext";
import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import { Providers } from './providers';
import '@/polyfills';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <ThemeProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </Providers>
  );
} 