"use client";

import { useState, useEffect } from "react";
import { Target, Plus, Edit2, Trash2, Check, X, DollarSign, TrendingUp } from "lucide-react";
import { Transaction } from "@/lib/types";

interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  color: string;
}

interface FinancialGoalsVisualProps {
  transactions: Transaction[];
}

export default function FinancialGoalsVisual({ transactions }: FinancialGoalsVisualProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState<string | null>(null);
  
  // Formulário para nova meta
  const [newGoal, setNewGoal] = useState<Omit<Goal, 'id'>>({
    title: '',
    targetAmount: 0,
    currentAmount: 0,
    deadline: '',
    category: 'savings',
    color: '#4f46e5'
  });

  // Cores disponíveis para as metas
  const availableColors = [
    '#4f46e5', // indigo
    '#0ea5e9', // sky
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
  ];

  // Categorias de metas
  const goalCategories = [
    { value: 'savings', label: 'Poupança' },
    { value: 'investment', label: 'Investimento' },
    { value: 'debt', label: 'Quitar Dívida' },
    { value: 'purchase', label: 'Compra' },
    { value: 'travel', label: 'Viagem' },
    { value: 'education', label: 'Educação' },
    { value: 'retirement', label: 'Aposentadoria' },
    { value: 'other', label: 'Outro' }
  ];

  // Carregar metas do localStorage
  useEffect(() => {
    const savedGoals = localStorage.getItem('financialGoals');
    if (savedGoals) {
      try {
        setGoals(JSON.parse(savedGoals));
      } catch (error) {
        console.error('Erro ao carregar metas:', error);
      }
    }
  }, []);

  // Salvar metas no localStorage
  useEffect(() => {
    if (goals.length > 0) {
      localStorage.setItem('financialGoals', JSON.stringify(goals));
    }
  }, [goals]);

  // Formatar moeda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  // Adicionar nova meta
  const handleAddGoal = () => {
    if (!newGoal.title || newGoal.targetAmount <= 0 || !newGoal.deadline) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const goal: Goal = {
      ...newGoal,
      id: Date.now().toString()
    };

    setGoals([...goals, goal]);
    setIsAddingGoal(false);
    setNewGoal({
      title: '',
      targetAmount: 0,
      currentAmount: 0,
      deadline: '',
      category: 'savings',
      color: availableColors[Math.floor(Math.random() * availableColors.length)]
    });
  };

  // Atualizar meta existente
  const handleUpdateGoal = (id: string) => {
    const updatedGoals = goals.map(goal => 
      goal.id === id ? { ...newGoal, id } : goal
    );
    setGoals(updatedGoals);
    setIsEditingGoal(null);
  };

  // Iniciar edição de meta
  const startEditGoal = (goal: Goal) => {
    setNewGoal({
      title: goal.title,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.deadline,
      category: goal.category,
      color: goal.color
    });
    setIsEditingGoal(goal.id);
  };

  // Excluir meta
  const handleDeleteGoal = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta meta?')) {
      setGoals(goals.filter(goal => goal.id !== id));
    }
  };

  // Calcular progresso da meta
  const calculateProgress = (current: number, target: number) => {
    const progress = (current / target) * 100;
    return Math.min(progress, 100); // Limitar a 100%
  };

  // Calcular dias restantes
  const calculateRemainingDays = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Obter ícone da categoria
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'savings':
      case 'investment':
      case 'retirement':
        return <TrendingUp className="h-5 w-5" />;
      case 'debt':
      case 'purchase':
      case 'travel':
      case 'education':
      case 'other':
      default:
        return <DollarSign className="h-5 w-5" />;
    }
  };

  // Obter nome da categoria
  const getCategoryName = (categoryValue: string) => {
    const category = goalCategories.find(cat => cat.value === categoryValue);
    return category ? category.label : 'Outro';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white flex items-center">
          <Target className="mr-2 h-5 w-5 text-indigo-500" />
          Metas Financeiras
        </h3>
        <button
          onClick={() => setIsAddingGoal(true)}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
        >
          <Plus className="mr-1 h-4 w-4" />
          Nova Meta
        </button>
      </div>

      {/* Formulário para adicionar/editar meta */}
      {(isAddingGoal || isEditingGoal) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
          <h4 className="text-md font-medium text-gray-800 dark:text-white mb-4">
            {isEditingGoal ? 'Editar Meta' : 'Nova Meta'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Título
              </label>
              <input
                type="text"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ex: Fundo de emergência"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoria
              </label>
              <select
                value={newGoal.category}
                onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {goalCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valor Alvo (R$)
              </label>
              <input
                type="number"
                value={newGoal.targetAmount}
                onChange={(e) => setNewGoal({ ...newGoal, targetAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valor Atual (R$)
              </label>
              <input
                type="number"
                value={newGoal.currentAmount}
                onChange={(e) => setNewGoal({ ...newGoal, currentAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Limite
              </label>
              <input
                type="date"
                value={newGoal.deadline}
                onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cor
              </label>
              <div className="flex space-x-2">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewGoal({ ...newGoal, color })}
                    className={`w-6 h-6 rounded-full ${
                      newGoal.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Cor ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={() => {
                setIsAddingGoal(false);
                setIsEditingGoal(null);
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
            >
              <X className="mr-1 h-4 w-4" />
              Cancelar
            </button>
            <button
              onClick={isEditingGoal ? () => handleUpdateGoal(isEditingGoal) : handleAddGoal}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
            >
              <Check className="mr-1 h-4 w-4" />
              {isEditingGoal ? 'Atualizar' : 'Adicionar'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de metas */}
      {goals.length === 0 && !isAddingGoal ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Você ainda não tem metas financeiras definidas.
          </p>
          <button
            onClick={() => setIsAddingGoal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeira Meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
            const remainingDays = calculateRemainingDays(goal.deadline);
            const isOverdue = remainingDays < 0;
            const isCompleted = progress >= 100;
            
            return (
              <div 
                key={goal.id} 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-t-4"
                style={{ borderColor: goal.color }}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div 
                        className="p-2 rounded-md mr-3"
                        style={{ backgroundColor: `${goal.color}20` }}
                      >
                        {getCategoryIcon(goal.category)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-white">
                          {goal.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {getCategoryName(goal.category)}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => startEditGoal(goal)}
                        className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                        aria-label="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Progresso</span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="h-2.5 rounded-full" 
                        style={{ 
                          width: `${progress}%`,
                          backgroundColor: isCompleted ? '#10b981' : goal.color
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Atual</p>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {formatCurrency(goal.currentAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Meta</p>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Faltam</p>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount))}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Prazo</p>
                      <p className={`font-medium ${
                        isOverdue 
                          ? 'text-red-600 dark:text-red-400' 
                          : remainingDays <= 7 
                            ? 'text-yellow-600 dark:text-yellow-400' 
                            : 'text-gray-800 dark:text-white'
                      }`}>
                        {isOverdue 
                          ? `${Math.abs(remainingDays)} dias atrás` 
                          : remainingDays === 0 
                            ? 'Hoje' 
                            : `${remainingDays} dias`}
                      </p>
                    </div>
                  </div>
                  
                  {isCompleted && (
                    <div className="mt-3 py-1 px-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-md inline-flex items-center">
                      <Check className="h-3 w-3 mr-1" />
                      Meta atingida!
                    </div>
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