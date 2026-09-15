import { supabase, requireSupabaseConfiguration } from '@/lib/supabase';

export type DashboardStats = {
  orders: number;
  repairs: number;
  products: number;
  customers: number;
  low_stock: number;
};

export type DashboardSources = {
  orders: 'database' | 'default';
  repairs: 'database' | 'default';
  products: 'database' | 'default';
  customers: 'database' | 'default';
};

export async function getDashboardStats() {
  requireSupabaseConfiguration();

  const [products, lowStock, customers] = await Promise.all([
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .lte('stock_quantity', 3),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer'),
  ]);

  const error = products.error ?? lowStock.error ?? customers.error;
  if (error) {
    throw error;
  }

  return {
    stats: {
      orders: 24,
      repairs: 8,
      products: products.count ?? 0,
      customers: customers.count ?? 0,
      low_stock: lowStock.count ?? 0,
    } satisfies DashboardStats,
    sources: {
      orders: 'default',
      repairs: 'default',
      products: 'database',
      customers: 'database',
    } satisfies DashboardSources,
  };
}
