"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DollarSign, Plus, Filter, BarChart2, Calendar as CalendarIcon, Target, Download, RefreshCw } from "lucide-react";
import AddTransactionModal from "@/components/AddTransactionModal";
import TransactionList from "@/components/TransactionList";
import FinanceSummary from "@/components/FinanceSummary";
import SubscriptionList from "@/components/SubscriptionList";
import FinanceCharts from "@/components/FinanceCharts";
import FinanceCalendar from "@/components/FinanceCalendar";
import DailyTransactionDetails from "@/components/DailyTransactionDetails";
import FinancialGoals from "@/components/FinancialGoals";
import ExportFinanceData from "@/components/ExportFinanceData";
import { getTransactionsByUser, createSampleTransactions, createTransaction } from "@/lib/financeUtils";
import { Transaction } from "@/lib/types";
import EditTransactionModal from "@/components/EditTransactionModal";
import Navbar from "@/components/Navbar";
import FinanceDashboardCards from "@/components/FinanceDashboardCards";
import FinancialTips from "@/components/FinancialTips";
import FinancialGoalsVisual from "@/components/FinancialGoalsVisual";
import FloatingActionButton from "@/components/FloatingActionButton";

export default function FinancesPage() {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transactions' | 'subscriptions' | 'analytics' | 'calendar' | 'goals' | 'goals-classic'>('transactions');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCreatingSamples, setIsCreatingSamples] = useState(false);
  const [analyticsView, setAnalyticsView] = useState<'cards' | 'detailed'>('cards');
  const [defaultTransactionType, setDefaultTransactionType] = useState<'income' | 'expense' | 'investment'>('expense');

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user, currentMonth, viewMode]);

  useEffect(() => {
    console.log("Transações atualizadas:", transactions);
  }, [transactions]);

  const loadTransactions = async () => {
    if (!user) return;
    
    console.log("Carregando transações...");
    setIsLoading(true);
    try {
      let startDate, endDate;
      
      if (viewMode === 'month') {
        // Modo mensal
        const [year, month] = currentMonth.split('-').map(Number);
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0); // Último dia do mês
      } else {
        // Modo anual
        const year = parseInt(currentMonth.split('-')[0]);
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
      }
      
      console.log(`Buscando transações para o usuário ${user.uid} no período:`, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        currentMonth
      });
      
      // Initialize collections if needed
      const { initializeFinanceCollections, displayIndexInstructions } = await import("@/lib/firebase/firebaseUtils");
      await initializeFinanceCollections(user.uid);
      
      try {
        // Call getTransactionsByUser with separate startDate and endDate parameters
        const fetchedTransactions = await getTransactionsByUser(user.uid, startDate, endDate);
        console.log(`Transações encontradas: ${fetchedTransactions.length}`, fetchedTransactions);
        
        // Atualizar o estado com as transações buscadas
        setTransactions(fetchedTransactions);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        
        // If it's an index error, display instructions
        if (error instanceof Error && error.message.includes("index")) {
          displayIndexInstructions();
        }
        
        // Set empty transactions to avoid breaking the UI
        setTransactions([]);
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
      
      // Try to display index instructions if it's an index error
      try {
        if (error instanceof Error && error.message.includes("index")) {
          const { displayIndexInstructions } = await import("@/lib/firebase/firebaseUtils");
          displayIndexInstructions();
        }
      } catch (e) {
        console.error("Error displaying index instructions:", e);
      }
      
      setTransactions([]);
    } finally {
      setIsLoading(false);
      console.log("Carregamento de transações concluído.");
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMonth(e.target.value);
    setSelectedDate(null); // Resetar data selecionada ao mudar o mês
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleViewModeChange = (mode: 'month' | 'year') => {
    setViewMode(mode);
    setSelectedDate(null);
  };

  const handleCreateSampleTransactions = async () => {
    if (!user) return;
    
    try {
      setIsCreatingSamples(true);
      await createSampleTransactions(user.uid);
      // Recarregar transações após criar as amostras
      await loadTransactions();
      alert("Transações de exemplo criadas com sucesso!");
    } catch (error) {
      console.error("Error creating sample transactions:", error);
      alert("Erro ao criar transações de exemplo. Tente novamente.");
    } finally {
      setIsCreatingSamples(false);
    }
  };

  const handleCreateDirectTransaction = async () => {
    if (!user) return;
    
    try {
      setIsCreatingSamples(true);
      
      // Criar uma transação de receita diretamente
      const incomeTransaction = {
        userId: user.uid,
        description: "Salário Direto",
        amount: 3000,
        type: 'income' as const,
        category: 'salary' as const,
        date: new Date(),
        isRecurring: false
      };
      
      console.log("Criando transação de receita diretamente:", incomeTransaction);
      
      try {
        const incomeResult = await createTransaction(incomeTransaction);
        console.log("Transação de receita criada com sucesso:", incomeResult);
      } catch (incomeError) {
        console.error("Erro ao criar transação de receita:", incomeError);
        alert(`Erro ao criar transação de receita: ${incomeError.message}`);
        setIsCreatingSamples(false);
        return;
      }
      
      // Criar uma transação de despesa diretamente
      const expenseTransaction = {
        userId: user.uid,
        description: "Aluguel Direto",
        amount: 1000,
        type: 'expense' as const,
        category: 'housing' as const,
        date: new Date(),
        isRecurring: false
      };
      
      console.log("Criando transação de despesa diretamente:", expenseTransaction);
      
      try {
        const expenseResult = await createTransaction(expenseTransaction);
        console.log("Transação de despesa criada com sucesso:", expenseResult);
      } catch (expenseError) {
        console.error("Erro ao criar transação de despesa:", expenseError);
        alert(`Erro ao criar transação de despesa: ${expenseError.message}`);
        setIsCreatingSamples(false);
        return;
      }
      
      // Recarregar transações
      console.log("Recarregando transações...");
      await loadTransactions();
      alert("Transações diretas criadas com sucesso!");
    } catch (error) {
      console.error("Erro ao criar transações diretas:", error);
      alert(`Erro ao criar transações diretas: ${error.message}`);
    } finally {
      setIsCreatingSamples(false);
    }
  };

  // Função para abrir o modal de adicionar transação com tipo predefinido
  const handleOpenAddModal = (type: 'income' | 'expense' | 'investment') => {
    setDefaultTransactionType(type);
    setIsAddModalOpen(true);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center text-gray-800 dark:text-white">
                <DollarSign className="mr-2" />
                Gerenciamento Financeiro
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Controle suas finanças, registre entradas e saídas
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleViewModeChange('month')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    viewMode === 'month' 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' 
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  Mês
                </button>
                <button
                  onClick={() => handleViewModeChange('year')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    viewMode === 'year' 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' 
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  Ano
                </button>
              </div>
              
              <input
                type={viewMode === 'month' ? 'month' : 'year'}
                value={currentMonth}
                onChange={handleMonthChange}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                  title="Exportar dados"
                >
                  <Download className="h-4 w-4" />
                </button>
                
                <button
                  onClick={loadTransactions}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                  title="Recarregar transações"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Transação
                </button>
              </div>
            </div>
          </div>

          {/* Adicionar dicas financeiras */}
          <FinancialTips transactions={transactions} />

          {isLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Você ainda não tem transações registradas neste período.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleCreateSampleTransactions}
                  disabled={isCreatingSamples}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50"
                >
                  {isCreatingSamples ? 'Criando...' : 'Criar Transações de Exemplo'}
                </button>
                <button
                  onClick={handleCreateDirectTransaction}
                  disabled={isCreatingSamples}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50"
                >
                  {isCreatingSamples ? 'Criando...' : 'Criar Transações Diretas'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <FinanceSummary transactions={transactions} />
              </div>
              
              <FinanceDashboardCards transactions={transactions} />
            </>
          )}

          <div className="mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'transactions'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <DollarSign className="inline-block h-4 w-4 mr-1" />
                  Transações
                </button>
                <button
                  onClick={() => setActiveTab('subscriptions')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'subscriptions'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <RefreshCw className="inline-block h-4 w-4 mr-1" />
                  Assinaturas
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'analytics'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <BarChart2 className="inline-block h-4 w-4 mr-1" />
                  Análises
                </button>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'calendar'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <CalendarIcon className="inline-block h-4 w-4 mr-1" />
                  Calendário
                </button>
                <button
                  onClick={() => setActiveTab('goals')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'goals' || activeTab === 'goals-classic'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Target className="inline-block h-4 w-4 mr-1" />
                  Metas
                </button>
              </nav>
            </div>
          </div>

          {activeTab === 'transactions' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <TransactionList 
                transactions={transactions} 
                isLoading={isLoading} 
                onTransactionUpdated={loadTransactions}
              />
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <SubscriptionList 
                onSubscriptionUpdated={loadTransactions}
              />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="flex justify-end mb-4">
                <div className="inline-flex rounded-md shadow-sm">
                  <button
                    onClick={() => setAnalyticsView('cards')}
                    className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                      analyticsView === 'cards'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    Cards
                  </button>
                  <button
                    onClick={() => setAnalyticsView('detailed')}
                    className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                      analyticsView === 'detailed'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    Gráficos Detalhados
                  </button>
                </div>
              </div>
              
              {analyticsView === 'cards' ? (
                <FinanceDashboardCards transactions={transactions} />
              ) : (
                <FinanceCharts 
                  transactions={transactions} 
                  period={viewMode}
                  currentMonth={currentMonth}
                />
              )}
            </div>
          )}

          {activeTab === 'calendar' && viewMode === 'month' && (
            <div>
              <FinanceCalendar 
                transactions={transactions}
                currentMonth={currentMonth}
                onDateClick={handleDateClick}
              />
              
              <DailyTransactionDetails 
                transactions={transactions}
                selectedDate={selectedDate}
                onClose={() => setSelectedDate(null)}
                onTransactionUpdated={loadTransactions}
                onEditTransaction={handleEditTransaction}
              />
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="flex justify-end mb-4">
                <div className="inline-flex rounded-md shadow-sm">
                  <button
                    onClick={() => setActiveTab('goals')}
                    className="px-4 py-2 text-sm font-medium rounded-l-md bg-indigo-600 text-white"
                  >
                    Visual
                  </button>
                  <button
                    onClick={() => setActiveTab('goals-classic')}
                    className="px-4 py-2 text-sm font-medium rounded-r-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Clássico
                  </button>
                </div>
              </div>
              
              <FinancialGoalsVisual transactions={transactions} />
            </div>
          )}

          {activeTab === 'goals-classic' && (
            <FinancialGoals 
              transactions={transactions}
              currentMonth={currentMonth}
            />
          )}

          {isAddModalOpen && (
            <AddTransactionModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onTransactionAdded={() => {
                console.log("Transação adicionada, recarregando transações...");
                loadTransactions();
              }}
              defaultType={defaultTransactionType}
            />
          )}

          {isEditModalOpen && selectedTransaction && (
            <EditTransactionModal
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false);
                setSelectedTransaction(null);
              }}
              transaction={selectedTransaction}
              onTransactionUpdated={loadTransactions}
            />
          )}

          {isExportModalOpen && (
            <ExportFinanceData
              isOpen={isExportModalOpen}
              onClose={() => setIsExportModalOpen(false)}
              transactions={transactions}
              currentMonth={currentMonth}
            />
          )}
          
          {/* Botão de ação flutuante */}
          <FloatingActionButton 
            onAddIncome={() => handleOpenAddModal('income')}
            onAddExpense={() => handleOpenAddModal('expense')}
            onAddInvestment={() => handleOpenAddModal('investment')}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
} 