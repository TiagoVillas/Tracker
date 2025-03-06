"use client";

import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useState } from "react";
import { Menu, X, User, LogOut, Home, Calendar, BookOpen, DollarSign, Clipboard, Activity, FileText } from "lucide-react";
import ThemeSwitch from "./ThemeSwitch";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Function to determine if a link is active
  const isActive = (path: string) => {
    return pathname === path;
  };

  // Function to get the appropriate class for desktop navigation links
  const getDesktopLinkClass = (path: string) => {
    return `inline-flex items-center px-1 pt-1 border-b-2 ${
      isActive(path)
        ? "border-indigo-500 text-gray-900 dark:text-gray-100"
        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:border-gray-600"
    } text-sm font-medium`;
  };

  // Function to get the appropriate class for mobile navigation links
  const getMobileLinkClass = (path: string) => {
    return `block pl-3 pr-4 py-2 border-l-4 ${
      isActive(path)
        ? "border-indigo-500 text-indigo-700 bg-indigo-50 dark:bg-indigo-900 dark:text-indigo-200"
        : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
    } text-base font-medium`;
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                HabitTracker
              </Link>
            </div>
            {user && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/habits" className={getDesktopLinkClass("/habits")}>
                  <Calendar className="mr-1 h-4 w-4" />
                  Hábitos
                </Link>
                <Link href="/tasks" className={getDesktopLinkClass("/tasks")}>
                  <Clipboard className="mr-1 h-4 w-4" />
                  Tarefas
                </Link>
                <Link href="/notes" className={getDesktopLinkClass("/notes")}>
                  <FileText className="mr-1 h-4 w-4" />
                  Notas
                </Link>
                <Link href="/finances" className={getDesktopLinkClass("/finances")}>
                  <DollarSign className="mr-1 h-4 w-4" />
                  Finanças
                </Link>
                <Link href="/exercises" className={getDesktopLinkClass("/exercises")}>
                  <Activity className="mr-1 h-4 w-4" />
                  Exercícios
                </Link>
                <Link href="/studies" className={getDesktopLinkClass("/studies")}>
                  <BookOpen className="mr-1 h-4 w-4" />
                  Estudos
                </Link>
              </div>
            )}
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="mr-4">
              <ThemeSwitch />
            </div>
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700 dark:text-gray-300">{user.displayName || user.email}</span>
                <button
                  onClick={signOut}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                >
                  <LogOut className="mr-1 h-4 w-4" />
                  Sair
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600"
              >
                <User className="mr-1 h-4 w-4" />
                Login
              </Link>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <div className="mr-2">
              <ThemeSwitch />
            </div>
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <span className="sr-only">Abrir menu</span>
              {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu móvel */}
      {isMenuOpen && (
        <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
          {user && (
            <div className="pt-2 pb-3 space-y-1">
              <Link href="/habits" className={getMobileLinkClass("/habits")}>
                <div className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Hábitos
                </div>
              </Link>
              <Link href="/tasks" className={getMobileLinkClass("/tasks")}>
                <div className="flex items-center">
                  <Clipboard className="mr-2 h-5 w-5" />
                  Tarefas
                </div>
              </Link>
              <Link href="/notes" className={getMobileLinkClass("/notes")}>
                <div className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Notas
                </div>
              </Link>
              <Link href="/finances" className={getMobileLinkClass("/finances")}>
                <div className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Finanças
                </div>
              </Link>
            </div>
          )}
          <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
            {user ? (
              <div>
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                      <User className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800 dark:text-gray-100">{user.displayName || "Usuário"}</div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{user.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <button
                    onClick={signOut}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700"
                  >
                    Sair
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4">
                <Link
                  href="/login"
                  className="block text-center px-4 py-2 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 rounded-md"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 