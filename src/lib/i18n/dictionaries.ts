/**
 * Kamus multi-bahasa X-VIBE-SHOP.
 *
 * Semua bahasa memakai kunci yang sama; nilai yang belum diterjemahkan otomatis
 * jatuh ke Bahasa Inggris lalu Bahasa Indonesia (lihat `translate`). Untuk
 * menambah bahasa baru, cukup tambahkan entri pada `dictionaries`.
 */

export const LOCALES = [
  "id",
  "en",
  "ms",
  "zh",
  "ja",
  "ko",
  "ar",
  "es",
  "fr",
  "de",
  "pt",
  "hi",
] as const;

export type Locale = (typeof LOCALES)[number];

export interface LocaleMeta {
  label: string;
  nativeLabel: string;
  flag: string;
  dir: "ltr" | "rtl";
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  id: { label: "Indonesian", nativeLabel: "Bahasa Indonesia", flag: "🇮🇩", dir: "ltr" },
  en: { label: "English", nativeLabel: "English", flag: "🇬🇧", dir: "ltr" },
  ms: { label: "Malay", nativeLabel: "Bahasa Melayu", flag: "🇲🇾", dir: "ltr" },
  zh: { label: "Chinese", nativeLabel: "中文", flag: "🇨🇳", dir: "ltr" },
  ja: { label: "Japanese", nativeLabel: "日本語", flag: "🇯🇵", dir: "ltr" },
  ko: { label: "Korean", nativeLabel: "한국어", flag: "🇰🇷", dir: "ltr" },
  ar: { label: "Arabic", nativeLabel: "العربية", flag: "🇸🇦", dir: "rtl" },
  es: { label: "Spanish", nativeLabel: "Español", flag: "🇪🇸", dir: "ltr" },
  fr: { label: "French", nativeLabel: "Français", flag: "🇫🇷", dir: "ltr" },
  de: { label: "German", nativeLabel: "Deutsch", flag: "🇩🇪", dir: "ltr" },
  pt: { label: "Portuguese", nativeLabel: "Português", flag: "🇧🇷", dir: "ltr" },
  hi: { label: "Hindi", nativeLabel: "हिन्दी", flag: "🇮🇳", dir: "ltr" },
};

export const DEFAULT_LOCALE: Locale = "id";
export const LOCALE_COOKIE = "xvs_locale";

/** Kunci terjemahan yang dipakai antarmuka. */
export type MessageKey =
  | "nav.home"
  | "nav.catalog"
  | "nav.vouchers"
  | "nav.profile"
  | "nav.cart"
  | "nav.orders"
  | "nav.admin"
  | "nav.login"
  | "nav.logout"
  | "nav.search"
  | "home.hero.badge"
  | "home.hero.title"
  | "home.hero.subtitle"
  | "home.hero.shop"
  | "home.hero.claim"
  | "home.flashSale"
  | "home.flashSaleSub"
  | "home.viewAll"
  | "home.empty"
  | "home.perks.shipping.title"
  | "home.perks.shipping.desc"
  | "home.perks.payment.title"
  | "home.perks.payment.desc"
  | "home.perks.voucher.title"
  | "home.perks.voucher.desc"
  | "home.perks.curated.title"
  | "home.perks.curated.desc"
  | "product.addToCart"
  | "product.buyNow"
  | "product.added"
  | "product.outOfStock"
  | "product.color"
  | "product.size"
  | "product.selected"
  | "product.stockAvailable"
  | "product.stockEmpty"
  | "product.variantEmpty"
  | "product.detail"
  | "product.reviews"
  | "product.backToCatalog"
  | "product.eta"
  | "product.guarantee"
  | "product.return"
  | "product.secure"
  | "product.pickColor"
  | "product.pickSize"
  | "product.stock"
  | "product.noImage"
  | "cart.title"
  | "cart.empty"
  | "cart.emptyDesc"
  | "cart.startShopping"
  | "cart.summary"
  | "cart.subtotal"
  | "cart.itemCount"
  | "cart.total"
  | "cart.checkout"
  | "cart.addMore"
  | "cart.color"
  | "cart.size"
  | "profile.title"
  | "profile.orders"
  | "profile.admin"
  | "profile.shortcuts"
  | "profile.logout"
  | "profile.logoutDesc"
  | "orders.title"
  | "orders.empty"
  | "orders.reference"
  | "orders.status"
  | "orders.total"
  | "orders.pay"
  | "orders.simulate"
  | "orders.cancel"
  | "orders.shipTo"
  | "common.loading"
  | "common.close"
  | "common.save"
  | "common.cancel"
  | "common.search";

type Dict = Record<MessageKey, string>;

const id: Dict = {
  "nav.home": "Beranda",
  "nav.catalog": "Katalog",
  "nav.vouchers": "Vouchers",
  "nav.profile": "Profil",
  "nav.cart": "Keranjang",
  "nav.orders": "Pesanan Saya",
  "nav.admin": "Dashboard Admin",
  "nav.login": "Masuk",
  "nav.logout": "Keluar",
  "nav.search": "Cari produk...",
  "home.hero.badge": "EDISI CYBER 2026",
  "home.hero.title": "Temukan Vibe Terbaik di",
  "home.hero.subtitle":
    "Marketplace untuk apparel, produk digital, dan aksesoris bergaya cyberpunk. Belanja mudah, pembayaran cepat, harga bersahabat.",
  "home.hero.shop": "Jelajahi Katalog",
  "home.hero.claim": "Klaim Voucher",
  "home.flashSale": "Flash Sale",
  "home.flashSaleSub": "Diskon kilat, stok terbatas. Buruan sebelum habis!",
  "home.viewAll": "Lihat semua",
  "home.empty": "Belum ada produk. Admin dapat menambahkan produk dari dashboard.",
  "home.perks.shipping.title": "Pengiriman Cepat",
  "home.perks.shipping.desc": "Dikirim dari gudang terdekat.",
  "home.perks.payment.title": "Pembayaran Aman",
  "home.perks.payment.desc": "Gateway pembayaran terintegrasi.",
  "home.perks.voucher.title": "Voucher & Diskon",
  "home.perks.voucher.desc": "Klaim voucher, hemat tiap belanja.",
  "home.perks.curated.title": "Kurasi Produk",
  "home.perks.curated.desc": "Apparel, digital, dan aksesoris pilihan.",
  "product.addToCart": "Tambah ke Keranjang",
  "product.buyNow": "Beli Langsung",
  "product.added": "Ditambahkan!",
  "product.outOfStock": "Stok Habis",
  "product.color": "Warna",
  "product.size": "Ukuran",
  "product.selected": "Dipilih",
  "product.stockAvailable": "Stok tersedia",
  "product.stockEmpty": "Stok habis",
  "product.variantEmpty": "Stok varian ini habis",
  "product.detail": "Detail Produk",
  "product.reviews": "Ulasan Pembeli",
  "product.backToCatalog": "Kembali ke katalog",
  "product.eta": "Estimasi 1–3 hari",
  "product.guarantee": "Garansi kualitas produk",
  "product.return": "Bisa retur 7 hari",
  "product.secure": "Pembayaran aman",
  "product.pickColor": "Silakan pilih warna terlebih dahulu.",
  "product.pickSize": "Silakan pilih ukuran terlebih dahulu.",
  "product.stock": "Stok",
  "product.noImage": "Tanpa gambar",
  "cart.title": "Keranjang Belanja",
  "cart.empty": "Keranjang Kosong",
  "cart.emptyDesc": "Belum ada produk di keranjang Anda.",
  "cart.startShopping": "Mulai Belanja",
  "cart.summary": "Ringkasan",
  "cart.subtotal": "Subtotal",
  "cart.itemCount": "Jumlah item",
  "cart.total": "Total",
  "cart.checkout": "Lanjut ke Checkout",
  "cart.addMore": "Tambah produk lain",
  "cart.color": "Warna",
  "cart.size": "Ukuran",
  "profile.title": "Profil Saya",
  "profile.orders": "Pesanan Saya",
  "profile.admin": "Dashboard Admin",
  "profile.shortcuts": "Menu Akun",
  "profile.logout": "Keluar Akun",
  "profile.logoutDesc": "Akhiri sesi di perangkat ini.",
  "orders.title": "Pesanan Saya",
  "orders.empty": "Belum ada pesanan.",
  "orders.reference": "Referensi",
  "orders.status": "Status",
  "orders.total": "Total",
  "orders.pay": "Bayar Sekarang",
  "orders.simulate": "Simulasikan Pembayaran",
  "orders.cancel": "Batalkan",
  "orders.shipTo": "Kirim ke",
  "common.loading": "Memuat…",
  "common.close": "Tutup",
  "common.save": "Simpan",
  "common.cancel": "Batal",
  "common.search": "Cari",
};

const en: Dict = {
  "nav.home": "Home",
  "nav.catalog": "Catalog",
  "nav.vouchers": "Vouchers",
  "nav.profile": "Profile",
  "nav.cart": "Cart",
  "nav.orders": "My Orders",
  "nav.admin": "Admin Dashboard",
  "nav.login": "Sign in",
  "nav.logout": "Sign out",
  "nav.search": "Search products...",
  "home.hero.badge": "CYBER EDITION 2026",
  "home.hero.title": "Find Your Best Vibe at",
  "home.hero.subtitle":
    "A marketplace for cyberpunk apparel, digital goods, and accessories. Easy shopping, fast checkout, friendly prices.",
  "home.hero.shop": "Browse Catalog",
  "home.hero.claim": "Claim Voucher",
  "home.flashSale": "Flash Sale",
  "home.flashSaleSub": "Lightning deals, limited stock. Grab them fast!",
  "home.viewAll": "View all",
  "home.empty": "No products yet. Admins can add products from the dashboard.",
  "home.perks.shipping.title": "Fast Shipping",
  "home.perks.shipping.desc": "Shipped from the nearest warehouse.",
  "home.perks.payment.title": "Secure Payment",
  "home.perks.payment.desc": "Integrated payment gateway.",
  "home.perks.voucher.title": "Vouchers & Discounts",
  "home.perks.voucher.desc": "Claim vouchers and save on every order.",
  "home.perks.curated.title": "Curated Products",
  "home.perks.curated.desc": "Selected apparel, digital goods, and accessories.",
  "product.addToCart": "Add to Cart",
  "product.buyNow": "Buy Now",
  "product.added": "Added!",
  "product.outOfStock": "Out of Stock",
  "product.color": "Color",
  "product.size": "Size",
  "product.selected": "Selected",
  "product.stockAvailable": "In stock",
  "product.stockEmpty": "Out of stock",
  "product.variantEmpty": "This variant is out of stock",
  "product.detail": "Product Details",
  "product.reviews": "Buyer Reviews",
  "product.backToCatalog": "Back to catalog",
  "product.eta": "Est. 1–3 days",
  "product.guarantee": "Product quality guarantee",
  "product.return": "7-day returns",
  "product.secure": "Secure payment",
  "product.pickColor": "Please choose a color first.",
  "product.pickSize": "Please choose a size first.",
  "product.stock": "Stock",
  "product.noImage": "No image",
  "cart.title": "Shopping Cart",
  "cart.empty": "Your Cart is Empty",
  "cart.emptyDesc": "There are no items in your cart yet.",
  "cart.startShopping": "Start Shopping",
  "cart.summary": "Summary",
  "cart.subtotal": "Subtotal",
  "cart.itemCount": "Items",
  "cart.total": "Total",
  "cart.checkout": "Proceed to Checkout",
  "cart.addMore": "Add more products",
  "cart.color": "Color",
  "cart.size": "Size",
  "profile.title": "My Profile",
  "profile.orders": "My Orders",
  "profile.admin": "Admin Dashboard",
  "profile.shortcuts": "Account Menu",
  "profile.logout": "Sign Out",
  "profile.logoutDesc": "End your session on this device.",
  "orders.title": "My Orders",
  "orders.empty": "No orders yet.",
  "orders.reference": "Reference",
  "orders.status": "Status",
  "orders.total": "Total",
  "orders.pay": "Pay Now",
  "orders.simulate": "Simulate Payment",
  "orders.cancel": "Cancel",
  "orders.shipTo": "Ship to",
  "common.loading": "Loading…",
  "common.close": "Close",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.search": "Search",
};

/** Terjemahan lengkap untuk tiap bahasa yang didukung. */
export const dictionaries: Record<Locale, Partial<Dict>> = {
  id,
  en,
  ms: {
    "nav.home": "Utama",
    "nav.catalog": "Katalog",
    "nav.vouchers": "Baucar",
    "nav.profile": "Profil",
    "nav.cart": "Bakul",
    "nav.orders": "Pesanan Saya",
    "nav.admin": "Papan Pemuka Admin",
    "nav.login": "Masuk",
    "nav.logout": "Keluar",
    "nav.search": "Cari produk...",
    "home.hero.title": "Temui Vibe Terbaik di",
    "home.hero.subtitle":
      "Marketplace untuk apparel, produk digital, dan aksesori gaya cyberpunk.",
    "home.hero.shop": "Layari Katalog",
    "home.hero.claim": "Tuntut Baucar",
    "home.flashSale": "Jualan Kilat",
    "home.flashSaleSub": "Harga kilat, stok terhad. Cepat sebelum habis!",
    "home.viewAll": "Lihat semua",
    "product.addToCart": "Tambah ke Bakul",
    "product.buyNow": "Beli Terus",
    "product.color": "Warna",
    "product.size": "Saiz",
    "cart.title": "Bakul Belanja",
    "cart.checkout": "Teruskan ke Pembayaran",
    "profile.title": "Profil Saya",
  },
  zh: {
    "nav.home": "首页",
    "nav.catalog": "目录",
    "nav.vouchers": "优惠券",
    "nav.profile": "我的",
    "nav.cart": "购物车",
    "nav.orders": "我的订单",
    "nav.admin": "管理后台",
    "nav.login": "登录",
    "nav.logout": "退出",
    "nav.search": "搜索商品...",
    "home.hero.title": "在这里发现最佳氛围",
    "home.hero.subtitle": "赛博朋克风格的服装、数字商品和配饰市场。",
    "home.hero.shop": "浏览目录",
    "home.hero.claim": "领取优惠券",
    "home.flashSale": "限时抢购",
    "home.flashSaleSub": "闪购优惠，库存有限，抓紧抢购！",
    "home.viewAll": "查看全部",
    "product.addToCart": "加入购物车",
    "product.buyNow": "立即购买",
    "product.color": "颜色",
    "product.size": "尺寸",
    "cart.title": "购物车",
    "cart.checkout": "去结算",
    "profile.title": "我的资料",
  },
  ja: {
    "nav.home": "ホーム",
    "nav.catalog": "カタログ",
    "nav.vouchers": "クーポン",
    "nav.profile": "マイページ",
    "nav.cart": "カート",
    "nav.orders": "注文履歴",
    "nav.admin": "管理ダッシュボード",
    "nav.login": "ログイン",
    "nav.logout": "ログアウト",
    "nav.search": "商品を検索...",
    "home.hero.title": "最高のバイブを見つけよう",
    "home.hero.subtitle":
      "サイバーパンクなアパレル・デジタル商品・アクセサリーのマーケットプレイス。",
    "home.hero.shop": "カタログを見る",
    "home.hero.claim": "クーポンを受け取る",
    "home.flashSale": "フラッシュセール",
    "home.flashSaleSub": "期間限定、在庫わずか。お早めに！",
    "home.viewAll": "すべて見る",
    "product.addToCart": "カートに追加",
    "product.buyNow": "今すぐ購入",
    "product.color": "カラー",
    "product.size": "サイズ",
    "cart.title": "ショッピングカート",
    "cart.checkout": "レジに進む",
    "profile.title": "マイプロフィール",
  },
  ko: {
    "nav.home": "홈",
    "nav.catalog": "카탈로그",
    "nav.vouchers": "바우처",
    "nav.profile": "프로필",
    "nav.cart": "장바구니",
    "nav.orders": "내 주문",
    "nav.admin": "관리자 대시보드",
    "nav.login": "로그인",
    "nav.logout": "로그아웃",
    "nav.search": "상품 검색...",
    "home.hero.title": "최고의 바이브를 만나보세요",
    "home.hero.subtitle": "사이버펑크 스타일 의류, 디지털 상품, 액세서리 마켓플레이스.",
    "home.hero.shop": "카탈로그 보기",
    "home.hero.claim": "바우처 받기",
    "home.flashSale": "플래시 세일",
    "home.flashSaleSub": "한정 특가, 재고 한정. 서두르세요!",
    "home.viewAll": "전체 보기",
    "product.addToCart": "장바구니에 담기",
    "product.buyNow": "바로 구매",
    "product.color": "색상",
    "product.size": "사이즈",
    "cart.title": "장바구니",
    "cart.checkout": "결제하기",
    "profile.title": "내 프로필",
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.catalog": "الكتالوج",
    "nav.vouchers": "القسائم",
    "nav.profile": "الملف الشخصي",
    "nav.cart": "السلة",
    "nav.orders": "طلباتي",
    "nav.admin": "لوحة الإدارة",
    "nav.login": "تسجيل الدخول",
    "nav.logout": "تسجيل الخروج",
    "nav.search": "ابحث عن المنتجات...",
    "home.hero.title": "اكتشف أفضل إيقاع في",
    "home.hero.subtitle": "متجر للملابس والمنتجات الرقمية والإكسسوارات بأسلوب السايبربانك.",
    "home.hero.shop": "تصفح الكتالوج",
    "home.hero.claim": "احصل على قسيمة",
    "home.flashSale": "تخفيضات سريعة",
    "home.flashSaleSub": "عروض سريعة، كمية محدودة. أسرع قبل النفاد!",
    "home.viewAll": "عرض الكل",
    "product.addToCart": "أضف إلى السلة",
    "product.buyNow": "اشترِ الآن",
    "product.color": "اللون",
    "product.size": "المقاس",
    "cart.title": "سلة التسوق",
    "cart.checkout": "إتمام الشراء",
    "profile.title": "ملفي الشخصي",
  },
  es: {
    "nav.home": "Inicio",
    "nav.catalog": "Catálogo",
    "nav.vouchers": "Cupones",
    "nav.profile": "Perfil",
    "nav.cart": "Carrito",
    "nav.orders": "Mis pedidos",
    "nav.admin": "Panel de administración",
    "nav.login": "Iniciar sesión",
    "nav.logout": "Cerrar sesión",
    "nav.search": "Buscar productos...",
    "home.hero.title": "Encuentra tu mejor vibe en",
    "home.hero.subtitle":
      "Un marketplace de ropa, productos digitales y accesorios estilo cyberpunk.",
    "home.hero.shop": "Explorar catálogo",
    "home.hero.claim": "Reclamar cupón",
    "home.flashSale": "Oferta relámpago",
    "home.flashSaleSub": "Ofertas relámpago, stock limitado. ¡Apresúrate!",
    "home.viewAll": "Ver todo",
    "product.addToCart": "Añadir al carrito",
    "product.buyNow": "Comprar ahora",
    "product.color": "Color",
    "product.size": "Talla",
    "cart.title": "Carrito de compras",
    "cart.checkout": "Ir a pagar",
    "profile.title": "Mi perfil",
  },
  fr: {
    "nav.home": "Accueil",
    "nav.catalog": "Catalogue",
    "nav.vouchers": "Bons",
    "nav.profile": "Profil",
    "nav.cart": "Panier",
    "nav.orders": "Mes commandes",
    "nav.admin": "Tableau de bord admin",
    "nav.login": "Connexion",
    "nav.logout": "Déconnexion",
    "nav.search": "Rechercher des produits...",
    "home.hero.title": "Trouvez votre meilleure vibe chez",
    "home.hero.subtitle":
      "Une marketplace de vêtements, produits numériques et accessoires cyberpunk.",
    "home.hero.shop": "Parcourir le catalogue",
    "home.hero.claim": "Réclamer un bon",
    "home.flashSale": "Vente flash",
    "home.flashSaleSub": "Offres flash, stock limité. Dépêchez-vous !",
    "home.viewAll": "Tout voir",
    "product.addToCart": "Ajouter au panier",
    "product.buyNow": "Acheter maintenant",
    "product.color": "Couleur",
    "product.size": "Taille",
    "cart.title": "Panier",
    "cart.checkout": "Passer à la caisse",
    "profile.title": "Mon profil",
  },
  de: {
    "nav.home": "Startseite",
    "nav.catalog": "Katalog",
    "nav.vouchers": "Gutscheine",
    "nav.profile": "Profil",
    "nav.cart": "Warenkorb",
    "nav.orders": "Meine Bestellungen",
    "nav.admin": "Admin-Dashboard",
    "nav.login": "Anmelden",
    "nav.logout": "Abmelden",
    "nav.search": "Produkte suchen...",
    "home.hero.title": "Finde deinen besten Vibe bei",
    "home.hero.subtitle":
      "Ein Marktplatz für Cyberpunk-Kleidung, digitale Produkte und Accessoires.",
    "home.hero.shop": "Katalog durchsuchen",
    "home.hero.claim": "Gutschein einlösen",
    "home.flashSale": "Blitzangebot",
    "home.flashSaleSub": "Blitzangebote, begrenzter Vorrat. Schnell zugreifen!",
    "home.viewAll": "Alle ansehen",
    "product.addToCart": "In den Warenkorb",
    "product.buyNow": "Jetzt kaufen",
    "product.color": "Farbe",
    "product.size": "Größe",
    "cart.title": "Warenkorb",
    "cart.checkout": "Zur Kasse",
    "profile.title": "Mein Profil",
  },
  pt: {
    "nav.home": "Início",
    "nav.catalog": "Catálogo",
    "nav.vouchers": "Cupons",
    "nav.profile": "Perfil",
    "nav.cart": "Carrinho",
    "nav.orders": "Meus pedidos",
    "nav.admin": "Painel do administrador",
    "nav.login": "Entrar",
    "nav.logout": "Sair",
    "nav.search": "Buscar produtos...",
    "home.hero.title": "Encontre a melhor vibe na",
    "home.hero.subtitle":
      "Um marketplace de roupas, produtos digitais e acessórios estilo cyberpunk.",
    "home.hero.shop": "Explorar catálogo",
    "home.hero.claim": "Resgatar cupom",
    "home.flashSale": "Oferta relâmpago",
    "home.flashSaleSub": "Ofertas relâmpago, estoque limitado. Corra!",
    "home.viewAll": "Ver tudo",
    "product.addToCart": "Adicionar ao carrinho",
    "product.buyNow": "Comprar agora",
    "product.color": "Cor",
    "product.size": "Tamanho",
    "cart.title": "Carrinho de compras",
    "cart.checkout": "Finalizar compra",
    "profile.title": "Meu perfil",
  },
  hi: {
    "nav.home": "होम",
    "nav.catalog": "कैटलॉग",
    "nav.vouchers": "वाउचर",
    "nav.profile": "प्रोफ़ाइल",
    "nav.cart": "कार्ट",
    "nav.orders": "मेरे ऑर्डर",
    "nav.admin": "एडमिन डैशबोर्ड",
    "nav.login": "साइन इन",
    "nav.logout": "साइन आउट",
    "nav.search": "उत्पाद खोजें...",
    "home.hero.title": "अपना बेहतरीन वाइब खोजें",
    "home.hero.subtitle":
      "साइबरपंक शैली के परिधान, डिजिटल सामान और एक्सेसरीज़ का मार्केटप्लेस।",
    "home.hero.shop": "कैटलॉग देखें",
    "home.hero.claim": "वाउचर लें",
    "home.flashSale": "फ्लैश सेल",
    "home.flashSaleSub": "तुरंत ऑफ़र, सीमित स्टॉक। जल्दी करें!",
    "home.viewAll": "सभी देखें",
    "product.addToCart": "कार्ट में जोड़ें",
    "product.buyNow": "अभी खरीदें",
    "product.color": "रंग",
    "product.size": "साइज़",
    "cart.title": "शॉपिंग कार्ट",
    "cart.checkout": "चेकआउट करें",
    "profile.title": "मेरी प्रोफ़ाइल",
  },
};

/** Terjemahan dengan fallback berjenjang: locale -> en -> id. */
export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  const raw =
    dictionaries[locale]?.[key] ?? dictionaries.en[key] ?? dictionaries.id[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name) =>
    vars[name] != null ? String(vars[name]) : `{${name}}`,
  );
}

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}
