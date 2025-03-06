"use client";

import { Flame } from "lucide-react";
import { isSameDay, isYesterday, differenceInCalendarDays, startOfDay } from "date-fns";

interface HabitStreakProps {
  completedDates: Date[];
}

export default function HabitStreak({ completedDates }: HabitStreakProps) {
  // Ordenar as datas do mais recente para o mais antigo
  const sortedDates = [...completedDates].map(date => startOfDay(date)).sort((a, b) => b.getTime() - a.getTime());
  
  // Calcular a sequência atual
  const calculateCurrentStreak = (): number => {
    if (sortedDates.length === 0) return 0;
    
    const today = startOfDay(new Date());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Verificar se o hábito foi completado hoje ou ontem
    const mostRecentDate = sortedDates[0];
    const isCompletedToday = isSameDay(mostRecentDate, today);
    const isCompletedYesterday = isSameDay(mostRecentDate, yesterday);
    
    // Se não foi completado hoje ou ontem, a sequência atual é 0
    if (!isCompletedToday && !isCompletedYesterday) {
      return 0;
    }
    
    // Iniciar a sequência com 1 (para o dia mais recente)
    let streak = 1;
    let previousDate = mostRecentDate;
    
    // Verificar dias consecutivos
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = sortedDates[i];
      
      // Calcular a diferença em dias
      const dayDifference = differenceInCalendarDays(previousDate, currentDate);
      
      // Se a diferença for exatamente 1 dia, continuar a sequência
      if (dayDifference === 1) {
        streak++;
        previousDate = currentDate;
      } 
      // Se encontrarmos o mesmo dia (duplicata), ignorar
      else if (dayDifference === 0) {
        continue;
      } 
      // Se a diferença for maior que 1, a sequência foi quebrada
      else {
        break;
      }
    }
    
    return streak;
  };
  
  // Calcular a maior sequência
  const calculateLongestStreak = (): number => {
    if (sortedDates.length === 0) return 0;
    if (sortedDates.length === 1) return 1;
    
    // Ordenar as datas do mais antigo para o mais recente para calcular a maior sequência
    const chronologicalDates = [...sortedDates].sort((a, b) => a.getTime() - b.getTime());
    
    let currentStreak = 1;
    let longestStreak = 1;
    let previousDate = chronologicalDates[0];
    
    for (let i = 1; i < chronologicalDates.length; i++) {
      const currentDate = chronologicalDates[i];
      
      // Calcular a diferença em dias
      const dayDifference = differenceInCalendarDays(currentDate, previousDate);
      
      // Se a diferença for exatamente 1 dia, continuar a sequência
      if (dayDifference === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } 
      // Se encontrarmos o mesmo dia (duplicata), ignorar
      else if (dayDifference === 0) {
        continue;
      } 
      // Se a diferença for maior que 1, a sequência foi quebrada
      else {
        currentStreak = 1;
      }
      
      previousDate = currentDate;
    }
    
    return longestStreak;
  };
  
  const currentStreak = calculateCurrentStreak();
  const longestStreak = calculateLongestStreak();
  
  return (
    <div className="flex items-center space-x-4 text-sm">
      <div className="flex items-center">
        <Flame className={`h-4 w-4 mr-1 ${currentStreak > 0 ? 'text-orange-500 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`} />
        <span className="font-medium text-gray-700 dark:text-gray-300">Atual: {currentStreak} {currentStreak === 1 ? 'dia' : 'dias'}</span>
      </div>
      <div className="flex items-center">
        <Flame className={`h-4 w-4 mr-1 ${longestStreak > 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`} />
        <span className="font-medium text-gray-700 dark:text-gray-300">Recorde: {longestStreak} {longestStreak === 1 ? 'dia' : 'dias'}</span>
      </div>
    </div>
  );
} 