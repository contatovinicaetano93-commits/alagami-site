"use client";

import { ContactShadows, Environment } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Bloom,
  BrightnessContrast,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  HueSaturation,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ACESFilmicToneMapping,
  Color,
  MathUtils,
  PCFShadowMap,
  PerspectiveCamera,
  SRGBColorSpace,
  Vector2,
  type Group,
  type Points,
} from "three";
import { ObraStageScene } from "./ObraStageScene";

export type ObraCanvasProps = {
  progress: number;
  idleSpin?: boolean;
  className?: string;
  /** Qualidade menor no mobile / scrub secundário */
  compact?: boolean;
  /** Look cinematográfico (hero). Desligado no scrub compacto. */
  cinematic?: boolean;
  children?: ReactNode;
};

const FOG = "#0e1628";

function DustMotes({ count = 80 }: { count?: number }) {
  const ref = useRef<Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 1] = Math.random() * 5 - 0.5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.012;
    const pos = ref.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      const y = pos.getY(i) + 0.002 + Math.sin(state.clock.elapsedTime * 0.4 + i) * 0.0008;
      pos.setY(i, y > 4.5 ? -0.8 : y);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#e8dcc8"
        transparent
        opacity={0.35}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/** Dolly + orbit lento, estilo establishing shot. */
function CinematicCameraRig({
  enabled,
  compact,
}: {
  enabled: boolean;
  compact: boolean;
}) {
  const { camera } = useThree();
  const t = useRef(0);
  const base = useMemo(
    () => ({
      radius: compact ? 6.2 : 7.1,
      height: compact ? 2.35 : 2.55,
      lookY: compact ? 0.55 : 0.75,
      fov: compact ? 38 : 28,
    }),
    [compact],
  );

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    camera.fov = base.fov;
    camera.updateProjectionMatrix();
  }, [camera, base.fov]);

  useFrame((_, delta) => {
    if (!enabled || !(camera instanceof PerspectiveCamera)) return;
    t.current += delta * 0.08;
    const angle = -0.55 + Math.sin(t.current * 0.55) * 0.22 + t.current * 0.12;
    const breathe = 1 + Math.sin(t.current * 0.7) * 0.04;
    const r = base.radius * breathe;
    const x = Math.sin(angle) * r;
    const z = Math.cos(angle) * r;
    const y = base.height + Math.sin(t.current * 0.45) * 0.12;
    camera.position.x = MathUtils.damp(camera.position.x, x, 1.2, delta);
    camera.position.y = MathUtils.damp(camera.position.y, y, 1.2, delta);
    camera.position.z = MathUtils.damp(camera.position.z, z, 1.2, delta);
    camera.lookAt(0.15, base.lookY, 0);
  });

  return null;
}

function CinematicLights({ compact }: { compact: boolean }) {
  const sun = useRef<Group>(null);

  useFrame((state) => {
    if (!sun.current) return;
    sun.current.position.x = 9 + Math.sin(state.clock.elapsedTime * 0.05) * 0.4;
  });

  return (
    <>
      <color attach="background" args={[FOG]} />
      <fog attach="fog" args={[FOG, compact ? 9 : 10, compact ? 22 : 26]} />
      <Environment files="/3d/hdri/sky.hdr" background={false} environmentIntensity={0.55} />

      {/* Fill frio do céu */}
      <hemisphereLight args={["#7a9cc8", "#3a3228", 0.35]} />
      <ambientLight intensity={0.12} color="#c8d4e8" />

      {/* Key — golden hour baixo e quente */}
      <group ref={sun}>
        <directionalLight
          castShadow
          position={[10, 5.2, 3.5]}
          intensity={compact ? 3.0 : 3.8}
          color="#ff9a4a"
          shadow-mapSize={compact ? [1024, 1024] : [2048, 2048]}
          shadow-camera-near={1}
          shadow-camera-far={36}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={12}
          shadow-camera-bottom={-8}
          shadow-bias={-0.00025}
        />
      </group>

      {/* Rim frio (contraste cinematográfico) */}
      <directionalLight position={[-8, 3.2, -5]} intensity={0.75} color="#6a8cff" />
      {/* Bounce quente do solo */}
      <directionalLight position={[1, 1.2, 6]} intensity={0.55} color="#ffb070" />
      {/* Halo de sol — bloom quente, não neon */}
      <pointLight position={[6, 4.5, 2]} intensity={1.4} color="#ffb060" distance={16} />
      <spotLight
        position={[5, 7, 1]}
        angle={0.4}
        penumbra={0.75}
        intensity={1.1}
        color="#ffc080"
        castShadow={false}
      />
    </>
  );
}

function CinematicPost({ compact }: { compact: boolean }) {
  const offset = useMemo(() => new Vector2(0.0007, 0.0005), []);

  if (compact) {
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom luminanceThreshold={0.75} luminanceSmoothing={0.5} intensity={0.4} mipmapBlur />
        <Vignette eskil={false} offset={0.2} darkness={0.65} />
        <BrightnessContrast brightness={-0.01} contrast={0.1} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom luminanceThreshold={0.55} luminanceSmoothing={0.4} intensity={0.95} mipmapBlur />
      <DepthOfField focusDistance={0.016} focalLength={0.032} bokehScale={2.8} height={480} />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={offset}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette eskil={false} offset={0.18} darkness={0.82} />
      <BrightnessContrast brightness={-0.04} contrast={0.18} />
      <HueSaturation hue={0.035} saturation={0.12} />
    </EffectComposer>
  );
}

function SceneAtmosphere({
  compact,
  cinematic,
}: {
  compact: boolean;
  cinematic: boolean;
}) {
  if (!cinematic) {
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
        <fog attach="fog" args={["#1a2744", compact ? 13 : 15, compact ? 30 : 36]} />
      </>
    );
  }

  return (
    <>
      <CinematicLights compact={compact} />
      {!compact ? <DustMotes count={90} /> : <DustMotes count={40} />}
    </>
  );
}

export default function ObraCanvas({
  progress,
  idleSpin = false,
  className,
  compact = false,
  cinematic = false,
  children,
}: ObraCanvasProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const useCinema = cinematic && !compact;

  if (!mounted) {
    return <div className={className} aria-hidden="true" />;
  }

  return (
    <div className={className} aria-hidden="true">
      <Canvas
        shadows
        camera={{
          position: compact ? [3.9, 2.75, 4.8] : useCinema ? [5.2, 2.6, 6.4] : [4.5, 3.15, 5.4],
          fov: compact ? 40 : useCinema ? 28 : 33,
          near: 0.1,
          far: 60,
        }}
        dpr={compact ? [1, 1.4] : [1, 1.75]}
        gl={{
          antialias: !useCinema,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: useCinema ? 0.88 : 1.05,
          outputColorSpace: SRGBColorSpace,
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = PCFShadowMap;
          gl.setClearColor(new Color(useCinema ? FOG : "#1a2744"), 1);
        }}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <Suspense fallback={null}>
          <SceneAtmosphere compact={compact} cinematic={useCinema || (cinematic && compact)} />
          <CinematicCameraRig enabled={useCinema} compact={compact} />
          <ObraStageScene progress={progress} idleSpin={idleSpin && !useCinema} />
          <ContactShadows
            position={[0, -1.145, 0]}
            opacity={useCinema ? 0.55 : 0.42}
            scale={14}
            blur={useCinema ? 3.2 : 2.4}
            far={6}
            color="#020508"
          />
          {(useCinema || (cinematic && compact)) && <CinematicPost compact={compact} />}
          {children}
        </Suspense>
      </Canvas>
    </div>
  );
}
