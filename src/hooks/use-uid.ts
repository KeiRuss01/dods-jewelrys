import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

/**
 * Returns the signed-in user's id. `ready` becomes true once Firebase Auth
 * has finished restoring the session, so screens don't flash "signed out".
 * If you don't use Firebase Auth for login, change only this file.
 */
export function useUid() {
  const [state, setState] = useState<{ uid: string | null; ready: boolean }>({
    uid: getAuth().currentUser?.uid ?? null,
    ready: false,
  });

  useEffect(() => {
    return onAuthStateChanged(getAuth(), (user) => {
      setState({ uid: user?.uid ?? null, ready: true });
    });
  }, []);

  return state;
}