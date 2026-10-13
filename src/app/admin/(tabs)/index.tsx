import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminHeader } from '@/components/admin-header';
import {
  type DashboardActivity,
  type DashboardStats,
  subscribeToDashboard,
} from '@/services/dashboard-service';

const defaultStats: DashboardStats = {
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

export default function AdminDashboardScreen() {
  const [stats, setStats] = useState(defaultStats);

  useEffect(() => {
    return subscribeToDashboard(
      setStats,
      (error) => Alert.alert('Unable to Load Dashboard', error.message)
    );
  }, []);

  function showNotifications() {
    const alerts = [
      stats.low_stock > 0 ? `${stats.low_stock} low-stock product${stats.low_stock === 1 ? '' : 's'}` : '',
      stats.awaiting_repairs > 0 ? `${stats.awaiting_repairs} repair${stats.awaiting_repairs === 1 ? '' : 's'} awaiting work` : '',
      stats.ready_for_release > 0 ? `${stats.ready_for_release} repair${stats.ready_for_release === 1 ? '' : 's'} ready for release` : '',
      stats.active_orders > 0 ? `${stats.active_orders} active order${stats.active_orders === 1 ? '' : 's'}` : '',
    ].filter(Boolean);

    Alert.alert(
      'Operational Notifications',
      alerts.length ? alerts.map((item) => `• ${item}`).join('\n') : 'There are no operational alerts.'
    );
  }

  function openActivity(activity: DashboardActivity) {
    router.push({
      pathname: activity.kind === 'order' ? '/admin/orders/[id]' : '/admin/repairs/[id]',
      params: { id: activity.id },
    });
  }

  function activityTime(date: Date) {
    if (!date.getTime()) return 'Recently';
    const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AdminHeader onNotifications={showNotifications} />

        <Text style={styles.title}>
          Dashboard
        </Text>

        <Text style={styles.subtitle}>
          Manage Dod’s Jewelry operations.
        </Text>

        <View style={styles.summaryGrid}>
          <TouchableOpacity
            style={styles.summaryCard}
            activeOpacity={0.8}
            onPress={() => router.push('/admin/orders/index')}
          >
            <Text style={styles.summaryLabel}>
              Orders
            </Text>

            <Text style={styles.summaryNumber}>
              {stats.orders}
            </Text>

            <Text style={styles.summaryDescription}>
              {stats.active_orders} active
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.summaryCard}
            activeOpacity={0.8}
            onPress={() => router.push('/admin/repairs/index')}
          >
            <Text style={styles.summaryLabel}>
              Repairs
            </Text>

            <Text style={styles.summaryNumber}>
              {stats.repairs}
            </Text>

            <Text style={styles.summaryDescription}>
              {stats.awaiting_repairs} awaiting action
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.summaryCard}
            activeOpacity={0.8}
            onPress={() =>
              router.push('/admin/products')
            }
          >
            <Text style={styles.summaryLabel}>
              Products
            </Text>

            <Text style={styles.summaryNumber}>
              {stats.products}
            </Text>

            <Text style={styles.summaryDescription}>
              {stats.low_stock} low stock
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.summaryCard}
            activeOpacity={0.8}
            onPress={() => router.push('/admin/customers')}
          >
            <Text style={styles.summaryLabel}>
              Customers
            </Text>

            <Text style={styles.summaryNumber}>
              {stats.customers}
            </Text>

            <Text style={styles.summaryDescription}>
              Registered accounts
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>
          Quick Actions
        </Text>

        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              router.push('/admin/add-product')
            }
          >
            <Text style={styles.actionText}>
              Add Product
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/admin/repairs/index')}
          >
            <Text style={styles.actionText}>
              Manage Repairs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/admin/orders/index')}
          >
            <Text style={styles.actionText}>
              View Orders
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/admin/customers')}
          >
            <Text style={styles.actionText}>
              Customers
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>
          Recent Activity
        </Text>

        <View style={styles.activityCard}>
          {stats.activities.length === 0 ? (
            <Text style={styles.emptyActivity}>No order or repair activity yet.</Text>
          ) : stats.activities.map((activity, index) => (
            <View key={`${activity.kind}-${activity.id}`}>
              <TouchableOpacity
                style={styles.activityRow}
                activeOpacity={0.7}
                onPress={() => openActivity(activity)}
              >
                <View
                  style={
                    styles.activityInformation
                  }
                >
                  <Text
                    style={styles.activityTitle}
                  >
                    {activity.title}
                  </Text>

                  <Text
                    style={
                      styles.activityDescription
                    }
                  >
                    {activity.description}
                  </Text>
                </View>

                <Text style={styles.activityTime}>
                  {activityTime(activity.created_at)}
                </Text>
              </TouchableOpacity>

              {index <
                stats.activities.length - 1 && (
                <View
                  style={styles.activityDivider}
                />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },

  headerIcon: {
    width: 23,
    height: 23,
    resizeMode: 'contain',
    tintColor: '#19191B',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 25,
  },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 38,
  },

  adminText: {
    color: '#19191B',
    fontSize: 17,
    fontWeight: 'bold',
    marginRight: 3,
  },

  iconButton: {
    padding: 3,
  },

  title: {
    color: '#19191B',
    fontSize: 25,
    fontWeight: 'bold',
    marginTop: 13,
  },

  subtitle: {
    color: '#77736D',
    fontSize: 11,
    marginTop: 4,
  },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginTop: 23,
  },

  summaryCard: {
    width: '48.5%',
    minHeight: 80,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  summaryLabel: {
    color: '#6E6A65',
    fontSize: 11,
  },

  summaryNumber: {
    color: '#19191B',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 3,
  },

  summaryDescription: {
    color: '#918C84',
    fontSize: 8,
    marginTop: 1,
  },

  sectionTitle: {
    color: '#19191B',
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 11,
  },

  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },

  actionButton: {
    width: '48.5%',
    height: 43,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionText: {
    color: '#19191B',
    fontSize: 10,
    fontWeight: '600',
  },

  activityCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },

  activityRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  activityInformation: {
    flex: 1,
  },

  activityTitle: {
    color: '#19191B',
    fontSize: 10,
    fontWeight: '600',
  },

  activityDescription: {
    color: '#77736D',
    fontSize: 9,
    marginTop: 3,
  },

  activityTime: {
    color: '#99958F',
    fontSize: 8,
    marginLeft: 10,
  },

  activityDivider: {
    height: 1,
    backgroundColor: '#E8E3DA',
  },

  emptyActivity: {
    color: '#77736D',
    fontSize: 10,
    textAlign: 'center',
    paddingVertical: 18,
  },
});
