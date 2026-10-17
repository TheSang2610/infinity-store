"use client";

import { useState } from "react";
import "@/src/components/features/portal/preorder/macbook-pro-apple.css";
import { COLOR_OPTIONS, MODELS, type ColorOption, type IPhone18ProShowcaseProps } from "./iphone18-data";
import IPhoneRibbon from "./iphone18/IPhoneRibbon";
import IPhoneLocalNav from "./iphone18/IPhoneLocalNav";
import IPhoneHero from "./iphone18/IPhoneHero";
import ApertureSection from "./iphone18/ApertureSection";
import TitaniumSection from "./iphone18/TitaniumSection";
import ChipSection from "./iphone18/ChipSection";
import CompareSection from "./iphone18/CompareSection";
import IPhoneConfigurator from "./iphone18/IPhoneConfigurator";

export default function IPhone18ProShowcase({
  branches,
  customer,
}: IPhone18ProShowcaseProps) {
  // Configurator state
  const [selectedModelId, setSelectedModelId] = useState("iphone-18-pro-max");
  const [selectedColor, setSelectedColor] = useState<ColorOption>(COLOR_OPTIONS[0]);

  const selectedModel = MODELS.find((m) => m.id === selectedModelId) || MODELS[1];

  return (
    <div className="apple-iphone-root">
      {/* 0. APPLE GLOBAL BRAND RIBBON */}
      <IPhoneRibbon />

      {/* 1. APPLE LOCALNAV BAR */}
      <IPhoneLocalNav />

      {/* 2. CINEMATIC HERO SECTION */}
      <IPhoneHero />

      {/* 3. VARIABLE APERTURE SIMULATOR (Marquee Apple Feature) */}
      <ApertureSection />

      {/* 4. UNIBODY DESIGN & OFFICIAL COLOR SELECTOR */}
      <TitaniumSection selectedColor={selectedColor} selectedModel={selectedModel} setSelectedModelId={setSelectedModelId} selectedModelId={selectedModelId} setSelectedColor={setSelectedColor} />

      {/* 5. BENTO GRID - PRO HARDWARE INNOVATIONS */}
      <ChipSection />

      {/* 6. COMPARISON TABLE: IPHONE 18 PRO VS IPHONE 17 PRO */}
      <CompareSection />

      {/* 7. CONFIGURATOR & PRE-ORDER FORM SECTION */}
      <IPhoneConfigurator selectedColor={selectedColor} selectedModel={selectedModel} setSelectedModelId={setSelectedModelId} selectedModelId={selectedModelId} setSelectedColor={setSelectedColor} customer={customer} branches={branches} />
    </div>
  );
}
