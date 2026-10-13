import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { firestore } from '../../firebaseConfig';
import type { CartItem } from '../types/checkout-types';
import type { Product } from '../types/product';

// Cart lives at users/{uid}/cart/{itemId}. Only product_id, size and quantity
// are stored; name, image and price are always read from the live product.
function cartCollection(uid: string) {
  return collection(firestore, 'users', uid, 'cart');
}

export function cartItemId(productId: string, size: string | null) {
  return `${productId}__${size ? encodeURIComponent(size) : 'none'}`;
}

export function subscribeToCart(
  uid: string,
  onItems: (items: CartItem[]) => void,
  onError: (error: Error) => void
) {
  return onSnapshot(
    cartCollection(uid),
    (snapshot) => {
      const rows = snapshot.docs.map((item) => {
        const data = item.data();
        const added = data.added_at as { toMillis?: () => number } | undefined;

        return {
          addedAt: added?.toMillis?.() ?? 0,
          item: {
            id: item.id,
            product_id: String(data.product_id ?? ''),
            size: data.size ? String(data.size) : null,
            quantity: Number(data.quantity ?? 1),
          } as CartItem,
        };
      });

      onItems(rows.sort((a, b) => a.addedAt - b.addedAt).map((row) => row.item));
    },
    (error) => onError(error)
  );
}

/** Adds to the cart (merging with the same product + size). Returns the cart item id. */
export async function addToCart(
  uid: string,
  product: Product,
  size: string | null,
  quantity: number
) {
  const id = cartItemId(product.product_id, size);
  const ref = doc(cartCollection(uid), id);
  const existing = await getDoc(ref);
  const current = existing.exists() ? Number(existing.data().quantity ?? 0) : 0;
  const next = current + quantity;

  if (next > product.stock_quantity) {
    throw new Error(
      current > 0
        ? `You already have ${current} in your cart. Only ${product.stock_quantity} available.`
        : `Only ${product.stock_quantity} available.`
    );
  }

  if (existing.exists()) {
    await updateDoc(ref, { quantity: next, updated_at: serverTimestamp() });
  } else {
    await setDoc(ref, {
      product_id: product.product_id,
      size,
      quantity: next,
      added_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  }

  return id;
}

export async function setCartQuantity(uid: string, itemId: string, quantity: number) {
  await updateDoc(doc(cartCollection(uid), itemId), {
    quantity,
    updated_at: serverTimestamp(),
  });
}

export async function removeCartItem(uid: string, itemId: string) {
  await deleteDoc(doc(cartCollection(uid), itemId));
}