import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import type { User } from 'firebase/auth';

// Firebase configuration - YOU NEED TO REPLACE THESE VALUES
// Get these from: https://console.firebase.google.com
// 1. Create a new project (or use existing)
// 2. Go to Project Settings > General > Your apps > Add app > Web
// 3. Copy the config values below
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth helpers
export const loginWithPassword = async (password: string): Promise<boolean> => {
  // For girlfriend access, we use a simple password check
  // In production, you'd want proper authentication
  if (password === 'mamma123') {
    return true;
  }
  return false;
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Firestore collections
export const COLLECTIONS = {
  SHOPPING_LISTS: 'shoppingLists',
  CALENDAR_EVENTS: 'calendarEvents',
  TODOS: 'todos',
  NOTES: 'notes',
  FOLDERS: 'folders'
} as const;

// Shopping Lists - Real-time sync
export const subscribeToShoppingLists = (
  userId: string,
  callback: (lists: any[]) => void
) => {
  const q = query(
    collection(db, COLLECTIONS.SHOPPING_LISTS),
    where('sharedWith', 'array-contains', userId),
    orderBy('date', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const lists = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date()
    }));
    callback(lists);
  });
};

export const addShoppingListToFirestore = async (list: any) => {
  const docRef = doc(collection(db, COLLECTIONS.SHOPPING_LISTS));
  await setDoc(docRef, {
    ...list,
    id: docRef.id,
    date: Timestamp.fromDate(new Date(list.date)),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateShoppingListInFirestore = async (id: string, updates: any) => {
  const docRef = doc(db, COLLECTIONS.SHOPPING_LISTS, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

export const deleteShoppingListFromFirestore = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.SHOPPING_LISTS, id));
};

// Calendar Events - Real-time sync
export const subscribeToCalendarEvents = (
  userId: string,
  callback: (events: any[]) => void
) => {
  const q = query(
    collection(db, COLLECTIONS.CALENDAR_EVENTS),
    where('userId', '==', userId),
    orderBy('start', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      start: doc.data().start?.toDate() || new Date(),
      end: doc.data().end?.toDate() || new Date()
    }));
    callback(events);
  });
};

export const addCalendarEventToFirestore = async (event: any, userId: string) => {
  const docRef = doc(collection(db, COLLECTIONS.CALENDAR_EVENTS));
  await setDoc(docRef, {
    ...event,
    id: docRef.id,
    userId,
    start: Timestamp.fromDate(new Date(event.start)),
    end: Timestamp.fromDate(new Date(event.end)),
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const deleteCalendarEventFromFirestore = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.CALENDAR_EVENTS, id));
};

// Check if Firebase is configured
export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey !== "YOUR_API_KEY" &&
         firebaseConfig.projectId !== "YOUR_PROJECT_ID";
};
