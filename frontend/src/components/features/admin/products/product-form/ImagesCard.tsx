"use client";

import { PRODUCT_FORM } from "@/src/constants/admin/components";
import {
  MAX_PRODUCT_IMAGE_BYTES, MAX_PRODUCT_IMAGE_LABEL, RECOMMENDED_PRODUCT_IMAGE_EDGE,
} from "@/src/constants/shared/product-image-policy";
import Image from "next/image";
import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";

type ImagesCardProps = {
  images: string[];
  previews: string[];
  primaryImage: string;
  setPrimaryImage: Dispatch<SetStateAction<string>>;
  setPreviews: Dispatch<SetStateAction<string[]>>;
  setImages: Dispatch<SetStateAction<string[]>>;
};

export default function ImagesCard({ images, previews, primaryImage, setPrimaryImage, setPreviews, setImages }: ImagesCardProps) {
  const [imageWarnings, setImageWarnings] = useState<string[]>([]);
  function onFiles(input: HTMLInputElement) {
    const files = Array.from(input.files ?? []);
    const isAccepted = (file: File) => file.type.startsWith("image/") && file.size <= MAX_PRODUCT_IMAGE_BYTES;
    const accepted = files.filter(isAccepted);
    const rejected = files.filter((file) => !isAccepted(file));
    // Bo anh bi loai khoi o chon tep, neu khong van bi gui len va ca lan luu that bai.
    if (rejected.length) {
      const kept = new DataTransfer();
      accepted.forEach((file) => kept.items.add(file));
      input.files = kept.files;
    }
    previews.forEach((url) => URL.revokeObjectURL(url));
    const next = accepted.map((file) => URL.createObjectURL(file));
    setPreviews(next);
    setImageWarnings(rejected.map((file) => PRODUCT_FORM.imageTooLarge(file.name, MAX_PRODUCT_IMAGE_LABEL)));
    accepted.forEach((file) => validateImageDimensions(file));
    // Anh chinh dang tro vao lan chon truoc (blob cu) thi chuyen sang anh dau cua lan chon moi.
    if ((!primaryImage || primaryImage.startsWith("blob:")) && next[0]) setPrimaryImage(next[0]);
    else if (primaryImage.startsWith("blob:")) setPrimaryImage(images[0] ?? "");
  }
  function validateImageDimensions(file: File) {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      if (image.naturalWidth < RECOMMENDED_PRODUCT_IMAGE_EDGE || image.naturalHeight < RECOMMENDED_PRODUCT_IMAGE_EDGE) {
        setImageWarnings((items) => [...items, PRODUCT_FORM.imageTooSmall(file.name, image.naturalWidth, image.naturalHeight, RECOMMENDED_PRODUCT_IMAGE_EDGE)]);
      }
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      setImageWarnings((items) => [...items, PRODUCT_FORM.imageUnreadable(file.name)]);
      URL.revokeObjectURL(url);
    };
    image.src = url;
  }
  function removeExistingImage(image: string) {
    setImages((items) => items.filter((item) => item !== image));
    if (primaryImage === image) setPrimaryImage(images.find((item) => item !== image) ?? previews[0] ?? "");
  }

  return (
    <div className="admin-card admin-product-step-card">
      <div className="admin-card-head"><div className="admin-product-step-title"><b>02</b><div><span>{PRODUCT_FORM.stepImages}</span><h2>{PRODUCT_FORM.galleryTitle}</h2><p>{PRODUCT_FORM.galleryText}</p></div></div><em className="admin-product-count">{images.length + previews.length} {PRODUCT_FORM.imagesSuffix}</em></div>
      <label className="admin-dropzone">
        <input name="imageFiles" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" multiple onChange={(event) => onFiles(event.currentTarget)} />
        <strong>{PRODUCT_FORM.dropzone}</strong>
        <small>{PRODUCT_FORM.formatsPrefix}{MAX_PRODUCT_IMAGE_LABEL}{PRODUCT_FORM.perImageSuffix}</small>
        <small>{PRODUCT_FORM.sharpHintPrefix}{RECOMMENDED_PRODUCT_IMAGE_EDGE}×{RECOMMENDED_PRODUCT_IMAGE_EDGE}px.</small>
      </label>
      {imageWarnings.length > 0 && <div className="admin-image-warnings" role="status">{imageWarnings.map((warning) => <p key={warning}>{warning}</p>)}</div>}
      <div className="admin-image-grid">
        {[...images, ...previews].map((image, index) => (
          <div key={`${image}-${index}`} className={`admin-image-item${primaryImage === image ? " is-primary" : ""}`}>
            <button type="button" className="admin-image-select" onClick={() => setPrimaryImage(image)} aria-label={PRODUCT_FORM.setAsPrimary}>
              {image.startsWith("blob:") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt={PRODUCT_FORM.newImageAlt} />
              ) : (
                <Image src={image} alt={PRODUCT_FORM.imageAlt} width={160} height={120} unoptimized />
              )}
              <span>{primaryImage === image ? PRODUCT_FORM.primaryImage : PRODUCT_FORM.choosePrimary}</span>
            </button>
            {!image.startsWith("blob:") && <button type="button" className="admin-image-remove" onClick={() => removeExistingImage(image)} aria-label={PRODUCT_FORM.removeImage} title={PRODUCT_FORM.removeImage}>×</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
