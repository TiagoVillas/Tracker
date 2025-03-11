"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Subscription } from "@/lib/types";
import { 
  getSubscriptionsByUser, 
  deleteSubscription, 
  createTransactionFromSubscription 
} from "@/lib/financeUtils";
import { Calendar, Edit, Trash2, Plus, RefreshCw, DollarSign } from "lucide-react";
import AddSubscriptionModal from "./AddSubscriptionModal";
import EditSubscriptionModal from "./EditSubscriptionModal";

interface SubscriptionListProps {
  onSubscriptionUpdated: () => void;
}

export default function SubscriptionList({ onSubscriptionUpdated }: SubscriptionListProps) {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Load subscriptions
  useEffect(() => {
    if (user) {
      loadSubscriptions();
    }
  }, [user]);

  const loadSubscriptions = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Initialize collections if needed
      const { initializeFinanceCollections, displayIndexInstructions } = await import("@/lib/firebase/firebaseUtils");
      await initializeFinanceCollections(user.uid);
      
      try {
        const fetchedSubscriptions = await getSubscriptionsByUser(user.uid);
        setSubscriptions(fetchedSubscriptions);
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
        
        // If it's an index error, display instructions
        if (error instanceof Error && error.message.includes("index")) {
          displayIndexInstructions();
        }
        
        // Set empty subscriptions to avoid breaking the UI
        setSubscriptions([]);
      }
    } catch (error) {
      console.error("Error loading subscriptions:", error);
      
      // Try to display index instructions if it's an index error
      try {
        if (error instanceof Error && error.message.includes("index")) {
          const { displayIndexInstructions } = await import("@/lib/firebase/firebaseUtils");
          displayIndexInstructions();
        }
      } catch (e) {
        console.error("Error displaying index instructions:", e);
      }
      
      setSubscriptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR').format(dateObj);
  };

  // Handle subscription deletion
  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta assinatura?")) {
      try {
        await deleteSubscription(id);
        await loadSubscriptions();
        onSubscriptionUpdated();
      } catch (error) {
        console.error("Error deleting subscription:", error);
        alert("Erro ao excluir assinatura. Tente novamente.");
      }
    }
  };

  // Handle subscription edit
  const handleEdit = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setIsEditModalOpen(true);
  };

  // Criar transação a partir da assinatura
  const handleCreateTransaction = async (subscription: Subscription) => {
    if (window.confirm(`Deseja registrar um pagamento para "${subscription.description}" no valor de ${formatCurrency(subscription.amount)}?`)) {
      try {
        const transaction = await createTransactionFromSubscription(subscription);
        if (transaction) {
          await loadSubscriptions();
          onSubscriptionUpdated();
          alert("Pagamento registrado com sucesso!");
        } else {
          alert("Erro ao registrar pagamento. Tente novamente.");
        }
      } catch (error) {
        console.error("Erro ao criar transação:", error);
        alert("Erro ao registrar pagamento. Tente novamente.");
      }
    }
  };

  // Get frequency display name
  const getFrequencyDisplayName = (frequency: string) => {
    switch (frequency) {
      case 'monthly':
        return 'Mensal';
      case 'quarterly':
        return 'Trimestral';
      case 'yearly':
        return 'Anual';
      default:
        return frequency;
    }
  };

  // Get category display name
  const getCategoryDisplayName = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Calculate days until next payment
  const getDaysUntilNextPayment = (nextPaymentDate: Date | string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextDate = typeof nextPaymentDate === 'string' 
      ? new Date(nextPaymentDate) 
      : nextPaymentDate;
    
    nextDate.setHours(0, 0, 0, 0);
    
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Get status class based on days until next payment
  const getStatusClass = (days: number) => {
    if (days < 0) return "text-red-600 dark:text-red-400";
    if (days <= 7) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  // Get status text based on days until next payment
  const getStatusText = (days: number) => {
    if (days < 0) return `Atrasado (${Math.abs(days)} dias)`;
    if (days === 0) return "Hoje";
    if (days === 1) return "Amanhã";
    return `Em ${days} dias`;
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Assinaturas e Pagamentos Recorrentes
        </h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Assinatura
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg">Nenhuma assinatura encontrada.</p>
          <p className="mt-2">Adicione suas assinaturas para acompanhar pagamentos recorrentes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscriptions.map((subscription) => {
            const daysUntilNextPayment = getDaysUntilNextPayment(subscription.nextPaymentDate);
            const statusClass = getStatusClass(daysUntilNextPayment);
            const statusText = getStatusText(daysUntilNextPayment);
            
            return (
              <div 
                key={subscription.id} 
                className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 border-l-4 border-indigo-500"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {subscription.description}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleCreateTransaction(subscription)}
                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                      title="Registrar pagamento"
                    >
                      <DollarSign className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(subscription)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      title="Editar"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(subscription.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      title="Excluir"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(subscription.amount)}
                </div>
                
                <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  <span>{getFrequencyDisplayName(subscription.frequency)}</span>
                </div>
                
                <div className="mt-2 flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Categoria: {getCategoryDisplayName(subscription.category)}
                  </span>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Próximo pagamento:
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(subscription.nextPaymentDate)}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Status:
                    </span>
                    <span className={`text-sm font-medium ${statusClass}`}>
                      {statusText}
                    </span>
                  </div>
                  
                  {subscription.lastPaymentDate && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Último pagamento: {formatDate(subscription.lastPaymentDate)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isAddModalOpen && (
        <AddSubscriptionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubscriptionAdded={() => {
            loadSubscriptions();
            onSubscriptionUpdated();
          }}
        />
      )}

      {isEditModalOpen && selectedSubscription && (
        <EditSubscriptionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedSubscription(null);
          }}
          subscription={selectedSubscription}
          onSubscriptionUpdated={() => {
            loadSubscriptions();
            onSubscriptionUpdated();
          }}
        />
      )}
    </div>
  );
} 