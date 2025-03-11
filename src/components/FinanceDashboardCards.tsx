"use client";

import { useMemo } from "react";
import { Transaction } from "@/lib/types";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend
} from "recharts";
import { 
  TrendingUp, 
  PiggyBank, 
  CreditCard, 
  DollarSign, 
  Target, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Percent
} from "lucide-react";

interface FinanceDashboardCardsProps {
  transactions: Transaction[];
}

export default function FinanceDashboardCards({ transactions }: FinanceDashboardCardsProps) {
  // Cores para os gráficos
  const COLORS = [
    "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe", 
    "#00C49F", "#FFBB28", "#FF8042", "#a4de6c", "#d0ed57"
  ];

  // Formatar moeda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  // Formatar porcentagem
  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Calcular totais
  const totals = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const investment = transactions
      .filter(t => t.type === 'investment')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expense - investment;
    
    return { income, expense, investment, balance };
  }, [transactions]);

  // Obter o salário mensal (considerando a categoria 'salary')
  const monthlySalary = useMemo(() => {
    const salaryTransactions = transactions
      .filter(t => t.type === 'income' && t.category === 'salary');
    
    if (salaryTransactions.length === 0) {
      return 0;
    }
    
    // Se houver mais de uma transação de salário, pegar a maior
    return Math.max(...salaryTransactions.map(t => t.amount));
  }, [transactions]);

  // Dados para o gráfico de distribuição atual
  const currentDistributionData = useMemo(() => {
    // Categorias de necessidades
    const necessitiesCategories = [
      "food", "housing", "transportation", "utilities", "healthcare"
    ];
    
    // Categorias de desejos
    const wantsCategories = [
      "entertainment", "shopping", "travel", "subscription", "other_expense"
    ];
    
    const necessities = transactions
      .filter(t => t.type === 'expense' && necessitiesCategories.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const wants = transactions
      .filter(t => t.type === 'expense' && wantsCategories.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const investments = transactions
      .filter(t => t.type === 'investment')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Se não houver salário, usar o total como base
    const baseAmount = monthlySalary > 0 ? monthlySalary : (necessities + wants + investments);
    
    if (baseAmount === 0) {
      return [
        { name: "Necessidades", value: 0, percentage: 0, color: "#8884d8", idealPercentage: 50 },
        { name: "Desejos", value: 0, percentage: 0, color: "#82ca9d", idealPercentage: 30 },
        { name: "Investimentos", value: 0, percentage: 0, color: "#ffc658", idealPercentage: 20 }
      ];
    }
    
    return [
      { 
        name: "Necessidades", 
        value: necessities, 
        percentage: (necessities / baseAmount) * 100, 
        color: "#8884d8",
        idealPercentage: 50
      },
      { 
        name: "Desejos", 
        value: wants, 
        percentage: (wants / baseAmount) * 100, 
        color: "#82ca9d",
        idealPercentage: 30
      },
      { 
        name: "Investimentos", 
        value: investments, 
        percentage: (investments / baseAmount) * 100, 
        color: "#ffc658",
        idealPercentage: 20
      }
    ];
  }, [transactions, monthlySalary]);

  // Dados para o gráfico de categorias de despesas
  const expenseCategoriesData = useMemo(() => {
    const expensesByCategory: Record<string, number> = {};
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const category = transaction.category;
        if (!expensesByCategory[category]) {
          expensesByCategory[category] = 0;
        }
        expensesByCategory[category] += transaction.amount;
      });
    
    return Object.entries(expensesByCategory)
      .map(([name, value]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value,
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 categorias
  }, [transactions, COLORS]);

  // Dados para o gráfico de categorias de investimentos
  const investmentCategoriesData = useMemo(() => {
    const investmentsByCategory: Record<string, number> = {};
    
    transactions
      .filter(t => t.type === 'investment')
      .forEach(transaction => {
        const category = transaction.category;
        if (!investmentsByCategory[category]) {
          investmentsByCategory[category] = 0;
        }
        investmentsByCategory[category] += transaction.amount;
      });
    
    return Object.entries(investmentsByCategory)
      .map(([name, value]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value,
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, COLORS]);

  // Customizar tooltip do gráfico de pizza
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-md">
          <p className="font-medium text-gray-900 dark:text-white">{payload[0].name}</p>
          {payload[0].payload.percentage !== undefined ? (
            <>
              <p style={{ color: payload[0].color }}>
                {formatCurrency(payload[0].value)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {payload[0].payload.percentage.toFixed(1)}%
              </p>
              {payload[0].payload.idealPercentage !== undefined && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Ideal: {payload[0].payload.idealPercentage}%
                </p>
              )}
            </>
          ) : (
            <p style={{ color: payload[0].color }}>
              {payload[0].value}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Verificar se há dados suficientes
  const hasSalaryData = monthlySalary > 0;
  const hasInvestmentData = investmentCategoriesData.length > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
      {/* Card 2: Sua Distribuição Atual */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
            <PiggyBank className="mr-2 h-6 w-6 text-green-500" />
            Sua Distribuição Atual
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {hasSalaryData 
              ? `Baseado no seu salário de ${formatCurrency(monthlySalary)}`
              : "Como você está distribuindo seu dinheiro"}
          </p>
        </div>
        <div className="p-5">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currentDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={70}
                  innerRadius={30}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, payload }) => 
                    payload.percentage ? `${payload.percentage.toFixed(0)}%` : '0%'
                  }
                  paddingAngle={2}
                >
                  {currentDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={1} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-5 space-y-3">
            {currentDistributionData.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <span className="text-gray-700 dark:text-gray-300 flex items-center font-medium">
                  <span className="w-4 h-4 inline-block mr-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                  {item.name}
                </span>
                <div className="flex items-center">
                  <span className={`font-semibold ${
                    item.percentage < item.idealPercentage * 0.7 || item.percentage > item.idealPercentage * 1.3
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-800 dark:text-white'
                  }`}>
                    {item.percentage !== undefined ? formatPercent(item.percentage) : '0%'}
                  </span>
                  {item.idealPercentage && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      (ideal: {item.idealPercentage}%)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card 3: Principais Categorias de Gastos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
            <CreditCard className="mr-2 h-6 w-6 text-red-500" />
            Top 5 Categorias de Gastos
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Onde seu dinheiro está indo
          </p>
        </div>
        <div className="p-5">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseCategoriesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={70}
                  innerRadius={30}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {expenseCategoriesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={1} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-5 space-y-3">
            {expenseCategoriesData.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <span className="text-gray-700 dark:text-gray-300 flex items-center font-medium">
                  <span 
                    className="w-4 h-4 inline-block mr-2 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></span>
                  {item.name}
                </span>
                <span className="font-semibold text-gray-800 dark:text-white">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card 4: Categorias de Investimentos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
            <TrendingUp className="mr-2 h-6 w-6 text-green-500" />
            Investimentos
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Como você está investindo
          </p>
        </div>
        <div className="p-5">
          {hasInvestmentData ? (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={investmentCategoriesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={70}
                      innerRadius={30}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {investmentCategoriesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={1} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-5 space-y-3">
                {investmentCategoriesData.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <span className="text-gray-700 dark:text-gray-300 flex items-center font-medium">
                      <span 
                        className="w-4 h-4 inline-block mr-2 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></span>
                      {item.name}
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-white">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <TrendingUp className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Você ainda não registrou nenhum investimento.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs">
                Adicione investimentos para ver sua distribuição aqui e começar a planejar seu futuro financeiro.
              </p>
              <button className="mt-4 px-4 py-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg font-medium text-sm hover:bg-green-200 dark:hover:bg-green-800/40 transition-colors">
                Adicionar Investimento
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card 5: Resumo Financeiro */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 md:col-span-2 lg:col-span-3">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
            <DollarSign className="mr-2 h-6 w-6 text-blue-500" />
            Resumo Financeiro
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Visão geral das suas finanças
          </p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/30 p-5 rounded-xl shadow-sm hover:shadow transition-all">
              <div className="flex items-center">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-md mr-4">
                  <ArrowUpCircle className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Receitas</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {formatCurrency(totals.income)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/30 p-5 rounded-xl shadow-sm hover:shadow transition-all">
              <div className="flex items-center">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-md mr-4">
                  <ArrowDownCircle className="h-8 w-8 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Despesas</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
                    {formatCurrency(totals.expense)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/30 p-5 rounded-xl shadow-sm hover:shadow transition-all">
              <div className="flex items-center">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-md mr-4">
                  <TrendingUp className="h-8 w-8 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Investimentos</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatCurrency(totals.investment)}
                  </p>
                  {hasSalaryData && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatPercent((totals.investment / monthlySalary) * 100)} do salário
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className={`bg-gradient-to-br ${
              totals.balance >= 0 
                ? 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30' 
                : 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/30'
            } p-5 rounded-xl shadow-sm hover:shadow transition-all`}>
              <div className="flex items-center">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-md mr-4">
                  <DollarSign className={`h-8 w-8 ${
                    totals.balance >= 0 
                      ? 'text-blue-500' 
                      : 'text-yellow-500'
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Saldo</p>
                  <p className={`text-xl font-bold mt-1 ${
                    totals.balance >= 0 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {formatCurrency(totals.balance)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 