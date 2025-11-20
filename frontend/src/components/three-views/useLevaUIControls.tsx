import { useControls, folder } from "leva";

export function useLevaUIControls() {
  return useControls({
    // ---------------- Lights ----------------
    Lights: folder(
      {
        // Ambient
        ambientVisible: { value: true },
        ambientIntensity: { value: 0.7, min: 0, max: 1, step: 0.1 },

        // Directional Front
        dirFrontVisible: { value: true },
        dirFrontPos: { x: 3.3, y: 1.0, z: 4.4 },
        dirFrontIntensity: { value: 0.5, min: 0, max: 1, step: 0.1 },
        dirFrontShadow: { value: true },

        // Directional Back
        dirBackVisible: { value: true },
        dirBackPos: { x: -3.3, y: -1.0, z: -4.4 },
        dirBackIntensity: { value: 0.5, min: 0, max: 1, step: 0.1 },
        dirBackShadow: { value: true },

        // Directional Left
        dirLeftVisible: { value: true },
        dirLeftPos: { x: -5.0, y: 5.0, z: 5.0 },
        dirLeftIntensity: { value: 0.5, min: 0, max: 1, step: 0.1 },
        dirLeftShadow: { value: true },

        // Directional Right
        dirRightVisible: { value: true },
        dirRightPos: { x: 5.0, y: 5.0, z: 5.0 },
        dirRightIntensity: { value: 0.5, min: 0, max: 1, step: 0.1 },
        dirRightShadow: { value: true },
      },
      { collapsed: true }
    ),

    // ---------------- Genes ----------------
    Genes: folder(
      {
        geneColor: "#ffffff",
        geneEmissive: "#000000",
        geneSpecular: "#000000",
        geneShininess: { value: 0, min: 0, max: 200, step: 1 },
        geneRadius: { value: 0.05, min: 0.01, max: 0.1, step: 0.01 }, // ← radius slider
      },
      { collapsed: true }
    ),

    // ---------------- Tubes ----------------
    Tubes: folder(
      {
        tubeColor: "#FFFFFF",
        tubeEmissive: "#E6D8B8",
        tubeSpecular: "#ffffff",
        tubeShininess: { value: 5, min: 0, max: 200, step: 1 },
        tubeRadius: { value: 0.002, min: 0.001, max: 0.09, step: 0.001 }, // ← radius slider
      },
      { collapsed: true }
    ),
  });
}
