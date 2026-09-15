export type UserRole = 'customer' | 'admin';

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  mobile_number: string | null;
  role: UserRole;
  created_at: string;
};

export type Product = {
  product_id: number;
  product_name: string;
  category: string;
  purity: string;
  material: string;
  price: number;
  stock_quantity: number;
  description: string;
  product_image: string | null;
  image_url: string | null;
  images?: string[];
  created_at?: string;
};

export type ProductInput = Pick<
  Product,
  | 'product_name'
  | 'category'
  | 'purity'
  | 'material'
  | 'price'
  | 'stock_quantity'
  | 'description'
>;
