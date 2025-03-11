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
    
    // Retornar os dados com o ID e timestamps convertidos para Date
    // Isso é importante para que a UI possa exibir os dados corretamente
    const returnData = {
      id: docRef.id,
      ...data,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log(`Dados retornados após criação:`, returnData);
    return returnData;
  } catch (error) {
    console.error(`Erro ao criar documento em ${collectionName}:`, error);
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

// Collection names
export const TRANSACTIONS_COLLECTION = "transactions";
export const SUBSCRIPTIONS_COLLECTION = "subscriptions";

// Initialize collections with proper security rules
export const initializeFinanceCollections = async (userId: string) => {
  try {
    // Check if collections exist
    const transactionsRef = collection(db, TRANSACTIONS_COLLECTION);
    const subscriptionsRef = collection(db, SUBSCRIPTIONS_COLLECTION);
    
    // Try to add a test document to ensure we have write permissions
    const testTransactionRef = doc(transactionsRef, "test_" + userId);
    const testSubscriptionRef = doc(subscriptionsRef, "test_" + userId);
    
    try {
      // Try to set test documents
      await setDoc(testTransactionRef, {
        userId,
        test: true,
        createdAt: serverTimestamp()
      });
      
      await setDoc(testSubscriptionRef, {
        userId,
        test: true,
        createdAt: serverTimestamp()
      });
      
      // Delete test documents
      await deleteDoc(testTransactionRef);
      await deleteDoc(testSubscriptionRef);
      
      console.log("Finance collections initialized successfully");
      return true;
    } catch (error) {
      console.error("Error initializing finance collections:", error);
      
      // If we get a permission error, log instructions for the user
      if (error instanceof Error && error.message.includes("permission")) {
        console.error(`
          Firebase permission error. Please update your Firestore security rules:
          
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              // Allow users to read and write their own data
              match /transactions/{document=**} {
                allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
                allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
              }
              
              match /subscriptions/{document=**} {
                allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
                allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
              }
            }
          }
        `);
      }
      
      return false;
    }
  } catch (error) {
    console.error("Error checking collections:", error);
    return false;
  }
};

// Add this function to help users create required indexes
export const displayIndexInstructions = () => {
  console.info(`
    ===== FIREBASE INDEX INSTRUCTIONS =====
    
    Your app requires some Firestore indexes to work properly. Please follow these steps:
    
    1. For Transactions Collection:
       - Go to: https://console.firebase.google.com/project/habitracker-2f323/firestore/indexes
       - Click "Add Index"
       - Collection: transactions
       - Fields to index:
         * userId (Ascending)
         * date (Ascending)
         * __name__ (Ascending)
       - Click "Create"
    
    2. For Subscriptions Collection:
       - Go to: https://console.firebase.google.com/project/habitracker-2f323/firestore/indexes
       - Click "Add Index"
       - Collection: subscriptions
       - Fields to index:
         * userId (Ascending)
         * nextPaymentDate (Ascending)
         * __name__ (Ascending)
       - Click "Create"
    
    Alternatively, you can click on the links in the error messages to create the indexes directly.
    
    Note: It may take a few minutes for the indexes to be created and become active.
  `);
};
