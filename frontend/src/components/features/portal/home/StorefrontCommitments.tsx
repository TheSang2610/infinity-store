import { STOREFRONT_COMMITMENTS } from "@/src/constants/portal/home";
const commitments = [
  { title: STOREFRONT_COMMITMENTS.genuineTitle, note: STOREFRONT_COMMITMENTS.genuineText, icon: "M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3zm-3 9l2 2 4-4" },
  { title: STOREFRONT_COMMITMENTS.deliveryTitle, note: STOREFRONT_COMMITMENTS.deliveryText, icon: "M3 6h11v9H3zM14 9h4l3 3v3h-7M7.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" },
  { title: STOREFRONT_COMMITMENTS.tradeInTitle, note: STOREFRONT_COMMITMENTS.tradeInText, icon: "M4 12a8 8 0 0113.7-5.6L20 9M20 4v5h-5M20 12a8 8 0 01-13.7 5.6L4 15M4 20v-5h5" },
  { title: STOREFRONT_COMMITMENTS.warrantyTitle, note: STOREFRONT_COMMITMENTS.warrantyText, icon: "M9 12l2 2 4-4M12 3a9 9 0 100 18 9 9 0 000-18z" },
];

export default function StorefrontCommitments() {
  return (
    <section className="cps-container home-trust" aria-label={STOREFRONT_COMMITMENTS.label}>
      {commitments.map((item) => (
        <div className="home-trust-item" key={item.title}>
          <span className="home-trust-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon} /></svg>
          </span>
          <div>
            <strong>{item.title}</strong>
            <span>{item.note}</span>
          </div>
        </div>
      ))}
    </section>
  );
}
