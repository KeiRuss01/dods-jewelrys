import { router } from 'expo-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { auth, firestore } from '../../firebaseConfig';
import type { UserRole } from '../services/auth-service';

export function useRequireRole(role: UserRole) {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (active) {
          router.replace(role === 'admin' ? '/admin-login' : '/login');
        }
        return;
      }

      try {
        const profile = await getDoc(doc(firestore, 'profiles', user.uid));

        if (!profile.exists() || profile.data().role !== role) {
          await signOut(auth);
          if (active) {
            router.replace(role === 'admin' ? '/admin-login' : '/login');
          }
          return;
        }

        if (active) {
          setChecking(false);
        }
      } catch {
        await signOut(auth);
        if (active) {
          router.replace(role === 'admin' ? '/admin-login' : '/login');
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [role]);

  return checking;
}
