"use client";

import { INSTALLMENT } from "@/src/constants/portal/installment-page";
import { FAQS } from "./installment-model";
import { useState } from "react";

export default function InstallmentInfo() {
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);

  return (
    <section className="installment-info-section">
      {/* 4 Simple Steps */}
      <div className="installment-steps-card">
        <h2>{INSTALLMENT.stepsTitle}</h2>
        <div className="installment-steps-list">
          <div className="installment-step-item">
            <span className="installment-step-badge">1</span>
            <div className="installment-step-content">
              <strong>{INSTALLMENT.step1Title}</strong>
              <p>{INSTALLMENT.step1Text}</p>
            </div>
          </div>

          <div className="installment-step-item">
            <span className="installment-step-badge">2</span>
            <div className="installment-step-content">
              <strong>{INSTALLMENT.step2Title}</strong>
              <p>{INSTALLMENT.step2Text}</p>
            </div>
          </div>

          <div className="installment-step-item">
            <span className="installment-step-badge">3</span>
            <div className="installment-step-content">
              <strong>{INSTALLMENT.step3Title}</strong>
              <p>{INSTALLMENT.step3Text}</p>
            </div>
          </div>

          <div className="installment-step-item">
            <span className="installment-step-badge">4</span>
            <div className="installment-step-content">
              <strong>{INSTALLMENT.step4Title}</strong>
              <p>{INSTALLMENT.step4Text}</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="installment-faq-card">
        <h2>{INSTALLMENT.faqTitle}</h2>
        <div className="installment-faq-list">
          {FAQS.map((faq, index) => {
            const isOpen = faqOpenIndex === index;
            return (
              <div key={faq.q} className="installment-faq-item">
                <button
                  type="button"
                  className="installment-faq-question"
                  onClick={() => setFaqOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <span style={{ fontSize: "16px", color: "var(--lux-blue)" }}>{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && <div className="installment-faq-answer">{faq.a}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
