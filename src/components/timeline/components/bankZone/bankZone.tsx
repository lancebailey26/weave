import type { ReactNode } from "react";
import styles from "./bankZone.module.css";

export function BankZone({ children }: { children: ReactNode }) {
  return (
    <aside className={styles.bank}>
      <p className={styles.bankTitle}>Bank</p>
      <div className={styles.bankList}>{children}</div>
    </aside>
  );
}
