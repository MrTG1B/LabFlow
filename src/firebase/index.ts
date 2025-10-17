
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    // On the server, prevent initialization. Server-side Firebase should be handled differently if needed.
    // For this app, all Firebase usage is client-side.
    return getSdks(null);
  }

  // On the client, we use getApps() to avoid re-initializing.
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  
  return getSdks(app);
}


export function getSdks(firebaseApp: FirebaseApp | null) {
    if (!firebaseApp) {
        return {
            firebaseApp: null,
            auth: null,
            firestore: null,
            storage: null,
        };
    }

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
