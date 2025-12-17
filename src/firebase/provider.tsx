'use client';

import { createContext, useContext } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

export type FirebaseContextValue = {
  firebaseApp: FirebaseApp | undefined;
  firestore: Firestore | undefined;
  auth: Auth | undefined;
};

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export const useFirebase = () => {
  return useContext(FirebaseContext);
};

export const useFirebaseApp = () => {
  return useContext(FirebaseContext)?.firebaseApp;
};

export const useFirestore = () => {
  return useContext(FirebaseContext)?.firestore;
};

export const useAuth = () => {
  return useContext(FirebaseContext)?.auth;
};

type FirebaseProviderProps = {
  children: React.ReactNode;
} & FirebaseContextValue;

export function FirebaseProvider({
  children,
  firebaseApp,
  firestore,
  auth,
}: FirebaseProviderProps) {
  return (
    <FirebaseContext.Provider
      value={{
        firebaseApp,
        firestore,
        auth,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}
