"use client";

import { useState, useEffect, useRef } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isToday,
  isBefore,
  addMonths,
  subMonths
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HabitCalendarProps {
  completedDates: Date[];
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
}

export default function HabitCalendar({ completedDates, onSelectDate, selectedDate }: HabitCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [daysInMonth, setDaysInMonth] = useState<Date[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    setDaysInMonth(days);
  }, [currentMonth]);

  // Efeito para rolar para o dia selecionado quando o mês muda
  useEffect(() => {
    if (scrollContainerRef.current) {
      // Encontrar o índice do dia selecionado ou do dia atual
      const today = new Date();
      const dayToScrollTo = daysInMonth.findIndex(day => 
        isSameDay(day, selectedDate) || 
        (isSameDay(today, day) && !daysInMonth.some(d => isSameDay(d, selectedDate)))
      );
      
      if (dayToScrollTo >= 0) {
        const dayWidth = 42; // largura do dia + espaçamento (40px + 2px)
        const scrollPosition = Math.max(0, dayToScrollTo * dayWidth - 100); // centralizar um pouco
        
        scrollContainerRef.current.scrollLeft = scrollPosition;
      }
    }
  }, [daysInMonth, selectedDate]);

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onSelectDate(today);
  };

  const isDateCompleted = (date: Date) => {
    return completedDates.some(completedDate => isSameDay(completedDate, date));
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={goToToday}
            className="px-2 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 dark:bg-indigo-800 dark:text-indigo-200 dark:hover:bg-indigo-700"
          >
            Hoje
          </button>
          <button
            onClick={goToNextMonth}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      <div className="relative">
        {/* Indicadores de scroll */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent dark:from-gray-900 z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent dark:from-gray-900 z-10 pointer-events-none"></div>
        
        {/* Container de scroll */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto pb-2 hide-scrollbar scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex space-x-2 min-w-max px-4">
            {daysInMonth.map((day) => {
              const isCompleted = isDateCompleted(day);
              const isSelected = isSameDay(day, selectedDate);
              const isPast = isBefore(day, new Date()) && !isToday(day);
              
              return (
                <button
                  key={day.toString()}
                  onClick={() => onSelectDate(day)}
                  className={`
                    flex flex-col items-center justify-center w-10 h-14 rounded-md transition-colors
                    ${isSelected ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}
                    ${isCompleted ? 'bg-green-100 dark:bg-green-900' : 'bg-white dark:bg-gray-800'}
                    ${isToday(day) ? 'border-2 border-indigo-500 dark:border-indigo-400' : 'border border-gray-200 dark:border-gray-700'}
                    ${isPast && !isCompleted ? 'bg-gray-50 dark:bg-gray-800' : ''}
                    hover:bg-gray-100 dark:hover:bg-gray-700
                  `}
                >
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {format(day, "EEE", { locale: ptBR }).slice(0, 3)}
                  </span>
                  <span className={`text-sm font-medium ${isToday(day) ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    {format(day, "d")}
                  </span>
                  {isCompleted && (
                    <div className="w-1.5 h-1.5 bg-green-500 dark:bg-green-400 rounded-full mt-1"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
} 