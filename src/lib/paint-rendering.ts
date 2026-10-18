export const paintColours = [
  {
    name: "Sage hush",
    hex: "#9ba58b",
    note: "A quiet green, grounded in nature.",
  },
  {
    name: "Fired clay",
    hex: "#b9775e",
    note: "A little warmth. A little character.",
  },
  {
    name: "Linen white",
    hex: "#e5ddc9",
    note: "Soft, warm and beautifully understated.",
  },
  {
    name: "Oat silk",
    hex: "#c8b38b",
    note: "Golden neutrals for sunlit moments.",
  },
  {
    name: "Mineral blue",
    hex: "#8eabb2",
    note: "A cool, restful change of atmosphere.",
  },
  {
    name: "Forest shade",
    hex: "#626f55",
    note: "Deep green with a comforting presence.",
  },
] as const;
export const visualiserRooms = [
  {
    id: "living",
    label: "Living room",
    reference: [210, 194, 179],
    ambient: 1,
  },
  {
    id: "bedroom",
    label: "Bedroom",
    reference: [108, 110, 101],
    ambient: 0.72,
  },
] as const;
export type RoomId = (typeof visualiserRooms)[number]["id"];

/** Change reflectance inside the matte, preserving source illumination and every unmasked pixel. */
export function recolourWall(
  source: Uint8ClampedArray,
  mask: Uint8ClampedArray,
  hex: string,
  room: RoomId,
) {
  const settings = visualiserRooms.find((item) => item.id === room)!;
  const colour = [1, 3, 5].map((offset) =>
    parseInt(hex.slice(offset, offset + 2), 16),
  );
  const result = new Uint8ClampedArray(source);
  for (let i = 0; i < source.length; i += 4) {
    const alpha = mask[i] / 255;
    if (alpha === 0) continue;
    for (let channel = 0; channel < 3; channel++) {
      const illuminated = Math.min(
        255,
        (colour[channel] * settings.ambient * source[i + channel]) /
          settings.reference[channel],
      );
      result[i + channel] = Math.round(
        source[i + channel] * (1 - alpha) + illuminated * alpha,
      );
    }
  }
  return result;
}
