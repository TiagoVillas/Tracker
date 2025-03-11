"use client";

import { useState, useEffect } from "react";
import { Transaction } from "@/lib/types";
import { Target, TrendingUp, AlertTriangle, CheckCircle, Edit, Trash2, Plus, X } from "lucide-react";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  category?: string;
  deadline?: Date | string;
  isExpense: boolean;
}

interface FinancialGoalsProps {
  transactions: Transaction[];
  currentMonth: string;
}

export default function FinancialGoals({ transactions, currentMonth }: FinancialGoalsProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState<Omit<Goal, 'id'>>({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    category: '',
    isExpense: true
  });
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // Carregar metas do localStorage
  useEffect(() => {
    const savedGoals = localStorage.getItem('financialGoals');
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    }
  }, []);

  // Salvar metas no localStorage
  useEffect(() => {
    if (goals.length > 0) {
      localStorage.setItem('financialGoals', JSON.stringify(goals));
    }
  }, [goals]);

  // Atualizar progresso das metas com base nas transações
  useEffect(() => {
    if (goals.length === 0 || transactions.length === 0) return;

    const [year, month] = currentMonth.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const updatedGoals = goals.map(goal => {
      // Filtrar transações do mês atual
      const relevantTransactions = transactions.filter(transaction => {
        const transactionDate = typeof transaction.date === 'string' 
          ? new Date(transaction.date) 
          : transaction.date;
        
        return (
          transactionDate >= startDate && 
          transactionDate <= endDate &&
          (
            // Se a meta tem categoria, filtrar por categoria
            !goal.category || 
            transaction.category === goal.category
          ) &&
          // Filtrar por tipo (receita/despesa)
          ((goal.isExpense && transaction.type === 'expense') ||
           (!goal.isExpense && transaction.type === 'income'))
        );
      });

      // Calcular valor atual
      const currentAmount = relevantTransactions.reduce((sum, transaction) => {
        return sum + transaction.amount;
      }, 0);

      return {
        ...goal,
        currentAmount
      };
    });

    setGoals(updatedGoals);
  }, [transactions, currentMonth]);

  // Formatar moeda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  // Calcular porcentagem de progresso
  const calculateProgress = (current: number, target: number, isExpense: boolean) => {
    if (target === 0) return 0;
    
    // Para despesas, queremos ficar abaixo do alvo (100% = gastou tudo que podia)
    if (isExpense) {
      return Math.min(100, (current / target) * 100);
    }
    
    // Para receitas, queremos atingir o alvo (100% = atingiu a meta)
    return Math.min(100, (current / target) * 100);
  };

  // Obter cor do progresso
  const getProgressColor = (progress: number, isExpense: boolean) => {
    if (isExpense) {
      // Para despesas, vermelho quando próximo do limite
      if (progress >= 90) return "bg-red-500";
      if (progress >= 75) return "bg-yellow-500";
      return "bg-green-500";
    } else {
      // Para receitas, verde quando próximo da meta
      if (progress >= 90) return "bg-green-500";
      if (progress >= 50) return "bg-yellow-500";
      return "bg-red-500";
    }
  };

  // Adicionar nova meta
  const handleAddGoal = () => {
    if (!newGoal.name || newGoal.targetAmount <= 0) {
      alert("Por favor, preencha o nome e defina um valor alvo maior que zero.");
      return;
    }

    const goalId = `goal-${Date.now()}`;
    
    if (editingGoalId) {
      // Atualizar meta existente
      setGoals(goals.map(goal => 
        goal.id === editingGoalId 
          ? { ...newGoal, id: editingGoalId } 
          : goal
      ));
      setEditingGoalId(null);
    } else {
      // Adicionar nova meta
      setGoals([...goals, { ...newGoal, id: goalId }]);
    }
    
    // Resetar formulário
    setNewGoal({
      name: '',
      targetAmount: 0,
      currentAmount: 0,
      category: '',
      isExpense: true
    });
    setShowAddGoal(false);
  };

  // Editar meta
  const handleEditGoal = (goal: Goal) => {
    setNewGoal({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      category: goal.category || '',
      deadline: goal.deadline,
      isExpense: goal.isExpense
    });
    setEditingGoalId(goal.id);
    setShowAddGoal(true);
  };

  // Excluir meta
  const handleDeleteGoal = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta meta?")) {
      setGoals(goals.filter(goal => goal.id !== id));
    }
  };

  // Categorias disponíveis
  const expenseCategories = [
    "food", "housing", "transportation", "utilities", 
    "entertainment", "healthcare", "education", "subscription", 
    "shopping", "travel", "work", "other_expense"
  ];
  
  const incomeCategories = [
    "salary", "investment", "gift", "other_income"
  ];

  // Formatar nome da categoria
  const formatCategoryName = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white flex items-center">
          <Target className="mr-2 h-5 w-5 text-indigo-500" />
          Metas Financeiras
        </h3>
        <button
          onClick={() => setShowAddGoal(!showAddGoal)}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
        >
          {showAddGoal ? (
            <>
              <X className="mr-1 h-4 w-4" />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="mr-1 h-4 w-4" />
              Nova Meta
            </>
          )}
        </button>
      </div>

      {/* Formulário para adicionar/editar meta */}
      {showAddGoal && (
        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h4 className="text-md font-medium mb-3 text-gray-800 dark:text-white">
            {editingGoalId ? 'Editar Meta' : 'Nova Meta'}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome da Meta
              </label>
              <input
                type="text"
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ex: Limite de gastos com alimentação"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valor Alvo
              </label>
              <input
                type="number"
                value={newGoal.targetAmount || ''}
                onChange={(e) => setNewGoal({ ...newGoal, targetAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo
              </label>
              <select
                value={newGoal.isExpense ? 'expense' : 'income'}
                onChange={(e) => setNewGoal({ ...newGoal, isExpense: e.target.value === 'expense' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="expense">Limite de Despesa</option>
                <option value="income">Meta de Receita</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoria (opcional)
              </label>
              <select
                value={newGoal.category || ''}
                onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Todas as categorias</option>
                {(newGoal.isExpense ? expenseCategories : incomeCategories).map(category => (
                  <option key={category} value={category}>
                    {formatCategoryName(category)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleAddGoal}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
            >
              {editingGoalId ? 'Atualizar' : 'Adicionar'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de metas */}
      {goals.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg">Nenhuma meta definida</p>
          <p className="mt-2">Adicione metas para acompanhar seus objetivos financeiros</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => {
            const progress = calculateProgress(goal.currentAmount, goal.targetAmount, goal.isExpense);
            const progressColor = getProgressColor(progress, goal.isExpense);
            
            return (
              <div key={goal.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-white">{goal.name}</h4>
                    {goal.category && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Categoria: {formatCategoryName(goal.category)}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditGoal(goal)}
                      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 p-1"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {goal.isExpense ? 'Limite:' : 'Meta:'} {formatCurrency(goal.targetAmount)}
                  </div>
                  <div className="text-sm font-medium">
                    {formatCurrency(goal.currentAmount)} ({progress.toFixed(0)}%)
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
                  <div 
                    className={`${progressColor} h-2.5 rounded-full`} 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center mt-2">
                  {goal.isExpense ? (
                    goal.currentAmount > goal.targetAmount ? (
                      <div className="flex items-center text-xs text-red-600 dark:text-red-400">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        <span>Limite excedido em {formatCurrency(goal.currentAmount - goal.targetAmount)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        <span>Restam {formatCurrency(goal.targetAmount - goal.currentAmount)}</span>
                      </div>
                    )
                  ) : (
                    goal.currentAmount >= goal.targetAmount ? (
                      <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        <span>Meta atingida! +{formatCurrency(goal.currentAmount - goal.targetAmount)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        <span>Faltam {formatCurrency(goal.targetAmount - goal.currentAmount)}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 