import Image from "next/image";
import Link from "next/link";
import { APPLE_LAUNCH } from "@/src/constants/portal/home";

const announcements = [
  {
    eyebrow: APPLE_LAUNCH.airEyebrow,
    title: APPLE_LAUNCH.airTitle,
    description: APPLE_LAUNCH.airText,
    image: "/campaigns/apple-macbook-air-m5-official.jpg",
    alt: APPLE_LAUNCH.airAlt,
    facts: [APPLE_LAUNCH.airSizes, "M5 · Wi-Fi 7", APPLE_LAUNCH.airStorage],
  },
  {
    eyebrow: APPLE_LAUNCH.proEyebrow,
    title: APPLE_LAUNCH.proTitle,
    description: APPLE_LAUNCH.proText,
    image: "/campaigns/apple-macbook-pro-m5-official.jpg",
    alt: APPLE_LAUNCH.proAlt,
    facts: [APPLE_LAUNCH.proSizes, APPLE_LAUNCH.proBattery, "M5 · M5 Pro · M5 Max"],
  },
];

export default function UpcomingAppleLaunchPoster() {
  return (
    <section className="apple-launch shell" aria-labelledby="apple-launch-title">
      <header className="apple-launch-heading">
        <div>
          <span className="apple-launch-kicker">{APPLE_LAUNCH.eyebrow}</span>
          <h2 id="apple-launch-title">{APPLE_LAUNCH.title}</h2>
        </div>
        <p>{APPLE_LAUNCH.intro}</p>
      </header>

      <article className="apple-launch-hero">
        <div className="apple-launch-hero-copy">
          <span className="apple-launch-status">{APPLE_LAUNCH.onSale}</span>
          <p className="apple-launch-overline">iPhone 18 Pro &amp; iPhone 18 Pro Max</p>
          <h3>{APPLE_LAUNCH.headlineCamera}<br />{APPLE_LAUNCH.headlineChip}</h3>
          <p className="apple-launch-summary">
            {APPLE_LAUNCH.announcement}</p>
          <ul className="apple-launch-facts" aria-label={APPLE_LAUNCH.highlightsLabel}>
            <li><strong>48MP</strong><span>{APPLE_LAUNCH.highlightCamera}</span></li>
            <li><strong>A20 Pro</strong><span>{APPLE_LAUNCH.highlightChip}</span></li>
            <li><strong>256GB–2TB</strong><span>{APPLE_LAUNCH.highlightStorage}</span></li>
          </ul>
          <div className="apple-launch-actions">
            <Link className="button button-primary" href="/san-pham/iphone-18-pro">Xem iPhone 18 Pro</Link>
            <Link className="apple-launch-source" href="/iphone">{APPLE_LAUNCH.chooseVersion}<span aria-hidden="true">→</span></Link>
          </div>
          <small>{APPLE_LAUNCH.chooseText}</small>
        </div>

        <div className="apple-launch-hero-media">
          <Image
            src="/campaigns/apple-iphone-18-pro-official.jpg"
            alt={APPLE_LAUNCH.burgundyAlt}
            fill
            priority
            sizes="(max-width: 760px) 100vw, 48vw"
            className="apple-launch-product-image"
          />
          <div className="apple-launch-color-card">
            <Image
              src="/campaigns/apple-iphone-18-pro-colors-official.jpg"
              alt={APPLE_LAUNCH.colorsAlt}
              fill
              sizes="(max-width: 760px) 42vw, 210px"
            />
          </div>
        </div>
      </article>

      <div className="apple-launch-grid" aria-label={APPLE_LAUNCH.macbooksLabel}>
        {announcements.map((item) => (
          <article className="apple-launch-card" key={item.title}>
            <div className="apple-launch-card-media">
              <Image src={item.image} alt={item.alt} fill sizes="(max-width: 760px) 100vw, 50vw" />
            </div>
            <div className="apple-launch-card-copy">
              <span>{item.eyebrow}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <ul>{item.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
              <div>
                <Link href="/macbook">{APPLE_LAUNCH.viewMacbooks}</Link>
                <Link href="/tu-van">{APPLE_LAUNCH.getAdvice}</Link>
              </div>
            </div>
          </article>
        ))}
      </div>

    </section>
  );
}
