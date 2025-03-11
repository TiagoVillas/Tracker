"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { updateSubscription } from "@/lib/financeUtils";
import { Subscription, TransactionCategory } from "@/lib/types";

interface EditSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription;
  onSubscriptionUpdated: () => void;
}

export default function EditSubscriptionModal({
  isOpen,
  onClose,
  subscription,
  onSubscriptionUpdated
}: EditSubscriptionModalProps) {
  const [description, setDescription] = useState(subscription.description);
  const [amount, setAmount] = useState(subscription.amount.toString());
  const [category, setCategory] = useState<TransactionCategory>(subscription.category);
  const [nextPaymentDate, setNextPaymentDate] = useState(() => {
    const dateObj = typeof subscription.nextPaymentDate === 'string' 
      ? new Date(subscription.nextPaymentDate) 
      : subscription.nextPaymentDate;
    return dateObj.toISOString().split("T")[0];
  });
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>(
    subscription.frequency || 'monthly'
  );
  const [autoRenew, setAutoRenew] = useState<boolean>(subscription.autoRenew ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Update form when subscription changes
  useEffect(() => {
    setDescription(subscription.description);
    setAmount(subscription.amount.toString());
    setCategory(subscription.category);
    
    const nextDateObj = typeof subscription.nextPaymentDate === 'string' 
      ? new Date(subscription.nextPaymentDate) 
      : subscription.nextPaymentDate;
    setNextPaymentDate(nextDateObj.toISOString().split("T")[0]);
    
    setFrequency(subscription.frequency || 'monthly');
    setAutoRenew(subscription.autoRenew ?? true);
  }, [subscription]);

  // Expense categories
  const expenseCategories: TransactionCategory[] = [
    "subscription",
    "entertainment",
    "utilities",
    "housing",
    "healthcare",
    "education",
    "food",
    "transportation",
    "shopping",
    "travel",
    "work",
    "other_expense"
  ];

  // Format category name for display
  const formatCategoryName = (category: string) => {
    return category
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!description.trim()) {
      setError("A descrição é obrigatória");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("O valor deve ser maior que zero");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateSubscription(subscription.id, {
        description,
        amount: parseFloat(amount),
        category,
        nextPaymentDate,
        frequency,
        autoRenew
      });

      onSubscriptionUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating subscription:", error);
      setError(`Erro ao atualizar assinatura: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
        </div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Editar Assinatura
            </h3>

            {error && (
              <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Descrição
                </label>
                <input
                  type="text"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Ex: Netflix, Spotify, Academia..."
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Valor (R$)
                </label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Categoria
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  {expenseCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {formatCategoryName(cat)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="frequency"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Frequência
                </label>
                <select
                  id="frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as 'monthly' | 'quarterly' | 'yearly')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="monthly">Mensal</option>
                  <option value="quarterly">Trimestral</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="nextPaymentDate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Próximo Pagamento
                </label>
                <input
                  type="date"
                  id="nextPaymentDate"
                  value={nextPaymentDate}
                  onChange={(e) => setNextPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox text-indigo-600"
                    checked={autoRenew}
                    onChange={(e) => setAutoRenew(e.target.checked)}
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    Renovação automática
                  </span>
                </label>
              </div>

              <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 