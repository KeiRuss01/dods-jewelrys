import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import { firestore } from '../../firebaseConfig';
import { prepareRepairForRelease } from './claim-service';
import type {
  CustomerOrder,
  CustomerOrderStatus,
  OrderAddress,
  OrderItem,
} from './order-query-service';
import type { RepairRequest, RepairStatus } from './repair-service';

export type AdminRepair = RepairRequest & {
  customer_name: string;
  customer_email: string;
  estimated_completion: Date | null;
  quotation_amount: number | null;
  custody_notes: string;
  payment_status: string;
  claim_code: string | null;
};

export type AdminOrder = CustomerOrder & {
  customer_name: string;
  customer_email: string;
};

type Profile = { full_name: string; email: string };

function toDate(value: unknown, fallback: Date | null = null) {
  if (value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return fallback;
}

async function getProfiles(userIds: string[]) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  const entries = await Promise.all(
    uniqueIds.map(async (uid) => {
      const snapshot = await getDoc(doc(firestore, 'profiles', uid));
      const data = snapshot.data();
      return [
        uid,
        {
          full_name: String(data?.full_name ?? 'Unknown Customer'),
          email: String(data?.email ?? ''),
        },
      ] as const;
    })
  );
  return new Map<string, Profile>(entries);
}

function convertRepair(
  id: string,
  data: Record<string, unknown>,
  profile?: Profile
): AdminRepair {
  return {
    id,
    repair_number: String(data.repair_number ?? id.slice(0, 8).toUpperCase()),
    user_id: String(data.user_id ?? ''),
    service_type: String(data.service_type ?? ''),
    jewelry_type: String(data.jewelry_type ?? 'Jewelry Item'),
    issue_description: String(data.issue_description ?? ''),
    damage_photo_url: typeof data.damage_photo_url === 'string' ? data.damage_photo_url : null,
    damage_photo_path: typeof data.damage_photo_path === 'string' ? data.damage_photo_path : null,
    preferred_date: toDate(data.preferred_date, new Date()) ?? new Date(),
    preferred_time: String(data.preferred_time ?? ''),
    status: String(data.status ?? 'pending') as RepairStatus,
    estimated_cost: typeof data.estimated_cost === 'number' ? data.estimated_cost : null,
    deposit: Number(data.deposit ?? 0),
    balance: typeof data.balance === 'number' ? data.balance : null,
    created_at: toDate(data.created_at, new Date()) ?? new Date(),
    customer_name: profile?.full_name ?? 'Unknown Customer',
    customer_email: profile?.email ?? '',
    estimated_completion: toDate(data.estimated_completion),
    quotation_amount: typeof data.quotation_amount === 'number'
      ? data.quotation_amount
      : typeof data.estimated_cost === 'number'
        ? data.estimated_cost
        : null,
    custody_notes: String(data.custody_notes ?? ''),
    payment_status: String(data.payment_status ?? 'unpaid'),
    claim_code: typeof data.claim_code === 'string' ? data.claim_code : null,
  };
}

function convertOrder(
  id: string,
  data: Record<string, unknown>,
  profile?: Profile
): AdminOrder {
  const createdAt = toDate(data.created_at, new Date()) ?? new Date();
  const rawAddress = data.shipping_address && typeof data.shipping_address === 'object'
    ? data.shipping_address as Record<string, unknown>
    : {};
  const shippingAddress: OrderAddress = {
    full_name: String(rawAddress.full_name ?? ''),
    phone: String(rawAddress.phone ?? ''),
    street: String(rawAddress.street ?? ''),
    city: String(rawAddress.city ?? ''),
    province: String(rawAddress.province ?? ''),
    postal_code: String(rawAddress.postal_code ?? ''),
  };
  const items: OrderItem[] = (Array.isArray(data.items) ? data.items : []).map((value) => {
    const item = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    return {
      product_id: String(item.product_id ?? ''),
      product_name: String(item.product_name ?? 'Jewelry Item'),
      purity: String(item.purity ?? ''),
      material: String(item.material ?? ''),
      size: typeof item.size === 'string' ? item.size : null,
      quantity: Number(item.quantity ?? 1),
      unit_price: Number(item.unit_price ?? 0),
      image_url: typeof item.image_url === 'string' ? item.image_url : null,
    };
  });
  const storedNumber = typeof data.order_number === 'string' && data.order_number.trim()
    ? data.order_number
    : `ORD-${createdAt.getFullYear()}-${id.slice(0, 6).toUpperCase()}`;

  return {
    id,
    order_number: storedNumber,
    user_id: String(data.user_id ?? ''),
    items,
    shipping_address: shippingAddress,
    payment_method: data.payment_method === 'paypal' ? 'paypal' : 'cod',
    payment_status: String(data.payment_status ?? 'unpaid'),
    status: String(data.status ?? 'pending') as CustomerOrderStatus,
    subtotal: Number(data.subtotal ?? 0),
    shipping_fee: Number(data.shipping_fee ?? 0),
    total: Number(data.total ?? 0),
    created_at: createdAt,
    customer_name: profile?.full_name || shippingAddress.full_name || 'Unknown Customer',
    customer_email: profile?.email ?? '',
  };
}

export function subscribeToAdminRepairs(
  onRepairs: (repairs: AdminRepair[]) => void,
  onError: (error: Error) => void
) {
  return onSnapshot(collection(firestore, 'repairs'), async (snapshot) => {
    try {
      const rows = snapshot.docs.map((item) => ({
        id: item.id,
        data: item.data() as Record<string, unknown>,
      }));
      const profiles = await getProfiles(rows.map(({ data }) => String(data.user_id ?? '')));
      const repairs = rows.map(({ id, data }) =>
        convertRepair(id, data, profiles.get(String(data.user_id ?? '')))
      );
      repairs.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
      onRepairs(repairs);
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unable to load repairs.'));
    }
  }, onError);
}

export function subscribeToAdminRepair(
  repairId: string,
  onRepair: (repair: AdminRepair | null) => void,
  onError: (error: Error) => void
) {
  return onSnapshot(doc(firestore, 'repairs', repairId), async (snapshot) => {
    try {
      if (!snapshot.exists()) return onRepair(null);
      const data = snapshot.data() as Record<string, unknown>;
      const profiles = await getProfiles([String(data.user_id ?? '')]);
      onRepair(convertRepair(snapshot.id, data, profiles.get(String(data.user_id ?? ''))));
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unable to load repair.'));
    }
  }, onError);
}

export function subscribeToAdminOrders(
  onOrders: (orders: AdminOrder[]) => void,
  onError: (error: Error) => void
) {
  return onSnapshot(collection(firestore, 'orders'), async (snapshot) => {
    try {
      const rows = snapshot.docs.map((item) => ({
        id: item.id,
        data: item.data() as Record<string, unknown>,
      }));
      const profiles = await getProfiles(rows.map(({ data }) => String(data.user_id ?? '')));
      const orders = rows.map(({ id, data }) =>
        convertOrder(id, data, profiles.get(String(data.user_id ?? '')))
      );
      orders.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
      onOrders(orders);
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unable to load orders.'));
    }
  }, onError);
}

export function subscribeToAdminOrder(
  orderId: string,
  onOrder: (order: AdminOrder | null) => void,
  onError: (error: Error) => void
) {
  return onSnapshot(doc(firestore, 'orders', orderId), async (snapshot) => {
    try {
      if (!snapshot.exists()) return onOrder(null);
      const data = snapshot.data() as Record<string, unknown>;
      const profiles = await getProfiles([String(data.user_id ?? '')]);
      onOrder(convertOrder(snapshot.id, data, profiles.get(String(data.user_id ?? ''))));
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unable to load order.'));
    }
  }, onError);
}

export async function updateAdminRepairStatus(repairId: string, status: RepairStatus) {
  if (status === 'ready_for_release') {
    return prepareRepairForRelease(repairId);
  }
  await updateDoc(doc(firestore, 'repairs', repairId), {
    status,
    updated_at: serverTimestamp(),
  });
  return null;
}

export async function updateAdminOrderStatus(orderId: string, status: CustomerOrderStatus) {
  await updateDoc(doc(firestore, 'orders', orderId), {
    status,
    updated_at: serverTimestamp(),
  });
}

export async function updateAdminOrderPaymentStatus(orderId: string, paymentStatus: string) {
  await updateDoc(doc(firestore, 'orders', orderId), {
    payment_status: paymentStatus,
    updated_at: serverTimestamp(),
  });
}
