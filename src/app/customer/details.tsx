import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUid } from '@/hooks/use-uid';
import { addToCart } from '@/services/cart-service';
import { subscribeToProducts } from '@/services/product-service';
import type { Product } from '@/types/product';

export default function CustomerProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const { uid } = useUid();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    return subscribeToProducts(
      (products) => {
        setProduct(
          products.find((item) => item.product_id === id) ?? null
        );
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        Alert.alert('Unable to Load Product', error.message);
      }
    );
  }, [id]);

  const sizes = product?.sizes ?? [];
  const outOfStock = !product || product.stock_quantity <= 0;

  const images =
    product && product.image_urls.length > 0
      ? product.image_urls
      : product?.image_url
        ? [product.image_url]
        : [];

  function showComingSoon(feature: string) {
    Alert.alert(
      feature,
      `${feature} will be connected in the next part of the development.`
    );
  }

  function handleImageScroll(
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) {
    setImageIndex(
      Math.round(event.nativeEvent.contentOffset.x / width)
    );
  }

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  function increaseQuantity() {
    if (!product) {
      return;
    }

    if (quantity >= product.stock_quantity) {
      Alert.alert(
        'Stock Limit',
        `Only ${product.stock_quantity} available.`
      );
      return;
    }

    setQuantity((current) => current + 1);
  }

  function validateSelection() {
    if (outOfStock) {
      Alert.alert(
        'Out of Stock',
        'This product is currently unavailable.'
      );
      return false;
    }

    if (sizes.length > 0 && !selectedSize) {
      Alert.alert('Select a Size', 'Please choose a size first.');
      return false;
    }

    if (!uid) {
      Alert.alert('Please Sign In', 'Sign in to add items to your cart.');
      return false;
    }

    return true;
  }

  /** Adds the selection to the cart and returns the cart item id, or null on failure. */
  async function addSelectionToCart() {
    if (!product || !uid || adding) {
      return null;
    }

    try {
      setAdding(true);
      return await addToCart(uid, product, selectedSize, quantity);
    } catch (error) {
      Alert.alert(
        'Unable to Add to Cart',
        error instanceof Error ? error.message : 'Please try again.'
      );
      return null;
    } finally {
      setAdding(false);
    }
  }

  async function handleAddToCart() {
    if (!product || !validateSelection()) {
      return;
    }

    const itemId = await addSelectionToCart();

    if (itemId) {
      Alert.alert('Added to Cart', `${product.product_name} was added to your cart.`, [
        { text: 'Keep Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => router.push('/customer/cart') },
      ]);
    }
  }

  async function handleBuyNow() {
    if (!product || !validateSelection()) {
      return;
    }

    const itemId = await addSelectionToCart();

    if (itemId) {
      // Checks out only this item, not the rest of the cart
      router.push({
        pathname: '/customer/checkout',
        params: { only: itemId },
      });
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topSection}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.backIcon}>
                ‹
              </Text>
            </TouchableOpacity>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => showComingSoon('Notifications')}
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

          <Text style={styles.title}>
            Jewelry Details
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#B77C14" />

            <Text style={styles.loadingText}>
              Loading jewelry...
            </Text>
          </View>
        ) : !product ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.emptyTitle}>
              Product not found
            </Text>

            <Text style={styles.loadingText}>
              This product may no longer be available.
            </Text>
          </View>
        ) : (
          <>
            {images.length > 0 ? (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleImageScroll}
              >
                {images.map((uri) => (
                  <View key={uri} style={{ width }}>
                    <Image
                      source={{ uri }}
                      style={styles.productImage}
                    />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View
                style={[styles.productImage, styles.imagePlaceholder]}
              >
                <Text style={styles.placeholderText}>
                  IMAGE
                </Text>
              </View>
            )}

            {images.length > 1 && (
              <View style={styles.dots}>
                {images.map((uri, index) => (
                  <View
                    key={uri}
                    style={[
                      styles.dot,
                      index === imageIndex && styles.activeDot,
                    ]}
                  />
                ))}
              </View>
            )}

            <View style={styles.sheet}>
              <Text style={styles.productName}>
                {product.product_name}
              </Text>

              <Text style={styles.productPrice}>
                ₱
                {Number(product.price).toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>

              <Text style={styles.productDetails}>
                {[product.purity, product.material]
                  .filter(Boolean)
                  .join(' ')}
              </Text>

              {product.description ? (
                <View style={styles.descriptionBox}>
                  <Text style={styles.descriptionText}>
                    {product.description}
                  </Text>
                </View>
              ) : null}

              {sizes.length > 0 && (
                <>
                  <Text style={styles.label}>
                    Select Size
                  </Text>

                  <View style={styles.sizeRow}>
                    {sizes.map((size) => {
                      const isSelected = selectedSize === size;

                      return (
                        <TouchableOpacity
                          key={size}
                          style={[
                            styles.sizeButton,
                            isSelected && styles.activeSizeButton,
                          ]}
                          onPress={() => setSelectedSize(size)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.sizeText,
                              isSelected && styles.activeSizeText,
                            ]}
                          >
                            {size}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              <View style={styles.quantityRow}>
                <View>
                  <Text style={styles.label}>
                    Quantity
                  </Text>

                  {outOfStock && (
                    <Text style={styles.outOfStockText}>
                      Out of stock
                    </Text>
                  )}
                </View>

                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={decreaseQuantity}
                    disabled={outOfStock}
                  >
                    <Text style={styles.stepperText}>
                      -
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.stepperValue}>
                    {quantity}
                  </Text>

                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={increaseQuantity}
                    disabled={outOfStock}
                  >
                    <Text style={styles.stepperText}>
                      +
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.cartButton,
                    (outOfStock || adding) && styles.disabledButton,
                  ]}
                  onPress={handleAddToCart}
                  activeOpacity={0.8}
                  disabled={adding}
                >
                  <Text style={styles.cartButtonText}>
                    {adding ? 'Adding...' : 'Add to Cart'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.buyButton,
                    (outOfStock || adding) && styles.disabledButton,
                  ]}
                  onPress={handleBuyNow}
                  activeOpacity={0.8}
                  disabled={adding}
                >
                  <Text style={styles.buyButtonText}>
                    Buy Now
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
    paddingBottom: 20,
  },

  topSection: {
    paddingHorizontal: 18,
    paddingTop: 12,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 35,
    height: 35,
    justifyContent: 'center',
  },

  backIcon: {
    color: '#19191B',
    fontSize: 36,
    lineHeight: 38,
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

  loadingContainer: {
    alignItems: 'center',
    marginTop: 70,
  },

  loadingText: {
    color: '#77736D',
    fontSize: 12,
    marginTop: 12,
  },

  emptyTitle: {
    color: '#19191B',
    fontSize: 15,
    fontWeight: 'bold',
  },

  productImage: {
    width: '100%',
    height: 270,
    resizeMode: 'contain',
  },

  imagePlaceholder: {
    backgroundColor: '#D8D4C3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderText: {
    color: '#99958F',
    fontSize: 9,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 14,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E2C98F',
  },

  activeDot: {
    backgroundColor: '#C58D24',
  },

  sheet: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2DDD3',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 14,
  },

  productName: {
    color: '#19191B',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  productPrice: {
    color: '#C58D24',
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 14,
  },

  productDetails: {
    color: '#8A857E',
    fontSize: 12,
    marginTop: 4,
  },

  descriptionBox: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#C58D24',
    paddingVertical: 10,
    marginTop: 14,
  },

  descriptionText: {
    color: '#19191B',
    fontSize: 11,
    lineHeight: 16,
  },

  label: {
    color: '#19191B',
    fontSize: 11,
    fontWeight: '600',
  },

  sizeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },

  sizeButton: {
    minWidth: 40,
    height: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  activeSizeButton: {
    backgroundColor: '#050505',
    borderColor: '#050505',
  },

  sizeText: {
    color: '#19191B',
    fontSize: 10,
    fontWeight: '600',
  },

  activeSizeText: {
    color: '#FFFFFF',
  },

  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },

  outOfStockText: {
    color: '#B74242',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 3,
  },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 14,
    height: 28,
  },

  stepperButton: {
    width: 32,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepperText: {
    color: '#19191B',
    fontSize: 14,
  },

  stepperValue: {
    minWidth: 30,
    color: '#19191B',
    fontSize: 11,
    textAlign: 'center',
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },

  cartButton: {
    flex: 1,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C58D24',
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cartButtonText: {
    color: '#19191B',
    fontSize: 11,
    fontWeight: 'bold',
  },

  buyButton: {
    flex: 1,
    height: 42,
    backgroundColor: '#050505',
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  disabledButton: {
    opacity: 0.4,
  },
});