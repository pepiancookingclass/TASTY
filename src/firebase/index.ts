import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';
import { useUser } from './auth/use-user';
import { FirebaseClientProvider } from './client-provider';
import { FirebaseProvider, useFirebase, useAuth, useFirebaseApp, useFirestore } from './provider';

function initializeFirebase() {
  const isConfigured = getApps().length > 0;
  const firebaseApp = isConfigured ? getApp() : initializeApp(firebaseConfig);
  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);

  return { firebaseApp, firestore, auth };
}

export {
  initializeFirebase,
  FirebaseProvider,
  FirebaseClientProvider,
  useUser,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
};
