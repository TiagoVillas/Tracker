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
}

export interface Subscription extends Transaction {
  frequency: 'monthly' | 'quarterly' | 'yearly';
  nextPaymentDate: Date | string;
  autoRenew: boolean;
} 