"use client";

import { useState } from "react";
import { Plus, Folder, Search } from "lucide-react";
import ProjectItem from "./ProjectItem";

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: Date;
}

interface ProjectListProps {
  projects: Project[];
  onAddProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (id: string) => Promise<void>;
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  taskCountByProject: Record<string, number>;
  isLoading: boolean;
}

export default function ProjectList({
  projects,
  onAddProject,
  onEditProject,
  onDeleteProject,
  selectedProjectId,
  onSelectProject,
  taskCountByProject,
  isLoading,
}: ProjectListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
            <Folder className="mr-2 h-5 w-5 text-indigo-500" />
            Projetos
          </h2>
          <button
            onClick={onAddProject}
            className="p-1.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800"
            disabled
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="py-4 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent dark:border-indigo-400"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Carregando projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
          <Folder className="mr-2 h-5 w-5 text-indigo-500" />
          Projetos
        </h2>
        <button
          onClick={onAddProject}
          className="p-1.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {projects.length > 5 && (
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar projetos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      )}

      <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
        <div
          className={`p-3 mb-2 rounded-lg cursor-pointer transition-all ${
            selectedProjectId === null
              ? "bg-indigo-100 dark:bg-indigo-900/50 border-l-4 border-indigo-500"
              : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-transparent"
          }`}
          onClick={() => onSelectProject(null)}
        >
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-500"></div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Todas as tarefas</h3>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {Object.values(taskCountByProject).reduce((a, b) => a + b, 0)} tarefas
              </div>
            </div>
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? "Nenhum projeto encontrado" : "Nenhum projeto criado"}
            </p>
            {!searchTerm && (
              <button
                onClick={onAddProject}
                className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
              >
                Criar seu primeiro projeto
              </button>
            )}
          </div>
        ) : (
          filteredProjects.map((project) => (
            <ProjectItem
              key={project.id}
              project={project}
              onEdit={onEditProject}
              onDelete={onDeleteProject}
              isSelected={selectedProjectId === project.id}
              onSelect={onSelectProject}
              taskCount={taskCountByProject[project.id] || 0}
            />
          ))
        )}
      </div>
    </div>
  );
} 