import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCsJNThRyhpVixsv7NlJzJ78_OSHmnixyo",
  authDomain: "habitracker-2f323.firebaseapp.com",
  projectId: "habitracker-2f323",
  storageBucket: "habitracker-2f323.appspot.com",
  messagingSenderId: "1085739695551",
  appId: "1:1085739695551:web:208b880a8f46229349b50a"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
