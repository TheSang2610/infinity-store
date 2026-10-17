"use client";

import { PRODUCT_DETAIL } from "@/src/constants/portal/product-detail";
import type { Product } from "@/src/lib/products";
import Image from "next/image";
import type { RefObject } from "react";

type GalleryDialogProps = {
  galleryDialog: RefObject<HTMLDialogElement | null>;
  product: Product;
  changeImage: (direction: number) => void;
  activeImage: string;
  gallery: string[];
  currentImageIndex: number;
};

export default function GalleryDialog({ galleryDialog, product, changeImage, activeImage, gallery, currentImageIndex }: GalleryDialogProps) {
  return (
    <dialog ref={galleryDialog} className="pdp-image-dialog" aria-label={PRODUCT_DETAIL.imagesOf(product.name)} onClick={(event) => { if (event.target === event.currentTarget) galleryDialog.current?.close(); }} onKeyDown={(event) => {
      if (event.key === "ArrowRight") { event.preventDefault(); changeImage(1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); changeImage(-1); }
    }}>
      <div className="pdp-dialog-toolbar"><span>{product.name}</span><button type="button" onClick={() => galleryDialog.current?.close()} aria-label={PRODUCT_DETAIL.closeLightbox}>✕</button></div>
      <div className="pdp-dialog-image"><Image src={activeImage} alt={product.name} fill unoptimized sizes="90vw" /></div>
      <div className="pdp-dialog-controls"><button type="button" disabled={gallery.length < 2} onClick={() => changeImage(-1)} aria-label={PRODUCT_DETAIL.previousImage}>←</button><span aria-live="polite">{currentImageIndex + 1} / {gallery.length}</span><button type="button" disabled={gallery.length < 2} onClick={() => changeImage(1)} aria-label={PRODUCT_DETAIL.nextImage}>→</button></div>
    </dialog>
  );
}
