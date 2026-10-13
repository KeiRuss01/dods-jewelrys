import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

import { firestore } from '../../firebaseConfig';
import type { Address, AddressInput } from '../types/checkout-types';

// Saved addresses live at users/{uid}/addresses/{addressId}, so they are
// reused across every checkout. Exactly one is marked is_default.
function addressCollection(uid: string) {
  return collection(firestore, 'users', uid, 'addresses');
}

export function subscribeToAddresses(
  uid: string,
  onAddresses: (addresses: Address[]) => void,
  onError: (error: Error) => void
) {
  return onSnapshot(
    addressCollection(uid),
    (snapshot) => {
      const rows = snapshot.docs.map((item) => {
        const data = item.data();
        const created = data.created_at as { toMillis?: () => number } | undefined;

        return {
          createdAt: created?.toMillis?.() ?? 0,
          address: {
            id: item.id,
            full_name: String(data.full_name ?? ''),
            phone: String(data.phone ?? ''),
            street: String(data.street ?? ''),
            city: String(data.city ?? ''),
            province: String(data.province ?? ''),
            postal_code: String(data.postal_code ?? ''),
            is_default: data.is_default === true,
          } as Address,
        };
      });

      onAddresses(
        rows
          .sort((a, b) => {
            if (a.address.is_default !== b.address.is_default) {
              return a.address.is_default ? -1 : 1;
            }
            return b.createdAt - a.createdAt;
          })
          .map((row) => row.address)
      );
    },
    (error) => onError(error)
  );
}

/** Creates or updates an address. Returns its id. */
export async function saveAddress(
  uid: string,
  input: AddressInput,
  options: { id?: string; makeDefault: boolean; hasExisting: boolean }
) {
  const col = addressCollection(uid);
  const ref = options.id ? doc(col, options.id) : doc(col);
  // The very first address is always the default
  const isDefault = options.makeDefault || !options.hasExisting;
  const batch = writeBatch(firestore);

  if (isDefault) {
    const snapshot = await getDocs(col);
    snapshot.docs.forEach((item) => {
      if (item.id !== ref.id && item.data().is_default === true) {
        batch.update(item.ref, { is_default: false });
      }
    });
  }

  batch.set(
    ref,
    {
      ...input,
      is_default: isDefault,
      updated_at: serverTimestamp(),
      ...(options.id ? {} : { created_at: serverTimestamp() }),
    },
    { merge: true }
  );

  await batch.commit();
  return ref.id;
}

export async function setDefaultAddress(uid: string, addressId: string) {
  const snapshot = await getDocs(addressCollection(uid));
  const batch = writeBatch(firestore);

  snapshot.docs.forEach((item) => {
    batch.update(item.ref, { is_default: item.id === addressId });
  });

  await batch.commit();
}

export async function deleteAddress(uid: string, addressId: string, wasDefault: boolean) {
  const col = addressCollection(uid);
  const batch = writeBatch(firestore);

  batch.delete(doc(col, addressId));

  if (wasDefault) {
    // Promote another saved address so there is still a default
    const snapshot = await getDocs(col);
    const next = snapshot.docs.find((item) => item.id !== addressId);
    if (next) {
      batch.update(next.ref, { is_default: true });
    }
  }

  await batch.commit();
}