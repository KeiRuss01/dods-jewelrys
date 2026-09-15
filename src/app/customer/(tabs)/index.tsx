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

import { getProducts } from '@/services/products';
import type { Product } from '@/types/database';

const defaultFeaturedProducts: Product[] = [
  {
    product_id: -1,
    product_name: 'Gold Solitaire Ring',
    category: 'Rings',
    purity: '18K',
    material: 'Gold',
    price: 4500,
    stock_quantity: 24,
    description: '',
    product_image: null,
    image_url: null,
  },
  {
    product_id: -2,
    product_name: 'Pearl Necklace',
    category: 'Necklaces',
    purity: '',
    material: 'Freshwater Pearl',
    price: 3200,
    stock_quantity: 12,
    description: '',
    product_image: null,
    image_url: null,
  },
];

export default function CustomerHomeScreen() {
  const [featuredProducts, setFeaturedProducts] =
    useState<Product[]>(
      defaultFeaturedProducts
    );

  const loadFeaturedProducts =
    useCallback(async () => {
      try {
        const products = await getProducts();

        const availableProducts: Product[] =
          products.filter(
            (product: Product) =>
              Number(
                product.stock_quantity
              ) > 0
          );

        if (availableProducts.length > 0) {
          setFeaturedProducts(
            availableProducts.slice(0, 2)
          );
        } else {
          setFeaturedProducts(
            defaultFeaturedProducts
          );
        }
      } catch (error) {
        console.error(
          'Featured products error:',
          error
        );

        // Keep the sample products if the API fails.
        setFeaturedProducts(
          defaultFeaturedProducts
        );
      }
    }, []);

  useFocusEffect(
    useCallback(() => {
      loadFeaturedProducts();
    }, [loadFeaturedProducts])
  );

  function showComingSoon(feature: string) {
    Alert.alert(
      feature,
      `${feature} will be connected in the next part of the development.`
    );
  }

  function getGreeting() {
    const currentHour = new Date().getHours();

    if (currentHour < 12) {
      return 'Good Morning';
    }

    if (currentHour < 18) {
      return 'Good Afternoon';
    }

    return 'Good Evening';
  }

  function openProduct(product: Product) {
    if (product.product_id < 0) {
      router.push('/customer/shop');
      return;
    }

    Alert.alert(
      product.product_name,
      product.description ||
        `${product.purity} ${product.material}`
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
              onPress={() =>
                showComingSoon(
                  'Notifications'
                )
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
              style={styles.headerButton}
              onPress={() =>
                showComingSoon('Cart')
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
          onPress={() =>
            showComingSoon('Repair Booking')
          }
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
            onPress={() =>
              showComingSoon(
                'Repair Booking'
              )
            }
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
            onPress={() =>
              showComingSoon('Orders')
            }
          >
            <Text style={styles.viewAll}>
              View All →
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusCard}>
          <View
            style={styles.itemPlaceholder}
          />

          <View
            style={styles.statusInformation}
          >
            <Text style={styles.itemName}>
              Gold Solitaire Ring
            </Text>

            <Text style={styles.orderNumber}>
              ORD-2026-002
            </Text>

            <Text style={styles.statusText}>
              Processing
            </Text>
          </View>

          <TouchableOpacity
            style={styles.smallButton}
            onPress={() =>
              showComingSoon(
                'Order Progress'
              )
            }
          >
            <Text
              style={styles.smallButtonText}
            >
              View Progress
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Current Repair
          </Text>

          <TouchableOpacity
            onPress={() =>
              showComingSoon('Repairs')
            }
          >
            <Text style={styles.viewAll}>
              View All →
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusCard}>
          <View
            style={styles.itemPlaceholder}
          />

          <View
            style={styles.statusInformation}
          >
            <Text style={styles.itemName}>
              Gold Ring Repair
            </Text>

            <Text style={styles.orderNumber}>
              REP-2026-001
            </Text>

            <Text style={styles.statusText}>
              Repair in Progress
            </Text>
          </View>

          <TouchableOpacity
            style={styles.smallButton}
            onPress={() =>
              showComingSoon(
                'Repair Progress'
              )
            }
          >
            <Text
              style={styles.smallButtonText}
            >
              View Progress
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Featured Jewelry
          </Text>

          <TouchableOpacity
            onPress={() =>
              router.push('/customer/shop')
            }
          >
            <Text style={styles.viewAll}>
              View All →
            </Text>
          </TouchableOpacity>
        </View>

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
    paddingBottom: 30,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DDD3',
    borderRadius: 14,
    padding: 14,
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

  itemPlaceholder: {
    width: 62,
    height: 62,
    borderRadius: 10,
    backgroundColor: '#DDDDDD',
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
});
