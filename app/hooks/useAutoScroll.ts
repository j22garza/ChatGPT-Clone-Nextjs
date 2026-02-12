"use client";

import { useEffect, useRef, useCallback } from "react";

const NEAR_BOTTOM_THRESHOLD_PX = 200;

/**
 * Auto-scroll inteligente: baja al final SOLO si el usuario está cerca del fondo.
 * Si el usuario scrolleó arriba, no arrastra.
 */
export function useAutoScroll<T>(
  scrollContainerRef: React.RefObject<HTMLDivElement | null>,
  dependency: T
) {
  const userHasScrolledUp = useRef(false);
  const lastScrollHeight = useRef(0);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, [scrollContainerRef]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const isNearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD_PX;
    const contentGrew = el.scrollHeight > lastScrollHeight.current;
    lastScrollHeight.current = el.scrollHeight;

    if (contentGrew && (isNearBottom || !userHasScrolledUp.current)) {
      scrollToBottom("smooth");
      userHasScrolledUp.current = false;
    }
  }, [dependency, scrollContainerRef, scrollToBottom]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const onScroll = () => {
      const nearBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD_PX;
      if (!nearBottom) userHasScrolledUp.current = true;
      else userHasScrolledUp.current = false;
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollContainerRef]);

  return { scrollToBottom };
}
