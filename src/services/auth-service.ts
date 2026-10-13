import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, firestore } from '../../firebaseConfig';

export type UserRole = 'admin' | 'customer';

export async function registerCustomer(input: {
  fullName: string;
  email: string;
  mobileNumber: string;
  password: string;
}) {
  const credential = await createUserWithEmailAndPassword(
    auth,
    input.email.trim().toLowerCase(),
    input.password
  );

  try {
    await setDoc(doc(firestore, 'profiles', credential.user.uid), {
      uid: credential.user.uid,
      full_name: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      mobile_number: input.mobileNumber.trim(),
      role: 'customer',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    await deleteUser(credential.user);
    throw error;
  }

  await signOut(auth);
  return credential.user;
}

async function signInForRole(email: string, password: string, role: UserRole) {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password
  );
  const profile = await getDoc(doc(firestore, 'profiles', credential.user.uid));

  if (!profile.exists() || profile.data().role !== role) {
    await signOut(auth);
    throw new Error(
      role === 'admin'
        ? 'This account is not registered as an administrator.'
        : 'Please use the administrator login for this account.'
    );
  }

  return credential.user;
}

export function loginCustomer(email: string, password: string) {
  return signInForRole(email, password, 'customer');
}

export function loginAdmin(email: string, password: string) {
  return signInForRole(email, password, 'admin');
}

export function logout() {
  return signOut(auth);
}

export function requestPasswordReset(email: string) {
  return sendPasswordResetEmail(auth, email.trim().toLowerCase());
}

export function readableAuthError(error: unknown) {
  const code = (error as { code?: string }).code;

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account already uses this email address.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/invalid-credential':
      return 'The email address or password is incorrect.';
    case 'auth/weak-password':
      return 'Please use a stronger password.';
    case 'auth/network-request-failed':
      return 'Check your internet connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait and try again.';
    default:
      return error instanceof Error ? error.message : 'Something went wrong.';
  }
}
