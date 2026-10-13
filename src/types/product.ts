export type Product = {
  product_id: string;
  product_name: string;
  category: string;
  purity: string;
  material: string;
  price: number;
  stock_quantity: number;
  description: string;
  product_image: string | null;
  image_url: string | null;
  image_urls: string[];
  image_paths: string[];
  active: boolean;
  created_at?: unknown;
  updated_at?: unknown;
  sizes: string[]; 
};
