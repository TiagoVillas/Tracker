"use client";

import { useState } from "react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, CheckCircle2 } from "lucide-react";

interface HabitHistoryProps {
  completedDates: Date[];
}

export default function HabitHistory({ completedDates }: HabitHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Ordenar as datas do mais recente para o mais antigo
  const sortedDates = [...completedDates].sort((a, b) => b.getTime() - a.getTime());
  
  // Limitar a exibição a 5 datas quando não expandido
  const displayDates = isExpanded ? sortedDates : sortedDates.slice(0, 5);
  
  if (completedDates.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        Nenhuma conclusão registrada ainda.
      </div>
    );
  }
  
  return (
    <div className="mt-2">
      <div className="flex items-center mb-2">
        <Calendar className="h-4 w-4 mr-2 text-indigo-500" />
        <h4 className="text-sm font-medium text-gray-700">Histórico de conclusões</h4>
      </div>
      
      <div className="space-y-1">
        {displayDates.map((date, index) => (
          <div key={index} className="flex items-center text-sm">
            <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
            <span>{format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
          </div>
        ))}
      </div>
      
      {sortedDates.length > 5 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
        >
          {isExpanded ? "Mostrar menos" : `Ver mais ${sortedDates.length - 5} datas`}
        </button>
      )}
    </div>
  );
} 