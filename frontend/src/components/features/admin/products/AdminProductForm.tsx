"use client";

import Link from "next/link";
import { useState } from "react";
import type { ManagedProduct, ProductCategory } from "@/src/types";
import type { ProductVariant } from "@/src/lib/products";
import { saveAdminProductAction } from "@/src/actions/admin/orders-products";
import { PRODUCT_FIELD_CONFIG, editableCategory } from "@/src/constants/admin/product-fields";
import { PRODUCT_FORM } from "@/src/constants/admin/components";
import { productSpecValue } from "./product-form-model";
import BasicInfoCard from "./product-form/BasicInfoCard";
import ImagesCard from "./product-form/ImagesCard";
import ConfigurationCard from "./product-form/ConfigurationCard";
import SeoCard from "./product-form/SeoCard";
import ProductPreviewCard from "./product-form/ProductPreviewCard";

export default function AdminProductForm({ product }: { product?: ManagedProduct }) {
  const initialImages = product?.images?.length ? product.images : product?.image ? [product.image] : [];
  const [images, setImages] = useState(initialImages);
  const [primaryImage, setPrimaryImage] = useState(product?.image ?? initialImages[0] ?? "");
  const [previews, setPreviews] = useState<string[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants ?? []);
  const [name, setName] = useState(product?.name ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "Apple");
  const [tagline, setTagline] = useState(product?.tagline ?? "");
  const [badge, setBadge] = useState(product?.badge ?? "");
  const [category, setCategory] = useState<ProductCategory>(product?.category ?? "iphone");
  const fieldGroup = editableCategory(category);
  const [sellingPrice, setSellingPrice] = useState(product?.sellingPrice ?? product?.price ?? "");
  const [salePrice, setSalePrice] = useState(product?.salePrice ?? "");
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [status, setStatus] = useState(product?.status ?? (product?.active === false ? "inactive" : "active"));
  const [specsText, setSpecsText] = useState(product?.specs?.join("\n") ?? "");
  const [matrixVersion, setMatrixVersion] = useState("");
  const [modelChip, setModelChip] = useState(() => productSpecValue(product, ["Chip / CPU", PRODUCT_FORM.chipLabel]) || product?.variants?.[0]?.version || "");
  const [screenSize, setScreenSize] = useState(() => productSpecValue(product, [PRODUCT_FORM.screenSize]) || product?.variants?.[0]?.size || "");
  const fieldConfig = PRODUCT_FIELD_CONFIG[fieldGroup];

  return (
    <form action={saveAdminProductAction} className="admin-editor-grid">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <input type="hidden" name="slug" value={product?.slug ?? ""} />
      <input type="hidden" name="existingImages" value={images.join("\n")} />
      <input type="hidden" name="primaryImage" value={primaryImage && !primaryImage.startsWith("blob:") ? primaryImage : ""} />
      <input type="hidden" name="primaryUploadIndex" value={primaryImage.startsWith("blob:") ? previews.indexOf(primaryImage) : -1} />
      <input type="hidden" name="variantsJson" value={JSON.stringify(variants)} />

      <header className="admin-product-editor-hero">
        <div><span>PRODUCT WORKSPACE</span><h2>{product ? PRODUCT_FORM.editTitle : PRODUCT_FORM.newTitle}</h2><p>{PRODUCT_FORM.intro}</p></div>
        <ol aria-label={PRODUCT_FORM.stepsLabel}>
          <li className="is-current"><b>01</b><span>{PRODUCT_FORM.stepProduct}</span></li>
          <li><b>02</b><span>{PRODUCT_FORM.stepImages}</span></li>
          <li><b>03</b><span>{PRODUCT_FORM.stepConfig}</span></li>
          <li><b>04</b><span>{PRODUCT_FORM.stepPublish}</span></li>
        </ol>
      </header>

      <section className="admin-editor-main">
        <BasicInfoCard status={status} setStatus={setStatus} name={name} setName={setName} category={category} setCategory={setCategory} brand={brand} setBrand={setBrand} fieldGroup={fieldGroup} modelChip={modelChip} setModelChip={setModelChip} setMatrixVersion={setMatrixVersion} screenSize={screenSize} setScreenSize={setScreenSize} sellingPrice={sellingPrice} setSellingPrice={setSellingPrice} stock={stock} setStock={setStock} tagline={tagline} setTagline={setTagline} fieldConfig={fieldConfig} product={product} badge={badge} setBadge={setBadge} salePrice={salePrice} setSalePrice={setSalePrice} setSpecsText={setSpecsText} />

        <ImagesCard images={images} previews={previews} primaryImage={primaryImage} setPrimaryImage={setPrimaryImage} setPreviews={setPreviews} setImages={setImages} />

        <ConfigurationCard fieldConfig={fieldConfig} fieldGroup={fieldGroup} matrixVersion={matrixVersion} setMatrixVersion={setMatrixVersion} product={product} specsText={specsText} setSpecsText={setSpecsText} variants={variants} setVariants={setVariants} modelChip={modelChip} screenSize={screenSize} sellingPrice={sellingPrice} />

        <SeoCard product={product} name={name} />
      </section>

      <aside className="admin-editor-side">
        <ProductPreviewCard status={status} badge={badge} brand={brand} name={name} tagline={tagline} salePrice={salePrice} sellingPrice={sellingPrice} stock={stock} primaryImage={primaryImage} previews={previews} images={images} category={category} variants={variants} />
        <div className="admin-sticky-actions">
          <button className="admin-button admin-button-primary" name="mode" value="save" type="submit">{PRODUCT_FORM.save}</button>
          <button className="admin-button admin-button-muted" name="mode" value="draft" type="submit" onClick={() => setStatus("draft")}>{PRODUCT_FORM.saveDraft}</button>
          <button className="admin-button" name="mode" value="another" type="submit">{PRODUCT_FORM.saveAndAdd}</button>
          <Link className="admin-button admin-button-muted" href="/admin/products">{PRODUCT_FORM.cancel}</Link>
        </div>
      </aside>
    </form>
  );
}
