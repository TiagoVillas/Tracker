import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, Timestamp, serverTimestamp, limit, getDoc } from "firebase/firestore";
import { db } from "./firebase/firebase";
import { Transaction, Subscription, TransactionType, TransactionCategory } from "./types";
import { TRANSACTIONS_COLLECTION, SUBSCRIPTIONS_COLLECTION, initializeFinanceCollections } from "./firebase/firebaseUtils";

// Get all subscriptions for a user
export const getSubscriptionsByUser = async (userId: string): Promise<Subscription[]> => {
  try {
    console.log(`Buscando assinaturas para usuário ${userId}`);
    
    // Buscar todas as assinaturas do usuário sem ordenação para evitar o erro de índice
    const q = query(
      collection(db, SUBSCRIPTIONS_COLLECTION),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Total de assinaturas encontradas: ${querySnapshot.size}`);
    
    if (querySnapshot.empty) {
      console.log("Nenhuma assinatura encontrada para o usuário:", userId);
      return [];
    }
    
    // Converter os documentos para objetos Subscription
    let subscriptions = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`Assinatura encontrada:`, { id: doc.id, ...data });
      
      // Converter Timestamp para Date
      let date = data.date;
      if (date && date instanceof Timestamp) {
        date = date.toDate();
      }
      
      let nextPaymentDate = data.nextPaymentDate;
      if (nextPaymentDate && nextPaymentDate instanceof Timestamp) {
        nextPaymentDate = nextPaymentDate.toDate();
      }
      
      let createdAt = data.createdAt;
      if (createdAt && createdAt instanceof Timestamp) {
        createdAt = createdAt.toDate();
      }
      
      let updatedAt = data.updatedAt;
      if (updatedAt && updatedAt instanceof Timestamp) {
        updatedAt = updatedAt.toDate();
      }
      
      return {
        id: doc.id,
        ...data,
        date,
        nextPaymentDate,
        createdAt: createdAt || new Date(),
        updatedAt: updatedAt || new Date()
      } as Subscription;
    });
    
    // Ordenar por data do próximo pagamento (mais próxima primeiro) no cliente
    // em vez de usar o orderBy do Firestore que requer um índice composto
    subscriptions.sort((a, b) => {
      const dateA = a.nextPaymentDate instanceof Date ? a.nextPaymentDate : new Date(a.nextPaymentDate);
      const dateB = b.nextPaymentDate instanceof Date ? b.nextPaymentDate : new Date(b.nextPaymentDate);
      return dateA.getTime() - dateB.getTime();
    });
    
    console.log(`Retornando ${subscriptions.length} assinaturas`);
    return subscriptions;
  } catch (error) {
    console.error("Erro ao buscar assinaturas:", error);
    return [];
  }
};

// Get transactions for a user within a specific period
export const getTransactionsByUser = async (
  userId: string,
  startDate?: Date | string,
  endDate?: Date | string
): Promise<Transaction[]> => {
  try {
    console.log(`Buscando transações para usuário ${userId}`, { startDate, endDate });
    
    // Create a simple query without date filters to avoid requiring a composite index
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where("userId", "==", userId),
      orderBy("date", "desc")
    );
    
    try {
      const querySnapshot = await getDocs(q);
      console.log(`Total de transações encontradas: ${querySnapshot.size}`);
      
      if (querySnapshot.empty) {
        console.log("Nenhuma transação encontrada para o usuário:", userId);
        return [];
      }
      
      // Convert documents to Transaction objects
      const transactions = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`Transação encontrada:`, { id: doc.id, ...data });
        
        // Convert Timestamp to Date
        let date = data.date;
        if (date && date instanceof Timestamp) {
          date = date.toDate();
        }
        
        let createdAt = data.createdAt;
        if (createdAt && createdAt instanceof Timestamp) {
          createdAt = createdAt.toDate();
        }
        
        let updatedAt = data.updatedAt;
        if (updatedAt && updatedAt instanceof Timestamp) {
          updatedAt = updatedAt.toDate();
        }
        
        return {
          id: doc.id,
          ...data,
          date,
          createdAt: createdAt || new Date(),
          updatedAt: updatedAt || new Date()
        } as Transaction;
      });
      
      // Filter by date if parameters are provided
      let filteredTransactions = transactions;
      if (startDate && endDate) {
        const startDateObj = typeof startDate === 'string' ? new Date(startDate) : startDate;
        const endDateObj = typeof endDate === 'string' ? new Date(endDate) : endDate;
        
        console.log("Filtrando transações por data:", {
          startDate: startDateObj,
          endDate: endDateObj
        });
        
        if (startDateObj instanceof Date && !isNaN(startDateObj.getTime()) &&
            endDateObj instanceof Date && !isNaN(endDateObj.getTime())) {
          
          // Ajustar endDate para incluir todo o dia
          const adjustedEndDate = new Date(endDateObj);
          adjustedEndDate.setHours(23, 59, 59, 999);
          
          filteredTransactions = transactions.filter(transaction => {
            const transactionDate = transaction.date instanceof Date 
              ? transaction.date 
              : new Date(transaction.date);
            
            const result = (
              transactionDate >= startDateObj && 
              transactionDate <= adjustedEndDate
            );
            
            if (!result) {
              console.log("Transação fora do período:", {
                id: transaction.id,
                date: transactionDate,
                startDate: startDateObj,
                endDate: adjustedEndDate
              });
            }
            
            return result;
          });
          console.log(`Transações filtradas por data: ${filteredTransactions.length}`);
        }
      }
      
      console.log(`Retornando ${filteredTransactions.length} transações`);
      return filteredTransactions;
    } catch (error) {
      // If we get an index error, try a simpler query without ordering
      if (error instanceof Error && error.message.includes("index")) {
        console.warn("Index error, trying simpler query without ordering");
        
        const simpleQuery = query(
          collection(db, TRANSACTIONS_COLLECTION),
          where("userId", "==", userId)
        );
        
        const querySnapshot = await getDocs(simpleQuery);
        console.log(`Total de transações encontradas (query simples): ${querySnapshot.size}`);
        
        if (querySnapshot.empty) {
          console.log("Nenhuma transação encontrada para o usuário:", userId);
          return [];
        }
        
        // Convert documents to Transaction objects
        const transactions = querySnapshot.docs.map(doc => {
          const data = doc.data();
          
          // Convert Timestamp to Date
          let date = data.date;
          if (date && date instanceof Timestamp) {
            date = date.toDate();
          }
          
          let createdAt = data.createdAt;
          if (createdAt && createdAt instanceof Timestamp) {
            createdAt = createdAt.toDate();
          }
          
          let updatedAt = data.updatedAt;
          if (updatedAt && updatedAt instanceof Timestamp) {
            updatedAt = updatedAt.toDate();
          }
          
          return {
            id: doc.id,
            ...data,
            date,
            createdAt: createdAt || new Date(),
            updatedAt: updatedAt || new Date()
          } as Transaction;
        });
        
        // Sort transactions by date (descending)
        transactions.sort((a, b) => {
          const dateA = a.date instanceof Date ? a.date : new Date(a.date);
          const dateB = b.date instanceof Date ? b.date : new Date(b.date);
          return dateB.getTime() - dateA.getTime(); // Descending order
        });
        
        // Filter by date if parameters are provided
        let filteredTransactions = transactions;
        if (startDate && endDate) {
          const startDateObj = typeof startDate === 'string' ? new Date(startDate) : startDate;
          const endDateObj = typeof endDate === 'string' ? new Date(endDate) : endDate;
          
          if (startDateObj instanceof Date && !isNaN(startDateObj.getTime()) &&
              endDateObj instanceof Date && !isNaN(endDateObj.getTime())) {
            
            filteredTransactions = transactions.filter(transaction => {
              const transactionDate = transaction.date instanceof Date 
                ? transaction.date 
                : new Date(transaction.date);
              
              return (
                transactionDate >= startDateObj && 
                transactionDate <= endDateObj
              );
            });
            console.log(`Transações filtradas por data: ${filteredTransactions.length}`);
          }
        }
        
        console.log(`Retornando ${filteredTransactions.length} transações`);
        return filteredTransactions;
      } else {
        // Re-throw other errors
        throw error;
      }
    }
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    return [];
  }
};

// Create a new transaction
export const createTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { userId?: string }): Promise<Transaction | null> => {
  try {
    // Ensure we have a userId
    if (!transaction.userId) {
      // Try to get the current user's ID from auth
      const auth = (await import("firebase/auth")).getAuth();
      if (!auth.currentUser) {
        throw new Error("User not authenticated");
      }
      transaction.userId = auth.currentUser.uid;
    }
    
    // Initialize collections if needed
    await initializeFinanceCollections(transaction.userId);
    
    // Convert date to Firestore Timestamp if it's a Date object
    let firestoreDate = transaction.date;
    if (transaction.date instanceof Date) {
      firestoreDate = Timestamp.fromDate(transaction.date);
    } else if (typeof transaction.date === 'string') {
      // Convert string date to Timestamp
      const dateObj = new Date(transaction.date);
      if (!isNaN(dateObj.getTime())) {
        firestoreDate = Timestamp.fromDate(dateObj);
      }
    }
    
    console.log("Criando transação com data:", {
      original: transaction.date,
      converted: firestoreDate
    });
    
    const newTransaction = {
      ...transaction,
      date: firestoreDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    console.log("Salvando transação no Firestore:", newTransaction);
    
    const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), newTransaction);
    console.log("Transação criada com ID:", docRef.id);
    
    // Return the created transaction with the ID
    const createdTransaction = {
      id: docRef.id,
      ...transaction,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Transaction;
    
    console.log("Retornando transação criada:", createdTransaction);
    
    return createdTransaction;
  } catch (error) {
    console.error("Erro ao criar transação:", error);
    return null;
  }
};

// Update an existing transaction
export const updateTransaction = async (id: string, transaction: Partial<Transaction>): Promise<boolean> => {
  try {
    // Ensure we have a userId
    if (transaction.userId) {
      // Initialize collections if needed
      await initializeFinanceCollections(transaction.userId);
    }
    
    const transactionRef = doc(db, TRANSACTIONS_COLLECTION, id);
    
    // Convert date to Firestore Timestamp if it's a Date object
    let updateData = { ...transaction, updatedAt: serverTimestamp() };
    if (transaction.date) {
      if (transaction.date instanceof Date) {
        updateData.date = Timestamp.fromDate(transaction.date);
      } else if (typeof transaction.date === 'string') {
        // Convert string date to Timestamp
        const dateObj = new Date(transaction.date);
        if (!isNaN(dateObj.getTime())) {
          updateData.date = Timestamp.fromDate(dateObj);
        }
      }
    }
    
    await updateDoc(transactionRef, updateData);
    console.log("Transação atualizada com sucesso:", id);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar transação:", error);
    return false;
  }
};

// Delete a transaction
export const deleteTransaction = async (id: string): Promise<boolean> => {
  try {
    // Get the transaction to check userId
    const transactionRef = doc(db, TRANSACTIONS_COLLECTION, id);
    const transactionSnap = await getDoc(transactionRef);
    
    if (transactionSnap.exists()) {
      const transactionData = transactionSnap.data();
      if (transactionData.userId) {
        // Initialize collections if needed
        await initializeFinanceCollections(transactionData.userId);
      }
    }
    
    await deleteDoc(transactionRef);
    console.log("Transação excluída com sucesso:", id);
    return true;
  } catch (error) {
    console.error("Erro ao excluir transação:", error);
    return false;
  }
};

// Create a new subscription
export const createSubscription = async (subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'> & { userId?: string }): Promise<Subscription | null> => {
  try {
    // Ensure we have a userId
    if (!subscription.userId) {
      // Try to get the current user's ID from auth
      const auth = (await import("firebase/auth")).getAuth();
      if (!auth.currentUser) {
        throw new Error("User not authenticated");
      }
      subscription.userId = auth.currentUser.uid;
    }
    
    // Initialize collections if needed
    await initializeFinanceCollections(subscription.userId);
    
    // Convert dates to Firestore Timestamps
    let firestoreDate = subscription.date;
    if (subscription.date instanceof Date) {
      firestoreDate = Timestamp.fromDate(subscription.date);
    } else if (typeof subscription.date === 'string') {
      // Convert string date to Timestamp
      const dateObj = new Date(subscription.date);
      if (!isNaN(dateObj.getTime())) {
        firestoreDate = Timestamp.fromDate(dateObj);
      }
    }
    
    let firestoreNextPaymentDate = subscription.nextPaymentDate;
    if (subscription.nextPaymentDate instanceof Date) {
      firestoreNextPaymentDate = Timestamp.fromDate(subscription.nextPaymentDate);
    } else if (typeof subscription.nextPaymentDate === 'string') {
      // Convert string date to Timestamp
      const dateObj = new Date(subscription.nextPaymentDate);
      if (!isNaN(dateObj.getTime())) {
        firestoreNextPaymentDate = Timestamp.fromDate(dateObj);
      }
    }
    
    const newSubscription = {
      ...subscription,
      date: firestoreDate,
      nextPaymentDate: firestoreNextPaymentDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, SUBSCRIPTIONS_COLLECTION), newSubscription);
    console.log("Assinatura criada com ID:", docRef.id);
    
    // Return the created subscription with the ID
    return {
      id: docRef.id,
      ...subscription,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Subscription;
  } catch (error) {
    console.error("Erro ao criar assinatura:", error);
    return null;
  }
};

// Update an existing subscription
export const updateSubscription = async (id: string, subscription: Partial<Subscription>): Promise<boolean> => {
  try {
    // Ensure we have a userId
    if (subscription.userId) {
      // Initialize collections if needed
      await initializeFinanceCollections(subscription.userId);
    }
    
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, id);
    
    // Convert dates to Firestore Timestamps
    let updateData = { ...subscription, updatedAt: serverTimestamp() };
    
    if (subscription.date) {
      if (subscription.date instanceof Date) {
        updateData.date = Timestamp.fromDate(subscription.date);
      } else if (typeof subscription.date === 'string') {
        // Convert string date to Timestamp
        const dateObj = new Date(subscription.date);
        if (!isNaN(dateObj.getTime())) {
          updateData.date = Timestamp.fromDate(dateObj);
        }
      }
    }
    
    if (subscription.nextPaymentDate) {
      if (subscription.nextPaymentDate instanceof Date) {
        updateData.nextPaymentDate = Timestamp.fromDate(subscription.nextPaymentDate);
      } else if (typeof subscription.nextPaymentDate === 'string') {
        // Convert string date to Timestamp
        const dateObj = new Date(subscription.nextPaymentDate);
        if (!isNaN(dateObj.getTime())) {
          updateData.nextPaymentDate = Timestamp.fromDate(dateObj);
        }
      }
    }
    
    await updateDoc(subscriptionRef, updateData);
    console.log("Assinatura atualizada com sucesso:", id);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar assinatura:", error);
    return false;
  }
};

// Delete a subscription
export const deleteSubscription = async (id: string): Promise<boolean> => {
  try {
    // Get the subscription to check userId
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, id);
    const subscriptionSnap = await getDoc(subscriptionRef);
    
    if (subscriptionSnap.exists()) {
      const subscriptionData = subscriptionSnap.data();
      if (subscriptionData.userId) {
        // Initialize collections if needed
        await initializeFinanceCollections(subscriptionData.userId);
      }
    }
    
    await deleteDoc(subscriptionRef);
    console.log("Assinatura excluída com sucesso:", id);
    return true;
  } catch (error) {
    console.error("Erro ao excluir assinatura:", error);
    return false;
  }
};

// Calculate financial summary from transactions
export const calculateFinancialSummary = (transactions: Transaction[]) => {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const balance = totalIncome - totalExpenses;
  
  // Calculate expenses by category
  const expensesByCategory: Record<TransactionCategory, number> = {} as Record<TransactionCategory, number>;
  
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      if (!expensesByCategory[t.category]) {
        expensesByCategory[t.category] = 0;
      }
      expensesByCategory[t.category] += t.amount;
    });
  
  // Calculate income by category
  const incomeByCategory: Record<TransactionCategory, number> = {} as Record<TransactionCategory, number>;
  
  transactions
    .filter(t => t.type === 'income')
    .forEach(t => {
      if (!incomeByCategory[t.category]) {
        incomeByCategory[t.category] = 0;
      }
      incomeByCategory[t.category] += t.amount;
    });
  
  return {
    totalIncome,
    totalExpenses,
    balance,
    expensesByCategory,
    incomeByCategory
  };
};

// Create sample transactions for testing
export const createSampleTransactions = async (userId: string): Promise<boolean> => {
  try {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Sample categories
    const incomeCategories: TransactionCategory[] = ['salary', 'investment', 'gift', 'other_income'];
    const expenseCategories: TransactionCategory[] = [
      'food', 'housing', 'transportation', 'utilities', 'entertainment', 
      'healthcare', 'education', 'subscription', 'shopping', 'travel', 'work', 'other_expense'
    ];
    
    // Generate random transactions
    const sampleTransactions = [];
    
    // Add one salary income
    sampleTransactions.push({
      userId,
      amount: Math.floor(Math.random() * 3000) + 3000,
      type: 'income' as TransactionType,
      category: 'salary' as TransactionCategory,
      description: 'Salário mensal',
      date: new Date(today.getFullYear(), today.getMonth(), 5),
      isRecurring: true
    });
    
    // Add random transactions
    for (let i = 0; i < 30; i++) {
      const isIncome = Math.random() > 0.7;
      const type = isIncome ? 'income' : 'expense';
      const category = isIncome 
        ? incomeCategories[Math.floor(Math.random() * incomeCategories.length)]
        : expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
      
      const amount = isIncome
        ? Math.floor(Math.random() * 1000) + 100
        : Math.floor(Math.random() * 300) + 10;
      
      const randomDay = Math.floor(Math.random() * 30) + 1;
      const randomMonth = today.getMonth() - 1 + Math.floor(Math.random() * 3);
      const date = new Date(today.getFullYear(), randomMonth, randomDay);
      
      if (date >= startDate && date <= endDate) {
        sampleTransactions.push({
          userId,
          amount,
          type,
          category,
          description: `${type === 'income' ? 'Receita' : 'Despesa'} - ${category}`,
          date,
          isRecurring: Math.random() > 0.8
        });
      }
    }
    
    // Add sample subscriptions
    const subscriptions = [
      {
        userId,
        amount: 19.90,
        type: 'expense' as TransactionType,
        category: 'subscription' as TransactionCategory,
        description: 'Netflix',
        date: new Date(today.getFullYear(), today.getMonth(), 10),
        isRecurring: true,
        frequency: 'monthly' as const,
        nextPaymentDate: new Date(today.getFullYear(), today.getMonth() + 1, 10),
        autoRenew: true
      },
      {
        userId,
        amount: 9.90,
        type: 'expense' as TransactionType,
        category: 'subscription' as TransactionCategory,
        description: 'Spotify',
        date: new Date(today.getFullYear(), today.getMonth(), 15),
        isRecurring: true,
        frequency: 'monthly' as const,
        nextPaymentDate: new Date(today.getFullYear(), today.getMonth() + 1, 15),
        autoRenew: true
      }
    ];
    
    // Create all transactions
    for (const transaction of sampleTransactions) {
      await createTransaction(transaction);
    }
    
    // Create all subscriptions
    for (const subscription of subscriptions) {
      await createSubscription(subscription);
    }
    
    console.log(`Criadas ${sampleTransactions.length} transações e ${subscriptions.length} assinaturas de exemplo`);
    return true;
  } catch (error) {
    console.error("Erro ao criar transações de exemplo:", error);
    return false;
  }
}; 