import {
  useFocusEffect,
} from 'expo-router';
import {
  useCallback,
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

import { getProducts } from '@/services/products';
import type { Product } from '@/types/database';

type SortOption =
  | 'Newest'
  | 'Lowest Price'
  | 'Highest Price';

export default function CustomerShopScreen() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [search, setSearch] =
    useState('');

  const [selectedCategory, setSelectedCategory] =
    useState('All');

  const [sortOption, setSortOption] =
    useState<SortOption>('Newest');

  const [loading, setLoading] =
    useState(true);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);

      setProducts(await getProducts());
    } catch (error) {
      console.error(
        'Shop loading error:',
        error
      );

      Alert.alert(
        'Unable to Load Products',
        error instanceof Error
          ? error.message
          : 'Could not load products from Supabase.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  const categories = useMemo(() => {
    const productCategories =
      products
        .map((product) => product.category)
        .filter(Boolean);

    return [
      'All',
      ...Array.from(
        new Set(productCategories)
      ),
    ];
  }, [products]);

  const visibleProducts = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    const filtered = products.filter(
      (product) => {
        const matchesSearch =
          product.product_name
            .toLowerCase()
            .includes(searchText) ||
          product.category
            .toLowerCase()
            .includes(searchText);

        const matchesCategory =
          selectedCategory === 'All' ||
          product.category ===
            selectedCategory;

        return (
          matchesSearch &&
          matchesCategory
        );
      }
    );

    return [...filtered].sort((a, b) => {
      if (sortOption === 'Lowest Price') {
        return Number(a.price) - Number(b.price);
      }

      if (sortOption === 'Highest Price') {
        return Number(b.price) - Number(a.price);
      }

      return b.product_id - a.product_id;
    });
  }, [
    products,
    search,
    selectedCategory,
    sortOption,
  ]);

  function changeSortOption() {
    if (sortOption === 'Newest') {
      setSortOption('Lowest Price');
      return;
    }

    if (sortOption === 'Lowest Price') {
      setSortOption('Highest Price');
      return;
    }

    setSortOption('Newest');
  }

  function handleNotifications() {
    Alert.alert(
      'Notifications',
      'Notifications will be added later.'
    );
  }

  function handleCart() {
    Alert.alert(
      'Cart',
      'The shopping cart will be connected next.'
    );
  }

  function handleProduct(product: Product) {
    Alert.alert(
      product.product_name,
      product.description ||
        'Product details will be added later.'
    );
  }

  function handleAddToCart(product: Product) {
    if (product.stock_quantity <= 0) {
      Alert.alert(
        'Out of Stock',
        'This product is currently unavailable.'
      );
      return;
    }

    Alert.alert(
      'Cart',
      `${product.product_name} will be added after the cart database is created.`
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
            Shop
          </Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleNotifications}
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
              onPress={handleCart}
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

        <Text style={styles.title}>
          Jewelry Catalog
        </Text>

        <View style={styles.searchContainer}>
          <Text style={styles.searchSymbol}>
            ⌕
          </Text>

          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search jewelry"
            placeholderTextColor="#99958F"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={
            styles.categoryContainer
          }
        >
          {categories.map((category) => {
            const isSelected =
              selectedCategory === category;

            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  isSelected &&
                    styles.activeCategoryButton,
                ]}
                onPress={() =>
                  setSelectedCategory(category)
                }
              >
                <Text
                  style={[
                    styles.categoryText,
                    isSelected &&
                      styles.activeCategoryText,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.productHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              All Products
            </Text>

            <Text style={styles.productCount}>
              {visibleProducts.length} Items
            </Text>
          </View>

          <View style={styles.sortArea}>
            <Text style={styles.sortLabel}>
              Sort by
            </Text>

            <TouchableOpacity
              style={styles.sortButton}
              onPress={changeSortOption}
            >
              <Text style={styles.sortButtonText}>
                {sortOption}⌄
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color="#B77C14"
            />

            <Text style={styles.loadingText}>
              Loading jewelry...
            </Text>
          </View>
        ) : visibleProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              No products found
            </Text>

            <Text style={styles.emptyText}>
              Try another search or category.
            </Text>
          </View>
        ) : (
          <View style={styles.productGrid}>
            {visibleProducts.map((product) => (
              <TouchableOpacity
                key={product.product_id}
                style={styles.productCard}
                activeOpacity={0.8}
                onPress={() =>
                  handleProduct(product)
                }
              >
                {product.image_url ? (
                  <Image
                    source={{
                      uri: product.image_url,
                    }}
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
                      style={
                        styles.imagePlaceholderText
                      }
                    >
                      IMAGE
                    </Text>
                  </View>
                )}

                <View style={styles.productInfo}>
                  <Text
                    style={styles.productName}
                    numberOfLines={1}
                  >
                    {product.product_name}
                  </Text>

                  <Text
                    style={styles.productDetails}
                    numberOfLines={1}
                  >
                    {[
                      product.purity,
                      product.material,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  </Text>

                  <View
                    style={styles.productBottom}
                  >
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

                    <TouchableOpacity
                      onPress={() =>
                        handleAddToCart(product)
                      }
                      disabled={
                        product.stock_quantity <= 0
                      }
                    >
                      <Image
                        source={require(
                          '../../../../assets/icons/cart.png'
                        )}
                        style={[
                          styles.productCartIcon,
                          product.stock_quantity <=
                            0 &&
                            styles.disabledIcon,
                        ]}
                      />
                    </TouchableOpacity>
                  </View>

                  {product.stock_quantity <= 0 && (
                    <Text
                      style={styles.outOfStockText}
                    >
                      Out of stock
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
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

  title: {
    color: '#19191B',
    fontSize: 23,
    fontWeight: 'bold',
    marginTop: 18,
  },

  searchContainer: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    marginTop: 28,
  },

  searchSymbol: {
    color: '#77736D',
    fontSize: 21,
    marginRight: 7,
  },

  searchInput: {
    flex: 1,
    color: '#19191B',
    fontSize: 12,
  },

  categoryContainer: {
    gap: 7,
    paddingTop: 17,
    paddingBottom: 5,
  },

  categoryButton: {
    minWidth: 52,
    height: 27,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
  },

  activeCategoryButton: {
    backgroundColor: '#050505',
    borderColor: '#050505',
  },

  categoryText: {
    color: '#6E6A65',
    fontSize: 9,
  },

  activeCategoryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 21,
    marginBottom: 14,
  },

  sectionTitle: {
    color: '#19191B',
    fontSize: 17,
    fontWeight: 'bold',
  },

  productCount: {
    color: '#918C84',
    fontSize: 11,
    marginTop: 3,
  },

  sortArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  sortLabel: {
    color: '#19191B',
    fontSize: 11,
    fontWeight: '600',
  },

  sortButton: {
    minHeight: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  sortButtonText: {
    color: '#6E6A65',
    fontSize: 8,
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

  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 16,
    alignItems: 'center',
    padding: 30,
  },

  emptyTitle: {
    color: '#19191B',
    fontSize: 15,
    fontWeight: 'bold',
  },

  emptyText: {
    color: '#77736D',
    fontSize: 11,
    marginTop: 5,
  },

  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },

  productCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 16,
    overflow: 'hidden',
  },

  productImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },

  imagePlaceholder: {
    backgroundColor: '#D8D4C3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  imagePlaceholderText: {
    color: '#99958F',
    fontSize: 9,
  },

  productInfo: {
    padding: 9,
  },

  productName: {
    color: '#19191B',
    fontSize: 11,
    fontWeight: 'bold',
  },

  productDetails: {
    color: '#77736D',
    fontSize: 9,
    marginTop: 3,
  },

  productBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 7,
  },

  productPrice: {
    color: '#19191B',
    fontSize: 11,
    fontWeight: 'bold',
    flex: 1,
  },

  productCartIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    tintColor: '#19191B',
  },

  disabledIcon: {
    opacity: 0.3,
  },

  outOfStockText: {
    color: '#B74242',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 4,
  },
});
