"use client";

import { useEffect } from "react";
import { ReactLenis, useLenis } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ReactNode } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function ScrollTriggerSync() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;
    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);
    return () => { lenis.off("scroll", onScroll); };
  }, [lenis]);

  return null;
}

export default function SmoothScrollProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        duration: 2.0,
        easing: (t: number) => 1 - Math.pow(1 - t, 5),
        smoothWheel: true,
        wheelMultiplier: 0.4,
        touchMultiplier: 0.8,
      }}
    >
      <ScrollTriggerSync />
      {children}
    </ReactLenis>
  );
}
