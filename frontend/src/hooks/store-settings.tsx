"use client";

import { createContext, useContext } from "react";
import type { PublicStoreSettings } from "@/src/types";
import { EMPTY_STORE_SETTINGS } from "@/src/lib/store-settings";

// Thong tin cua hang (hotline, tai khoan nhan tien, showroom...) doc mot lan o layout goc
// roi chia cho cac component phia trinh duyet qua context.

const StoreSettingsContext = createContext<PublicStoreSettings>(EMPTY_STORE_SETTINGS);

export function StoreSettingsProvider({ value, children }: { value: PublicStoreSettings; children: React.ReactNode }) {
  return <StoreSettingsContext.Provider value={value}>{children}</StoreSettingsContext.Provider>;
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext);
}
