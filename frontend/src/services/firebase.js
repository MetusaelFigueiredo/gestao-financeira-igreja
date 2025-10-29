import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDR0gXHBys8cPMsUu43ECOGt8jaOs5xYkI",
  authDomain: "gestao-financeira-igreja.firebaseapp.com",
  projectId: "gestao-financeira-igreja",
  storageBucket: "gestao-financeira-igreja.firebasestorage.app",
  messagingSenderId: "389509997147",
  appId: "1:389509997147:web:8c745a64fcdab324d6957e"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);