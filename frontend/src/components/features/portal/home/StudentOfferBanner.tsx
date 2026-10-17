import Image from "next/image";
import Link from "next/link";
import { STUDENT_OFFER } from "@/src/constants/portal/home";

/** Hai thẻ quyền lợi: ưu đãi giáo dục (thẻ nhấn) và bảo hành điện tử trong Member — mỗi thẻ có ảnh nền mờ dần. */
export default function StudentOfferBanner() {
  return (
    <section className="cps-container home-perks" aria-label={STUDENT_OFFER.label}>
      <article className="perk-card perk-accent perk-student" aria-labelledby="perk-student-title">
        {/* Ảnh: Unsplash (giấy phép Unsplash, dùng thương mại miễn phí) */}
        <div className="perk-photo" aria-hidden="true">
          <Image src="/promo/student-offer.jpg" alt="" fill sizes="(max-width: 980px) 100vw, 720px" style={{ objectFit: "cover", objectPosition: "70% 40%" }} />
        </div>
        <span className="perk-shine" aria-hidden="true" />
        <p className="perk-kicker perk-badge">{STUDENT_OFFER.eyebrow}</p>
        <h2 id="perk-student-title">{STUDENT_OFFER.title}</h2>
        <p>{STUDENT_OFFER.text}</p>
        <div className="perk-actions">
          <Link href="/iphone">Xem iPhone</Link>
          <Link href="/macbook">Xem MacBook</Link>
        </div>
      </article>
      <article className="perk-card perk-member" aria-labelledby="perk-member-title">
        {/* Ảnh: Unsplash (giấy phép Unsplash, dùng thương mại miễn phí) */}
        <div className="perk-photo" aria-hidden="true">
          <Image src="/promo/member-repair.jpg" alt="" fill sizes="(max-width: 980px) 100vw, 560px" style={{ objectFit: "cover", objectPosition: "70% 50%" }} />
        </div>
        <span className="perk-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3zm-3 9l2 2 4-4" /></svg>
        </span>
        <p className="perk-kicker">Infinity Member</p>
        <h2 id="perk-member-title">{STUDENT_OFFER.warrantyTitle}</h2>
        <p>{STUDENT_OFFER.warrantyText}</p>
        <div className="perk-actions">
          <Link href="/member#orders">{STUDENT_OFFER.warrantyLink}</Link>
        </div>
      </article>
    </section>
  );
}
