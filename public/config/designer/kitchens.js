/**
 * Kitchens available in the designer.
 *
 * Each kitchen is a photo plus editable areas. An area is defined either by
 *   polygons: [[x,y], ...] in the photo's pixel coordinates (quick, hand-traced), or
 *   mask:     URL of a grayscale PNG the same size as the photo (white = area), for precise
 *             segmentation made in Photoshop / an AI segmentation tool.
 * Each polygon is normalized for lighting on its own, so a two-tone area keeps correct shading.
 * lightBlur:  radius (px) separating lighting from surface pattern. Larger for areas whose
 *             photo pattern is the material itself (marble), so the old pattern does not show through.
 * detailKeep: 0..1, how much fine photo detail survives a material change (1 = all, for door grooves).
 *
 * To add a real KOVO project: add an entry with its photo, width/height and areas.
 * Only the areas a photo has are offered in the designer (this photo has handle-less fronts, so no "handles").
 * The first kitchen is the one the designer shows.
 */
export const KITCHENS = [
  {
    id: "walnut-island",
    title: "מטבח אגוז עם אי",
    image: "assets/designer/kitchen-walnut-island.webp",
    width: 1200,
    height: 800,
    isInspiration: true,
    // Masks were made from hand-traced outlines refined by colour (wood / stone / wall), so the
    // bar stools, faucet, lamp and the objects on the counter are never repainted.
    areas: {
      // The photo's walnut grain is strong: a wide light blur and little kept detail stop it ghosting through paint
      upper: { mask: "assets/designer/masks/walnut-island-upper.png", lightBlur: 34, detailKeep: 0.3 },
      lower: { mask: "assets/designer/masks/walnut-island-lower.png", lightBlur: 34, detailKeep: 0.3 },
      counter: { mask: "assets/designer/masks/walnut-island-counter.png", lightBlur: 10, detailKeep: 0.35 },
      backsplash: { mask: "assets/designer/masks/walnut-island-backsplash.png", lightBlur: 30, detailKeep: 0.15 }
    }
  },
  {
    id: "warm-stone",
    title: "מטבח עץ ואבן",
    image: "assets/designer/kitchen-warm-stone.webp",
    width: 903,
    height: 588,
    isInspiration: true,
    areas: {
      upper: {
        polygons: [
          [[160, 0], [407, 0], [407, 214], [160, 214]],
          [[572, 0], [903, 0], [903, 110], [598, 110], [572, 124]],
          [[0, 0], [97, 0], [97, 588], [0, 588]]
        ]
      },
      lower: {
        polygons: [
          [[176, 412], [644, 412], [644, 588], [176, 588]],
          [[646, 462], [730, 462], [730, 588], [646, 588]]
        ]
      },
      counter: {
        lightBlur: 14,
        detailKeep: 0.2,
        polygons: [
          [[176, 380], [620, 372], [644, 384], [644, 410], [176, 412]],
          [[731, 442], [903, 436], [903, 588], [818, 588], [818, 520], [731, 466]]
        ]
      },
      backsplash: {
        lightBlur: 30,
        detailKeep: 0.08,
        polygons: [
          [[160, 217], [408, 217], [408, 124], [903, 124], [903, 362], [620, 362], [620, 374], [176, 380], [160, 380]]
        ]
      },
      handles: {
        polygons: [
          [[230, 118], [238, 118], [238, 201], [230, 201]],
          [[256, 118], [264, 118], [264, 201], [256, 201]]
        ]
      }
    }
  }
];
