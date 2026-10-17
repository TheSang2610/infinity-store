"use client";

import { PRODUCT_DETAIL } from "@/src/constants/portal/product-detail";
import type { Product } from "@/src/lib/products";
import Image from "next/image";
import type { Dispatch, SetStateAction, RefObject } from "react";

type ProductGalleryProps = {
  galleryDialog: RefObject<HTMLDialogElement | null>;
  gallery: string[];
  changeImage: (direction: number) => void;
  product: Product;
  currentImageIndex: number;
  activeImage: string;
  activeColor: string;
  setChosenImage: Dispatch<SetStateAction<string>>;
};

export default function ProductGallery({ galleryDialog, gallery, changeImage, product, currentImageIndex, activeImage, activeColor, setChosenImage }: ProductGalleryProps) {
  return (
    <div className="pdp-gallery-column">
      <div className="pdp-gallery-main">
        <button type="button" className="pdp-zoom-button" onClick={() => galleryDialog.current?.showModal()} aria-label={PRODUCT_DETAIL.openLightbox}>{PRODUCT_DETAIL.viewLarge}</button>
        {gallery.length > 1 && <div className="pdp-gallery-arrows"><button type="button" onClick={() => changeImage(-1)} aria-label={PRODUCT_DETAIL.previousImage}>←</button><button type="button" onClick={() => changeImage(1)} aria-label={PRODUCT_DETAIL.nextImage}>→</button></div>}
        {product.badge && (
          <span className="pdp-gallery-badge">
            <span aria-hidden="true"></span> {product.badge}
          </span>
        )}
        {gallery.length > 1 && (
          <span className="pdp-gallery-counter">
            {String(currentImageIndex + 1).padStart(2, "0")} / {String(gallery.length).padStart(2, "0")}
          </span>
        )}
        <Image
          src={activeImage}
          alt={`${product.name}${activeColor ? ` - ${activeColor}` : ""}`}
          fill
          priority
          unoptimized
          sizes="(max-width: 900px) 100vw, 700px"
          className="pdp-gallery-main-img"
        />
      </div>

      {/* Thumbnails */}
      {gallery.length > 1 && (
        <div className="pdp-thumbnails-wrap" aria-label={PRODUCT_DETAIL.thumbnails}>
          {gallery.map((image, idx) => (
            <button
              key={`${image}-${idx}`}
              type="button"
              className={`pdp-thumb-btn ${activeImage === image ? "is-active" : ""}`}
              onClick={() => setChosenImage(image)}
              aria-label={PRODUCT_DETAIL.viewImage(idx + 1)}
              aria-pressed={activeImage === image}
            >
              <Image src={image} alt="" fill unoptimized sizes="76px" className="pdp-thumb-img" />
            </button>
          ))}
        </div>
      )}
      <p className="pdp-gallery-note">
        {PRODUCT_DETAIL.imageNote}</p>
    </div>
  );
}
