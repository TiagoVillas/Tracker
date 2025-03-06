"use client";

import { useState } from "react";
import TaskItem from "./TaskItem";

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: Date;
}

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate: Date | null;
  priority: "low" | "medium" | "high";
  createdAt: Date;
  projectId: string | null;
}

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: string) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
  editingTask: string | null;
  editTitle: string;
  editDescription: string;
  editDueDate: string;
  editPriority: "low" | "medium" | "high";
  editProjectId: string | null;
  setEditTitle: (value: string) => void;
  setEditDescription: (value: string) => void;
  setEditDueDate: (value: string) => void;
  setEditPriority: (value: "low" | "medium" | "high") => void;
  setEditProjectId: (value: string | null) => void;
  onSaveEdit: (id: string) => Promise<void>;
  onCancelEdit: () => void;
  isLoading: boolean;
  projects: Project[];
  selectedProjectId: string | null;
  getProjectById: (id: string | null) => Project | null;
}

export default function TaskList({
  tasks,
  onToggleComplete,
  onEdit,
  onDelete,
  editingTask,
  editTitle,
  editDescription,
  editDueDate,
  editPriority,
  editProjectId,
  setEditTitle,
  setEditDescription,
  setEditDueDate,
  setEditPriority,
  setEditProjectId,
  onSaveEdit,
  onCancelEdit,
  isLoading,
  projects,
  selectedProjectId,
  getProjectById,
}: TaskListProps) {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "dueDate" | "priority">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filteredTasks = tasks.filter((task) => {
    // Filtrar por status (ativo/concluído)
    if (filter === "active" && task.completed) return false;
    if (filter === "completed" && !task.completed) return false;
    
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "createdAt") {
      return sortOrder === "asc"
        ? a.createdAt.getTime() - b.createdAt.getTime()
        : b.createdAt.getTime() - a.createdAt.getTime();
    }
    
    if (sortBy === "dueDate") {
      // Handle null dueDate values
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return sortOrder === "asc" ? 1 : -1;
      if (!b.dueDate) return sortOrder === "asc" ? -1 : 1;
      
      return sortOrder === "asc"
        ? a.dueDate.getTime() - b.dueDate.getTime()
        : b.dueDate.getTime() - a.dueDate.getTime();
    }
    
    if (sortBy === "priority") {
      const priorityValues = { high: 3, medium: 2, low: 1 };
      return sortOrder === "asc"
        ? priorityValues[a.priority] - priorityValues[b.priority]
        : priorityValues[b.priority] - priorityValues[a.priority];
    }
    
    return 0;
  });

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent dark:border-indigo-400"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Carregando tarefas...</p>
      </div>
    );
  }

  // Contar tarefas ativas e concluídas para o projeto selecionado
  const activeTasksCount = tasks.filter(t => !t.completed && (selectedProjectId === null || t.projectId === selectedProjectId)).length;
  const completedTasksCount = tasks.filter(t => t.completed && (selectedProjectId === null || t.projectId === selectedProjectId)).length;
  const totalTasksCount = activeTasksCount + completedTasksCount;

  if (totalTasksCount === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-600 dark:text-gray-300">
          {selectedProjectId === null
            ? "Nenhuma tarefa encontrada. Adicione uma nova tarefa para começar!"
            : `Nenhuma tarefa encontrada para este projeto. Adicione uma nova tarefa para começar!`}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              filter === "all"
                ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            Todas ({totalTasksCount})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              filter === "active"
                ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            Ativas ({activeTasksCount})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              filter === "completed"
                ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            Concluídas ({completedTasksCount})
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <label htmlFor="sortBy" className="text-sm text-gray-700 dark:text-gray-300">
            Ordenar por:
          </label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "createdAt" | "dueDate" | "priority")}
            className="p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="createdAt">Data de criação</option>
            <option value="dueDate">Data de vencimento</option>
            <option value="priority">Prioridade</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {sortOrder === "asc" ? "↑ Crescente" : "↓ Decrescente"}
          </button>
        </div>
      </div>

      <div>
        {sortedTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggleComplete={onToggleComplete}
            onEdit={onEdit}
            onDelete={onDelete}
            isEditing={editingTask === task.id}
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
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            projects={projects}
            getProjectById={getProjectById}
          />
        ))}
      </div>
    </div>
  );
} 