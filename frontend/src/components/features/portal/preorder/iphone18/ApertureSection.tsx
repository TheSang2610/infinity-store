"use client";

import { IPHONE18_SHOWCASE } from "@/src/constants/portal/preorder-page";
import { APERTURE_STOPS, ApertureStop } from "../iphone18-data";
import { useState } from "react";

export default function ApertureSection() {
  const [activeAperture, setActiveAperture] = useState<ApertureStop>(APERTURE_STOPS[0]);

  return (
    <section id="camera-aperture" className="apple-aperture-section">
      <div className="apple-aperture-header">
        <span className="apple-iphone-eyebrow">{IPHONE18_SHOWCASE.apertureEyebrow}</span>
        <h2>{IPHONE18_SHOWCASE.apertureTitle}</h2>
        <p>
          {IPHONE18_SHOWCASE.apertureTextPrefix}<strong>ƒ/1.48</strong> {IPHONE18_SHOWCASE.apertureTextTo}<strong>ƒ/4.0</strong>{IPHONE18_SHOWCASE.apertureTextSuffix}</p>
      </div>

      <div className="apple-aperture-interactive-box">
        <div className="apple-aperture-layout">
          {/* Left Col: Iris Diaphragm Interactive Simulator */}
          <div className="apple-aperture-simulator-col">
            <div className="apple-aperture-iris-container">
              <div className="apple-aperture-outer-ring" />
              <div
                className="apple-aperture-opening"
                style={{
                  width: `${activeAperture.diameterPercent}%`,
                  height: `${activeAperture.diameterPercent}%`,
                }}
              >
                <span className="apple-aperture-f-label">{activeAperture.stop}</span>
              </div>
            </div>

            <div className="apple-aperture-stops-picker">
              {APERTURE_STOPS.map((stop) => (
                <button
                  key={stop.stop}
                  type="button"
                  onClick={() => setActiveAperture(stop)}
                  className={`apple-aperture-stop-btn ${activeAperture.stop === stop.stop ? "active" : ""}`}
                  aria-label={IPHONE18_SHOWCASE.chooseAperture(stop.stop)}
                >
                  {stop.stop}
                </button>
              ))}
            </div>
            <span style={{ fontSize: "12px", color: "#86868b", marginTop: "14px" }}>
              {IPHONE18_SHOWCASE.apertureHint}</span>
          </div>

          {/* Right Col: Optical Characteristics & Live Metrics */}
          <div className="apple-aperture-detail-col">
            <span className="apple-aperture-role-badge">{activeAperture.role}</span>
            <h3 className="apple-aperture-stop-title">{IPHONE18_SHOWCASE.apertureLabel}{activeAperture.stop}</h3>

            <div className="apple-aperture-meters">
              <div className="apple-aperture-meter-row">
                <div className="apple-aperture-meter-head">
                  <span>{IPHONE18_SHOWCASE.lightAmount}</span>
                  <span className="apple-aperture-meter-val">{activeAperture.lightGain}</span>
                </div>
                <div className="apple-aperture-meter-track">
                  <div
                    className="apple-aperture-meter-fill"
                    style={{ width: `${activeAperture.lightPercent}%` }}
                  />
                </div>
              </div>

              <div className="apple-aperture-meter-row">
                <div className="apple-aperture-meter-head">
                  <span>{IPHONE18_SHOWCASE.depthOfField}</span>
                  <span className="apple-aperture-meter-val">{activeAperture.focusType}</span>
                </div>
                <div className="apple-aperture-meter-track">
                  <div
                    className="apple-aperture-meter-fill"
                    style={{
                      width: `${activeAperture.dofPercent}%`,
                      background: "linear-gradient(90deg, #30d158 0%, #2997ff 100%)",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="apple-aperture-desc-box">
              {activeAperture.description}
            </div>

            <div className="apple-aperture-scenario">
              <span>🎯</span>
              <div>
                <strong style={{ color: "#ffffff" }}>{IPHONE18_SHOWCASE.bestFor}</strong>{" "}
                {activeAperture.scenario}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
