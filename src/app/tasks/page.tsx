"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/hooks/useAuth";
import { Plus, Check, X, Edit, Trash, Calendar, Clock, Folder, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import TaskList from "@/components/TaskList";
import AddTaskModal from "@/components/AddTaskModal";
import ProjectList from "@/components/ProjectList";
import ProjectModal from "@/components/ProjectModal";
import { 
  Project, 
  Task, 
  fetchProjects, 
  fetchTasks, 
  updateProject, 
  deleteProject, 
  addTask, 
  updateTask, 
  toggleTaskCompletion, 
  deleteTask,
  normalizeDate,
  formatDateForInput
} from "@/lib/taskUtils";
import { collection, addDoc, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

export default function Tasks() {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Estados para tarefas
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [newTaskProjectId, setNewTaskProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">("medium");
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  
  // Estados para projetos
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const today = new Date();
  const formattedDate = format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });

  useEffect(() => {
    if (user) {
      // Garantir que o ID do usuário esteja disponível no localStorage
      localStorage.setItem('userId', user.uid);
      console.log("Usuário autenticado:", user.uid);
      loadData();
    } else if (!authLoading) {
      setTasks([]);
      setProjects([]);
      setIsLoading(false);
      setIsLoadingProjects(false);
      if (!user && !authLoading) {
        setError("Você precisa estar logado para ver suas tarefas.");
      }
    }
  }, [user, authLoading]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setIsLoadingProjects(true);
      setError(null);
      setDebugInfo(null);
      
      // Store userId in localStorage for later use in other functions
      localStorage.setItem('userId', user.uid);
      
      console.log("Carregando dados para o usuário:", user.uid);
      
      // Carregar projetos e tarefas em paralelo
      let projectsData: Project[] = [];
      let tasksData: Task[] = [];
      
      try {
        projectsData = await fetchProjects(user.uid);
        setProjects(projectsData);
        console.log(`Carregados ${projectsData.length} projetos`);
      } catch (projectError) {
        console.error("Erro ao carregar projetos:", projectError);
        setError(`Erro ao carregar projetos: ${projectError instanceof Error ? projectError.message : 'Erro desconhecido'}`);
      }
      
      try {
        tasksData = await fetchTasks(user.uid);
        setTasks(tasksData);
        console.log(`Carregadas ${tasksData.length} tarefas`);
      } catch (taskError) {
        console.error("Erro ao carregar tarefas:", taskError);
        setError(`Erro ao carregar tarefas: ${taskError instanceof Error ? taskError.message : 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setError(`Erro ao carregar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
      setIsLoadingProjects(false);
    }
  };

  // Calcular contagem de tarefas por projeto
  const taskCountByProject: Record<string, number> = {};
  tasks.forEach(task => {
    if (task.projectId) {
      taskCountByProject[task.projectId] = (taskCountByProject[task.projectId] || 0) + 1;
    }
  });

  // Função para obter um projeto pelo ID
  const getProjectById = (id: string | null): Project | null => {
    if (!id) return null;
    return projects.find(project => project.id === id) || null;
  };

  const handleAddTask = async () => {
    if (!user) {
      setError("Você precisa estar logado para adicionar tarefas.");
      return;
    }
    if (!newTaskTitle.trim()) {
      setError("O título da tarefa é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      // Garantir que o ID do usuário esteja disponível no localStorage
      localStorage.setItem('userId', user.uid);
      
      // Usar a função utilitária para normalizar a data
      const dueDate = normalizeDate(newTaskDueDate);
      console.log("Data selecionada:", newTaskDueDate);
      console.log("Data normalizada:", dueDate ? dueDate.toISOString() : null);
      
      console.log("Adicionando tarefa:", { 
        title: newTaskTitle, 
        description: newTaskDescription, 
        dueDate, 
        priority: newTaskPriority, 
        projectId: newTaskProjectId,
        userId: user.uid 
      });
      
      // Criar a tarefa diretamente no Firestore usando setDoc
      const tasksCollection = collection(db, "tasks");
      const newDocRef = doc(tasksCollection); // Gera um novo ID de documento
      const taskId = newDocRef.id;
      
      const taskData = {
        title: newTaskTitle,
        description: newTaskDescription,
        completed: false,
        dueDate,
        priority: newTaskPriority,
        projectId: newTaskProjectId,
        userId: user.uid,
        createdAt: serverTimestamp()
      };
      
      // Usar setDoc para definir os dados do documento
      await setDoc(newDocRef, taskData);
      
      console.log("Tarefa adicionada com sucesso com ID:", taskId);
      
      // Criar o objeto da tarefa com o ID gerado
      const newTask: Task = {
        id: taskId,
        title: newTaskTitle,
        description: newTaskDescription,
        completed: false,
        dueDate,
        priority: newTaskPriority,
        createdAt: new Date(),
        projectId: newTaskProjectId,
        userId: user.uid
      };
      
      setTasks(prevTasks => [newTask, ...prevTasks]);
      setDebugInfo(`Tarefa "${newTaskTitle}" adicionada com sucesso.`);
      
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskDueDate("");
      setNewTaskPriority("medium");
      setNewTaskProjectId(selectedProjectId);
      setIsAddingTask(false);
    } catch (error) {
      console.error("Error adding task:", error);
      setError(`Erro ao adicionar tarefa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTaskCompletion = async (id: string) => {
    if (!user) {
      setError("Você precisa estar logado para atualizar tarefas.");
      return;
    }
    
    try {
      // Garantir que o ID do usuário esteja disponível no localStorage
      localStorage.setItem('userId', user.uid);
      
      const taskToUpdate = tasks.find((task) => task.id === id);
      if (!taskToUpdate) {
        setError("Tarefa não encontrada.");
        return;
      }

      await toggleTaskCompletion(id, taskToUpdate.completed);
      
      setTasks(prevTasks =>
        prevTasks.map((task) =>
          task.id === id ? { ...task, completed: !task.completed } : task
        )
      );
      
      setDebugInfo(`Status da tarefa atualizado com sucesso.`);
    } catch (error) {
      console.error("Error updating task:", error);
      setError(`Erro ao atualizar tarefa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const startEditingTask = (task: Task) => {
    setEditingTask(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditDueDate(formatDateForInput(task.dueDate));
    setEditPriority(task.priority);
    setEditProjectId(task.projectId);
  };

  const cancelEditingTask = () => {
    setEditingTask(null);
    setEditTitle("");
    setEditDescription("");
    setEditDueDate("");
    setEditPriority("medium");
    setEditProjectId(null);
  };

  const handleSaveEditedTask = async (id: string) => {
    if (!user) {
      setError("Você precisa estar logado para editar tarefas.");
      return;
    }
    if (!editTitle.trim()) {
      setError("O título da tarefa é obrigatório.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Garantir que o ID do usuário esteja disponível no localStorage
      localStorage.setItem('userId', user.uid);
      
      // Usar a função utilitária para normalizar a data
      const dueDate = normalizeDate(editDueDate);
      console.log("Data selecionada (edição):", editDueDate);
      console.log("Data normalizada (edição):", dueDate ? dueDate.toISOString() : null);
      
      const updates = {
        title: editTitle,
        description: editDescription,
        dueDate: dueDate,
        priority: editPriority,
        projectId: editProjectId,
      };
      
      await updateTask(id, updates);
      
      setTasks(prevTasks =>
        prevTasks.map((task) =>
          task.id === id
            ? {
                ...task,
                ...updates,
              }
            : task
        )
      );
      
      setDebugInfo(`Tarefa atualizada com sucesso.`);
      setEditingTask(null);
    } catch (error) {
      console.error("Error updating task:", error);
      setError(`Erro ao atualizar tarefa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!user) {
      setError("Você precisa estar logado para excluir tarefas.");
      return;
    }
    
    try {
      // Garantir que o ID do usuário esteja disponível no localStorage
      localStorage.setItem('userId', user.uid);
      
      await deleteTask(id);
      
      setTasks(prevTasks => prevTasks.filter((task) => task.id !== id));
      setDebugInfo(`Tarefa excluída com sucesso.`);
    } catch (error) {
      console.error("Error deleting task:", error);
      setError(`Erro ao excluir tarefa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleAddProject = async (name: string, description: string, color: string) => {
    if (!user) {
      setError("Você precisa estar logado para adicionar projetos.");
      return;
    }
    
    if (!name.trim()) {
      setError("O nome do projeto é obrigatório.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Garantir que o ID do usuário esteja disponível no localStorage
      localStorage.setItem('userId', user.uid);
      
      console.log("Adicionando projeto:", { name, description, color, userId: user.uid });
      
      // Criar o projeto diretamente no Firestore usando setDoc
      const projectsCollection = collection(db, "projects");
      const newDocRef = doc(projectsCollection); // Gera um novo ID de documento
      const projectId = newDocRef.id;
      
      const projectData = {
        name,
        description,
        color,
        userId: user.uid,
        createdAt: serverTimestamp()
      };
      
      // Usar setDoc para definir os dados do documento
      await setDoc(newDocRef, projectData);
      
      console.log("Projeto adicionado com sucesso com ID:", projectId);
      
      // Criar o objeto do projeto com o ID gerado
      const newProject: Project = {
        id: projectId,
        name,
        description,
        color,
        createdAt: new Date(),
        userId: user.uid
      };
      
      setProjects(prevProjects => [newProject, ...prevProjects]);
      setDebugInfo(`Projeto "${name}" adicionado com sucesso.`);
      setIsAddingProject(false);
      
      // Selecionar o novo projeto automaticamente
      setSelectedProjectId(newProject.id);
    } catch (error) {
      console.error("Error adding project:", error);
      setError(`Erro ao adicionar projeto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditingProject = (project: Project) => {
    setEditingProject(project);
    setIsEditingProject(true);
  };

  const handleSaveEditedProject = async (name: string, description: string, color: string) => {
    if (!user || !editingProject) {
      setError("Você precisa estar logado para editar projetos.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Garantir que o ID do usuário esteja disponível no localStorage
      localStorage.setItem('userId', user.uid);
      
      await updateProject(editingProject.id, name, description, color);
      
      setProjects(prevProjects =>
        prevProjects.map((project) =>
          project.id === editingProject.id
            ? {
                ...project,
                name,
                description,
                color,
              }
            : project
        )
      );
      
      setDebugInfo(`Projeto "${name}" atualizado com sucesso.`);
      setEditingProject(null);
      setIsEditingProject(false);
    } catch (error) {
      console.error("Error updating project:", error);
      setError(`Erro ao atualizar projeto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!user) {
      setError("Você precisa estar logado para excluir projetos.");
      return;
    }
    
    try {
      // Garantir que o ID do usuário esteja disponível no localStorage
      localStorage.setItem('userId', user.uid);
      
      await deleteProject(id, tasks);
      
      // Atualizar a lista de projetos
      setProjects(prevProjects => prevProjects.filter((project) => project.id !== id));
      
      // Atualizar as tarefas que estavam associadas a este projeto
      setTasks(prevTasks =>
        prevTasks.map((task) =>
          task.projectId === id ? { ...task, projectId: null } : task
        )
      );
      
      // Se o projeto excluído era o selecionado, voltar para "Todas as tarefas"
      if (selectedProjectId === id) {
        setSelectedProjectId(null);
      }
      
      setDebugInfo(`Projeto excluído com sucesso.`);
    } catch (error) {
      console.error("Error deleting project:", error);
      setError(`Erro ao excluir projeto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleOpenAddTask = () => {
    setNewTaskProjectId(selectedProjectId);
    setIsAddingTask(true);
  };

  // Filtrar tarefas pelo projeto selecionado
  const filteredTasks = selectedProjectId
    ? tasks.filter((task) => task.projectId === selectedProjectId)
    : tasks;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user && !authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Acesso Restrito</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Você precisa estar logado para acessar suas tarefas e projetos.</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Voltar para o início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Minhas Tarefas</h1>
            <p className="text-gray-600 dark:text-gray-300">{formattedDate}</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2">
            <button
              onClick={() => setIsAddingProject(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors mr-2"
            >
              <Plus size={20} />
              <span>Novo Projeto</span>
            </button>
            <button
              onClick={handleOpenAddTask}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={20} />
              <span>Nova Tarefa</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Seção de Projetos - Agora acima das tarefas */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                <Folder className="h-5 w-5 mr-2 text-indigo-500" />
                Meus Projetos
              </h2>
              <button
                onClick={() => setIsAddingProject(true)}
                className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors text-sm"
              >
                <Plus size={16} />
                <span>Adicionar</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Opção "Todas as tarefas" */}
              <div 
                className={`p-4 rounded-lg cursor-pointer transition-all border-l-4 ${
                  selectedProjectId === null
                    ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500"
                    : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-transparent"
                }`}
                onClick={() => setSelectedProjectId(null)}
              >
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-500 mr-2"></div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Todas as tarefas</h3>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Visualize todas as suas tarefas
                </div>
                <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {Object.values(taskCountByProject).reduce((a, b) => a + b, 0)} tarefas
                </div>
              </div>
              
              {/* Lista de Projetos */}
              {isLoadingProjects ? (
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent dark:border-indigo-400 mr-2"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Carregando projetos...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Nenhum projeto criado</p>
                  <button
                    onClick={() => setIsAddingProject(true)}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                  >
                    Criar seu primeiro projeto
                  </button>
                </div>
              ) : (
                projects.map((project) => (
                  <div 
                    key={project.id}
                    className={`p-4 rounded-lg cursor-pointer transition-all border-l-4 ${
                      selectedProjectId === project.id
                        ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500"
                        : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-transparent"
                    }`}
                    onClick={() => setSelectedProjectId(project.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: project.color }}
                        ></div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">{project.name}</h3>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditingProject(project);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-full"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {project.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                        {taskCountByProject[project.id] || 0} {(taskCountByProject[project.id] || 0) === 1 ? 'tarefa' : 'tarefas'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {project.createdAt && format(project.createdAt, "dd/MM/yyyy")}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Seção de Tarefas - Agora abaixo dos projetos */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                {selectedProjectId ? (
                  <>
                    <span 
                      className="h-3 w-3 rounded-full mr-2" 
                      style={{ backgroundColor: getProjectById(selectedProjectId)?.color || '#4F46E5' }}
                    ></span>
                    Tarefas: {getProjectById(selectedProjectId)?.name}
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2 text-green-600 dark:text-green-500" />
                    Todas as Tarefas
                  </>
                )}
              </h2>
              <button
                onClick={handleOpenAddTask}
                className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors text-sm"
              >
                <Plus size={16} />
                <span>Adicionar</span>
              </button>
            </div>
            
            <TaskList
              tasks={filteredTasks}
              projects={projects}
              isLoading={isLoading}
              onToggleComplete={handleToggleTaskCompletion}
              onEdit={startEditingTask}
              onDelete={handleDeleteTask}
              editingTask={editingTask}
              editTitle={editTitle}
              editDescription={editDescription}
              editDueDate={editDueDate}
              editPriority={editPriority}
              editProjectId={editProjectId}
              setEditTitle={setEditTitle}
              setEditDescription={setEditDescription}
              setEditDueDate={setEditDueDate}
              setEditPriority={setEditPriority}
              setEditProjectId={setEditProjectId}
              onSaveEdit={handleSaveEditedTask}
              onCancelEdit={cancelEditingTask}
              selectedProjectId={selectedProjectId}
              getProjectById={getProjectById}
            />
          </div>
        </div>
      </div>

      <AddTaskModal
        isOpen={isAddingTask}
        onClose={() => setIsAddingTask(false)}
        onAddTask={handleAddTask}
        newTaskTitle={newTaskTitle}
        setNewTaskTitle={setNewTaskTitle}
        newTaskDescription={newTaskDescription}
        setNewTaskDescription={setNewTaskDescription}
        newTaskDueDate={newTaskDueDate}
        setNewTaskDueDate={setNewTaskDueDate}
        newTaskPriority={newTaskPriority}
        setNewTaskPriority={setNewTaskPriority}
        newTaskProjectId={newTaskProjectId}
        setNewTaskProjectId={setNewTaskProjectId}
        isSubmitting={isSubmitting}
        projects={projects}
      />

      <ProjectModal
        isOpen={isAddingProject}
        onClose={() => setIsAddingProject(false)}
        onSave={handleAddProject}
        title="Adicionar Novo Projeto"
        isSubmitting={isSubmitting}
      />

      {editingProject && (
        <ProjectModal
          isOpen={isEditingProject}
          onClose={() => {
            setIsEditingProject(false);
            setEditingProject(null);
          }}
          onSave={handleSaveEditedProject}
          title="Editar Projeto"
          initialName={editingProject.name}
          initialDescription={editingProject.description}
          initialColor={editingProject.color}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
} 