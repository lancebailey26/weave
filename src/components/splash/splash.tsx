'use client';
import styles from './splash.module.css'
import type { SplashProps } from '@/lib/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
export default function Splash({ onClose, screen }: SplashProps) {
  return (
    <div
      className={styles.splashOverlay}
      role="dialog"
      aria-modal="true"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className={styles.splash}>
        <div className={styles.closeButtonContainer}>
        <FontAwesomeIcon icon={faXmark} onClick={onClose} style={{ fontSize: '16px' }}/>
        </div>
        <div className={styles.splashContent}>
          {screen}
        </div>
      </section>
    </div>
  );
}