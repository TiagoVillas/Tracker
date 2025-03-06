"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTheme } from "@/lib/contexts/ThemeContext";
import Navbar from "@/components/Navbar";
import HabitsCard from "@/components/HabitsCard";
import TasksCard from "@/components/TasksCard";
import DailyNoteCard from "@/components/DailyNoteCard";
import GoalsCard from "@/components/GoalsCard";
import { 
  AlertTriangle,
  ExternalLink,
  Check,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Task } from "@/lib/taskUtils";
import { db } from "@/lib/firebase/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { createDocumentWithPermission, updateDocumentWithPermission } from "@/lib/firebase/firebaseUtils";
import { fetchHabits, Habit as HabitType, toggleHabitCompletion } from "@/lib/habitUtils";
import { fetchTasks, toggleTaskCompletion, addTask } from "@/lib/taskUtils";

export default function Dashboard() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  
  const [habits, setHabits] = useState<HabitType[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dailyNote, setDailyNote] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [indexErrors, setIndexErrors] = useState<{[key: string]: string}>({});
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [updatingHabitId, setUpdatingHabitId] = useState<string | null>(null);
  const [isAddingTestTask, setIsAddingTestTask] = useState(false);
  const [isRefreshingTasks, setIsRefreshingTasks] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Adicionar um efeito para atualizar os dados quando o usuário retorna à página
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        console.log("Dashboard - User returned to page, refreshing data");
        fetchUserData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Também atualizar quando a janela recebe foco
    const handleFocus = () => {
      if (user) {
        console.log("Dashboard - Window focused, refreshing data");
        fetchUserData();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  const fetchUserData = async () => {
    setIsLoading(true);
    setIndexErrors({});
    
    try {
      console.log("Dashboard - Starting to fetch user data");
      await Promise.all([
        fetchUserHabits(),
        fetchUserTasks(),
        fetchDailyNote()
      ]);
      console.log("Dashboard - All data fetched successfully");
    } catch (error) {
      console.error("Error fetching user data:", error);
      
      // Verificar se o erro é relacionado a índices
      if (error instanceof Error && error.message.includes("The query requires an index")) {
        const indexUrl = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
        if (indexUrl) {
          setIndexErrors(prev => ({
            ...prev,
            general: indexUrl[0]
          }));
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserHabits = async () => {
    if (!user) return;
    
    try {
      console.log("Dashboard - Fetching habits for user:", user.uid);
      
      // Usar a função fetchHabits do arquivo habitUtils.ts
      const habitsData = await fetchHabits(user.uid);
      console.log("Dashboard - Habits fetched:", habitsData.length);
      
      // Buscar as conclusões de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      console.log("Dashboard - Fetching habit completions for today:", today.toISOString());
      console.log("Dashboard - Tomorrow date for query:", tomorrow.toISOString());
      
      const completionsQuery = query(
        collection(db, "habitCompletions"),
        where("userId", "==", user.uid),
        where("completedAt", ">=", today),
        where("completedAt", "<", tomorrow)
      );
      
      const completionsSnapshot = await getDocs(completionsQuery);
      console.log("Dashboard - Habit completions query result size:", completionsSnapshot.size);
      
      // Log detalhado de cada conclusão retornada
      completionsSnapshot.forEach((doc) => {
        console.log("Dashboard - Habit completion document:", doc.id, doc.data());
      });
      
      const completedHabitIds = new Set();
      
      completionsSnapshot.forEach((doc) => {
        const data = doc.data();
        completedHabitIds.add(data.habitId);
        console.log("Dashboard - Found completed habit:", data.habitId);
        
        // Verificar se a data de conclusão está realmente dentro do intervalo esperado
        if (data.completedAt instanceof Timestamp) {
          const completedDate = data.completedAt.toDate();
          console.log("Dashboard - Completion date:", completedDate.toISOString());
        }
      });
      
      // Marcar os hábitos como concluídos ou não
      const habitsWithCompletionStatus = habitsData.map(habit => {
        const isCompleted = completedHabitIds.has(habit.id);
        console.log(`Dashboard - Habit ${habit.id} (${habit.name}) completed: ${isCompleted}`);
        return {
          ...habit,
          completed: isCompleted
        };
      });
      
      console.log("Dashboard - Total habits:", habitsData.length);
      console.log("Dashboard - Completed habits:", completedHabitIds.size);
      console.log("Dashboard - Final habits data:", habitsWithCompletionStatus);
      
      // Verificar se há alguma discrepância entre os conjuntos de dados
      if (completedHabitIds.size > 0) {
        completedHabitIds.forEach(habitId => {
          const habitExists = habitsData.some(h => h.id === habitId);
          if (!habitExists) {
            console.warn(`Dashboard - Found completion for habit ${habitId} but habit doesn't exist in user's habits`);
          }
        });
      }
      
      setHabits(habitsWithCompletionStatus);
    } catch (error) {
      console.error("Error fetching habits:", error);
      
      // Verificar se o erro é relacionado a índices
      if (error instanceof Error && error.message.includes("The query requires an index")) {
        const indexUrl = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
        if (indexUrl) {
          setIndexErrors(prev => ({
            ...prev,
            habits: indexUrl[0]
          }));
        }
      }
      
      // Em caso de erro, definir um array vazio
      setHabits([]);
    }
  };

  const fetchUserTasks = async () => {
    if (!user) return;
    
    try {
      // Buscar tarefas para hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      console.log("Dashboard - Fetching tasks for today:", today.toISOString());
      console.log("Dashboard - Tomorrow date for filtering:", tomorrow.toISOString());
      
      // Usar a função fetchTasks do arquivo taskUtils.ts
      const allTasks = await fetchTasks(user.uid);
      console.log("Dashboard - All tasks fetched:", allTasks.length);
      
      // Log detalhado de todas as tarefas
      allTasks.forEach((task, index) => {
        console.log(`Dashboard - Task ${index + 1}:`, {
          id: task.id,
          title: task.title,
          completed: task.completed,
          dueDate: task.dueDate ? task.dueDate.toISOString() : null,
          forToday: task.forToday
        });
      });
      
      // Filtrar as tarefas para hoje no lado do cliente
      const tasksData = allTasks.filter(task => {
        // Verificar se a tarefa é para hoje (dueDate entre today and tomorrow)
        const isDueToday = task.dueDate && 
          task.dueDate >= today && 
          task.dueDate < tomorrow;
        
        // Verificar se a tarefa está marcada como "forToday"
        const isMarkedForToday = task.forToday === true;
        
        // Verificar se a tarefa não tem data de vencimento (consideramos como tarefa para hoje)
        const hasNoDueDate = task.dueDate === null;
        
        // Uma tarefa é para hoje se: tem vencimento hoje, está marcada para hoje, ou não tem data de vencimento
        const isForToday = isDueToday || isMarkedForToday || hasNoDueDate;
        
        console.log(`Dashboard - Task "${task.title}" is for today:`, isForToday, {
          isDueToday,
          isMarkedForToday,
          hasNoDueDate
        });
        
        return isForToday;
      });
      
      console.log("Dashboard - Total tasks for today:", tasksData.length);
      console.log("Dashboard - Completed tasks:", tasksData.filter(task => task.completed).length);
      
      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      
      // Verificar se o erro é relacionado a índices
      if (error instanceof Error && error.message.includes("The query requires an index")) {
        const indexUrl = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
        if (indexUrl) {
          setIndexErrors(prev => ({
            ...prev,
            tasks: indexUrl[0]
          }));
        }
      }
      
      // Em caso de erro, definir um array vazio
      setTasks([]);
    }
  };

  const fetchDailyNote = async () => {
    if (!user) return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Buscar todas as notas do usuário
      const notesQuery = query(
        collection(db, "dailyNotes"),
        where("userId", "==", user.uid)
      );
      
      const querySnapshot = await getDocs(notesQuery);
      console.log("Dashboard - Daily notes query result size:", querySnapshot.size);
      
      // Filtrar as notas para hoje no lado do cliente
      let foundNoteId: string | null = null;
      let foundNoteContent: string = "";
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const noteDate = data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate() 
          : new Date(data.createdAt?.seconds * 1000 || Date.now());
        
        // Verificar se a nota é de hoje
        if (noteDate >= today && noteDate < tomorrow) {
          foundNoteId = doc.id;
          foundNoteContent = data.content || "";
        }
      });
      
      if (foundNoteId) {
        setDailyNote(foundNoteContent);
        setNoteId(foundNoteId);
      } else {
        setDailyNote("");
        setNoteId(null);
      }
    } catch (error) {
      console.error("Error fetching daily note:", error);
      
      // Verificar se o erro é relacionado a índices
      if (error instanceof Error && error.message.includes("The query requires an index")) {
        const indexUrl = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
        if (indexUrl) {
          setIndexErrors(prev => ({
            ...prev,
            dailyNotes: indexUrl[0]
          }));
        }
      }
      
      // Em caso de erro, definir valores padrão
      setDailyNote("");
      setNoteId(null);
    }
  };

  const saveDailyNote = async () => {
    if (!user) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      if (noteId) {
        // Atualizar nota existente
        await updateDocumentWithPermission(
          "dailyNotes",
          noteId,
          {
            content: dailyNote,
            updatedAt: serverTimestamp()
          },
          user.uid
        );
        console.log("Nota diária atualizada com sucesso!");
      } else {
        // Criar nova nota
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const newNote = await createDocumentWithPermission(
          "dailyNotes",
          {
            content: dailyNote,
            date: today
          },
          user.uid
        );
        
        console.log("Nova nota diária criada com sucesso:", newNote.id);
        setNoteId(newNote.id);
      }
    } catch (error) {
      console.error("Error saving daily note:", error);
      setError("Erro ao salvar nota. Por favor, tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const refreshData = async () => {
    if (isRefreshing || !user) return;
    
    setIsRefreshing(true);
    
    try {
      await fetchUserData();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const refreshTasks = async () => {
    if (isRefreshingTasks || !user) return;
    
    setIsRefreshingTasks(true);
    
    try {
      await fetchUserTasks();
      console.log("Dashboard - Tasks refreshed successfully");
    } catch (error) {
      console.error("Error refreshing tasks:", error);
    } finally {
      setIsRefreshingTasks(false);
    }
  };

  // Calcular estatísticas
  const completedHabits = habits.filter(habit => habit.completed).length;
  const totalHabits = habits.length;
  
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;

  // Log para depuração
  useEffect(() => {
    console.log("Dashboard - Habits updated:", habits.length, "total,", completedHabits, "completed");
    console.log("Dashboard - Tasks updated:", tasks.length, "total,", completedTasks, "completed");
  }, [habits, tasks, completedHabits, completedTasks]);

  const handleToggleTask = async (taskId: string, currentState: boolean) => {
    if (updatingTaskId) return; // Evitar múltiplas atualizações simultâneas
    
    setUpdatingTaskId(taskId);
    
    try {
      await toggleTaskCompletion(taskId, currentState);
      
      // Atualizar o estado local
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, completed: !currentState } 
            : task
        )
      );
    } catch (error) {
      console.error("Error toggling task completion:", error);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleToggleHabit = async (habitId: string, currentState: boolean) => {
    if (updatingHabitId || !user) return; // Evitar múltiplas atualizações simultâneas
    
    setUpdatingHabitId(habitId);
    
    try {
      await toggleHabitCompletion(habitId, user.uid, !currentState);
      
      // Atualizar o estado local
      setHabits(prevHabits => 
        prevHabits.map(habit => 
          habit.id === habitId 
            ? { ...habit, completed: !currentState } 
            : habit
        )
      );
    } catch (error) {
      console.error("Error toggling habit completion:", error);
    } finally {
      setUpdatingHabitId(null);
    }
  };

  const addTestTask = async () => {
    if (!user || isAddingTestTask) return;
    
    setIsAddingTestTask(true);
    
    try {
      const today = new Date();
      const taskTitle = `Tarefa de teste (${today.toLocaleTimeString()})`;
      
      await addTask(
        user.uid,
        taskTitle,
        "Esta é uma tarefa de teste criada para verificar se as tarefas estão sendo exibidas corretamente no dashboard.",
        today,
        "medium",
        null,
        true // forToday
      );
      
      // Atualizar as tarefas
      await fetchUserTasks();
      
      console.log("Dashboard - Test task added successfully");
    } catch (error) {
      console.error("Error adding test task:", error);
    } finally {
      setIsAddingTestTask(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          </div>
          
          {/* Alerta para criação de índices */}
          {Object.keys(indexErrors).length > 0 && (
            <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Atenção: Índices necessários
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <p>
                      Para melhorar o desempenho das consultas, é recomendado criar os seguintes índices no Firebase:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      {Object.entries(indexErrors).map(([key, url]) => (
                        <li key={key}>
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-yellow-800 dark:text-yellow-200 underline"
                          >
                            Criar índice para {key === 'general' ? 'consultas gerais' : key}
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3">
                      <p className="font-medium">Instruções para criar índices:</p>
                      <ol className="list-decimal pl-5 mt-1 space-y-1">
                        <li>Clique nos links acima para abrir o console do Firebase</li>
                        <li>Faça login com sua conta Google</li>
                        <li>Clique no botão &quot;Criar índice&quot; na página que se abre</li>
                        <li>Aguarde alguns minutos para que o índice seja criado</li>
                        <li>Atualize esta página após a criação dos índices</li>
                      </ol>
                    </div>
                    <div className="mt-3">
                      <button
                        onClick={addTestTask}
                        disabled={isAddingTestTask}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-700 dark:hover:bg-green-600 transition-colors duration-200 disabled:opacity-50"
                      >
                        {isAddingTestTask ? (
                          <>
                            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                            Adicionando...
                          </>
                        ) : (
                          <>
                            <Check className="-ml-1 mr-2 h-4 w-4" />
                            Adicionar tarefa de teste para hoje
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card de Hábitos */}
            <div className="h-full">
              <HabitsCard 
                habits={habits}
                isLoading={isLoading}
                onToggleHabit={handleToggleHabit}
                updatingHabitId={updatingHabitId}
              />
            </div>

            {/* Card de Tarefas */}
            <div className="h-full">
              <TasksCard 
                tasks={tasks}
                isLoading={isLoading}
                isRefreshing={isRefreshingTasks}
                onToggleTask={handleToggleTask}
                onRefresh={refreshTasks}
                onAddTestTask={addTestTask}
                updatingTaskId={updatingTaskId}
                isAddingTestTask={isAddingTestTask}
                indexError={indexErrors.tasks}
              />
            </div>

            {/* Card de Projetos ou outro card que você tenha */}
            <div className="h-full">
              {/* Conteúdo do terceiro card */}
            </div>
          </div>

          {/* Seção de Objetivos - Posicionada abaixo dos cards e acima das notas diárias */}
          <div className="mt-10 mb-10">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-3 rounded-lg">
              <GoalsCard />
            </div>
          </div>

          {/* Card de Notas Diárias */}
          <div className="mt-6">
            <div className="h-full">
              <DailyNoteCard 
                dailyNote={dailyNote}
                onNoteChange={setDailyNote}
                onSave={saveDailyNote}
                isSaving={isSaving}
                error={error}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}



















