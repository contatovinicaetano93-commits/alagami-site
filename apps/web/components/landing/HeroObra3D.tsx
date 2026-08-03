"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ObraCanvas = dynamic(() => import("./ObraCanvas"), { ssr: false });

type HeroObra3DProps = {
  enabled: boolean;
};

export function HeroObra3D({ enabled }: HeroObra3DProps) {
  const [progress, setProgress] = useState(0.12);
  const [ready, setReady] = useState(false);
  const [idleSpin, setIdleSpin] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setReady(true);
    if (reduce) {
      setIdleSpin(false);
      setProgress(0.88);
      return;
    }

    setIdleSpin(true);
    let raf = 0;
    const start = performance.now();
    const from = 0.08;
    const to = 0.9;
    const duration = 1600;

    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);

  if (!enabled || !ready) return null;

  return (
    <div className="hero-3d">
      <ObraCanvas
        progress={progress}
        idleSpin={idleSpin}
        className="hero-3d-canvas"
      />
      <p className="hero-3d-caption">
        Liberação por etapa — a obra sobe com o capital
      </p>
    </div>
  );
}
