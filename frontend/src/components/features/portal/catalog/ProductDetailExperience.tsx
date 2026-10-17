"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/src/lib/products";
import { formatOrderMoney, productUnitPrice } from "@/src/lib/order-pricing";
import { useCart } from "@/src/hooks/cart";
import { PRODUCT_DETAIL } from "@/src/constants/portal/product-detail";
import {
  CATEGORY_NAMES, colorsForConfiguration, findVariant, matchingVariants, normalize, parseSpecHighlights, uniqueImages,
} from "./product-detail-model";
import GalleryDialog from "./product-detail/GalleryDialog";
import StickyBuyBar from "./product-detail/StickyBuyBar";
import ProductGallery from "./product-detail/ProductGallery";
import RamSelector from "./product-detail/RamSelector";
import StorageSelector from "./product-detail/StorageSelector";
import ColorSelector from "./product-detail/ColorSelector";
import BuyActions from "./product-detail/BuyActions";
import TrustGrid from "./product-detail/TrustGrid";
import HighlightsSection from "./product-detail/HighlightsSection";
import SpecsSection from "./product-detail/SpecsSection";
import ServicesSection from "./product-detail/ServicesSection";
import RelatedProducts from "./product-detail/RelatedProducts";

export default function ProductDetailExperience({
  product,
  relatedProducts = [],
}: {
  product: Product;
  relatedProducts?: Product[];
  canManage?: boolean;
}) {
  const { addItem, isLoggedIn, openLoginModal } = useCart();
  const galleryDialog = useRef<HTMLDialogElement>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);

  const handleBuyNow = (e: React.MouseEvent) => {
    if (!canAddToCart) {
      e.preventDefault();
      return;
    }
    if (!isLoggedIn) {
      e.preventDefault();
      openLoginModal();
    }
  };

  // Variant matching
  const sellableVariants = useMemo(() => (product.variants ?? []).filter((variant) => variant.status !== "inactive"), [product]);
  const storageOptions = useMemo(
    () => Array.from(new Set([...sellableVariants.map((variant) => variant.storage), ...(product.storageOptions ?? [])].filter((item): item is string => Boolean(item)))),
    [product.storageOptions, sellableVariants]
  );
  const ramOptions = useMemo(
    () => Array.from(new Set(sellableVariants.map((variant) => variant.ram).filter((ram): ram is string => Boolean(ram)))),
    [sellableVariants]
  );
  const allColorOptions = useMemo(() => {
    const variantColors = sellableVariants
      .filter((variant) => variant.color)
      .filter((variant, index, list) => list.findIndex((item) => normalize(item.color) === normalize(variant.color)) === index)
      .map((variant) => ({ name: variant.color as string, hex: variant.colorHex || "#111111" }));
    return variantColors.length
      ? variantColors
      : product.colorOptions?.length
      ? product.colorOptions
      : (product.colors && product.colors.length > 0)
      ? product.colors.map((hex, index) => ({ name: PRODUCT_DETAIL.colorNumber(index + 1), hex }))
      : [{ name: PRODUCT_DETAIL.standard, hex: "#0088cc" }];
  }, [product.colorOptions, product.colors, sellableVariants]);

  // Selections
  const [ram, setRam] = useState(ramOptions.find((option) => matchingVariants(product, "", option).some((variant) => variant.stock !== 0)) ?? ramOptions[0] ?? "");
  const availableStorageOptions = useMemo(() => {
    if (!ram) return storageOptions;
    return Array.from(new Set(matchingVariants(product, "", ram).filter((variant) => variant.stock !== 0).map((variant) => variant.storage).filter((item): item is string => Boolean(item))));
  }, [product, ram, storageOptions]);

  const [storage, setStorage] = useState(availableStorageOptions[0] ?? storageOptions[0] ?? "");
  const activeStorage = availableStorageOptions.includes(storage) ? storage : availableStorageOptions[0] ?? storage;
  const availableColors = useMemo(() => colorsForConfiguration(product, activeStorage, ram), [activeStorage, product, ram]);
  const [color, setColor] = useState(availableColors[0]?.name ?? "");
  const activeColor = availableColors.find((item) => normalize(item.name) === normalize(color))?.name ?? availableColors[0]?.name ?? "";
  const selectedVariant = useMemo(() => findVariant(product, activeStorage, ram, activeColor), [activeColor, activeStorage, product, ram]);
  const selectedStock = selectedVariant?.stock ?? product.stock;
  const canAddToCart = selectedStock !== 0 && (!(product.variants?.length) || Boolean(selectedVariant && selectedVariant.status !== "inactive" && selectedVariant.stock !== 0));

  // Gallery
  const gallery = useMemo(
    () => uniqueImages([selectedVariant?.image, product.image, ...(product.images ?? []), ...(product.variants ?? []).map((variant) => variant.image)]),
    [product, selectedVariant?.image]
  );
  const [chosenImage, setChosenImage] = useState("");
  const activeImage = gallery.includes(chosenImage) ? chosenImage : selectedVariant?.image || gallery[0] || product.image;
  const currentImageIndex = gallery.indexOf(activeImage);

  const changeImage = (direction: number) => {
    if (gallery.length > 1) setChosenImage(gallery[(currentImageIndex + direction + gallery.length) % gallery.length]);
  };

  // Pricing
  const selectedPrice = productUnitPrice(product, activeStorage, activeColor, ram);
  const selectedPriceFormatted = selectedPrice ? formatOrderMoney(selectedPrice) : product.price;

  // URLs
  const orderHref = `/dat-hang?may=${encodeURIComponent(product.slug)}${ram ? `&ram=${encodeURIComponent(ram)}` : ""}${activeStorage ? `&dung-luong=${encodeURIComponent(activeStorage)}` : ""}${activeColor ? `&mau=${encodeURIComponent(activeColor)}` : ""}`;
  const installmentHref = `/tra-gop?may=${encodeURIComponent(product.slug)}&gia=${selectedPrice}`;

  // Specs highlights
  const specHighlights = useMemo(() => parseSpecHighlights(product.specs || []), [product.specs]);

  // Sticky Bar Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 480) {
        setStickyVisible(true);
      } else {
        setStickyVisible(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    addItem({
      productSlug: product.slug,
      productName: product.name,
      image: activeImage,
      ram,
      storage: activeStorage,
      color: activeColor,
      unitPrice: selectedPrice,
    });
    if (!isLoggedIn) return;
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2400);
  };

  const categoryName = CATEGORY_NAMES[product.category] || PRODUCT_DETAIL.categoryDefault;
  const configurationSummary = [ram, activeStorage, activeColor].filter(Boolean).join(" · ") || PRODUCT_DETAIL.standardConfig;

  return (
    <div className="pdp-container pdp-refined">
      <GalleryDialog galleryDialog={galleryDialog} product={product} changeImage={changeImage} activeImage={activeImage} gallery={gallery} currentImageIndex={currentImageIndex} />
      {/* Sticky Purchase Bar */}
      <StickyBuyBar stickyVisible={stickyVisible} activeImage={activeImage} product={product} configurationSummary={configurationSummary} selectedPriceFormatted={selectedPriceFormatted} canAddToCart={canAddToCart} handleAddToCart={handleAddToCart} addedToCart={addedToCart} orderHref={orderHref} handleBuyNow={handleBuyNow} />

      {/* Breadcrumb Navigation */}
      <nav className="pdp-breadcrumb" aria-label={PRODUCT_DETAIL.breadcrumb}>
        <Link href="/">{PRODUCT_DETAIL.home}</Link>
        <span className="sep">/</span>
        <Link href={`/${product.category}`}>{categoryName}</Link>
        <span className="sep">/</span>
        <span className="current">{product.name}</span>
      </nav>

      {/* ====================================================================
          HERO SECTION: 2-COLUMN GRID (LEFT GALLERY / RIGHT INFO)
          ==================================================================== */}
      <section id="pdp-overview" className="pdp-hero-grid" aria-labelledby="pdp-product-title">
        {/* LEFT: GALLERY */}
        <ProductGallery galleryDialog={galleryDialog} gallery={gallery} changeImage={changeImage} product={product} currentImageIndex={currentImageIndex} activeImage={activeImage} activeColor={activeColor} setChosenImage={setChosenImage} />

        {/* RIGHT: PRODUCT INFO & CONFIGURATION */}
        <div className="pdp-info-column">
          {/* Kicker */}
          <div className="pdp-kicker-row">
            <span className="pdp-kicker-badge">
              {product.brand ? product.brand.toUpperCase() : PRODUCT_DETAIL.deviceEyebrow}
            </span>
            {product.condition === "like-new" ? (
              <span
                className="pdp-condition-badge pdp-condition-likenew"
                style={{
                  background: "#fff7ed",
                  color: "#c2410c",
                  border: "1px solid #fed7aa",
                  padding: "3px 9px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {PRODUCT_DETAIL.conditionLikeNew}</span>
            ) : product.condition === "new" ? (
              <span
                className="pdp-condition-badge pdp-condition-new"
                style={{
                  background: "#ecfdf5",
                  color: "#047857",
                  border: "1px solid #a7f3d0",
                  padding: "3px 9px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {PRODUCT_DETAIL.conditionNew}</span>
            ) : null}
            {product.sku && <span className="pdp-sku-badge">{PRODUCT_DETAIL.skuPrefix}{product.sku}</span>}
          </div>

          {/* Product Name */}
          <h1 id="pdp-product-title" className="pdp-title">
            {product.name}
          </h1>

          {/* Tagline */}
          {product.tagline && <p className="pdp-tagline">{product.tagline}</p>}

          {/* Price Card */}
          <div className="pdp-price-card">
            <span className="pdp-price-label">{PRODUCT_DETAIL.selectedPrice}</span>
            <div className="pdp-price-row">
              <strong className="pdp-current-price">{selectedPriceFormatted}</strong>
              {product.salePrice && product.price && product.salePrice !== product.price && (
                <>
                  <span className="pdp-compare-price">{product.price}</span>
                  <span className="pdp-save-badge">{PRODUCT_DETAIL.savings}</span>
                </>
              )}
            </div>
            <p className="pdp-price-caption">
              <span>{PRODUCT_DETAIL.vatIncluded}</span>
              <span>•</span>
              <span>{PRODUCT_DETAIL.eInvoice}</span>
              <span>•</span>
              <span>{PRODUCT_DETAIL.warranty}</span>
            </p>
          </div>

          {/* RAM Selector (MacBook / Laptop) */}
          {ramOptions.length > 0 && (
            <RamSelector ram={ram} ramOptions={ramOptions} product={product} setRam={setRam} setStorage={setStorage} setColor={setColor} setChosenImage={setChosenImage} />
          )}

          {/* Storage / SSD Selector */}
          {storageOptions.length > 0 && (
            <StorageSelector ramOptions={ramOptions} activeStorage={activeStorage} storageOptions={storageOptions} product={product} ram={ram} sellableVariants={sellableVariants} setStorage={setStorage} setColor={setColor} setChosenImage={setChosenImage} />
          )}

          {/* Color Selector */}
          {allColorOptions.length > 0 && (
            <ColorSelector activeColor={activeColor} allColorOptions={allColorOptions} product={product} activeStorage={activeStorage} ram={ram} sellableVariants={sellableVariants} setColor={setColor} setChosenImage={setChosenImage} />
          )}

          {/* Stock & Availability Indicator */}
          <div className={`pdp-stock-banner ${canAddToCart ? "in-stock" : "out-of-stock"}`}>
            <div className="pdp-stock-left">
              <span className="pdp-stock-indicator-dot" />
              <span>
                {canAddToCart ? PRODUCT_DETAIL.inStock : PRODUCT_DETAIL.configOutOfStock}
              </span>
            </div>
            {selectedStock !== undefined && selectedStock > 0 && (
              <span className="pdp-stock-count">
                {selectedStock <= 3 ? PRODUCT_DETAIL.onlyLeft(selectedStock) : PRODUCT_DETAIL.inStockCount(selectedStock)}
              </span>
            )}
          </div>

          <div className="pdp-selection-summary" aria-live="polite"><span>{PRODUCT_DETAIL.yourChoice}</span><strong>{configurationSummary}</strong></div>
          {/* Conversion CTA Block */}
          <BuyActions canAddToCart={canAddToCart} orderHref={orderHref} handleBuyNow={handleBuyNow} addedToCart={addedToCart} handleAddToCart={handleAddToCart} installmentHref={installmentHref} />

          {/* Trust & Commitments Micro-Grid (2x2) */}
          <TrustGrid />
        </div>
      </section>

      {/* ====================================================================
          SECTION: ĐIỂM NỔI BẬT (HIGHLIGHTS GRID)
          ==================================================================== */}
      <nav className="pdp-section-nav" aria-label={PRODUCT_DETAIL.tabsLabel}>
        <a href="#pdp-overview">{PRODUCT_DETAIL.tabOverview}</a>
        {specHighlights.length > 0 && <a href="#pdp-highlights">{PRODUCT_DETAIL.tabHighlights}</a>}
        {Boolean(product.specs?.length) && <a href="#pdp-specifications">{PRODUCT_DETAIL.tabSpecs}</a>}
        <a href="#pdp-services">{PRODUCT_DETAIL.tabServices}</a>
      </nav>
      {specHighlights.length > 0 && (
        <HighlightsSection product={product} specHighlights={specHighlights} />
      )}

      {/* ====================================================================
          SECTION: THÔNG SỐ KỸ THUẬT (SPECIFICATIONS)
          ==================================================================== */}
      {product.specs && product.specs.length > 0 && (
        <SpecsSection product={product} />
      )}

      {/* ====================================================================
          SECTION: MUA SẮM TẠI INFINITY STORE
          ==================================================================== */}
      <ServicesSection />

      {/* ====================================================================
          SECTION: INSTALLMENT BANNER
          ==================================================================== */}
      <section className="pdp-section-wrap" aria-label={PRODUCT_DETAIL.installmentSimulator}>
        <div className="pdp-installment-banner">
          <div className="pdp-installment-info">
            <span className="pdp-section-eyebrow" style={{ color: "#38bdf8" }}>{PRODUCT_DETAIL.financeEyebrow}</span>
            <h3>{PRODUCT_DETAIL.financeTitle}</h3>
            <p>
              {PRODUCT_DETAIL.financeOwnNow}<strong>{product.name}</strong> {PRODUCT_DETAIL.financeText}</p>
          </div>
          <Link href={installmentHref} className="pdp-installment-cta">
            <span>{PRODUCT_DETAIL.financeCta}</span>
          </Link>
        </div>
      </section>

      {/* ====================================================================
          SECTION: SẢN PHẨM CÙNG DÒNG / CÓ THỂ BẠN QUAN TÂM
          ==================================================================== */}
      {relatedProducts && relatedProducts.length > 0 && (
        <RelatedProducts relatedProducts={relatedProducts} />
      )}
    </div>
  );
}
