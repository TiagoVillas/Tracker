"use client";

import { useState, useEffect } from "react";
import { InstallmentPurchase, TransactionCategory } from "@/lib/types";
import { updateInstallmentPurchase } from "@/lib/financeUtils";
import { X } from "lucide-react";

interface EditInstallmentPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: InstallmentPurchase;
  onPurchaseUpdated: () => void;
}

export default function EditInstallmentPurchaseModal({
  isOpen,
  onClose,
  purchase,
  onPurchaseUpdated
}: EditInstallmentPurchaseModalProps) {
  const [description, setDescription] = useState(purchase.description);
  const [category, setCategory] = useState<TransactionCategory>(purchase.category);
  const [nextDueDate, setNextDueDate] = useState(() => {
    const date = purchase.nextDueDate instanceof Date 
      ? purchase.nextDueDate 
      : new Date(purchase.nextDueDate);
    return date.toISOString().split("T")[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Atualizar estados quando a compra mudar
  useEffect(() => {
    setDescription(purchase.description);
    setCategory(purchase.category);
    
    const date = purchase.nextDueDate instanceof Date 
      ? purchase.nextDueDate 
      : new Date(purchase.nextDueDate);
    setNextDueDate(date.toISOString().split("T")[0]);
  }, [purchase]);

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
    
    if (!description.trim()) {
      setError("Descrição é obrigatória");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError("");
      
      const nextDueDateObj = new Date(nextDueDate);
      
      const updatedPurchase = {
        description,
        category,
        nextDueDate: nextDueDateObj
      };
      
      const success = await updateInstallmentPurchase(purchase.id, updatedPurchase);
      
      if (success) {
        onPurchaseUpdated();
        onClose();
      } else {
        setError("Erro ao atualizar compra parcelada");
      }
    } catch (error) {
      console.error("Erro ao atualizar compra parcelada:", error);
      setError("Erro ao atualizar compra parcelada. Tente novamente.");
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
            Editar Compra Parcelada
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
              required
            />
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between">
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor Total
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(purchase.totalAmount)}
                </span>
              </div>
              
              <div className="text-right">
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor da Parcela
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(purchase.installmentAmount)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between">
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Parcelas Pagas
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {purchase.paidInstallments}/{purchase.totalInstallments}
                </span>
              </div>
              
              <div className="text-right">
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </span>
                <span className={`text-lg font-semibold ${purchase.isCompleted ? 'text-green-600 dark:text-green-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                  {purchase.isCompleted ? 'Concluído' : 'Em andamento'}
                </span>
              </div>
            </div>
          </div>
          
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
          
          {!purchase.isCompleted && (
            <div className="mb-4">
              <label htmlFor="nextDueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Próxima Data de Vencimento
              </label>
              <input
                type="date"
                id="nextDueDate"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          )}
          
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
              disabled={isSubmitting || purchase.isCompleted}
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