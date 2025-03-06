"use client";

import { Save, Loader2, FileText } from "lucide-react";
import Link from "next/link";

interface DailyNoteCardProps {
  dailyNote: string;
  onNoteChange: (note: string) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
  error: string | null;
}

export default function DailyNoteCard({
  dailyNote,
  onNoteChange,
  onSave,
  isSaving,
  error
}: DailyNoteCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200 h-full flex flex-col">
      <div className="px-3 py-3 sm:p-4 flex-grow">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-medium text-gray-900 dark:text-gray-100">Notas Diárias</h2>
          <Link 
            href="/notes" 
            className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center"
          >
            <FileText className="h-3 w-3 mr-1" />
            Ver todas as notas
          </Link>
        </div>
        
        <div className="space-y-3">
          <textarea
            rows={4}
            className="shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100 transition-colors duration-200"
            placeholder="Escreva suas notas para hoje..."
            value={dailyNote}
            onChange={(e) => onNoteChange(e.target.value)}
          />
          
          {error && (
            <div className="text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200"
              onClick={onSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-1.5 h-3 w-3" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="-ml-1 mr-1.5 h-3 w-3" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 