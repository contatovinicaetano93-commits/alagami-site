"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { Suspense } from "react";
import { ObraStageScene } from "./ObraStageScene";

export type ObraCanvasProps = {
  progress: number;
  idleSpin?: boolean;
  className?: string;
  /** Qualidade menor no mobile / scrub secundário */
  compact?: boolean;
};

export default function ObraCanvas({
  progress,
  idleSpin = false,
  className,
  compact = false,
}: ObraCanvasProps) {
  return (
    <div className={className} aria-hidden="true">
      <Canvas
        camera={{ position: [3.8, 2.6, 4.6], fov: compact ? 42 : 38, near: 0.1, far: 40 }}
        dpr={compact ? [1, 1.5] : [1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%", display: "block", background: "transparent" }}
      >
        <Suspense fallback={null}>
          <ObraStageScene progress={progress} idleSpin={idleSpin} />
          <ContactShadows position={[0, -1.12, 0]} opacity={0.35} scale={10} blur={2.4} far={4} />
        </Suspense>
      </Canvas>
    </div>
  );
}
