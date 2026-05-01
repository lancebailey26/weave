"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
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
  getWeaveCategoryLabel,
  parseWeaveCategoryFilter,
  type WeaveCategoryFilter,
} from "@/lib/weave-categories";

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function AppHeader() {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const clerk = useClerk();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isRemoveAvatarConfirmOpen, setIsRemoveAvatarConfirmOpen] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  function closeMenu() {
    if (!menuRef.current) return;
    menuRef.current.open = false;
    setIsCategoryMenuOpen(false);
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

  async function handleChangeAvatar() {
    const uploader = document.createElement("input");
    uploader.type = "file";
    uploader.accept = "image/jpeg,image/png,image/webp";
    uploader.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
          showNotification("Please choose a JPG, PNG, or WEBP image.");
          return;
        }
        if (file.size > MAX_AVATAR_SIZE_BYTES) {
          showNotification("Avatar image must be 2MB or smaller.");
          return;
        }

        try {
          await uploadAvatar(file);
          await user?.reload();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unable to upload avatar right now.";
          showNotification(message);
        }
      }
    };
    uploader.click();
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
        error instanceof Error ? error.message : "Unable to remove avatar right now.";
      showNotification(message);
    } finally {
      setIsRemovingAvatar(false);
    }
  }

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const menu = menuRef.current;
      if (!menu?.open) return;
      if (event.target instanceof Node && menu.contains(event.target)) return;
      menu.open = false;
      setIsCategoryMenuOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (!menuRef.current?.open) return;
      menuRef.current.open = false;
      setIsCategoryMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <>
      {isRemoveAvatarConfirmOpen && (
        <Splash
          onClose={() => {
            if (isRemovingAvatar) return;
            setIsRemoveAvatarConfirmOpen(false);
          }}
          screen={
            <div className={styles.avatarConfirm}>
              <h2 className={styles.avatarConfirmTitle}>Remove Avatar?</h2>
              <p className={styles.avatarConfirmText}>
                Your uploaded avatar will be deleted and your default profile image will be used.
              </p>
              <div className={styles.avatarConfirmActions}>
                <button
                  type="button"
                  className={styles.avatarConfirmCancel}
                  onClick={() => setIsRemoveAvatarConfirmOpen(false)}
                  disabled={isRemovingAvatar}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.avatarConfirmDelete}
                  onClick={() => {
                    handleRemoveAvatar();
                  }}
                  disabled={isRemovingAvatar}
                >
                  {isRemovingAvatar ? "Removing..." : "Remove Avatar"}
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
            aria-label="Dismiss notification"
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
              alt={user.fullName ?? user.username ?? "Profile"}
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
                  onClick={() => setIsCategoryMenuOpen((open) => !open)}
                  aria-expanded={isCategoryMenuOpen}
                >
                  <FontAwesomeIcon icon={faChevronLeft} className={styles.menuChevron} />
                  <span>
                    Category
                    <strong className={styles.menuSubLabel}>
                      {getWeaveCategoryLabel(selectedCategory)}
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
                      {getWeaveCategoryLabel(ALL_WEAVE_CATEGORY)}
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
                        {getWeaveCategoryLabel(category)}
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
                Change Avatar
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
                  Remove Avatar
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
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              className={styles.menuItem}
              onClick={() => {
                closeMenu();
                void clerk.openSignIn();
              }}
            >
              Sign in
            </button>
          )}
        </div>
        </details>
      </header>
    </>
  );
}
