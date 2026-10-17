"use client";

import { PRODUCT_DETAIL } from "@/src/constants/portal/product-detail";
import { colorsForConfiguration, matchingVariants } from "../product-detail-model";
import { formatOrderMoney, productUnitPrice } from "@/src/lib/order-pricing";
import type { Dispatch, SetStateAction } from "react";
import type { Product } from "@/src/lib/products";

type RamSelectorProps = {
  ram: string;
  ramOptions: string[];
  product: Product;
  setRam: Dispatch<SetStateAction<string>>;
  setStorage: Dispatch<SetStateAction<string>>;
  setColor: Dispatch<SetStateAction<string>>;
  setChosenImage: Dispatch<SetStateAction<string>>;
};

export default function RamSelector({ ram, ramOptions, product, setRam, setStorage, setColor, setChosenImage }: RamSelectorProps) {
  return (
    <div className="pdp-option-group">
      <div className="pdp-option-header">
        <h3 className="pdp-option-title">{PRODUCT_DETAIL.ram}</h3>
        <span className="pdp-option-selected-label">{ram}</span>
      </div>
      <div className="pdp-chips-grid">
        {ramOptions.map((option) => {
          const firstStorage = matchingVariants(product, "", option).find((v) => v.storage && v.stock !== 0)?.storage ?? "";
          const available = matchingVariants(product, "", option).some((v) => v.stock !== 0);
          const isActive = ram === option;
          const priceDelta = productUnitPrice(product, firstStorage, "", option);
          return (
            <button
              key={option}
              type="button"
              disabled={!available}
              aria-pressed={isActive}
              className={`pdp-chip-card ${isActive ? "is-active" : ""}`}
              onClick={() => {
                setRam(option);
                setStorage(firstStorage);
                setColor(colorsForConfiguration(product, firstStorage, option)[0]?.name ?? "");
                setChosenImage("");
              }}
            >
              <strong className="pdp-chip-title">{option}</strong>
              <span className="pdp-chip-subtitle">
                {priceDelta ? formatOrderMoney(priceDelta) : PRODUCT_DETAIL.standard}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
