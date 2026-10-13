import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { logout } from '@/services/auth-service';
import { createProduct } from '@/services/product-service';

export default function AddProductScreen() {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [purity, setPurity] = useState('');
  const [material, setMaterial] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [hasSizes, setHasSizes] = useState(false);
  const [sizesText, setSizesText] = useState('');
  const [productImages, setProductImages] =
    useState<ImagePicker.ImagePickerAsset[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/admin-login');
            } catch (error) {
              Alert.alert(
                'Unable to Log Out',
                error instanceof Error
                  ? error.message
                  : 'Please try again.'
              );
            }
          },
        },
      ]
    );
  }

  async function handleChooseImage() {
    if (productImages.length >= 5) {
      Alert.alert(
        'Maximum Images',
        'You can upload a maximum of five images.'
      );
      return;
    }

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photos.'
      );
      return;
    }

    const remainingSlots = 5 - productImages.length;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 0.8,
    });

    if (!result.canceled) {
      setProductImages((currentImages) => [
        ...currentImages,
        ...result.assets,
      ]);
    }
  }

  function removeImage(indexToRemove: number) {
    setProductImages((currentImages) =>
      currentImages.filter((_, index) => index !== indexToRemove)
    );
  }

  async function handleAddProduct() {
    if (
      productName.trim() === '' ||
      category.trim() === '' ||
      material.trim() === '' ||
      price.trim() === '' ||
      stock.trim() === ''
    ) {
      Alert.alert(
        'Missing Information',
        'Please complete all required product fields.'
      );
      return;
    }

    if (productImages.length === 0) {
      Alert.alert(
        'Product Image Required',
        'Please select at least one product image.'
      );
      return;
    }

    const cleanPrice = price.replace(/[₱,\s]/g, '');
    const priceNumber = Number(cleanPrice);
    const stockNumber = Number(stock);

    if (Number.isNaN(priceNumber) || priceNumber < 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price.');
      return;
    }

    if (!Number.isInteger(stockNumber) || stockNumber < 0) {
      Alert.alert(
        'Invalid Stock',
        'Please enter a valid stock quantity.'
      );
      return;
    }

    const sizes = hasSizes
      ? Array.from(
          new Set(
            sizesText
              .split(',')
              .map((size) => size.trim())
              .filter(Boolean)
          )
        )
      : [];

    if (hasSizes && sizes.length === 0) {
      Alert.alert(
        'Sizes Required',
        'Enter at least one size, e.g. 6, 7, 8.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await createProduct(
        {
          product_name: productName.trim(),
          category: category.trim(),
          purity: purity.trim(),
          material: material.trim(),
          price: priceNumber,
          stock_quantity: stockNumber,
          description: description.trim(),
          sizes,
        },
        productImages
      );

      Alert.alert('Product Added', 'The product is now available in the shop.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert(
        'Unable to Add Product',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>

            <Text style={styles.pageLabel}>Product</Text>

            <View style={styles.adminArea}>
              <Text style={styles.adminText}>Admin</Text>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() =>
                  Alert.alert(
                    'Notifications',
                    'There are no new notifications.'
                  )
                }
                activeOpacity={0.7}
              >
                <Image
                  source={require('../../../assets/icons/notification.png')}
                  style={styles.headerIcon}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Image
                  source={require('../../../assets/icons/logout.png')}
                  style={styles.headerIcon}
                />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.title}>Add Product</Text>
          <Text style={styles.sectionTitle}>Create Product</Text>

          <TouchableOpacity
            style={styles.photoContainer}
            onPress={handleChooseImage}
            activeOpacity={0.8}
          >
            <Text style={styles.photoLabel}>Product photos</Text>

            <Text style={styles.uploadText}>
              {productImages.length === 0
                ? '+ Select images'
                : '+ Add more images'}
            </Text>

            <Text style={styles.imageLimitText}>
              {productImages.length}/5 selected
            </Text>
          </TouchableOpacity>

          {productImages.length > 0 && (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imagePreviewContainer}
              >
                {productImages.map((image, index) => (
                  <View
                    style={styles.imagePreviewWrapper}
                    key={`${image.uri}-${index}`}
                  >
                    <Image
                      source={{ uri: image.uri }}
                      style={styles.productImage}
                    />

                    {index === 0 && (
                      <View style={styles.coverBadge}>
                        <Text style={styles.coverBadgeText}>Cover</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Text style={styles.removeImageText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>

              <Text style={styles.coverHint}>
                The first image will appear on product lists.
              </Text>
            </>
          )}

          <View style={styles.fieldRow}>
            <Text style={styles.label}>Product name</Text>

            <TextInput
              style={styles.input}
              value={productName}
              onChangeText={setProductName}
              placeholder="Enter product name"
              placeholderTextColor="#99958F"
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.label}>Category</Text>

            <TextInput
              style={styles.input}
              value={category}
              onChangeText={setCategory}
              placeholder="Enter product category"
              placeholderTextColor="#99958F"
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.label}>
              Purity{'\n'}Specification
            </Text>

            <TextInput
              style={styles.input}
              value={purity}
              onChangeText={setPurity}
              placeholder="Example: 18K"
              placeholderTextColor="#99958F"
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.label}>Material</Text>

            <TextInput
              style={styles.input}
              value={material}
              onChangeText={setMaterial}
              placeholder="Example: Gold"
              placeholderTextColor="#99958F"
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.label}>Price</Text>

            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="Enter product price"
              placeholderTextColor="#99958F"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.label}>Stock quantity</Text>

            <TextInput
              style={styles.input}
              value={stock}
              onChangeText={setStock}
              placeholder="Enter available quantity"
              placeholderTextColor="#99958F"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.label}>Has sizes?</Text>

            <Switch
              value={hasSizes}
              onValueChange={setHasSizes}
              trackColor={{ true: '#C58D24' }}
            />
          </View>

          {hasSizes && (
            <View style={styles.fieldRow}>
              <Text style={styles.label}>Sizes</Text>

              <TextInput
                style={styles.input}
                value={sizesText}
                onChangeText={setSizesText}
                placeholder="Example: 6, 7, 8 or S, M, L"
                placeholderTextColor="#99958F"
              />
            </View>
          )}

          <View style={styles.fieldRow}>
            <Text style={styles.label}>Description</Text>

            <TextInput
              style={[styles.input, styles.descriptionInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter product description"
              placeholderTextColor="#99958F"
              multiline
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.addButton,
              isSubmitting && styles.disabledButton,
            ]}
            onPress={handleAddProduct}
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            <Text style={styles.addButtonText}>
              {isSubmitting ? 'Adding Product...' : 'Add Product'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },

  disabledButton: {
    opacity: 0.6,
  },

  keyboardView: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 13,
    paddingBottom: 35,
  },

  topHeader: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    marginRight: 13,
  },

  backArrow: {
    color: '#19191B',
    fontSize: 28,
    lineHeight: 30,
  },

  pageLabel: {
    color: '#19191B',
    fontSize: 17,
    fontWeight: 'bold',
  },

  adminArea: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  adminText: {
    color: '#19191B',
    fontSize: 17,
    fontWeight: 'bold',
  },

  iconPlaceholder: {
    width: 23,
    height: 23,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#B8B3AA',
    backgroundColor: '#EFECE5',
  },

  title: {
    color: '#19191B',
    fontSize: 25,
    fontWeight: 'bold',
    marginTop: 20,
  },

  sectionTitle: {
    color: '#19191B',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 15,
  },

  photoContainer: {
    height: 85,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 16,
    justifyContent: 'center',
    paddingHorizontal: 15,
    marginBottom: 10,
  },

  productImage: {
    width: 105,
    height: 105,
    borderRadius: 14,
    resizeMode: 'cover',
  },

  imageLimitText: {
    color: '#99958F',
    fontSize: 9,
    marginTop: 5,
  },

  imagePreviewContainer: {
    gap: 10,
    paddingVertical: 8,
  },

  imagePreviewWrapper: {
    position: 'relative',
  },

  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  removeImageText: {
    color: '#FFFFFF',
    fontSize: 17,
    lineHeight: 19,
  },

  coverBadge: {
    position: 'absolute',
    left: 5,
    bottom: 5,
    backgroundColor: '#C58D24',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },

  coverBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },

  coverHint: {
    color: '#918C84',
    fontSize: 9,
    marginBottom: 15,
  },

  photoLabel: {
    color: '#77736D',
    fontSize: 10,
  },

  uploadText: {
    color: '#B77C14',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
  },

  fieldRow: {
    minHeight: 53,
    flexDirection: 'row',
    alignItems: 'center',
  },

  label: {
    width: 105,
    color: '#6E6A65',
    fontSize: 10,
    lineHeight: 13,
    paddingRight: 8,
  },

  input: {
    flex: 1,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED8CC',
    borderRadius: 18,
    paddingHorizontal: 14,
    color: '#19191B',
    fontSize: 11,
  },

  iconButton: {
    padding: 4,
  },

  headerIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: '#19191B',
  },

  descriptionInput: {
    height: 93,
    borderRadius: 15,
    paddingTop: 13,
  },

  addButton: {
    height: 48,
    backgroundColor: '#050505',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 35,
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
