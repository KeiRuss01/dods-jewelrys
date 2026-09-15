# Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor**, paste `migrations/20260915000000_initial_schema.sql`, and run it.
3. Copy `.env.example` to `.env`, then paste the Project URL and publishable key from the project's **Connect** panel.
4. Register the future administrator through the app once, then promote that account in SQL Editor:

   ```sql
   update public.profiles
   set role = 'admin'
   where email = 'admin@example.com';
   ```

5. Restart Expo with `npx expo start --clear`.

Supabase Auth stores passwords; `profiles` stores names, phone numbers, and roles. Existing MySQL password hashes cannot be imported into Supabase Auth, so existing users must be recreated or use a password-reset migration flow. Never place a `service_role` key in this app.

## Import the current legacy products

The legacy database currently has two products and three image records. To copy them:

1. Run `seed_legacy_products.sql` in the Supabase SQL Editor.
2. In the `product-images` Storage bucket, upload these three files from the legacy API's `uploads/products` folder and preserve the object path shown below:
   - `uploads/products/product_415ada6f908e9cec.jpg`
   - `uploads/products/product_66c13c04ec659cf8.png`
   - `uploads/products/product_84b6111328bab666.jpg`

This import is optional and does not write to or modify the PHP/MySQL project.
