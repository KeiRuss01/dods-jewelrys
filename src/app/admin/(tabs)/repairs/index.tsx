import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminHeader } from '../../../../components/admin-header';
import {
  type AdminRepair,
  subscribeToAdminRepairs,
} from '../../../../services/admin-operations-service';

type Filter = 'all' | 'pending' | 'in_progress' | 'ready_for_release';

const STATUS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  ready_for_release: 'Ready for Release',
  claimed: 'Claimed',
  cancelled: 'Cancelled',
};

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'ready_for_release', label: 'Ready' },
];

function dateText(date: Date | null) {
  return date
    ? date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Not set';
}

export default function AdminRepairsScreen() {
  const [repairs, setRepairs] = useState<AdminRepair[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => subscribeToAdminRepairs(
    (data) => { setRepairs(data); setLoading(false); },
    (error) => { setLoading(false); Alert.alert('Unable to Load Repairs', error.message); }
  ), []);

  const visible = useMemo(
    () => filter === 'all' ? repairs : repairs.filter((repair) => repair.status === filter),
    [filter, repairs]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.page}>
        <AdminHeader />
        <Text style={styles.heading}>Repairs</Text>

        <View style={styles.filters}>
          {FILTERS.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => setFilter(item.key)}
              style={[styles.filter, filter === item.key && styles.filterActive]}
            >
              <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? <ActivityIndicator color="#C58D24" style={styles.loader} /> : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {visible.length === 0 ? (
              <Text style={styles.empty}>No repairs match this filter.</Text>
            ) : visible.map((repair) => (
              <Pressable
                key={repair.id}
                style={styles.card}
                onPress={() => router.push({ pathname: '/admin/repairs/[id]', params: { id: repair.id } })}
              >
                <View style={styles.rowBetween}>
                  <Text style={styles.number}>{repair.repair_number}</Text>
                  <Text style={styles.status}>{STATUS[repair.status] ?? repair.status}</Text>
                </View>
                <Text style={styles.itemName}>{repair.jewelry_type}</Text>
                <Text style={styles.service}>{repair.service_type} · {repair.customer_name}</Text>
                <View style={[styles.rowBetween, styles.cardBottom]}>
                  <View>
                    <Text style={styles.muted}>Estimated completion</Text>
                    <Text style={styles.date}>{dateText(repair.estimated_completion ?? repair.preferred_date)}</Text>
                  </View>
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
  filters: { flexDirection: 'row', gap: 8, marginTop: 22, marginBottom: 10 },
  filter: { borderWidth: 1, borderColor: '#DED4C5', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#FFF' },
  filterActive: { backgroundColor: '#000', borderColor: '#000' },
  filterText: { fontSize: 12, color: '#19191B' },
  filterTextActive: { color: '#FFF', fontWeight: '700' },
  loader: { marginTop: 60 },
  list: { paddingVertical: 8, paddingBottom: 30, gap: 12 },
  empty: { textAlign: 'center', color: '#777', marginTop: 50 },
  card: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DED4C5', borderRadius: 18, padding: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  number: { fontSize: 12, fontWeight: '700', color: '#19191B' },
  status: { fontSize: 11, color: '#A46E09' },
  itemName: { fontSize: 17, fontWeight: '700', color: '#19191B', marginTop: 13 },
  service: { fontSize: 12, color: '#777', marginTop: 5 },
  cardBottom: { marginTop: 16 },
  muted: { fontSize: 11, color: '#8A8A8A' },
  date: { fontSize: 12, fontWeight: '600', marginTop: 3, color: '#19191B' },
  link: { fontSize: 12, color: '#C58D24', fontWeight: '600' },
});