"use client";

import { PRODUCT_FORM } from "@/src/constants/admin/components";
import {
  MACBOOK_COLORS, MacbookColor, initialMacbookColors, normalizeConfiguration, parseConfigurationValues,
  parseCustomColors,
} from "../product-form-model";
import { MAX_PRODUCT_IMAGE_LABEL } from "@/src/constants/shared/product-image-policy";
import Image from "next/image";
import { useMemo, useState } from "react";
import { EditableCategory, ProductFieldConfig, technicalValuesFromSpecs } from "@/src/constants/admin/product-fields";
import type { ProductVariant } from "@/src/lib/products";
import type { Dispatch, SetStateAction } from "react";
import type { ManagedProduct } from "@/src/types";

type ConfigurationCardProps = {
  fieldConfig: ProductFieldConfig;
  fieldGroup: EditableCategory;
  matrixVersion: string;
  setMatrixVersion: Dispatch<SetStateAction<string>>;
  product: ManagedProduct | undefined;
  specsText: string;
  setSpecsText: Dispatch<SetStateAction<string>>;
  variants: ProductVariant[];
  setVariants: Dispatch<SetStateAction<ProductVariant[]>>;
  modelChip: string;
  screenSize: string;
  sellingPrice: string;
};

export default function ConfigurationCard({ fieldConfig, fieldGroup, matrixVersion, setMatrixVersion, product, specsText, setSpecsText, variants, setVariants, modelChip, screenSize, sellingPrice }: ConfigurationCardProps) {
  const [technicalValues, setTechnicalValues] = useState<Record<string, string>>(() => technicalValuesFromSpecs(product?.specs));
  const [matrixRam, setMatrixRam] = useState("8GB, 16GB");
  const [matrixStorage, setMatrixStorage] = useState("256GB, 512GB");
  const [matrixColorNames, setMatrixColorNames] = useState("");
  const [matrixSize, setMatrixSize] = useState("");
  const [matrixMessage, setMatrixMessage] = useState("");
  const [selectedMacbookColors, setSelectedMacbookColors] = useState<string[]>(() => initialMacbookColors(product));
  const [bulkCostPrice, setBulkCostPrice] = useState("");
  const [bulkSellingPrice, setBulkSellingPrice] = useState("");
  const [bulkStock, setBulkStock] = useState("");
  const tags = useMemo(() => product?.tags?.join(", ") ?? "", [product]);
  const supportsConfigurationMatrix = ["macbook", "mac-mini-studio", "imac", "laptop"].includes(fieldGroup);
  const matrixRams = useMemo(() => parseConfigurationValues(matrixRam, "ram"), [matrixRam]);
  const matrixStorages = useMemo(() => parseConfigurationValues(matrixStorage, "storage"), [matrixStorage]);
  const matrixColors = fieldGroup === "macbook"
  ? MACBOOK_COLORS.filter((color) => selectedMacbookColors.includes(color.name))
  : parseCustomColors(matrixColorNames);
  const matrixCount = matrixRams.length * matrixStorages.length * Math.max(1, matrixColors.length);
  const productColorCodes = matrixColors.length
    ? matrixColors.map((color) => color.hex).join(", ")
    : product?.colors?.join(", ") ?? "#111111";

  function addVariant() {
    setVariants((items) => [
      ...items,
      { id: crypto.randomUUID(), name: "", color: "", colorHex: "#111111", ram: "", storage: "", version: modelChip, size: screenSize, sku: "", barcode: "", costPrice: "", price: sellingPrice, salePrice: "", stock: 0, status: "active", serials: [], image: "" },
    ]);
  }
  function duplicateVariant(variant: ProductVariant) {
    setVariants((items) => [...items, { ...variant, id: crypto.randomUUID(), sku: "", barcode: "", serials: [], name: variant.name ? PRODUCT_FORM.copySuffix(variant.name) : "" }]);
  }
  function applyBulkVariantValues() {
    setVariants((items) => items.map((variant) => ({
      ...variant,
      costPrice: bulkCostPrice.trim() || variant.costPrice,
      price: bulkSellingPrice.trim() || variant.price,
      stock: bulkStock.trim() ? Math.max(0, Number(bulkStock) || 0) : variant.stock,
    })));
  }
  function toggleMatrixOption(kind: "ram" | "storage", option: string) {
    const current = kind === "ram" ? matrixRams : matrixStorages;
    const selected = current.includes(option);
    const next = selected ? current.filter((item) => item !== option) : [...current, option];
    if (kind === "ram") setMatrixRam(next.join(", "));
    else setMatrixStorage(next.join(", "));
    setMatrixMessage("");
  }
  function toggleMacbookColor(colorName: string) {
    setSelectedMacbookColors((current) => current.includes(colorName)
      ? current.filter((name) => name !== colorName)
      : [...current, colorName]);
    setMatrixMessage("");
  }
  function generateVariantMatrix() {
    if (!matrixRams.length || !matrixStorages.length) {
      setMatrixMessage(PRODUCT_FORM.needRamAndSsd);
      return;
    }
    const additions: ProductVariant[] = [];
    const colorsToCreate: Array<MacbookColor | undefined> = matrixColors.length ? matrixColors : [undefined];
    for (const ram of matrixRams) {
      for (const storage of matrixStorages) {
        for (const color of colorsToCreate) {
          const duplicate = [...variants, ...additions].some((item) =>
            normalizeConfiguration(item.ram) === normalizeConfiguration(ram) &&
            normalizeConfiguration(item.storage) === normalizeConfiguration(storage) &&
            normalizeConfiguration(item.version) === normalizeConfiguration(matrixVersion) &&
            normalizeConfiguration(item.size) === normalizeConfiguration(matrixSize) &&
            normalizeConfiguration(item.color) === normalizeConfiguration(color?.name),
          );
          if (duplicate) continue;
          additions.push({
            id: crypto.randomUUID(),
            // Keep generated names automatic so later edits cannot leave an outdated display name.
            name: "",
            color: color?.name ?? "",
            colorHex: color?.hex ?? "#111111",
            ram,
            storage,
            version: matrixVersion.trim() || modelChip.trim(),
            size: matrixSize.trim() || screenSize.trim(),
            sku: "",
            barcode: "",
            costPrice: bulkCostPrice.trim(),
            price: sellingPrice,
            salePrice: "",
            stock: 0,
            status: "active",
            serials: [],
            image: "",
          });
        }
      }
    }
    setVariants((items) => [...items, ...additions]);
    setMatrixMessage(additions.length
      ? PRODUCT_FORM.configsCreated(additions.length)
      : PRODUCT_FORM.combinationsExist);
  }
  function setVariantMacbookColor(id: string, colorName: string) {
    const color = MACBOOK_COLORS.find((item) => item.name === colorName);
    setVariants((items) => items.map((item) => item.id === id
      ? { ...item, color: colorName, colorHex: color?.hex ?? item.colorHex ?? "#111111" }
      : item));
  }
  function updateVariant(id: string, key: keyof ProductVariant, value: ProductVariant[keyof ProductVariant]) {
    setVariants((items) =>
      items.map((item) => (item.id === id ? { ...item, [key]: key === "stock" ? Number(value) || 0 : value } : item)),
    );
  }
  function removeVariant(id: string) {
    setVariants((items) => items.filter((item) => item.id !== id));
  }
  function updateTechnicalField(key: string, label: string, nextValue: string) {
    setTechnicalValues((items) => ({ ...items, [key]: nextValue }));
    setSpecsText((current) => {
      const lines = current.split("\n").map((line) => line.trim()).filter(Boolean);
      const index = lines.findIndex((line) => line.toLocaleLowerCase("vi").startsWith(`${label}:`.toLocaleLowerCase("vi")));
      const nextLine = nextValue.trim() ? `${label}: ${nextValue.trim()}` : "";
      if (index >= 0 && nextLine) lines[index] = nextLine;
      else if (index >= 0) lines.splice(index, 1);
      else if (nextLine) lines.push(nextLine);
      return lines.join("\n");
    });
  }

  return (
    <div className="admin-card admin-product-step-card">
      <div className="admin-card-head">
        <div className="admin-product-step-title"><b>03</b><div><span>{PRODUCT_FORM.configTitle}</span><h2>{fieldConfig.title}</h2><p>{fieldConfig.description}</p></div></div>
        <button type="button" className="admin-button" onClick={addVariant}>{PRODUCT_FORM.addManual}</button>
      </div>
      {supportsConfigurationMatrix && (
        <section className="admin-config-builder" aria-labelledby="config-builder-title">
          <div className="admin-config-builder-head">
            <div>
              <span>PLUG &amp; PLAY</span>
              <h3 id="config-builder-title">{PRODUCT_FORM.quickTitle}</h3>
              <p>{PRODUCT_FORM.quickText}</p>
            </div>
            <strong>{matrixCount} {PRODUCT_FORM.combinations}</strong>
          </div>
          <div className="admin-config-builder-grid">
            <div className="admin-config-choice">
              <label>{PRODUCT_FORM.ramToSell}<input value={matrixRam} onChange={(event) => { setMatrixRam(event.target.value); setMatrixMessage(""); }} placeholder="8GB, 16GB" /></label>
              <div aria-label={PRODUCT_FORM.suggestedRam}>
                {fieldConfig.ramOptions.map((option) => <button type="button" className={matrixRams.includes(option) ? "is-selected" : ""} onClick={() => toggleMatrixOption("ram", option)} key={option}>{option}</button>)}
              </div>
            </div>
            <div className="admin-config-choice">
              <label>{fieldConfig.storageLabel} {PRODUCT_FORM.toSell}<input value={matrixStorage} onChange={(event) => { setMatrixStorage(event.target.value); setMatrixMessage(""); }} placeholder="256GB, 512GB" /></label>
              <div aria-label={PRODUCT_FORM.suggestedOf(fieldConfig.storageLabel)}>
                {fieldConfig.storageOptions.map((option) => <button type="button" className={matrixStorages.includes(option) ? "is-selected" : ""} onClick={() => toggleMatrixOption("storage", option)} key={option}>{option}</button>)}
              </div>
            </div>
            <label className="admin-config-meta"><span>{fieldConfig.versionLabel} {PRODUCT_FORM.shared}</span><input list={`version-options-${fieldGroup}`} value={matrixVersion} onChange={(event) => setMatrixVersion(event.target.value)} placeholder={PRODUCT_FORM.optionalPlaceholder(fieldConfig.versionPlaceholder)} /></label>
            <label className="admin-config-meta"><span>{fieldConfig.sizeLabel} {PRODUCT_FORM.shared}</span><input list={`size-options-${fieldGroup}`} value={matrixSize} onChange={(event) => setMatrixSize(event.target.value)} placeholder={PRODUCT_FORM.optionalPlaceholder(fieldConfig.sizePlaceholder)} /></label>
          </div>
          {fieldGroup === "macbook" && (
            <div className="admin-macbook-colors">
              <div className="admin-macbook-colors-head">
                <div><strong>{PRODUCT_FORM.macbookColors}</strong><span>{PRODUCT_FORM.macbookColorsHint}</span></div>
                <em>{matrixColors.length ? PRODUCT_FORM.colorsSelected(matrixColors.length) : PRODUCT_FORM.unassignedColor}</em>
              </div>
              <div className="admin-macbook-color-grid" aria-label={PRODUCT_FORM.macbookPalette}>
                {MACBOOK_COLORS.map((color) => {
                  const selected = selectedMacbookColors.includes(color.name);
                  return (
                    <button key={color.name} type="button" aria-pressed={selected} className={selected ? "is-selected" : ""} onClick={() => toggleMacbookColor(color.name)}>
                      <i style={{ backgroundColor: color.hex }} />
                      <span><strong>{color.name}</strong><small>{color.hex} · {color.note}</small></span>
                      <b aria-hidden="true">{selected ? "✓" : "+"}</b>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {fieldGroup !== "macbook" && <div className="admin-config-choice admin-config-custom-colors"><label>{PRODUCT_FORM.colorsToSell}<input value={matrixColorNames} onChange={(event) => { setMatrixColorNames(event.target.value); setMatrixMessage(""); }} placeholder={PRODUCT_FORM.colorsPlaceholder} /></label><small>{PRODUCT_FORM.colorsHint}</small></div>}
          <div className="admin-config-preview">
            <span>{PRODUCT_FORM.willCreate}</span>
            <div>{matrixRams.flatMap((ram) => matrixStorages.flatMap((storage) => (matrixColors.length ? matrixColors : [undefined]).map((color) => <em key={`${ram}-${storage}-${color?.name ?? "none"}`}>{ram} / {storage}{color ? ` / ${color.name}` : ""}</em>)))}</div>
          </div>
          <div className="admin-config-builder-action">
            <button className="admin-button admin-button-primary" type="button" onClick={generateVariantMatrix} disabled={!matrixCount}>{PRODUCT_FORM.createPrefix}{matrixCount || ""} {PRODUCT_FORM.configsSuffix}</button>
            {matrixMessage && <p role="status">{matrixMessage}</p>}
          </div>
        </section>
      )}
      <details className="admin-product-optional admin-product-specs">
        <summary><span>{PRODUCT_FORM.specsTitle}</span><small>{PRODUCT_FORM.specsText}</small></summary>
        <div className="admin-technical-grid">
          {fieldConfig.technicalFields.map((field) => (
            <label className="admin-field" key={`${fieldGroup}-${field.key}`}>{field.label}
              <input value={technicalValues[field.key] ?? ""} onChange={(event) => updateTechnicalField(field.key, field.label, event.target.value)} placeholder={field.placeholder} />
            </label>
          ))}
        </div>
        <div className="admin-form-grid">
          {fieldGroup === "macbook" ? (
            <label key="macbook-colors" className="admin-field">{PRODUCT_FORM.selectedColorCodes}<input name="colors" value={productColorCodes} readOnly aria-describedby="macbook-color-help" /><small id="macbook-color-help">{PRODUCT_FORM.colorCodesHint}</small></label>
          ) : (
            <label key="product-colors" className="admin-field">{PRODUCT_FORM.productColors}<input name="colors" defaultValue={product?.colors?.join(", ") ?? "#111111"} placeholder="#111111, #f5f5f7" /></label>
          )}
          <label className="admin-field">{PRODUCT_FORM.searchTags}<input name="tags" defaultValue={tags} placeholder="iphone, flagship, 256gb" /></label>
          <label className="admin-field admin-span-2">{PRODUCT_FORM.extraSpecs}<textarea name="specs" rows={5} value={specsText} onChange={(event) => setSpecsText(event.target.value)} placeholder={PRODUCT_FORM.extraSpecsPlaceholder} /></label>
        </div>
      </details>
      <datalist id={`storage-options-${fieldGroup}`}>{fieldConfig.storageOptions.map((option) => <option key={option} value={option} />)}</datalist>
      <datalist id={`ram-options-${fieldGroup}`}>{fieldConfig.ramOptions.map((option) => <option key={option} value={option} />)}</datalist>
      <datalist id={`version-options-${fieldGroup}`}>{fieldConfig.versionOptions.map((option) => <option key={option} value={option} />)}</datalist>
      <datalist id={`size-options-${fieldGroup}`}>{fieldConfig.sizeOptions.map((option) => <option key={option} value={option} />)}</datalist>
      <div className="admin-variant-section-head"><div><span>{PRODUCT_FORM.variantList}</span><strong>{variants.length} {PRODUCT_FORM.variantsSuffix}{variants.filter((variant) => variant.status !== "inactive").length} {PRODUCT_FORM.selling}</strong></div><p>{PRODUCT_FORM.variantListText}</p></div>
      {variants.length > 0 && <div className="admin-variant-bulkbar">
        <div><span>{PRODUCT_FORM.quickApplyEyebrow}</span><strong>{PRODUCT_FORM.bulkTitle}</strong></div>
        <label>{PRODUCT_FORM.costPrice}<input value={bulkCostPrice} onChange={(event) => setBulkCostPrice(event.target.value)} placeholder={PRODUCT_FORM.bulkCostPlaceholder} /></label>
        <label>{PRODUCT_FORM.sellingPriceShort}<input value={bulkSellingPrice} onChange={(event) => setBulkSellingPrice(event.target.value)} placeholder={PRODUCT_FORM.bulkPricePlaceholder} /></label>
        <label>{PRODUCT_FORM.stockPerConfig}<input type="number" min="0" value={bulkStock} onChange={(event) => setBulkStock(event.target.value)} placeholder="0" /></label>
        <button type="button" onClick={applyBulkVariantValues}>{PRODUCT_FORM.applyAll}</button>
      </div>}
      <div className={`admin-variant-list admin-variant-list-compact${fieldGroup === "macbook" ? " has-color-column" : ""}`}>
        {variants.length === 0 && <p className="admin-empty-state">{PRODUCT_FORM.noVariants}</p>}
        {variants.map((variant, index) => (
          <div className={`admin-variant${variant.status === "inactive" ? " is-inactive" : ""}`} key={variant.id}>
            <div className="admin-variant-head"><div><span>{String(index + 1).padStart(2, "0")}</span><strong>{variant.name || [variant.ram, variant.storage, variant.color].filter(Boolean).join(" / ") || PRODUCT_FORM.configNumber(index + 1)}</strong><em>{variant.status === "inactive" ? PRODUCT_FORM.disabled : PRODUCT_FORM.statusActive}</em></div><nav><button type="button" onClick={() => duplicateVariant(variant)}>{PRODUCT_FORM.duplicate}</button><button type="button" onClick={() => updateVariant(variant.id, "status", variant.status === "inactive" ? "active" : "inactive")}>{variant.status === "inactive" ? PRODUCT_FORM.enable : PRODUCT_FORM.disable}</button><button className="is-danger" type="button" onClick={() => removeVariant(variant.id)}>{PRODUCT_FORM.delete}</button></nav></div>
            <label><span>{fieldConfig.storageLabel}</span><input list={`storage-options-${fieldGroup}`} value={variant.storage ?? ""} onChange={(event) => updateVariant(variant.id, "storage", event.target.value)} placeholder={fieldConfig.storagePlaceholder} /></label>
            <label><span>{fieldConfig.ramLabel}</span><input list={`ram-options-${fieldGroup}`} inputMode="numeric" value={variant.ram ?? ""} onChange={(event) => updateVariant(variant.id, "ram", event.target.value)} placeholder={fieldConfig.ramPlaceholder} /></label>
            {fieldGroup === "macbook" && <label className="admin-variant-color"><span>{PRODUCT_FORM.color}</span><div><i style={{ backgroundColor: variant.colorHex || "#111111" }} /><select value={variant.color ?? ""} onChange={(event) => setVariantMacbookColor(variant.id, event.target.value)}><option value="">{PRODUCT_FORM.unassignedColor}</option>{variant.color && !MACBOOK_COLORS.some((color) => color.name === variant.color) && <option value={variant.color}>{variant.color}</option>}{MACBOOK_COLORS.map((color) => <option value={color.name} key={color.name}>{color.name}</option>)}</select></div></label>}
            {fieldGroup !== "macbook" && <label><span>{PRODUCT_FORM.color}</span><input value={variant.color ?? ""} onChange={(event) => updateVariant(variant.id, "color", event.target.value)} placeholder={PRODUCT_FORM.colorPlaceholder} /></label>}
            <label><span>{PRODUCT_FORM.costPrice}</span><input value={variant.costPrice ?? ""} onChange={(event) => updateVariant(variant.id, "costPrice", event.target.value)} placeholder={PRODUCT_FORM.bulkCostPlaceholder} /></label>
            <label><span>{PRODUCT_FORM.sellingPriceShort}</span><input value={variant.price ?? ""} onChange={(event) => updateVariant(variant.id, "price", event.target.value)} placeholder={PRODUCT_FORM.bulkPricePlaceholder} /></label>
            <label><span>{PRODUCT_FORM.salePrice}</span><input value={variant.salePrice ?? ""} onChange={(event) => updateVariant(variant.id, "salePrice", event.target.value)} placeholder={PRODUCT_FORM.optional} /></label>
            <label><span>{PRODUCT_FORM.stockShort}</span><input type="number" min="0" value={String(variant.stock ?? 0)} onChange={(event) => updateVariant(variant.id, "stock", event.target.value)} /></label>
            <details className="admin-variant-advanced">
              <summary>{PRODUCT_FORM.moreInfo}<span>{PRODUCT_FORM.moreInfoText}</span></summary>
              <div>
                <label><span>{PRODUCT_FORM.variantName}</span><input value={variant.name} onChange={(event) => updateVariant(variant.id, "name", event.target.value)} placeholder="RAM 16GB · SSD 512GB" /></label>
                <label><span>{fieldConfig.versionLabel}</span><input list={`version-options-${fieldGroup}`} value={variant.version ?? ""} onChange={(event) => updateVariant(variant.id, "version", event.target.value)} placeholder={fieldConfig.versionPlaceholder} /></label>
                <label><span>{fieldConfig.sizeLabel}</span><input list={`size-options-${fieldGroup}`} value={variant.size ?? ""} onChange={(event) => updateVariant(variant.id, "size", event.target.value)} placeholder={fieldConfig.sizePlaceholder} /></label>
                {fieldGroup !== "macbook" && <label><span>{PRODUCT_FORM.colorCode}</span><input type="color" value={variant.colorHex || "#111111"} onChange={(event) => updateVariant(variant.id, "colorHex", event.target.value)} /></label>}
                <label><span>{PRODUCT_FORM.variantSku}</span><input value={variant.sku ?? ""} onChange={(event) => updateVariant(variant.id, "sku", event.target.value)} placeholder="MBA-16-512" /></label>
                <label><span>Barcode</span><input value={variant.barcode ?? ""} onChange={(event) => updateVariant(variant.id, "barcode", event.target.value)} placeholder={PRODUCT_FORM.barcodePlaceholder} /></label>
                <label className="admin-span-2"><span>Serial / IMEI</span><textarea rows={3} value={(variant.serials ?? []).join("\n")} onChange={(event) => updateVariant(variant.id, "serials", event.target.value.split("\n").map((serial) => serial.trim()).filter(Boolean))} placeholder={PRODUCT_FORM.serialsPlaceholder} /></label>
                <label className="admin-variant-image"><span>{PRODUCT_FORM.variantImagePrefix}{MAX_PRODUCT_IMAGE_LABEL}</span>{variant.image && <Image src={variant.image} alt="" width={44} height={44} unoptimized />}<input name={`variantImage_${variant.id}`} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" /></label>
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
