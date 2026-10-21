import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { access, readFile as readBytes } from "node:fs/promises";
import { readFile } from "./read-source.mjs";
import test from "node:test";

const root = new URL("../", import.meta.url);
// Sau khi tach backend/frontend: du lieu catalog nam o backend, may chu khuon mat va tai lieu
// nam o goc kho. Ham nay tra duong dan moi cho cac file test van doc theo duong dan cu.
const CATALOG_FILES = /^app\/(products|apple-products|apple-desktop-products|expanded-products|tuandigi-products|retail-expansion-products|infinity-accessories|camera-products|macbook-pro-products|macbook-air-products|maytinhgiare-laptop-products|iphone-18-products|current-catalog)\.ts$|^app\/(catalog-enrichment|laptop-image-manifest|product-color-catalog|tuandigi-imported-products)\.json$/;
// Cac test doc code D1/Cloudflare cu (db/*.ts, app/api/*, worker, vite) da xoa: phan do chuyen sang
// backend Express + PostgreSQL va duoc kiem bang backend/src/test/api.test.ts.
// Dot 2: component chuyen tu app/components/ sang src/components/<nhom>/, route khach vao app/(portal)/.
function findComponent(name) {
  const stack = [new URL("src/components/", root)];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) stack.push(new URL(`${entry.name}/`, dir));
      else if (entry.name === name) return new URL(entry.name, dir);
    }
  }
  return undefined;
}

function src(file) {
  const component = file.match(/^app\/components\/([^/]+)$/);
  if (component) return findComponent(component[1]) ?? new URL(file, root);
  const portalPage = file.match(/^app\/([a-z0-9-]+)\/page\.tsx$/);
  if (portalPage && !["admin", "admin-login", "staff", "manager", "manger", "quan-ly"].includes(portalPage[1])) return new URL(`app/(portal)/${portalPage[1]}/page.tsx`, root);
  if (CATALOG_FILES.test(file)) return src(`../backend/scripts/legacy-catalog/data/${file.slice(4)}`);
  if (file === "db/product-specs.ts") return src("../backend/scripts/legacy-catalog/data/product-specs.ts");
  if (/^(python-ai|docs)\//.test(file)) return src(`../${file}`);
  return new URL(file, root);
}

test("keeps product fill images contained instead of inheriting the image shim crop", async () => {
  for (const file of ["CategoryFamilyTiles", "ProductDetailExperience", "ShopProductCard"]) {
    const source = await readFile(src(`app/components/${file}.tsx`), "utf8");
    assert.match(source, /objectFit: "contain"/, file);
  }
});

test("keeps the mobile admin shell single-column and monetary values untruncated", async () => {
  const css = await readFile(src("src/styles/admin/admin-mobile-orbit.css"), "utf8");
  assert.match(css, /body \.admin-console \{ grid-template-columns: minmax\(0, 1fr\) !important/);
  assert.match(css, /text-overflow: clip; white-space: normal; overflow-wrap: anywhere; font-variant-numeric: tabular-nums/);
  const layout = await readFile(src("app/layout.tsx"), "utf8");
  assert.doesNotMatch(layout, /admin-premium\.css/);
});

test("shares a persisted light and dark mode across storefront and admin portals", async () => {
  const [layout, toggle, storefrontHeader, adminLayout, businessShell, themeCss] = await Promise.all([
    readFile(src("app/layout.tsx"), "utf8"),
    readFile(src("src/components/common/ThemeToggle.tsx"), "utf8"),
    readFile(src("src/components/layout/StorefrontHeader.tsx"), "utf8"),
    readFile(src("app/admin/layout.tsx"), "utf8"),
    readFile(src("src/components/layout/BusinessPortalShell.tsx"), "utf8"),
    readFile(src("src/styles/base/theme-mode.css"), "utf8"),
  ]);
  assert.match(layout, /infinity-theme/);
  assert.match(layout, /prefers-color-scheme: dark/);
  assert.match(layout, /theme-mode\.css/);
  assert.match(toggle, /localStorage\.setItem\(STORAGE_KEY/);
  assert.match(toggle, /aria-pressed/);
  assert.match(storefrontHeader, /<ThemeToggle compact/);
  assert.match(adminLayout, /<ThemeToggle/);
  assert.match(businessShell, /<ThemeToggle/);
  assert.match(themeCss, /html\[data-theme="dark"\] \.admin-console/);
  assert.match(themeCss, /html\[data-theme="dark"\] \.cps-header/);
});

test("keeps the storefront wired to Infinity Store order content", async () => {
  const [page, layout, orderPage, products, categoryMenu, homeShowcases, studentOffer, upcomingLaunch] = await Promise.all([
    readFile(src("app/(portal)/page.tsx"), "utf8"),
    readFile(src("app/layout.tsx"), "utf8"),
    readFile(src("app/(portal)/dat-hang/page.tsx"), "utf8"),
    readFile(src("app/products.ts"), "utf8"),
    readFile(src("src/components/features/portal/home/VisualCategoryMenu.tsx"), "utf8"),
    readFile(src("src/components/features/portal/home/HomeProductShowcases.tsx"), "utf8"),
    readFile(src("src/components/features/portal/home/StudentOfferBanner.tsx"), "utf8"),
    readFile(src("src/components/features/portal/home/UpcomingAppleLaunchPoster.tsx"), "utf8"),
  ]);

  assert.match(layout, /Infinity Store \| Điện thoại & đặt hàng/);
  assert.match(layout, /SITE_URL/);
  // Ten mien lay tu bien SITE_URL; hotline nam trong CSDL (seed ban dau o backend/seed/store-settings.json).
  assert.match(await readFile(src("src/constants/shared/site-config.ts"), "utf8"), /process\.env\.SITE_URL/);
  assert.match(layout, /getStoreSettings/);
  assert.match(await readFile(src("../backend/seed/store-settings.json"), "utf8"), /0384\.589\.559/);
  assert.match(page, /getPublicProducts/);
  assert.doesNotMatch(page, /Đặt đúng máy|để Huy giữ máy/);
  assert.match(page, /StudentOfferBanner/);
  assert.match(studentOffer, /Giảm đến 3% cho học sinh, sinh viên/);
  assert.match(page, /UpcomingAppleLaunchPoster/);
  assert.match(upcomingLaunch, /iPhone 18 Series/);
  assert.match(upcomingLaunch, /MacBook & iPad thế hệ mới/);
  assert.match(upcomingLaunch, /CHÍNH THỨC MỞ BÁN/);
  assert.match(upcomingLaunch, /href="\/san-pham\/iphone-18-pro"/);
  assert.doesNotMatch(upcomingLaunch, /ĐẶT TRƯỚC|Nguồn Apple|Apple Newsroom|Hình ảnh concept minh họa/);
  assert.match(orderPage, /Kiểm tra sản phẩm và giá tiền/);
  assert.match(products, /iphone-17-pro/);
  assert.doesNotMatch(products, /galaxy-s25-ultra/);
  assert.match(products, /oppo-find-x8-pro/);
  assert.match(page, /VisualCategoryMenu/);
  for (const label of ["iPhone", "iPad", "MacBook", "Laptop", "Android", "Đồng hồ", "Âm thanh", "Phụ kiện"]) {
    assert.match(categoryMenu, new RegExp(label));
  }
  assert.doesNotMatch(categoryMenu, /Samsung/);
  for (const removedLabel of ["iMac - Mac Mini", "Apple Watch"]) {
    assert.doesNotMatch(categoryMenu, new RegExp(removedLabel));
  }
  assert.match(page, /HomeProductShowcases/);
  assert.match(homeShowcases, /title="Điện thoại nổi bật"/);
  assert.match(homeShowcases, /title="Laptop & MacBook"/);
  assert.match(homeShowcases, /title="Phụ kiện thiết yếu"/);
  assert.match(homeShowcases, /role="tablist"/);
  assert.match(homeShowcases, /scrollBy/);
  assert.match(homeShowcases, /ShopProductCard|home-showcase-slot/);
  assert.match(homeShowcases, /macbookFamily/);
  assert.match(homeShowcases, /macbook\[\\s-\]\+pro/);
  assert.match(homeShowcases, /macbook\[\\s-\]\+air/);
  assert.doesNotMatch(homeShowcases, /\.\.\.macbooks/);
});

test("separates the storefront and internal company brands", async () => {
  const [storeLayout, member, memberInvoice, adminLayout, portalShell, staff, stamp] = await Promise.all([
    readFile(src("app/layout.tsx"), "utf8"),
    readFile(src("src/components/features/portal/account/AccountPanel.tsx"), "utf8"),
    readFile(src("app/(portal)/tai-khoan/hoa-don/[id]/page.tsx"), "utf8"),
    readFile(src("app/admin/layout.tsx"), "utf8"),
    readFile(src("src/components/layout/BusinessPortalShell.tsx"), "utf8"),
    readFile(src("app/staff/page.tsx"), "utf8"),
    readFile(src("src/components/common/DocumentStamp.tsx"), "utf8"),
  ]);

  for (const customerSurface of [storeLayout, member, memberInvoice]) {
    assert.match(customerSurface, /INFINITY STORE|Infinity Store/);
    assert.doesNotMatch(customerSurface, /INFINITY COMPANY|Infinity Company/);
  }
  for (const internalSurface of [adminLayout, portalShell, staff]) {
    assert.match(internalSurface, /Infinity Company/);
  }
  assert.match(stamp, /kind === "collected" \? "INFINITY STORE" : "INFINITY COMPANY"/);
});

test("ships every seeded product image referenced by the catalog", async () => {
  // Catalog that nap vao CSDL tu backend/seed/products.json; moi anh cuc bo phai co trong public/
  // va dung la anh (chu ky tep), khong phai trang loi HTML bi luu nham duoi .jpg.
  const seed = await readFile(src("../backend/seed/products.json"), "utf8");
  const imagePaths = [...new Set([...seed.matchAll(/"(\/products\/[^"]+\.(?:png|jpe?g|webp|gif|avif))"/gi)].map(([, imagePath]) => imagePath))];

  assert.ok(imagePaths.length >= 10);
  const broken = [];
  await Promise.all(
    imagePaths.map(async (imagePath) => {
      const bytes = await readBytes(new URL(`public${imagePath}`, root)).catch(() => null);
      if (!bytes || !hasSupportedImageSignature(bytes)) broken.push(imagePath);
    }),
  );
  assert.deepEqual(broken, []);
});

test("adds exactly 57 retail laptops plus Mac chip configurations and iPhone repair parts", async () => {
  const [expansion, products, laptopPage, partsPage] = await Promise.all([
    readFile(src("app/retail-expansion-products.ts"), "utf8"),
    readFile(src("app/products.ts"), "utf8"),
    readFile(src("app/(portal)/laptop/page.tsx"), "utf8"),
    readFile(src("app/(portal)/phu-kien/page.tsx"), "utf8"),
  ]);
  const laptopSeedBlock = expansion.match(/expandedLaptopSeeds:[\s\S]*?= \[([\s\S]*?)\n\];\n\nexport const retailLaptopProducts/)?.[1] ?? "";
  const laptopCount = [...laptopSeedBlock.matchAll(/\{ slug: "/g)].length;
  const prices = [...laptopSeedBlock.matchAll(/price: (\d+)/g)].map((match) => Number(match[1]));

  assert.equal(laptopCount, 57);
  assert.equal(prices.length, 57);
  assert.ok(Math.min(...prices) >= 12_000_000);
  assert.ok(Math.max(...prices) <= 200_000_000);
  assert.match(expansion, /Apple M5 Pro/);
  assert.match(expansion, /Apple M5 Max/);
  assert.match(expansion, /Màn hình OLED iPhone 16 Pro Max/);
  assert.match(expansion, /Cụm camera sau iPhone 15 Pro Max/);
  assert.match(products, /retailExpansionProducts/);
  assert.match(laptopPage, /Laptop từ 12–200 triệu/);
  assert.match(partsPage, /màn hình iPhone, pin, camera/);
});

test("uses manufacturer campaigns, family selectors and complete current iPhone colors", async () => {
  const [ui, campaign, merchandising, catalog, iphonePage, productBrowser, familyTiles] = await Promise.all([
    readFile(src("src/components/features/portal/catalog/CatalogPage.tsx"), "utf8"),
    readFile(src("src/components/features/portal/catalog/CatalogCampaign.tsx"), "utf8"),
    readFile(src("src/constants/portal/category-campaigns.ts"), "utf8"),
    readFile(src("app/current-catalog.ts"), "utf8"),
    readFile(src("app/(portal)/iphone/page.tsx"), "utf8"),
    readFile(src("src/components/features/portal/catalog/CatalogProductBrowser.tsx"), "utf8"),
    readFile(src("src/components/features/portal/catalog/CategoryFamilyTiles.tsx"), "utf8"),
  ]);

  assert.match(ui, /CatalogCampaign/);
  assert.match(ui, /CatalogProductBrowser/);
  assert.match(productBrowser, /catalog-product-grid/);
  assert.match(productBrowser, /price-asc/);
  assert.match(productBrowser, /price-desc/);
  assert.match(productBrowser, /iPhone 13, 12 & SE/);
  assert.match(productBrowser, /MacBook Air/);
  assert.match(productBrowser, /MacBook Pro/);
  assert.match(ui, /category === "iphone" \|\| category === "ipad" \|\| category === "macbook"/);
  for (const family of ["iPhone 17", "iPhone 16", "iPhone 15", "MacBook Air", "MacBook Pro", "MacBook Neo"]) {
    assert.match(familyTiles, new RegExp(family));
  }
  assert.match(familyTiles, /catalog-family-select/);
  assert.match(productBrowser, /addEventListener\("catalog-family-select"/);
  assert.match(campaign, /catalog-campaign-image/);
  for (const brand of ["Apple | iPhone 17 Pro", "Apple | MacBook", "Android flagship"]) {
    assert.ok(merchandising.includes(brand));
  }
  assert.doesNotMatch(merchandising, /Samsung Galaxy/);
  for (const model of ["iphone-17-pro-max", "iphone-17-pro", "iphone-17", "iphone-air", "iphone-17e"]) {
    assert.match(catalog, new RegExp(`\"${model}\"`));
  }
  const colorCatalog = await readFile(src("app/product-color-catalog.json"), "utf8");
  for (const color of ["Đen", "Trắng", "Xanh Lam Khói", "Xanh Lá Xô Thơm", "Tím Oải Hương", "Cam Vũ Trụ", "Xanh Đậm", "Bạc", "Đen Không Gian", "Trắng Mây", "Vàng Nhạt", "Hồng Phớt"]) {
    assert.match(colorCatalog, new RegExp(color));
  }
  assert.doesNotMatch(ui, /iPhone cho từng kiểu người dùng/);
  assert.doesNotMatch(iphonePage, /iPhone cho từng kiểu người dùng/);
});

function hasSupportedImageSignature(bytes) {
  if (bytes.length < 12) return false;
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return true;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true;
  const header = bytes.subarray(0, 12).toString("latin1");
  if (header.startsWith("GIF87a") || header.startsWith("GIF89a")) return true;
  if (header.startsWith("RIFF") && header.slice(8, 12) === "WEBP") return true;
  return header.slice(4, 8) === "ftyp" && /^(avif|avis|mif1|msf1)$/.test(header.slice(8, 12));
}

test("filters the employee directory by owner and branch-manager scope", async () => {
  const [directory, styles] = await Promise.all([
    readFile(src("app/admin/hr/page.tsx"), "utf8"),
    readFile(src("src/styles/storefront/modern-theme.css"), "utf8"),
  ]);
  assert.match(directory, /name="keyword"/);
  assert.match(directory, /name="role"/);
  assert.match(directory, /name="branch"/);
  assert.match(directory, /name="status"/);
  assert.match(directory, /Nhân viên bán hàng/);
  assert.match(directory, /Nhân viên bảo hành/);
  assert.match(directory, /Nhân viên sửa chữa/);
  assert.match(directory, /user\.role === "owner" \? allEmployees/);
  assert.match(directory, /item\.branchId === user\.branchId/);
  assert.match(directory, /user\.role === "owner" && <option value="manager"/);
  assert.match(styles, /\.admin-hr-filters/);
});

test("creates printable employee cards with scoped QR and barcode identity", async () => {
  const [page, preview, navigation, manager, styles] = await Promise.all([
    readFile(src("app/admin/hr/cards/page.tsx"), "utf8"),
    readFile(src("src/components/features/admin/hr/EmployeeCardPreview.tsx"), "utf8"),
    readFile(src("src/constants/admin/navigation.ts"), "utf8"),
    readFile(src("app/manager/page.tsx"), "utf8"),
    readFile(src("src/styles/storefront/modern-theme.css"), "utf8"),
  ]);
  assert.match(page, /requireHrManagerPage\("\/admin\/hr\/cards"\)/);
  assert.match(page, /item\.branchId === user\.branchId/);
  assert.match(page, /\.filter\(\(item\) => item\.active\)/);
  assert.match(preview, /QRCode\.toDataURL/);
  assert.match(preview, /EmployeeBarcode/);
  assert.match(preview, /HỌ VÀ TÊN/);
  assert.match(preview, /CHỨC VỤ/);
  assert.match(preview, /CHI NHÁNH/);
  assert.match(preview, /window\.print\(\)/);
  assert.match(navigation, /Thẻ nhân sự/);
  assert.match(manager, /Tạo thẻ nhân sự/);
  assert.match(styles, /85\.6mm/);
  assert.match(styles, /53\.98mm/);
});

test("uses crown avatars to distinguish director, manager and employee tiers", async () => {
  const [avatar, adminLayout, portalShell, styles] = await Promise.all([
    readFile(src("src/components/common/RoleCrownAvatar.tsx"), "utf8"),
    readFile(src("app/admin/layout.tsx"), "utf8"),
    readFile(src("src/components/layout/BusinessPortalShell.tsx"), "utf8"),
    readFile(src("src/styles/storefront/modern-theme.css"), "utf8"),
  ]);

  assert.match(avatar, /role === "owner" \? "gold"/);
  assert.match(avatar, /role === "manager" \? "silver" : "bronze"/);
  assert.match(avatar, /role-crown-avatar-crown/);
  assert.match(adminLayout, /<RoleCrownAvatar role=\{user\.role\}/);
  assert.match(portalShell, /<RoleCrownAvatar role=\{user\.role\}/);
  assert.match(styles, /\.role-crown-avatar\.is-gold/);
  assert.match(styles, /\.role-crown-avatar\.is-silver/);
  assert.match(styles, /\.role-crown-avatar\.is-bronze/);
});

test("keeps operational portals out of storefront reveal motion", async () => {
  const [motionSystem, motionStyles] = await Promise.all([
    readFile(src("src/components/common/MotionSystem.tsx"), "utf8"),
    readFile(src("src/styles/base/motion.css"), "utf8"),
  ]);
  assert.match(motionSystem, /operationalPortal/);
  assert.match(motionSystem, /route-stage-static/);
  assert.doesNotMatch(motionSystem, /"\.admin-card"/);
  assert.doesNotMatch(motionSystem, /"\.admin-metric"/);
  assert.match(motionStyles, /\.route-stage-static/);
  assert.match(motionStyles, /animation: none/);
});

test("keeps long product catalogs visible while revealing cards individually", async () => {
  const [motionSystem, motionStyles] = await Promise.all([
    readFile(src("src/components/common/MotionSystem.tsx"), "utf8"),
    readFile(src("src/styles/base/motion.css"), "utf8"),
  ]);

  assert.match(motionSystem, /:not\(\.catalog-products-section\):not\(\.product-detail\)/);
  assert.match(motionSystem, /\.product-grid > \*/);
  assert.match(motionSystem, /\.product-detail > \*/);
  assert.match(motionSystem, /threshold: 0/);
  assert.match(motionSystem, /delete element\.dataset\.motionReveal/);
  assert.match(motionStyles, /\.catalog-products-section\[data-motion-reveal\]/);
  assert.match(motionStyles, /to \{ opacity: 1; transform: none; \}/);
});

test("shows every permitted admin tool in the animated mobile orbit menu", async () => {
  const [mobileNav, navigation, adminLayout, portalShell, styles, rootLayout] = await Promise.all([
    readFile(src("src/components/layout/AdminMobileOrbitNav.tsx"), "utf8"),
    readFile(src("src/constants/admin/navigation.ts"), "utf8"),
    readFile(src("app/admin/layout.tsx"), "utf8"),
    readFile(src("src/components/layout/BusinessPortalShell.tsx"), "utf8"),
    readFile(src("src/styles/admin/admin-mobile-orbit.css"), "utf8"),
    readFile(src("app/layout.tsx"), "utf8"),
  ]);
  assert.match(mobileNav, /adminNavigationForRole\(role, homeHref\)/);
  assert.match(mobileNav, /rail\.scrollTo/);
  assert.match(mobileNav, /prefers-reduced-motion/);
  assert.match(navigation, /flatMap\(\(group\) => group\.items\)/);
  assert.match(navigation, /!item\.roles \|\| item\.roles\.includes\(role\)/);
  assert.match(adminLayout, /AdminMobileOrbitNav role=\{user\.role\}/);
  assert.match(portalShell, /AdminMobileOrbitNav role=\{user\.role\}/);
  assert.match(styles, /scroll-snap-type: x mandatory/);
  assert.match(styles, /grid-template-columns: 32px minmax\(0,1fr\)/);
  assert.match(styles, /@keyframes admin-nav-enter/);
  assert.match(styles, /linear-gradient\(180deg,#fbfdff 0%,#f4f9ff 56%,#eef6fd 100%\)/);
  assert.match(styles, /\.admin-nav-groups a\.is-active\{border-color:#afd2f3/);
  assert.match(rootLayout, /admin-mobile-orbit\.css/);
});

test("uses verified model images and model-specific galleries for the phone and laptop catalog", async () => {
  const [catalog, expanded, retailExpansion, laptopManifest] = await Promise.all([
    readFile(src("app/current-catalog.ts"), "utf8"),
    readFile(src("app/expanded-products.ts"), "utf8"),
    readFile(src("app/retail-expansion-products.ts"), "utf8"),
    readFile(src("app/laptop-image-manifest.json"), "utf8"),
  ]);
  assert.match(catalog, /product-color-catalog\.json/);
  assert.match(catalog, /function applyColorCatalog/);
  assert.match(catalog, /verifiedLaptopImages\[product\.slug\]\?\.curated/);
  assert.match(expanded, /ipad-mini-a17\/colors\.png/);
  assert.match(expanded, /macbook-air-13-15-m4-official\.png/);
  assert.match(retailExpansion, /images: laptopGallery\(seed\.slug, image\)/);
  const manifest = JSON.parse(laptopManifest);
  assert.equal(Object.keys(manifest).length, 57);
  assert.equal(Object.values(manifest).filter((entry) => !entry.path).length, 0);
  assert.ok(Object.values(manifest).filter((entry) => entry.curated).length >= 56);
  for (const slug of ["hp-pavilion-plus-14-ew", "acer-predator-helios-neo-16", "microsoft-surface-laptop-7"]) {
    assert.ok(manifest[slug].gallery.length >= 1, `${slug} must include a verified gallery`);
  }
  assert.match(manifest["msi-stealth-18-ai-studio"].sourcePage, /msi\.com/);
  assert.doesNotMatch(JSON.stringify(manifest), /freepnglogo|common-hp-printer|inspiredpencil|MSI-Titan-MiniLED/);
});

test("gives every iPhone and MacBook family one verified image per official color", async () => {
  const colorCatalog = JSON.parse(await readFile(src("app/product-color-catalog.json"), "utf8"));
  const expectedColors = {
    "iphone-12": 6, "iphone-13": 6, "iphone-14": 6, "iphone-15": 5, "iphone-15-pro-max": 4, "iphone-16": 5,
    "iphone-16-pro-max": 4, "iphone-17": 5, "iphone-17-pro-max": 3, "iphone-air": 4, "iphone-se-3": 3,
    "macbook-air-13-m1": 3, "macbook-air-13-m2": 4, "macbook-air-13-m4": 4, "macbook-pro-13-m1": 2,
    "macbook-pro-14-m1-pro": 2, "macbook-pro-14-m3-pro": 2, "macbook-pro-16-m4-max": 2,
  };
  for (const [family, count] of Object.entries(expectedColors)) {
    assert.equal(colorCatalog[family]?.length, count, `${family} must list every official color`);
  }
  // Màu theo đúng đời máy: M1 chưa có Đêm Xanh Thẳm, Pro M1/M2 chưa có Đen Không Gian, M3 Pro trở đi không còn Xám.
  const names = (family) => colorCatalog[family].map((color) => color.name);
  assert.deepEqual(names("macbook-air-13-m1"), ["Xám Không Gian", "Vàng", "Bạc"]);
  assert.ok(!names("macbook-pro-14-m1-pro").includes("Đen Không Gian"));
  assert.ok(!names("macbook-pro-14-m3-pro").includes("Xám Không Gian"));
  assert.ok(names("iphone-17").includes("Tím Oải Hương"));
  for (const [family, colors] of Object.entries(colorCatalog)) {
    const images = colors.map((color) => color.image);
    assert.equal(new Set(images).size, images.length, `${family} must not reuse one photo for several colors`);
    for (const color of colors) {
      assert.match(color.hex, /^#[0-9a-f]{6}$/i, `${family} ${color.name} hex`);
      assert.doesNotMatch(color.name, /^[A-Za-z]+$/, `${family} color names must be accented Vietnamese`);
      const image = await readFile(src(`public${color.image}`));
      assert.ok(image.length > 4000, `${family} ${color.name} image must exist`);
    }
  }
});

test("applies one consistent dark palette across storefront and admin portals", async () => {
  const [layout, darkCss] = await Promise.all([
    readFile(src("app/layout.tsx"), "utf8"),
    readFile(src("src/styles/base/dark-mode.css"), "utf8"),
  ]);
  const imports = [...layout.matchAll(/^import "[^"]*?([^/"]+\.css)";/gm)].map((match) => match[1]);
  assert.equal(imports.at(-1), "dark-mode.css", "dark-mode.css must load last so it wins over every light stylesheet");
  for (const token of ["--dk-page", "--dk-surface", "--dk-inset", "--dk-text", "--dk-text-3", "--dk-accent-text", "--dk-photo"]) {
    assert.match(darkCss, new RegExp(`${token}:`));
  }
  for (const component of [".cps-footer", ".cps-product-card", ".cps-member-box", ".smem-form-col", ".pdp-spec-row", ".admin-console :is(td, dd)", ".status-paid", ".mobile-app-nav"]) {
    assert.ok(darkCss.includes(component), `${component} must be themed in dark mode`);
  }
  assert.doesNotMatch(darkCss.replace(/html\[data-theme="dark"\] \{[\s\S]*?\n\}/, ""), /^html\[data-theme="dark"\] \./m, "component rules must use the high-specificity dark prefix");
});

test("shows only image, name and real price on storefront product cards", async () => {
  const [card, productCard, showcases, block, deals, page] = await Promise.all([
    readFile(src("src/components/features/portal/catalog/ShopProductCard.tsx"), "utf8"),
    readFile(src("src/components/features/portal/catalog/ProductCard.tsx"), "utf8"),
    readFile(src("src/components/features/portal/home/HomeProductShowcases.tsx"), "utf8"),
    readFile(src("src/components/features/portal/home/StorefrontProductBlock.tsx"), "utf8"),
    readFile(src("src/components/features/portal/home/StorefrontFlashSale.tsx"), "utf8"),
    readFile(src("app/(portal)/page.tsx"), "utf8"),
  ]);
  for (const source of [productCard, showcases, block, deals]) assert.match(source, /ShopProductCard/);
  for (const source of [card, productCard, showcases, block, deals]) {
    assert.doesNotMatch(source, /specs\.slice|catalog-card-specs|home-showcase-specs|cps-member-box|đánh giá|Đã bán/);
  }
  // Giảm giá chỉ hiển thị khi giá gốc thật cao hơn giá bán — không sinh số giả theo vị trí thẻ.
  assert.match(card, /originalValue > currentValue/);
  assert.doesNotMatch(block, /discountPercent = 8 \+/);
  assert.doesNotMatch(page, /discountBadge|soldCount/);
});

test("renders the premium category bento, trust strip and perk cards with accessible motion", async () => {
  const [page, bento, commitments, perks, motion, styles] = await Promise.all([
    readFile(src("app/(portal)/page.tsx"), "utf8"),
    readFile(src("src/components/features/portal/home/HomeCategoryBento.tsx"), "utf8"),
    readFile(src("src/components/features/portal/home/StorefrontCommitments.tsx"), "utf8"),
    readFile(src("src/components/features/portal/home/StudentOfferBanner.tsx"), "utf8"),
    readFile(src("src/components/common/MotionSystem.tsx"), "utf8"),
    readFile(src("src/styles/base/ui-polish.css"), "utf8"),
  ]);
  assert.match(page, /<HomeCategoryBento \/>/);
  for (const href of ["/iphone", "/macbook", "/laptop", "/may-anh"]) assert.ok(bento.includes(`href: "${href}"`), href);
  assert.match(bento, /--spot-x/);
  assert.doesNotMatch(commitments, /🛡️|⚡/);
  assert.match(perks, /Giảm đến 3% cho học sinh, sinh viên/);
  assert.match(perks, /\/member#orders/);
  assert.match(perks, /perk-card perk-member[\s\S]*\/promo\/member-repair\.jpg/);
  await access(src("public/promo/member-repair.jpg"));
  for (const selector of [".home-bento > *", ".home-trust > *", ".home-perks > *"]) assert.ok(motion.includes(`"${selector}"`), selector);
  assert.match(styles, /@keyframes bento-float/);
  assert.match(styles, /@keyframes perk-shine/);
  assert.match(styles, /prefers-reduced-motion: reduce\) \{\n  \.bento-media, \.perk-shine \{ animation: none; \}/);
});

test("applies one admin design system across every operations page", async () => {
  const [layout, design] = await Promise.all([
    readFile(src("app/layout.tsx"), "utf8"),
    readFile(src("src/styles/admin/admin-design.css"), "utf8"),
  ]);
  const imports = [...layout.matchAll(/^import "[^"]*?([^/"]+\.css)";/gm)].map((match) => match[1]);
  assert.equal(imports.at(-2), "admin-design.css", "admin design loads right before the dark layer");
  for (const token of ["--ad-accent", "--ad-surface", "--ad-line", "--ad-ink"]) assert.match(design, new RegExp(`${token}:`));
  for (const part of [".admin-sidebar", ".admin-commandbar", ".admin-table th", ".admin-button-primary", ".status-paid", ".admin-quick-actions"]) {
    assert.ok(design.includes(part), part);
  }
  assert.match(design, /min-width: max-content/);
  assert.match(design, /prefers-reduced-motion: reduce/);
});

test("lets only owners and managers jump from the storefront to the exact product editor", async () => {
  const [adminAuth, catalogPage, browser, card, detail, editRedirect, editPage, styles] = await Promise.all([
    readFile(src("src/services/admin-auth.ts"), "utf8"),
    readFile(src("src/components/features/portal/catalog/CatalogPage.tsx"), "utf8"),
    readFile(src("src/components/features/portal/catalog/CatalogProductBrowser.tsx"), "utf8"),
    readFile(src("src/components/features/portal/catalog/ProductCard.tsx"), "utf8"),
    readFile(src("app/(portal)/san-pham/[slug]/page.tsx"), "utf8"),
    readFile(src("app/admin/products/edit/page.tsx"), "utf8"),
    readFile(src("app/admin/products/[id]/page.tsx"), "utf8"),
    readFile(src("src/styles/storefront/catalog-storefront.css"), "utf8"),
  ]);
  assert.match(adminAuth, /user\?\.role === "owner" \|\| user\?\.role === "manager"/);
  assert.match(catalogPage, /canManageProducts\(admin\)/);
  assert.match(browser, /canManage=\{canManageProducts\}/);
  assert.match(card, /storefront-product-edit/);
  assert.match(detail, /storefront-edit-dock/);
  assert.match(editRedirect, /getProductBySlug\(slug\)/);
  assert.match(editRedirect, /!canManageProducts\(user\)/);
  assert.match(editPage, /Xem ngoài cửa hàng/);
  assert.match(styles, /\.storefront-edit-dock\{/);
});

test("hides storefront header, footer, chatbot and app nav on every internal portal", async () => {
  const routes = await readFile(src("src/constants/shared/internal-routes.ts"), "utf8");
  for (const prefix of ["/admin", "/quan-ly", "/manager", "/manger", "/staff"]) assert.ok(routes.includes(`"${prefix}"`), prefix);
  for (const name of ["StorefrontHeader", "StorefrontFooter", "MobileAppNav", "LocalChatbot"]) {
    const source = await readFile(src(`app/components/${name}.tsx`), "utf8");
    assert.match(source, /hidesStorefrontChrome\(pathname\)/, name);
    assert.doesNotMatch(source, /pathname\.startsWith\("\/admin"\)/, name);
  }
});
