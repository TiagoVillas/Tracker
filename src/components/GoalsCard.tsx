import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { PlusCircle, Trash2, Edit, Save, X, CheckCircle2, Circle, Loader2, Target } from "lucide-react";
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-full">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Meus Objetivos</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Acompanhe e gerencie seus objetivos pessoais e profissionais</p>
        </div>
        <button
          onClick={() => setIsAddingGoal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          disabled={isAddingGoal}
        >
          <PlusCircle size={20} />
          <span>Novo Objetivo</span>
        </button>
      </div>

      {/* Stats section */}
      {!isLoading && goals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-300">Total</div>
            <div className="text-2xl font-semibold text-blue-700 dark:text-blue-200">{stats.total}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-sm text-green-600 dark:text-green-300">Concluídos</div>
            <div className="text-2xl font-semibold text-green-700 dark:text-green-200">
              {stats.completed} ({stats.percentage}%)
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="text-sm text-purple-600 dark:text-purple-300">Próximos</div>
            <div className="text-2xl font-semibold text-purple-700 dark:text-purple-200">{stats.upcoming}</div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
          {error}
        </div>
      )}

      {isLoading && !goals.length ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="animate-spin text-gray-400" size={24} />
        </div>
      ) : (
        <>
          {isAddingGoal && (
            <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  placeholder="Digite o título do objetivo"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  placeholder="Descreva seu objetivo"
                  value={newGoalDescription}
                  onChange={(e) => setNewGoalDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data Alvo (opcional)
                </label>
                <input
                  type="date"
                  value={newGoalTargetDate}
                  onChange={(e) => setNewGoalTargetDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsAddingGoal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddGoal}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  disabled={isLoading || !newGoalTitle.trim()}
                >
                  Adicionar Objetivo
                </button>
              </div>
            </div>
          )}

          {goals.length === 0 && !isLoading ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              Você ainda não tem objetivos. Clique no botão + para adicionar seu primeiro objetivo.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
              {goals.map((goal) => (
                <div 
                  key={goal.id} 
                  className={`p-4 border ${goal.completed ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'} rounded-lg`}
                >
                  {editingGoalId === goal.id ? (
                    // Edit mode
                    <div>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Título
                        </label>
                        <input
                          type="text"
                          value={newGoalTitle}
                          onChange={(e) => setNewGoalTitle(e.target.value)}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Descrição
                        </label>
                        <textarea
                          value={newGoalDescription}
                          onChange={(e) => setNewGoalDescription(e.target.value)}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                          rows={3}
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Data Alvo
                        </label>
                        <input
                          type="date"
                          value={newGoalTargetDate}
                          onChange={(e) => setNewGoalTargetDate(e.target.value)}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={cancelEditing}
                          className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                        >
                          <X size={18} />
                        </button>
                        <button
                          onClick={() => saveEditedGoal(goal.id)}
                          className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                          disabled={updatingGoalId === goal.id || !newGoalTitle.trim()}
                        >
                          {updatingGoalId === goal.id ? (
                            <Loader2 className="animate-spin" size={18} />
                          ) : (
                            <Save size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <button
                            onClick={() => handleToggleGoalCompletion(goal.id, goal.completed)}
                            className={`mt-1 ${goal.completed ? 'text-green-500 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}
                            disabled={updatingGoalId === goal.id}
                          >
                            {updatingGoalId === goal.id ? (
                              <Loader2 className="animate-spin" size={20} />
                            ) : goal.completed ? (
                              <CheckCircle2 size={20} />
                            ) : (
                              <Circle size={20} />
                            )}
                          </button>
                          <div>
                            <h3 className={`text-lg font-medium ${goal.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                              {goal.title}
                            </h3>
                            {goal.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                {goal.description}
                              </p>
                            )}
                            {goal.targetDate && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center">
                                <Target size={14} className="mr-1" />
                                Data alvo: {formatDate(goal.targetDate)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEditingGoal(goal)}
                            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            disabled={updatingGoalId === goal.id}
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            disabled={updatingGoalId === goal.id}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
} 