"use client";

import { useMemo } from "react";
import { Transaction } from "@/lib/types";
import { ArrowUpCircle, ArrowDownCircle, Calendar, X } from "lucide-react";
import { deleteTransaction } from "@/lib/financeUtils";

interface DailyTransactionDetailsProps {
  transactions: Transaction[];
  selectedDate: Date | null;
  onClose: () => void;
  onTransactionUpdated: () => void;
  onEditTransaction: (transaction: Transaction) => void;
}

export default function DailyTransactionDetails({
  transactions,
  selectedDate,
  onClose,
  onTransactionUpdated,
  onEditTransaction
}: DailyTransactionDetailsProps) {
  // Formatar moeda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  // Filtrar transações para a data selecionada
  const filteredTransactions = useMemo(() => {
    if (!selectedDate) return [];
    
    return transactions.filter(transaction => {
      const transactionDate = typeof transaction.date === 'string' 
        ? new Date(transaction.date) 
        : transaction.date;
      
      return (
        transactionDate.getFullYear() === selectedDate.getFullYear() &&
        transactionDate.getMonth() === selectedDate.getMonth() &&
        transactionDate.getDate() === selectedDate.getDate()
      );
    });
  }, [transactions, selectedDate]);

  // Calcular totais
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    filteredTransactions.forEach(transaction => {
      if (transaction.type === 'income') {
        income += transaction.amount;
      } else {
        expense += transaction.amount;
      }
    });
    
    return {
      income,
      expense,
      balance: income - expense
    };
  }, [filteredTransactions]);

  // Obter classe de cor com base no tipo de transação
  const getTypeColorClass = (type: string) => {
    return type === 'income' 
      ? "text-green-600 dark:text-green-400" 
      : "text-red-600 dark:text-red-400";
  };

  // Obter ícone com base no tipo de transação
  const getTypeIcon = (type: string) => {
    return type === 'income' 
      ? <ArrowUpCircle className="h-5 w-5 text-green-500" /> 
      : <ArrowDownCircle className="h-5 w-5 text-red-500" />;
  };

  // Formatar categoria
  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Lidar com exclusão de transação
  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta transação?")) {
      try {
        await deleteTransaction(id);
        onTransactionUpdated();
      } catch (error) {
        console.error("Error deleting transaction:", error);
        alert("Erro ao excluir transação. Tente novamente.");
      }
    }
  };

  if (!selectedDate || filteredTransactions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mt-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-indigo-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-800 dark:text-white">
            Transações do dia {selectedDate.toLocaleDateString('pt-BR')}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Resumo do dia */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <p className="text-sm font-medium text-green-600 dark:text-green-400">Entradas</p>
          <p className="text-lg font-bold text-green-700 dark:text-green-300">
            {formatCurrency(totals.income)}
          </p>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">Saídas</p>
          <p className="text-lg font-bold text-red-700 dark:text-red-300">
            {formatCurrency(totals.expense)}
          </p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Saldo</p>
          <p className={`text-lg font-bold ${totals.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(totals.balance)}
          </p>
        </div>
      </div>

      {/* Lista de transações */}
      <div className="space-y-3">
        {filteredTransactions.map(transaction => (
          <div 
            key={transaction.id} 
            className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <div className="flex items-center">
              {getTypeIcon(transaction.type)}
              <div className="ml-3">
                <p className="font-medium text-gray-800 dark:text-white">
                  {transaction.description}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatCategory(transaction.category)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <p className={`font-medium mr-4 ${getTypeColorClass(transaction.type)}`}>
                {formatCurrency(transaction.amount)}
              </p>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => onEditTransaction(transaction)}
                  className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(transaction.id)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 