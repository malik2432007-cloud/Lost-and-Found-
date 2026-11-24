import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyBzVwxRYI4ItKB1YUEuCdtD0jDOq9PLG7E",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "lost-found-app-41bec.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "lost-found-app-41bec",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "lost-found-app-41bec.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "271513836132",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:271513836132:web:9ca78a0059fbf7f5a81d71",
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || "G-N6YWCMGYZ2"
};

// Initialize Firebase app singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
