import {
  router,
  useLocalSearchParams,
} from 'expo-router';
import { useEffect, useState } from 'react';
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

import { formatPeso } from '@/lib/format';
import {
  CustomerOrder,
  subscribeToOrder,
} from '@/services/order-query-service';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  ready_to_ship: 'Ready to Ship',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function formatDate(date: Date) {
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function paymentMethodLabel(method: string) {
  return method === 'paypal'
    ? 'PayPal'
    : 'Cash on Delivery';
}

export default function OrderDetailsScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const orderId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [order, setOrder] =
    useState<CustomerOrder | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    return subscribeToOrder(
      orderId,
      (nextOrder) => {
        setOrder(nextOrder);
        setLoading(false);
      },
      (error) => {
        setLoading(false);

        Alert.alert(
          'Unable to Load Order',
          error.message
        );
      }
    );
  }, [orderId]);

  function showProgress() {
    if (!order) {
      return;
    }

    const messages: Record<string, string> = {
      pending:
        'Your order has been received and is waiting for confirmation.',
      processing:
        'Your jewelry is currently being prepared.',
      ready_to_ship:
        'Your jewelry is packed and ready to be shipped.',
      shipped:
        'Your order is currently out for delivery.',
      delivered:
        'Your order has been successfully delivered.',
      cancelled:
        'This order has been cancelled.',
    };

    Alert.alert(
      STATUS_LABELS[order.status] ??
        order.status,
      messages[order.status] ??
        'Your order status is being updated.'
    );
  }

  function showReceipt() {
    if (!order) {
      return;
    }

    Alert.alert(
      'Digital Receipt',
      [
        `Order: ${order.order_number}`,
        `Date: ${formatDate(order.created_at)}`,
        `Payment: ${paymentMethodLabel(
          order.payment_method
        )}`,
        `Subtotal: ${formatPeso(
          order.subtotal
        )}`,
        `Shipping: ${
          order.shipping_fee === 0
            ? 'Free'
            : formatPeso(order.shipping_fee)
        }`,
        `Total: ${formatPeso(order.total)}`,
      ].join('\n')
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color="#B77C14"
        />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <Text style={styles.emptyTitle}>
          Order not found
        </Text>

        <TouchableOpacity
          style={styles.backToOrdersButton}
          onPress={() =>
            router.replace('/customer/orders')
          }
        >
          <Text style={styles.primaryButtonText}>
            Back to Orders
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const address = order.shipping_address;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backIcon}>
                ‹
              </Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              Orders
            </Text>
          </View>

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
          Order Details
        </Text>

        <View style={styles.card}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.smallLabel}>
                Order ID
              </Text>

              <Text style={styles.orderNumber}>
                {order.order_number}
              </Text>
            </View>

            <Text style={styles.status}>
              {STATUS_LABELS[order.status] ??
                order.status}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoColumns}>
            <View style={styles.infoColumn}>
              <Text style={styles.smallLabel}>
                Order Date
              </Text>

              <Text style={styles.infoValue}>
                {formatDate(order.created_at)}
              </Text>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.infoColumn}>
              <Text style={styles.smallLabel}>
                Payment Method
              </Text>

              <Text style={styles.infoValue}>
                {paymentMethodLabel(
                  order.payment_method
                )}
              </Text>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.infoColumn}>
              <Text style={styles.smallLabel}>
                Total Payment
              </Text>

              <Text style={styles.infoValue}>
                {formatPeso(order.total)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {order.items.map((item, index) => (
            <View
              key={`${item.product_id}-${item.size}-${index}`}
              style={styles.productRow}
            >
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.productImage}
                />
              ) : (
                <View
                  style={[
                    styles.productImage,
                    styles.imagePlaceholder,
                  ]}
                >
                  <Text
                    style={styles.placeholderText}
                  >
                    IMAGE
                  </Text>
                </View>
              )}

              <View style={styles.productDetails}>
                <Text style={styles.productName}>
                  {item.product_name}
                </Text>

                <Text style={styles.productMeta}>
                  {[item.purity, item.material]
                    .filter(Boolean)
                    .join(' ')}
                </Text>

                {item.size && (
                  <Text style={styles.productMeta}>
                    Size: {item.size}
                  </Text>
                )}

                <Text style={styles.productMeta}>
                  Qty: {item.quantity}
                </Text>
              </View>

              <Text style={styles.itemPrice}>
                {formatPeso(
                  item.unit_price * item.quantity
                )}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.progressButton}
          onPress={showProgress}
        >
          <Text style={styles.progressText}>
            View Order Progress
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>
          Payment Summary
        </Text>

        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Subtotal
            </Text>

            <Text style={styles.summaryValue}>
              {formatPeso(order.subtotal)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Shipping
            </Text>

            <Text style={styles.summaryValue}>
              {order.shipping_fee === 0
                ? 'Free'
                : formatPeso(
                    order.shipping_fee
                  )}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Discount
            </Text>

            <Text style={styles.summaryValue}>
              ₱0.00
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalText}>
              Total
            </Text>

            <Text style={styles.totalText}>
              {formatPeso(order.total)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Delivery Information
        </Text>

        <View style={styles.card}>
          <View style={styles.deliveryRow}>
            <Text style={styles.deliveryLabel}>
              Customer
            </Text>

            <Text style={styles.deliveryValue}>
              {address.full_name}
            </Text>
          </View>

          <View style={styles.deliveryRow}>
            <Text style={styles.deliveryLabel}>
              Phone
            </Text>

            <Text style={styles.deliveryValue}>
              {address.phone}
            </Text>
          </View>

          <View style={styles.deliveryRow}>
            <Text style={styles.deliveryLabel}>
              Address
            </Text>

            <Text style={styles.deliveryValue}>
              {[
                address.street,
                address.city,
                address.province,
                address.postal_code,
              ]
                .filter(Boolean)
                .join(', ')}
            </Text>
          </View>

          <View style={styles.deliveryRow}>
            <Text style={styles.deliveryLabel}>
              Payment
            </Text>

            <Text style={styles.deliveryValue}>
              {paymentMethodLabel(
                order.payment_method
              )}
            </Text>
          </View>
        </View>

        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={styles.receiptButton}
            onPress={showReceipt}
          >
            <Text style={styles.receiptText}>
              View Digital Receipt
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buyAgainButton}
            onPress={() =>
              router.push('/customer/shop')
            }
          >
            <Text style={styles.primaryButtonText}>
              Buy Again
            </Text>
          </TouchableOpacity>
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

  loadingScreen: {
    flex: 1,
    backgroundColor: '#FAF8F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 90,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  backButton: {
    width: 25,
    height: 35,
    justifyContent: 'center',
  },

  backIcon: {
    color: '#19191B',
    fontSize: 35,
    lineHeight: 36,
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
    marginBottom: 14,
  },

  card: {
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    padding: 13,
  },

  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  smallLabel: {
    color: '#77736D',
    fontSize: 8,
  },

  orderNumber: {
    color: '#19191B',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },

  status: {
    color: '#238636',
    fontSize: 9,
    fontWeight: 'bold',
  },

  divider: {
    height: 1,
    backgroundColor: '#C58D24',
    marginVertical: 10,
  },

  infoColumns: {
    flexDirection: 'row',
  },

  infoColumn: {
    flex: 1,
  },

  verticalDivider: {
    width: 1,
    backgroundColor: '#DED8CC',
    marginHorizontal: 9,
  },

  infoValue: {
    color: '#19191B',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 3,
  },

  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  productImage: {
    width: 60,
    height: 52,
    borderRadius: 11,
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

  productDetails: {
    flex: 1,
    marginLeft: 9,
  },

  productName: {
    color: '#19191B',
    fontSize: 10,
    fontWeight: 'bold',
  },

  productMeta: {
    color: '#77736D',
    fontSize: 8,
    marginTop: 2,
  },

  itemPrice: {
    color: '#19191B',
    fontSize: 9,
    fontWeight: 'bold',
  },

  progressButton: {
    height: 37,
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  progressText: {
    color: '#19191B',
    fontSize: 10,
    fontWeight: '600',
  },

  sectionTitle: {
    color: '#19191B',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 8,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },

  summaryLabel: {
    color: '#19191B',
    fontSize: 10,
  },

  summaryValue: {
    color: '#19191B',
    fontSize: 10,
    fontWeight: '600',
  },

  summaryDivider: {
    height: 1,
    backgroundColor: '#C58D24',
    marginVertical: 7,
  },

  totalText: {
    color: '#19191B',
    fontSize: 11,
    fontWeight: 'bold',
  },

  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 5,
  },

  deliveryLabel: {
    width: 80,
    color: '#19191B',
    fontSize: 9,
    fontWeight: '600',
  },

  deliveryValue: {
    flex: 1,
    color: '#19191B',
    fontSize: 9,
    lineHeight: 14,
  },

  bottomButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },

  receiptButton: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#C58D24',
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  receiptText: {
    color: '#19191B',
    fontSize: 9,
    fontWeight: 'bold',
  },

  buyAgainButton: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  emptyTitle: {
    color: '#19191B',
    fontSize: 17,
    fontWeight: 'bold',
  },

  backToOrdersButton: {
    height: 44,
    borderRadius: 22,
    backgroundColor: '#050505',
    paddingHorizontal: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
});
