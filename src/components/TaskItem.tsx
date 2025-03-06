"use client";

import { useState } from "react";
import { Check, X, Edit, Trash, Calendar, Clock, Folder } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
  isEditing: boolean;
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
  projects: Project[];
  getProjectById: (id: string | null) => Project | null;
}

export default function TaskItem({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  isEditing,
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
  projects,
  getProjectById,
}: TaskItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const project = getProjectById(task.projectId);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 dark:text-red-400";
      case "medium":
        return "text-yellow-600 dark:text-yellow-400";
      case "low":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getPriorityBgColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 dark:bg-red-900";
      case "medium":
        return "bg-yellow-100 dark:bg-yellow-900";
      case "low":
        return "bg-green-100 dark:bg-green-900";
      default:
        return "bg-gray-100 dark:bg-gray-800";
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(task.id);
    } catch (error) {
      console.error("Error deleting task:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`p-4 mb-4 rounded-lg shadow-sm border ${task.completed ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`}>
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Título da tarefa"
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Descrição (opcional)"
            rows={3}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data de vencimento
              </label>
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prioridade
              </label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as "low" | "medium" | "high")}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Projeto
              </label>
              <select
                value={editProjectId || ""}
                onChange={(e) => setEditProjectId(e.target.value === "" ? null : e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Sem projeto</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-3">
            <button
              onClick={onCancelEdit}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSaveEdit(task.id)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-md text-sm font-medium text-white dark:bg-indigo-700 dark:hover:bg-indigo-600"
            >
              Salvar
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <button
                onClick={() => onToggleComplete(task.id)}
                className={`flex-shrink-0 h-6 w-6 rounded-full border ${
                  task.completed
                    ? "bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500"
                    : "border-gray-300 dark:border-gray-600"
                } flex items-center justify-center`}
              >
                {task.completed && <Check className="h-4 w-4 text-white" />}
              </button>
              <div>
                <h3
                  className={`text-lg font-medium ${
                    task.completed
                      ? "text-gray-500 dark:text-gray-400 line-through"
                      : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {task.title}
                </h3>
                {task.description && (
                  <p
                    className={`mt-1 text-sm ${
                      task.completed
                        ? "text-gray-500 dark:text-gray-400 line-through"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {task.description}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {task.dueDate && (
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        task.completed
                          ? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                          : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                      }`}
                    >
                      <Calendar className="mr-1 h-3 w-3" />
                      {format(task.dueDate, "d MMM yyyy", { locale: ptBR })}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                      task.completed
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                        : `${getPriorityBgColor(task.priority)} ${getPriorityColor(task.priority)}`
                    }`}
                  >
                    {task.priority === "high"
                      ? "Alta prioridade"
                      : task.priority === "medium"
                      ? "Média prioridade"
                      : "Baixa prioridade"}
                  </span>
                  {project && (
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        task.completed
                          ? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                      style={{
                        backgroundColor: task.completed ? undefined : `${project.color}20`,
                        color: task.completed ? undefined : project.color,
                      }}
                    >
                      <Folder className="mr-1 h-3 w-3" />
                      {project.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(task)}
                className="p-1 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 