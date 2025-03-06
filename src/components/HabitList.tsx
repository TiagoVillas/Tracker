"use client";

import { Plus } from "lucide-react";
import HabitItem from "./HabitItem";

interface Habit {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  createdAt: Date;
}

interface HabitListProps {
  habits: Habit[];
  selectedHabit: string | null;
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
  getHabitCompletionDates: (habitId: string) => Date[];
  setIsAddingHabit: (value: boolean) => void;
}

export default function HabitList({
  habits,
  selectedHabit,
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
  getHabitCompletionDates,
  setIsAddingHabit
}: HabitListProps) {
  if (habits.length === 0) {
    return (
      <div className="text-center py-10 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <p className="text-gray-500 dark:text-gray-400">Você ainda não tem hábitos cadastrados.</p>
        <button
          onClick={() => setIsAddingHabit(true)}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar seu primeiro hábito
        </button>
      </div>
    );
  }

  return (
    <ul className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
      {habits.map((habit) => (
        <HabitItem
          key={habit.id}
          habit={habit}
          isSelected={selectedHabit === habit.id}
          toggleHabitSelection={toggleHabitSelection}
          toggleHabitCompletion={toggleHabitCompletion}
          startEditingHabit={startEditingHabit}
          deleteHabit={deleteHabit}
          editingHabit={editingHabit}
          editName={editName}
          setEditName={setEditName}
          editDescription={editDescription}
          setEditDescription={setEditDescription}
          cancelEditingHabit={cancelEditingHabit}
          saveEditedHabit={saveEditedHabit}
          isSubmitting={isSubmitting}
          completionDates={getHabitCompletionDates(habit.id)}
        />
      ))}
    </ul>
  );
} 