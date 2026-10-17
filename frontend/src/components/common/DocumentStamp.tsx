import { DOCUMENT_STAMP } from "@/src/constants/shared/common";
type DocumentStampProps = {
  kind: "collected" | "disbursed";
  date: string;
};

export default function DocumentStamp({ kind, date }: DocumentStampProps) {
  const label = kind === "collected" ? DOCUMENT_STAMP.collected : DOCUMENT_STAMP.disbursed;
  const brand = kind === "collected" ? DOCUMENT_STAMP.collectedBrand : DOCUMENT_STAMP.disbursedBrand;
  return <div className={`document-stamp document-stamp-${kind}`} role="img" aria-label={`${label}${date ? DOCUMENT_STAMP.onDate(date) : ""}`}>
    <span>{brand}</span>
    <strong>{label}</strong>
    <small>{date || DOCUMENT_STAMP.confirmed}</small>
  </div>;
}
