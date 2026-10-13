import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminHeader } from '../../../../components/admin-header';
import {
  type AdminOrder,
  subscribeToAdminOrders,
} from '../../../../services/admin-operations-service';
type Filter = 'all' | 'processing' | 'ready_to_ship' | 'delivered';
const STATUS: Record<string, string> = {
  pending: 'Pending', processing: 'Processing', ready_to_ship: 'Ready to Ship',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
};

function money(value: number) {
  return `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => subscribeToAdminOrders(
    (data) => { setOrders(data); setLoading(false); },
    (error) => { setLoading(false); Alert.alert('Unable to Load Orders', error.message); }
  ), []);

  const counts = useMemo(() => ({
    all: orders.length,
    processing: orders.filter((order) => order.status === 'processing').length,
    ready_to_ship: orders.filter((order) => order.status === 'ready_to_ship').length,
    delivered: orders.filter((order) => order.status === 'delivered').length,
  }), [orders]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (filter !== 'all' && order.status !== filter) return false;
      if (!term) return true;
      return [order.order_number, order.customer_name, ...order.items.map((item) => item.product_name)]
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [filter, orders, search]);

  const filterItems: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'processing', label: 'Processing' },
    { key: 'ready_to_ship', label: 'Ready' }, { key: 'delivered', label: 'Delivered' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.page}>
        <AdminHeader />
        <Text style={styles.heading}>Orders</Text>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search order ID or customer"
            placeholderTextColor="#999"
            style={styles.searchInput}
          />
        </View>

        <View style={styles.stats}>
          {filterItems.map((item) => (
            <Pressable key={item.key} onPress={() => setFilter(item.key)} style={styles.stat}>
              <Text style={[styles.statLabel, filter === item.key && styles.statActive]}>{item.label}</Text>
              <Text style={[styles.statValue, filter === item.key && styles.statActive]}>{counts[item.key]}</Text>
            </Pressable>
          ))}
        </View>

        {loading ? <ActivityIndicator color="#C58D24" style={styles.loader} /> : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {visible.length === 0 ? <Text style={styles.empty}>No orders found.</Text> : visible.map((order) => (
              <Pressable
                key={order.id}
                style={styles.card}
                onPress={() => router.push({ pathname: '/admin/orders/[id]', params: { id: order.id } })}
              >
                <View style={styles.rowBetween}>
                  <Text style={styles.number}>{order.order_number}</Text>
                  <Text style={styles.status}>{STATUS[order.status] ?? order.status}</Text>
                </View>
                <Text style={styles.itemName} numberOfLines={1}>
                  {order.items[0]?.product_name ?? 'Jewelry Order'}
                  {order.items.length > 1 ? ` +${order.items.length - 1}` : ''}
                </Text>
                <Text style={styles.customer}>{order.customer_name}</Text>
                <View style={[styles.rowBetween, styles.cardBottom]}>
                  <Text style={styles.total}>{money(order.total)}</Text>
                  <Text style={styles.link}>View Details ›</Text>
                </View>
              </Pressable>
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
  heading: { fontSize: 28, fontWeight: '800', color: '#19191B', marginTop: 20 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DED4C5', borderRadius: 24, height: 48, paddingHorizontal: 15, marginTop: 24 },
  searchIcon: { fontSize: 20, color: '#777', marginRight: 8 },
  searchInput: { flex: 1, fontSize: 13, color: '#19191B' },
  stats: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 },
  stat: { minWidth: 55 },
  statLabel: { fontSize: 11, color: '#777' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#19191B', marginTop: 4 },
  statActive: { color: '#C58D24' },
  loader: { marginTop: 45 },
  list: { gap: 12, paddingBottom: 30 },
  empty: { textAlign: 'center', color: '#777', marginTop: 45 },
  card: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DED4C5', borderRadius: 18, padding: 16 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  number: { fontSize: 12, fontWeight: '700', color: '#19191B' },
  status: { fontSize: 11, color: '#A46E09' },
  itemName: { fontSize: 16, fontWeight: '700', color: '#19191B', marginTop: 13 },
  customer: { fontSize: 12, color: '#777', marginTop: 5 },
  cardBottom: { marginTop: 15 },
  total: { fontSize: 16, fontWeight: '800', color: '#19191B' },
  link: { fontSize: 12, color: '#C58D24', fontWeight: '600' },
});