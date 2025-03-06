import { db } from './firebase/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// Interfaces
export interface Habit {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  createdAt: Date;
  userId: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  completedAt: Date;
  userId: string;
}

// Funções para Hábitos
export const fetchHabits = async (userId: string): Promise<Habit[]> => {
  try {
    if (!userId) {
      console.error("fetchHabits: userId is required");
      return [];
    }

    console.log("Buscando hábitos para o usuário:", userId);

    const habitsQuery = query(
      collection(db, "habits"),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(habitsQuery);
    
    const habits: Habit[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Converter Timestamp para Date
      const createdAt = data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate() 
        : new Date();
      
      habits.push({
        id: doc.id,
        name: data.name || "",
        description: data.description || "",
        completed: data.completed || false,
        createdAt: createdAt,
        userId: data.userId
      });
    });
    
    // Ordenar os hábitos pelo createdAt após obter os dados
    habits.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return habits;
  } catch (error) {
    console.error("Error fetching habits:", error);
    throw error;
  }
};

export const addHabit = async (
  userId: string,
  name: string,
  description: string
): Promise<Habit> => {
  try {
    if (!userId) {
      throw new Error("userId is required");
    }
    
    if (!name.trim()) {
      throw new Error("Habit name is required");
    }
    
    const habitData = {
      name,
      description,
      completed: false,
      createdAt: serverTimestamp(),
      userId
    };
    
    const docRef = await addDoc(collection(db, "habits"), habitData);
    
    // Retornar o hábito criado com o ID
    return {
      id: docRef.id,
      name,
      description,
      completed: false,
      createdAt: new Date(),
      userId
    };
  } catch (error) {
    console.error("Error adding habit:", error);
    throw error;
  }
};

export const updateHabit = async (
  habitId: string,
  updates: {
    name?: string;
    description?: string;
  }
): Promise<void> => {
  try {
    const habitRef = doc(db, "habits", habitId);
    await updateDoc(habitRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating habit:", error);
    throw error;
  }
};

export const toggleHabitCompletion = async (
  habitId: string, 
  userId: string, 
  completed: boolean
): Promise<void> => {
  try {
    if (!habitId || !userId) {
      throw new Error("habitId and userId are required");
    }
    
    if (completed) {
      // Se estiver marcando como concluído, adicionar à coleção de conclusões
      await addDoc(collection(db, "habitCompletions"), {
        habitId,
        userId,
        completedAt: serverTimestamp()
      });
    } else {
      // Se estiver desmarcando, remover da coleção de conclusões
      // Simplificar a consulta para evitar problemas com índices
      const completionsQuery = query(
        collection(db, "habitCompletions"),
        where("habitId", "==", habitId),
        where("userId", "==", userId)
      );
      
      const querySnapshot = await getDocs(completionsQuery);
      
      // Filtrar as conclusões de hoje no lado do cliente
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Excluir apenas as conclusões de hoje
      const deletePromises = querySnapshot.docs
        .filter(doc => {
          const data = doc.data();
          const completedAt = data.completedAt instanceof Timestamp 
            ? data.completedAt.toDate() 
            : new Date();
          
          return completedAt >= today && completedAt < tomorrow;
        })
        .map(doc => deleteDoc(doc.ref));
      
      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
      }
    }
  } catch (error) {
    console.error("Error toggling habit completion:", error);
    throw error;
  }
};

export const deleteHabit = async (habitId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "habits", habitId));
    
    // Também excluir todas as conclusões relacionadas a este hábito
    const completionsQuery = query(
      collection(db, "habitCompletions"),
      where("habitId", "==", habitId)
    );
    
    const querySnapshot = await getDocs(completionsQuery);
    
    const deletePromises = querySnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error deleting habit:", error);
    throw error;
  }
};

export const fetchHabitCompletions = async (userId: string): Promise<HabitCompletion[]> => {
  try {
    if (!userId) {
      console.error("fetchHabitCompletions: userId is required");
      return [];
    }
    
    const completionsQuery = query(
      collection(db, "habitCompletions"),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(completionsQuery);
    
    const completions: HabitCompletion[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      const completedAt = data.completedAt instanceof Timestamp 
        ? data.completedAt.toDate() 
        : new Date();
      
      completions.push({
        id: doc.id,
        habitId: data.habitId,
        completedAt: completedAt,
        userId: data.userId
      });
    });
    
    return completions;
  } catch (error) {
    console.error("Error fetching habit completions:", error);
    throw error;
  }
};

export const fetchTodayHabitCompletions = async (userId: string): Promise<HabitCompletion[]> => {
  try {
    if (!userId) {
      console.error("fetchTodayHabitCompletions: userId is required");
      return [];
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const completionsQuery = query(
      collection(db, "habitCompletions"),
      where("userId", "==", userId),
      where("completedAt", ">=", today),
      where("completedAt", "<", tomorrow)
    );
    
    const querySnapshot = await getDocs(completionsQuery);
    
    const completions: HabitCompletion[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      const completedAt = data.completedAt instanceof Timestamp 
        ? data.completedAt.toDate() 
        : new Date();
      
      completions.push({
        id: doc.id,
        habitId: data.habitId,
        completedAt: completedAt,
        userId: data.userId
      });
    });
    
    return completions;
  } catch (error) {
    console.error("Error fetching today's habit completions:", error);
    throw error;
  }
}; 