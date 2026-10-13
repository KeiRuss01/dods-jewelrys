import { File } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';
import { Platform } from 'react-native';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import { firestore } from '../../firebaseConfig';
import { supabaseStorage } from '../lib/supabase-storage';
import type { Product } from '../types/product';

const PRODUCT_BUCKET = 'product-images';
const PRODUCTS_COLLECTION = 'products';

export type ProductInput = {
  product_name: string;
  category: string;
  purity: string;
  material: string;
  price: number;
  stock_quantity: number;
  description: string;
  // Empty array = this product has no size concept (earrings, pendants, etc.)
  sizes: string[];
};

type UploadedImage = { path: string; url: string };

function productFromDocument(id: string, data: Record<string, unknown>): Product {
  const imageUrls = Array.isArray(data.image_urls)
    ? (data.image_urls as string[])
    : Array.isArray(data.imageUrls)
      ? (data.imageUrls as string[])
      : [];

  return {
    product_id: id,
    product_name: String(data.product_name ?? data.name ?? ''),
    category: String(data.category ?? ''),
    purity: String(data.purity ?? ''),
    material: String(data.material ?? ''),
    price: Number(data.price ?? 0),
    stock_quantity: Number(data.stock_quantity ?? data.stock ?? 0),
    description: String(data.description ?? ''),
    sizes: Array.isArray(data.sizes)
      ? (data.sizes as unknown[]).map(String)
      : [],
    product_image: null,
    image_url: String(data.image_url ?? imageUrls[0] ?? '') || null,
    image_urls: imageUrls,
    image_paths: Array.isArray(data.image_paths)
      ? (data.image_paths as string[])
      : Array.isArray(data.imagePaths)
        ? (data.imagePaths as string[])
        : [],
    active: data.active !== false,
    created_at: data.created_at ?? data.createdAt,
    updated_at: data.updated_at ?? data.updatedAt,
  };
}

function createdTime(product: Product) {
  const timestamp = product.created_at as { toMillis?: () => number } | undefined;
  return timestamp?.toMillis?.() ?? 0;
}

async function imageBytes(asset: ImagePickerAsset) {
  if (Platform.OS === 'web') {
    const response = await fetch(asset.uri);
    return response.arrayBuffer();
  }

  return new File(asset.uri).arrayBuffer();
}

async function uploadProductImage(
  asset: ImagePickerAsset,
  index: number
): Promise<UploadedImage> {
  const candidate = asset.fileName?.split('.').pop()?.toLowerCase();
  const extension = candidate && ['jpg', 'jpeg', 'png', 'webp'].includes(candidate)
    ? candidate
    : 'jpg';
  const filePath = `products/${Date.now()}-${index}-${Math.random()
    .toString(36)
    .slice(2)}.${extension}`;

  const { error } = await supabaseStorage.storage
    .from(PRODUCT_BUCKET)
    .upload(filePath, await imageBytes(asset), {
      contentType:
        asset.mimeType ??
        (extension === 'png'
          ? 'image/png'
          : extension === 'webp'
            ? 'image/webp'
            : 'image/jpeg'),
      upsert: false,
    });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data } = supabaseStorage.storage
    .from(PRODUCT_BUCKET)
    .getPublicUrl(filePath);

  return { path: filePath, url: data.publicUrl };
}

export async function createProduct(
  product: ProductInput,
  selectedImages: ImagePickerAsset[]
) {
  const uploadedImages: UploadedImage[] = [];

  try {
    for (let index = 0; index < selectedImages.length; index += 1) {
      uploadedImages.push(await uploadProductImage(selectedImages[index], index));
    }

    const productDocument = await addDoc(collection(firestore, PRODUCTS_COLLECTION), {
      ...product,
      image_url: uploadedImages[0]?.url ?? null,
      image_urls: uploadedImages.map((image) => image.url),
      image_paths: uploadedImages.map((image) => image.path),
      active: true,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    return productDocument.id;
  } catch (error) {
    if (uploadedImages.length > 0) {
      await supabaseStorage.storage
        .from(PRODUCT_BUCKET)
        .remove(uploadedImages.map((image) => image.path));
    }
    throw error;
  }
}

export function subscribeToProducts(
  onProducts: (products: Product[]) => void,
  onError: (error: Error) => void,
  includeInactive = false
) {
  return onSnapshot(
    collection(firestore, PRODUCTS_COLLECTION),
    (snapshot) => {
      onProducts(
        snapshot.docs
          .map((item) => productFromDocument(item.id, item.data()))
          .filter((product) => includeInactive || product.active)
          .sort((a, b) => createdTime(b) - createdTime(a))
      );
    },
    (error) => onError(error)
  );
}

export async function getProducts() {
  const snapshot = await getDocs(collection(firestore, PRODUCTS_COLLECTION));
  return snapshot.docs
    .map((item) => productFromDocument(item.id, item.data()))
    .filter((product) => product.active)
    .sort((a, b) => createdTime(b) - createdTime(a));
}

export async function updateProduct(productId: string, product: ProductInput) {
  await updateDoc(doc(firestore, PRODUCTS_COLLECTION, productId), {
    ...product,
    updated_at: serverTimestamp(),
  });
}

export async function deleteProduct(product: Product) {
  await deleteDoc(doc(firestore, PRODUCTS_COLLECTION, product.product_id));

  if (product.image_paths.length > 0) {
    const { error } = await supabaseStorage.storage
      .from(PRODUCT_BUCKET)
      .remove(product.image_paths);

    if (error) {
      console.warn('Product deleted, but its stored images could not be removed.', error);
    }
  }
}