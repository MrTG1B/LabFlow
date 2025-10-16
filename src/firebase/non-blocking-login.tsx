
'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithRedirect, // Changed from signInWithPopup
  getRedirectResult,  // To handle the result after redirect
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';
import { doc, setDoc, getDoc, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, firestore: Firestore, email: string, password: string): void {
  // CRITICAL: Call createUserWithEmailAndPassword directly. Do NOT use 'await createUserWithEmailAndPassword(...)'.
  createUserWithEmailAndPassword(authInstance, email, password)
    .then(userCredential => {
        // After user is created in Auth, create user profile in Firestore
        const user = userCredential.user;
        const userRef = doc(firestore, 'users', user.uid);
        const newUser = {
            uid: user.uid,
            email: user.email,
            createdAt: new Date().toISOString(),
        };
        // This is a non-blocking call
        setDoc(userRef, newUser)
         .catch(error => {
            errorEmitter.emit(
              'permission-error',
              new FirestorePermissionError({
                path: userRef.path,
                operation: 'create',
                requestResourceData: newUser,
              })
            );
          });
    });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await signInWithEmailAndPassword(...)'.
  signInWithEmailAndPassword(authInstance, email, password);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate Google sign-in with redirect. */
export function initiateGoogleSignIn(authInstance: Auth): void {
  const provider = new GoogleAuthProvider();
  // CRITICAL: Use signInWithRedirect. This will navigate away from the page.
  signInWithRedirect(authInstance, provider);
}

/** Handle the result from a Google sign-in redirect. */
export function handleGoogleRedirectResult(authInstance: Auth, firestore: Firestore) {
  getRedirectResult(authInstance)
    .then(async (result) => {
      if (result) {
        // This is the signed-in user
        const user = result.user;
        const userRef = doc(firestore, 'users', user.uid);
        const docSnap = await getDoc(userRef);

        // If user doc doesn't exist, create it.
        if (!docSnap.exists()) {
          const newUser = {
            uid: user.uid,
            email: user.email,
            createdAt: new Date().toISOString(),
          };
          setDoc(userRef, newUser)
           .catch(error => {
              errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                  path: userRef.path,
                  operation: 'create',
                  requestResourceData: newUser,
                })
              );
            });
        }
      }
    }).catch((error) => {
      // Handle Errors here.
      console.error("Google Sign-In Redirect Error: ", error);
    });
}
