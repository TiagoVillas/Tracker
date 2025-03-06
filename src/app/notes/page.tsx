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
  ExternalLink
} from "lucide-react";
import { db } from "@/lib/firebase/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  Timestamp 
} from "firebase/firestore";
import Link from "next/link";
import { updateDocumentWithPermission, deleteDocumentWithPermission } from "@/lib/firebase/firebaseUtils";

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
    
    try {
      await updateDocumentWithPermission(
        "dailyNotes",
        noteId,
        {
          content: editedContent,
          updatedAt: new Date()
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
      
      // Sair do modo de edição
      setEditingNoteId(null);
      setEditedContent("");
    } catch (error) {
      console.error("Error updating note:", error);
      setError("Erro ao atualizar nota. Por favor, tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user || !window.confirm("Tem certeza que deseja excluir esta nota?")) return;
    
    setIsDeleting(noteId);
    
    try {
      await deleteDocumentWithPermission(
        "dailyNotes",
        noteId,
        user.uid
      );
      
      // Remover a nota da lista local
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    } catch (error) {
      console.error("Error deleting note:", error);
      setError("Erro ao excluir nota. Por favor, tente novamente.");
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Minhas Notas Diárias</h1>
        </div>
        
        {indexError && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExternalLink className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Índice necessário
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <p>
                    É necessário criar um índice no Firebase para esta consulta. 
                    <a 
                      href={indexError}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline ml-1"
                    >
                      Clique aqui para criar o índice
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-4 rounded-md">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma nota encontrada</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Você ainda não criou nenhuma nota diária. Volte para a página inicial para criar sua primeira nota.
            </p>
            <Link 
              href="/"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200"
            >
              Criar Nota
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {notes.map((note) => (
              <div 
                key={note.id} 
                className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden transition-colors duration-200"
              >
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {formatDate(note.createdAt)}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Atualizado às {formatTime(note.updatedAt)}
                      </span>
                      
                      {editingNoteId !== note.id && (
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleEditNote(note)}
                            className="p-1 rounded-full text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 focus:outline-none"
                            title="Editar nota"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 rounded-full text-gray-400 hover:text-red-500 dark:hover:text-red-400 focus:outline-none"
                            title="Excluir nota"
                            disabled={isDeleting === note.id}
                          >
                            {isDeleting === note.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {editingNoteId === note.id ? (
                    <div className="space-y-3">
                      <textarea
                        rows={6}
                        className="shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100 transition-colors duration-200"
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                      />
                      
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={handleCancelEdit}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                          disabled={isSaving}
                        >
                          <X className="-ml-1 mr-1.5 h-3 w-3" />
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSaveEdit(note.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200"
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
                    <div className="prose dark:prose-invert max-w-none">
                      {note.content.split('\n').map((paragraph, index) => (
                        <p key={index} className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 