import "./globals.css";
import { Metadata } from "next";
import { Inter } from 'next/font/google';
import { ClientLayout } from './client-layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "HabitTracker - Acompanhe seus hábitos e objetivos",
  description: "Um aplicativo completo para acompanhar hábitos, tarefas, finanças, exercícios e mais.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
