'use client';

import { initializeFirebase } from '@/firebase';
import { FirebaseProvider } from '@/firebase/provider';
import type { FirebaseApp }from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

let firebaseApp: FirebaseApp | undefined;
let firestore: Firestore | undefined;
let auth: Auth | undefined;

type FirebaseClientProviderProps = {
  children: React.ReactNode;
};

export function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  if (!firebaseApp) {
    const firebase = initializeFirebase();
    firebaseApp = firebase.firebaseApp;
    firestore = firebase.firestore;
    auth = firebase.auth;
  }
  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      firestore={firestore}
      auth={auth}
    >
      {children}
    </FirebaseProvider>
  );
}
