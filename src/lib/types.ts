// Finance types
export type TransactionType = 'income' | 'expense' | 'investment';

export type TransactionCategory = 
  // Income categories
  'salary' | 'gift' | 'other_income' | 
  // Expense categories
  'food' | 'housing' | 'transportation' | 'utilities' | 
  'entertainment' | 'healthcare' | 'education' | 'subscription' | 
  'shopping' | 'travel' | 'work' | 'other_expense' |
  // Investment categories
  'stocks' | 'bonds' | 'real_estate' | 'crypto' | 'savings' | 'retirement' | 'other_investment';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  date: Date | string;
  isRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Campos para compras parceladas
  isInstallment?: boolean;
  installmentNumber?: number;
  totalInstallments?: number;
  installmentGroupId?: string; // ID para agrupar transações da mesma compra parcelada
  // Campo para vincular com assinaturas
  subscriptionId?: string; // ID da assinatura relacionada, se aplicável
}

export interface Subscription extends Transaction {
  frequency: 'monthly' | 'quarterly' | 'yearly';
  nextPaymentDate: Date | string;
  autoRenew: boolean;
  // Campos adicionais para rastreamento de pagamentos
  lastPaymentDate?: Date | string;
  lastPaymentTransactionId?: string;
}

// Interface para compras parceladas
export interface InstallmentPurchase {
  id: string;
  userId: string;
  description: string;
  totalAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  startDate: Date | string;
  category: TransactionCategory;
  createdAt: Date;
  updatedAt: Date;
  nextDueDate: Date | string;
  isCompleted: boolean;
  transactionIds: string[]; // IDs das transações relacionadas a esta compra parcelada
} 