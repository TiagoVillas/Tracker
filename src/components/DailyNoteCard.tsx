"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, FileText, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

interface DailyNoteCardProps {
  dailyNote: string;
  onNoteChange: (note: string) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
  error: string | null;
  lastNote?: {
    content: string;
    date: Date;
  } | null;
}

export default function DailyNoteCard({
  dailyNote,
  onNoteChange,
  onSave,
  isSaving,
  error,
  lastNote
}: DailyNoteCardProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);

  // Atualizar o timestamp da última atualização quando a última nota mudar
  useEffect(() => {
    if (lastNote?.date) {
      setLastSaveTime(lastNote.date);
    }
  }, [lastNote]);

  // Mostrar mensagem de sucesso por 3 segundos após salvar
  useEffect(() => {
    if (!isSaving && !error && lastNote?.content) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSaving, error, lastNote]);

  // Formatar a data da última nota
  const formatDate = (date: Date) => {
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Data inválida";
    }
  };

  // Função para lidar com o salvamento
  const handleSave = async () => {
    if (!dailyNote.trim()) return;
    await onSave();
  };

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
          
          {showSuccess && (
            <div className="text-xs text-green-600 dark:text-green-400 flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              Nota salva com sucesso!
            </div>
          )}
          
          <div className="flex justify-between items-center">
            {lastSaveTime && (
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Última atualização: {formatDate(lastSaveTime)}
              </div>
            )}
            <button
              type="button"
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200 disabled:opacity-50"
              onClick={handleSave}
              disabled={isSaving || !dailyNote.trim()}
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
          
          {/* Visualização da última nota (se existir) */}
          {lastNote && lastNote.content && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300">Última nota salva</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(lastNote.date)}
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded max-h-24 overflow-y-auto">
                {lastNote.content}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 