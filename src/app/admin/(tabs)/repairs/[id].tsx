import { useLocalSearchParams } from 'expo-router';
import { type ReactNode, useEffect, useState } from 'react';
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
  type AdminRepair,
  subscribeToAdminRepair,
  updateAdminRepairStatus,
} from '../../../../services/admin-operations-service';
import type { RepairStatus } from '../../../../services/repair-service';

const STATUS: Record<string, string> = {
  pending: 'Pending', in_progress: 'In Progress', completed: 'Completed',
  ready_for_release: 'Ready for Release', claimed: 'Claimed', cancelled: 'Cancelled',
};
const STATUS_OPTIONS: RepairStatus[] = [
  'pending', 'in_progress', 'completed', 'ready_for_release', 'cancelled',
];

function money(value: number | null) {
  return value === null ? 'Not set' : `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

function dateText(date: Date | null) {
  return date ? date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set';
}

export default function AdminRepairDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [repair, setRepair] = useState<AdminRepair | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    return subscribeToAdminRepair(
      id,
      (value) => { setRepair(value); setLoading(false); },
      (error) => { setLoading(false); Alert.alert('Unable to Load Repair', error.message); }
    );
  }, [id]);

  async function changeStatus(status: RepairStatus) {
    if (!repair || saving || repair.status === status) return;
    setSaving(true);
    try {
      const claimCode = await updateAdminRepairStatus(repair.id, status);
      setExpanded(null);
      Alert.alert(
        'Status Updated',
        claimCode
          ? `The repair is ready for release. Claim code: ${claimCode}`
          : `Repair status is now ${STATUS[status]}.`
      );
    } catch (error) {
      Alert.alert('Unable to Update Status', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <SafeAreaView style={styles.safe}><ActivityIndicator color="#C58D24" style={styles.loader} /></SafeAreaView>;
  }

  if (!repair) {
    return <SafeAreaView style={styles.safe}><View style={styles.page}><AdminHeader title="Repair" showBack /><Text style={styles.empty}>Repair record not found.</Text></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <AdminHeader title="Repair" showBack />
        <Text style={styles.heading}>Track Details</Text>

        <View style={styles.card}>
          <View style={styles.hero}>
            {repair.damage_photo_url ? (
              <Image source={{ uri: repair.damage_photo_url }} style={styles.heroImage} />
            ) : <View style={styles.heroImage}><Text style={styles.placeholder}>No photo</Text></View>}
            <View style={styles.heroInfo}>
              <Text style={styles.itemName}>{repair.jewelry_type}</Text>
              <Text style={styles.number}>{repair.repair_number}</Text>
              <Text style={styles.status}>{STATUS[repair.status] ?? repair.status}</Text>
            </View>
          </View>
          <InfoRow label="Customer" value={repair.customer_name} />
          <InfoRow label="Service" value={repair.service_type} />
          <InfoRow label="Appointment Date" value={`${dateText(repair.preferred_date)} ${repair.preferred_time}`} />
          <InfoRow label="Est. Completion" value={dateText(repair.estimated_completion)} last />
        </View>

        <View style={[styles.card, styles.concernCard]}>
          <View style={styles.concernText}>
            <Text style={styles.sectionTitle}>Customer Concern</Text>
            <Text style={styles.body}>{repair.issue_description || 'No concern was provided.'}</Text>
          </View>
          {repair.damage_photo_url ? (
            <Image source={{ uri: repair.damage_photo_url }} style={styles.damagePhoto} />
          ) : <View style={styles.damagePhoto}><Text style={styles.placeholder}>No damage photo</Text></View>}
        </View>

        <DetailSection
          title="Quotation"
          expanded={expanded === 'quotation'}
          onPress={() => setExpanded(expanded === 'quotation' ? null : 'quotation')}
        >
          <InfoRow label="Estimated Cost" value={money(repair.quotation_amount)} last />
        </DetailSection>

        <DetailSection
          title="Item Custody Record"
          expanded={expanded === 'custody'}
          onPress={() => setExpanded(expanded === 'custody' ? null : 'custody')}
        >
          <Text style={styles.body}>{repair.custody_notes || 'No custody notes recorded.'}</Text>
        </DetailSection>

        <DetailSection
          title="Update Repair Status"
          expanded={expanded === 'status'}
          onPress={() => setExpanded(expanded === 'status' ? null : 'status')}
        >
          <View style={styles.statusOptions}>
            {STATUS_OPTIONS.map((status) => (
              <Pressable
                key={status}
                disabled={saving}
                onPress={() => changeStatus(status)}
                style={[styles.statusButton, repair.status === status && styles.statusButtonActive]}
              >
                <Text style={[styles.statusButtonText, repair.status === status && styles.statusButtonTextActive]}>
                  {STATUS[status]}
                </Text>
              </Pressable>
            ))}
          </View>
          {saving ? <ActivityIndicator color="#C58D24" /> : null}
        </DetailSection>

        <DetailSection
          title="Payment Info"
          expanded={expanded === 'payment'}
          onPress={() => setExpanded(expanded === 'payment' ? null : 'payment')}
        >
          <InfoRow label="Payment Status" value={repair.payment_status} />
          <InfoRow label="Deposit" value={money(repair.deposit)} />
          <InfoRow label="Balance" value={money(repair.balance)} last />
        </DetailSection>

        <DetailSection
          title="Release / Claim Item"
          expanded={expanded === 'release'}
          onPress={() => setExpanded(expanded === 'release' ? null : 'release')}
        >
          {repair.claim_code ? (
            <><Text style={styles.smallLabel}>CUSTOMER CLAIM CODE</Text><Text selectable style={styles.claimCode}>{repair.claim_code}</Text></>
          ) : (
            <>
              <Text style={styles.body}>Mark this repair Ready for Release to generate its claim code.</Text>
              <Pressable style={styles.releaseButton} onPress={() => changeStatus('ready_for_release')}>
                <Text style={styles.releaseButtonText}>Prepare for Release</Text>
              </Pressable>
            </>
          )}
        </DetailSection>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return <View style={[styles.infoRow, last && styles.infoRowLast]}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

function DetailSection({ title, expanded, onPress, children }: { title: string; expanded: boolean; onPress: () => void; children: ReactNode }) {
  return (
    <View style={styles.detailSection}>
      <Pressable style={styles.detailHeader} onPress={onPress}>
        <Text style={styles.detailTitle}>{title}</Text><Text style={styles.chevron}>{expanded ? '⌄' : '›'}</Text>
      </Pressable>
      {expanded ? <View style={styles.detailBody}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF8F2' },
  page: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 35 },
  loader: { marginTop: 100 },
  empty: { textAlign: 'center', color: '#777', marginTop: 70 },
  heading: { fontSize: 27, fontWeight: '800', color: '#19191B', marginVertical: 10 },
  card: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DED4C5', borderRadius: 18, padding: 14, marginBottom: 12 },
  hero: { flexDirection: 'row', gap: 14, marginBottom: 10 },
  heroImage: { width: 96, height: 82, borderRadius: 16, backgroundColor: '#E1E1E1', alignItems: 'center', justifyContent: 'center' },
  heroInfo: { flex: 1, justifyContent: 'center' },
  itemName: { fontSize: 17, fontWeight: '700', color: '#19191B' },
  number: { fontSize: 12, color: '#555', marginTop: 4 },
  status: { color: '#A46E09', marginTop: 14, fontSize: 12, fontWeight: '600' },
  placeholder: { textAlign: 'center', color: '#999', fontSize: 11, padding: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E8C98E' },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { fontSize: 13, fontWeight: '600', color: '#19191B', flex: 1 },
  infoValue: { fontSize: 13, color: '#19191B', flex: 1.35, textAlign: 'right', textTransform: 'capitalize' },
  concernCard: { flexDirection: 'row', gap: 12 },
  concernText: { flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6, color: '#19191B' },
  body: { fontSize: 13, color: '#444', lineHeight: 19 },
  damagePhoto: { width: 120, height: 100, borderRadius: 16, backgroundColor: '#E1E1E1', alignItems: 'center', justifyContent: 'center' },
  detailSection: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DED4C5', borderRadius: 16, marginBottom: 10, overflow: 'hidden' },
  detailHeader: { minHeight: 48, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailTitle: { fontSize: 14, fontWeight: '700', color: '#19191B' },
  chevron: { fontSize: 30, lineHeight: 30, color: '#19191B' },
  detailBody: { borderTopWidth: 1, borderTopColor: '#EEE5D7', padding: 14 },
  statusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusButton: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 18, borderWidth: 1, borderColor: '#C58D24' },
  statusButtonActive: { backgroundColor: '#19191B', borderColor: '#19191B' },
  statusButtonText: { color: '#9C6B0A', fontSize: 12, fontWeight: '600' },
  statusButtonTextActive: { color: '#FFF' },
  smallLabel: { color: '#777', fontSize: 10, fontWeight: '700' },
  claimCode: { fontSize: 24, fontWeight: '800', color: '#19191B', letterSpacing: 1, marginTop: 6 },
  releaseButton: { backgroundColor: '#19191B', borderRadius: 22, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  releaseButtonText: { color: '#FFF', fontWeight: '700' },
});
