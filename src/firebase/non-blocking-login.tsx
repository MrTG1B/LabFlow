
'use client';
import {
  Auth, 
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance);
}


export async function initiateEmailSignUp(authInstance: Auth, firestore: Firestore, email: string, password: string): Promise<UserCredential> {
  const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
  const user = userCredential.user;
  const userRef = doc(firestore, 'users', user.uid);
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
  
  return userCredential;
}


export async function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
    return await signInWithEmailAndPassword(authInstance, email, password);
}


export function initiateGoogleSignIn(authInstance: Auth): void {
  const provider = new GoogleAuthProvider();
  signInWithRedirect(authInstance, provider);
}


export function handleGoogleRedirectResult(authInstance: Auth, firestore: Firestore, onError: (error: any) => void) {
  getRedirectResult(authInstance)
    .then(async (result) => {
      if (result) {
        const user = result.user;
        const userRef = doc(firestore, 'users', user.uid);
        const docSnap = await getDoc(userRef);

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
      onError(error);
    });
}
