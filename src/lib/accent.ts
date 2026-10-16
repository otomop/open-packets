/** The chosen fill stays exact; text gets a readable shade of the same color. */
export const DEFAULT_ACCENT = "#3860f4";

export const ACCENT_PRESETS = [
  { name: "Blue", value: DEFAULT_ACCENT },
  { name: "Violet", value: "#9b6dff" },
  { name: "Teal", value: "#18c9ac" },
  { name: "Amber", value: "#ffb454" },
  { name: "Rose", value: "#f36c9c" },
] as const;

export const ACCENT_VARIABLE_NAMES = [
  "--user-accent",
  "--user-accent-ink",
  "--user-accent-text-dark",
  "--user-accent-text-gray",
  "--user-accent-text-light",
  "--user-accent-soft-dark",
  "--user-accent-soft-gray",
  "--user-accent-soft-light",
  "--user-accent-line-dark",
  "--user-accent-line-gray",
  "--user-accent-line-light",
] as const;

type Rgb = { r: number; g: number; b: number };

export function validAccent(value: unknown): value is string {
  return typeof value === "string" && value.length === 7 && /^#[\da-f]{6}$/i.test(value);
}

export function rgbFromHex(hex: string): Rgb {
  if (!validAccent(hex)) throw new RangeError("Use a six-digit hex color, such as #3860f4.");
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

export function hexFromRgb(r: number, g: number, b: number): string {
  const channel = (value: number) => {
    if (!Number.isFinite(value)) throw new RangeError("RGB channels must be finite numbers.");
    return Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, "0");
  };
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

function luminance({ r, g, b }: Rgb): number {
  const linear = (byte: number) => {
    const value = byte / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

export function contrastRatio(first: string, second: string): number {
  const a = luminance(rgbFromHex(first));
  const b = luminance(rgbFromHex(second));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// Keep these in step with --bg through --bg-4 in app.css.
const DARK_SURFACES = ["#151515", "#1b1b1b", "#222222", "#2a2a2a"];
const GRAY_SURFACES = ["#242424", "#2b2b2b", "#323232", "#3b3b3b"];
const LIGHT_SURFACES = ["#f1efe8", "#f7f6f1", "#e9e6dd", "#dedad0"];

function surfaceLuminances(accent: Rgb, surfaces: string[], alpha: number): number[] {
  return surfaces.flatMap(surface => {
    const base = rgbFromHex(surface);
    const tint = {
      r: accent.r * alpha + base.r * (1 - alpha),
      g: accent.g * alpha + base.g * (1 - alpha),
      b: accent.b * alpha + base.b * (1 - alpha),
    };
    // Include selected chips and other soft fills, both before and after the
    // browser rounds the composited color to eight-bit display channels.
    const roundedTint = rgbFromHex(hexFromRgb(tint.r, tint.g, tint.b));
    return [luminance(base), luminance(tint), luminance(roundedTint)];
  });
}

function readableShade(hex: string, surfaces: number[], target: 0 | 255): string {
  const readable = (candidate: string) => {
    const ink = luminance(rgbFromHex(candidate));
    return surfaces.every(surface => (Math.max(ink, surface) + 0.05) / (Math.min(ink, surface) + 0.05) >= 4.5);
  };
  if (readable(hex)) return hex;
  const { r, g, b } = rgbFromHex(hex);
  // Mixing toward white or black preserves hue. Search the rounded result so
  // converting back to eight-bit channels cannot drop below the contrast limit.
  const mix = (amount: number) => hexFromRgb(
    r + (target - r) * amount,
    g + (target - g) * amount,
    b + (target - b) * amount,
  );
  let low = 0;
  let high = 1;
  for (let i = 0; i < 24; i++) {
    const middle = (low + high) / 2;
    if (readable(mix(middle))) high = middle;
    else low = middle;
  }
  return mix(high);
}

export function accentVariables(hex: string): Record<string, string> {
  const rgb = rgbFromHex(hex);
  const { r, g, b } = rgb;
  const selected = hex.toLowerCase();
  const darkText = readableShade(selected, surfaceLuminances(rgb, DARK_SURFACES, 0.16), 255);
  const grayText = readableShade(selected, surfaceLuminances(rgb, GRAY_SURFACES, 0.12), 255);
  const lightText = readableShade(selected, surfaceLuminances(rgb, LIGHT_SURFACES, 0.12), 0);
  return {
    "--user-accent": selected,
    "--user-accent-ink": contrastRatio(selected, "#000000") >= contrastRatio(selected, "#ffffff") ? "#000000" : "#ffffff",
    "--user-accent-text-dark": darkText,
    "--user-accent-text-gray": grayText,
    "--user-accent-text-light": lightText,
    "--user-accent-soft-dark": `rgba(${r}, ${g}, ${b}, 0.16)`,
    "--user-accent-soft-gray": `rgba(${r}, ${g}, ${b}, 0.12)`,
    "--user-accent-soft-light": `rgba(${r}, ${g}, ${b}, 0.12)`,
    "--user-accent-line-dark": darkText,
    "--user-accent-line-gray": grayText,
    "--user-accent-line-light": lightText,
  };
}
