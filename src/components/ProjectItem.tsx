"use client";

import { useState } from "react";
import { Edit, Trash, Folder, MoreVertical } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: Date;
}

interface ProjectItemProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => Promise<void>;
  isSelected: boolean;
  onSelect: (id: string) => void;
  taskCount: number;
}

export default function ProjectItem({
  project,
  onEdit,
  onDelete,
  isSelected,
  onSelect,
  taskCount,
}: ProjectItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir o projeto "${project.name}"? Isso não excluirá as tarefas associadas.`)) {
      setIsDeleting(true);
      try {
        await onDelete(project.id);
      } catch (error) {
        console.error("Error deleting project:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div
      className={`relative p-3 mb-2 rounded-lg cursor-pointer transition-all ${
        isSelected
          ? "bg-indigo-100 dark:bg-indigo-900/50 border-l-4 border-indigo-500"
          : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-transparent"
      }`}
      onClick={() => onSelect(project.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: project.color }}
          ></div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">{project.name}</h3>
            {project.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                {project.description}
              </p>
            )}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {taskCount} {taskCount === 1 ? "tarefa" : "tarefas"}
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowOptions(!showOptions);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showOptions && (
            <div
              className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(project);
                    setShowOptions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar projeto
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                    setShowOptions(false);
                  }}
                  disabled={isDeleting}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  {isDeleting ? "Excluindo..." : "Excluir projeto"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 