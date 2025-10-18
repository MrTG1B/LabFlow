
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
import type { User as AppUser, Salutation, Gender } from '@/lib/types';


export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance);
}

type SignUpData = Omit<AppUser, 'uid' | 'createdAt' | 'displayName' | 'email'> & {
    email: string;
    password?: string;
    salutation: Salutation;
    gender: Gender;
};


export async function initiateEmailSignUp(authInstance: Auth, firestore: Firestore, data: SignUpData): Promise<UserCredential> {
  const userCredential = await createUserWithEmailAndPassword(authInstance, data.email, data.password!);
  const user = userCredential.user;
  const userRef = doc(firestore, 'users', user.uid);
  
  const newUser: AppUser = {
      uid: user.uid,
      email: user.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      post: data.post,
      displayName: `${data.firstName} ${data.lastName}`,
      salutation: data.salutation,
      gender: data.gender,
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


export async function handleGoogleRedirectResult(authInstance: Auth, firestore: Firestore, onError: (error: any) => void) {
  try {
    const result = await getRedirectResult(authInstance);
    if (result) {
      const user = result.user;
      const userRef = doc(firestore, 'users', user.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        const displayName = user.displayName || '';
        const nameParts = displayName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const newUser: AppUser = {
          uid: user.uid,
          email: user.email,
          firstName,
          lastName,
          displayName,
          phone: user.phoneNumber || '', // Often null from Google
          // Provide default values for new fields for Google sign-up
          salutation: 'Mr.', 
          gender: 'Prefer not to say',
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
  } catch (error) {
    onError(error);
  }
}
