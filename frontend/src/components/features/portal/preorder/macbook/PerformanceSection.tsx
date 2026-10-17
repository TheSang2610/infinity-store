"use client";

import { MACBOOK_SHOWCASE } from "@/src/constants/portal/preorder-page";
import { useState } from "react";

export default function PerformanceSection() {
  const [selectedChipTab, setSelectedChipTab] = useState<"m5" | "m5-pro" | "m5-max">("m5-pro");

  return (
    <section id="performance" className="apple-mbp-section">
      <div className="apple-mbp-section-header text-center">
        <span className="apple-mbp-eyebrow">{MACBOOK_SHOWCASE.chipsEyebrow}</span>
        <h2 className="apple-mbp-section-title">{MACBOOK_SHOWCASE.chipsTitle}</h2>
        <p className="apple-mbp-section-sub">
          {MACBOOK_SHOWCASE.chipsText}</p>
      </div>

      {/* Chip Tabs */}
      <div className="apple-mbp-chip-tabs" role="tablist">
        <button
          type="button"
          className={`apple-mbp-chip-tab${selectedChipTab === "m5" ? " is-active" : ""}`}
          onClick={() => setSelectedChipTab("m5")}
        >
          Chip M5
        </button>
        <button
          type="button"
          className={`apple-mbp-chip-tab${selectedChipTab === "m5-pro" ? " is-active" : ""}`}
          onClick={() => setSelectedChipTab("m5-pro")}
        >
          Chip M5 Pro
        </button>
        <button
          type="button"
          className={`apple-mbp-chip-tab${selectedChipTab === "m5-max" ? " is-active" : ""}`}
          onClick={() => setSelectedChipTab("m5-max")}
        >
          Chip M5 Max
        </button>
      </div>

      {/* Chip Card Content */}
      <div className="apple-mbp-chip-card">
        <div>
          <h3>
            {selectedChipTab === "m5" && MACBOOK_SHOWCASE.chipM5Title}
            {selectedChipTab === "m5-pro" && MACBOOK_SHOWCASE.chipM5ProTitle}
            {selectedChipTab === "m5-max" && MACBOOK_SHOWCASE.chipM5MaxTitle}
          </h3>
          <p>
            {selectedChipTab === "m5" &&
              MACBOOK_SHOWCASE.chipM5Text}
            {selectedChipTab === "m5-pro" &&
              MACBOOK_SHOWCASE.chipM5ProText}
            {selectedChipTab === "m5-max" &&
              MACBOOK_SHOWCASE.chipM5MaxText}
          </p>
          <a href="#configurator" className="apple-mbp-btn-primary">
            {MACBOOK_SHOWCASE.configPrefix}{selectedChipTab.toUpperCase()}
          </a>
        </div>

        <div className="apple-mbp-chip-stats">
          <div className="apple-mbp-chip-stat-box">
            <b>{selectedChipTab === "m5" ? MACBOOK_SHOWCASE.cores10 : selectedChipTab === "m5-pro" ? MACBOOK_SHOWCASE.cores14 : MACBOOK_SHOWCASE.cores16}</b>
            <span>{MACBOOK_SHOWCASE.cpuNote}</span>
          </div>
          <div className="apple-mbp-chip-stat-box">
            <b>{selectedChipTab === "m5" ? MACBOOK_SHOWCASE.cores10 : selectedChipTab === "m5-pro" ? MACBOOK_SHOWCASE.cores20 : MACBOOK_SHOWCASE.cores40}</b>
            <span>{MACBOOK_SHOWCASE.gpuNote}</span>
          </div>
          <div className="apple-mbp-chip-stat-box">
            <b>{selectedChipTab === "m5" ? MACBOOK_SHOWCASE.memory32 : selectedChipTab === "m5-pro" ? MACBOOK_SHOWCASE.memory64 : MACBOOK_SHOWCASE.memory128}</b>
            <span>{MACBOOK_SHOWCASE.unifiedMemory}</span>
          </div>
          <div className="apple-mbp-chip-stat-box">
            <b>{selectedChipTab === "m5" ? "150 GB/s" : selectedChipTab === "m5-pro" ? "273 GB/s" : "546 GB/s"}</b>
            <span>{MACBOOK_SHOWCASE.bandwidth}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
