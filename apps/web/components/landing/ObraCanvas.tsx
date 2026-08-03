"use client";

import { ContactShadows } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import {
  ACESFilmicToneMapping,
  PCFShadowMap,
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

/** Reflexões locais sem HDR externo — vidro e aço ficam mais reais. */
function LocalEnvironment() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const env = new RoomEnvironment();
    const rt = pmrem.fromScene(env, 0.04);
    scene.environment = rt.texture;
    scene.environmentIntensity = 1.15;
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
      <LocalEnvironment />
      <color attach="background" args={["#15243f"]} />
      <hemisphereLight args={["#e8f1ff", "#6a6256", 0.95]} />
      <ambientLight intensity={0.42} color="#f2f6fb" />
      <directionalLight
        castShadow
        position={[7, 12, 5]}
        intensity={compact ? 2.0 : 2.5}
        color="#fff6e8"
        shadow-mapSize={compact ? [1024, 1024] : [2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={10}
        shadow-camera-bottom={-7}
        shadow-bias={-0.0003}
      />
      <directionalLight position={[-6, 5, -3]} intensity={0.85} color="#a8c4ff" />
      <directionalLight position={[0, 4, -7]} intensity={0.45} color="#ffd2a8" />
      <pointLight position={[0, 3.2, 2.5]} intensity={0.7} color="#ffe8c8" distance={14} />
      <fog attach="fog" args={["#15243f", compact ? 14 : 16, compact ? 32 : 38]} />
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
          position: compact ? [3.8, 2.7, 4.7] : [4.4, 3.1, 5.3],
          fov: compact ? 40 : 34,
          near: 0.1,
          far: 60,
        }}
        dpr={compact ? [1, 1.5] : [1, 1.75]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1.25,
          outputColorSpace: SRGBColorSpace,
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = PCFShadowMap;
          gl.setClearColor("#15243f", 1);
        }}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <Suspense fallback={null}>
          <SceneAtmosphere compact={compact} />
          <ObraStageScene progress={progress} idleSpin={idleSpin} />
          <ContactShadows
            position={[0, -1.145, 0]}
            opacity={0.38}
            scale={14}
            blur={2.2}
            far={5.5}
            color="#060a14"
          />
          {children}
        </Suspense>
      </Canvas>
    </div>
  );
}
