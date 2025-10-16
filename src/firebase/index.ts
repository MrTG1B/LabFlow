
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    // On the server, we can always try to initialize, and it will be a no-op
    // if already initialized.
    try {
      return getSdks(initializeApp());
    } catch (e) {
      return getSdks(initializeApp(firebaseConfig));
    }
  }

  // On the client, we must use getApps() to avoid re-initializing.
  if (!getApps().length) {
    // In a production environment (Firebase App Hosting), the config is provided
    // automatically, so initializeApp() is called without arguments.
    if (process.env.NODE_ENV === 'production') {
       try {
         return getSdks(initializeApp());
       } catch (e) {
         console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
         return getSdks(initializeApp(firebaseConfig));
       }
    } else {
      // In development, we use the local config file.
      return getSdks(initializeApp(firebaseConfig));
    }
  }

  // If already initialized on the client, return the existing app instance.
  return getSdks(getApp());
}


export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
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
