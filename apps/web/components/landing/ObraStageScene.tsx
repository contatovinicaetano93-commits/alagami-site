"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import { DoubleSide, MathUtils } from "three";
import {
  makeConcreteMap,
  makeConcreteRoughnessMap,
  makeDirtMap,
  makeMetalMap,
  makeWoodMap,
  PALETTE,
} from "./obraMaterials";

export type ObraStageSceneProps = {
  /** 0 = terreno, 1 = obra concluída */
  progress: number;
  /** Rotação ambiente suave (hero). Desligar no scrub. */
  idleSpin?: boolean;
};

const FLOORS = 6;
const WIDTH = 2.65;
const DEPTH = 2.05;
const FLOOR_H = 0.52;

function floorReveal(progress: number, floorIndex: number): number {
  const start = 0.16 + (floorIndex / FLOORS) * 0.58;
  const end = start + 0.12;
  return MathUtils.clamp((progress - start) / (end - start), 0, 1);
}

function GlassPane({
  width,
  height,
  depth = 0.03,
}: {
  width: number;
  height: number;
  depth?: number;
}) {
  return (
    <mesh castShadow>
      <boxGeometry args={[width, height, depth]} />
      <meshPhysicalMaterial
        color={PALETTE.glass}
        roughness={0.06}
        metalness={0.05}
        transmission={0.72}
        thickness={0.4}
        ior={1.5}
        transparent
        opacity={1}
        reflectivity={0.9}
        clearcoat={1}
        clearcoatRoughness={0.08}
        envMapIntensity={1.4}
        side={DoubleSide}
      />
    </mesh>
  );
}

function WindowBay({
  width,
  height,
  cols,
  rows,
}: {
  width: number;
  height: number;
  cols: number;
  rows: number;
}) {
  const cells = useMemo(() => {
    const list: { x: number; y: number; w: number; h: number }[] = [];
    const mullion = 0.045;
    const paneW = (width - mullion * (cols + 1)) / cols;
    const paneH = (height - mullion * (rows + 1)) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        list.push({
          x: -width / 2 + mullion + paneW / 2 + c * (paneW + mullion),
          y: -height / 2 + mullion + paneH / 2 + r * (paneH + mullion),
          w: paneW,
          h: paneH,
        });
      }
    }
    return list;
  }, [width, height, cols, rows]);

  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0, -0.02]}>
        <boxGeometry args={[width + 0.04, height + 0.04, 0.05]} />
        <meshStandardMaterial color={PALETTE.darkSteel} roughness={0.45} metalness={0.7} />
      </mesh>
      {cells.map((cell, i) => (
        <group key={i} position={[cell.x, cell.y, 0.01]}>
          <GlassPane width={cell.w} height={cell.h} />
        </group>
      ))}
    </group>
  );
}

function SiteProps({
  concrete,
  concreteRough,
  metal,
  wood,
}: {
  concrete: ReturnType<typeof makeConcreteMap>;
  concreteRough: ReturnType<typeof makeConcreteRoughnessMap>;
  metal: ReturnType<typeof makeMetalMap>;
  wood: ReturnType<typeof makeWoodMap>;
}) {
  return (
    <group>
      {/* Contêiner */}
      <mesh position={[-2.6, 0.3, 1.6]} castShadow receiveShadow>
        <boxGeometry args={[1.15, 0.58, 0.58]} />
        <meshStandardMaterial map={metal} color="#2A6B4A" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[-2.6, 0.6, 1.6]}>
        <boxGeometry args={[1.17, 0.04, 0.6]} />
        <meshStandardMaterial color={PALETTE.darkSteel} roughness={0.45} metalness={0.75} />
      </mesh>
      <mesh position={[-2.05, 0.3, 1.6]}>
        <boxGeometry args={[0.02, 0.42, 0.42]} />
        <meshStandardMaterial color="#1a3d2a" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Betoneira (simplificada) */}
      <group position={[-1.9, 0.2, -1.85]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2.6]}>
          <cylinderGeometry args={[0.22, 0.28, 0.45, 16]} />
          <meshStandardMaterial color={PALETTE.steel} map={metal} roughness={0.4} metalness={0.65} />
        </mesh>
        <mesh position={[0.2, -0.12, 0.18]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 12]} />
          <meshStandardMaterial color={PALETTE.darkSteel} roughness={0.5} metalness={0.6} />
        </mesh>
        <mesh position={[0.2, -0.12, -0.18]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 12]} />
          <meshStandardMaterial color={PALETTE.darkSteel} roughness={0.5} metalness={0.6} />
        </mesh>
      </group>

      {/* Paletes de madeira */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[2.4, 0.07 + i * 0.08, 1.4 + i * 0.05]}
          castShadow
          rotation={[0, 0.15 * i, 0]}
        >
          <boxGeometry args={[0.75, 0.06, 0.28]} />
          <meshStandardMaterial
            map={i % 2 ? wood : concrete}
            roughnessMap={i % 2 ? undefined : concreteRough}
            color={i % 2 ? PALETTE.wood : PALETTE.warmConcrete}
            roughness={0.9}
            metalness={0.04}
          />
        </mesh>
      ))}

      {/* Cones */}
      {[
        [2.15, -1.75],
        [2.45, -1.55],
        [-2.2, 2.1],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.18, 0]} castShadow>
            <coneGeometry args={[0.11, 0.34, 14]} />
            <meshStandardMaterial color={PALETTE.warning} roughness={0.5} metalness={0.12} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 0.03, 14]} />
            <meshStandardMaterial color={PALETTE.darkSteel} roughness={0.7} metalness={0.35} />
          </mesh>
        </group>
      ))}

      {/* Cerca */}
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 1.2 - 0.25;
        const r = 3.5;
        return (
          <group key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]} rotation={[0, -a + Math.PI / 2, 0]}>
            <mesh position={[0, 0.38, 0]} castShadow>
              <boxGeometry args={[0.035, 0.76, 0.035]} />
              <meshStandardMaterial color={PALETTE.steel} map={metal} roughness={0.45} metalness={0.65} />
            </mesh>
            <mesh position={[0.3, 0.58, 0]}>
              <boxGeometry args={[0.58, 0.03, 0.03]} />
              <meshStandardMaterial color={PALETTE.warning} roughness={0.55} metalness={0.2} />
            </mesh>
            <mesh position={[0.3, 0.28, 0]}>
              <boxGeometry args={[0.58, 0.03, 0.03]} />
              <meshStandardMaterial color={PALETTE.warning} roughness={0.55} metalness={0.2} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function TowerCrane({ metal }: { metal: ReturnType<typeof makeMetalMap> }) {
  const hook = useRef<Group>(null);

  useFrame((state) => {
    if (!hook.current) return;
    hook.current.position.y = -0.15 + Math.sin(state.clock.elapsedTime * 0.9) * 0.12;
  });

  return (
    <group position={[WIDTH / 2 + 0.9, 0, -DEPTH / 2 - 0.4]}>
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.16, 0.6]} />
        <meshStandardMaterial color={PALETTE.darkSteel} map={metal} roughness={0.45} metalness={0.72} />
      </mesh>

      {/* Mastros treliçados */}
      {[
        [-0.08, -0.08],
        [0.08, -0.08],
        [-0.08, 0.08],
        [0.08, 0.08],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 2.15, z]} castShadow>
          <boxGeometry args={[0.05, 4.1, 0.05]} />
          <meshStandardMaterial color="#C8D0DA" map={metal} roughness={0.32} metalness={0.8} />
        </mesh>
      ))}
      {[0.7, 1.4, 2.1, 2.8, 3.5, 4.1].map((y) => (
        <group key={y}>
          <mesh position={[0, y, 0]}>
            <boxGeometry args={[0.26, 0.03, 0.26]} />
            <meshStandardMaterial color={PALETTE.steel} roughness={0.38} metalness={0.75} />
          </mesh>
          <mesh position={[0, y, 0]} rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[0.22, 0.02, 0.02]} />
            <meshStandardMaterial color={PALETTE.steel} roughness={0.4} metalness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Lança */}
      <mesh position={[1.4, 4.15, 0]} castShadow>
        <boxGeometry args={[2.85, 0.09, 0.11]} />
        <meshStandardMaterial color={PALETTE.mint} roughness={0.32} metalness={0.55} />
      </mesh>
      <mesh position={[1.4, 4.28, 0]}>
        <boxGeometry args={[2.85, 0.03, 0.03]} />
        <meshStandardMaterial color="#D7FFE8" roughness={0.35} metalness={0.5} />
      </mesh>
      <mesh position={[-0.6, 4.15, 0]} castShadow>
        <boxGeometry args={[1.0, 0.09, 0.11]} />
        <meshStandardMaterial color={PALETTE.mintDeep} roughness={0.38} metalness={0.5} />
      </mesh>
      {/* Tirante */}
      <mesh position={[0.55, 4.55, 0]} rotation={[0, 0, -0.35]}>
        <cylinderGeometry args={[0.012, 0.012, 1.6, 8]} />
        <meshStandardMaterial color="#333" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* Cabine */}
      <mesh position={[0.32, 3.85, 0.22]} castShadow>
        <boxGeometry args={[0.38, 0.3, 0.34]} />
        <meshStandardMaterial color={PALETTE.darkSteel} roughness={0.38} metalness={0.62} />
      </mesh>
      <mesh position={[0.32, 3.9, 0.4]}>
        <boxGeometry args={[0.28, 0.16, 0.02]} />
        <meshPhysicalMaterial
          color={PALETTE.glassTint}
          roughness={0.1}
          metalness={0.1}
          transmission={0.5}
          thickness={0.2}
          transparent
        />
      </mesh>

      {/* Gancho animado */}
      <group position={[2.45, 3.4, 0]}>
        <mesh>
          <cylinderGeometry args={[0.012, 0.012, 1.55, 8]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.75} metalness={0.35} />
        </mesh>
        <group ref={hook} position={[0, -0.85, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.34, 0.24, 0.34]} />
            <meshStandardMaterial
              color={PALETTE.mint}
              roughness={0.38}
              metalness={0.4}
              emissive={PALETTE.mint}
              emissiveIntensity={0.15}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export function ObraStageScene({ progress, idleSpin = false }: ObraStageSceneProps) {
  const root = useRef<Group>(null);
  const foundation = useRef<Mesh>(null);
  const crown = useRef<Group>(null);
  const crane = useRef<Group>(null);
  const scaffold = useRef<Group>(null);
  const floorGroups = useRef<(Group | null)[]>([]);
  const liberadoLights = useRef<(Mesh | null)[]>([]);
  const target = useRef(progress);
  const smooth = useRef(progress);

  const maps = useMemo(
    () => ({
      concrete: makeConcreteMap(),
      concreteRough: makeConcreteRoughnessMap(),
      dirt: makeDirtMap(),
      metal: makeMetalMap(),
      wood: makeWoodMap(),
    }),
    [],
  );

  target.current = MathUtils.clamp(progress, 0, 1);

  useFrame((_, delta) => {
    smooth.current = MathUtils.damp(smooth.current, target.current, 5, delta);
    const p = smooth.current;

    if (root.current && idleSpin) {
      root.current.rotation.y += delta * 0.07;
    }

    if (foundation.current) {
      const f = MathUtils.clamp(p / 0.16, 0, 1);
      foundation.current.scale.set(1, Math.max(f, 0.04), 1);
      foundation.current.position.y = 0.08 * f;
      foundation.current.visible = f > 0.02;
    }

    for (let i = 0; i < FLOORS; i++) {
      const g = floorGroups.current[i];
      if (!g) continue;
      const v = floorReveal(p, i);
      g.visible = v > 0.02;
      g.scale.y = Math.max(v, 0.05);
      g.position.y = 0.22 + i * FLOOR_H;

      const light = liberadoLights.current[i];
      if (light) {
        const liberado = p > 0.7 && i <= Math.floor((p - 0.7) / 0.06);
        light.visible = liberado;
        const mat = light.material as MeshStandardMaterial;
        if (mat?.emissiveIntensity !== undefined) {
          mat.emissiveIntensity = liberado ? 0.65 : 0;
        }
      }
    }

    if (crown.current) {
      const c = MathUtils.clamp((p - 0.84) / 0.16, 0, 1);
      crown.current.visible = c > 0.02;
      crown.current.scale.y = Math.max(c, 0.04);
    }

    if (crane.current) {
      const c = MathUtils.clamp((p - 0.28) / 0.45, 0, 1);
      const leave = 1 - MathUtils.clamp((p - 0.92) / 0.08, 0, 1);
      const s = c * leave;
      crane.current.visible = s > 0.02;
      crane.current.scale.setScalar(Math.max(s, 0.04));
      crane.current.rotation.y = Math.sin(p * 5.5) * 0.1 + p * 0.35;
    }

    if (scaffold.current) {
      const s =
        MathUtils.clamp((p - 0.22) / 0.35, 0, 1) *
        (1 - MathUtils.clamp((p - 0.78) / 0.15, 0, 1));
      scaffold.current.visible = s > 0.05;
      scaffold.current.scale.set(1, Math.max(s, 0.05), 1);
    }
  });

  const pillars = useMemo(
    () => [
      [-WIDTH / 2 + 0.18, -DEPTH / 2 + 0.18],
      [WIDTH / 2 - 0.18, -DEPTH / 2 + 0.18],
      [-WIDTH / 2 + 0.18, DEPTH / 2 - 0.18],
      [WIDTH / 2 - 0.18, DEPTH / 2 - 0.18],
      [0, -DEPTH / 2 + 0.18],
      [0, DEPTH / 2 - 0.18],
    ],
    [],
  );

  return (
    <group ref={root} rotation={[0.14, -0.58, 0]}>
      <group position={[0, -1.15, 0]}>
        {/* Terreno */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[4.8, 72]} />
          <meshStandardMaterial map={maps.dirt} color={PALETTE.dirt} roughness={0.97} metalness={0.02} />
        </mesh>
        {/* Anel de asfalto / placa */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
          <ringGeometry args={[2.15, 3.65, 72]} />
          <meshStandardMaterial
            map={maps.concrete}
            roughnessMap={maps.concreteRough}
            color={PALETTE.asphalt}
            roughness={0.92}
            metalness={0.08}
          />
        </mesh>
        {/* Placa central da fundação */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]} receiveShadow>
          <circleGeometry args={[2.1, 48]} />
          <meshStandardMaterial
            map={maps.concrete}
            roughnessMap={maps.concreteRough}
            color="#9AA1AA"
            roughness={0.9}
            metalness={0.06}
          />
        </mesh>

        <SiteProps
          concrete={maps.concrete}
          concreteRough={maps.concreteRough}
          metal={maps.metal}
          wood={maps.wood}
        />

        {/* Fundação */}
        <mesh ref={foundation} castShadow receiveShadow>
          <boxGeometry args={[WIDTH + 0.75, 0.22, DEPTH + 0.75]} />
          <meshStandardMaterial
            map={maps.concrete}
            roughnessMap={maps.concreteRough}
            color={PALETTE.concrete}
            roughness={0.9}
            metalness={0.06}
          />
        </mesh>
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[WIDTH + 0.3, 0.1, DEPTH + 0.3]} />
          <meshStandardMaterial
            map={maps.concrete}
            roughnessMap={maps.concreteRough}
            color={PALETTE.warmConcrete}
            roughness={0.88}
            metalness={0.05}
          />
        </mesh>

        {/* Ferragem emergente na fundação */}
        {pillars.slice(0, 4).map(([px, pz], i) => (
          <mesh key={`rebar-${i}`} position={[px, 0.28, pz]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.35, 8]} />
            <meshStandardMaterial color="#6B4E3D" roughness={0.65} metalness={0.55} />
          </mesh>
        ))}

        {/* Andares */}
        {Array.from({ length: FLOORS }, (_, i) => (
          <group
            key={i}
            ref={(el) => {
              floorGroups.current[i] = el;
            }}
          >
            {/* Laje */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[WIDTH, 0.12, DEPTH]} />
              <meshStandardMaterial
                map={maps.concrete}
                roughnessMap={maps.concreteRough}
                color={PALETTE.concrete}
                roughness={0.86}
                metalness={0.08}
              />
            </mesh>
            {/* Peitoril / platibanda */}
            <mesh position={[0, 0.08, DEPTH / 2 - 0.04]} castShadow>
              <boxGeometry args={[WIDTH, 0.1, 0.08]} />
              <meshStandardMaterial color="#D0D5DC" roughness={0.7} metalness={0.12} />
            </mesh>
            <mesh position={[WIDTH / 2 - 0.04, 0.08, 0]} castShadow>
              <boxGeometry args={[0.08, 0.1, DEPTH]} />
              <meshStandardMaterial color="#D0D5DC" roughness={0.7} metalness={0.12} />
            </mesh>

            {/* Vigas */}
            <mesh position={[0, -0.11, 0]} castShadow>
              <boxGeometry args={[WIDTH - 0.08, 0.09, 0.13]} />
              <meshStandardMaterial color={PALETTE.steel} map={maps.metal} roughness={0.42} metalness={0.68} />
            </mesh>
            <mesh position={[0, -0.11, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
              <boxGeometry args={[DEPTH - 0.08, 0.09, 0.13]} />
              <meshStandardMaterial color={PALETTE.steel} map={maps.metal} roughness={0.42} metalness={0.68} />
            </mesh>

            {/* Pilares */}
            {pillars.map(([px, pz], pi) => (
              <mesh key={pi} position={[px, -FLOOR_H / 2 + 0.05, pz]} castShadow>
                <boxGeometry args={[0.15, FLOOR_H - 0.08, 0.15]} />
                <meshStandardMaterial
                  map={maps.concrete}
                  roughnessMap={maps.concreteRough}
                  color="#A6ADB6"
                  roughness={0.84}
                  metalness={0.1}
                />
              </mesh>
            ))}

            {/* Fachadas envidraçadas */}
            <group position={[0, -FLOOR_H * 0.28, DEPTH / 2 + 0.01]}>
              <WindowBay width={WIDTH * 0.9} height={FLOOR_H * 0.58} cols={4} rows={2} />
            </group>
            <group position={[WIDTH / 2 + 0.01, -FLOOR_H * 0.28, 0]} rotation={[0, Math.PI / 2, 0]}>
              <WindowBay width={DEPTH * 0.82} height={FLOOR_H * 0.58} cols={3} rows={2} />
            </group>

            {/* Forma de madeira nos andares em construção (últimos 2) */}
            {i >= FLOORS - 2 ? (
              <mesh position={[-WIDTH / 2 - 0.08, -FLOOR_H * 0.2, 0]} castShadow>
                <boxGeometry args={[0.04, FLOOR_H * 0.7, DEPTH * 0.85]} />
                <meshStandardMaterial map={maps.wood} color={PALETTE.wood} roughness={0.88} metalness={0.04} />
              </mesh>
            ) : null}

            {/* Faixa de liberação */}
            <mesh
              ref={(el) => {
                liberadoLights.current[i] = el;
              }}
              position={[0, 0.075, 0]}
              visible={false}
            >
              <boxGeometry args={[WIDTH * 0.96, 0.018, DEPTH * 0.96]} />
              <meshStandardMaterial
                color={PALETTE.mint}
                emissive={PALETTE.mint}
                emissiveIntensity={0}
                roughness={0.32}
                metalness={0.22}
                transparent
                opacity={0.88}
              />
            </mesh>
          </group>
        ))}

        {/* Andaime */}
        <group ref={scaffold} position={[-WIDTH / 2 - 0.38, 0, 0]}>
          {Array.from({ length: 5 }, (_, i) => (
            <group key={i} position={[0, 0.32 + i * 0.68, 0]}>
              <mesh castShadow position={[-0.05, 0, DEPTH * 0.35]}>
                <boxGeometry args={[0.05, 0.68, 0.05]} />
                <meshStandardMaterial color={PALETTE.warning} roughness={0.5} metalness={0.4} />
              </mesh>
              <mesh castShadow position={[-0.05, 0, -DEPTH * 0.35]}>
                <boxGeometry args={[0.05, 0.68, 0.05]} />
                <meshStandardMaterial color={PALETTE.warning} roughness={0.5} metalness={0.4} />
              </mesh>
              <mesh position={[0.22, 0.28, 0]} castShadow>
                <boxGeometry args={[0.55, 0.04, DEPTH * 0.85]} />
                <meshStandardMaterial map={maps.wood} color={PALETTE.wood} roughness={0.85} metalness={0.04} />
              </mesh>
              <mesh position={[0.22, 0.5, 0]}>
                <boxGeometry args={[0.5, 0.02, 0.02]} />
                <meshStandardMaterial color={PALETTE.steel} roughness={0.45} metalness={0.6} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Cobertura */}
        <group ref={crown} position={[0, 0.22 + FLOORS * FLOOR_H + 0.05, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[WIDTH + 0.22, 0.14, DEPTH + 0.22]} />
            <meshStandardMaterial
              map={maps.concrete}
              roughnessMap={maps.concreteRough}
              color="#D5DAE2"
              roughness={0.68}
              metalness={0.14}
            />
          </mesh>
          {/* Casa de máquinas */}
          <mesh position={[0.35, 0.22, -0.15]} castShadow>
            <boxGeometry args={[0.7, 0.32, 0.55]} />
            <meshStandardMaterial color="#C5CCD6" roughness={0.55} metalness={0.25} />
          </mesh>
          {/* Sinal de liberação */}
          <mesh position={[-0.55, 0.14, 0.35]}>
            <boxGeometry args={[0.55, 0.1, 0.4]} />
            <meshStandardMaterial
              color={PALETTE.mint}
              emissive={PALETTE.mint}
              emissiveIntensity={0.28}
              roughness={0.35}
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
