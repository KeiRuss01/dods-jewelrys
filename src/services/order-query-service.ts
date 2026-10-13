import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

import { firestore } from '../../firebaseConfig';

export type CustomerOrderStatus =
  | 'pending'
  | 'processing'
  | 'ready_to_ship'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type OrderItem = {
  product_id: string;
  product_name: string;
  purity: string;
  material: string;
  size: string | null;
  quantity: number;
  unit_price: number;
  image_url: string | null;
};

export type OrderAddress = {
  full_name: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postal_code: string;
};

export type CustomerOrder = {
  id: string;
  order_number: string;
  user_id: string;
  items: OrderItem[];
  shipping_address: OrderAddress;
  payment_method: 'paypal' | 'cod';
  payment_status: string;
  status: CustomerOrderStatus;
  subtotal: number;
  shipping_fee: number;
  total: number;
  created_at: Date;
};

function convertDate(value: unknown) {
  if (
    value &&
    typeof (
      value as {
        toDate?: unknown;
      }
    ).toDate === 'function'
  ) {
    return (
      value as {
        toDate: () => Date;
      }
    ).toDate();
  }

  return new Date();
}

function createOrderNumber(
  documentId: string,
  createdAt: Date,
  storedNumber: unknown
) {
  if (
    typeof storedNumber === 'string' &&
    storedNumber.trim()
  ) {
    return storedNumber;
  }

  const shortId = documentId
    .slice(0, 6)
    .toUpperCase();

  return `ORD-${createdAt.getFullYear()}-${shortId}`;
}

function convertOrder(
  id: string,
  data: Record<string, unknown>
): CustomerOrder {
  const createdAt = convertDate(data.created_at);

  const rawItems = Array.isArray(data.items)
    ? data.items
    : [];

  const address =
    data.shipping_address &&
    typeof data.shipping_address === 'object'
      ? (data.shipping_address as Record<
          string,
          unknown
        >)
      : {};

  const items: OrderItem[] = rawItems.map(
    (rawItem) => {
      const item =
        rawItem &&
        typeof rawItem === 'object'
          ? (rawItem as Record<string, unknown>)
          : {};

      return {
        product_id: String(
          item.product_id ?? ''
        ),
        product_name: String(
          item.product_name ?? 'Jewelry Item'
        ),
        purity: String(item.purity ?? ''),
        material: String(item.material ?? ''),
        size:
          typeof item.size === 'string'
            ? item.size
            : null,
        quantity: Number(item.quantity ?? 1),
        unit_price: Number(item.unit_price ?? 0),
        image_url:
          typeof item.image_url === 'string' &&
          item.image_url
            ? item.image_url
            : null,
      };
    }
  );

  return {
    id,
    order_number: createOrderNumber(
      id,
      createdAt,
      data.order_number
    ),
    user_id: String(data.user_id ?? ''),
    items,
    shipping_address: {
      full_name: String(address.full_name ?? ''),
      phone: String(address.phone ?? ''),
      street: String(address.street ?? ''),
      city: String(address.city ?? ''),
      province: String(address.province ?? ''),
      postal_code: String(
        address.postal_code ?? ''
      ),
    },
    payment_method:
      data.payment_method === 'paypal'
        ? 'paypal'
        : 'cod',
    payment_status: String(
      data.payment_status ?? 'unpaid'
    ),
    status: String(
      data.status ?? 'pending'
    ) as CustomerOrderStatus,
    subtotal: Number(data.subtotal ?? 0),
    shipping_fee: Number(
      data.shipping_fee ?? 0
    ),
    total: Number(data.total ?? 0),
    created_at: createdAt,
  };
}

export function subscribeToCustomerOrders(
  uid: string,
  onOrders: (orders: CustomerOrder[]) => void,
  onError: (error: Error) => void
) {
  const ordersQuery = query(
    collection(firestore, 'orders'),
    where('user_id', '==', uid)
  );

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const orders = snapshot.docs.map(
        (item) =>
          convertOrder(
            item.id,
            item.data() as Record<string, unknown>
          )
      );

      orders.sort(
        (first, second) =>
          second.created_at.getTime() -
          first.created_at.getTime()
      );

      onOrders(orders);
    },
    (error) => onError(error)
  );
}

export function subscribeToOrder(
  orderId: string,
  onOrder: (
    order: CustomerOrder | null
  ) => void,
  onError: (error: Error) => void
) {
  return onSnapshot(
    doc(firestore, 'orders', orderId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onOrder(null);
        return;
      }

      onOrder(
        convertOrder(
          snapshot.id,
          snapshot.data() as Record<
            string,
            unknown
          >
        )
      );
    },
    (error) => onError(error)
  );
}
