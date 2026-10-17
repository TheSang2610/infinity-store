"use client";

import { IPHONE18_SHOWCASE } from "@/src/constants/portal/preorder-page";
import Image from "next/image";

export default function ChipSection() {
  return (
    <section id="chip-a20pro" className="apple-iphone-bento-section">
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <span className="apple-iphone-eyebrow">{IPHONE18_SHOWCASE.powerEyebrow}</span>
        <h2 style={{ fontSize: "clamp(34px, 5vw, 48px)", fontWeight: 800, margin: "0 0 16px" }}>
          {IPHONE18_SHOWCASE.powerTitle}</h2>
        <p style={{ color: "#86868b", fontSize: "16px", maxWidth: "700px", margin: "0 auto" }}>
          {IPHONE18_SHOWCASE.powerText}</p>
      </div>

      <div className="apple-iphone-bento-grid">
        {/* Card 1: A20 Pro Chip (Span 8) */}
        <div className="apple-iphone-bento-card span-8">
          <div>
            <span className="apple-iphone-bento-tag">{IPHONE18_SHOWCASE.chipEyebrow}</span>
            <h3>{IPHONE18_SHOWCASE.chipTitle}</h3>
            <p>
              {IPHONE18_SHOWCASE.chipText}</p>
          </div>
          <div className="apple-bento-metrics-grid">
            <div style={{ background: "rgba(255,255,255,0.04)", padding: "16px", borderRadius: "16px" }}>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#ff6b87" }}>+40%</div>
              <div style={{ fontSize: "12px", color: "#86868b" }}>{IPHONE18_SHOWCASE.chipRayTracing}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", padding: "16px", borderRadius: "16px" }}>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#30d158" }}>45 TOPS</div>
              <div style={{ fontSize: "12px", color: "#86868b" }}>Neural Engine AI on-device</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", padding: "16px", borderRadius: "16px" }}>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#2997ff" }}>-30%</div>
              <div style={{ fontSize: "12px", color: "#86868b" }}>{IPHONE18_SHOWCASE.chipPowerUse}</div>
            </div>
          </div>
        </div>

        {/* Card 2: 8x Telephoto (Span 4) */}
        <div className="apple-iphone-bento-card span-4">
          <div>
            <span className="apple-iphone-bento-tag">Tetraprism Zoom 8x</span>
            <h3>{IPHONE18_SHOWCASE.zoomTitle}</h3>
            <p>
              {IPHONE18_SHOWCASE.zoomText}</p>
          </div>
          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <span style={{ fontSize: "56px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.04em" }}>8×</span>
            <span style={{ display: "block", fontSize: "13px", color: "#86868b" }}>{IPHONE18_SHOWCASE.zoomLossless}</span>
          </div>
        </div>

        {/* Card 3: Camera Fusion System (Span 6) */}
        <div className="apple-iphone-bento-card span-6">
          <div>
            <span className="apple-iphone-bento-tag">{IPHONE18_SHOWCASE.cameraEyebrow}</span>
            <h3>{IPHONE18_SHOWCASE.cameraTitle}</h3>
            <p>
              {IPHONE18_SHOWCASE.cameraText}</p>
          </div>
          <div className="apple-iphone-bento-media">
            <Image
              src="/apple-iphone-18-pro/camera-system.jpg"
              alt={IPHONE18_SHOWCASE.cameraAlt}
              width={800}
              height={400}
            />
          </div>
        </div>

        {/* Card 4: Apple Intelligence (Span 6) */}
        <div className="apple-iphone-bento-card span-6">
          <div>
            <span className="apple-iphone-bento-tag">Apple Intelligence</span>
            <h3>{IPHONE18_SHOWCASE.aiTitle}</h3>
            <p>
              {IPHONE18_SHOWCASE.aiText}</p>
          </div>
          <div style={{ marginTop: "24px", background: "rgba(226, 59, 93, 0.08)", border: "1px solid rgba(226, 59, 93, 0.2)", borderRadius: "16px", padding: "20px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#ff6b87", marginBottom: "6px" }}>
              {IPHONE18_SHOWCASE.aiPrivacyTitle}</div>
            <div style={{ fontSize: "13px", color: "#a1a1a6" }}>
              {IPHONE18_SHOWCASE.aiPrivacyText}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
