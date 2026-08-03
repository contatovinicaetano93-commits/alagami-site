"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import { MathUtils, MeshStandardMaterial } from "three";

export type ObraStageSceneProps = {
  /** 0 = terreno, 1 = obra concluída */
  progress: number;
  /** Rotação ambiente suave (hero). Desligar no scrub. */
  idleSpin?: boolean;
};

const NAVY = "#0C1A3D";
const CONCRETE = "#9AA4B2";
const STEEL = "#64748B";
const MINT = "#4ADE80";
const DIRT = "#3D4A5C";

const FLOORS = 5;
const WIDTH = 2.4;
const DEPTH = 1.8;
const FLOOR_H = 0.55;

function floorReveal(progress: number, floorIndex: number): number {
  const start = 0.18 + (floorIndex / FLOORS) * 0.55;
  const end = start + 0.14;
  return MathUtils.clamp((progress - start) / (end - start), 0, 1);
}

export function ObraStageScene({ progress, idleSpin = false }: ObraStageSceneProps) {
  const root = useRef<Group>(null);
  const building = useRef<Group>(null);
  const foundation = useRef<Mesh>(null);
  const crown = useRef<Mesh>(null);
  const crane = useRef<Group>(null);
  const floorGroups = useRef<(Group | null)[]>([]);
  const floorSlabs = useRef<(Mesh | null)[]>([]);
  const target = useRef(progress);
  const smooth = useRef(progress);

  target.current = MathUtils.clamp(progress, 0, 1);

  useFrame((_, delta) => {
    smooth.current = MathUtils.damp(smooth.current, target.current, 5, delta);
    const p = smooth.current;

    if (root.current && idleSpin) {
      root.current.rotation.y += delta * 0.12;
    }

    if (foundation.current) {
      const f = MathUtils.clamp(p / 0.18, 0, 1);
      foundation.current.scale.y = Math.max(f, 0.04);
      foundation.current.position.y = f * 0.12;
      foundation.current.visible = f > 0.02;
    }

    for (let i = 0; i < FLOORS; i++) {
      const g = floorGroups.current[i];
      const slab = floorSlabs.current[i];
      if (!g) continue;
      const v = floorReveal(p, i);
      g.visible = v > 0.02;
      g.scale.y = Math.max(v, 0.06);
      g.position.y = 0.28 + i * FLOOR_H;
      if (slab && slab.material instanceof MeshStandardMaterial) {
        const liberado = p > 0.72 && i <= Math.floor((p - 0.72) / 0.07);
        const mat = slab.material;
        if (liberado) {
          mat.color.set(MINT);
          mat.emissive.set(MINT);
          mat.emissiveIntensity = 0.18;
          mat.roughness = 0.45;
        } else {
          mat.color.set(CONCRETE);
          mat.emissive.set(NAVY);
          mat.emissiveIntensity = 0;
          mat.roughness = 0.88;
        }
      }
    }

    if (crown.current) {
      const c = MathUtils.clamp((p - 0.82) / 0.18, 0, 1);
      crown.current.visible = c > 0.02;
      crown.current.scale.y = Math.max(c, 0.04);
    }

    if (crane.current) {
      const c = MathUtils.clamp((p - 0.35) / 0.4, 0, 1);
      crane.current.visible = c > 0.02;
      crane.current.scale.setScalar(Math.max(c, 0.04));
    }
  });

  return (
    <group ref={root} rotation={[0.18, -0.55, 0]}>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4.5, 7, 3]} intensity={1.35} castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} color="#93C5FD" />

      <group ref={building} position={[0, -1.1, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[4.2, 48]} />
          <meshStandardMaterial color={DIRT} roughness={0.95} metalness={0.05} />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[3.2, 3.35, 48]} />
          <meshStandardMaterial color={STEEL} roughness={0.7} metalness={0.35} transparent opacity={0.55} />
        </mesh>

        <mesh ref={foundation} castShadow>
          <boxGeometry args={[WIDTH + 0.55, 0.22, DEPTH + 0.55]} />
          <meshStandardMaterial color={CONCRETE} roughness={0.9} metalness={0.08} />
        </mesh>

        {Array.from({ length: FLOORS }, (_, i) => (
          <group
            key={i}
            ref={(el) => {
              floorGroups.current[i] = el;
            }}
          >
            <mesh
              ref={(el) => {
                floorSlabs.current[i] = el;
              }}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[WIDTH, 0.1, DEPTH]} />
              <meshStandardMaterial color={CONCRETE} roughness={0.88} metalness={0.1} emissive={NAVY} emissiveIntensity={0} />
            </mesh>
            {[
              [-WIDTH / 2 + 0.15, -DEPTH / 2 + 0.15],
              [WIDTH / 2 - 0.15, -DEPTH / 2 + 0.15],
              [-WIDTH / 2 + 0.15, DEPTH / 2 - 0.15],
              [WIDTH / 2 - 0.15, DEPTH / 2 - 0.15],
            ].map(([px, pz], pi) => (
              <mesh key={pi} position={[px, -FLOOR_H / 2 + 0.05, pz]} castShadow>
                <boxGeometry args={[0.12, FLOOR_H - 0.08, 0.12]} />
                <meshStandardMaterial color={STEEL} roughness={0.55} metalness={0.55} />
              </mesh>
            ))}
            <mesh position={[0, -0.12, DEPTH / 2 - 0.04]}>
              <boxGeometry args={[WIDTH * 0.92, FLOOR_H * 0.55, 0.06]} />
              <meshStandardMaterial color={NAVY} roughness={0.35} metalness={0.4} transparent opacity={0.85} />
            </mesh>
          </group>
        ))}

        <mesh ref={crown} position={[0, 0.28 + FLOORS * FLOOR_H + 0.05, 0]} castShadow>
          <boxGeometry args={[WIDTH + 0.15, 0.12, DEPTH + 0.15]} />
          <meshStandardMaterial color={MINT} roughness={0.4} metalness={0.3} emissive={MINT} emissiveIntensity={0.22} />
        </mesh>

        <group ref={crane} position={[WIDTH / 2 + 0.7, 0, -DEPTH / 2 - 0.2]}>
          <mesh position={[0, 1.6, 0]} castShadow>
            <boxGeometry args={[0.1, 3.2, 0.1]} />
            <meshStandardMaterial color={STEEL} metalness={0.65} roughness={0.4} />
          </mesh>
          <mesh position={[0.9, 3.15, 0]} castShadow>
            <boxGeometry args={[1.8, 0.08, 0.08]} />
            <meshStandardMaterial color={MINT} metalness={0.5} roughness={0.35} />
          </mesh>
          <mesh position={[1.7, 2.4, 0]}>
            <boxGeometry args={[0.04, 1.4, 0.04]} />
            <meshStandardMaterial color={STEEL} metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[1.7, 1.65, 0]}>
            <boxGeometry args={[0.28, 0.22, 0.28]} />
            <meshStandardMaterial color={MINT} metalness={0.35} roughness={0.4} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
