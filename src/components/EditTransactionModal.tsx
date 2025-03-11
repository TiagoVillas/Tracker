"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { updateTransaction } from "@/lib/financeUtils";
import { Transaction, TransactionType, TransactionCategory } from "@/lib/types";

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  onTransactionUpdated: () => void;
}

export default function EditTransactionModal({
  isOpen,
  onClose,
  transaction,
  onTransactionUpdated
}: EditTransactionModalProps) {
  const [description, setDescription] = useState(transaction.description);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [category, setCategory] = useState<TransactionCategory>(transaction.category);
  const [date, setDate] = useState(() => {
    const dateObj = typeof transaction.date === 'string' 
      ? new Date(transaction.date) 
      : transaction.date;
    return dateObj.toISOString().split("T")[0];
  });
  const [isRecurring, setIsRecurring] = useState(transaction.isRecurring);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Income categories
  const incomeCategories: TransactionCategory[] = [
    "salary",
    "gift",
    "other_income"
  ];

  // Expense categories
  const expenseCategories: TransactionCategory[] = [
    "food",
    "housing",
    "transportation",
    "utilities",
    "entertainment",
    "healthcare",
    "education",
    "subscription",
    "shopping",
    "travel",
    "work",
    "other_expense"
  ];

  // Investment categories
  const investmentCategories: TransactionCategory[] = [
    "stocks",
    "bonds",
    "real_estate",
    "crypto",
    "savings",
    "retirement",
    "other_investment"
  ];

  // Update form when transaction changes
  useEffect(() => {
    setDescription(transaction.description);
    setAmount(transaction.amount.toString());
    setType(transaction.type);
    setCategory(transaction.category);
    
    const dateObj = typeof transaction.date === 'string' 
      ? new Date(transaction.date) 
      : transaction.date;
    setDate(dateObj.toISOString().split("T")[0]);
    
    setIsRecurring(transaction.isRecurring);
  }, [transaction]);

  // Get categories based on transaction type
  const categories = 
    type === "income" 
      ? incomeCategories 
      : type === "investment" 
        ? investmentCategories 
        : expenseCategories;

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
      console.log("Atualizando transação:", transaction.id, {
        description,
        amount: parseFloat(amount),
        type,
        category,
        date: new Date(date),
        isRecurring
      });
      
      const success = await updateTransaction(transaction.id, {
        description,
        amount: parseFloat(amount),
        type,
        category,
        date: new Date(date),
        isRecurring
      });

      console.log("Transação atualizada com sucesso:", success);
      
      // Garantir que a função onTransactionUpdated seja chamada após a atualização da transação
      if (success) {
        onTransactionUpdated();
      }
      onClose();
    } catch (error) {
      console.error("Error updating transaction:", error);
      setError("Erro ao atualizar transação. Tente novamente.");
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
              Editar Transação
            </h3>

            {error && (
              <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Tipo
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-indigo-600"
                      name="type"
                      value="income"
                      checked={type === "income"}
                      onChange={() => {
                        setType("income");
                        setCategory(incomeCategories[0]);
                      }}
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">Entrada</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-indigo-600"
                      name="type"
                      value="expense"
                      checked={type === "expense"}
                      onChange={() => {
                        setType("expense");
                        setCategory(expenseCategories[0]);
                      }}
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">Saída</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-green-600"
                      name="type"
                      value="investment"
                      checked={type === "investment"}
                      onChange={() => {
                        setType("investment");
                        setCategory(investmentCategories[0]);
                      }}
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">Investimento</span>
                  </label>
                </div>
              </div>

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
                  placeholder={
                    type === "income" 
                      ? "Ex: Salário, Freelance..." 
                      : type === "investment" 
                        ? "Ex: Ações, Tesouro Direto..." 
                        : "Ex: Aluguel, Mercado..."
                  }
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
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {formatCategoryName(cat)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Data
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox text-indigo-600"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    Transação recorrente
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
                  className={`inline-flex justify-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    type === "income" 
                      ? "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500" 
                      : type === "investment" 
                        ? "bg-green-600 hover:bg-green-700 focus:ring-green-500" 
                        : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                  }`}
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