"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./appHeader.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faUser } from "@fortawesome/free-solid-svg-icons";
import { useClerk, useUser } from "@clerk/nextjs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Splash from "../splash/splash";
import { uploadAvatar } from "./helpers/uploadAvatar";
import { deleteAvatar } from "./helpers/deleteAvatar";
import {
  AVATAR_URL_METADATA_KEY,
  parseAvatarUrlFromMetadata,
} from "@/lib/user-avatar";
import {
  ALL_WEAVE_CATEGORY,
  WEAVE_CATEGORIES,
  parseWeaveCategoryFilter,
  type WeaveCategoryFilter,
} from "@/lib/weave-categories";
import { SUPPORTED_LOCALES, type AppLocale } from "@/lib/i18n-locales";
import { useLocale, useTranslations } from "next-intl";

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FeedbackFormData = {
  name: string;
  email: string;
  message: string;
};

const EMPTY_FEEDBACK_FORM: FeedbackFormData = {
  name: "",
  email: "",
  message: "",
};

export default function AppHeader() {
  const t = useTranslations("appHeader");
  const locale = useLocale() as AppLocale;
  const menuRef = useRef<HTMLDetailsElement>(null);
  const clerk = useClerk();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isLocaleMenuOpen, setIsLocaleMenuOpen] = useState(false);
  const [isRemoveAvatarConfirmOpen, setIsRemoveAvatarConfirmOpen] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState<FeedbackFormData>(EMPTY_FEEDBACK_FORM);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  function closeMenu() {
    if (!menuRef.current) return;
    menuRef.current.open = false;
    setIsCategoryMenuOpen(false);
    setIsLocaleMenuOpen(false);
  }
  const { isLoaded, isSignedIn, user } = useUser();
  const metadataAvatarUrl = parseAvatarUrlFromMetadata(
    user?.publicMetadata?.[AVATAR_URL_METADATA_KEY],
  );
  const preferredAvatarUrl = metadataAvatarUrl ?? user?.imageUrl ?? null;
  const selectedCategory = useMemo(
    () => parseWeaveCategoryFilter(searchParams.get("category") ?? undefined),
    [searchParams],
  );

  function showNotification(message: string) {
    setNotificationMessage(message);
  }

  useEffect(() => {
    if (!notificationMessage) return;
    const timeoutId = window.setTimeout(() => {
      setNotificationMessage(null);
    }, 3500);
    return () => window.clearTimeout(timeoutId);
  }, [notificationMessage]);

  async function applyCategory(category: WeaveCategoryFilter) {
    if (isSignedIn) {
      try {
        await fetch("/api/user/weave-category", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category }),
        });
      } catch {
        // If preference save fails, still navigate so gameplay is not blocked.
      }
    }
    const next = new URLSearchParams(searchParams.toString());
    if (category === ALL_WEAVE_CATEGORY) {
      next.delete("category");
    } else {
      next.set("category", category);
    }
    const nextQuery = next.toString();
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname);
    closeMenu();
  }

  async function applyLocale(nextLocale: AppLocale) {
    if (isSignedIn) {
      try {
        await fetch("/api/user/locale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: nextLocale }),
        });
      } catch {
        showNotification(t("notifications.localeSaveFailed"));
      }
    }

    setIsLocaleMenuOpen(false);
    closeMenu();
    router.refresh();
  }

  async function handleChangeAvatar() {
    const uploader = document.createElement("input");
    uploader.type = "file";
    uploader.accept = "image/jpeg,image/png,image/webp";
    uploader.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
          showNotification(t("notifications.invalidAvatarType"));
          return;
        }
        if (file.size > MAX_AVATAR_SIZE_BYTES) {
          showNotification(t("notifications.avatarTooLarge"));
          return;
        }

        try {
          await uploadAvatar(file);
          await user?.reload();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : t("notifications.avatarUploadFailed");
          showNotification(message);
        }
      }
    };
    uploader.click();
  }

  function openFeedback() {
    const primaryEmail = user?.primaryEmailAddress?.emailAddress ?? "";
    setFeedbackForm({
      name: user?.fullName ?? user?.username ?? "",
      email: primaryEmail,
      message: "",
    });
    closeMenu();
    setIsFeedbackOpen(true);
  }

  function closeFeedback() {
    if (isSubmittingFeedback) return;
    setIsFeedbackOpen(false);
    setFeedbackForm(EMPTY_FEEDBACK_FORM);
  }

  async function handleSubmitFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!feedbackForm.name || !feedbackForm.email || !feedbackForm.message) {
      showNotification(t("notifications.feedbackRequired"));
      return;
    }

    if (!EMAIL_REGEX.test(feedbackForm.email)) {
      showNotification(t("notifications.feedbackInvalidEmail"));
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackForm),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || t("notifications.feedbackFailed"));
      }

      setIsFeedbackOpen(false);
      setFeedbackForm(EMPTY_FEEDBACK_FORM);
      showNotification(t("notifications.feedbackSent"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("notifications.feedbackFailed");
      showNotification(message);
    } finally {
      setIsSubmittingFeedback(false);
    }
  }

  async function handleRemoveAvatar() {
    try {
      setIsRemovingAvatar(true);
      await deleteAvatar();
      await user?.reload();
      setIsRemoveAvatarConfirmOpen(false);
      closeMenu();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("notifications.avatarRemoveFailed");
      showNotification(message);
    } finally {
      setIsRemovingAvatar(false);
    }
  }

  useEffect(() => {
    function closeMenuFromOutside() {
      const menu = menuRef.current;
      if (!menu?.open) return;
      menu.open = false;
      setIsCategoryMenuOpen(false);
      setIsLocaleMenuOpen(false);
    }

    function targetInsideMenu(target: EventTarget | null): boolean {
      const menu = menuRef.current;
      if (!menu || !(target instanceof Node)) return false;
      return menu.contains(target);
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.open) return;
      if (targetInsideMenu(event.target)) return;
      closeMenuFromOutside();
    }

    function handleTouchStart(event: TouchEvent) {
      if (!menuRef.current?.open) return;
      if (targetInsideMenu(event.target)) return;
      closeMenuFromOutside();
    }

    function handleClick(event: MouseEvent) {
      if (!menuRef.current?.open) return;
      if (targetInsideMenu(event.target)) return;
      closeMenuFromOutside();
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (!menuRef.current?.open) return;
      closeMenuFromOutside();
    }

    const captureOptions = true;
    const touchStartOptions = { capture: true, passive: true } as const;
    document.addEventListener("pointerdown", handlePointerDown, captureOptions);
    document.addEventListener("touchstart", handleTouchStart, touchStartOptions);
    document.addEventListener("click", handleClick, captureOptions);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, captureOptions);
      document.removeEventListener("touchstart", handleTouchStart, touchStartOptions);
      document.removeEventListener("click", handleClick, captureOptions);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <>
      {isFeedbackOpen && (
        <Splash
          onClose={closeFeedback}
          screen={
            <form className={styles.feedbackForm} onSubmit={handleSubmitFeedback}>
              <h2 className={styles.feedbackTitle}>{t("feedback.title")}</h2>
              <p className={styles.feedbackDescription}>{t("feedback.description")}</p>
              <div className={styles.feedbackField}>
                <label className={styles.feedbackLabel} htmlFor="feedback-name">
                  {t("feedback.name")}
                </label>
                <input
                  id="feedback-name"
                  name="name"
                  type="text"
                  className={styles.feedbackInput}
                  value={feedbackForm.name}
                  onChange={(event) =>
                    setFeedbackForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  disabled={isSubmittingFeedback}
                  required
                />
              </div>
              <div className={styles.feedbackField}>
                <label className={styles.feedbackLabel} htmlFor="feedback-email">
                  {t("feedback.email")}
                </label>
                <input
                  id="feedback-email"
                  name="email"
                  type="email"
                  className={styles.feedbackInput}
                  value={feedbackForm.email}
                  onChange={(event) =>
                    setFeedbackForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  disabled={isSubmittingFeedback}
                  required
                />
              </div>
              <div className={styles.feedbackField}>
                <label className={styles.feedbackLabel} htmlFor="feedback-message">
                  {t("feedback.message")}
                </label>
                <textarea
                  id="feedback-message"
                  name="message"
                  className={styles.feedbackTextarea}
                  value={feedbackForm.message}
                  onChange={(event) =>
                    setFeedbackForm((prev) => ({ ...prev, message: event.target.value }))
                  }
                  disabled={isSubmittingFeedback}
                  required
                />
              </div>
              <div className={styles.feedbackActions}>
                <button
                  type="button"
                  className={styles.feedbackCancel}
                  onClick={closeFeedback}
                  disabled={isSubmittingFeedback}
                >
                  {t("feedback.cancel")}
                </button>
                <button
                  type="submit"
                  className={styles.feedbackSubmit}
                  disabled={isSubmittingFeedback}
                >
                  {isSubmittingFeedback ? t("feedback.sending") : t("feedback.submit")}
                </button>
              </div>
            </form>
          }
        />
      )}
      {isRemoveAvatarConfirmOpen && (
        <Splash
          onClose={() => {
            if (isRemovingAvatar) return;
            setIsRemoveAvatarConfirmOpen(false);
          }}
          screen={
            <div className={styles.avatarConfirm}>
              <h2 className={styles.avatarConfirmTitle}>{t("confirm.title")}</h2>
              <p className={styles.avatarConfirmText}>
                {t("confirm.description")}
              </p>
              <div className={styles.avatarConfirmActions}>
                <button
                  type="button"
                  className={styles.avatarConfirmCancel}
                  onClick={() => setIsRemoveAvatarConfirmOpen(false)}
                  disabled={isRemovingAvatar}
                >
                  {t("confirm.cancel")}
                </button>
                <button
                  type="button"
                  className={styles.avatarConfirmDelete}
                  onClick={() => {
                    handleRemoveAvatar();
                  }}
                  disabled={isRemovingAvatar}
                >
                  {isRemovingAvatar ? t("confirm.removing") : t("confirm.removeAvatar")}
                </button>
              </div>
            </div>
          }
        />
      )}
      {notificationMessage && (
        <div className={styles.notification} role="status" aria-live="polite">
          <span>{notificationMessage}</span>
          <button
            type="button"
            className={styles.notificationClose}
            onClick={() => setNotificationMessage(null)}
            aria-label={t("notifications.dismiss")}
          >
            ×
          </button>
        </div>
      )}
      <header className={styles.header}>
        <h1 className={styles.brand}>Weave</h1>
        <details ref={menuRef} className={styles.menu}>
        <summary
          className={`${styles.menuTrigger} ${isSignedIn ? styles.menuTriggerWithAvatar : ""}`}
        >
          {isSignedIn && user ? (
            <Image
              src={preferredAvatarUrl ?? user.imageUrl}
              alt={user.fullName ?? user.username ?? t("profileAlt")}
              className={styles.menuAvatar}
              width={38}
              height={38}
            />
          ) : (
            <FontAwesomeIcon icon={faUser} />
          )}
        </summary>
        <div className={styles.menuPanel}>
          {isLoaded && isSignedIn ? (
            <>
              <div className={styles.menuItemFlyout}>
                <button
                  type="button"
                  className={`${styles.menuItem} ${styles.menuItemWithChevron}`}
                  onClick={() => {
                    setIsLocaleMenuOpen(false);
                    setIsCategoryMenuOpen((open) => !open);
                  }}
                  aria-expanded={isCategoryMenuOpen}
                >
                  <FontAwesomeIcon icon={faChevronLeft} className={styles.menuChevron} />
                  <span>
                    {t("menu.category")}
                    <strong className={styles.menuSubLabel}>
                      {t(`categories.${selectedCategory}`)}
                    </strong>
                  </span>
                  
                </button>

                {isCategoryMenuOpen && (
                  <div className={styles.subMenuPanel}>
                    <button
                      type="button"
                      className={`${styles.menuItem} ${
                        selectedCategory === ALL_WEAVE_CATEGORY ? styles.menuItemActive : ""
                      }`}
                      onClick={() => applyCategory(ALL_WEAVE_CATEGORY)}
                    >
                      {t(`categories.${ALL_WEAVE_CATEGORY}`)}
                    </button>
                    {WEAVE_CATEGORIES.map((category) => (
                      <button
                        key={category}
                        type="button"
                        className={`${styles.menuItem} ${
                          selectedCategory === category ? styles.menuItemActive : ""
                        }`}
                        onClick={() => applyCategory(category)}
                      >
                        {t(`categories.${category}`)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.menuItemFlyout}>
                <button
                  type="button"
                  className={`${styles.menuItem} ${styles.menuItemWithChevron}`}
                  onClick={() => {
                    setIsCategoryMenuOpen(false);
                    setIsLocaleMenuOpen((open) => !open);
                  }}
                  aria-expanded={isLocaleMenuOpen}
                >
                  <FontAwesomeIcon icon={faChevronLeft} className={styles.menuChevron} />
                  <span>
                    {t("menu.language")}
                    <strong className={styles.menuSubLabel}>{t(`locales.${locale}`)}</strong>
                  </span>
                </button>

                {isLocaleMenuOpen && (
                  <div className={styles.subMenuPanel}>
                    {SUPPORTED_LOCALES.map((availableLocale) => (
                      <button
                        key={availableLocale}
                        type="button"
                        className={`${styles.menuItem} ${
                          locale === availableLocale ? styles.menuItemActive : ""
                        }`}
                        onClick={() => applyLocale(availableLocale)}
                      >
                        {t(`locales.${availableLocale}`)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button 
                type="button"
                className={styles.menuItem}
                onClick={() => {
                  handleChangeAvatar();
                }}
              >
                {t("menu.changeAvatar")}
              </button>
              {metadataAvatarUrl && (
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => {
                    closeMenu();
                    setIsRemoveAvatarConfirmOpen(true);
                  }}
                >
                  {t("menu.removeAvatar")}
                </button>
              )}
              <button
                type="button"
                className={styles.menuItem}
                onClick={() => {
                  closeMenu();
                  void clerk.signOut();
                }}
              >
                {t("menu.signOut")}
              </button>
              <button
                type="button"
                className={styles.menuItem}
                onClick={openFeedback}
              >
                {t("menu.feedback")}
              </button>
              <Link
                href="/legal"
                className={styles.menuItem}
                onClick={() => {
                  closeMenu();
                }}
              >
                Legal
              </Link>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.menuItem}
                onClick={() => {
                  closeMenu();
                  void clerk.openSignIn();
                }}
              >
                {t("menu.signIn")}
              </button>
              <button
                type="button"
                className={styles.menuItem}
                onClick={openFeedback}
              >
                {t("menu.feedback")}
              </button>
              <Link
                href="/legal"
                className={styles.menuItem}
                onClick={() => {
                  closeMenu();
                }}
              >
                Legal
              </Link>
            </>
          )}
        </div>
        </details>
      </header>
    </>
  );
}
