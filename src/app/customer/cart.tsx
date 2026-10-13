
import { router } from 'expo-router';
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

import { formatPeso } from '@/lib/format';
import { calculateShipping } from '@/lib/shipping';
import { removeCartItem, setCartQuantity, subscribeToCart } from '@/services/cart-service';
import { subscribeToProducts } from '@/services/product-service';
import { useUid } from '@/hooks/use-uid';
import type { CartItem } from '@/types/checkout-types';
import type { Product } from '@/types/product';

export default function CartScreen() {
  const { uid, ready } = useUid();

  const [items, setItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    return subscribeToProducts(
      (next) => {
        setProducts(next);
        setProductsLoading(false);
      },
      (error) => {
        setProductsLoading(false);
        Alert.alert('Unable to Load Products', error.message);
      }
    );
  }, []);

  useEffect(() => {
    if (!uid) {
      setItems([]);
      setCartLoading(false);
      return;
    }

    setCartLoading(true);

    return subscribeToCart(
      uid,
      (next) => {
        setItems(next);
        setCartLoading(false);
      },
      (error) => {
        setCartLoading(false);
        Alert.alert('Unable to Load Cart', error.message);
      }
    );
  }, [uid]);

  const lines = useMemo(
    () =>
      items.map((item) => ({
        item,
        product: products.find((product) => product.product_id === item.product_id) ?? null,
      })),
    [items, products]
  );

  const subtotal = lines.reduce(
    (sum, { item, product }) => (product ? sum + product.price * item.quantity : sum),
    0
  );
  const shipping = calculateShipping(subtotal);
  const total = subtotal + shipping;

  const hasProblem = lines.some(
    ({ item, product }) => !product || product.stock_quantity < item.quantity
  );

  const loading = !ready || cartLoading || productsLoading;

  function changeQuantity(item: CartItem, product: Product, change: number) {
    if (!uid) {
      return;
    }

    const next = item.quantity + change;

    if (next < 1) {
      return;
    }

    if (next > product.stock_quantity) {
      Alert.alert('Stock Limit', `Only ${product.stock_quantity} available.`);
      return;
    }

    setCartQuantity(uid, item.id, next).catch((error) =>
      Alert.alert('Unable to Update Cart', error.message)
    );
  }

  function handleRemove(item: CartItem) {
    if (!uid) {
      return;
    }

    removeCartItem(uid, item.id).catch((error) =>
      Alert.alert('Unable to Remove Item', error.message)
    );
  }

  function handleContinue() {
    if (hasProblem) {
      Alert.alert(
        'Check Your Cart',
        'Remove unavailable items or lower quantities that exceed stock.'
      );
      return;
    }

    router.push('/customer/checkout');
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

            <Text style={styles.headerTitle}>Cart</Text>
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

            <View style={styles.headerButton}>
              <Image
                source={require('../../../assets/icons/cart.png')}
                style={styles.headerIcon}
              />
            </View>
          </View>
        </View>

        <Text style={styles.title}>Cart</Text>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#B77C14" />
            <Text style={styles.centerText}>Loading cart...</Text>
          </View>
        ) : !uid ? (
          <View style={styles.centerBox}>
            <Text style={styles.emptyTitle}>Please sign in</Text>
            <Text style={styles.centerText}>Sign in to see your cart.</Text>
          </View>
        ) : lines.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.centerText}>Browse the catalog to add jewelry.</Text>

            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Text style={styles.browseButtonText}>Browse jewelry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.count}>
              {lines.length} {lines.length === 1 ? 'Item' : 'Items'}
            </Text>

            <View style={styles.list}>
              {lines.map(({ item, product }) => {
                const outOfStock = !!product && product.stock_quantity < item.quantity;

                return (
                  <View key={item.id} style={styles.itemCard}>
                    {product?.image_url ? (
                      <Image source={{ uri: product.image_url }} style={styles.itemImage} />
                    ) : (
                      <View style={[styles.itemImage, styles.imagePlaceholder]} />
                    )}

                    <View style={styles.itemInfo}>
                      {product ? (
                        <>
                          <Text style={styles.itemName} numberOfLines={1}>
                            {product.product_name}
                          </Text>

                          <Text style={styles.itemDetails} numberOfLines={1}>
                            {[product.purity, product.material]
                              .filter(Boolean)
                              .join(' ')}
                            {item.size ? `  •  Size ${item.size}` : ''}
                          </Text>

                          <Text style={styles.itemPrice}>
                            {formatPeso(product.price)}
                          </Text>

                          {outOfStock && (
                            <Text style={styles.warningText}>
                              {product.stock_quantity <= 0
                                ? 'Out of stock'
                                : `Only ${product.stock_quantity} left`}
                            </Text>
                          )}
                        </>
                      ) : (
                        <>
                          <Text style={styles.itemName}>Unavailable item</Text>
                          <Text style={styles.warningText}>
                            This product is no longer available.
                          </Text>
                        </>
                      )}

                      <View style={styles.itemBottom}>
                        {product ? (
                          <View style={styles.stepper}>
                            <TouchableOpacity
                              style={styles.stepperButton}
                              onPress={() => changeQuantity(item, product, -1)}
                            >
                              <Text style={styles.stepperText}>-</Text>
                            </TouchableOpacity>

                            <Text style={styles.stepperValue}>{item.quantity}</Text>

                            <TouchableOpacity
                              style={styles.stepperButton}
                              onPress={() => changeQuantity(item, product, 1)}
                            >
                              <Text style={styles.stepperText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View />
                        )}

                        <TouchableOpacity
                          onPress={() => handleRemove(item)}
                          hitSlop={10}
                        >
                          <Text style={styles.removeText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.summaryCard}>
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
              style={[styles.checkoutButton, hasProblem && styles.disabledButton]}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.checkoutButtonText}>Continue to Checkout</Text>
            </TouchableOpacity>
          </>
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

  count: {
    color: '#19191B',
    fontSize: 11,
    marginTop: 24,
    marginBottom: 12,
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

  browseButton: {
    height: 42,
    paddingHorizontal: 28,
    backgroundColor: '#050505',
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },

  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  list: {
    gap: 10,
  },

  itemCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 16,
    padding: 10,
  },

  itemImage: {
    width: 76,
    height: 76,
    borderRadius: 12,
    resizeMode: 'cover',
  },

  imagePlaceholder: {
    backgroundColor: '#D9D9D9',
  },

  itemInfo: {
    flex: 1,
  },

  itemName: {
    color: '#19191B',
    fontSize: 11,
    fontWeight: 'bold',
  },

  itemDetails: {
    color: '#77736D',
    fontSize: 10,
    marginTop: 2,
  },

  itemPrice: {
    color: '#19191B',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 6,
  },

  warningText: {
    color: '#B74242',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 3,
  },

  itemBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 8,
    height: 22,
  },

  stepperButton: {
    width: 26,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepperText: {
    color: '#19191B',
    fontSize: 12,
  },

  stepperValue: {
    minWidth: 26,
    color: '#19191B',
    fontSize: 10,
    textAlign: 'center',
  },

  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 14,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
    marginTop: 14,
  },

  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  disabledButton: {
    opacity: 0.5,
  },

  removeText: {
    color: '#B74242',
    fontSize: 10,
    fontWeight: '600',
  },
});
