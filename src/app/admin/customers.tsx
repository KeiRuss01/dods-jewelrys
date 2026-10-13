import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  type AdminCustomer,
  subscribeToAdminCustomers,
} from '../../services/admin-customer-service';

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'C';
}

export default function AdminCustomersScreen() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => subscribeToAdminCustomers(
    (data) => { setCustomers(data); setLoading(false); },
    (error) => { setLoading(false); Alert.alert('Unable to Load Customers', error.message); }
  ), []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((customer) =>
      [customer.full_name, customer.email, customer.mobile_number]
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [customers, search]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.back}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Customers</Text>
          <Text style={styles.count}>{customers.length}</Text>
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, email, or mobile"
          placeholderTextColor="#999"
          style={styles.search}
        />

        {loading ? <ActivityIndicator color="#C58D24" style={styles.loader} /> : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {visible.length === 0 ? <Text style={styles.empty}>No customers found.</Text> : visible.map((customer) => (
              <View key={customer.id} style={styles.card}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{initials(customer.full_name)}</Text></View>
                <View style={styles.customerInfo}>
                  <Text style={styles.name}>{customer.full_name}</Text>
                  <Text style={styles.detail}>{customer.email || 'No email'}</Text>
                  <Text style={styles.detail}>{customer.mobile_number || 'No mobile number'}</Text>
                  {customer.address || customer.city_province ? (
                    <Text style={styles.address}>{[customer.address, customer.city_province].filter(Boolean).join(', ')}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF8F2' },
  page: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  header: { height: 52, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 42 },
  back: { fontSize: 42, lineHeight: 42, color: '#19191B' },
  headerTitle: { flex: 1, fontSize: 24, fontWeight: '800', color: '#19191B' },
  count: { minWidth: 34, textAlign: 'center', color: '#A46E09', fontWeight: '700' },
  search: { height: 48, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DED8CC', borderRadius: 24, paddingHorizontal: 17, fontSize: 13, color: '#19191B', marginTop: 14 },
  loader: { marginTop: 70 },
  list: { paddingVertical: 20, paddingBottom: 40, gap: 11 },
  empty: { textAlign: 'center', color: '#777', marginTop: 50 },
  card: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DED8CC', borderRadius: 17, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 13 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#19191B', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  customerInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#19191B' },
  detail: { fontSize: 11, color: '#777', marginTop: 3 },
  address: { fontSize: 10, color: '#A46E09', marginTop: 5 },
});
