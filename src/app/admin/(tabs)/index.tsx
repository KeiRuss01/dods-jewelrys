import {
  router,
  useFocusEffect,
} from 'expo-router';
import {
  useCallback,
  useState,
} from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signOut } from '@/services/auth';
import {
  getDashboardStats,
  type DashboardSources,
  type DashboardStats,
} from '@/services/dashboard';

const defaultStats: DashboardStats = {
  orders: 24,
  repairs: 8,
  products: 50,
  customers: 186,
  low_stock: 4,
};

const defaultSources: DashboardSources = {
  orders: 'default',
  repairs: 'default',
  products: 'default',
  customers: 'default',
};

const defaultActivities = [
  {
    title: 'Order #ORD-2026-015',
    description: 'Pearl Necklace',
    time: 'Today · 2:14 PM',
  },
  {
    title: 'Repair #REP-2026-001',
    description: 'Gold Ring · In Progress',
    time: 'Today · 11:42 AM',
  },
  {
    title: 'New customer',
    description: 'Maria Santos',
    time: 'Yesterday · 4:20 PM',
  },
];

export default function AdminDashboardScreen() {
  const [stats, setStats] =
    useState<DashboardStats>(defaultStats);

  const [sources, setSources] =
    useState<DashboardSources>(defaultSources);

  const loadDashboard = useCallback(async () => {
    try {
      const result = await getDashboardStats();

      setStats(result.stats);
      setSources(result.sources);
    } catch (error) {
      console.error(
        'Dashboard loading error:',
        error
      );

      // Keep the original default data if loading fails.
      setStats(defaultStats);
      setSources(defaultSources);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const activities = [
    ...defaultActivities,
    {
      title: 'Low stock alert',
      description:
        stats.low_stock === 1
          ? '1 product is low in stock'
          : `${stats.low_stock} products are low in stock`,
      time:
        sources.products === 'database'
          ? 'Inventory'
          : 'Temporary',
    },
  ];

  function handleLogout() {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          onPress: async () => {
            try {
              await signOut();
            } finally {
              router.replace('/admin-login');
            }
          },
        },
      ]
    );
  }

  function showComingSoon(feature: string) {
    Alert.alert(
      feature,
      `${feature} will be added later.`
    );
  }

  function getDataDescription(
    source: 'database' | 'default',
    databaseText: string,
    defaultText: string
  ) {
    return source === 'database'
      ? databaseText
      : defaultText;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.topHeader}>
        <Text style={styles.adminText}>
          Admin
        </Text>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() =>
            showComingSoon('Notifications')
          }
          activeOpacity={0.7}
        >
          <Image
            source={require(
              '../../../../assets/icons/notification.png'
            )}
            style={styles.headerIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Image
            source={require(
              '../../../../assets/icons/logout.png'
            )}
            style={styles.headerIcon}
          />
        </TouchableOpacity>
      </View>

        <Text style={styles.title}>
          Dashboard
        </Text>

        <Text style={styles.subtitle}>
          Manage Dod’s Jewelry operations.
        </Text>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              Orders
            </Text>

            <Text style={styles.summaryNumber}>
              {stats.orders}
            </Text>

            <Text style={styles.summaryDescription}>
              {getDataDescription(
                sources.orders,
                'Saved orders',
                '+12% this month'
              )}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              Repairs
            </Text>

            <Text style={styles.summaryNumber}>
              {stats.repairs}
            </Text>

            <Text style={styles.summaryDescription}>
              {getDataDescription(
                sources.repairs,
                'Saved repairs',
                '3 awaiting action'
              )}
            </Text>
          </View>

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

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              Customers
            </Text>

            <Text style={styles.summaryNumber}>
              {stats.customers}
            </Text>

            <Text style={styles.summaryDescription}>
              {getDataDescription(
                sources.customers,
                'Registered customers',
                '+9 this week'
              )}
            </Text>
          </View>
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
            onPress={() =>
              showComingSoon('Manage Repairs')
            }
          >
            <Text style={styles.actionText}>
              Manage Repairs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              showComingSoon('View Orders')
            }
          >
            <Text style={styles.actionText}>
              View Orders
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              showComingSoon('Customers')
            }
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
          {activities.map((activity, index) => (
            <View key={index}>
              <View style={styles.activityRow}>
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
                  {activity.time}
                </Text>
              </View>

              {index <
                activities.length - 1 && (
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
});
