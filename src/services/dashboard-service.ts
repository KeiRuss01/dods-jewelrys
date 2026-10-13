import {
  collection,
  getCountFromServer,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

import { firestore } from '../../firebaseConfig';
import { getProducts } from './product-service';

export type DashboardActivity = {
  id: string;
  kind: 'order' | 'repair';
  title: string;
  description: string;
  created_at: Date;
};

export type DashboardStats = {
  orders: number;
  active_orders: number;
  repairs: number;
  awaiting_repairs: number;
  ready_for_release: number;
  products: number;
  customers: number;
  low_stock: number;
  activities: DashboardActivity[];
};

function dateValue(value: unknown) {
  if (value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(0);
}

export function subscribeToDashboard(
  onStats: (stats: DashboardStats) => void,
  onError: (error: Error) => void
) {
  const data: DashboardStats = {
    orders: 0,
    active_orders: 0,
    repairs: 0,
    awaiting_repairs: 0,
    ready_for_release: 0,
    products: 0,
    customers: 0,
    low_stock: 0,
    activities: [],
  };
  let orderActivities: DashboardActivity[] = [];
  let repairActivities: DashboardActivity[] = [];

  function emit() {
    onStats({
      ...data,
      activities: [...orderActivities, ...repairActivities]
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        .slice(0, 5),
    });
  }

  const stopOrders = onSnapshot(collection(firestore, 'orders'), (snapshot) => {
    data.orders = snapshot.size;
    data.active_orders = snapshot.docs.filter((item) => {
      const status = String(item.data().status ?? 'pending');
      return status !== 'delivered' && status !== 'cancelled';
    }).length;
    orderActivities = snapshot.docs.map((item) => {
      const value = item.data();
      const number = String(value.order_number ?? item.id.slice(0, 8).toUpperCase());
      const status = String(value.status ?? 'pending').replaceAll('_', ' ');
      return {
        id: item.id,
        kind: 'order' as const,
        title: `Order ${number}`,
        description: `Status: ${status}`,
        created_at: dateValue(value.created_at),
      };
    });
    emit();
  }, onError);

  const stopRepairs = onSnapshot(collection(firestore, 'repairs'), (snapshot) => {
    data.repairs = snapshot.size;
    data.awaiting_repairs = snapshot.docs.filter((item) =>
      ['pending', 'in_progress'].includes(String(item.data().status ?? 'pending'))
    ).length;
    data.ready_for_release = snapshot.docs.filter((item) =>
      item.data().status === 'ready_for_release'
    ).length;
    repairActivities = snapshot.docs.map((item) => {
      const value = item.data();
      const number = String(value.repair_number ?? item.id.slice(0, 8).toUpperCase());
      const status = String(value.status ?? 'pending').replaceAll('_', ' ');
      return {
        id: item.id,
        kind: 'repair' as const,
        title: `Repair ${number}`,
        description: `${String(value.jewelry_type ?? 'Jewelry')} · ${status}`,
        created_at: dateValue(value.created_at),
      };
    });
    emit();
  }, onError);

  const stopProducts = onSnapshot(collection(firestore, 'products'), (snapshot) => {
    const activeProducts = snapshot.docs.filter((item) => item.data().active !== false);
    data.products = activeProducts.length;
    data.low_stock = activeProducts.filter((item) =>
      Number(item.data().stock_quantity ?? item.data().stock ?? 0) <= 3
    ).length;
    emit();
  }, onError);

  const stopCustomers = onSnapshot(
    query(collection(firestore, 'profiles'), where('role', '==', 'customer')),
    (snapshot) => {
      data.customers = snapshot.size;
      emit();
    },
    onError
  );

  return () => {
    stopOrders();
    stopRepairs();
    stopProducts();
    stopCustomers();
  };
}

async function collectionCount(name: string) {
  const result = await getCountFromServer(collection(firestore, name));
  return result.data().count;
}

export async function getDashboardStats() {
  const [orders, repairs, products, customers] = await Promise.all([
    collectionCount('orders'),
    collectionCount('repairs'),
    getProducts(),
    getCountFromServer(
      query(collection(firestore, 'profiles'), where('role', '==', 'customer'))
    ).then((result) => result.data().count),
  ]);

  return {
    orders,
    repairs,
    products: products.length,
    customers,
    low_stock: products.filter((product) => product.stock_quantity <= 3).length,
  };
}
