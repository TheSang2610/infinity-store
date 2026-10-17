"use client";

import { PRODUCT_DETAIL } from "@/src/constants/portal/product-detail";
import { colorsForConfiguration, matchingVariants } from "../product-detail-model";
import { formatOrderMoney, productUnitPrice } from "@/src/lib/order-pricing";
import type { Dispatch, SetStateAction } from "react";
import type { Product, ProductVariant } from "@/src/lib/products";

type StorageSelectorProps = {
  ramOptions: string[];
  activeStorage: string;
  storageOptions: string[];
  product: Product;
  ram: string;
  sellableVariants: ProductVariant[];
  setStorage: Dispatch<SetStateAction<string>>;
  setColor: Dispatch<SetStateAction<string>>;
  setChosenImage: Dispatch<SetStateAction<string>>;
};

export default function StorageSelector({ ramOptions, activeStorage, storageOptions, product, ram, sellableVariants, setStorage, setColor, setChosenImage }: StorageSelectorProps) {
  return (
    <div className="pdp-option-group">
      <div className="pdp-option-header">
        <h3 className="pdp-option-title">{ramOptions.length > 0 ? PRODUCT_DETAIL.ssd : PRODUCT_DETAIL.storage}</h3>
        <span className="pdp-option-selected-label">{activeStorage}</span>
      </div>
      <div className="pdp-chips-grid">
        {storageOptions.map((option) => {
          const available = matchingVariants(product, option, ram).some((v) => v.stock !== 0) || !sellableVariants.length;
          const isActive = activeStorage === option;
          const optionPrice = productUnitPrice(product, option, "", ram);
          return (
            <button
              key={option}
              type="button"
              disabled={!available}
              aria-pressed={isActive}
              className={`pdp-chip-card ${isActive ? "is-active" : ""}`}
              onClick={() => {
                setStorage(option);
                setColor(colorsForConfiguration(product, option, ram)[0]?.name ?? "");
                setChosenImage("");
              }}
            >
              <strong className="pdp-chip-title">{option}</strong>
              <span className="pdp-chip-subtitle">
                {optionPrice ? formatOrderMoney(optionPrice) : PRODUCT_DETAIL.byConfig}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
