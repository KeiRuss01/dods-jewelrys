import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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

import AddressSheet from '@/components/address-sheet';
import { useUid } from '@/hooks/use-uid';
import { formatPeso } from '@/lib/format';
import { calculateShipping } from '@/lib/shipping';
import { subscribeToAddresses } from '@/services/address-service';
import { subscribeToCart } from '@/services/cart-service';
import { placeOrder } from '@/services/order-service';
import { subscribeToProducts } from '@/services/product-service';
import type { Address, CartItem, PaymentMethod } from '@/types/checkout-types';
import type { Product } from '@/types/product';

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'paypal', label: 'Paypal' },
  { value: 'cod', label: 'Cash on Delivery' },
];

export default function CheckoutScreen() {
  // "Buy Now" passes a single cart item id; otherwise the whole cart is checked out
  const { only } = useLocalSearchParams<{ only?: string }>();
  const { uid, ready } = useUid();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadedParts, setLoadedParts] = useState({ cart: false, products: false, addresses: false });

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [placing, setPlacing] = useState(false);

  function markLoaded(part: 'cart' | 'products' | 'addresses') {
    setLoadedParts((current) => ({ ...current, [part]: true }));
  }

  useEffect(() => {
    return subscribeToProducts(
      (next) => {
        setProducts(next);
        markLoaded('products');
      },
      (error) => {
        markLoaded('products');
        Alert.alert('Unable to Load Products', error.message);
      }
    );
  }, []);

  useEffect(() => {
    if (!uid) {
      setLoadedParts((current) => ({ ...current, cart: true, addresses: true }));
      return;
    }

    const stopCart = subscribeToCart(
      uid,
      (next) => {
        setCartItems(next);
        markLoaded('cart');
      },
      (error) => {
        markLoaded('cart');
        Alert.alert('Unable to Load Cart', error.message);
      }
    );

    const stopAddresses = subscribeToAddresses(
      uid,
      (next) => {
        setAddresses(next);
        markLoaded('addresses');
      },
      (error) => {
        markLoaded('addresses');
        Alert.alert('Unable to Load Addresses', error.message);
      }
    );

    return () => {
      stopCart();
      stopAddresses();
    };
  }, [uid]);

  const items = useMemo(
    () => (only ? cartItems.filter((item) => item.id === only) : cartItems),
    [cartItems, only]
  );

  const lines = useMemo(
    () =>
      items.map((item) => ({
        item,
        product: products.find((product) => product.product_id === item.product_id) ?? null,
      })),
    [items, products]
  );

  // Selected address, falling back to the default, then the first saved one
  const address =
    addresses.find((item) => item.id === selectedAddressId) ??
    addresses.find((item) => item.is_default) ??
    addresses[0] ??
    null;

  const subtotal = lines.reduce(
    (sum, { item, product }) => (product ? sum + product.price * item.quantity : sum),
    0
  );
  const shipping = calculateShipping(subtotal, address);
  const total = subtotal + shipping;

  const loading = !ready || !loadedParts.cart || !loadedParts.products || !loadedParts.addresses;

  async function handleCheckout() {
    if (!uid || placing) {
      return;
    }

    if (items.length === 0) {
      Alert.alert('Nothing to Check Out', 'Your cart is empty.');
      return;
    }

    if (!address) {
      Alert.alert('Shipping Address Required', 'Please add a shipping address.');
      setSheetOpen(true);
      return;
    }

    try {
      setPlacing(true);
      await placeOrder({ uid, items, address, paymentMethod });

      const message =
        paymentMethod === 'paypal'
          ? 'Your order is placed. PayPal payment will be connected later, so it is marked unpaid for now.'
          : 'Your order is placed. Please prepare the payment for delivery.';

      Alert.alert('Order Placed', message, [
        {
          text: 'OK',
          // Adjust to your real shop route if different
          onPress: () => router.replace('/customer/shop'),
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Unable to Place Order',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setPlacing(false);
    }
  }

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
              activeOpacity={0.7}
            >
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Checkout</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() =>
                Alert.alert('Notifications', 'Notifications will be added later.')
              }
              activeOpacity={0.7}
            >
              <Image
                source={require('../../../assets/icons/notification.png')}
                style={styles.headerIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push('/customer/cart')}
              activeOpacity={0.7}
            >
              <Image
                source={require('../../../assets/icons/cart.png')}
                style={styles.headerIcon}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.title}>Checkout</Text>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#B77C14" />
            <Text style={styles.centerText}>Loading checkout...</Text>
          </View>
        ) : !uid ? (
          <View style={styles.centerBox}>
            <Text style={styles.emptyTitle}>Please sign in</Text>
            <Text style={styles.centerText}>Sign in to check out.</Text>
          </View>
        ) : lines.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={styles.emptyTitle}>Nothing to check out</Text>
            <Text style={styles.centerText}>Your cart is empty.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Shipping Address</Text>

            {address ? (
              <View style={styles.card}>
                <View style={styles.addressHeader}>
                  <Text style={styles.addressName} numberOfLines={1}>
                    {address.full_name}
                  </Text>

                  <TouchableOpacity onPress={() => setSheetOpen(true)} hitSlop={8}>
                    <Text style={styles.changeText}>Change</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.addressLine}>{address.phone}</Text>
                <Text style={styles.addressLine}>{address.street}</Text>
                <Text style={styles.addressLine}>
                  {[address.city, address.province].filter(Boolean).join(', ')}
                  {address.postal_code ? `, ${address.postal_code}` : ''}
                </Text>

                {address.is_default && (
                  <Text style={styles.defaultNote}>Default address</Text>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.card, styles.addAddressCard]}
                onPress={() => setSheetOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.addAddressText}>+ Add shipping address</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.sectionTitle}>Payment Method</Text>

            <View style={styles.card}>
              {PAYMENT_OPTIONS.map((option) => {
                const isSelected = paymentMethod === option.value;

                return (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.paymentRow}
                    onPress={() => setPaymentMethod(option.value)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.radio, isSelected && styles.radioActive]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>

                    <Text style={styles.paymentLabel}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Order Summary</Text>

            <View style={styles.card}>
              {lines.map(({ item, product }) => (
                <View key={item.id} style={styles.summaryRow}>
                  <Text style={styles.itemLabel} numberOfLines={1}>
                    {product ? product.product_name : 'Unavailable item'}
                    {item.size ? ` (Size ${item.size})` : ''} × {item.quantity}
                  </Text>

                  <Text style={styles.summaryValue}>
                    {product ? formatPeso(product.price * item.quantity) : '—'}
                  </Text>
                </View>
              ))}

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatPeso(subtotal)}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping</Text>
                <Text style={styles.summaryValue}>
                  {shipping === 0 ? 'Free' : formatPeso(shipping)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total</Text>
                <Text style={styles.summaryValue}>{formatPeso(total)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.checkoutButton, placing && styles.disabledButton]}
              onPress={handleCheckout}
              activeOpacity={0.8}
              disabled={placing}
            >
              <Text style={styles.checkoutButtonText}>
                {placing ? 'Placing Order...' : 'Checkout'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {uid ? (
        <AddressSheet
          visible={sheetOpen}
          uid={uid}
          addresses={addresses}
          selectedId={address?.id ?? null}
          startInForm={addresses.length === 0}
          onSelect={setSelectedAddressId}
          onClose={() => setSheetOpen(false)}
        />
      ) : null}
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
    paddingBottom: 30,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  backButton: {
    width: 30,
    height: 35,
    justifyContent: 'center',
  },

  backIcon: {
    color: '#19191B',
    fontSize: 36,
    lineHeight: 38,
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

  centerBox: {
    alignItems: 'center',
    marginTop: 70,
  },

  centerText: {
    color: '#77736D',
    fontSize: 12,
    marginTop: 10,
  },

  emptyTitle: {
    color: '#19191B',
    fontSize: 15,
    fontWeight: 'bold',
  },

  sectionTitle: {
    color: '#19191B',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 26,
    marginBottom: 10,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 10,
  },

  addressName: {
    flex: 1,
    color: '#19191B',
    fontSize: 11,
    fontWeight: 'bold',
  },

  changeText: {
    color: '#19191B',
    fontSize: 11,
    fontWeight: 'bold',
  },

  addressLine: {
    color: '#19191B',
    fontSize: 11,
    lineHeight: 16,
  },

  defaultNote: {
    color: '#B77C14',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 8,
  },

  addAddressCard: {
    alignItems: 'center',
    paddingVertical: 22,
    borderStyle: 'dashed',
    borderColor: '#C58D24',
  },

  addAddressText: {
    color: '#B77C14',
    fontSize: 12,
    fontWeight: '600',
  },

  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },

  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#19191B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioActive: {
    borderColor: '#C58D24',
  },

  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C58D24',
  },

  paymentLabel: {
    color: '#19191B',
    fontSize: 11,
    fontWeight: 'bold',
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },

  itemLabel: {
    flex: 1,
    color: '#77736D',
    fontSize: 10,
  },

  summaryLabel: {
    color: '#19191B',
    fontSize: 10,
  },

  summaryValue: {
    color: '#19191B',
    fontSize: 10,
    fontWeight: 'bold',
  },

  divider: {
    height: 1,
    backgroundColor: '#C58D24',
  },

  checkoutButton: {
    height: 44,
    backgroundColor: '#050505',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },

  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  disabledButton: {
    opacity: 0.6,
  },
});