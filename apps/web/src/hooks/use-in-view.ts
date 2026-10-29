'use client';

import { type RefObject, useEffect, useRef, useState } from 'react';

interface UseInViewOptions {
  /** Fraction of the element that must be visible. */
  threshold?: number;
  /** Stop observing after the first time the element becomes visible. */
  once?: boolean;
  rootMargin?: string;
}

/** Tracks whether an element is on screen. Returns a ref for the element and the current state. */
export function useInView<T extends Element>({
  threshold = 0.2,
  once = true,
  rootMargin = '0px 0px -8% 0px',
}: UseInViewOptions = {}): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) observer.disconnect();
      },
      { threshold, rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, once, rootMargin]);

  return [ref, inView];
}
