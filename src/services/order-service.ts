import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';

import { firestore } from '../../firebaseConfig';
import { calculateShipping } from '../lib/shipping';
import type { Address, CartItem, PaymentMethod } from '../types/checkout-types';

type PlaceOrderParams = {
  uid: string;
  items: CartItem[];
  address: Address;
  paymentMethod: PaymentMethod;
};

/**
 * Places an order in one transaction:
 *  - re-reads every product so the price and stock are the real, current ones
 *  - fails if anything is unavailable or short on stock
 *  - lowers stock, saves the order, and removes the ordered items from the cart
 */
export async function placeOrder({ uid, items, address, paymentMethod }: PlaceOrderParams) {
  if (items.length === 0) {
    throw new Error('Your cart is empty.');
  }

  return runTransaction(firestore, async (tx) => {
    const productIds = Array.from(new Set(items.map((item) => item.product_id)));
    const snapshots = await Promise.all(
      productIds.map((id) => tx.get(doc(firestore, 'products', id)))
    );
    const byId = new Map(snapshots.map((snap) => [snap.id, snap]));

    const demand = new Map<string, number>();
    for (const item of items) {
      demand.set(item.product_id, (demand.get(item.product_id) ?? 0) + item.quantity);
    }

    let subtotal = 0;
    const stockLeft = new Map<string, number>();

    const lines = items.map((item) => {
      const snap = byId.get(item.product_id);
      const data = snap?.data();

      if (!snap || !snap.exists() || !data || data.active === false) {
        throw new Error('An item in your cart is no longer available.');
      }

      const name = String(data.product_name ?? data.name ?? 'An item');
      const stock = Number(data.stock_quantity ?? data.stock ?? 0);
      const wanted = demand.get(item.product_id) ?? 0;

      if (wanted > stock) {
        throw new Error(`Only ${stock} of ${name} left in stock.`);
      }

      stockLeft.set(item.product_id, stock - wanted);

      const unitPrice = Number(data.price ?? 0);
      subtotal += unitPrice * item.quantity;

      return {
        product_id: item.product_id,
        product_name: name,
        purity: String(data.purity ?? ''),
        material: String(data.material ?? ''),
        size: item.size,
        quantity: item.quantity,
        unit_price: unitPrice,
        image_url: String(data.image_url ?? '') || null,
      };
    });

    const shippingFee = calculateShipping(subtotal, address);
    const orderRef = doc(collection(firestore, 'orders'));

    stockLeft.forEach((left, productId) => {
      tx.update(doc(firestore, 'products', productId), {
        stock_quantity: left,
        updated_at: serverTimestamp(),
      });
    });

    tx.set(orderRef, {
      user_id: uid,
      items: lines,
      shipping_address: {
        full_name: address.full_name,
        phone: address.phone,
        street: address.street,
        city: address.city,
        province: address.province,
        postal_code: address.postal_code,
      },
      payment_method: paymentMethod,
      payment_status: 'unpaid',
      status: 'pending',
      subtotal,
      shipping_fee: shippingFee,
      total: subtotal + shippingFee,
      created_at: serverTimestamp(),
    });

    items.forEach((item) => {
      tx.delete(doc(firestore, 'users', uid, 'cart', item.id));
    });

    return orderRef.id;
  });
}