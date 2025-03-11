"use client";

import { useMemo } from "react";
import { Transaction } from "@/lib/types";
import { calculateFinancialSummary } from "@/lib/financeUtils";
import { ArrowUpCircle, ArrowDownCircle, DollarSign } from "lucide-react";

interface FinanceSummaryProps {
  transactions: Transaction[];
}

export default function FinanceSummary({ transactions }: FinanceSummaryProps) {
  const summary = useMemo(() => calculateFinancialSummary(transactions), [transactions]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };
  
  // Calculate percentage of expenses by category
  const expensePercentages = useMemo(() => {
    if (summary.totalExpenses === 0) return {};
    
    return Object.entries(summary.expensesByCategory).reduce((acc, [category, amount]) => {
      acc[category] = (amount / summary.totalExpenses) * 100;
      return acc;
    }, {} as Record<string, number>);
  }, [summary]);
  
  // Get color based on balance
  const getBalanceColor = () => {
    if (summary.balance > 0) return "text-green-600 dark:text-green-400";
    if (summary.balance < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Resumo Financeiro</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Income Card */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <ArrowUpCircle className="h-8 w-8 text-green-500 dark:text-green-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Entradas</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {formatCurrency(summary.totalIncome)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Expense Card */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <ArrowDownCircle className="h-8 w-8 text-red-500 dark:text-red-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Saídas</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {formatCurrency(summary.totalExpenses)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Balance Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-blue-500 dark:text-blue-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Saldo</p>
              <p className={`text-2xl font-bold ${getBalanceColor()}`}>
                {formatCurrency(summary.balance)}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Expense Breakdown */}
      {summary.totalExpenses > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300">Despesas por Categoria</h3>
          <div className="space-y-2">
            {Object.entries(summary.expensesByCategory)
              .sort(([, a], [, b]) => b - a) // Sort by amount (highest first)
              .map(([category, amount]) => (
                <div key={category} className="bg-white dark:bg-gray-700 rounded-md p-3 shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {category.replace('_', ' ')}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full" 
                      style={{ width: `${expensePercentages[category]}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-right mt-1 text-gray-500 dark:text-gray-400">
                    {expensePercentages[category].toFixed(1)}%
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
} 