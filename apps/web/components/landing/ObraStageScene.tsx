"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import { DoubleSide, MathUtils, Vector2 } from "three";
import { PALETTE, useObraTextures, type ObraTextures } from "./useObraTextures";

export type ObraStageSceneProps = {
  /** 0 = terreno, 1 = obra concluída */
  progress: number;
  /** Rotação ambiente suave (hero). Desligar no scrub. */
  idleSpin?: boolean;
};

const FLOORS = 6;
const WIDTH = 2.7;
const DEPTH = 2.1;
const FLOOR_H = 0.54;
const CONCRETE_NORMAL = new Vector2(0.7, 0.7);
const DIRT_NORMAL = new Vector2(1.2, 1.2);

function floorReveal(progress: number, floorIndex: number): number {
  const start = 0.16 + (floorIndex / FLOORS) * 0.58;
  const end = start + 0.12;
  return MathUtils.clamp((progress - start) / (end - start), 0, 1);
}

type Maps = ObraTextures;

function ConcreteMat({
  maps,
  color = PALETTE.concrete,
}: {
  maps: Maps["concrete"];
  color?: string | typeof PALETTE.concrete;
}) {
  return (
    <meshStandardMaterial
      map={maps.map}
      normalMap={maps.normalMap}
      roughnessMap={maps.roughnessMap}
      color={color}
      roughness={0.88}
      metalness={0.06}
      normalScale={CONCRETE_NORMAL}
      envMapIntensity={0.55}
    />
  );
}

function MetalMat({
  maps,
  color = PALETTE.steel,
}: {
  maps: Maps["metal"];
  color?: string | typeof PALETTE.steel;
}) {
  return (
    <meshStandardMaterial
      map={maps.map}
      normalMap={maps.normalMap}
      roughnessMap={maps.roughnessMap}
      color={color}
      roughness={0.4}
      metalness={0.78}
      envMapIntensity={1.1}
    />
  );
}

function WoodMat({ maps }: { maps: Maps["wood"] }) {
  return (
    <meshStandardMaterial
      map={maps.map}
      normalMap={maps.normalMap}
      roughnessMap={maps.roughnessMap}
      color={PALETTE.wood}
      roughness={0.85}
      metalness={0.04}
      envMapIntensity={0.35}
    />
  );
}

/** Janela embutida com peitoril, batente e vidro refletivo. */
function RecessedWindow({
  width,
  height,
  metal,
}: {
  width: number;
  height: number;
  metal: Maps["metal"];
}) {
  const recess = 0.07;
  return (
    <group>
      {/* Batente externo */}
      <mesh castShadow receiveShadow position={[0, 0, -recess * 0.2]}>
        <boxGeometry args={[width + 0.06, height + 0.06, 0.04]} />
        <MetalMat maps={metal} color={PALETTE.darkSteel} />
      </mesh>
      {/* Peitoril */}
      <mesh castShadow position={[0, -height / 2 - 0.02, 0.02]}>
        <boxGeometry args={[width + 0.1, 0.035, 0.1]} />
        <MetalMat maps={metal} color="#8A929C" />
      </mesh>
      {/* Travessa horizontal */}
      <mesh position={[0, 0, -recess * 0.1]}>
        <boxGeometry args={[width * 0.96, 0.028, 0.03]} />
        <MetalMat maps={metal} color={PALETTE.darkSteel} />
      </mesh>
      {/* Montante */}
      <mesh position={[0, 0, -recess * 0.1]}>
        <boxGeometry args={[0.028, height * 0.96, 0.03]} />
        <MetalMat maps={metal} color={PALETTE.darkSteel} />
      </mesh>
      {/* Vidro (4 painéis) */}
      {(
        [
          [-0.24, 0.22],
          [0.24, 0.22],
          [-0.24, -0.22],
          [0.24, -0.22],
        ] as const
      ).map(([gx, gy], i) => (
        <mesh key={i} position={[gx * width, gy * height, -recess * 0.35]}>
          <boxGeometry args={[width * 0.44, height * 0.4, 0.025]} />
          <meshPhysicalMaterial
            color="#6EC4E8"
            roughness={0.05}
            metalness={0.2}
            transparent
            opacity={0.85}
            reflectivity={1}
            clearcoat={1}
            clearcoatRoughness={0.06}
            envMapIntensity={2.8}
            emissive="#3A90B8"
            emissiveIntensity={0.15}
            side={DoubleSide}
          />
        </mesh>
      ))}
      {/* Interior escuro (profundidade) */}
      <mesh position={[0, 0, -recess - 0.02]}>
        <boxGeometry args={[width * 0.95, height * 0.95, 0.02]} />
        <meshStandardMaterial color="#1a2230" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

function FacadeWall({
  width,
  height,
  cols,
  rows,
  concrete,
  metal,
}: {
  width: number;
  height: number;
  cols: number;
  rows: number;
  concrete: Maps["concrete"];
  metal: Maps["metal"];
}) {
  const cells = useMemo(() => {
    const list: { x: number; y: number; w: number; h: number }[] = [];
    const padX = 0.1;
    const padY = 0.08;
    const gapX = 0.08;
    const gapY = 0.1;
    const usableW = width - padX * 2 - gapX * (cols - 1);
    const usableH = height - padY * 2 - gapY * (rows - 1);
    const w = usableW / cols;
    const h = usableH / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        list.push({
          x: -width / 2 + padX + w / 2 + c * (w + gapX),
          y: -height / 2 + padY + h / 2 + r * (h + gapY),
          w,
          h,
        });
      }
    }
    return list;
  }, [width, height, cols, rows]);

  return (
    <group>
      {/* Parede sólida */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, 0.1]} />
        <ConcreteMat maps={concrete} color="#C8CED6" />
      </mesh>
      {cells.map((cell, i) => (
        <group key={i} position={[cell.x, cell.y, 0.06]}>
          <RecessedWindow width={cell.w} height={cell.h} metal={metal} />
        </group>
      ))}
    </group>
  );
}

function SiteProps({ maps }: { maps: Maps }) {
  return (
    <group>
      <mesh position={[-2.65, 0.32, 1.65]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.62, 0.62]} />
        <MetalMat maps={maps.metal} color="#2F6F4E" />
      </mesh>
      <mesh position={[-2.65, 0.64, 1.65]} castShadow>
        <boxGeometry args={[1.22, 0.04, 0.64]} />
        <MetalMat maps={maps.metal} color={PALETTE.darkSteel} />
      </mesh>

      <group position={[-1.95, 0.22, -1.9]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2.5]}>
          <cylinderGeometry args={[0.24, 0.3, 0.48, 20]} />
          <MetalMat maps={maps.metal} color="#9AA3B0" />
        </mesh>
        <mesh position={[0.22, -0.14, 0.2]} castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.08, 14]} />
          <MetalMat maps={maps.metal} color={PALETTE.darkSteel} />
        </mesh>
        <mesh position={[0.22, -0.14, -0.2]} castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.08, 14]} />
          <MetalMat maps={maps.metal} color={PALETTE.darkSteel} />
        </mesh>
      </group>

      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[2.45, 0.08 + i * 0.09, 1.45 + i * 0.04]}
          castShadow
          rotation={[0, 0.12 * i, 0]}
        >
          <boxGeometry args={[0.8, 0.07, 0.32]} />
          {i % 2 ? <WoodMat maps={maps.wood} /> : <ConcreteMat maps={maps.concrete} color={PALETTE.warmConcrete} />}
        </mesh>
      ))}

      {[
        [2.2, -1.8],
        [2.5, -1.55],
        [-2.25, 2.15],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.2, 0]} castShadow>
            <coneGeometry args={[0.12, 0.38, 16]} />
            <meshStandardMaterial color={PALETTE.warning} roughness={0.45} metalness={0.15} envMapIntensity={0.6} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.14, 0.14, 0.03, 16]} />
            <MetalMat maps={maps.metal} color={PALETTE.darkSteel} />
          </mesh>
        </group>
      ))}

      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 1.2 - 0.25;
        const r = 3.55;
        return (
          <group key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]} rotation={[0, -a + Math.PI / 2, 0]}>
            <mesh position={[0, 0.4, 0]} castShadow>
              <boxGeometry args={[0.04, 0.8, 0.04]} />
              <MetalMat maps={maps.metal} />
            </mesh>
            <mesh position={[0.3, 0.6, 0]}>
              <boxGeometry args={[0.6, 0.03, 0.03]} />
              <meshStandardMaterial color={PALETTE.warning} roughness={0.5} metalness={0.25} />
            </mesh>
            <mesh position={[0.3, 0.28, 0]}>
              <boxGeometry args={[0.6, 0.03, 0.03]} />
              <meshStandardMaterial color={PALETTE.warning} roughness={0.5} metalness={0.25} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function TowerCrane({ metal }: { metal: Maps["metal"] }) {
  const hook = useRef<Group>(null);

  useFrame((state) => {
    if (!hook.current) return;
    hook.current.position.y = -0.12 + Math.sin(state.clock.elapsedTime * 0.85) * 0.14;
  });

  return (
    <group position={[WIDTH / 2 + 0.95, 0, -DEPTH / 2 - 0.42]}>
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.65, 0.2, 0.65]} />
        <MetalMat maps={metal} color={PALETTE.darkSteel} />
      </mesh>

      {[
        [-0.09, -0.09],
        [0.09, -0.09],
        [-0.09, 0.09],
        [0.09, 0.09],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 2.2, z]} castShadow>
          <boxGeometry args={[0.055, 4.2, 0.055]} />
          <MetalMat maps={metal} color="#D0D6DE" />
        </mesh>
      ))}

      {[0.65, 1.3, 1.95, 2.6, 3.25, 3.9, 4.3].map((y) => (
        <group key={y}>
          <mesh position={[0, y, 0]}>
            <boxGeometry args={[0.28, 0.035, 0.28]} />
            <MetalMat maps={metal} />
          </mesh>
          <mesh position={[0, y, 0]} rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[0.24, 0.02, 0.02]} />
            <MetalMat maps={metal} color="#B8C0CA" />
          </mesh>
        </group>
      ))}

      <mesh position={[1.45, 4.25, 0]} castShadow>
        <boxGeometry args={[2.95, 0.1, 0.12]} />
        <meshStandardMaterial
          color={PALETTE.mint}
          roughness={0.32}
          metalness={0.55}
          envMapIntensity={0.9}
        />
      </mesh>
      <mesh position={[1.45, 4.38, 0]}>
        <boxGeometry args={[2.95, 0.03, 0.03]} />
        <meshStandardMaterial color="#E8FFF0" roughness={0.35} metalness={0.5} />
      </mesh>
      <mesh position={[-0.65, 4.25, 0]} castShadow>
        <boxGeometry args={[1.05, 0.1, 0.12]} />
        <meshStandardMaterial color={PALETTE.mintDeep} roughness={0.38} metalness={0.5} />
      </mesh>
      <mesh position={[0.55, 4.65, 0]} rotation={[0, 0, -0.38]}>
        <cylinderGeometry args={[0.014, 0.014, 1.7, 8]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.7} metalness={0.4} />
      </mesh>

      <mesh position={[0.35, 3.95, 0.24]} castShadow>
        <boxGeometry args={[0.4, 0.32, 0.36]} />
        <MetalMat maps={metal} color={PALETTE.darkSteel} />
      </mesh>
      <mesh position={[0.35, 4.0, 0.43]}>
        <boxGeometry args={[0.3, 0.18, 0.02]} />
        <meshPhysicalMaterial
          color={PALETTE.glassTint}
          roughness={0.12}
          metalness={0.2}
          transparent
          opacity={0.7}
          clearcoat={0.9}
          envMapIntensity={1.4}
        />
      </mesh>

      <group position={[2.5, 3.5, 0]}>
        <mesh>
          <cylinderGeometry args={[0.014, 0.014, 1.6, 8]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.75} metalness={0.35} />
        </mesh>
        <group ref={hook} position={[0, -0.9, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.36, 0.26, 0.36]} />
            <meshStandardMaterial
              color={PALETTE.mint}
              roughness={0.35}
              metalness={0.42}
              emissive={PALETTE.mint}
              emissiveIntensity={0.08}
              envMapIntensity={0.8}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export function ObraStageScene({ progress, idleSpin = false }: ObraStageSceneProps) {
  const maps = useObraTextures();
  const root = useRef<Group>(null);
  const foundation = useRef<Mesh>(null);
  const crown = useRef<Group>(null);
  const crane = useRef<Group>(null);
  const scaffold = useRef<Group>(null);
  const floorGroups = useRef<(Group | null)[]>([]);
  const liberadoLights = useRef<(Mesh | null)[]>([]);
  const target = useRef(progress);
  const smooth = useRef(progress);

  target.current = MathUtils.clamp(progress, 0, 1);

  useFrame((_, delta) => {
    smooth.current = MathUtils.damp(smooth.current, target.current, 5, delta);
    const p = smooth.current;

    if (root.current && idleSpin) {
      root.current.rotation.y += delta * 0.065;
    }

    if (foundation.current) {
      const f = MathUtils.clamp(p / 0.16, 0, 1);
      foundation.current.scale.set(1, Math.max(f, 0.04), 1);
      foundation.current.position.y = 0.1 * f;
      foundation.current.visible = f > 0.02;
    }

    for (let i = 0; i < FLOORS; i++) {
      const g = floorGroups.current[i];
      if (!g) continue;
      const v = floorReveal(p, i);
      // Sobe do nível inferior sem esmagar a fachada (scale.y distorcia janelas).
      g.visible = v > 0.02;
      g.scale.set(1, 1, 1);
      g.position.y = 0.24 + i * FLOOR_H - (1 - v) * FLOOR_H * 0.85;

      const light = liberadoLights.current[i];
      if (light) {
        const liberado = p > 0.82 && i <= Math.floor((p - 0.82) / 0.05);
        light.visible = liberado;
        const mat = light.material as MeshStandardMaterial;
        if (mat?.emissiveIntensity !== undefined) {
          // Sutil — evita look neon/cyberpunk no hero cinematográfico
          mat.emissiveIntensity = liberado ? 0.22 : 0;
        }
      }
    }

    if (crown.current) {
      const c = MathUtils.clamp((p - 0.84) / 0.16, 0, 1);
      crown.current.visible = c > 0.02;
      crown.current.scale.set(1, 1, 1);
      crown.current.position.y = 0.24 + FLOORS * FLOOR_H + 0.06 - (1 - c) * 0.35;
    }

    if (crane.current) {
      const c = MathUtils.clamp((p - 0.22) / 0.4, 0, 1);
      crane.current.visible = c > 0.02;
      crane.current.scale.setScalar(Math.max(c, 0.04));
      crane.current.rotation.y = Math.sin(p * 5.5) * 0.1 + p * 0.35;
    }

    if (scaffold.current) {
      const s =
        MathUtils.clamp((p - 0.22) / 0.35, 0, 1) *
        (1 - MathUtils.clamp((p - 0.82) / 0.12, 0, 1));
      scaffold.current.visible = s > 0.05;
      scaffold.current.scale.set(1, Math.max(s, 0.05), 1);
    }
  });

  const pillars = useMemo(
    () => [
      [-WIDTH / 2 + 0.2, -DEPTH / 2 + 0.2],
      [WIDTH / 2 - 0.2, -DEPTH / 2 + 0.2],
      [-WIDTH / 2 + 0.2, DEPTH / 2 - 0.2],
      [WIDTH / 2 - 0.2, DEPTH / 2 - 0.2],
      [0, -DEPTH / 2 + 0.2],
      [0, DEPTH / 2 - 0.2],
    ],
    [],
  );

  return (
    <group ref={root} rotation={[0.14, -0.55, 0]}>
      <group position={[0, -1.15, 0]}>
        {/* Solo */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[5, 80]} />
          <meshStandardMaterial
            map={maps.dirt.map}
            normalMap={maps.dirt.normalMap}
            roughnessMap={maps.dirt.roughnessMap}
            color={PALETTE.dirt}
            roughness={0.95}
            metalness={0.02}
            normalScale={DIRT_NORMAL}
            envMapIntensity={0.25}
          />
        </mesh>
        {/* Placa de concreto do canteiro */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
          <ringGeometry args={[2.2, 3.7, 80]} />
          <meshStandardMaterial
            map={maps.concrete.map}
            normalMap={maps.concrete.normalMap}
            roughnessMap={maps.concrete.roughnessMap}
            color={PALETTE.asphalt}
            roughness={0.9}
            metalness={0.08}
            envMapIntensity={0.35}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
          <circleGeometry args={[2.15, 56]} />
          <ConcreteMat maps={maps.concrete} color="#B4BBC4" />
        </mesh>

        <SiteProps maps={maps} />

        <mesh ref={foundation} castShadow receiveShadow>
          <boxGeometry args={[WIDTH + 0.8, 0.24, DEPTH + 0.8]} />
          <ConcreteMat maps={maps.concrete} />
        </mesh>
        <mesh position={[0, 0.16, 0]} castShadow>
          <boxGeometry args={[WIDTH + 0.35, 0.12, DEPTH + 0.35]} />
          <ConcreteMat maps={maps.concrete} color={PALETTE.warmConcrete} />
        </mesh>

        {pillars.slice(0, 4).map(([px, pz], i) => (
          <mesh key={`rebar-${i}`} position={[px, 0.32, pz]} castShadow>
            <cylinderGeometry args={[0.022, 0.022, 0.4, 8]} />
            <MetalMat maps={maps.metal} color="#6B4E3D" />
          </mesh>
        ))}

        {Array.from({ length: FLOORS }, (_, i) => (
          <group
            key={i}
            ref={(el) => {
              floorGroups.current[i] = el;
            }}
          >
            {/* Laje */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[WIDTH, 0.14, DEPTH]} />
              <ConcreteMat maps={maps.concrete} />
            </mesh>
            {/* Borda da laje */}
            <mesh position={[0, 0.01, DEPTH / 2]} castShadow>
              <boxGeometry args={[WIDTH + 0.04, 0.16, 0.06]} />
              <ConcreteMat maps={maps.concrete} color="#BEC4CC" />
            </mesh>

            {/* Vigas metálicas */}
            <mesh position={[0, -0.12, 0]} castShadow>
              <boxGeometry args={[WIDTH - 0.1, 0.1, 0.14]} />
              <MetalMat maps={maps.metal} />
            </mesh>
            <mesh position={[0, -0.12, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
              <boxGeometry args={[DEPTH - 0.1, 0.1, 0.14]} />
              <MetalMat maps={maps.metal} />
            </mesh>

            {pillars.map(([px, pz], pi) => (
              <mesh key={pi} position={[px, -FLOOR_H / 2 + 0.06, pz]} castShadow>
                <boxGeometry args={[0.16, FLOOR_H - 0.06, 0.16]} />
                <ConcreteMat maps={maps.concrete} color="#B8C0C8" />
              </mesh>
            ))}

            {/* Fachadas com janelas embutidas */}
            <group position={[0, -FLOOR_H * 0.28, DEPTH / 2 + 0.05]}>
              <FacadeWall
                width={WIDTH * 0.92}
                height={FLOOR_H * 0.55}
                cols={4}
                rows={2}
                concrete={maps.concrete}
                metal={maps.metal}
              />
            </group>
            <group position={[WIDTH / 2 + 0.05, -FLOOR_H * 0.28, 0]} rotation={[0, Math.PI / 2, 0]}>
              <FacadeWall
                width={DEPTH * 0.84}
                height={FLOOR_H * 0.55}
                cols={3}
                rows={2}
                concrete={maps.concrete}
                metal={maps.metal}
              />
            </group>

            {i >= FLOORS - 2 ? (
              <mesh position={[-WIDTH / 2 - 0.1, -FLOOR_H * 0.2, 0]} castShadow>
                <boxGeometry args={[0.05, FLOOR_H * 0.72, DEPTH * 0.88]} />
                <WoodMat maps={maps.wood} />
              </mesh>
            ) : null}

            <mesh
              ref={(el) => {
                liberadoLights.current[i] = el;
              }}
              position={[0, 0.08, 0]}
              visible={false}
            >
              <boxGeometry args={[WIDTH * 0.96, 0.02, DEPTH * 0.96]} />
              <meshStandardMaterial
                color={PALETTE.mint}
                emissive={PALETTE.mint}
                emissiveIntensity={0}
                roughness={0.3}
                metalness={0.25}
                transparent
                opacity={0.88}
              />
            </mesh>
          </group>
        ))}

        <group ref={scaffold} position={[-WIDTH / 2 - 0.4, 0, 0]}>
          {Array.from({ length: 5 }, (_, i) => (
            <group key={i} position={[0, 0.34 + i * 0.7, 0]}>
              <mesh castShadow position={[-0.05, 0, DEPTH * 0.35]}>
                <boxGeometry args={[0.05, 0.7, 0.05]} />
                <meshStandardMaterial color={PALETTE.warning} roughness={0.48} metalness={0.4} />
              </mesh>
              <mesh castShadow position={[-0.05, 0, -DEPTH * 0.35]}>
                <boxGeometry args={[0.05, 0.7, 0.05]} />
                <meshStandardMaterial color={PALETTE.warning} roughness={0.48} metalness={0.4} />
              </mesh>
              <mesh position={[0.24, 0.3, 0]} castShadow>
                <boxGeometry args={[0.58, 0.045, DEPTH * 0.88]} />
                <WoodMat maps={maps.wood} />
              </mesh>
              <mesh position={[0.24, 0.52, 0]}>
                <boxGeometry args={[0.52, 0.02, 0.02]} />
                <MetalMat maps={maps.metal} />
              </mesh>
            </group>
          ))}
        </group>

        <group ref={crown}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[WIDTH + 0.24, 0.16, DEPTH + 0.24]} />
            <ConcreteMat maps={maps.concrete} color="#D0D6DE" />
          </mesh>
          <mesh position={[0.4, 0.24, -0.18]} castShadow>
            <boxGeometry args={[0.75, 0.35, 0.58]} />
            <ConcreteMat maps={maps.concrete} color="#B8C0CA" />
          </mesh>
          <mesh position={[-0.55, 0.16, 0.35]}>
            <boxGeometry args={[0.58, 0.12, 0.42]} />
            <meshStandardMaterial
              color={PALETTE.mint}
              emissive={PALETTE.mint}
              emissiveIntensity={0.12}
              roughness={0.32}
              metalness={0.3}
            />
          </mesh>
        </group>

        <group ref={crane}>
          <TowerCrane metal={maps.metal} />
        </group>
      </group>
    </group>
  );
}
