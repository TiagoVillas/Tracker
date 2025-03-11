"use client";

import { useState } from "react";
import { CalendarCheck2, Check, Plus, ArrowRight, Loader2 } from "lucide-react";
import { Habit } from "@/lib/habitUtils";

interface HabitsCardProps {
  habits: Habit[];
  isLoading: boolean;
  onToggleHabit: (habitId: string, currentState: boolean) => Promise<void>;
  updatingHabitId: string | null;
}

// Cores para os hábitos
const HABIT_COLORS = [
  { bg: "bg-blue-100 dark:bg-blue-900/30", check: "text-blue-600 dark:text-blue-400" },
  { bg: "bg-emerald-100 dark:bg-emerald-900/30", check: "text-emerald-600 dark:text-emerald-400" },
  { bg: "bg-amber-100 dark:bg-amber-900/30", check: "text-amber-600 dark:text-amber-400" },
  { bg: "bg-purple-100 dark:bg-purple-900/30", check: "text-purple-600 dark:text-purple-400" },
  { bg: "bg-rose-100 dark:bg-rose-900/30", check: "text-rose-600 dark:text-rose-400" },
];

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
  const completionPercentage = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
  
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
  const MAX_ITEMS_TO_SHOW = 5;
  const displayedHabits = showAllHabits ? sortedHabits : sortedHabits.slice(0, MAX_ITEMS_TO_SHOW);
  const hasMoreHabits = sortedHabits.length > MAX_ITEMS_TO_SHOW;

  // Função para obter cor baseada no índice
  const getColorForIndex = (index: number) => {
    return HABIT_COLORS[index % HABIT_COLORS.length];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 h-full flex flex-col">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <CalendarCheck2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2" />
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">Hábitos Diários</h2>
        </div>
        
        {/* Progresso */}
        <div className="flex items-center bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded">
          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `${completedHabits}/${totalHabits}`
            )}
          </span>
        </div>
      </div>
      
      {/* Barra de progresso */}
      {!isLoading && totalHabits > 0 && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-4">
          <div 
            className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full transition-all duration-300" 
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      )}
      
      {/* Estado vazio */}
      {!isLoading && totalHabits === 0 && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-full mb-2">
            <Plus className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Você ainda não tem hábitos diários
          </p>
          <a 
            href="/habits/new" 
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center"
          >
            Criar novo hábito
            <ArrowRight className="h-3 w-3 ml-1" />
          </a>
        </div>
      )}
      
      {/* Lista de hábitos */}
      {!isLoading && totalHabits > 0 && (
        <div className="space-y-2 flex-grow">
          {displayedHabits.map((habit, index) => {
            const colorScheme = getColorForIndex(index);
            
            return (
              <div 
                key={habit.id} 
                className={`flex items-center p-2 rounded ${habit.completed ? 'bg-gray-50 dark:bg-gray-800' : colorScheme.bg}`}
              >
                <button
                  onClick={() => onToggleHabit(habit.id, habit.completed)}
                  disabled={updatingHabitId === habit.id}
                  className={`flex-shrink-0 w-5 h-5 mr-2 rounded-full border flex items-center justify-center ${
                    updatingHabitId === habit.id
                      ? 'border-gray-300 dark:border-gray-600 animate-pulse'
                      : habit.completed
                      ? 'bg-indigo-500 border-indigo-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  aria-label={habit.completed ? "Marcar como não concluído" : "Marcar como concluído"}
                >
                  {habit.completed && updatingHabitId !== habit.id && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </button>
                <span className={`text-sm ${habit.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-800 dark:text-gray-100'}`}>
                  {habit.name}
                </span>
              </div>
            );
          })}
          
          {/* Botão "Ver mais" */}
          {hasMoreHabits && (
            <button
              onClick={() => setShowAllHabits(!showAllHabits)}
              className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center"
            >
              {showAllHabits ? "Mostrar menos" : `Ver mais ${sortedHabits.length - MAX_ITEMS_TO_SHOW} hábitos`}
              <ArrowRight className={`h-3 w-3 ml-1 transition-transform ${showAllHabits ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
      )}
      
      {/* Rodapé */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <a 
          href="/habits" 
          className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center"
        >
          Gerenciar hábitos
          <ArrowRight className="h-3 w-3 ml-1" />
        </a>
      </div>
    </div>
  );
} 