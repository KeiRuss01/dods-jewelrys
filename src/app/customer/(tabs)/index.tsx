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
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUid } from '@/hooks/use-uid';
import {
  CustomerOrder,
  subscribeToCustomerOrders,
} from '@/services/order-query-service';
import { subscribeToProducts } from '@/services/product-service';
import {
  RepairRequest,
  subscribeToCustomerRepairs,
} from '@/services/repair-service';
import type { Product } from '@/types/product';

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
  in_progress: 'Repair in Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  ready_for_release: 'Ready for Release',
  claimed: 'Claimed',
};

export default function CustomerHomeScreen() {
  const { uid, ready } = useUid();

  const [featuredProducts, setFeaturedProducts] =
    useState<Product[]>([]);

  const [orders, setOrders] = useState<
    CustomerOrder[]
  >([]);

  const [repairs, setRepairs] = useState<
    RepairRequest[]
  >([]);

  const [productsLoaded, setProductsLoaded] =
    useState(false);

  const [ordersLoaded, setOrdersLoaded] =
    useState(false);

  const [repairsLoaded, setRepairsLoaded] =
    useState(false);

  useEffect(() => {
    return subscribeToProducts(
      (products) => {
        setFeaturedProducts(
          products
            .filter(
              (product) =>
                product.active !== false
            )
            .slice(0, 2)
        );

        setProductsLoaded(true);
      },
      (error) => {
        setProductsLoaded(true);

        Alert.alert(
          'Unable to Load Products',
          error.message
        );
      }
    );
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!uid) {
      setOrders([]);
      setRepairs([]);
      setOrdersLoaded(true);
      setRepairsLoaded(true);
      return;
    }

    setOrdersLoaded(false);
    setRepairsLoaded(false);

    const stopOrders =
      subscribeToCustomerOrders(
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
  }, [uid, ready]);

  const currentOrder = useMemo(() => {
    return (
      orders.find(
        (order) =>
          order.status !== 'delivered' &&
          order.status !== 'cancelled'
      ) ??
      orders[0] ??
      null
    );
  }, [orders]);

  const currentRepair = useMemo(() => {
    return (
      repairs.find(
        (repair) =>
          repair.status !== 'completed' &&
          repair.status !== 'cancelled'
      ) ??
      repairs[0] ??
      null
    );
  }, [repairs]);

  const latestOrderItem =
    currentOrder?.items[0] ?? null;

  const loadingHome =
    !ready ||
    !productsLoaded ||
    !ordersLoaded ||
    !repairsLoaded;

  function getGreeting() {
    const currentHour =
      new Date().getHours();

    if (currentHour < 12) {
      return 'Good Morning';
    }

    if (currentHour < 18) {
      return 'Good Afternoon';
    }

    return 'Good Evening';
  }

  function openProduct(product: Product) {
    router.push({
      pathname: '/customer/details',
      params: {
        id: product.product_id,
      },
    });
  }

  function openRepairBooking() {
    router.push({
      pathname: '/customer/repairs',
      params: {
        mode: 'book',
      },
    });
  }

  function openRepairList() {
    router.push({
      pathname: '/customer/repairs',
      params: {
        mode: 'view',
      },
    });
  }

  function openOrders() {
    router.push('/customer/orders');
  }

  function openOrderDetails(
    order: CustomerOrder
  ) {
    router.push({
      pathname: '/customer/orders/[id]',
      params: {
        id: order.id,
      },
    });
  }

  function showNotifications() {
    Alert.alert(
      'Notifications',
      'You have no new notifications.'
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Home
          </Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={showNotifications}
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
              style={styles.headerButton}
              onPress={() =>
                router.push('/customer/cart')
              }
              activeOpacity={0.7}
            >
              <Image
                source={require(
                  '../../../../assets/icons/cart.png'
                )}
                style={styles.headerIcon}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.greeting}>
          {getGreeting()}!
        </Text>

        <TouchableOpacity
          style={styles.banner}
          onPress={openRepairBooking}
          activeOpacity={0.8}
        >
          <View>
            <Text style={styles.bannerTitle}>
              Jewelry care{'\n'}made simple
            </Text>

            <Text
              style={styles.bannerDescription}
            >
              Book repairs and track your
              jewelry.
            </Text>
          </View>

          <View style={styles.bannerButton}>
            <Text
              style={styles.bannerButtonText}
            >
              Book a Repair →
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Quick Actions
          </Text>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              router.push('/customer/shop')
            }
            activeOpacity={0.8}
          >
            <Text style={styles.actionTitle}>
              Shop Jewelry
            </Text>

            <Text
              style={styles.actionDescription}
            >
              View products
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={openRepairBooking}
            activeOpacity={0.8}
          >
            <Text style={styles.actionTitle}>
              Book Repair
            </Text>

            <Text
              style={styles.actionDescription}
            >
              Request service
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Current Order
          </Text>

          <TouchableOpacity
            onPress={openOrders}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAll}>
              View All →
            </Text>
          </TouchableOpacity>
        </View>

        {!ordersLoaded ? (
          <View style={styles.statusLoadingCard}>
            <ActivityIndicator
              size="small"
              color="#B77C14"
            />

            <Text style={styles.loadingText}>
              Loading current order...
            </Text>
          </View>
        ) : currentOrder ? (
          <TouchableOpacity
            style={styles.statusCard}
            onPress={() =>
              openOrderDetails(currentOrder)
            }
            activeOpacity={0.8}
          >
            {latestOrderItem?.image_url ? (
              <Image
                source={{
                  uri: latestOrderItem.image_url,
                }}
                style={styles.itemImage}
              />
            ) : (
              <View
                style={[
                  styles.itemImage,
                  styles.itemPlaceholder,
                ]}
              >
                <Text
                  style={
                    styles.itemPlaceholderText
                  }
                >
                  IMAGE
                </Text>
              </View>
            )}

            <View
              style={
                styles.statusInformation
              }
            >
              <Text
                style={styles.itemName}
                numberOfLines={1}
              >
                {latestOrderItem?.product_name ??
                  'Jewelry Purchase'}
              </Text>

              <Text
                style={styles.orderNumber}
              >
                {currentOrder.order_number}
              </Text>

              <Text
                style={[
                  styles.statusText,
                  currentOrder.status ===
                    'delivered' &&
                    styles.completedStatus,
                  currentOrder.status ===
                    'cancelled' &&
                    styles.cancelledStatus,
                ]}
              >
                {ORDER_STATUS[
                  currentOrder.status
                ] ?? currentOrder.status}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.smallButton}
              onPress={() =>
                openOrderDetails(currentOrder)
              }
              activeOpacity={0.8}
            >
              <Text
                style={
                  styles.smallButtonText
                }
              >
                View Progress
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.emptyStatusCard}
            onPress={() =>
              router.push('/customer/shop')
            }
            activeOpacity={0.8}
          >
            <View>
              <Text
                style={
                  styles.emptyStatusTitle
                }
              >
                No orders yet
              </Text>

              <Text
                style={
                  styles.emptyStatusText
                }
              >
                Your latest purchase will appear
                here.
              </Text>
            </View>

            <Text style={styles.emptyAction}>
              Shop Now →
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Current Repair
          </Text>

          <TouchableOpacity
            onPress={openRepairList}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAll}>
              View All →
            </Text>
          </TouchableOpacity>
        </View>

        {!repairsLoaded ? (
          <View style={styles.statusLoadingCard}>
            <ActivityIndicator
              size="small"
              color="#B77C14"
            />

            <Text style={styles.loadingText}>
              Loading current repair...
            </Text>
          </View>
        ) : currentRepair ? (
          <TouchableOpacity
            style={styles.statusCard}
            onPress={openRepairList}
            activeOpacity={0.8}
          >
            {currentRepair.damage_photo_url ? (
              <Image
                source={{
                  uri: currentRepair.damage_photo_url,
                }}
                style={styles.itemImage}
              />
            ) : (
              <View
                style={[
                  styles.itemImage,
                  styles.itemPlaceholder,
                ]}
              >
                <Image
                  source={require(
                    '../../../../assets/icons/repair.png'
                  )}
                  style={
                    styles.repairPlaceholderIcon
                  }
                />
              </View>
            )}

            <View
              style={
                styles.statusInformation
              }
            >
              <Text
                style={styles.itemName}
                numberOfLines={1}
              >
                {currentRepair.jewelry_type}
              </Text>

              <Text
                style={styles.orderNumber}
              >
                {currentRepair.repair_number}
              </Text>

              <Text
                style={[
                  styles.statusText,
                  currentRepair.status ===
                    'completed' &&
                    styles.completedStatus,
                  currentRepair.status ===
                    'cancelled' &&
                    styles.cancelledStatus,
                ]}
              >
                {REPAIR_STATUS[
                  currentRepair.status
                ] ?? currentRepair.status}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.smallButton}
              onPress={openRepairList}
              activeOpacity={0.8}
            >
              <Text
                style={
                  styles.smallButtonText
                }
              >
                View Progress
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.emptyStatusCard}
            onPress={openRepairBooking}
            activeOpacity={0.8}
          >
            <View>
              <Text
                style={
                  styles.emptyStatusTitle
                }
              >
                No repairs yet
              </Text>

              <Text
                style={
                  styles.emptyStatusText
                }
              >
                Book a repair for your jewelry.
              </Text>
            </View>

            <Text style={styles.emptyAction}>
              Book Now →
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Featured Jewelry
          </Text>

          <TouchableOpacity
            onPress={() =>
              router.push('/customer/shop')
            }
            activeOpacity={0.7}
          >
            <Text style={styles.viewAll}>
              View All →
            </Text>
          </TouchableOpacity>
        </View>

        {!productsLoaded ? (
          <View style={styles.productLoading}>
            <ActivityIndicator
              size="small"
              color="#B77C14"
            />
          </View>
        ) : featuredProducts.length === 0 ? (
          <View style={styles.emptyProducts}>
            <Text style={styles.emptyStatusTitle}>
              No featured jewelry
            </Text>

            <Text style={styles.emptyStatusText}>
              Products added by the administrator
              will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.productRow}>
            {featuredProducts.map(
              (product) => (
                <TouchableOpacity
                  key={product.product_id}
                  style={styles.productCard}
                  onPress={() =>
                    openProduct(product)
                  }
                  activeOpacity={0.8}
                >
                  {product.image_url ? (
                    <Image
                      source={{
                        uri: product.image_url,
                      }}
                      style={
                        styles.productImage
                      }
                    />
                  ) : (
                    <View
                      style={[
                        styles.productImage,
                        styles.productPlaceholder,
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

                  <Text
                    style={styles.productName}
                    numberOfLines={1}
                  >
                    {product.product_name}
                  </Text>

                  <Text
                    style={styles.productPrice}
                  >
                    ₱
                    {Number(
                      product.price
                    ).toLocaleString(
                      'en-PH',
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        )}

        {loadingHome && (
          <View style={styles.initialLoading}>
            <ActivityIndicator
              size="small"
              color="#B77C14"
            />
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
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 100,
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

  greeting: {
    color: '#19191B',
    fontSize: 23,
    fontWeight: 'bold',
    marginTop: 18,
  },

  banner: {
    minHeight: 145,
    backgroundColor: '#171719',
    borderRadius: 18,
    padding: 18,
    marginTop: 18,
    justifyContent: 'space-between',
  },

  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },

  bannerDescription: {
    color: '#AAA8A4',
    fontSize: 12,
    marginTop: 8,
  },

  bannerButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 15,
  },

  bannerButtonText: {
    color: '#171719',
    fontSize: 10,
    fontWeight: 'bold',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 10,
  },

  sectionTitle: {
    color: '#19191B',
    fontSize: 15,
    fontWeight: 'bold',
  },

  viewAll: {
    color: '#A8751F',
    fontSize: 11,
    fontWeight: '600',
  },

  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },

  actionButton: {
    flex: 1,
    minHeight: 67,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DDD3',
    borderRadius: 14,
    padding: 14,
    justifyContent: 'center',
  },

  actionTitle: {
    color: '#19191B',
    fontSize: 13,
    fontWeight: 'bold',
  },

  actionDescription: {
    color: '#8A857E',
    fontSize: 10,
    marginTop: 4,
  },

  statusCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DDD3',
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusLoadingCard: {
    minHeight: 84,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DDD3',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },

  loadingText: {
    color: '#77736D',
    fontSize: 10,
  },

  itemImage: {
    width: 62,
    height: 62,
    borderRadius: 10,
    resizeMode: 'cover',
  },

  itemPlaceholder: {
    backgroundColor: '#DDDDDD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  itemPlaceholderText: {
    color: '#99958F',
    fontSize: 8,
  },

  repairPlaceholderIcon: {
    width: 27,
    height: 27,
    resizeMode: 'contain',
    tintColor: '#77736D',
  },

  statusInformation: {
    flex: 1,
    marginLeft: 10,
  },

  itemName: {
    color: '#19191B',
    fontSize: 12,
    fontWeight: 'bold',
  },

  orderNumber: {
    color: '#77736D',
    fontSize: 9,
    marginTop: 3,
  },

  statusText: {
    color: '#A8751F',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 5,
  },

  completedStatus: {
    color: '#238636',
  },

  cancelledStatus: {
    color: '#B74242',
  },

  smallButton: {
    backgroundColor: '#171719',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },

  smallButtonText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '600',
  },

  emptyStatusCard: {
    minHeight: 84,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DDD3',
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  emptyStatusTitle: {
    color: '#19191B',
    fontSize: 12,
    fontWeight: 'bold',
  },

  emptyStatusText: {
    color: '#77736D',
    fontSize: 9,
    marginTop: 4,
  },

  emptyAction: {
    color: '#A8751F',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 10,
  },

  productLoading: {
    minHeight: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyProducts: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DDD3',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },

  productRow: {
    flexDirection: 'row',
    gap: 10,
  },

  productCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DDD3',
    borderRadius: 14,
    padding: 10,
  },

  productImage: {
    width: '100%',
    height: 110,
    borderRadius: 10,
    resizeMode: 'cover',
  },

  productPlaceholder: {
    backgroundColor: '#D8D4C3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderText: {
    color: '#99958F',
    fontSize: 9,
  },

  productName: {
    color: '#19191B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 9,
  },

  productPrice: {
    color: '#A8751F',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 4,
  },

  initialLoading: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
  },
});
