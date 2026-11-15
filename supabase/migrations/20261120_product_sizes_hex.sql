-- ============================================================================
-- X-VIBE-SHOP :: Migrasi varian ukuran + kode warna (idempoten, aman diulang)
--   1. products.color_hex (map nama warna -> kode hex, untuk color swatch)
--   2. products.sizes (daftar ukuran/kapasitas)
--   3. cart_items.variant_size & order_items.variant_size
--   4. Keranjang unik per (user, produk, warna, ukuran)
--   5. Helper: variant_key / variant_available / variant_apply
--   6. apply_stock_delta & create_order sadar warna + ukuran
-- Jalankan di Supabase SQL Editor setelah 20261114_product_variants.sql.
-- ============================================================================

-- 1-3. Kolom baru -------------------------------------------------------------
alter table public.products
  add column if not exists color_hex jsonb not null default '{}'::jsonb,
  add column if not exists sizes     jsonb not null default '[]'::jsonb;

alter table public.cart_items  add column if not exists variant_size text;
alter table public.order_items add column if not exists variant_size text;

-- 4. Keranjang unik per (user, produk, warna, ukuran) -------------------------
alter table public.cart_items
  drop constraint if exists cart_items_user_id_product_id_key;

create unique index if not exists cart_items_user_product_variant_idx
  on public.cart_items (
    user_id,
    product_id,
    coalesce(variant_color, ''),
    coalesce(variant_size, '')
  );

-- 5. Helper varian ------------------------------------------------------------
-- Kunci kanonik sebuah kombinasi varian, mis. "Hitam|M" atau "Hitam|".
create or replace function public.variant_key(p_color text, p_size text)
returns text
language sql
immutable
as $$
  select coalesce(nullif(btrim(p_color), ''), '') || '|' ||
         coalesce(nullif(btrim(p_size), ''), '');
$$;

-- Stok tersedia untuk sebuah kombinasi varian. Mencari kunci gabungan lebih
-- dulu, lalu warna saja / ukuran saja (kompatibel dengan data varian lama),
-- dan akhirnya jatuh ke stok total produk.
create or replace function public.variant_available(
  p_stock jsonb,
  p_color text,
  p_size text,
  p_fallback integer
)
returns integer
language plpgsql
immutable
as $$
declare
  v_color text := nullif(btrim(p_color), '');
  v_size  text := nullif(btrim(p_size), '');
  v_val   text;
begin
  if p_stock is null then
    return coalesce(p_fallback, 0);
  end if;

  v_val := p_stock ->> public.variant_key(v_color, v_size);
  if v_val is not null then return coalesce(v_val::integer, 0); end if;

  if v_color is not null then
    v_val := p_stock ->> v_color;
    if v_val is not null then return coalesce(v_val::integer, 0); end if;
  end if;

  if v_size is not null then
    v_val := p_stock ->> v_size;
    if v_val is not null then return coalesce(v_val::integer, 0); end if;
  end if;

  return coalesce(p_fallback, 0);
end;
$$;

-- Terapkan delta stok pada kunci varian yang cocok. Bila tidak ada kunci yang
-- cocok, stok varian dibiarkan (stok total produk yang berubah).
create or replace function public.variant_apply(
  p_stock jsonb,
  p_color text,
  p_size text,
  p_delta integer
)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_stock jsonb := coalesce(p_stock, '{}'::jsonb);
  v_color text := nullif(btrim(p_color), '');
  v_size  text := nullif(btrim(p_size), '');
  v_use   text;
  v_cur   integer;
begin
  if v_color is null and v_size is null then
    return v_stock;
  end if;

  if v_stock ? public.variant_key(v_color, v_size) then
    v_use := public.variant_key(v_color, v_size);
  elsif v_color is not null and v_stock ? v_color then
    v_use := v_color;
  elsif v_size is not null and v_stock ? v_size then
    v_use := v_size;
  else
    return v_stock;
  end if;

  v_cur := coalesce((v_stock ->> v_use)::integer, 0) + p_delta;
  if v_cur < 0 then v_cur := 0; end if;

  return jsonb_set(v_stock, array[v_use], to_jsonb(v_cur));
end;
$$;

-- 6a. Inti pengurangan/penambahan stok (tanpa cek auth) -----------------------
create or replace function public.apply_stock_delta(p_order_id uuid, p_sign integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select oi.product_id, oi.quantity, oi.variant_color, oi.variant_size,
           p.variant_stock
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

    if r.variant_color is not null or r.variant_size is not null then
      update public.products
         set variant_stock = public.variant_apply(
               variant_stock,
               r.variant_color,
               r.variant_size,
               case when p_sign >= 0 then r.quantity else -r.quantity end
             )
       where id = r.product_id;
    end if;
  end loop;
end;
$$;

-- 6b. create_order sadar varian warna + ukuran --------------------------------
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
  v_variant text;
  r record;
begin
  if v_uid is null then
    raise exception 'Silakan login terlebih dahulu';
  end if;

  if not exists (select 1 from public.cart_items where user_id = v_uid) then
    raise exception 'Keranjang Anda kosong';
  end if;

  perform 1
     from public.products p
     join public.cart_items c on c.product_id = p.id
    where c.user_id = v_uid
    for update of p;

  for r in
    select p.id, p.title, p.price, p.stock, p.variant_stock, c.quantity,
           c.variant_color, c.variant_size
      from public.cart_items c
      join public.products p on p.id = c.product_id
     where c.user_id = v_uid
  loop
    v_available := public.variant_available(
      r.variant_stock, r.variant_color, r.variant_size, r.stock
    );

    if r.quantity > v_available then
      v_variant := null;
      if r.variant_color is not null then v_variant := r.variant_color; end if;
      if r.variant_size is not null then
        v_variant := case
          when v_variant is null then r.variant_size
          else v_variant || ' / ' || r.variant_size
        end;
      end if;

      raise exception 'Stok "%"% tidak mencukupi (tersisa %)',
        r.title,
        case when v_variant is not null then ' (' || v_variant || ')' else '' end,
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
  if p_payment_method = 'bank_transfer' then
    v_reference := v_reference || '|VA:8808' ||
      lpad((floor(random() * 1000000000))::bigint::text, 9, '0');
  end if;

  insert into public.orders (user_id, total_amount, status, shipping_address_json, payment_reference)
  values (v_uid, v_total, 'pending', p_address, v_reference)
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, quantity, price_at_purchase, variant_color, variant_size)
  select v_order_id, c.product_id, c.quantity, p.price, c.variant_color, c.variant_size
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

-- Helper murni: jangan diekspos ke klien.
revoke all on function public.variant_key(text, text) from public, anon, authenticated;
revoke all on function public.variant_available(jsonb, text, text, integer) from public, anon, authenticated;
revoke all on function public.variant_apply(jsonb, text, text, integer) from public, anon, authenticated;
