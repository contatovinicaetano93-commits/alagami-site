"use client";

import { ContactShadows, Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import {
  ACESFilmicToneMapping,
  PCFShadowMap,
  SRGBColorSpace,
} from "three";
import { ObraStageScene } from "./ObraStageScene";

export type ObraCanvasProps = {
  progress: number;
  idleSpin?: boolean;
  className?: string;
  /** Qualidade menor no mobile / scrub secundário */
  compact?: boolean;
  children?: ReactNode;
};

function SceneAtmosphere({ compact }: { compact: boolean }) {
  return (
    <>
      <color attach="background" args={["#1a2744"]} />
      <Environment files="/3d/hdri/sky.hdr" background={false} environmentIntensity={0.85} />
      <hemisphereLight args={["#dce9ff", "#6b6254", 0.55]} />
      <ambientLight intensity={0.28} color="#eef3f8" />
      <directionalLight
        castShadow
        position={[8, 14, 6]}
        intensity={compact ? 2.2 : 2.8}
        color="#fff3df"
        shadow-mapSize={compact ? [1024, 1024] : [2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={32}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={11}
        shadow-camera-bottom={-7}
        shadow-bias={-0.00025}
      />
      <directionalLight position={[-7, 4, -4]} intensity={0.55} color="#9ec0ff" />
      <directionalLight position={[2, 3, -8]} intensity={0.35} color="#ffc9a0" />
      <fog attach="fog" args={["#1a2744", compact ? 13 : 15, compact ? 30 : 36]} />
    </>
  );
}

export default function ObraCanvas({
  progress,
  idleSpin = false,
  className,
  compact = false,
  children,
}: ObraCanvasProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={className} aria-hidden="true" />;
  }

  return (
    <div className={className} aria-hidden="true">
      <Canvas
        shadows
        camera={{
          position: compact ? [3.9, 2.75, 4.8] : [4.5, 3.15, 5.4],
          fov: compact ? 40 : 33,
          near: 0.1,
          far: 60,
        }}
        dpr={compact ? [1, 1.5] : [1, 1.85]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
          outputColorSpace: SRGBColorSpace,
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = PCFShadowMap;
          gl.setClearColor("#1a2744", 1);
        }}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <Suspense fallback={null}>
          <SceneAtmosphere compact={compact} />
          <ObraStageScene progress={progress} idleSpin={idleSpin} />
          <ContactShadows
            position={[0, -1.145, 0]}
            opacity={0.42}
            scale={14}
            blur={2.4}
            far={6}
            color="#050810"
          />
          {children}
        </Suspense>
      </Canvas>
    </div>
  );
}
