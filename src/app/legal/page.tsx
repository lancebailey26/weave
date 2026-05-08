import type { Metadata } from "next";
import Link from "next/link";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Legal | Weave",
  description: "Weave legal documents",
};

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/cookies", label: "Cookie Policy" },
  { href: "/acceptable-use", label: "Acceptable Use Policy" },
  { href: "/subprocessors", label: "Subprocessors" },
] as const;

export default function LegalIndexPage() {
  return (
    <main className={styles.legalPage}>
      <article className={styles.legalContent}>
        <Link href="/" className={styles.backButton}>
          Back
        </Link>
        <h1 className={styles.legalTitle}>Legal</h1>
        <p className={styles.legalParagraph}>Review Weave's legal documents:</p>
        <ul className={styles.legalList}>
          {LEGAL_LINKS.map((item) => (
            <li key={item.href} className={styles.legalListItem}>
              <Link href={item.href} className={styles.legalLink}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </article>
    </main>
  );
}
