import { File } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';

import { supabase, requireSupabaseConfiguration } from '@/lib/supabase';
import type { Product, ProductInput } from '@/types/database';

const PRODUCT_IMAGE_BUCKET = 'product-images';

type ProductImageRow = {
  image_path: string;
  is_primary: boolean;
  sort_order: number;
};

type ProductRow = Omit<Product, 'image_url' | 'images'> & {
  product_images?: ProductImageRow[] | null;
};

function publicImageUrl(path: string) {
  return supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .getPublicUrl(path).data.publicUrl;
}

function mapProduct(row: ProductRow): Product {
  const paths = (row.product_images ?? [])
    .slice()
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) {
        return a.is_primary ? -1 : 1;
      }
      return a.sort_order - b.sort_order;
    })
    .map((image) => image.image_path);

  if (paths.length === 0 && row.product_image) {
    paths.push(row.product_image);
  }

  const { product_images: _productImages, ...product } = row;
  const images = paths.map(publicImageUrl);

  return {
    ...product,
    price: Number(product.price),
    stock_quantity: Number(product.stock_quantity),
    images,
    image_url: images[0] ?? null,
  };
}

export async function getProducts(): Promise<Product[]> {
  requireSupabaseConfiguration();

  const { data, error } = await supabase
    .from('products')
    .select(
      'product_id, product_name, category, purity, material, price, stock_quantity, description, product_image, created_at, product_images(image_path, is_primary, sort_order)'
    )
    .eq('is_active', true)
    .order('product_id', { ascending: false });

  if (error) {
    throw error;
  }

  return (data as ProductRow[]).map(mapProduct);
}

function extensionFor(asset: ImagePickerAsset) {
  const fromName = asset.fileName?.split('.').pop()?.toLowerCase();
  if (fromName && ['jpg', 'jpeg', 'png', 'webp'].includes(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName;
  }

  if (asset.mimeType === 'image/png') return 'png';
  if (asset.mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

export async function createProduct(
  input: ProductInput,
  assets: ImagePickerAsset[]
) {
  requireSupabaseConfiguration();

  const { data: product, error: productError } = await supabase
    .from('products')
    .insert(input)
    .select('product_id')
    .single();

  if (productError) {
    throw productError;
  }

  const uploadedPaths: string[] = [];

  try {
    for (const [index, asset] of assets.entries()) {
      const extension = extensionFor(asset);
      const path = `${product.product_id}/${Date.now()}-${index}-${Math.random()
        .toString(36)
        .slice(2)}.${extension}`;
      const bytes = await new File(asset.uri).arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(path, bytes, {
          contentType: asset.mimeType ?? `image/${extension}`,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      uploadedPaths.push(path);
    }

    const { error: imagesError } = await supabase.from('product_images').insert(
      uploadedPaths.map((imagePath, index) => ({
        product_id: product.product_id,
        image_path: imagePath,
        is_primary: index === 0,
        sort_order: index,
      }))
    );

    if (imagesError) {
      throw imagesError;
    }

    const { error: coverError } = await supabase
      .from('products')
      .update({ product_image: uploadedPaths[0] })
      .eq('product_id', product.product_id);

    if (coverError) {
      throw coverError;
    }

    return product.product_id as number;
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(uploadedPaths);
    }
    await supabase.from('products').delete().eq('product_id', product.product_id);
    throw error;
  }
}

export async function updateProduct(productId: number, input: ProductInput) {
  requireSupabaseConfiguration();

  const { error } = await supabase
    .from('products')
    .update(input)
    .eq('product_id', productId)
    .eq('is_active', true);

  if (error) {
    throw error;
  }
}

export async function archiveProduct(productId: number) {
  requireSupabaseConfiguration();

  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('product_id', productId);

  if (error) {
    throw error;
  }
}
