"use client";

import { useState, useMemo, useEffect } from "react";
import { CheckSquare, Check, Loader2, ExternalLink, Calendar, Clock, Filter } from "lucide-react";
import { Task } from "@/lib/taskUtils";
import { format, isToday, isTomorrow, addDays, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: Date;
  userId: string;
}

interface TasksCardProps {
  tasks: Task[];
  isLoading: boolean;
  isRefreshing: boolean;
  onToggleTask: (taskId: string, currentState: boolean) => Promise<void>;
  onRefresh: () => Promise<void>;
  onAddTestTask: () => Promise<void>;
  updatingTaskId: string | null;
  isAddingTestTask: boolean;
  indexError?: string;
  projects?: Project[];
}

export default function TasksCard({ 
  tasks, 
  isLoading, 
  isRefreshing,
  onToggleTask, 
  onRefresh,
  onAddTestTask,
  updatingTaskId,
  isAddingTestTask,
  indexError,
  projects = []
}: TasksCardProps) {
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [timeFilter, setTimeFilter] = useState<"upcoming" | "today" | "all">("upcoming");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  
  // Calcular estatísticas
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  
  // Filtrar tarefas por período e projeto
  const filteredTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = addDays(today, 7);
    
    return tasks.filter(task => {
      // Filtrar por projeto se um projeto estiver selecionado
      if (selectedProjectId && task.projectId !== selectedProjectId) {
        return false;
      }
      
      if (timeFilter === "today") {
        return task.dueDate ? isToday(task.dueDate) : task.forToday;
      } else if (timeFilter === "upcoming") {
        // Mostrar tarefas para hoje, amanhã e próxima semana
        if (!task.dueDate) return true; // Tarefas sem data são consideradas próximas
        return !task.completed && (isToday(task.dueDate) || 
               isTomorrow(task.dueDate) || 
               (isAfter(task.dueDate, today) && isBefore(task.dueDate, nextWeek)));
      } else {
        return true; // Mostrar todas
      }
    });
  }, [tasks, timeFilter, selectedProjectId]);
  
  // Ordenar tarefas
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      // Primeiro, ordenar por status de conclusão (não concluídos primeiro)
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      
      // Depois, ordenar por data de vencimento (mais próximas primeiro)
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      } else if (a.dueDate) {
        return -1; // a tem data, b não tem
      } else if (b.dueDate) {
        return 1; // b tem data, a não tem
      }
      
      // Depois, ordenar por prioridade (alta > média > baixa)
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityA = priorityOrder[a.priority] || 1;
      const priorityB = priorityOrder[b.priority] || 1;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Por fim, ordenar por título
      return a.title.localeCompare(b.title);
    });
  }, [filteredTasks]);

  // Limitar o número de itens exibidos
  const MAX_ITEMS_TO_SHOW = 4;
  const displayedTasks = showAllTasks ? sortedTasks : sortedTasks.slice(0, MAX_ITEMS_TO_SHOW);
  const hasMoreTasks = sortedTasks.length > MAX_ITEMS_TO_SHOW;

  // Formatar data para exibição
  const formatTaskDate = (date: Date | null) => {
    if (!date) return null;
    
    if (isToday(date)) {
      return "Hoje";
    } else if (isTomorrow(date)) {
      return "Amanhã";
    } else {
      return format(date, "dd/MM", { locale: ptBR });
    }
  };
  
  // Encontrar projeto pelo ID
  const getProjectById = (projectId: string | null) => {
    if (!projectId) return null;
    return projects.find(p => p.id === projectId) || null;
  };

  // Limitar o número de projetos exibidos
  const MAX_PROJECTS_TO_SHOW = 4;
  const visibleProjects = projects.length > MAX_PROJECTS_TO_SHOW 
    ? projects.slice(0, MAX_PROJECTS_TO_SHOW) 
    : projects;
  const hasMoreProjects = projects.length > MAX_PROJECTS_TO_SHOW;

  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-200 h-full flex flex-col">
      <div className="px-4 py-4 sm:p-5 flex-grow">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900 rounded-md p-2">
              <CheckSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Suas Tarefas</h3>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {completedTasks}/{totalTasks} concluídas
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => setTimeFilter("today")}
              className={`px-2 py-1 text-xs rounded-md ${
                timeFilter === "today" 
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              Hoje
            </button>
            <button 
              onClick={() => setTimeFilter("upcoming")}
              className={`px-2 py-1 text-xs rounded-md ${
                timeFilter === "upcoming" 
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              Próximas
            </button>
            <button 
              onClick={() => setTimeFilter("all")}
              className={`px-2 py-1 text-xs rounded-md ${
                timeFilter === "all" 
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              Todas
            </button>
          </div>
        </div>
        
        {!isLoading && !isRefreshing && totalTasks > 0 && (
          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
            <div 
              className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full" 
              style={{ width: `${Math.min(100, Math.round((completedTasks / totalTasks) * 100))}%` }}
            ></div>
          </div>
        )}
        
        {/* Filtro de projetos */}
        {projects.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedProjectId(null)}
              className={`flex items-center px-2 py-1 rounded-full text-xs ${
                selectedProjectId === null
                  ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-medium'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-gray-400 mr-1.5"></span>
              Todos
            </button>
            
            {visibleProjects.map(project => (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id === selectedProjectId ? null : project.id)}
                className={`flex items-center px-2 py-1 rounded-full text-xs ${
                  selectedProjectId === project.id
                    ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-medium'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span 
                  className="h-2 w-2 rounded-full mr-1.5" 
                  style={{ backgroundColor: project.color }}
                ></span>
                {project.name}
              </button>
            ))}
            
            {hasMoreProjects && (
              <button
                onClick={() => setShowProjectSelector(!showProjectSelector)}
                className="flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <Filter className="h-3 w-3 mr-1" />
                Mais
              </button>
            )}
            
            {showProjectSelector && hasMoreProjects && (
              <div className="mt-2 w-full bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 p-2">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Todos os projetos</div>
                <div className="flex flex-wrap gap-1.5">
                  {projects.slice(MAX_PROJECTS_TO_SHOW).map(project => (
                    <button
                      key={project.id}
                      onClick={() => {
                        setSelectedProjectId(project.id === selectedProjectId ? null : project.id);
                        setShowProjectSelector(false);
                      }}
                      className={`flex items-center px-2 py-1 rounded-full text-xs ${
                        selectedProjectId === project.id
                          ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-medium'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span 
                        className="h-2 w-2 rounded-full mr-1.5" 
                        style={{ backgroundColor: project.color }}
                      ></span>
                      {project.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Lista de tarefas */}
        {isLoading || isRefreshing ? (
          <div className="mt-6 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-indigo-500 border-r-transparent"></div>
          </div>
        ) : sortedTasks.length > 0 ? (
          <div className="mt-4 pt-3">
            <div className="space-y-3">
              {displayedTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="flex items-start p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <button
                    onClick={() => onToggleTask(task.id, task.completed)}
                    disabled={updatingTaskId === task.id}
                    className={`flex-shrink-0 h-5 w-5 rounded-full border ${
                      task.completed 
                        ? 'bg-indigo-500 border-indigo-500 dark:bg-indigo-600 dark:border-indigo-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    } flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  >
                    {updatingTaskId === task.id ? (
                      <Loader2 className="h-3 w-3 text-white animate-spin" />
                    ) : task.completed ? (
                      <Check className="h-3 w-3 text-white" />
                    ) : null}
                  </button>
                  <div className="min-w-0 flex-1 ml-3">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${
                        task.completed 
                          ? 'text-gray-500 dark:text-gray-400 line-through' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {task.title}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        task.priority === 'high' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                          : task.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                      </span>
                    </div>
                    {task.description && (
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                    <div className="mt-1 flex items-center space-x-3 text-xs">
                      {task.dueDate && (
                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span className={`${
                            isToday(task.dueDate) ? 'text-indigo-600 dark:text-indigo-400' : 
                            isTomorrow(task.dueDate) ? 'text-orange-600 dark:text-orange-400' : ''
                          }`}>
                            {formatTaskDate(task.dueDate)}
                          </span>
                        </div>
                      )}
                      {task.projectId && (
                        <div className="flex items-center">
                          <span 
                            className="h-2 w-2 rounded-full mr-1" 
                            style={{ backgroundColor: getProjectById(task.projectId)?.color || '#4F46E5' }}
                          ></span>
                          <span className="text-gray-500 dark:text-gray-400 truncate max-w-[100px]">
                            {getProjectById(task.projectId)?.name || 'Projeto'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {hasMoreTasks && (
              <div className="mt-3 text-center">
                <button
                  onClick={() => setShowAllTasks(!showAllTasks)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                >
                  {showAllTasks ? 'Mostrar menos' : `Mostrar mais ${sortedTasks.length - MAX_ITEMS_TO_SHOW} tarefas`}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 text-center py-6">
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              {timeFilter === "today" ? (
                <p>Nenhuma tarefa para hoje</p>
              ) : timeFilter === "upcoming" ? (
                <p>Nenhuma tarefa próxima</p>
              ) : (
                <p>Nenhuma tarefa encontrada</p>
              )}
              {selectedProjectId && (
                <p className="mt-1 text-xs">Tente selecionar outro projeto ou remover o filtro</p>
              )}
            </div>
            <div className="flex justify-center mt-3">
              <a 
                href="/tasks/new" 
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 inline-block"
              >
                + Criar nova tarefa
              </a>
            </div>
            {indexError && (
              <div className="mt-4">
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Índice necessário para consultas de tarefas
                </p>
                <a 
                  href={indexError} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-yellow-600 dark:text-yellow-400 underline inline-flex items-center mt-1"
                >
                  Criar índice para tarefas
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-5 mt-auto">
        <div className="flex justify-between items-center">
          <a href="/tasks" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
            Ver todas as tarefas
          </a>
          <button 
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {isRefreshing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 