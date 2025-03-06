import { db } from "./firebase/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp,
  orderBy
} from "firebase/firestore";
import { createDocumentWithPermission, updateDocumentWithPermission, deleteDocumentWithPermission } from "./firebase/firebaseUtils";

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: Timestamp | null;
  completed: boolean;
  userId: string;
  createdAt: Timestamp;
}

export const fetchGoals = async (userId: string): Promise<Goal[]> => {
  try {
    const goalsQuery = query(
      collection(db, "goals"),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(goalsQuery);
    const goals: Goal[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Omit<Goal, "id">;
      goals.push({
        id: doc.id,
        ...data
      });
    });
    
    // Sort goals by completion status and target date
    return goals.sort((a, b) => {
      // First sort by completion status
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      
      // Then sort by target date if available
      if (a.targetDate && b.targetDate) {
        return a.targetDate.toMillis() - b.targetDate.toMillis();
      } else if (a.targetDate) {
        return -1;
      } else if (b.targetDate) {
        return 1;
      }
      
      // Finally sort by creation date
      return a.createdAt.toMillis() - b.createdAt.toMillis();
    });
  } catch (error) {
    console.error("Error fetching goals:", error);
    throw error;
  }
};

export const addGoal = async (
  userId: string, 
  goalData: { 
    title: string; 
    description?: string; 
    targetDate?: Date | null;
  }
): Promise<string> => {
  try {
    const data = {
      title: goalData.title,
      description: goalData.description || "",
      targetDate: goalData.targetDate ? Timestamp.fromDate(goalData.targetDate) : null,
      completed: false,
      userId,
      createdAt: Timestamp.now()
    };
    
    const docRef = await createDocumentWithPermission("goals", data, userId);
    return docRef.id;
  } catch (error) {
    console.error("Error adding goal:", error);
    throw error;
  }
};

export const updateGoal = async (
  userId: string,
  goalId: string,
  updates: Partial<Omit<Goal, "id" | "userId" | "createdAt">>
): Promise<void> => {
  try {
    await updateDocumentWithPermission("goals", goalId, updates, userId);
  } catch (error) {
    console.error("Error updating goal:", error);
    throw error;
  }
};

export const deleteGoal = async (userId: string, goalId: string): Promise<void> => {
  try {
    await deleteDocumentWithPermission("goals", goalId, userId);
  } catch (error) {
    console.error("Error deleting goal:", error);
    throw error;
  }
};

export const toggleGoalCompletion = async (
  userId: string,
  goalId: string,
  currentState: boolean
): Promise<void> => {
  try {
    await updateDocumentWithPermission(
      "goals", 
      goalId, 
      { completed: !currentState },
      userId
    );
  } catch (error) {
    console.error("Error toggling goal completion:", error);
    throw error;
  }
};

export const getGoalCompletionStats = (goals: Goal[]): { 
  total: number; 
  completed: number; 
  percentage: number;
  upcoming: number;
} => {
  const total = goals.length;
  const completed = goals.filter(goal => goal.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Count goals with target dates in the future
  const now = new Date();
  const upcoming = goals.filter(goal => {
    if (!goal.completed && goal.targetDate) {
      const targetDate = new Date(goal.targetDate.toMillis());
      return targetDate > now;
    }
    return false;
  }).length;
  
  return { total, completed, percentage, upcoming };
}; 