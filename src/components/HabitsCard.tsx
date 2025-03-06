"use client";

import { useState } from "react";
import { CalendarCheck2, Check } from "lucide-react";
import { Habit } from "@/lib/habitUtils";

interface HabitsCardProps {
  habits: Habit[];
  isLoading: boolean;
  onToggleHabit: (habitId: string, currentState: boolean) => Promise<void>;
  updatingHabitId: string | null;
}

export default function HabitsCard({ 
  habits, 
  isLoading, 
  onToggleHabit, 
  updatingHabitId 
}: HabitsCardProps) {
  const [showAllHabits, setShowAllHabits] = useState(false);
  
  // Calcular estatísticas
  const completedHabits = habits.filter(habit => habit.completed).length;
  const totalHabits = habits.length;
  
  // Ordenar hábitos
  const sortedHabits = [...habits].sort((a, b) => {
    // Primeiro, ordenar por status de conclusão (não concluídos primeiro)
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    // Depois, ordenar por nome
    return a.name.localeCompare(b.name);
  });

  // Limitar o número de itens exibidos
  const MAX_ITEMS_TO_SHOW = 3;
  const displayedHabits = showAllHabits ? sortedHabits : sortedHabits.slice(0, MAX_ITEMS_TO_SHOW);
  const hasMoreHabits = sortedHabits.length > MAX_ITEMS_TO_SHOW;

  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-200 h-full flex flex-col">
      <div className="px-3 py-3 sm:p-4 flex-grow">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900 rounded-md p-2">
            <CalendarCheck2 className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
          </div>
          <div className="ml-3 w-0 flex-1">
            <dl>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">Hábitos de Hoje</dt>
              <dd>
                <div className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-indigo-500 border-r-transparent"></div>
                  ) : (
                    <>
                      <span className="text-lg">{completedHabits}/{totalHabits}</span>
                      {totalHabits > 0 && (
                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                          ({Math.round((completedHabits / totalHabits) * 100)}%)
                        </span>
                      )}
                    </>
                  )}
                </div>
                {!isLoading && totalHabits === 0 && (
                  <div className="mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Nenhum hábito encontrado
                    </p>
                    <a 
                      href="/habits/new" 
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 mt-1 inline-block"
                    >
                      + Criar novo hábito
                    </a>
                  </div>
                )}
                {!isLoading && totalHabits > 0 && (
                  <div className="mt-1 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                    <div 
                      className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full" 
                      style={{ width: `${Math.min(100, Math.round((completedHabits / totalHabits) * 100))}%` }}
                    ></div>
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
        
        {/* Lista de hábitos */}
        {!isLoading && totalHabits > 0 && (
          <div className="mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Seus hábitos:</h4>
            <ul className="space-y-0.5 text-xs">
              {displayedHabits.map(habit => (
                <li key={habit.id} className="flex items-center py-0.5">
                  <button
                    onClick={() => onToggleHabit(habit.id, habit.completed)}
                    disabled={updatingHabitId === habit.id}
                    className={`flex-shrink-0 w-4 h-4 mr-1.5 rounded-full border ${
                      updatingHabitId === habit.id
                        ? 'border-gray-300 dark:border-gray-600 animate-pulse'
                        : habit.completed
                        ? 'bg-indigo-500 border-indigo-500 flex items-center justify-center'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    aria-label={habit.completed ? "Marcar como não concluído" : "Marcar como concluído"}
                  >
                    {habit.completed && updatingHabitId !== habit.id && (
                      <Check className="h-2.5 w-2.5 text-white" />
                    )}
                  </button>
                  <span className={`${habit.completed ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    {habit.name}
                  </span>
                </li>
              ))}
            </ul>
            {hasMoreHabits && (
              <button
                onClick={() => setShowAllHabits(!showAllHabits)}
                className="mt-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
              >
                {showAllHabits ? "Mostrar menos" : `Ver mais ${sortedHabits.length - MAX_ITEMS_TO_SHOW} hábitos`}
              </button>
            )}
          </div>
        )}
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 sm:px-4 mt-auto">
        <div className="text-xs">
          <a href="/habits" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
            Ver todos os hábitos
          </a>
        </div>
      </div>
    </div>
  );
} 