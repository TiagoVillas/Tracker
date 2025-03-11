"use client";

import { useMemo } from "react";
import { Transaction } from "@/lib/types";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface FinanceChartsProps {
  transactions: Transaction[];
  period: 'month' | 'year';
  currentMonth: string; // formato: 'YYYY-MM'
}

export default function FinanceCharts({ transactions, period, currentMonth }: FinanceChartsProps) {
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

  // Dados para o gráfico de barras (receitas vs despesas por dia/mês)
  const barChartData = useMemo(() => {
    if (period === 'month') {
      // Agrupar por dia do mês
      const [year, month] = currentMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      
      // Inicializar array com todos os dias do mês
      const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        income: 0,
        expense: 0
      }));
      
      // Preencher com dados reais
      transactions.forEach(transaction => {
        const transactionDate = typeof transaction.date === 'string' 
          ? new Date(transaction.date) 
          : transaction.date;
        
        const day = transactionDate.getDate();
        
        if (transaction.type === 'income') {
          dailyData[day - 1].income += transaction.amount;
        } else {
          dailyData[day - 1].expense += transaction.amount;
        }
      });
      
      return dailyData;
    } else {
      // Agrupar por mês (para visualização anual)
      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        income: 0,
        expense: 0
      }));
      
      transactions.forEach(transaction => {
        const transactionDate = typeof transaction.date === 'string' 
          ? new Date(transaction.date) 
          : transaction.date;
        
        const month = transactionDate.getMonth();
        
        if (transaction.type === 'income') {
          monthlyData[month].income += transaction.amount;
        } else {
          monthlyData[month].expense += transaction.amount;
        }
      });
      
      return monthlyData;
    }
  }, [transactions, period, currentMonth]);

  // Dados para o gráfico de pizza (despesas por categoria)
  const pieChartData = useMemo(() => {
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
        value
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Dados para o gráfico de tendência (saldo ao longo do tempo)
  const trendChartData = useMemo(() => {
    if (period === 'month') {
      // Agrupar por dia do mês
      const [year, month] = currentMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      
      // Inicializar array com todos os dias do mês
      const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        balance: 0
      }));
      
      let runningBalance = 0;
      
      // Ordenar transações por data
      const sortedTransactions = [...transactions].sort((a, b) => {
        const dateA = typeof a.date === 'string' ? new Date(a.date) : a.date;
        const dateB = typeof b.date === 'string' ? new Date(b.date) : b.date;
        return dateA.getTime() - dateB.getTime();
      });
      
      // Calcular saldo acumulado
      sortedTransactions.forEach(transaction => {
        const transactionDate = typeof transaction.date === 'string' 
          ? new Date(transaction.date) 
          : transaction.date;
        
        const day = transactionDate.getDate();
        
        if (transaction.type === 'income') {
          runningBalance += transaction.amount;
        } else {
          runningBalance -= transaction.amount;
        }
        
        // Atualizar todos os dias a partir desta data
        for (let i = day - 1; i < daysInMonth; i++) {
          dailyData[i].balance = runningBalance;
        }
      });
      
      return dailyData;
    } else {
      // Implementação para visualização anual (se necessário)
      return [];
    }
  }, [transactions, period, currentMonth]);

  // Customizar tooltip do gráfico
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-md">
          <p className="font-medium text-gray-900 dark:text-white">
            {period === 'month' ? `Dia ${label}` : `Mês ${label}`}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name === 'income' ? 'Receitas: ' : entry.name === 'expense' ? 'Despesas: ' : 'Saldo: '}
              {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Customizar tooltip do gráfico de pizza
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-md">
          <p className="font-medium text-gray-900 dark:text-white">{payload[0].name}</p>
          <p style={{ color: payload[0].color }}>
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {((payload[0].value / pieChartData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Gráfico de Barras - Receitas vs Despesas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">
          {period === 'month' ? 'Receitas vs Despesas (Diário)' : 'Receitas vs Despesas (Mensal)'}
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barChartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis 
                dataKey={period === 'month' ? 'day' : 'month'} 
                className="text-gray-600 dark:text-gray-400 text-xs" 
              />
              <YAxis 
                tickFormatter={(value) => `R$${value}`}
                className="text-gray-600 dark:text-gray-400 text-xs" 
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="income" name="Receitas" fill="#4ade80" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Despesas" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Pizza - Despesas por Categoria */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">
          Despesas por Categoria
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Linha - Tendência de Saldo */}
      {period === 'month' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">
            Evolução do Saldo
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trendChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis 
                  dataKey="day" 
                  className="text-gray-600 dark:text-gray-400 text-xs" 
                />
                <YAxis 
                  tickFormatter={(value) => `R$${value}`}
                  className="text-gray-600 dark:text-gray-400 text-xs" 
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="balance" 
                  name="Saldo" 
                  fill="#4ade80"
                  radius={[4, 4, 0, 0]} 
                >
                  {trendChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.balance >= 0 ? "#4ade80" : "#f87171"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
} 