"use client";

import { useTexture } from "@react-three/drei";
import { useLayoutEffect } from "react";
import {
  Color,
  LinearSRGBColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from "three";

export type ObraTextures = {
  concrete: { map: Texture; normalMap: Texture; roughnessMap: Texture };
  dirt: { map: Texture; normalMap: Texture; roughnessMap: Texture };
  metal: { map: Texture; normalMap: Texture; roughnessMap: Texture };
  wood: { map: Texture; normalMap: Texture; roughnessMap: Texture };
};

function configure(
  tex: Texture,
  repeat: [number, number],
  colorSpace: typeof SRGBColorSpace | typeof LinearSRGBColorSpace,
) {
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.colorSpace = colorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
}

/** Texturas PBR CC0 (Poly Haven) — carregadas via Suspense. */
export function useObraTextures(): ObraTextures {
  const [
    concreteMap,
    concreteNor,
    concreteRough,
    dirtMap,
    dirtNor,
    dirtRough,
    metalMap,
    metalNor,
    metalRough,
    woodMap,
    woodNor,
    woodRough,
  ] = useTexture([
    "/3d/textures/concrete_diff.jpg",
    "/3d/textures/concrete_nor.jpg",
    "/3d/textures/concrete_rough.jpg",
    "/3d/textures/dirt_diff.jpg",
    "/3d/textures/dirt_nor.jpg",
    "/3d/textures/dirt_rough.jpg",
    "/3d/textures/metal_diff.jpg",
    "/3d/textures/metal_nor.jpg",
    "/3d/textures/metal_rough.jpg",
    "/3d/textures/wood_diff.jpg",
    "/3d/textures/wood_nor.jpg",
    "/3d/textures/wood_rough.jpg",
  ]);

  useLayoutEffect(() => {
    configure(concreteMap, [2.2, 2.2], SRGBColorSpace);
    configure(concreteNor, [2.2, 2.2], LinearSRGBColorSpace);
    configure(concreteRough, [2.2, 2.2], LinearSRGBColorSpace);
    configure(dirtMap, [3.5, 3.5], SRGBColorSpace);
    configure(dirtNor, [3.5, 3.5], LinearSRGBColorSpace);
    configure(dirtRough, [3.5, 3.5], LinearSRGBColorSpace);
    configure(metalMap, [1.6, 1.6], SRGBColorSpace);
    configure(metalNor, [1.6, 1.6], LinearSRGBColorSpace);
    configure(metalRough, [1.6, 1.6], LinearSRGBColorSpace);
    configure(woodMap, [1.4, 2.2], SRGBColorSpace);
    configure(woodNor, [1.4, 2.2], LinearSRGBColorSpace);
    configure(woodRough, [1.4, 2.2], LinearSRGBColorSpace);
  }, [
    concreteMap,
    concreteNor,
    concreteRough,
    dirtMap,
    dirtNor,
    dirtRough,
    metalMap,
    metalNor,
    metalRough,
    woodMap,
    woodNor,
    woodRough,
  ]);

  return {
    concrete: { map: concreteMap, normalMap: concreteNor, roughnessMap: concreteRough },
    dirt: { map: dirtMap, normalMap: dirtNor, roughnessMap: dirtRough },
    metal: { map: metalMap, normalMap: metalNor, roughnessMap: metalRough },
    wood: { map: woodMap, normalMap: woodNor, roughnessMap: woodRough },
  };
}

export const PALETTE = {
  navy: new Color("#0C1A3D"),
  concrete: new Color("#B8BFC8"),
  warmConcrete: new Color("#C8BAA8"),
  steel: new Color("#9AA3B0"),
  darkSteel: new Color("#3E4654"),
  glass: new Color("#7EC8E8"),
  glassTint: new Color("#4FA0C8"),
  mint: new Color("#4ADE80"),
  mintDeep: new Color("#16A34A"),
  dirt: new Color("#8A8478"),
  wood: new Color("#B8895C"),
  warning: new Color("#F0C45A"),
  asphalt: new Color("#5A6068"),
} as const;
