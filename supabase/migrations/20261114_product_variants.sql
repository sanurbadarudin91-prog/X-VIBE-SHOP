-- ============================================================================
-- X-VIBE-SHOP :: Migrasi fitur produk lanjutan (idempoten, aman dijalankan
-- berulang). Isi:
--   1. Kolom produk: caption, images, colors, variant_stock
--   2. Kolom varian pada cart_items & order_items
--   3. Keranjang unik per (user, produk, warna)
--   4. Fungsi apply_stock_delta & create_order yang sadar varian warna
-- Jalankan di Supabase SQL Editor (atau psql). Lihat supabase/schema.sql untuk
-- versi lengkap dari awal.
-- ============================================================================

-- 1. Kolom produk ------------------------------------------------------------
alter table public.products
  add column if not exists caption       text,
  add column if not exists images        jsonb not null default '[]'::jsonb,
  add column if not exists colors        jsonb not null default '[]'::jsonb,
  add column if not exists variant_stock jsonb not null default '{}'::jsonb;

-- 2. Kolom varian pada item ------------------------------------------------
alter table public.cart_items
  add column if not exists variant_color text;

alter table public.order_items
  add column if not exists variant_color text;

-- 3. Keranjang unik per (user, produk, warna) -------------------------------
alter table public.cart_items
  drop constraint if exists cart_items_user_id_product_id_key;

create unique index if not exists cart_items_user_product_variant_idx
  on public.cart_items (user_id, product_id, coalesce(variant_color, ''));

-- 4. Fungsi sadar varian ----------------------------------------------------
create or replace function public.apply_stock_delta(p_order_id uuid, p_sign integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_new integer;
begin
  for r in
    select oi.product_id, oi.quantity, oi.variant_color, p.variant_stock
      from public.order_items oi
      join public.products p on p.id = oi.product_id
     where oi.order_id = p_order_id
       and oi.product_id is not null
  loop
    if p_sign >= 0 then
      update public.products
         set stock = stock + r.quantity
       where id = r.product_id;
    else
      update public.products
         set stock = greatest(stock - r.quantity, 0)
       where id = r.product_id;
    end if;

    -- Selaraskan stok per varian warna bila warna item terdaftar di produk.
    if r.variant_color is not null and jsonb_exists(r.variant_stock, r.variant_color) then
      v_new := coalesce((r.variant_stock ->> r.variant_color)::integer, 0) +
               (case when p_sign >= 0 then r.quantity else -r.quantity end);
      if v_new < 0 then
        v_new := 0;
      end if;
      update public.products
         set variant_stock = jsonb_set(
               variant_stock,
               array[r.variant_color],
               to_jsonb(v_new)
             )
       where id = r.product_id;
    end if;
  end loop;
end;
$$;

create or replace function public.create_order(
  p_address jsonb,
  p_payment_method text,
  p_user_voucher_id uuid default null
)
returns table (order_id uuid, payment_reference text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_total numeric := 0;
  v_order_id uuid;
  v_reference text;
  v_voucher record;
  v_voucher_id uuid;
  v_available integer;
  r record;
begin
  if v_uid is null then
    raise exception 'Silakan login terlebih dahulu';
  end if;

  if not exists (select 1 from public.cart_items where user_id = v_uid) then
    raise exception 'Keranjang Anda kosong';
  end if;

  -- Kunci baris produk yang relevan untuk mencegah perebutan stok.
  perform 1
     from public.products p
     join public.cart_items c on c.product_id = p.id
    where c.user_id = v_uid
    for update of p;

  for r in
    select p.id, p.title, p.price, p.stock, p.variant_stock, c.quantity,
           c.variant_color
      from public.cart_items c
      join public.products p on p.id = c.product_id
     where c.user_id = v_uid
  loop
    -- Bila varian warna dipilih dan produk punya stok per warna, validasi stok
    -- varian tersebut; jika tidak, jatuh ke stok total produk.
    if r.variant_color is not null and jsonb_exists(r.variant_stock, r.variant_color) then
      v_available := coalesce((r.variant_stock ->> r.variant_color)::integer, 0);
    else
      v_available := r.stock;
    end if;

    if r.quantity > v_available then
      raise exception 'Stok "%"% tidak mencukupi (tersisa %)',
        r.title,
        case when r.variant_color is not null then ' warna ' || r.variant_color else '' end,
        v_available;
    end if;
    v_subtotal := v_subtotal + r.price * r.quantity;
  end loop;

  if p_user_voucher_id is not null then
    select uv.id, v.discount_type, v.discount_value, v.min_purchase, v.is_active,
           v.expiry_date
      into v_voucher
      from public.user_vouchers uv
      join public.vouchers v on v.id = uv.voucher_id
     where uv.id = p_user_voucher_id
       and uv.user_id = v_uid
       and uv.is_used = false
       and v.is_active = true
       and (v.expiry_date is null or v.expiry_date >= now());

    if found and v_subtotal >= v_voucher.min_purchase then
      if v_voucher.discount_type = 'percentage' then
        v_discount := round(v_subtotal * v_voucher.discount_value / 100);
      else
        v_discount := v_voucher.discount_value;
      end if;
      v_discount := least(v_discount, v_subtotal);
      v_voucher_id := v_voucher.id;
    end if;
  end if;

  v_total := greatest(v_subtotal - v_discount, 0);
  v_reference := 'XV-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));
  -- Placeholder gateway: sertakan nomor Virtual Account untuk transfer bank.
  if p_payment_method = 'bank_transfer' then
    v_reference := v_reference || '|VA:8808' ||
      lpad((floor(random() * 1000000000))::bigint::text, 9, '0');
  end if;

  insert into public.orders (user_id, total_amount, status, shipping_address_json, payment_reference)
  values (v_uid, v_total, 'pending', p_address, v_reference)
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, quantity, price_at_purchase, variant_color)
  select v_order_id, c.product_id, c.quantity, p.price, c.variant_color
    from public.cart_items c
    join public.products p on p.id = c.product_id
   where c.user_id = v_uid;

  if v_voucher_id is not null then
    update public.user_vouchers set is_used = true where id = v_voucher_id;
  end if;

  delete from public.cart_items where user_id = v_uid;

  return query select v_order_id, v_reference;
end;
$$;

-- 5. Bucket storage + policy (aman diulang) ---------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read" on storage.objects
  for select using (bucket_id in ('product-images', 'avatars'));

drop policy if exists "storage_admin_write_products" on storage.objects;
create policy "storage_admin_write_products" on storage.objects
  for all to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
