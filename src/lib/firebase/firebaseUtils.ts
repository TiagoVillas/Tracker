import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  User
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  query,
  where,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Auth functions
export const logoutUser = () => signOut(auth);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// Firestore functions
export const addDocument = (collectionName: string, data: any) =>
  addDoc(collection(db, collectionName), data);

export const getDocuments = async (collectionName: string) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateDocument = (collectionName: string, id: string, data: any) =>
  updateDoc(doc(db, collectionName, id), data);

export const deleteDocument = (collectionName: string, id: string) =>
  deleteDoc(doc(db, collectionName, id));

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// Função para verificar se o usuário tem permissão para acessar um documento
export const checkDocumentPermission = async (collectionName: string, documentId: string, userId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return false;
    }
    
    const data = docSnap.data();
    return data.userId === userId;
  } catch (error) {
    console.error(`Error checking permission for ${collectionName}/${documentId}:`, error);
    return false;
  }
};

// Função para criar um documento com permissões corretas
export const createDocumentWithPermission = async (
  collectionName: string, 
  data: any, 
  userId: string
) => {
  try {
    if (!userId) {
      throw new Error(`createDocumentWithPermission: userId is required for ${collectionName}`);
    }

    console.log(`Criando documento em ${collectionName} para usuário ${userId}`, data);

    // Garantir que o userId está incluído nos dados
    const documentData = {
      ...data,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Criar uma referência para um novo documento com ID gerado automaticamente
    const collectionRef = collection(db, collectionName);
    const docRef = doc(collectionRef);
    
    // Definir os dados no documento
    await setDoc(docRef, documentData);
    
    console.log(`Documento criado com sucesso em ${collectionName} com ID ${docRef.id}`);
    
    return {
      id: docRef.id,
      ...data,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    throw error;
  }
};

// Função para atualizar um documento com verificação de permissão
export const updateDocumentWithPermission = async (
  collectionName: string,
  documentId: string,
  data: any,
  userId: string
) => {
  try {
    if (!userId) {
      throw new Error(`updateDocumentWithPermission: userId is required for ${collectionName}/${documentId}`);
    }

    if (!documentId) {
      throw new Error(`updateDocumentWithPermission: documentId is required for ${collectionName}`);
    }

    // Verificar se o usuário tem permissão para atualizar este documento
    const hasPermission = await checkDocumentPermission(collectionName, documentId, userId);
    
    if (!hasPermission) {
      throw new Error(`Você não tem permissão para atualizar este documento: ${collectionName}/${documentId}`);
    }
    
    // Atualizar o documento
    const docRef = doc(db, collectionName, documentId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error(`Error updating document ${collectionName}/${documentId}:`, error);
    throw error;
  }
};

// Função para excluir um documento com verificação de permissão
export const deleteDocumentWithPermission = async (
  collectionName: string,
  documentId: string,
  userId: string
) => {
  try {
    if (!userId) {
      throw new Error(`deleteDocumentWithPermission: userId is required for ${collectionName}/${documentId}`);
    }

    if (!documentId) {
      throw new Error(`deleteDocumentWithPermission: documentId is required for ${collectionName}`);
    }
    
    // Verificar se o usuário tem permissão para excluir este documento
    const hasPermission = await checkDocumentPermission(collectionName, documentId, userId);
    
    if (!hasPermission) {
      throw new Error(`Você não tem permissão para excluir este documento: ${collectionName}/${documentId}`);
    }
    
    // Excluir o documento
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);
    
    return true;
  } catch (error) {
    console.error(`Error deleting document ${collectionName}/${documentId}:`, error);
    throw error;
  }
};

// Função para obter o usuário atual
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Função para verificar se o usuário está autenticado
export const isUserAuthenticated = (): boolean => {
  return !!auth.currentUser;
};

// Função para obter o ID do usuário atual
export const getCurrentUserId = (): string | null => {
  return auth.currentUser?.uid || null;
};
