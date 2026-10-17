"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import "@/src/components/features/portal/home/StorefrontHero.css";
import { STOREFRONT_HERO } from "@/src/constants/portal/home";

const slides = [
  {
    id: 1,
    tabTitle: "IPHONE 18 PRO",
    tabSub: STOREFRONT_HERO.iphoneTabSub,
    image: "/hero-products/iphone-18-pro-cutout-v2.png",
    imageAlt: STOREFRONT_HERO.iphoneAlt,
    title: "iPhone 18 Pro",
    subtitle: STOREFRONT_HERO.iphoneHeadline,
    availability: STOREFRONT_HERO.iphoneSubline,
    description: STOREFRONT_HERO.iphoneText,
    cta: STOREFRONT_HERO.iphoneMoreLabel,
    primaryAction: { label: STOREFRONT_HERO.viewProduct, href: "/san-pham/iphone-18-pro" },
    secondaryAction: { label: STOREFRONT_HERO.chooseVersion, href: "/iphone" },
    artLabel: "PRO",
    tone: "blue",
  },
  {
    id: 2,
    tabTitle: STOREFRONT_HERO.macbookTab,
    tabSub: "Apple M5",
    image: "/apple-macbook-pro/product-viewer-hero.jpg",
    imageAlt: STOREFRONT_HERO.macbookAlt,
    title: STOREFRONT_HERO.macbookTitle,
    subtitle: STOREFRONT_HERO.macbookHeadline,
    availability: "Apple M5 · M4 Pro · M4 Max",
    description: STOREFRONT_HERO.macbookText,
    cta: STOREFRONT_HERO.macbookMoreLabel,
    primaryAction: { label: STOREFRONT_HERO.learnMore, href: "/dat-truoc?device=macbook" },
    secondaryAction: { label: STOREFRONT_HERO.preorder, href: "/dat-truoc?device=macbook#configurator" },
    artLabel: "M5",
    tone: "cyan",
  },
  {
    id: 4,
    tabTitle: "LAPTOP GAMING",
    tabSub: "RTX 50 Series",
    image: "/products/expanded/rog-scar18-2025.png",
    imageAlt: STOREFRONT_HERO.laptopAlt,
    title: STOREFRONT_HERO.laptopEyebrow,
    subtitle: STOREFRONT_HERO.laptopHeadline,
    availability: "Laptop Gaming 2026",
    description: STOREFRONT_HERO.laptopText,
    primaryAction: { label: STOREFRONT_HERO.explore, href: "/laptop" },
    secondaryAction: { label: STOREFRONT_HERO.viewProduct, href: "/laptop?filter=gaming" },
    artLabel: "RTX",
    tone: "violet",
  },
  {
    id: 5,
    tabTitle: STOREFRONT_HERO.cameraTab,
    tabSub: "Fujifilm · Sony · DJI",
    image: "/hero-products/fujifilm-xm5-cutout-v3.png",
    imageAlt: STOREFRONT_HERO.cameraAlt,
    title: STOREFRONT_HERO.cameraEyebrow,
    subtitle: STOREFRONT_HERO.cameraHeadline,
    availability: STOREFRONT_HERO.cameraSubline,
    description: STOREFRONT_HERO.cameraText,
    primaryAction: { label: STOREFRONT_HERO.explore, href: "/may-anh" },
    secondaryAction: { label: STOREFRONT_HERO.viewProduct, href: "/may-anh" },
    artLabel: "CREATE",
    tone: "navy",
  },
] as const;

export default function StorefrontHero() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [direction, setDirection] = useState("next");
  const [paused, setPaused] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const isInteractingRef = useRef(false);
  const slide = slides[activeSlide];

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (!isInteractingRef.current && !document.hidden && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setDirection("next");
        setActiveSlide((current) => (current + 1) % slides.length);
      }
    }, 6500);
    return () => window.clearInterval(timer);
  }, [paused]);

  useEffect(() => () => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const updateParallax = (event: React.PointerEvent<HTMLElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || event.pointerType !== "mouse" || !window.matchMedia("(pointer: fine)").matches) return;
    const element = heroRef.current;
    if (!element) return;
    const bounds = element.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = window.requestAnimationFrame(() => {
      element.style.setProperty("--hero-x", x.toFixed(3));
      element.style.setProperty("--hero-y", y.toFixed(3));
    });
  };

  const resetParallax = () => {
    const element = heroRef.current;
    if (!element) return;
    element.style.setProperty("--hero-x", "0");
    element.style.setProperty("--hero-y", "0");
  };

  const selectSlide = (index: number, travel = index > activeSlide ? "next" : "previous") => {
    setDirection(travel);
    setActiveSlide((index + slides.length) % slides.length);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    isInteractingRef.current = true;
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    const startX = touchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartXRef.current = null;
    isInteractingRef.current = false;
    if (startX === null || endX === undefined) return;

    const travel = endX - startX;
    if (Math.abs(travel) < 44) return;
    selectSlide(activeSlide + (travel < 0 ? 1 : -1), travel < 0 ? "next" : "previous");
  };

  return (
    <section
      ref={heroRef}
      className={`product-launch-hero product-launch-hero-${slide.tone}`}
      data-slide-direction={direction}
      aria-roledescription="carousel"
      aria-label={STOREFRONT_HERO.label}
      onPointerMove={updateParallax}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        touchStartXRef.current = null;
        isInteractingRef.current = false;
      }}
      onPointerEnter={() => { isInteractingRef.current = true; }}
      onPointerLeave={() => {
        isInteractingRef.current = false;
        resetParallax();
      }}
      onFocusCapture={() => { isInteractingRef.current = true; }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          isInteractingRef.current = false;
        }
      }}
    >
      <div className="product-launch-hero-inner">
        <div className="product-launch-copy" key={`copy-${slide.id}`}>
          <span className="product-launch-kicker">INFINITY SHOP · NEW ARRIVAL</span>
          <h1>{slide.title}</h1>
          <p className="product-launch-subtitle">{slide.subtitle}</p>
          <p className="product-launch-availability">{slide.availability}</p>
          <p className="product-launch-description">{slide.description}</p>
          <div className="product-launch-actions">
            <Link className="product-launch-button product-launch-button-primary" href={slide.primaryAction.href}>
              {slide.primaryAction.label}
            </Link>
            <Link className="product-launch-button product-launch-button-secondary" href={slide.secondaryAction.href}>
              {slide.secondaryAction.label}
            </Link>
          </div>
        </div>

        <div className="product-launch-visual" key={`visual-${slide.id}`}>
          <div className="product-launch-ambient" aria-hidden="true" />
          <div className="product-launch-art" aria-hidden="true">{slide.artLabel}</div>
          <div className="product-launch-product">
            <Image
              src={slide.image}
              alt={slide.imageAlt}
              fill
              priority={activeSlide === 0}
              sizes="(max-width: 767px) 140vw, (max-width: 1100px) 90vw, 1100px"
              className="product-launch-image"
            />
          </div>
        </div>

        <div className="shop-hero-navigation" aria-label={STOREFRONT_HERO.controls}>
          <button type="button" onClick={() => selectSlide(activeSlide - 1, "previous")} aria-label={STOREFRONT_HERO.previous}>←</button>
          <span><b>{String(activeSlide + 1).padStart(2, "0")}</b> / {String(slides.length).padStart(2, "0")}</span>
          <button type="button" onClick={() => selectSlide(activeSlide + 1, "next")} aria-label={STOREFRONT_HERO.next}>→</button>
        </div>
        <span className="shop-sr-only" aria-live={paused ? "polite" : "off"}>{slide.title}</span>
        <button type="button" className="shop-carousel-pause" onClick={() => setPaused(!paused)} aria-label={paused ? STOREFRONT_HERO.resumeLabel : STOREFRONT_HERO.pauseLabel}>
          <span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span>
          <span className="shop-carousel-pause-label">{paused ? STOREFRONT_HERO.resume : STOREFRONT_HERO.pause}</span>
        </button>
        <div className="product-launch-controls" aria-label={STOREFRONT_HERO.chooseProduct}>
          {slides.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === activeSlide ? "is-active" : ""}
              onClick={() => selectSlide(index)}
              aria-pressed={index === activeSlide}
              aria-label={`${item.tabTitle}: ${item.tabSub}`}
            >
              <span>{item.tabTitle}</span>
              <small>{item.tabSub}</small>
            </button>
          ))}
        </div>
        <div className="shop-hero-mobile-controls" aria-label={STOREFRONT_HERO.chooseBanner}>
          <div>
            {slides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={index === activeSlide ? "is-active" : ""}
                onClick={() => selectSlide(index)}
                aria-label={STOREFRONT_HERO.openBanner(item.tabTitle)}
                aria-current={index === activeSlide ? "true" : undefined}
              />
            ))}
          </div>
          <span>{STOREFRONT_HERO.swipeHint}</span>
        </div>
      </div>
    </section>
  );
}
