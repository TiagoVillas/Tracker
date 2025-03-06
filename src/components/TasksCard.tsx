"use client";

import { useState } from "react";
import { CheckSquare, Check, Loader2, ExternalLink } from "lucide-react";
import { Task } from "@/lib/taskUtils";

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
  indexError
}: TasksCardProps) {
  const [showAllTasks, setShowAllTasks] = useState(false);
  
  // Calcular estatísticas
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  
  // Ordenar tarefas
  const sortedTasks = [...tasks].sort((a, b) => {
    // Primeiro, ordenar por status de conclusão (não concluídos primeiro)
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
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

  // Limitar o número de itens exibidos
  const MAX_ITEMS_TO_SHOW = 3;
  const displayedTasks = showAllTasks ? sortedTasks : sortedTasks.slice(0, MAX_ITEMS_TO_SHOW);
  const hasMoreTasks = sortedTasks.length > MAX_ITEMS_TO_SHOW;

  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-200 h-full flex flex-col">
      <div className="px-4 py-4 sm:p-5 flex-grow">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-green-100 dark:bg-green-900 rounded-md p-2">
            <CheckSquare className="h-5 w-5 text-green-600 dark:text-green-300" />
          </div>
          <div className="ml-3 w-0 flex-1">
            <dl>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">Tarefas de Hoje</dt>
              <dd>
                <div className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {isLoading || isRefreshing ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-green-500 border-r-transparent"></div>
                  ) : (
                    <>
                      <span className="text-lg">{completedTasks}/{totalTasks}</span>
                      {totalTasks > 0 && (
                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                          ({Math.round((completedTasks / totalTasks) * 100)}%)
                        </span>
                      )}
                    </>
                  )}
                </div>
                {!isLoading && !isRefreshing && totalTasks === 0 && (
                  <div className="mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Nenhuma tarefa para hoje
                    </p>
                    <div className="flex space-x-2 mt-1">
                      <a 
                        href="/tasks/new" 
                        className="text-xs text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 inline-block"
                      >
                        + Criar nova tarefa
                      </a>
                      <button
                        onClick={onAddTestTask}
                        disabled={isAddingTestTask}
                        className="text-xs text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 inline-flex items-center"
                      >
                        {isAddingTestTask ? (
                          <>
                            <Loader2 className="animate-spin mr-1 h-3 w-3" />
                            Adicionando...
                          </>
                        ) : (
                          "+ Adicionar tarefa de teste"
                        )}
                      </button>
                    </div>
                    {indexError && (
                      <div className="mt-2">
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
                {!isLoading && !isRefreshing && totalTasks > 0 && (
                  <div className="mt-1 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                    <div 
                      className="bg-green-600 dark:bg-green-500 h-1.5 rounded-full" 
                      style={{ width: `${Math.min(100, Math.round((completedTasks / totalTasks) * 100))}%` }}
                    ></div>
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
        
        {/* Lista de tarefas */}
        {!isLoading && !isRefreshing && totalTasks > 0 && (
          <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Suas tarefas para hoje:</h4>
            </div>
            
            <div className="space-y-3 px-1">
              {displayedTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="flex items-start space-x-2 py-1"
                >
                  <button
                    onClick={() => onToggleTask(task.id, task.completed)}
                    disabled={updatingTaskId === task.id}
                    className={`flex-shrink-0 h-5 w-5 rounded border ${
                      task.completed 
                        ? 'bg-green-500 border-green-500 dark:bg-green-600 dark:border-green-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    } flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                  >
                    {updatingTaskId === task.id ? (
                      <Loader2 className="h-3 w-3 text-white animate-spin" />
                    ) : task.completed ? (
                      <Check className="h-3 w-3 text-white" />
                    ) : null}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${
                      task.completed 
                        ? 'text-gray-500 dark:text-gray-400 line-through' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
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
                </div>
              ))}
            </div>
            
            {hasMoreTasks && (
              <div className="mt-3 text-center">
                <button
                  onClick={() => setShowAllTasks(!showAllTasks)}
                  className="text-xs text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300"
                >
                  {showAllTasks ? 'Mostrar menos' : `Mostrar mais ${sortedTasks.length - MAX_ITEMS_TO_SHOW} tarefas`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-5 mt-auto">
        <div className="text-xs">
          <a href="/tasks" className="font-medium text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300">
            Ver todas as tarefas
          </a>
        </div>
      </div>
    </div>
  );
} 