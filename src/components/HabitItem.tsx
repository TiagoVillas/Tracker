"use client";

import { useState } from "react";
import { Check, X, Edit, Trash } from "lucide-react";
import HabitStreak from "./HabitStreak";

interface Habit {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  createdAt: Date;
}

interface HabitItemProps {
  habit: Habit;
  isSelected: boolean;
  toggleHabitSelection: (habitId: string) => void;
  toggleHabitCompletion: (habitId: string) => void;
  startEditingHabit: (habit: Habit) => void;
  deleteHabit: (habitId: string) => void;
  editingHabit: string | null;
  editName: string;
  setEditName: (name: string) => void;
  editDescription: string;
  setEditDescription: (description: string) => void;
  cancelEditingHabit: () => void;
  saveEditedHabit: (habitId: string) => void;
  isSubmitting: boolean;
  completionDates: Date[];
}

export default function HabitItem({
  habit,
  isSelected,
  toggleHabitSelection,
  toggleHabitCompletion,
  startEditingHabit,
  deleteHabit,
  editingHabit,
  editName,
  setEditName,
  editDescription,
  setEditDescription,
  cancelEditingHabit,
  saveEditedHabit,
  isSubmitting,
  completionDates
}: HabitItemProps) {
  return (
    <li 
      className={`border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
        isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
      } transition-colors duration-150`}
      onClick={() => toggleHabitSelection(habit.id)}
    >
      <div className="px-4 py-5 sm:px-6">
        {editingHabit === habit.id ? (
          <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
            <div>
              <label htmlFor={`edit-name-${habit.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome do Hábito
              </label>
              <input
                type="text"
                id={`edit-name-${habit.id}`}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor={`edit-description-${habit.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Descrição (opcional)
              </label>
              <textarea
                id={`edit-description-${habit.id}`}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelEditingHabit}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                disabled={isSubmitting}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </button>
              <button
                onClick={() => saveEditedHabit(habit.id)}
                disabled={!editName.trim() || isSubmitting}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleHabitCompletion(habit.id);
                  }}
                  className={`flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                    habit.completed
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  aria-label={habit.completed ? "Marcar como não concluído" : "Marcar como concluído"}
                >
                  {habit.completed && <Check className="h-4 w-4" />}
                </button>
                <div>
                  <h3
                    className={`text-lg font-medium ${
                      habit.completed 
                        ? "text-gray-400 dark:text-gray-500 line-through" 
                        : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {habit.name}
                  </h3>
                  {habit.description && (
                    <p
                      className={`mt-1 text-sm ${
                        habit.completed 
                          ? "text-gray-400 dark:text-gray-500 line-through" 
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {habit.description}
                    </p>
                  )}
                  
                  {/* Exibir a sequência atual e recorde */}
                  <div className="mt-2">
                    <HabitStreak completedDates={completionDates} />
                  </div>
                </div>
              </div>
              <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditingHabit(habit);
                  }}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                  aria-label="Editar hábito"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteHabit(habit.id);
                  }}
                  className="text-red-400 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400"
                  aria-label="Excluir hábito"
                >
                  <Trash className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </li>
  );
} 