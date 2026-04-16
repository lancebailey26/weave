"use client";

import { useEffect, useRef } from "react";
import styles from "./appHeader.module.css";

export default function AppHeader() {
  const menuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const menu = menuRef.current;
      if (!menu?.open) return;
      if (event.target instanceof Node && menu.contains(event.target)) return;
      menu.open = false;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (!menuRef.current?.open) return;
      menuRef.current.open = false;
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className={styles.header}>
      <h1 className={styles.brand}>Weave</h1>
      {/* <details ref={menuRef} className={styles.menu}>
        <summary className={styles.menuTrigger}>Account</summary>
        <div className={styles.menuPanel}>
          <button type="button" className={styles.menuItem}>
            Log in
          </button>
          <button type="button" className={styles.menuItem}>
            Sign up
          </button>
          <button type="button" className={styles.menuItem}>
            Log out
          </button>
        </div>
      </details> */}
    </header>
  );
}
