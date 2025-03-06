"use client";

import { Plus } from "lucide-react";
import AddHabitModal from "./AddHabitModal";

interface AddHabitFormProps {
  isAddingHabit: boolean;
  setIsAddingHabit: (value: boolean) => void;
  newHabitName: string;
  setNewHabitName: (value: string) => void;
  newHabitDescription: string;
  setNewHabitDescription: (value: string) => void;
  addHabit: () => void;
  isSubmitting: boolean;
}

export default function AddHabitForm({
  isAddingHabit,
  setIsAddingHabit,
  newHabitName,
  setNewHabitName,
  newHabitDescription,
  setNewHabitDescription,
  addHabit,
  isSubmitting,
}: AddHabitFormProps) {
  const openModal = () => setIsAddingHabit(true);
  const closeModal = () => {
    setIsAddingHabit(false);
    setNewHabitName("");
    setNewHabitDescription("");
  };

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
      >
        <Plus className="mr-2 h-4 w-4" />
        Novo Hábito
      </button>

      <AddHabitModal
        isOpen={isAddingHabit}
        onClose={closeModal}
        newHabitName={newHabitName}
        setNewHabitName={setNewHabitName}
        newHabitDescription={newHabitDescription}
        setNewHabitDescription={setNewHabitDescription}
        addHabit={addHabit}
        isSubmitting={isSubmitting}
      />
    </>
  );
} 