import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { PlusCircle, Trash2, Edit, Save, X, CheckCircle2, Circle, Loader2, Target, Calendar, Clock } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { 
  Goal, 
  fetchGoals, 
  addGoal, 
  updateGoal, 
  deleteGoal, 
  toggleGoalCompletion,
  getGoalCompletionStats
} from "@/lib/goalUtils";

// Cores para os cards de objetivos
const CARD_COLORS = [
  { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800", progress: "bg-blue-500" },
  { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800", progress: "bg-purple-500" },
  { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-300", border: "border-green-200 dark:border-green-800", progress: "bg-green-500" },
  { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800", progress: "bg-amber-500" },
  { bg: "bg-rose-50 dark:bg-rose-900/20", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800", progress: "bg-rose-500" },
];

// Função para calcular o progresso baseado na data alvo
const calculateProgress = (targetDate: Timestamp | null, completed: boolean): number => {
  if (completed) return 100;
  if (!targetDate) return 0;
  
  const now = new Date();
  const target = new Date(targetDate.toMillis());
  
  // Se a data alvo já passou, retorna 100%
  if (now > target) return 100;
  
  // Assumindo que um objetivo tem 30 dias para ser concluído
  const creationDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const totalDuration = target.getTime() - creationDate.getTime();
  const elapsed = now.getTime() - creationDate.getTime();
  
  const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  return Math.round(progress);
};

// Função para obter uma cor baseada no índice
const getColorForIndex = (index: number) => {
  return CARD_COLORS[index % CARD_COLORS.length];
};

export default function GoalsCard() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [updatingGoalId, setUpdatingGoalId] = useState<string | null>(null);
  
  // Form states
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDescription, setNewGoalDescription] = useState("");
  const [newGoalTargetDate, setNewGoalTargetDate] = useState("");
  
  useEffect(() => {
    if (user) {
      fetchUserGoals();
    }
  }, [user]);

  const fetchUserGoals = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedGoals = await fetchGoals(user.uid);
      setGoals(fetchedGoals);
    } catch (err) {
      console.error("Error fetching goals:", err);
      setError("Falha ao carregar objetivos. Por favor, tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGoal = async () => {
    if (!user) return;
    if (!newGoalTitle.trim()) {
      setError("O título do objetivo é obrigatório");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await addGoal(user.uid, {
        title: newGoalTitle.trim(),
        description: newGoalDescription.trim(),
        targetDate: newGoalTargetDate ? new Date(newGoalTargetDate) : null
      });
      
      // Reset form
      setNewGoalTitle("");
      setNewGoalDescription("");
      setNewGoalTargetDate("");
      setIsAddingGoal(false);
      
      // Refresh goals
      fetchUserGoals();
    } catch (err) {
      console.error("Error adding goal:", err);
      setError("Falha ao adicionar objetivo. Por favor, tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateGoal = async (goalId: string, data: Partial<Goal>) => {
    if (!user) return;
    
    setUpdatingGoalId(goalId);
    
    try {
      await updateGoal(user.uid, goalId, data);
      
      // Update local state
      setGoals(goals.map(goal => 
        goal.id === goalId ? { ...goal, ...data } : goal
      ));
      
      // If we were editing, exit edit mode
      if (editingGoalId === goalId) {
        setEditingGoalId(null);
      }
    } catch (err) {
      console.error("Error updating goal:", err);
      setError("Falha ao atualizar objetivo. Por favor, tente novamente.");
    } finally {
      setUpdatingGoalId(null);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user) return;
    
    if (!confirm("Tem certeza que deseja excluir este objetivo?")) {
      return;
    }
    
    setUpdatingGoalId(goalId);
    
    try {
      await deleteGoal(user.uid, goalId);
      
      // Update local state
      setGoals(goals.filter(goal => goal.id !== goalId));
    } catch (err) {
      console.error("Error deleting goal:", err);
      setError("Falha ao excluir objetivo. Por favor, tente novamente.");
    } finally {
      setUpdatingGoalId(null);
    }
  };

  const handleToggleGoalCompletion = async (goalId: string, currentState: boolean) => {
    if (!user) return;
    
    setUpdatingGoalId(goalId);
    
    try {
      await toggleGoalCompletion(user.uid, goalId, currentState);
      
      // Update local state
      setGoals(goals.map(goal => 
        goal.id === goalId ? { ...goal, completed: !currentState } : goal
      ));
    } catch (err) {
      console.error("Error toggling goal completion:", err);
      setError("Falha ao atualizar objetivo. Por favor, tente novamente.");
    } finally {
      setUpdatingGoalId(null);
    }
  };

  const startEditingGoal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setNewGoalTitle(goal.title);
    setNewGoalDescription(goal.description || "");
    setNewGoalTargetDate(goal.targetDate ? 
      new Date(goal.targetDate.toMillis()).toISOString().split('T')[0] : "");
  };

  const saveEditedGoal = async (goalId: string) => {
    if (!newGoalTitle.trim()) {
      setError("O título do objetivo é obrigatório");
      return;
    }
    
    const updatedData = {
      title: newGoalTitle.trim(),
      description: newGoalDescription.trim(),
      targetDate: newGoalTargetDate ? Timestamp.fromDate(new Date(newGoalTargetDate)) : null
    };
    
    await handleUpdateGoal(goalId, updatedData);
  };

  const cancelEditing = () => {
    setEditingGoalId(null);
    setNewGoalTitle("");
    setNewGoalDescription("");
    setNewGoalTargetDate("");
  };

  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return "";
    const date = new Date(timestamp.toMillis());
    return date.toLocaleDateString('pt-BR');
  };

  // Calculate stats
  const stats = getGoalCompletionStats(goals);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 h-full">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Meus Objetivos</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Acompanhe seus objetivos</p>
        </div>
        <button
          onClick={() => setIsAddingGoal(true)}
          className="flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
          disabled={isAddingGoal}
        >
          <PlusCircle size={16} />
          <span>Novo Objetivo</span>
        </button>
      </div>

      {/* Simplified Stats section */}
      {!isLoading && goals.length > 0 && (
        <div className="flex gap-3 mb-4 text-sm">
          <div className="bg-blue-50 dark:bg-blue-900/10 px-3 py-2 rounded">
            <span className="text-blue-700 dark:text-blue-300 font-medium">{stats.total}</span> Total
          </div>
          <div className="bg-green-50 dark:bg-green-900/10 px-3 py-2 rounded">
            <span className="text-green-700 dark:text-green-300 font-medium">{stats.completed}</span> Concluídos
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-sm rounded">
          {error}
        </div>
      )}

      {isLoading && !goals.length ? (
        <div className="flex justify-center items-center h-24">
          <Loader2 className="animate-spin text-gray-400" size={20} />
        </div>
      ) : (
        <>
          {isAddingGoal && (
            <div className="mb-4 p-3 border border-gray-200 dark:border-gray-700 rounded">
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  placeholder="Digite o título do objetivo"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="w-full p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  placeholder="Descreva seu objetivo"
                  value={newGoalDescription}
                  onChange={(e) => setNewGoalDescription(e.target.value)}
                  className="w-full p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  rows={2}
                />
              </div>
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data Alvo (opcional)
                </label>
                <input
                  type="date"
                  value={newGoalTargetDate}
                  onChange={(e) => setNewGoalTargetDate(e.target.value)}
                  className="w-full p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsAddingGoal(false)}
                  className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddGoal}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  disabled={isLoading || !newGoalTitle.trim()}
                >
                  Adicionar
                </button>
              </div>
            </div>
          )}

          {goals.length === 0 && !isLoading ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
              Você ainda não tem objetivos. Adicione seu primeiro objetivo.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
              {goals.map((goal, index) => {
                const colorScheme = getColorForIndex(index);
                const progress = calculateProgress(goal.targetDate, goal.completed);
                
                return (
                  <div 
                    key={goal.id} 
                    className={`${goal.completed ? 'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30' : `${colorScheme.bg} border-${colorScheme.border}`} 
                    border rounded-lg shadow-sm overflow-hidden`}
                  >
                    {editingGoalId === goal.id ? (
                      // Edit mode - simplified
                      <div className="p-3">
                        <div className="mb-2">
                          <input
                            type="text"
                            value={newGoalTitle}
                            onChange={(e) => setNewGoalTitle(e.target.value)}
                            className="w-full p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div className="mb-2">
                          <textarea
                            value={newGoalDescription}
                            onChange={(e) => setNewGoalDescription(e.target.value)}
                            className="w-full p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                            rows={2}
                            placeholder="Descrição (opcional)"
                          />
                        </div>
                        <div className="mb-2">
                          <input
                            type="date"
                            value={newGoalTargetDate}
                            onChange={(e) => setNewGoalTargetDate(e.target.value)}
                            className="w-full p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={cancelEditing}
                            className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                          >
                            <X size={16} />
                          </button>
                          <button
                            onClick={() => saveEditedGoal(goal.id)}
                            className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                            disabled={updatingGoalId === goal.id || !newGoalTitle.trim()}
                          >
                            {updatingGoalId === goal.id ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : (
                              <Save size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View mode - card style
                      <div>
                        {/* Barra de progresso no topo */}
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700">
                          <div 
                            className={`h-1.5 ${goal.completed ? 'bg-green-500' : colorScheme.progress}`} 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        
                        <div className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className={`text-base font-medium ${goal.completed ? 'line-through text-gray-500 dark:text-gray-400' : colorScheme.text}`}>
                              {goal.title}
                            </h3>
                            
                            <button
                              onClick={() => handleToggleGoalCompletion(goal.id, goal.completed)}
                              className={`${goal.completed ? 'text-green-500 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}
                              disabled={updatingGoalId === goal.id}
                            >
                              {updatingGoalId === goal.id ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : goal.completed ? (
                                <CheckCircle2 size={16} />
                              ) : (
                                <Circle size={16} />
                              )}
                            </button>
                          </div>
                          
                          {goal.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                              {goal.description}
                            </p>
                          )}
                          
                          <div className="flex justify-between items-center mt-2">
                            {goal.targetDate && (
                              <div className={`text-xs flex items-center ${goal.completed ? 'text-gray-500 dark:text-gray-400' : colorScheme.text}`}>
                                <Calendar size={12} className="mr-1" />
                                {formatDate(goal.targetDate)}
                              </div>
                            )}
                            
                            <div className="flex space-x-1">
                              <button
                                onClick={() => startEditingGoal(goal)}
                                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                disabled={updatingGoalId === goal.id}
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                disabled={updatingGoalId === goal.id}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
} 