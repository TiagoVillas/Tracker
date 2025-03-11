"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTheme } from "@/lib/contexts/ThemeContext";
import Navbar from "@/components/Navbar";
import { 
  Loader2,
  Calendar,
  Pencil,
  Trash2,
  Save,
  X,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Search,
  Plus
} from "lucide-react";
import { db } from "@/lib/firebase/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  Timestamp,
  serverTimestamp,
  addDoc
} from "firebase/firestore";
import Link from "next/link";
import { updateDocumentWithPermission, deleteDocumentWithPermission, createDocumentWithPermission } from "@/lib/firebase/firebaseUtils";

interface Note {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function NotesPage() {
  const { user, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [indexError, setIndexError] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      fetchNotes();
    } else if (!authLoading && !user) {
      // Redirect to login if not authenticated
      window.location.href = "/login";
    }
  }, [user, authLoading]);

  const fetchNotes = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Buscar todas as notas do usuário ordenadas por data de criação (mais recentes primeiro)
      const notesQuery = query(
        collection(db, "dailyNotes"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(notesQuery);
      console.log("Notes page - Notes query result size:", querySnapshot.size);
      
      const fetchedNotes: Note[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedNotes.push({
          id: doc.id,
          content: data.content || "",
          createdAt: data.createdAt instanceof Timestamp 
            ? data.createdAt.toDate() 
            : new Date(data.createdAt?.seconds * 1000 || Date.now()),
          updatedAt: data.updatedAt instanceof Timestamp 
            ? data.updatedAt.toDate() 
            : new Date(data.updatedAt?.seconds * 1000 || Date.now())
        });
      });
      
      setNotes(fetchedNotes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      
      // Verificar se o erro é relacionado a índices
      if (error instanceof Error && error.message.includes("The query requires an index")) {
        const indexUrl = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
        if (indexUrl) {
          setIndexError(indexUrl[0]);
        }
      }
      
      setError("Erro ao carregar notas. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditedContent(note.content);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditedContent("");
  };

  const handleSaveEdit = async (noteId: string) => {
    if (!user) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      await updateDocumentWithPermission(
        "dailyNotes",
        noteId,
        {
          content: editedContent,
          updatedAt: serverTimestamp()
        },
        user.uid
      );
      
      // Atualizar a nota na lista local
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === noteId 
            ? { ...note, content: editedContent, updatedAt: new Date() } 
            : note
        )
      );
      
      setEditingNoteId(null);
      setEditedContent("");
      
      // Mostrar mensagem de sucesso
      setSuccessMessage("Nota atualizada com sucesso!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error updating note:", error);
      setError("Erro ao atualizar nota. Por favor, tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;
    
    setIsDeleting(noteId);
    setError(null);
    
    try {
      await deleteDocumentWithPermission(
        "dailyNotes",
        noteId,
        user.uid
      );
      
      // Remover a nota da lista local
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      
      // Mostrar mensagem de sucesso
      setSuccessMessage("Nota excluída com sucesso!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error deleting note:", error);
      setError("Erro ao excluir nota. Por favor, tente novamente.");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCreateNote = async () => {
    if (!user || !newNoteContent.trim()) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const newNote = await createDocumentWithPermission(
        "dailyNotes",
        {
          content: newNoteContent,
          date: new Date()
        },
        user.uid
      );
      
      // Adicionar a nova nota à lista local
      const createdNote: Note = {
        id: newNote.id,
        content: newNoteContent,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setNotes(prevNotes => [createdNote, ...prevNotes]);
      setNewNoteContent("");
      setIsCreatingNote(false);
      
      // Mostrar mensagem de sucesso
      setSuccessMessage("Nova nota criada com sucesso!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error creating note:", error);
      setError("Erro ao criar nota. Por favor, tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Filtrar notas com base no termo de pesquisa
  const filteredNotes = notes.filter(note => 
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Minhas Notas</h1>
            <button
              onClick={() => setIsCreatingNote(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200"
            >
              <Plus className="-ml-1 mr-1.5 h-4 w-4" />
              Nova Nota
            </button>
          </div>

          {/* Mensagem de sucesso */}
          {successMessage && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-400 p-4 flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
            </div>
          )}

          {/* Mensagem de erro */}
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Alerta para criação de índices */}
          {indexError && (
            <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Atenção: Índice necessário
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <p>
                      Para melhorar o desempenho das consultas, é recomendado criar o seguinte índice no Firebase:
                    </p>
                    <div className="mt-2">
                      <a 
                        href={indexError} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-yellow-800 dark:text-yellow-200 underline"
                      >
                        Criar índice para notas
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Formulário para criar nova nota */}
          {isCreatingNote && (
            <div className="mb-6 bg-white dark:bg-gray-800 shadow rounded-lg p-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Nova Nota</h2>
              <textarea
                rows={4}
                className="shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100 transition-colors duration-200 mb-3"
                placeholder="Escreva sua nota aqui..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                  onClick={() => {
                    setIsCreatingNote(false);
                    setNewNoteContent("");
                  }}
                >
                  <X className="-ml-1 mr-1.5 h-3 w-3" />
                  Cancelar
                </button>
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200 disabled:opacity-50"
                  onClick={handleCreateNote}
                  disabled={isSaving || !newNoteContent.trim()}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-1.5 h-3 w-3" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="-ml-1 mr-1.5 h-3 w-3" />
                      Salvar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Barra de pesquisa */}
          <div className="mb-6">
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100 transition-colors duration-200"
                placeholder="Pesquisar notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando notas...</span>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
              {searchTerm ? (
                <p className="text-gray-600 dark:text-gray-400">Nenhuma nota encontrada para "{searchTerm}"</p>
              ) : (
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Você ainda não tem notas.</p>
                  <button
                    onClick={() => setIsCreatingNote(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200"
                  >
                    <Plus className="-ml-1 mr-1.5 h-4 w-4" />
                    Criar primeira nota
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotes.map((note) => (
                <div 
                  key={note.id} 
                  className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden transition-colors duration-200"
                >
                  <div className="p-4">
                    {editingNoteId === note.id ? (
                      <div className="space-y-3">
                        <textarea
                          rows={4}
                          className="shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100 transition-colors duration-200"
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                            onClick={handleCancelEdit}
                          >
                            <X className="-ml-1 mr-1.5 h-3 w-3" />
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200 disabled:opacity-50"
                            onClick={() => handleSaveEdit(note.id)}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="animate-spin -ml-1 mr-1.5 h-3 w-3" />
                                Salvando...
                              </>
                            ) : (
                              <>
                                <Save className="-ml-1 mr-1.5 h-3 w-3" />
                                Salvar
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 mb-3">
                          {note.content}
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{formatDate(note.createdAt)} às {formatTime(note.createdAt)}</span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              className="inline-flex items-center p-1 border border-transparent rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                              onClick={() => handleEditNote(note)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center p-1 border border-transparent rounded-full text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50"
                              onClick={() => handleDeleteNote(note.id)}
                              disabled={isDeleting === note.id}
                            >
                              {isDeleting === note.id ? (
                                <Loader2 className="animate-spin h-3.5 w-3.5" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 