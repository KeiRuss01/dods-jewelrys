import { collection, onSnapshot, query, where } from 'firebase/firestore';

import { firestore } from '../../firebaseConfig';

export type AdminCustomer = {
  id: string;
  full_name: string;
  email: string;
  mobile_number: string;
  address: string;
  city_province: string;
};

export function subscribeToAdminCustomers(
  onCustomers: (customers: AdminCustomer[]) => void,
  onError: (error: Error) => void
) {
  return onSnapshot(
    query(collection(firestore, 'profiles'), where('role', '==', 'customer')),
    (snapshot) => {
      const customers = snapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          full_name: String(data.full_name ?? 'Customer'),
          email: String(data.email ?? ''),
          mobile_number: String(data.mobile_number ?? ''),
          address: String(data.address ?? ''),
          city_province: String(data.city_province ?? data.city ?? ''),
        };
      });
      customers.sort((a, b) => a.full_name.localeCompare(b.full_name));
      onCustomers(customers);
    },
    onError
  );
}
