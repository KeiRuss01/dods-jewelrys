import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AdminHeader } from '../../../../components/admin-header';
import {
  type AdminOrder,
  subscribeToAdminOrder,
  updateAdminOrderPaymentStatus,
  updateAdminOrderStatus,
} from '../../../../services/admin-operations-service';
import type { CustomerOrderStatus } from '../../../../services/order-query-service';

const STATUS: Record<string, string> = {
  pending: 'Pending', processing: 'Processing', ready_to_ship: 'Ready to Ship',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
};
const STATUS_OPTIONS: CustomerOrderStatus[] = [
  'pending', 'processing', 'ready_to_ship', 'shipped', 'delivered', 'cancelled',
];

function money(value: number) {
  return `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

export default function AdminOrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    return subscribeToAdminOrder(
      id,
      (value) => { setOrder(value); setLoading(false); },
      (error) => { setLoading(false); Alert.alert('Unable to Load Order', error.message); }
    );
  }, [id]);

  async function changeStatus(status: CustomerOrderStatus) {
    if (!order || saving || status === order.status) return;
    setSaving(true);
    try {
      await updateAdminOrderStatus(order.id, status);
      Alert.alert('Status Updated', `Order status is now ${STATUS[status]}.`);
    } catch (error) {
      Alert.alert('Unable to Update Status', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function changePaymentStatus(status: string) {
    if (!order || saving || status === order.payment_status) return;
    setSaving(true);
    try {
      await updateAdminOrderPaymentStatus(order.id, status);
      Alert.alert('Payment Updated', `Payment status is now ${status}.`);
    } catch (error) {
      Alert.alert('Unable to Update Payment', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <SafeAreaView style={styles.safe}><ActivityIndicator color="#C58D24" style={styles.loader} /></SafeAreaView>;
  if (!order) return <SafeAreaView style={styles.safe}><View style={styles.page}><AdminHeader title="Orders" showBack /><Text style={styles.empty}>Order record not found.</Text></View></SafeAreaView>;

  const address = order.shipping_address;
  const addressText = [address.street, address.city, address.province, address.postal_code].filter(Boolean).join(', ');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <AdminHeader title="Orders" showBack />
        <Text style={styles.heading}>Order Details</Text>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View><Text style={styles.smallLabel}>ORDER ID</Text><Text style={styles.orderNumber}>{order.order_number}</Text></View>
            <Text style={styles.statusBadge}>{STATUS[order.status] ?? order.status}</Text>
          </View>
          <InfoRow label="Order Date" value={order.created_at.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })} />
          <InfoRow label="Payment Method" value={order.payment_method === 'paypal' ? 'PayPal' : 'Cash on Delivery'} />
          <InfoRow label="Payment Status" value={order.payment_status} last />
        </View>

        <Text style={styles.sectionHeading}>Items</Text>
        <View style={styles.card}>
          {order.items.map((item, index) => (
            <View key={`${item.product_id}-${index}`} style={[styles.itemRow, index === order.items.length - 1 && styles.lastItem]}>
              {item.image_url ? <Image source={{ uri: item.image_url }} style={styles.itemImage} /> : <View style={styles.itemImage}><Text style={styles.placeholder}>No image</Text></View>}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                <Text style={styles.itemMeta}>{[item.purity, item.material, item.size].filter(Boolean).join(' · ') || 'Jewelry item'}</Text>
                <Text style={styles.itemMeta}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>{money(item.unit_price * item.quantity)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionHeading}>Customer & Delivery</Text>
        <View style={styles.card}>
          <InfoRow label="Customer" value={order.customer_name} />
          <InfoRow label="Email" value={order.customer_email || 'Not provided'} />
          <InfoRow label="Phone" value={address.phone || 'Not provided'} />
          <InfoRow label="Address" value={addressText || 'Not provided'} last />
        </View>

        <Text style={styles.sectionHeading}>Payment Summary</Text>
        <View style={styles.card}>
          <InfoRow label="Subtotal" value={money(order.subtotal)} />
          <InfoRow label="Shipping" value={money(order.shipping_fee)} />
          <InfoRow label="Total" value={money(order.total)} last strong />
        </View>

        <Text style={styles.sectionHeading}>Update Order Status</Text>
        <View style={styles.card}>
          <View style={styles.options}>
            {STATUS_OPTIONS.map((status) => (
              <Pressable
                key={status}
                disabled={saving}
                onPress={() => changeStatus(status)}
                style={[styles.option, order.status === status && styles.optionActive]}
              >
                <Text style={[styles.optionText, order.status === status && styles.optionTextActive]}>{STATUS[status]}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={styles.sectionHeading}>Update Payment</Text>
        <View style={styles.card}>
          <View style={styles.options}>
            {['unpaid', 'paid', 'refunded'].map((status) => (
              <Pressable
                key={status}
                disabled={saving}
                onPress={() => changePaymentStatus(status)}
                style={[styles.option, order.payment_status === status && styles.optionActive]}
              >
                <Text style={[styles.optionText, order.payment_status === status && styles.optionTextActive]}>{status}</Text>
              </Pressable>
            ))}
          </View>
          {saving ? <ActivityIndicator color="#C58D24" style={{ marginTop: 12 }} /> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, last = false, strong = false }: { label: string; value: string; last?: boolean; strong?: boolean }) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, strong && styles.strong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF8F2' },
  page: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36 },
  loader: { marginTop: 100 },
  empty: { textAlign: 'center', color: '#777', marginTop: 70 },
  heading: { fontSize: 27, fontWeight: '800', color: '#19191B', marginVertical: 10 },
  sectionHeading: { fontSize: 17, fontWeight: '800', color: '#19191B', marginTop: 7, marginBottom: 8 },
  card: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DED4C5', borderRadius: 18, padding: 14, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  smallLabel: { fontSize: 10, fontWeight: '700', color: '#777' },
  orderNumber: { fontSize: 15, fontWeight: '800', color: '#19191B', marginTop: 3 },
  statusBadge: { color: '#A46E09', fontSize: 12, fontWeight: '700' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E8C98E' },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { flex: 1, color: '#555', fontSize: 13 },
  infoValue: { flex: 1.5, textAlign: 'right', color: '#19191B', fontSize: 13, textTransform: 'capitalize' },
  strong: { fontWeight: '800', fontSize: 15 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#EEE5D7' },
  lastItem: { borderBottomWidth: 0 },
  itemImage: { width: 64, height: 64, borderRadius: 14, backgroundColor: '#E1E1E1', alignItems: 'center', justifyContent: 'center' },
  placeholder: { color: '#999', fontSize: 9, textAlign: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#19191B' },
  itemMeta: { fontSize: 11, color: '#777', marginTop: 3 },
  itemPrice: { fontSize: 13, fontWeight: '700', color: '#19191B' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderWidth: 1, borderColor: '#C58D24', borderRadius: 20, paddingVertical: 9, paddingHorizontal: 13 },
  optionActive: { backgroundColor: '#19191B', borderColor: '#19191B' },
  optionText: { color: '#9C6B0A', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  optionTextActive: { color: '#FFF' },
});
