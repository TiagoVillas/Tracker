"use client";

import { useState, useEffect, useMemo } from "react";
import { Lightbulb, ChevronRight, ChevronLeft } from "lucide-react";
import { Transaction } from "@/lib/types";

interface FinancialTipsProps {
  transactions: Transaction[];
}

// Dicas financeiras genéricas
const genericFinancialTips = [
  {
    title: "Regra 50/30/20",
    description: "Destine 50% da sua renda para necessidades, 30% para desejos e 20% para investimentos e poupança."
  },
  {
    title: "Fundo de Emergência",
    description: "Mantenha um fundo de emergência que cubra de 3 a 6 meses de despesas essenciais."
  },
  {
    title: "Investimentos Regulares",
    description: "Invista regularmente, mesmo que pequenas quantias. A consistência é mais importante que o valor."
  },
  {
    title: "Controle de Assinaturas",
    description: "Revise suas assinaturas mensais. Pequenos valores recorrentes podem somar muito ao longo do ano."
  },
  {
    title: "Planejamento de Compras",
    description: "Planeje compras grandes com antecedência e evite decisões impulsivas."
  },
  {
    title: "Diversificação",
    description: "Diversifique seus investimentos para reduzir riscos e maximizar retornos a longo prazo."
  },
  {
    title: "Automatize Economias",
    description: "Configure transferências automáticas para sua conta de investimentos logo após receber seu salário."
  },
  {
    title: "Renegociação de Dívidas",
    description: "Renegocie dívidas com taxas de juros altas sempre que possível."
  }
];

export default function FinancialTips({ transactions }: FinancialTipsProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

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

  // Gerar dicas personalizadas com base nos dados financeiros
  const personalizedTips = useMemo(() => {
    const tips = [...genericFinancialTips];
    
    if (monthlySalary > 0) {
      // Calcular porcentagens em relação ao salário
      const expensePercentage = (totals.expense / monthlySalary) * 100;
      const investmentPercentage = (totals.investment / monthlySalary) * 100;
      
      // Dica sobre gastos excessivos
      if (expensePercentage > 80) {
        tips.unshift({
          title: "Reduzir Despesas",
          description: `Suas despesas representam ${expensePercentage.toFixed(1)}% do seu salário. Tente reduzir para no máximo 80% para melhorar sua saúde financeira.`
        });
      }
      
      // Dica sobre investimentos insuficientes
      if (investmentPercentage < 10) {
        tips.unshift({
          title: "Aumentar Investimentos",
          description: `Você está investindo apenas ${investmentPercentage.toFixed(1)}% do seu salário. Tente aumentar para pelo menos 10-20% para garantir seu futuro financeiro.`
        });
      } else if (investmentPercentage >= 20) {
        tips.unshift({
          title: "Excelente Investidor",
          description: `Parabéns! Você está investindo ${investmentPercentage.toFixed(1)}% do seu salário, o que é excelente para seu futuro financeiro.`
        });
      }
      
      // Dica sobre equilíbrio financeiro
      if (totals.balance < 0) {
        tips.unshift({
          title: "Saldo Negativo",
          description: "Seu saldo está negativo. Considere reduzir despesas não essenciais e revisar seu orçamento para equilibrar suas finanças."
        });
      }
    }
    
    // Dicas específicas sobre investimentos
    const hasInvestments = transactions.some(t => t.type === 'investment');
    if (!hasInvestments) {
      tips.unshift({
        title: "Comece a Investir",
        description: "Você ainda não registrou nenhum investimento. Comece com pequenas quantias em investimentos de baixo risco."
      });
    } else {
      // Verificar diversificação de investimentos
      const investmentCategories = new Set(
        transactions
          .filter(t => t.type === 'investment')
          .map(t => t.category)
      );
      
      if (investmentCategories.size === 1) {
        tips.unshift({
          title: "Diversifique Investimentos",
          description: "Você está investindo em apenas uma categoria. Considere diversificar seus investimentos para reduzir riscos."
        });
      }
    }
    
    return tips;
  }, [transactions, monthlySalary, totals]);

  // Avançar para a próxima dica
  const nextTip = () => {
    setCurrentTipIndex((prevIndex) => 
      prevIndex === personalizedTips.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Voltar para a dica anterior
  const prevTip = () => {
    setCurrentTipIndex((prevIndex) => 
      prevIndex === 0 ? personalizedTips.length - 1 : prevIndex - 1
    );
  };

  // Alternar entre dicas automaticamente
  useEffect(() => {
    if (!autoplay) return;
    
    const interval = setInterval(() => {
      nextTip();
    }, 8000);
    
    return () => clearInterval(interval);
  }, [autoplay, personalizedTips.length]);

  // Pausar autoplay quando o usuário interagir com as dicas
  const handleManualNavigation = (callback: () => void) => {
    setAutoplay(false);
    callback();
  };

  return (
    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg shadow-sm p-4 mb-6">
      <div className="flex items-center mb-2">
        <Lightbulb className="h-5 w-5 text-indigo-500 mr-2" />
        <h3 className="text-md font-medium text-indigo-700 dark:text-indigo-300">
          Dica Financeira
        </h3>
      </div>
      
      <div className="relative">
        <div className="min-h-[80px] py-2">
          <h4 className="font-medium text-gray-800 dark:text-white">
            {personalizedTips[currentTipIndex].title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {personalizedTips[currentTipIndex].description}
          </p>
        </div>
        
        <div className="flex justify-between mt-2">
          <button 
            onClick={() => handleManualNavigation(prevTip)}
            className="p-1 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-800/30 text-indigo-600 dark:text-indigo-400"
            aria-label="Dica anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="flex space-x-1">
            {personalizedTips.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setAutoplay(false);
                  setCurrentTipIndex(index);
                }}
                className={`h-2 w-2 rounded-full ${
                  index === currentTipIndex 
                    ? 'bg-indigo-500' 
                    : 'bg-indigo-200 dark:bg-indigo-700'
                }`}
                aria-label={`Ir para dica ${index + 1}`}
              />
            ))}
          </div>
          
          <button 
            onClick={() => handleManualNavigation(nextTip)}
            className="p-1 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-800/30 text-indigo-600 dark:text-indigo-400"
            aria-label="Próxima dica"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 