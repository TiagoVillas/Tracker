"use client";

import { useMemo, useState } from "react";
import { Transaction } from "@/lib/types";
import { ArrowUpCircle, ArrowDownCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface FinanceCalendarProps {
  transactions: Transaction[];
  currentMonth: string; // formato: 'YYYY-MM'
  onDateClick: (date: Date) => void;
}

export default function FinanceCalendar({ 
  transactions, 
  currentMonth,
  onDateClick
}: FinanceCalendarProps) {
  // Formatar moeda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  // Obter ano e mês atuais
  const [year, month] = useMemo(() => {
    return currentMonth.split('-').map(Number);
  }, [currentMonth]);

  // Calcular dias do mês e primeiro dia da semana
  const daysInMonth = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  const firstDayOfMonth = useMemo(() => {
    return new Date(year, month - 1, 1).getDay();
  }, [year, month]);

  // Agrupar transações por dia
  const transactionsByDay = useMemo(() => {
    const result: Record<number, Transaction[]> = {};
    
    // Inicializar todos os dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
      result[i] = [];
    }
    
    // Agrupar transações por dia
    transactions.forEach(transaction => {
      const transactionDate = typeof transaction.date === 'string' 
        ? new Date(transaction.date) 
        : transaction.date;
      
      // Verificar se a transação é do mês atual
      if (transactionDate.getFullYear() === year && transactionDate.getMonth() === month - 1) {
        const day = transactionDate.getDate();
        if (result[day]) {
          result[day].push(transaction);
        }
      }
    });
    
    return result;
  }, [transactions, year, month, daysInMonth]);

  // Calcular saldo diário
  const dailyBalance = useMemo(() => {
    const result: Record<number, { income: number; expense: number; balance: number }> = {};
    
    // Inicializar todos os dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
      result[i] = { income: 0, expense: 0, balance: 0 };
    }
    
    // Calcular receitas e despesas por dia
    Object.entries(transactionsByDay).forEach(([day, dayTransactions]) => {
      const dayNum = parseInt(day);
      
      dayTransactions.forEach(transaction => {
        if (transaction.type === 'income') {
          result[dayNum].income += transaction.amount;
        } else {
          result[dayNum].expense += transaction.amount;
        }
      });
      
      result[dayNum].balance = result[dayNum].income - result[dayNum].expense;
    });
    
    return result;
  }, [transactionsByDay, daysInMonth]);

  // Gerar dias do calendário (incluindo dias vazios para alinhamento)
  const calendarDays = useMemo(() => {
    const days = [];
    
    // Adicionar dias vazios no início para alinhar com o dia da semana correto
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Adicionar dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  }, [firstDayOfMonth, daysInMonth]);

  // Nomes dos dias da semana
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Verificar se um dia é hoje
  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === year && 
           today.getMonth() === month - 1 && 
           today.getDate() === day;
  };

  // Obter classe de cor com base no saldo
  const getBalanceColorClass = (balance: number) => {
    if (balance > 0) return "text-green-600 dark:text-green-400";
    if (balance < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  // Função para navegar para o mês anterior ou próximo
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Função para lidar com o clique em um dia
  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    const clickedDate = new Date(year, month - 1, day);
    onDateClick(clickedDate);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white">
          Calendário Financeiro
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, index) => (
          <div 
            key={index} 
            className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Dias do mês */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <div 
            key={index} 
            className={`
              p-1 min-h-[80px] border border-gray-200 dark:border-gray-700 rounded
              ${day === null ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50'}
              ${isToday(day as number) ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}
              ${selectedDay === day ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}
            `}
            onClick={() => day !== null && handleDayClick(day)}
          >
            {day !== null && (
              <>
                <div className="flex justify-between items-center">
                  <span className={`
                    text-sm font-medium 
                    ${isToday(day) ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}
                  `}>
                    {day}
                  </span>
                  
                  {dailyBalance[day].income > 0 || dailyBalance[day].expense > 0 ? (
                    <span className={`text-xs font-medium ${getBalanceColorClass(dailyBalance[day].balance)}`}>
                      {formatCurrency(dailyBalance[day].balance)}
                    </span>
                  ) : null}
                </div>
                
                {/* Indicadores de transações */}
                <div className="mt-1 space-y-1">
                  {dailyBalance[day].income > 0 && (
                    <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                      <ArrowUpCircle className="h-3 w-3 mr-1" />
                      <span>{formatCurrency(dailyBalance[day].income)}</span>
                    </div>
                  )}
                  
                  {dailyBalance[day].expense > 0 && (
                    <div className="flex items-center text-xs text-red-600 dark:text-red-400">
                      <ArrowDownCircle className="h-3 w-3 mr-1" />
                      <span>{formatCurrency(dailyBalance[day].expense)}</span>
                    </div>
                  )}
                  
                  {transactionsByDay[day].length > 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {transactionsByDay[day].length} transações
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 