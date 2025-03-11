"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { InstallmentPurchase, Transaction } from "@/lib/types";
import { 
  getInstallmentPurchasesByUser, 
  deleteInstallmentPurchase, 
  addInstallmentPayment 
} from "@/lib/financeUtils";
import { CreditCard, Edit, Trash2, Plus, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import AddInstallmentPurchaseModal from "./AddInstallmentPurchaseModal";
import EditInstallmentPurchaseModal from "./EditInstallmentPurchaseModal";

interface InstallmentPurchaseListProps {
  onPurchaseUpdated: () => void;
}

export default function InstallmentPurchaseList({ onPurchaseUpdated }: InstallmentPurchaseListProps) {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<InstallmentPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<InstallmentPurchase | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Carregar compras parceladas
  useEffect(() => {
    if (user) {
      loadPurchases();
    }
  }, [user]);

  const loadPurchases = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const fetchedPurchases = await getInstallmentPurchasesByUser(user.uid);
      setPurchases(fetchedPurchases);
    } catch (error) {
      console.error("Erro ao carregar compras parceladas:", error);
      setPurchases([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Formatar moeda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  // Formatar data
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR').format(dateObj);
  };

  // Excluir compra parcelada
  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta compra parcelada? Isso não excluirá as transações já registradas.")) {
      try {
        await deleteInstallmentPurchase(id);
        await loadPurchases();
        onPurchaseUpdated();
      } catch (error) {
        console.error("Erro ao excluir compra parcelada:", error);
        alert("Erro ao excluir compra parcelada. Tente novamente.");
      }
    }
  };

  // Editar compra parcelada
  const handleEdit = (purchase: InstallmentPurchase) => {
    setSelectedPurchase(purchase);
    setIsEditModalOpen(true);
  };

  // Adicionar pagamento de parcela
  const handleAddPayment = async (purchase: InstallmentPurchase) => {
    if (purchase.isCompleted) {
      alert("Esta compra já está totalmente paga.");
      return;
    }
    
    const nextInstallment = purchase.paidInstallments + 1;
    if (nextInstallment > purchase.totalInstallments) {
      alert("Todas as parcelas já foram pagas.");
      return;
    }
    
    if (window.confirm(`Deseja registrar o pagamento da parcela ${nextInstallment}/${purchase.totalInstallments}?`)) {
      try {
        await addInstallmentPayment(purchase.id, nextInstallment);
        await loadPurchases();
        onPurchaseUpdated();
      } catch (error) {
        console.error("Erro ao adicionar pagamento:", error);
        alert("Erro ao registrar pagamento. Tente novamente.");
      }
    }
  };

  // Obter nome da categoria formatado
  const getCategoryDisplayName = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Calcular dias até o próximo vencimento
  const getDaysUntilNextPayment = (nextDueDate: Date | string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextDate = typeof nextDueDate === 'string' 
      ? new Date(nextDueDate) 
      : nextDueDate;
    
    nextDate.setHours(0, 0, 0, 0);
    
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Obter classe de status com base nos dias até o próximo vencimento
  const getStatusClass = (days: number) => {
    if (days < 0) return "text-red-600 dark:text-red-400";
    if (days <= 7) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  // Obter texto de status com base nos dias até o próximo vencimento
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
          Compras Parceladas
        </h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Compra Parcelada
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg">Nenhuma compra parcelada encontrada.</p>
          <p className="mt-2">Adicione suas compras parceladas para acompanhar os pagamentos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {purchases.map((purchase) => {
            const isCompleted = purchase.isCompleted;
            const progressPercent = (purchase.paidInstallments / purchase.totalInstallments) * 100;
            
            let daysUntilNextPayment = 0;
            let statusClass = "";
            let statusText = "";
            
            if (!isCompleted) {
              daysUntilNextPayment = getDaysUntilNextPayment(purchase.nextDueDate);
              statusClass = getStatusClass(daysUntilNextPayment);
              statusText = getStatusText(daysUntilNextPayment);
            }
            
            return (
              <div 
                key={purchase.id} 
                className={`bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 border-l-4 ${
                  isCompleted ? 'border-green-500' : 'border-indigo-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {purchase.description}
                  </h3>
                  <div className="flex space-x-2">
                    {!isCompleted && (
                      <button
                        onClick={() => handleAddPayment(purchase)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        title="Registrar próximo pagamento"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(purchase)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      title="Editar"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(purchase.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      title="Excluir"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-2 flex justify-between items-end">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(purchase.installmentAmount)}
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
                        / parcela
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Total: {formatCurrency(purchase.totalAmount)}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {purchase.paidInstallments}/{purchase.totalInstallments}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      parcelas pagas
                    </div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-indigo-500'}`}
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="mt-3 flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Categoria: {getCategoryDisplayName(purchase.category)}
                  </span>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                  {isCompleted ? (
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span className="font-medium">Pagamento concluído</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Próximo vencimento:
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(purchase.nextDueDate)}
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
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isAddModalOpen && (
        <AddInstallmentPurchaseModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onPurchaseAdded={() => {
            loadPurchases();
            onPurchaseUpdated();
          }}
        />
      )}

      {isEditModalOpen && selectedPurchase && (
        <EditInstallmentPurchaseModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedPurchase(null);
          }}
          purchase={selectedPurchase}
          onPurchaseUpdated={() => {
            loadPurchases();
            onPurchaseUpdated();
          }}
        />
      )}
    </div>
  );
} 