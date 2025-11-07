// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDR0gXHBys8cPMsUu43ECOGt8jaOs5xYkI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gestao-financeira-igreja.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gestao-financeira-igreja",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gestao-financeira-igreja.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "389509997147",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:389509997147:web:8c745a64fcdab324d6957e",
  measurementId: "G-Z5YBHZ6EF8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;