import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-expect-error -- getReactNativePersistence is not exposed in standard Web TS typings but is exported in RN environment
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import * as FirebaseAuth from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// These can be replaced with real configuration from process.env or expo-constants
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || ""
};

const isConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

if (isConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Configure auth safely
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
    } catch (e: any) {
      if (e.code === 'auth/already-initialized') {
        auth = FirebaseAuth.getAuth(app);
      } else {
        console.warn('Auth init error:', e);
        auth = FirebaseAuth.getAuth(app);
      }
    }

    // Configure Firestore safely
    try {
      db = getFirestore(app);
    } catch {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({})
      });
    }

    // Configure Storage safely
    storage = getStorage(app);
  } catch (error) {
    console.warn("Failed to initialize Firebase:", error);
  }
}

export { app, auth, db, storage, isConfigured };
