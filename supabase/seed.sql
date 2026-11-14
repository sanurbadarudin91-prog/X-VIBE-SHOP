-- ============================================================================
-- X-VIBE-SHOP :: Seed data (contoh produk & voucher)
-- Jalankan setelah schema.sql. Idempoten.
-- ============================================================================

insert into public.products (title, description, price, stock, category, image_url)
select * from (values
  ('Vibe Oversized Tee',        'Kaos oversized katun combed 24s, sablon plastisol tahan lama.', 149000::numeric, 40, 'Apparel',   'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'),
  ('Cyber Hoodie Black',        'Hoodie fleece tebal dengan aksen neon, cocok untuk malam hari.', 329000::numeric, 25, 'Apparel',  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800'),
  ('Neon Cargo Pants',          'Celana cargo ripstop dengan kantong utilitarian.',               279000::numeric, 18, 'Apparel',   'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800'),
  ('Vibe Snapback Cap',         'Topi snapback bordir logo X-VIBE.',                               99000::numeric, 60, 'Aksesoris', 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800'),
  ('Reflective Crossbody Bag',  'Tas selempang dengan bahan reflektif, water resistant.',         189000::numeric, 30, 'Aksesoris', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800'),
  ('Sticker Pack Cyber',        'Set 12 stiker vinyl tahan air edisi cyberpunk.',                  35000::numeric, 200, 'Aksesoris','https://images.unsplash.com/photo-1572375992501-4b0892d50c69?w=800'),
  ('X-VIBE UI Kit (Digital)',   'Kit desain UI lengkap: 120+ komponen Figma siap pakai.',         249000::numeric, 999, 'Digital',  'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800'),
  ('Lo-Fi Beats Sample Pack',   '200+ loop & one-shot untuk produksi musik lo-fi.',               179000::numeric, 999, 'Digital',  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800'),
  ('Notion Seller Template',    'Template Notion untuk manajemen toko online & stok.',             89000::numeric, 999, 'Digital',  'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800'),
  ('Preset Lightroom Neon',     '20 preset Lightroom bergaya neon night city.',                    129000::numeric, 999, 'Digital',  'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800')
) as v(title, description, price, stock, category, image_url)
where not exists (select 1 from public.products p where p.title = v.title);

insert into public.vouchers (code, discount_type, discount_value, min_purchase, expiry_date, is_active)
select * from (values
  ('VIBENEW10',  'percentage', 10::numeric, 100000::numeric, now() + interval '90 days', true),
  ('POTONG50K',  'fixed',      50000::numeric, 300000::numeric, now() + interval '60 days', true),
  ('CYBER20',    'percentage', 20::numeric, 500000::numeric, now() + interval '30 days', true),
  ('GRATISONGKIR','fixed',     20000::numeric, 150000::numeric, now() + interval '45 days', true)
) as v(code, discount_type, discount_value, min_purchase, expiry_date, is_active)
where not exists (select 1 from public.vouchers x where x.code = v.code);

-- Demo varian warna + galeri multi-foto untuk produk apparel terpilih.
-- Stok total produk disamakan dengan jumlah stok tiap varian.
update public.products set
  colors        = '["Hitam","Navy","Sage Green","Maroon"]'::jsonb,
  variant_stock = '{"Hitam":15,"Navy":8,"Sage Green":6,"Maroon":4}'::jsonb,
  stock         = 33,
  images        = case
                    when image_url is null then '[]'::jsonb
                    else jsonb_build_array(image_url)
                  end,
  caption       = 'Bahan: Cotton fleece premium 320gsm, adem & tidak mudah melar.' || E'\n\n' ||
                  'Panduan Ukuran (Lebar x Panjang):' || E'\n' ||
                  'M  : 50 x 68 cm' || E'\n' ||
                  'L  : 53 x 70 cm' || E'\n' ||
                  'XL : 56 x 72 cm' || E'\n\n' ||
                  'Keunggulan:' || E'\n' ||
                  '- Jahitan rantai rapi & kuat' || E'\n' ||
                  '- Warna solid, tidak mudah pudar' || E'\n' ||
                  '- Cocok untuk pria & wanita (unisex)'
where title = 'Cyber Hoodie Black';
