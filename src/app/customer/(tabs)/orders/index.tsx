import { router } from 'expo-router';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUid } from '@/hooks/use-uid';
import { formatPeso } from '@/lib/format';
import {
  CustomerOrder,
  subscribeToCustomerOrders,
} from '@/services/order-query-service';
import {
  RepairRequest,
  subscribeToCustomerRepairs,
} from '@/services/repair-service';

type FilterType =
  | 'all'
  | 'purchases'
  | 'repairs';

type OrderFeedItem =
  | {
      type: 'purchase';
      createdAt: Date;
      order: CustomerOrder;
    }
  | {
      type: 'repair';
      createdAt: Date;
      repair: RepairRequest;
    };

const ORDER_STATUS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  ready_to_ship: 'Ready to Ship',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const REPAIR_STATUS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  ready_for_release: 'Ready for Release',
  claimed: 'Claimed',
  cancelled: 'Cancelled',
};

function formatDate(date: Date) {
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function statusColor(status: string) {
  if (
    status === 'delivered' ||
    status === 'completed'
  ) {
    return '#238636';
  }

  if (status === 'cancelled') {
    return '#B74242';
  }

  return '#A8751F';
}

export default function OrdersScreen() {
  const { uid, ready } = useUid();

  const [orders, setOrders] = useState<
    CustomerOrder[]
  >([]);

  const [repairs, setRepairs] = useState<
    RepairRequest[]
  >([]);

  const [ordersLoaded, setOrdersLoaded] =
    useState(false);

  const [repairsLoaded, setRepairsLoaded] =
    useState(false);

  const [filter, setFilter] =
    useState<FilterType>('all');

  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!uid) {
      setOrders([]);
      setRepairs([]);
      setOrdersLoaded(true);
      setRepairsLoaded(true);
      return;
    }

    setOrdersLoaded(false);
    setRepairsLoaded(false);

    const stopOrders = subscribeToCustomerOrders(
      uid,
      (nextOrders) => {
        setOrders(nextOrders);
        setOrdersLoaded(true);
      },
      (error) => {
        setOrdersLoaded(true);

        Alert.alert(
          'Unable to Load Orders',
          error.message
        );
      }
    );

    const stopRepairs =
      subscribeToCustomerRepairs(
        uid,
        (nextRepairs) => {
          setRepairs(nextRepairs);
          setRepairsLoaded(true);
        },
        (error) => {
          setRepairsLoaded(true);

          Alert.alert(
            'Unable to Load Repairs',
            error.message
          );
        }
      );

    return () => {
      stopOrders();
      stopRepairs();
    };
  }, [uid]);

  const visibleItems = useMemo(() => {
    const items: OrderFeedItem[] = [];

    if (
      filter === 'all' ||
      filter === 'purchases'
    ) {
      orders.forEach((order) => {
        items.push({
          type: 'purchase',
          createdAt: order.created_at,
          order,
        });
      });
    }

    if (
      filter === 'all' ||
      filter === 'repairs'
    ) {
      repairs.forEach((repair) => {
        items.push({
          type: 'repair',
          createdAt: repair.created_at,
          repair,
        });
      });
    }

    const searchText =
      search.trim().toLowerCase();

    return items
      .filter((item) => {
        if (!searchText) {
          return true;
        }

        if (item.type === 'purchase') {
          return (
            item.order.order_number
              .toLowerCase()
              .includes(searchText) ||
            item.order.items.some((product) =>
              product.product_name
                .toLowerCase()
                .includes(searchText)
            )
          );
        }

        return (
          item.repair.repair_number
            .toLowerCase()
            .includes(searchText) ||
          item.repair.jewelry_type
            .toLowerCase()
            .includes(searchText)
        );
      })
      .sort(
        (first, second) =>
          second.createdAt.getTime() -
          first.createdAt.getTime()
      );
  }, [orders, repairs, filter, search]);

  const loading =
    !ready || !ordersLoaded || !repairsLoaded;

  function openOrder(order: CustomerOrder) {
    router.push({
      pathname: '/customer/orders/[id]',
      params: {
        id: order.id,
      },
    });
  }

  function showRepairDetails(
    repair: RepairRequest
  ) {
    Alert.alert(
      repair.repair_number,
      [
        `Jewelry: ${repair.jewelry_type}`,
        `Service: ${repair.service_type}`,
        `Issue: ${repair.issue_description}`,
        `Status: ${
          REPAIR_STATUS[repair.status] ??
          repair.status
        }`,
        `Preferred: ${formatDate(
          repair.preferred_date
        )} at ${repair.preferred_time}`,
      ].join('\n')
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Orders
          </Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() =>
                Alert.alert(
                  'Notifications',
                  'Notifications will be added later.'
                )
              }
            >
              <Image
                source={require(
                  '../../../../../assets/icons/notification.png'
                )}
                style={styles.headerIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerButton}
              onPress={() =>
                router.push('/customer/cart')
              }
            >
              <Image
                source={require(
                  '../../../../../assets/icons/cart.png'
                )}
                style={styles.headerIcon}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.title}>
          My Orders
        </Text>

        <View style={styles.filters}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'all' &&
                styles.activeFilter,
            ]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'all' &&
                  styles.activeFilterText,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'purchases' &&
                styles.activeFilter,
            ]}
            onPress={() =>
              setFilter('purchases')
            }
          >
            <Text
              style={[
                styles.filterText,
                filter === 'purchases' &&
                  styles.activeFilterText,
              ]}
            >
              Jewelry Purchases
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'repairs' &&
                styles.activeFilter,
            ]}
            onPress={() => setFilter('repairs')}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'repairs' &&
                  styles.activeFilterText,
              ]}
            >
              Repairs
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>⌕</Text>

          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search order or jewelry"
            placeholderTextColor="#99958F"
          />
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator
              size="large"
              color="#B77C14"
            />

            <Text style={styles.centerText}>
              Loading orders...
            </Text>
          </View>
        ) : visibleItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              No orders found
            </Text>

            <Text style={styles.centerText}>
              Your jewelry purchases and repair
              requests will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.orderList}>
            {visibleItems.map((item) => {
              if (item.type === 'purchase') {
                const order = item.order;
                const firstItem = order.items[0];

                return (
                  <TouchableOpacity
                    key={`purchase-${order.id}`}
                    style={styles.orderCard}
                    activeOpacity={0.8}
                    onPress={() => openOrder(order)}
                  >
                    <View style={styles.cardTop}>
                      <Text style={styles.typeText}>
                        Purchase
                      </Text>

                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: statusColor(
                              order.status
                            ),
                          },
                        ]}
                      >
                        {ORDER_STATUS[
                          order.status
                        ] ?? order.status}
                      </Text>
                    </View>

                    <View style={styles.cardContent}>
                      {firstItem?.image_url ? (
                        <Image
                          source={{
                            uri: firstItem.image_url,
                          }}
                          style={styles.itemImage}
                        />
                      ) : (
                        <View
                          style={[
                            styles.itemImage,
                            styles.imagePlaceholder,
                          ]}
                        >
                          <Text
                            style={
                              styles.placeholderText
                            }
                          >
                            IMAGE
                          </Text>
                        </View>
                      )}

                      <View style={styles.itemDetails}>
                        <Text
                          style={styles.orderNumber}
                        >
                          {order.order_number}
                        </Text>

                        <Text
                          style={styles.itemName}
                          numberOfLines={1}
                        >
                          {firstItem?.product_name ??
                            'Jewelry Purchase'}
                        </Text>

                        <Text style={styles.dateText}>
                          {formatDate(
                            order.created_at
                          )}
                        </Text>

                        <Text
                          style={styles.categoryText}
                        >
                          Jewelry Purchase
                        </Text>
                      </View>

                      <View style={styles.priceArea}>
                        <Text
                          style={styles.totalLabel}
                        >
                          Total Cost
                        </Text>

                        <Text style={styles.totalValue}>
                          {formatPeso(order.total)}
                        </Text>

                        <Text
                          style={styles.detailsText}
                        >
                          View Details ›
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }

              const repair = item.repair;

              return (
                <TouchableOpacity
                  key={`repair-${repair.id}`}
                  style={styles.orderCard}
                  activeOpacity={0.8}
                  onPress={() =>
                    showRepairDetails(repair)
                  }
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.typeText}>
                      Repair
                    </Text>

                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: statusColor(
                            repair.status
                          ),
                        },
                      ]}
                    >
                      {REPAIR_STATUS[
                        repair.status
                      ] ?? repair.status}
                    </Text>
                  </View>

                  <View style={styles.cardContent}>
                    {repair.damage_photo_url ? (
                      <Image
                        source={{
                          uri: repair.damage_photo_url,
                        }}
                        style={styles.itemImage}
                      />
                    ) : (
                      <View
                        style={[
                          styles.itemImage,
                          styles.imagePlaceholder,
                        ]}
                      >
                        <Image
                          source={require(
                            '../../../../../assets/icons/repair.png'
                          )}
                          style={styles.repairIcon}
                        />
                      </View>
                    )}

                    <View style={styles.itemDetails}>
                      <Text style={styles.orderNumber}>
                        {repair.repair_number}
                      </Text>

                      <Text
                        style={styles.itemName}
                        numberOfLines={1}
                      >
                        {repair.jewelry_type}
                      </Text>

                      <Text style={styles.dateText}>
                        {formatDate(
                          repair.created_at
                        )}
                      </Text>

                      <Text
                        style={styles.categoryText}
                      >
                        Repair Service
                      </Text>
                    </View>

                    <View style={styles.priceArea}>
                      <Text style={styles.totalLabel}>
                        Total Cost
                      </Text>

                      <Text style={styles.totalValue}>
                        {repair.estimated_cost === null
                          ? 'Pending'
                          : formatPeso(
                              repair.estimated_cost
                            )}
                      </Text>

                      <Text
                        style={styles.detailsText}
                      >
                        View Details ›
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 90,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerTitle: {
    color: '#19191B',
    fontSize: 16,
    fontWeight: 'bold',
  },

  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },

  headerButton: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    tintColor: '#19191B',
  },

  title: {
    color: '#19191B',
    fontSize: 23,
    fontWeight: 'bold',
    marginTop: 18,
  },

  filters: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 16,
  },

  filterButton: {
    height: 28,
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  activeFilter: {
    backgroundColor: '#050505',
    borderColor: '#050505',
  },

  filterText: {
    color: '#6E6A65',
    fontSize: 9,
  },

  activeFilterText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  searchContainer: {
    height: 42,
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: 12,
  },

  searchIcon: {
    color: '#77736D',
    fontSize: 20,
    marginRight: 7,
  },

  searchInput: {
    flex: 1,
    color: '#19191B',
    fontSize: 11,
  },

  centerBox: {
    alignItems: 'center',
    marginTop: 70,
  },

  centerText: {
    color: '#77736D',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 9,
  },

  emptyCard: {
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    padding: 30,
    marginTop: 18,
  },

  emptyTitle: {
    color: '#19191B',
    fontSize: 15,
    fontWeight: 'bold',
  },

  orderList: {
    gap: 11,
    marginTop: 14,
  },

  orderCard: {
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    padding: 10,
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },

  typeText: {
    color: '#19191B',
    fontSize: 11,
    fontWeight: 'bold',
  },

  statusText: {
    fontSize: 9,
    fontWeight: '600',
  },

  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  itemImage: {
    width: 67,
    height: 67,
    borderRadius: 12,
    resizeMode: 'cover',
  },

  imagePlaceholder: {
    backgroundColor: '#DDDDDD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderText: {
    color: '#99958F',
    fontSize: 8,
  },

  repairIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    tintColor: '#77736D',
  },

  itemDetails: {
    flex: 1,
    marginLeft: 10,
  },

  orderNumber: {
    color: '#19191B',
    fontSize: 9,
    fontWeight: '600',
  },

  itemName: {
    color: '#19191B',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 3,
  },

  dateText: {
    color: '#77736D',
    fontSize: 8,
    marginTop: 6,
  },

  categoryText: {
    color: '#19191B',
    fontSize: 8,
    marginTop: 2,
  },

  priceArea: {
    alignItems: 'flex-end',
    marginLeft: 7,
  },

  totalLabel: {
    color: '#77736D',
    fontSize: 8,
  },

  totalValue: {
    color: '#19191B',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },

  detailsText: {
    color: '#19191B',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 18,
  },
});
