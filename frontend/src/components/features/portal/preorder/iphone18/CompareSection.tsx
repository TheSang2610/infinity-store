"use client";

import { IPHONE18_SHOWCASE } from "@/src/constants/portal/preorder-page";

export default function CompareSection() {
  return (
    <section id="compare" className="apple-compare-section">
      <div className="apple-compare-header">
        <span className="apple-iphone-eyebrow">{IPHONE18_SHOWCASE.compareEyebrow}</span>
        <h2>{IPHONE18_SHOWCASE.compareTitle}</h2>
      </div>

      <div className="apple-compare-table-wrap">
        <table className="apple-compare-table">
          <thead>
            <tr>
              <th style={{ width: "34%" }}>{IPHONE18_SHOWCASE.compareFeature}</th>
              <th className="col-new" style={{ width: "33%" }}>
                iPhone 18 Pro Series
                <span className="apple-compare-pill">{IPHONE18_SHOWCASE.compareNewest}</span>
              </th>
              <th className="col-old" style={{ width: "33%" }}>iPhone 17 Pro Series</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="apple-compare-feature-label">{IPHONE18_SHOWCASE.compareAperture}</td>
              <td className="apple-compare-new-val">{IPHONE18_SHOWCASE.compareApertureNew}</td>
              <td className="apple-compare-old-val">{IPHONE18_SHOWCASE.compareApertureOld}</td>
            </tr>
            <tr>
              <td className="apple-compare-feature-label">{IPHONE18_SHOWCASE.compareProcessor}</td>
              <td className="apple-compare-new-val">Chip Apple A20 Pro (2nm)</td>
              <td className="apple-compare-old-val">Chip Apple A18 Pro (3nm)</td>
            </tr>
            <tr>
              <td className="apple-compare-feature-label">{IPHONE18_SHOWCASE.compareCooling}</td>
              <td className="apple-compare-new-val">{IPHONE18_SHOWCASE.compareCoolingNew}</td>
              <td className="apple-compare-old-val">{IPHONE18_SHOWCASE.compareCoolingOld}</td>
            </tr>
            <tr>
              <td className="apple-compare-feature-label">{IPHONE18_SHOWCASE.compareTelephoto}</td>
              <td className="apple-compare-new-val">8x Tetraprism (200mm) · 48MP</td>
              <td className="apple-compare-old-val">5x Tetraprism (120mm) · 12MP</td>
            </tr>
            <tr>
              <td className="apple-compare-feature-label">{IPHONE18_SHOWCASE.compareBezel}</td>
              <td className="apple-compare-new-val">{IPHONE18_SHOWCASE.compareBezelNew}</td>
              <td className="apple-compare-old-val">1.44 mm</td>
            </tr>
            <tr>
              <td className="apple-compare-feature-label">{IPHONE18_SHOWCASE.compareOutdoorBrightness}</td>
              <td className="apple-compare-new-val">{IPHONE18_SHOWCASE.compareBrightnessNew}</td>
              <td className="apple-compare-old-val">2.000 nits</td>
            </tr>
            <tr>
              <td className="apple-compare-feature-label">{IPHONE18_SHOWCASE.compareBatteryProMax}</td>
              <td className="apple-compare-new-val">{IPHONE18_SHOWCASE.compareBatteryNew}</td>
              <td className="apple-compare-old-val">{IPHONE18_SHOWCASE.compareBatteryOld}</td>
            </tr>
            <tr>
              <td className="apple-compare-feature-label">{IPHONE18_SHOWCASE.compareStorage}</td>
              <td className="apple-compare-new-val">256GB · 512GB · 1TB · 2TB</td>
              <td className="apple-compare-old-val">128GB · 256GB · 512GB · 1TB</td>
            </tr>
            <tr>
              <td className="apple-compare-feature-label">{IPHONE18_SHOWCASE.compareColors}</td>
              <td className="apple-compare-new-val">{IPHONE18_SHOWCASE.compareColorsNew}</td>
              <td className="apple-compare-old-val">{IPHONE18_SHOWCASE.compareColorsOld}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
