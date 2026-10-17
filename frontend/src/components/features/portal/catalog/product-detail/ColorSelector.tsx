"use client";

import { PRODUCT_DETAIL } from "@/src/constants/portal/product-detail";
import { findVariant, normalize } from "../product-detail-model";
import type { Dispatch, SetStateAction } from "react";
import type { Product, ProductColor, ProductVariant } from "@/src/lib/products";

type ColorSelectorProps = {
  activeColor: string;
  allColorOptions: ProductColor[];
  product: Product;
  activeStorage: string;
  ram: string;
  sellableVariants: ProductVariant[];
  setColor: Dispatch<SetStateAction<string>>;
  setChosenImage: Dispatch<SetStateAction<string>>;
};

export default function ColorSelector({ activeColor, allColorOptions, product, activeStorage, ram, sellableVariants, setColor, setChosenImage }: ColorSelectorProps) {
  return (
    <div className="pdp-option-group">
      <div className="pdp-option-header">
        <h3 className="pdp-option-title">{PRODUCT_DETAIL.color}</h3>
        <span className="pdp-option-selected-label">{activeColor}</span>
      </div>
      <div className="pdp-colors-list">
        {allColorOptions.map((option) => {
          const variant = findVariant(product, activeStorage, ram, option.name);
          const available = !sellableVariants.length || Boolean(variant && normalize(variant.color) === normalize(option.name) && variant.stock !== 0);
          const isActive = normalize(activeColor) === normalize(option.name);
          return (
            <button
              key={option.name}
              type="button"
              disabled={!available}
              aria-pressed={isActive}
              className={`pdp-color-swatch-btn ${isActive ? "is-active" : ""}`}
              onClick={() => {
                setColor(option.name);
                setChosenImage(variant?.image ?? "");
              }}
            >
              <span className="pdp-color-dot" style={{ backgroundColor: option.hex }} />
              <span>{option.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
