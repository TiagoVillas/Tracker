"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { TransactionCategory } from "@/lib/types";
import { createInstallmentPurchase } from "@/lib/financeUtils";
import { X } from "lucide-react";

interface AddInstallmentPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseAdded: () => void;
}

export default function AddInstallmentPurchaseModal({
  isOpen,
  onClose,
  onPurchaseAdded
}: AddInstallmentPurchaseModalProps) {
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [installments, setInstallments] = useState("");
  const [category, setCategory] = useState<TransactionCategory>("shopping");
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Calcular valor da parcela
  const calculateInstallmentAmount = () => {
    const total = parseFloat(totalAmount);
    const installmentCount = parseInt(installments);
    
    if (isNaN(total) || isNaN(installmentCount) || installmentCount <= 0) {
      return 0;
    }
    
    return total / installmentCount;
  };

  // Formatar moeda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  // Lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError("Usuário não autenticado");
      return;
    }
    
    if (!description.trim()) {
      setError("Descrição é obrigatória");
      return;
    }
    
    const totalAmountValue = parseFloat(totalAmount);
    if (isNaN(totalAmountValue) || totalAmountValue <= 0) {
      setError("Valor total inválido");
      return;
    }
    
    const installmentsValue = parseInt(installments);
    if (isNaN(installmentsValue) || installmentsValue <= 0) {
      setError("Número de parcelas inválido");
      return;
    }
    
    const installmentAmount = calculateInstallmentAmount();
    if (installmentAmount <= 0) {
      setError("Valor da parcela inválido");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError("");
      
      // Calcular próxima data de vencimento (um mês após a data inicial)
      const startDateObj = new Date(startDate);
      const nextDueDate = new Date(startDateObj);
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      
      const purchase = {
        userId: user.uid,
        description,
        totalAmount: totalAmountValue,
        installmentAmount,
        totalInstallments: installmentsValue,
        startDate: startDateObj,
        nextDueDate,
        category
      };
      
      const result = await createInstallmentPurchase(purchase);
      
      if (result) {
        onPurchaseAdded();
        onClose();
      } else {
        setError("Erro ao criar compra parcelada");
      }
    } catch (error) {
      console.error("Erro ao criar compra parcelada:", error);
      setError("Erro ao criar compra parcelada. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Nova Compra Parcelada
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrição
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ex: Geladeira, Celular, etc."
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Valor Total
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
                R$
              </span>
              <input
                type="number"
                id="totalAmount"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="0,00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="installments" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Número de Parcelas
            </label>
            <input
              type="number"
              id="installments"
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ex: 12"
              min="1"
              required
            />
          </div>
          
          {totalAmount && installments && parseInt(installments) > 0 && (
            <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-md">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Valor de cada parcela: <span className="font-semibold">{formatCurrency(calculateInstallmentAmount())}</span>
              </p>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoria
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TransactionCategory)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              required
            >
              <optgroup label="Despesas">
                <option value="food">Alimentação</option>
                <option value="housing">Moradia</option>
                <option value="transportation">Transporte</option>
                <option value="utilities">Contas e Serviços</option>
                <option value="entertainment">Entretenimento</option>
                <option value="healthcare">Saúde</option>
                <option value="education">Educação</option>
                <option value="shopping">Compras</option>
                <option value="travel">Viagens</option>
                <option value="other_expense">Outras Despesas</option>
              </optgroup>
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data da Primeira Parcela
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50"
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 