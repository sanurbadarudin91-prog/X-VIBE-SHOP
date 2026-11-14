-- ============================================================================
-- X-VIBE-SHOP  ::  Database Schema (Supabase / PostgreSQL)
-- ============================================================================
-- Jalankan file ini sekali pada project Supabase:
--   psql "postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres" -f schema.sql
-- atau tempel ke Supabase SQL Editor.
-- File ini idempoten (aman dijalankan berulang).
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. PROFILES
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  avatar_url  text,
  phone       text,
  role        text not null default 'customer'
              check (role in ('customer', 'admin')),
  created_at  timestamptz not null default now()
);

comment on table public.profiles is 'Data profil publik user, 1-1 dengan auth.users';

-- ---------------------------------------------------------------------------
-- 2. ADDRESSES  (multi-address per user)
-- ---------------------------------------------------------------------------
create table if not exists public.addresses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  recipient_name  text not null,
  phone_number    text not null,
  street_address  text not null,
  city            text not null,
  postal_code     text not null,
  is_default      boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists addresses_user_id_idx on public.addresses (user_id);

-- Hanya boleh ada satu alamat default per user.
create unique index if not exists addresses_one_default_per_user_idx
  on public.addresses (user_id) where (is_default);

-- ---------------------------------------------------------------------------
-- 3. PRODUCTS
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  caption     text,
  price       numeric(14, 2) not null default 0 check (price >= 0),
  stock       integer not null default 0 check (stock >= 0),
  category    text not null default 'Apparel',
  image_url   text,
  images      jsonb not null default '[]'::jsonb,
  colors      jsonb not null default '[]'::jsonb,
  variant_stock jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_created_at_idx on public.products (created_at desc);

-- Kolom lanjutan produk: galeri multi-foto, caption kaya, varian warna & stok
-- per warna (idempoten untuk DB yang sudah ada).
alter table public.products
  add column if not exists caption       text,
  add column if not exists images        jsonb not null default '[]'::jsonb,
  add column if not exists colors        jsonb not null default '[]'::jsonb,
  add column if not exists variant_stock jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- 4. CART_ITEMS
-- ---------------------------------------------------------------------------
create table if not exists public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  quantity    integer not null default 1 check (quantity > 0),
  created_at  timestamptz not null default now()
);

create index if not exists cart_items_user_id_idx on public.cart_items (user_id);

-- Varian warna pada item keranjang (idempoten).
alter table public.cart_items
  add column if not exists variant_color text;

-- Satu baris per (user, produk, warna). Batasan unik lama (user, product)
-- dihapus agar satu produk bisa masuk dengan beberapa warna berbeda.
alter table public.cart_items
  drop constraint if exists cart_items_user_id_product_id_key;

create unique index if not exists cart_items_user_product_variant_idx
  on public.cart_items (user_id, product_id, coalesce(variant_color, ''));

-- ---------------------------------------------------------------------------
-- 5. ORDERS
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users (id) on delete restrict,
  total_amount           numeric(14, 2) not null default 0 check (total_amount >= 0),
  status                 text not null default 'pending'
                         check (status in ('pending', 'paid', 'shipped', 'completed', 'cancelled')),
  shipping_address_json  jsonb,
  payment_reference      text,
  created_at             timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- Kolom integrasi Midtrans (idempoten untuk DB yang sudah ada).
alter table public.orders
  add column if not exists payment_provider text,
  add column if not exists midtrans_order_id text,
  add column if not exists snap_token text,
  add column if not exists paid_at timestamptz;

create unique index if not exists orders_midtrans_order_id_idx
  on public.orders (midtrans_order_id)
  where midtrans_order_id is not null;

-- ---------------------------------------------------------------------------
-- 6. ORDER_ITEMS
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references public.orders (id) on delete cascade,
  product_id         uuid references public.products (id) on delete set null,
  quantity           integer not null check (quantity > 0),
  price_at_purchase  numeric(14, 2) not null default 0 check (price_at_purchase >= 0)
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- Varian warna pada item pesanan (idempoten).
alter table public.order_items
  add column if not exists variant_color text;

-- ---------------------------------------------------------------------------
-- 7. VOUCHERS
-- ---------------------------------------------------------------------------
create table if not exists public.vouchers (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  discount_type   text not null check (discount_type in ('fixed', 'percentage')),
  discount_value  numeric(14, 2) not null check (discount_value >= 0),
  min_purchase    numeric(14, 2) not null default 0 check (min_purchase >= 0),
  expiry_date     timestamptz,
  is_active       boolean not null default true
);

-- ---------------------------------------------------------------------------
-- 8. USER_VOUCHERS  (voucher yang di-claim user)
-- ---------------------------------------------------------------------------
create table if not exists public.user_vouchers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  voucher_id  uuid not null references public.vouchers (id) on delete cascade,
  is_claimed  boolean not null default true,
  is_used     boolean not null default false,
  unique (user_id, voucher_id)
);

create index if not exists user_vouchers_user_id_idx on public.user_vouchers (user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Cek apakah user yang login adalah admin (security definer => bypass RLS,
-- mencegah rekursi policy pada tabel profiles).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Auto-buat baris profiles saat user baru mendaftar.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Pastikan hanya satu alamat default: saat baris ditandai default, matikan default
-- lain LEBIH DULU (BEFORE trigger) agar tidak menabrak unique index
-- addresses_one_default_per_user_idx.
create or replace function public.enforce_single_default_address()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_default then
    update public.addresses
       set is_default = false
     where user_id = new.user_id
       and id <> new.id
       and is_default;
  end if;
  return new;
end;
$$;

drop trigger if exists addresses_single_default on public.addresses;
create trigger addresses_single_default
  before insert or update of is_default on public.addresses
  for each row when (new.is_default)
  execute function public.enforce_single_default_address();

-- Inti pengurangan/penambahan stok tanpa cek auth (dipakai fungsi tepercaya).
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

-- Pengurangan stok untuk pemanggil ber-otorisasi (pemilik/admin) saja.
create or replace function public.decrement_stock_for_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.orders
     where id = p_order_id
       and (user_id = auth.uid() or public.is_admin())
  ) then
    raise exception 'Akses ditolak untuk pesanan ini';
  end if;

  perform public.apply_stock_delta(p_order_id, -1);
end;
$$;

-- Kembalikan stok untuk pemanggil ber-otorisasi (pemilik/admin) saja.
create or replace function public.restore_stock_for_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.orders
     where id = p_order_id
       and (user_id = auth.uid() or public.is_admin())
  ) then
    raise exception 'Akses ditolak untuk pesanan ini';
  end if;

  perform public.apply_stock_delta(p_order_id, 1);
end;
$$;

-- Tandai pesanan sebagai lunas sekaligus kurangi stok. Dipakai customer saat
-- simulasi pembayaran; RLS orders tidak mengizinkan pemilik menulis, jadi
-- transisi status divalidasi di sini.
create or replace function public.pay_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  select status into v_status
    from public.orders
   where id = p_order_id
     and (user_id = auth.uid() or public.is_admin())
   for update;

  if v_status is null then
    raise exception 'Pesanan tidak ditemukan';
  end if;
  if v_status <> 'pending' then
    raise exception 'Pesanan sudah dibayar atau diproses';
  end if;

  perform public.decrement_stock_for_order(p_order_id);
  update public.orders set status = 'paid' where id = p_order_id;
end;
$$;

-- Batalkan pesanan milik sendiri (pending/paid). Stok dikembalikan bila lunas.
create or replace function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  select status into v_status
    from public.orders
   where id = p_order_id
     and (user_id = auth.uid() or public.is_admin())
   for update;

  if v_status is null then
    raise exception 'Pesanan tidak ditemukan';
  end if;
  if v_status not in ('pending', 'paid') then
    raise exception 'Pesanan ini tidak dapat dibatalkan';
  end if;

  if v_status = 'paid' then
    perform public.restore_stock_for_order(p_order_id);
  end if;
  update public.orders set status = 'cancelled' where id = p_order_id;
end;
$$;

-- Buat pesanan dari keranjang secara atomik: validasi stok & voucher, hitung
-- total dari harga di server, simpan order + order_items, tandai voucher
-- terpakai, lalu kosongkan keranjang. Dijalankan security definer agar aman
-- dari race condition dan tidak bergantung RLS tulis tabel orders.
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

-- Tandai pesanan lunas dari webhook gateway. Tidak memakai auth.uid() karena
-- webhook berjalan sebagai service_role; dipanggil HANYA dari server tepercaya.
create or replace function public.mark_order_paid_from_gateway(
  p_order_id uuid,
  p_midtrans_order_id text,
  p_paid_at timestamptz default now()
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  select status into v_status
    from public.orders
   where id = p_order_id
   for update;

  if v_status is null then
    raise exception 'Pesanan tidak ditemukan';
  end if;

  -- Idempotent: sudah lunas/diproses -> tidak melakukan apa-apa.
  if v_status <> 'pending' then
    return false;
  end if;

  perform public.apply_stock_delta(p_order_id, -1);
  update public.orders
     set status = 'paid',
         payment_provider = 'midtrans',
         midtrans_order_id = coalesce(p_midtrans_order_id, midtrans_order_id),
         paid_at = p_paid_at
   where id = p_order_id;

  return true;
end;
$$;

-- Batalkan pesanan dari webhook (expire/deny/cancel). Kembalikan stok bila sudah
-- sempat lunas. Idempotent untuk pesanan yang sudah dibatalkan.
create or replace function public.mark_order_cancelled_from_gateway(
  p_order_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  select status into v_status
    from public.orders
   where id = p_order_id
   for update;

  if v_status is null then
    raise exception 'Pesanan tidak ditemukan';
  end if;

  if v_status = 'cancelled' then
    return false;
  end if;
  if v_status in ('shipped', 'completed') then
    return false;
  end if;

  if v_status = 'paid' then
    perform public.apply_stock_delta(p_order_id, 1);
  end if;

  update public.orders set status = 'cancelled' where id = p_order_id;
  return true;
end;
$$;

-- Simpan Snap token & ID transaksi gateway pada pesanan.
create or replace function public.set_order_payment_token(
  p_order_id uuid,
  p_snap_token text,
  p_midtrans_order_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.orders
     where id = p_order_id
       and (user_id = auth.uid() or public.is_admin())
  ) then
    raise exception 'Akses ditolak untuk pesanan ini';
  end if;

  update public.orders
     set snap_token = p_snap_token,
         midtrans_order_id = p_midtrans_order_id,
         payment_provider = 'midtrans'
   where id = p_order_id;
end;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles      enable row level security;
alter table public.addresses     enable row level security;
alter table public.products      enable row level security;
alter table public.cart_items    enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;
alter table public.vouchers      enable row level security;
alter table public.user_vouchers enable row level security;

-- ---- profiles --------------------------------------------------------------
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- addresses -------------------------------------------------------------
drop policy if exists "addresses_owner_all" on public.addresses;
create policy "addresses_owner_all" on public.addresses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "addresses_admin_read" on public.addresses;
create policy "addresses_admin_read" on public.addresses
  for select using (public.is_admin());

-- ---- products (katalog publik, tulis hanya admin) --------------------------
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select using (true);

drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- cart_items ------------------------------------------------------------
drop policy if exists "cart_items_owner_all" on public.cart_items;
create policy "cart_items_owner_all" on public.cart_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- orders ----------------------------------------------------------------
drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert with check (user_id = auth.uid());

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

-- ---- order_items -----------------------------------------------------------
drop policy if exists "order_items_select_own_or_admin" on public.order_items;
create policy "order_items_select_own_or_admin" on public.order_items
  for select using (
    public.is_admin()
    or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_own" on public.order_items
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

-- ---- vouchers (daftar publik, tulis hanya admin) ---------------------------
drop policy if exists "vouchers_public_read" on public.vouchers;
create policy "vouchers_public_read" on public.vouchers
  for select using (true);

drop policy if exists "vouchers_admin_write" on public.vouchers;
create policy "vouchers_admin_write" on public.vouchers
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- user_vouchers ---------------------------------------------------------
drop policy if exists "user_vouchers_owner_all" on public.user_vouchers;
create policy "user_vouchers_owner_all" on public.user_vouchers
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "user_vouchers_admin_read" on public.user_vouchers;
create policy "user_vouchers_admin_read" on public.user_vouchers
  for select using (public.is_admin());

-- ============================================================================
-- STORAGE BUCKETS  (gambar produk & avatar)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read" on storage.objects
  for select using (bucket_id in ('product-images', 'avatars'));

drop policy if exists "storage_authenticated_write_avatars" on storage.objects;
create policy "storage_authenticated_write_avatars" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "storage_authenticated_update_avatars" on storage.objects;
create policy "storage_authenticated_update_avatars" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "storage_admin_write_products" on storage.objects;
create policy "storage_admin_write_products" on storage.objects
  for all to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

-- ============================================================================
-- GRANTS
-- ============================================================================
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

-- Fungsi RPC (dipanggil aplikasi) hanya untuk pengguna terautentikasi.
grant execute on function public.create_order(jsonb, text, uuid) to authenticated;
grant execute on function public.pay_order(uuid) to authenticated;
grant execute on function public.cancel_order(uuid) to authenticated;
grant execute on function public.decrement_stock_for_order(uuid) to authenticated;
grant execute on function public.restore_stock_for_order(uuid) to authenticated;
grant execute on function public.set_order_payment_token(uuid, text, text) to authenticated;

-- Helper stok tanpa cek auth: jangan pernah diekspos ke klien.
revoke all on function public.apply_stock_delta(uuid, integer) from public, anon, authenticated;

-- Fungsi webhook: hanya service_role (webhook server-side tepercaya).
revoke all on function public.mark_order_paid_from_gateway(uuid, text, timestamptz) from public, anon, authenticated;
revoke all on function public.mark_order_cancelled_from_gateway(uuid) from public, anon, authenticated;
grant execute on function public.mark_order_paid_from_gateway(uuid, text, timestamptz) to service_role;
grant execute on function public.mark_order_cancelled_from_gateway(uuid) to service_role;
