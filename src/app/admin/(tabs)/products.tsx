import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminHeader } from '@/components/admin-header';
import {
  deleteProduct,
  subscribeToProducts,
  updateProduct,
} from '@/services/product-service';
import type { Product } from '@/types/product';

type EditForm = {
  productName: string;
  category: string;
  purity: string;
  material: string;
  price: string;
  stock: string;
  description: string;
};

const emptyEditForm: EditForm = {
  productName: '',
  category: '',
  purity: '',
  material: '',
  price: '',
  stock: '',
  description: '',
};

export default function AdminProductsScreen() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [search, setSearch] =
    useState('');

  const [loading, setLoading] = useState(true);

  const [editingProductId, setEditingProductId] =
    useState<string | null>(null);

  const [editForm, setEditForm] =
    useState<EditForm>(emptyEditForm);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToProducts(
      (nextProducts) => {
        setProducts(nextProducts);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        Alert.alert('Unable to Load Products', error.message);
      },
      true
    );

    return unsubscribe;
  }, []);

  const filteredProducts =
    products.filter((product) => {
      const searchText =
        search.trim().toLowerCase();

      return (
        product.product_name
          .toLowerCase()
          .includes(searchText) ||
        product.category
          .toLowerCase()
          .includes(searchText)
      );
    });

  function openEditModal(product: Product) {
    setEditingProductId(
      product.product_id
    );

    setEditForm({
      productName: product.product_name,
      category: product.category,
      purity: product.purity ?? '',
      material: product.material,
      price: String(product.price),
      stock: String(
        product.stock_quantity
      ),
      description:
        product.description ?? '',
    });
  }

  function closeEditModal() {
    if (saving) {
      return;
    }

    setEditingProductId(null);
    setEditForm(emptyEditForm);
  }

  async function handleUpdateProduct() {
    if (
      editingProductId === null ||
      editForm.productName.trim() === '' ||
      editForm.category.trim() === '' ||
      editForm.material.trim() === '' ||
      editForm.price.trim() === '' ||
      editForm.stock.trim() === ''
    ) {
      Alert.alert(
        'Missing Information',
        'Please complete all required fields.'
      );
      return;
    }

    const cleanPrice =
      editForm.price.replace(
        /[₱,\s]/g,
        ''
      );

    const priceNumber =
      Number(cleanPrice);

    const stockNumber =
      Number(editForm.stock);

    if (
      Number.isNaN(priceNumber) ||
      priceNumber < 0
    ) {
      Alert.alert(
        'Invalid Price',
        'Please enter a valid price.'
      );
      return;
    }

    if (
      !Number.isInteger(stockNumber) ||
      stockNumber < 0
    ) {
      Alert.alert(
        'Invalid Stock',
        'Please enter a valid stock quantity.'
      );
      return;
    }

    try {
      setSaving(true);
      await updateProduct(editingProductId, {
        product_name: editForm.productName.trim(),
        category: editForm.category.trim(),
        purity: editForm.purity.trim(),
        material: editForm.material.trim(),
        price: priceNumber,
        stock_quantity: stockNumber,
        description: editForm.description.trim(),
        sizes:
          products.find((product) => product.product_id === editingProductId)
            ?.sizes ?? [],
      });
      setEditingProductId(null);
      setEditForm(emptyEditForm);
      Alert.alert('Product Updated', 'Your changes were saved.');
    } catch (error) {
      Alert.alert(
        'Unable to Update Product',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(
    product: Product
  ) {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete ${product.product_name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            handleDeleteProduct(
              product
            ),
        },
      ]
    );
  }

  async function handleDeleteProduct(product: Product) {
    try {
      setDeletingId(product.product_id);
      await deleteProduct(product);
      Alert.alert('Product Deleted', 'The product was removed from the shop.');
    } catch (error) {
      Alert.alert(
        'Unable to Delete Product',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <AdminHeader />

        <Text style={styles.title}>
          Products
        </Text>

        <View
          style={styles.searchContainer}
        >
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search products"
            placeholderTextColor="#99958F"
          />

          <TouchableOpacity
            onPress={() =>
              router.push(
                '/admin/add-product'
              )
            }
          >
            <Text style={styles.addText}>
              + Add
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View
            style={styles.loadingContainer}
          >
            <ActivityIndicator
              size="large"
              color="#B77C14"
            />

            <Text
              style={styles.loadingText}
            >
              Loading products...
            </Text>
          </View>
        ) : (
          <>
            <Text
              style={styles.productCount}
            >
              {filteredProducts.length}{' '}
              Products
            </Text>

            {filteredProducts.length ===
            0 ? (
              <View
                style={styles.emptyContainer}
              >
                <Text
                  style={styles.emptyTitle}
                >
                  No products found
                </Text>

                <Text
                  style={styles.emptyText}
                >
                  Add a product or try
                  another search.
                </Text>
              </View>
            ) : (
              filteredProducts.map(
                (product) => (
                  <View
                    style={
                      styles.productCard
                    }
                    key={
                      product.product_id
                    }
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
                          styles.productImagePlaceholder,
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

                    <View
                      style={
                        styles.productInformation
                      }
                    >
                      <Text
                        style={
                          styles.productName
                        }
                      >
                        {
                          product.product_name
                        }
                      </Text>

                      <Text
                        style={
                          styles.productDetails
                        }
                      >
                        {[
                          product.purity,
                          product.material,
                          product.category,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>

                      <Text
                        style={
                          styles.productPrice
                        }
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

                      <View
                        style={
                          styles.productActions
                        }
                      >
                        <TouchableOpacity
                          onPress={() =>
                            openEditModal(
                              product
                            )
                          }
                        >
                          <Text
                            style={
                              styles.editText
                            }
                          >
                            Edit
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() =>
                            confirmDelete(
                              product
                            )
                          }
                          disabled={
                            deletingId ===
                            product.product_id
                          }
                        >
                          <Text
                            style={
                              styles.deleteText
                            }
                          >
                            {deletingId ===
                            product.product_id
                              ? 'Deleting...'
                              : 'Delete'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.stockText,
                        product.stock_quantity <=
                          3 &&
                          styles.lowStockText,
                      ]}
                    >
                      {
                        product.stock_quantity
                      }{' '}
                      in stock
                    </Text>
                  </View>
                )
              )
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={
          editingProductId !== null
        }
        transparent
        animationType="fade"
        onRequestClose={closeEditModal}
      >
        <KeyboardAvoidingView
          style={styles.modalBackground}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          <View style={styles.modalCard}>
            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
              keyboardShouldPersistTaps="handled"
            >
              <Text
                style={styles.modalTitle}
              >
                Edit Product
              </Text>

              <Text
                style={styles.modalLabel}
              >
                Product name
              </Text>

              <TextInput
                style={styles.modalInput}
                value={
                  editForm.productName
                }
                onChangeText={(value) =>
                  setEditForm(
                    (current) => ({
                      ...current,
                      productName: value,
                    })
                  )
                }
                placeholder="Enter product name"
              />

              <Text
                style={styles.modalLabel}
              >
                Category
              </Text>

              <TextInput
                style={styles.modalInput}
                value={editForm.category}
                onChangeText={(value) =>
                  setEditForm(
                    (current) => ({
                      ...current,
                      category: value,
                    })
                  )
                }
                placeholder="Enter category"
              />

              <Text
                style={styles.modalLabel}
              >
                Purity specification
              </Text>

              <TextInput
                style={styles.modalInput}
                value={editForm.purity}
                onChangeText={(value) =>
                  setEditForm(
                    (current) => ({
                      ...current,
                      purity: value,
                    })
                  )
                }
                placeholder="Example: 18K"
              />

              <Text
                style={styles.modalLabel}
              >
                Material
              </Text>

              <TextInput
                style={styles.modalInput}
                value={editForm.material}
                onChangeText={(value) =>
                  setEditForm(
                    (current) => ({
                      ...current,
                      material: value,
                    })
                  )
                }
                placeholder="Example: Gold"
              />

              <Text
                style={styles.modalLabel}
              >
                Price
              </Text>

              <TextInput
                style={styles.modalInput}
                value={editForm.price}
                onChangeText={(value) =>
                  setEditForm(
                    (current) => ({
                      ...current,
                      price: value,
                    })
                  )
                }
                keyboardType="decimal-pad"
                placeholder="Enter price"
              />

              <Text
                style={styles.modalLabel}
              >
                Stock quantity
              </Text>

              <TextInput
                style={styles.modalInput}
                value={editForm.stock}
                onChangeText={(value) =>
                  setEditForm(
                    (current) => ({
                      ...current,
                      stock: value,
                    })
                  )
                }
                keyboardType="number-pad"
                placeholder="Enter stock quantity"
              />

              <Text
                style={styles.modalLabel}
              >
                Description
              </Text>

              <TextInput
                style={[
                  styles.modalInput,
                  styles.modalDescription,
                ]}
                value={
                  editForm.description
                }
                onChangeText={(value) =>
                  setEditForm(
                    (current) => ({
                      ...current,
                      description: value,
                    })
                  )
                }
                placeholder="Enter description"
                multiline
                textAlignVertical="top"
              />

              <View
                style={styles.modalButtons}
              >
                <TouchableOpacity
                  style={
                    styles.cancelButton
                  }
                  onPress={closeEditModal}
                  disabled={saving}
                >
                  <Text
                    style={
                      styles.cancelButtonText
                    }
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    saving &&
                      styles.disabledButton,
                  ]}
                  onPress={
                    handleUpdateProduct
                  }
                  disabled={saving}
                >
                  <Text
                    style={
                      styles.saveButtonText
                    }
                  >
                    {saving
                      ? 'Saving...'
                      : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 13,
    paddingBottom: 25,
  },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  pageLabel: {
    color: '#19191B',
    fontSize: 17,
    fontWeight: 'bold',
  },

  adminArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  adminText: {
    color: '#19191B',
    fontSize: 17,
    fontWeight: 'bold',
  },

  iconButton: {
    padding: 3,
  },

  headerIcon: {
    width: 23,
    height: 23,
    resizeMode: 'contain',
    tintColor: '#19191B',
  },

  title: {
    color: '#19191B',
    fontSize: 25,
    fontWeight: 'bold',
    marginTop: 22,
  },

  searchContainer: {
    height: 45,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginTop: 28,
  },

  searchInput: {
    flex: 1,
    color: '#19191B',
    fontSize: 12,
  },

  addText: {
    color: '#B77C14',
    fontSize: 12,
    fontWeight: '600',
  },

  loadingContainer: {
    alignItems: 'center',
    marginTop: 60,
  },

  loadingText: {
    color: '#77736D',
    fontSize: 12,
    marginTop: 12,
  },

  productCount: {
    color: '#19191B',
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 21,
    marginBottom: 12,
  },

  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DED8CC',
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

  productCard: {
    minHeight: 112,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 16,
    padding: 11,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },

  productImage: {
    width: 72,
    height: 82,
    borderRadius: 11,
    resizeMode: 'cover',
  },

  productImagePlaceholder: {
    backgroundColor: '#D8D8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderText: {
    color: '#99958F',
    fontSize: 8,
  },

  productInformation: {
    flex: 1,
    alignSelf: 'stretch',
    marginLeft: 12,
    justifyContent: 'center',
  },

  productName: {
    color: '#19191B',
    fontSize: 11,
    fontWeight: 'bold',
  },

  productDetails: {
    color: '#77736D',
    fontSize: 9,
    marginTop: 4,
  },

  productPrice: {
    color: '#19191B',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 7,
  },

  productActions: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 5,
  },

  editText: {
    color: '#B77C14',
    fontSize: 10,
    fontWeight: '600',
  },

  deleteText: {
    color: '#B74242',
    fontSize: 10,
    fontWeight: '600',
  },

  stockText: {
    color: '#77736D',
    fontSize: 9,
    alignSelf: 'center',
    marginLeft: 6,
  },

  lowStockText: {
    color: '#C58D24',
  },

  modalBackground: {
    flex: 1,
    backgroundColor:
      'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },

  modalCard: {
    maxHeight: '88%',
    backgroundColor: '#FAF8F2',
    borderRadius: 24,
    padding: 22,
  },

  modalTitle: {
    color: '#19191B',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  modalLabel: {
    color: '#2A2927',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },

  modalInput: {
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 12,
    paddingHorizontal: 13,
    color: '#19191B',
    fontSize: 12,
    marginBottom: 13,
  },

  modalDescription: {
    height: 85,
    paddingTop: 12,
  },

  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },

  cancelButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: '#19191B',
    fontSize: 12,
    fontWeight: '600',
  },

  saveButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#171719',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  disabledButton: {
    opacity: 0.6,
  },
});
