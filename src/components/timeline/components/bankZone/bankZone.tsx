import type { ReactNode } from "react";
import styles from "./bankZone.module.css";

export function BankZone({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <aside className={styles.bank}>
      <p className={styles.bankTitle}>{title}</p>
      <div className={styles.bankList}>{children}</div>
    </aside>
  );
}
