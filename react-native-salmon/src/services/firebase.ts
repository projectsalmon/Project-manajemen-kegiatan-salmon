import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCFmBz3xEHHi-Ii4nWm0hUoUZs7ylTHhK4',
  authDomain: 'manajemen-kegiatan-salmon.firebaseapp.com',
  projectId: 'manajemen-kegiatan-salmon',
  storageBucket: 'manajemen-kegiatan-salmon.firebasestorage.app',
  messagingSenderId: '957812902323',
  appId: '1:957812902323:android:e84dd26cb63490bfef23c6',
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage persistence for React Native
let auth: any;
try {
  // @ts-ignore
  const { getReactNativePersistence } = require('firebase/auth');
  if (getReactNativePersistence) {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } else {
    auth = getAuth(app);
  }
} catch {
  auth = getAuth(app);
}

export const db = getFirestore(app);
export { app, auth };

import { GoogleAuthProvider, signInWithCredential, signInAnonymously, User } from 'firebase/auth';

/**
 * Sign in to Firebase Auth using Google idToken
 */
export const signInWithGoogleIdToken = async (idToken: string) => {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    return userCredential.user;
  } catch (error) {
    console.warn('Firebase Google Auth error:', error);
    throw error;
  }
};

/**
 * Ensure the user is authenticated in Firebase Auth so that Firestore rules pass.
 * Falls back to anonymous auth if available.
 */
export const ensureAuth = async (): Promise<User | null> => {
  if (auth.currentUser) return auth.currentUser;
  try {
    const res = await signInAnonymously(auth);
    return res.user;
  } catch (e) {
    console.warn('Anonymous auth not enabled or failed, continuing:', e);
    return null;
  }
};

