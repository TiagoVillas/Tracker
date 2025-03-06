import { db } from './firebase/firebase';
import { createDocumentWithPermission, updateDocumentWithPermission, deleteDocumentWithPermission } from './firebase/firebaseUtils';
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
  Timestamp,
  writeBatch
} from 'firebase/firestore';

// Interfaces
export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: Date;
  userId: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate: Date | null;
  priority: "low" | "medium" | "high";
  createdAt: Date;
  projectId: string | null;
  userId: string;
  forToday?: boolean;
}

// Funções para Projetos
export const fetchProjects = async (userId: string): Promise<Project[]> => {
  try {
    if (!userId) {
      console.error("fetchProjects: userId is required");
      return [];
    }

    console.log("Buscando projetos para o usuário:", userId);

    // Consulta simplificada que não requer índice composto
    const projectsQuery = query(
      collection(db, "projects"),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(projectsQuery);
    const projectsData: Project[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      const createdAt = data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate() 
        : new Date();
      
      projectsData.push({
        id: doc.id,
        name: data.name || "",
        description: data.description || "",
        color: data.color || "#4F46E5",
        createdAt: createdAt,
        userId: data.userId,
      });
    });
    
    // Ordenar os resultados manualmente após obter os dados
    return projectsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
};

export const addProject = async (
  userId: string,
  name: string,
  description: string,
  color: string
): Promise<Project> => {
  try {
    if (!userId) {
      throw new Error("addProject: userId is required");
    }

    console.log("addProject: Iniciando criação de projeto", { userId, name, description, color });

    const projectData = {
      name,
      description,
      color,
    };
    
    const result = await createDocumentWithPermission("projects", projectData, userId);
    
    console.log("addProject: Projeto criado com sucesso", result);
    
    return {
      id: result.id,
      name,
      description,
      color,
      createdAt: result.createdAt,
      userId,
    };
  } catch (error) {
    console.error("Error adding project:", error);
    throw error;
  }
};

export const updateProject = async (
  projectId: string,
  name: string,
  description: string,
  color: string
): Promise<void> => {
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      throw new Error("Usuário não autenticado");
    }
    
    await updateDocumentWithPermission(
      "projects", 
      projectId, 
      { name, description, color }, 
      userId
    );
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

export const deleteProject = async (projectId: string, tasks: Task[]): Promise<void> => {
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      throw new Error("Usuário não autenticado");
    }
    
    // Primeiro, verificar permissão para excluir o projeto
    await deleteDocumentWithPermission("projects", projectId, userId);
    
    // Atualizar tarefas associadas ao projeto
    const tasksToUpdate = tasks.filter(task => task.projectId === projectId);
    
    if (tasksToUpdate.length > 0) {
      const batch = writeBatch(db);
      
      for (const task of tasksToUpdate) {
        batch.update(doc(db, "tasks", task.id), { projectId: null });
      }
      
      // Executar todas as operações em lote
      await batch.commit();
    }
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
};

// Funções para Tarefas
export const fetchTasks = async (userId: string): Promise<Task[]> => {
  try {
    if (!userId) {
      console.error("fetchTasks: userId is required");
      return [];
    }

    console.log("Buscando tarefas para o usuário:", userId);

    // Consulta simplificada que não requer índice composto
    const tasksQuery = query(
      collection(db, "tasks"),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(tasksQuery);
    const tasksData: Task[] = [];
    
    console.log(`fetchTasks: Found ${querySnapshot.size} tasks for user ${userId}`);
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Convert Firestore Timestamp to Date
      const createdAt = data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate() 
        : new Date();
        
      const dueDate = data.dueDate instanceof Timestamp 
        ? data.dueDate.toDate() 
        : data.dueDate ? new Date(data.dueDate) : null;
      
      // Log detalhado de cada tarefa
      console.log(`fetchTasks: Task ${doc.id}:`, {
        title: data.title,
        dueDate: dueDate ? dueDate.toISOString() : null,
        forToday: data.forToday,
        completed: data.completed
      });
      
      tasksData.push({
        id: doc.id,
        title: data.title || "",
        description: data.description || "",
        completed: data.completed || false,
        dueDate: dueDate,
        priority: data.priority || "medium",
        createdAt: createdAt,
        projectId: data.projectId || null,
        userId: data.userId,
        forToday: data.forToday || false
      });
    });
    
    // Ordenar os resultados manualmente após obter os dados
    return tasksData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
};

export const addTask = async (
  userId: string,
  title: string,
  description: string,
  dueDate: Date | null,
  priority: "low" | "medium" | "high",
  projectId: string | null,
  forToday: boolean = false
): Promise<Task> => {
  try {
    if (!userId) {
      throw new Error("addTask: userId is required");
    }

    const taskData = {
      title,
      description,
      completed: false,
      dueDate,
      priority,
      projectId,
      forToday
    };
    
    const result = await createDocumentWithPermission("tasks", taskData, userId);
    
    return {
      id: result.id,
      title,
      description,
      completed: false,
      dueDate,
      priority,
      createdAt: result.createdAt,
      projectId,
      userId,
      forToday
    };
  } catch (error) {
    console.error("Error adding task:", error);
    throw error;
  }
};

export const updateTask = async (
  taskId: string,
  updates: {
    title?: string;
    description?: string;
    completed?: boolean;
    dueDate?: Date | null;
    priority?: "low" | "medium" | "high";
    projectId?: string | null;
  }
): Promise<void> => {
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      throw new Error("Usuário não autenticado");
    }
    
    await updateDocumentWithPermission("tasks", taskId, updates, userId);
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};

export const toggleTaskCompletion = async (taskId: string, currentState: boolean): Promise<void> => {
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      throw new Error("Usuário não autenticado");
    }
    
    await updateDocumentWithPermission(
      "tasks", 
      taskId, 
      { completed: !currentState }, 
      userId
    );
  } catch (error) {
    console.error("Error toggling task completion:", error);
    throw error;
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      throw new Error("Usuário não autenticado");
    }
    
    await deleteDocumentWithPermission("tasks", taskId, userId);
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};

// Função utilitária para lidar com datas de forma consistente
export const normalizeDate = (dateString: string | null): Date | null => {
  if (!dateString) return null;
  
  // Criar a data no formato YYYY-MM-DD e ajustar para o meio-dia para evitar problemas de fuso horário
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
};

// Função utilitária para formatar uma data para o formato YYYY-MM-DD
export const formatDateForInput = (date: Date | null): string => {
  if (!date) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}; 