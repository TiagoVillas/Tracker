"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/hooks/useAuth";
import { Calendar, AlertCircle } from "lucide-react";
import { format, isSameDay, startOfDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { db } from "@/lib/firebase/firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  serverTimestamp,
  Timestamp,
  getDoc,
  setDoc
} from "firebase/firestore";
import HabitCalendar from "@/components/HabitCalendar";
import HabitStreak from "@/components/HabitStreak";
import AddHabitForm from "@/components/AddHabitForm";
import HabitList from "@/components/HabitList";

interface Habit {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  createdAt: Date;
}

interface HabitCompletion {
  id: string;
  habitId: string;
  completedAt: Date;
}

export default function Habits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitCompletions, setHabitCompletions] = useState<HabitCompletion[]>([]);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitDescription, setNewHabitDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingHabit, setEditingHabit] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);

  const today = new Date();
  const formattedDate = format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });

  useEffect(() => {
    if (user) {
      fetchHabits();
      fetchHabitCompletions();
    } else {
      setHabits([]);
      setHabitCompletions([]);
      setIsLoading(false);
    }
  }, [user]);

  // Buscar hábitos quando a data selecionada mudar
  useEffect(() => {
    if (user && habitCompletions.length > 0) {
      updateHabitsCompletionStatus();
    }
  }, [selectedDate, habitCompletions]);

  const fetchHabits = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching habits for user:", user.uid);
      
      const habitsQuery = query(
        collection(db, "habits"),
        where("userId", "==", user.uid)
      );
      
      console.log("Query created, fetching documents...");
      const querySnapshot = await getDocs(habitsQuery);
      console.log("Documents fetched, count:", querySnapshot.size);
      
      const habitsData: Habit[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("Document data:", data);
        
        // Verificar se createdAt existe e é um Timestamp
        const createdAt = data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate() 
          : new Date();
        
        habitsData.push({
          id: doc.id,
          name: data.name || "",
          description: data.description || "",
          completed: false, // Inicialmente, todos os hábitos são marcados como não concluídos
          createdAt: createdAt,
        });
      });
      
      console.log("Habits processed:", habitsData.length);
      setHabits(habitsData);
      
      // Após carregar os hábitos, atualizamos o status de conclusão com base nas conclusões
      if (habitCompletions.length > 0) {
        updateHabitsCompletionStatus();
      }
    } catch (error) {
      console.error("Error fetching habits:", error);
      setError("Erro ao carregar hábitos. Por favor, tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHabitCompletions = async () => {
    if (!user) return;
    
    try {
      const completionsQuery = query(
        collection(db, "habitCompletions"),
        where("userId", "==", user.uid)
      );
      
      const querySnapshot = await getDocs(completionsQuery);
      
      const completionsData: HabitCompletion[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        const completedAt = data.completedAt instanceof Timestamp 
          ? data.completedAt.toDate() 
          : new Date();
        
        completionsData.push({
          id: doc.id,
          habitId: data.habitId,
          completedAt: completedAt,
        });
      });
      
      setHabitCompletions(completionsData);
    } catch (error) {
      console.error("Error fetching habit completions:", error);
    }
  };

  const updateHabitsCompletionStatus = () => {
    // Atualizar o status de conclusão dos hábitos com base na data selecionada
    const updatedHabits = habits.map(habit => {
      const isCompletedOnSelectedDate = habitCompletions.some(
        completion => 
          completion.habitId === habit.id && 
          isSameDay(completion.completedAt, selectedDate)
      );
      
      return {
        ...habit,
        completed: isCompletedOnSelectedDate
      };
    });
    
    setHabits(updatedHabits);
  };

  const addHabit = async () => {
    if (!user) return;
    if (!newHabitName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      console.log("Adding new habit for user:", user.uid);
      
      const newHabit = {
        name: newHabitName,
        description: newHabitDescription,
        createdAt: serverTimestamp(), // Usar serverTimestamp para consistência
        userId: user.uid,
      };

      console.log("New habit data:", newHabit);
      const docRef = await addDoc(collection(db, "habits"), newHabit);
      console.log("Habit added with ID:", docRef.id);
      
      // Usar uma data local para a UI enquanto o serverTimestamp é processado
      const localCreatedAt = new Date();
      
      setHabits([
        ...habits,
        {
          id: docRef.id,
          name: newHabitName,
          description: newHabitDescription,
          completed: false,
          createdAt: localCreatedAt,
        },
      ]);
      
      setNewHabitName("");
      setNewHabitDescription("");
      setIsAddingHabit(false);
    } catch (error) {
      console.error("Error adding habit:", error);
      setError("Erro ao adicionar hábito. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleHabitCompletion = async (id: string) => {
    if (!user) return;

    try {
      const habitToUpdate = habits.find((habit) => habit.id === id);
      if (!habitToUpdate) return;

      const newCompletedState = !habitToUpdate.completed;
      console.log(`Toggling habit ${id} to ${newCompletedState ? 'completed' : 'not completed'}`);
      
      // Atualizar UI imediatamente para feedback rápido
      setHabits(
        habits.map((habit) =>
          habit.id === id ? { ...habit, completed: newCompletedState } : habit
        )
      );
      
      // Não precisamos mais atualizar o campo completed no documento do hábito
      // Vamos gerenciar o estado de conclusão apenas através da coleção habitCompletions
      
      // Se o hábito foi marcado como concluído, adicionar à coleção de conclusões
      if (newCompletedState) {
        // Criar um objeto de data com a data selecionada, mas mantendo a hora atual
        // Isso garante que o Timestamp seja criado corretamente
        const selectedDateWithCurrentTime = new Date();
        selectedDateWithCurrentTime.setFullYear(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate()
        );
        
        const completionData = {
          habitId: id,
          userId: user.uid,
          completedAt: Timestamp.fromDate(selectedDateWithCurrentTime),
        };
        
        console.log("Adding habit completion:", completionData);
        const docRef = await addDoc(collection(db, "habitCompletions"), completionData);
        console.log("Habit completion added with ID:", docRef.id);
        
        // Atualizar o estado local com a nova conclusão
        const newCompletion: HabitCompletion = {
          id: docRef.id, // Usar o ID real do documento
          habitId: id,
          completedAt: selectedDateWithCurrentTime,
        };
        
        setHabitCompletions([...habitCompletions, newCompletion]);
      } else {
        // Se o hábito foi desmarcado, remover da coleção de conclusões
        const completionToRemove = habitCompletions.find(
          completion => completion.habitId === id && isSameDay(completion.completedAt, selectedDate)
        );
        
        if (completionToRemove) {
          console.log("Removing habit completion:", completionToRemove.id);
          await deleteDoc(doc(db, "habitCompletions", completionToRemove.id));
          console.log("Habit completion removed");
          
          // Atualizar o estado local removendo a conclusão
          setHabitCompletions(
            habitCompletions.filter(completion => completion.id !== completionToRemove.id)
          );
        }
      }
      
    } catch (error) {
      console.error("Error updating habit:", error);
      // Reverter a mudança na UI se houver erro
      updateHabitsCompletionStatus();
      setError("Erro ao atualizar hábito. Por favor, tente novamente.");
    }
  };

  const startEditingHabit = (habit: Habit) => {
    setEditingHabit(habit.id);
    setEditName(habit.name);
    setEditDescription(habit.description);
  };

  const cancelEditingHabit = () => {
    setEditingHabit(null);
    setEditName("");
    setEditDescription("");
  };

  const saveEditedHabit = async (id: string) => {
    if (!user) return;
    if (!editName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await updateDoc(doc(db, "habits", id), {
        name: editName,
        description: editDescription,
      });
      
      setHabits(
        habits.map((habit) =>
          habit.id === id
            ? { ...habit, name: editName, description: editDescription }
            : habit
        )
      );
      
      setEditingHabit(null);
    } catch (error) {
      console.error("Error updating habit:", error);
      setError("Erro ao atualizar hábito. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteHabit = async (id: string) => {
    if (!user) return;

    try {
      // Remover da UI primeiro para feedback rápido
      setHabits(habits.filter((habit) => habit.id !== id));
      
      // Remover todas as conclusões relacionadas a este hábito
      const completionsToDelete = habitCompletions.filter(
        completion => completion.habitId === id
      );
      
      for (const completion of completionsToDelete) {
        await deleteDoc(doc(db, "habitCompletions", completion.id));
      }
      
      // Atualizar o estado local removendo as conclusões
      setHabitCompletions(
        habitCompletions.filter(completion => completion.habitId !== id)
      );
      
      // Depois remover o hábito do banco de dados
      await deleteDoc(doc(db, "habits", id));
      
      // Limpar o hábito selecionado se ele foi excluído
      if (selectedHabit === id) {
        setSelectedHabit(null);
      }
    } catch (error) {
      console.error("Error deleting habit:", error);
      // Recarregar hábitos em caso de erro
      fetchHabits();
      fetchHabitCompletions();
      setError("Erro ao excluir hábito. Por favor, tente novamente.");
    }
  };

  const getHabitCompletionDates = (habitId: string): Date[] => {
    return habitCompletions
      .filter(completion => completion.habitId === habitId)
      .map(completion => completion.completedAt);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  // Obter todas as datas de conclusão para o calendário
  const getAllCompletionDates = (): Date[] => {
    // Se um hábito estiver selecionado, mostrar apenas as datas desse hábito
    if (selectedHabit) {
      return habitCompletions
        .filter(completion => completion.habitId === selectedHabit)
        .map(completion => completion.completedAt);
    }
    
    // Se nenhum hábito estiver selecionado, não mostrar nenhuma data de conclusão
    return [];
  };
  
  // Função para selecionar/deselecionar um hábito
  const toggleHabitSelection = (habitId: string) => {
    if (selectedHabit === habitId) {
      setSelectedHabit(null);
    } else {
      setSelectedHabit(habitId);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center py-10">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Faça login para gerenciar seus hábitos</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Você precisa estar logado para acessar esta funcionalidade.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Meus Hábitos</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="inline-block mr-1 h-4 w-4" />
                {formattedDate}
              </p>
            </div>
            <AddHabitForm
              isAddingHabit={isAddingHabit}
              setIsAddingHabit={setIsAddingHabit}
              newHabitName={newHabitName}
              setNewHabitName={setNewHabitName}
              newHabitDescription={newHabitDescription}
              setNewHabitDescription={setNewHabitDescription}
              addHabit={addHabit}
              isSubmitting={isSubmitting}
            />
          </div>

          {/* Calendário de hábitos */}
          <div className="mb-6 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md p-4">
            <HabitCalendar 
              completedDates={getAllCompletionDates()}
              onSelectDate={handleDateSelect}
              selectedDate={selectedDate}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isSameDay(selectedDate, new Date()) ? 
                  'Você está visualizando os hábitos de hoje.' : 
                  `Você está visualizando os hábitos de ${format(selectedDate, "d 'de' MMMM", { locale: ptBR })}.`
                }
              </p>
              {selectedHabit && (
                <button 
                  onClick={() => setSelectedHabit(null)}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                  Limpar filtro
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-10">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 dark:border-indigo-400 border-r-transparent"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando hábitos...</p>
            </div>
          ) : (
            <>
              <HabitList
                habits={habits}
                selectedHabit={selectedHabit}
                toggleHabitSelection={toggleHabitSelection}
                toggleHabitCompletion={toggleHabitCompletion}
                startEditingHabit={startEditingHabit}
                deleteHabit={deleteHabit}
                editingHabit={editingHabit}
                editName={editName}
                setEditName={setEditName}
                editDescription={editDescription}
                setEditDescription={setEditDescription}
                cancelEditingHabit={cancelEditingHabit}
                saveEditedHabit={saveEditedHabit}
                isSubmitting={isSubmitting}
                getHabitCompletionDates={getHabitCompletionDates}
                setIsAddingHabit={setIsAddingHabit}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
} 