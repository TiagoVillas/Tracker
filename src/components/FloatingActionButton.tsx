"use client";

import { useState } from "react";
import { Plus, DollarSign, ArrowUpCircle, ArrowDownCircle, TrendingUp, X } from "lucide-react";

interface FloatingActionButtonProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddInvestment: () => void;
}

export default function FloatingActionButton({ 
  onAddIncome, 
  onAddExpense,
  onAddInvestment
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleAddIncome = () => {
    onAddIncome();
    setIsOpen(false);
  };

  const handleAddExpense = () => {
    onAddExpense();
    setIsOpen(false);
  };

  const handleAddInvestment = () => {
    onAddInvestment();
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Menu de opções */}
      {isOpen && (
        <div className="flex flex-col-reverse items-end space-y-reverse space-y-2 mb-4">
          <div className="flex items-center">
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 px-3 mr-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              Adicionar Entrada
            </div>
            <button
              onClick={handleAddIncome}
              className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg hover:bg-indigo-600 transition-colors"
              aria-label="Adicionar entrada"
            >
              <ArrowUpCircle className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex items-center">
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 px-3 mr-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              Adicionar Saída
            </div>
            <button
              onClick={handleAddExpense}
              className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
              aria-label="Adicionar saída"
            >
              <ArrowDownCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="flex items-center">
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 px-3 mr-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              Adicionar Investimento
            </div>
            <button
              onClick={handleAddInvestment}
              className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
              aria-label="Adicionar investimento"
            >
              <TrendingUp className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
      
      {/* Botão principal */}
      <button
        onClick={toggleMenu}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          isOpen 
            ? 'bg-gray-700 dark:bg-gray-600 rotate-45' 
            : 'bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-700 dark:to-blue-700'
        }`}
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Plus className="h-6 w-6 text-white" />
        )}
      </button>
    </div>
  );
} 