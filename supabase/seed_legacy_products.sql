-- Optional one-time import of the product rows found in the legacy MySQL
-- database on 2026-09-15. Run after the initial schema migration.

insert into public.products (
  product_id,
  product_name,
  category,
  purity,
  material,
  price,
  stock_quantity,
  description,
  product_image,
  is_active,
  created_at
) values
  (
    1,
    'Oten',
    'Necklace',
    '18k',
    'Gold',
    21000.00,
    2,
    'finest gold in the east side of west',
    'uploads/products/product_415ada6f908e9cec.jpg',
    true,
    '2026-09-13 18:44:25+08'
  ),
  (
    2,
    'Sing sing ni RENE',
    'Ring',
    '15K',
    'Golden Whit',
    12000.00,
    1,
    'Finest Rene''s RING IN THE WEST EAST SIDE',
    'uploads/products/product_66c13c04ec659cf8.png',
    true,
    '2026-09-13 23:51:22+08'
  )
on conflict (product_id) do nothing;

insert into public.product_images (
  image_id,
  product_id,
  image_path,
  is_primary,
  sort_order,
  created_at
) values
  (
    1,
    1,
    'uploads/products/product_415ada6f908e9cec.jpg',
    true,
    0,
    '2026-09-13 23:29:45+08'
  ),
  (
    2,
    2,
    'uploads/products/product_66c13c04ec659cf8.png',
    true,
    0,
    '2026-09-13 23:51:22+08'
  ),
  (
    3,
    2,
    'uploads/products/product_84b6111328bab666.jpg',
    false,
    1,
    '2026-09-13 23:51:22+08'
  )
on conflict (image_id) do nothing;

select setval(
  pg_get_serial_sequence('public.products', 'product_id'),
  greatest((select coalesce(max(product_id), 1) from public.products), 1),
  true
);

select setval(
  pg_get_serial_sequence('public.product_images', 'image_id'),
  greatest((select coalesce(max(image_id), 1) from public.product_images), 1),
  true
);
