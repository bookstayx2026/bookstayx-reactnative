import { useEffect, useRef, type RefObject } from "react";

type HideOnScrollOptions = {
  /** ms to ignore scroll direction after a toggle (prevents layout-shift feedback shake) */
  lockMs?: number;
  /** pixels of sustained scroll required before toggling */
  threshold?: number;
};

/**
 * Toggle `data-visible` on elements from scroll direction.
 * Uses a post-toggle lock so collapsing sticky/fixed chrome cannot oscillate.
 */
export function useHideOnScroll(
  refs: Array<RefObject<HTMLElement | null>>,
  options: HideOnScrollOptions = {},
) {
  const visibleRef = useRef(true);
  const lastScrollY = useRef(0);
  const scrollAcc = useRef(0);
  const lockedUntil = useRef(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    lastScrollY.current = window.scrollY || window.pageYOffset;

    const syncScrollY = () => {
      lastScrollY.current = window.scrollY || window.pageYOffset;
      scrollAcc.current = 0;
    };

    const setVisible = (visible: boolean) => {
      if (visibleRef.current === visible) return;

      const now = performance.now();
      // Allow forcing visible near top even if locked; otherwise respect lock
      if (!visible && now < lockedUntil.current) return;
      if (visible && now < lockedUntil.current && (window.scrollY || window.pageYOffset) > 8) {
        return;
      }

      visibleRef.current = visible;
      const value = visible ? "true" : "false";
      for (const r of refs) {
        const el = r.current;
        if (!el) continue;
        el.dataset.visible = value;
        el.setAttribute("aria-hidden", visible ? "false" : "true");
      }

      const lockMs = optionsRef.current.lockMs ?? 650;
      lockedUntil.current = now + lockMs;
      scrollAcc.current = 0;

      // Absorb layout-shift scroll noise from height collapse/expand
      syncScrollY();
      requestAnimationFrame(() => {
        syncScrollY();
        requestAnimationFrame(syncScrollY);
      });
      window.setTimeout(syncScrollY, lockMs);
    };

    const onScroll = () => {
      const current = window.scrollY || window.pageYOffset;
      const now = performance.now();
      const delta = current - lastScrollY.current;

      // Always track position while locked so we don't "catch up" with a huge delta later
      if (now < lockedUntil.current) {
        lastScrollY.current = current;
        scrollAcc.current = 0;
        if (current <= 8) setVisible(true);
        return;
      }

      lastScrollY.current = current;

      if (current <= 8) {
        scrollAcc.current = 0;
        setVisible(true);
        return;
      }

      // Ignore micro jitter from subpixel / browser adjustments
      if (Math.abs(delta) < 4) return;

      if (scrollAcc.current === 0 || Math.sign(scrollAcc.current) === Math.sign(delta)) {
        scrollAcc.current += delta;
      } else {
        // Direction flipped — start fresh (don't thrash)
        scrollAcc.current = delta;
      }

      const threshold = optionsRef.current.threshold ?? 56;

      if (scrollAcc.current > threshold) {
        setVisible(false);
      } else if (scrollAcc.current < -threshold) {
        setVisible(true);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
