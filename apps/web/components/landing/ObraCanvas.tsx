"use client";

import { ContactShadows, SoftShadows } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import {
  ACESFilmicToneMapping,
  PCFSoftShadowMap,
  PMREMGenerator,
  SRGBColorSpace,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ObraStageScene } from "./ObraStageScene";

export type ObraCanvasProps = {
  progress: number;
  idleSpin?: boolean;
  className?: string;
  /** Qualidade menor no mobile / scrub secundário */
  compact?: boolean;
  children?: ReactNode;
};

/** Reflexões locais sem HDR externo — vidro e aço ficam bem mais reais. */
function LocalEnvironment() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const env = new RoomEnvironment();
    const rt = pmrem.fromScene(env, 0.04);
    scene.environment = rt.texture;
    scene.environmentIntensity = 0.85;
    return () => {
      scene.environment = null;
      rt.dispose();
      pmrem.dispose();
      env.dispose();
    };
  }, [gl, scene]);

  return null;
}

function SceneAtmosphere({ compact }: { compact: boolean }) {
  return (
    <>
      <SoftShadows size={compact ? 16 : 26} samples={compact ? 8 : 14} focus={0.5} />
      <LocalEnvironment />
      <hemisphereLight args={["#c9dbf5", "#4a453c", compact ? 0.55 : 0.7]} />
      <ambientLight intensity={compact ? 0.2 : 0.28} color="#e8eef6" />
      <directionalLight
        castShadow
        position={[6.5, 10.5, 4.2]}
        intensity={compact ? 1.35 : 1.7}
        color="#fff1dc"
        shadow-mapSize={compact ? [1024, 1024] : [2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={28}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={8}
        shadow-camera-bottom={-6}
        shadow-bias={-0.00022}
      />
      <directionalLight position={[-5, 3.5, -4]} intensity={0.5} color="#8eb4ff" />
      <directionalLight position={[2, 2.5, -6]} intensity={0.22} color="#ffc9a0" />
      <fog attach="fog" args={["#0a142c", compact ? 9 : 11, compact ? 20 : 24]} />
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
          position: compact ? [3.7, 2.55, 4.5] : [4.25, 2.95, 5.05],
          fov: compact ? 40 : 35,
          near: 0.1,
          far: 60,
        }}
        dpr={compact ? [1, 1.5] : [1, 1.85]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1.08,
          outputColorSpace: SRGBColorSpace,
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = PCFSoftShadowMap;
        }}
        style={{ width: "100%", height: "100%", display: "block", background: "transparent" }}
      >
        <Suspense fallback={null}>
          <SceneAtmosphere compact={compact} />
          <ObraStageScene progress={progress} idleSpin={idleSpin} />
          <ContactShadows
            position={[0, -1.145, 0]}
            opacity={0.55}
            scale={14}
            blur={2.6}
            far={6}
            color="#050810"
          />
          {children}
        </Suspense>
      </Canvas>
    </div>
  );
}
