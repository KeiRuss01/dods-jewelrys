export type CartItem = {
  /** Firestore doc id: `${product_id}__${size or 'none'}` */
  id: string;
  product_id: string;
  size: string | null;
  quantity: number;
};

export type AddressInput = {
  full_name: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postal_code: string;
};

export type Address = AddressInput & {
  id: string;
  is_default: boolean;
};

export type PaymentMethod = 'paypal' | 'cod';