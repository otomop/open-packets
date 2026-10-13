import test from "node:test";
import assert from "node:assert/strict";
import { runtime, plain } from "./runtime.mjs";

const {
  DEFAULT_ACCENT, ACCENT_PRESETS, ACCENT_VARIABLE_NAMES,
  validAccent, rgbFromHex, hexFromRgb, contrastRatio, accentVariables,
} = runtime().load("src/lib/accent.ts");

const darkSurfaces = ["#0d0d0f", "#121215", "#17171b", "#1f1f24"];
const lightSurfaces = ["#f1efe8", "#f7f6f1", "#e9e6dd", "#dedad0"];

const channels = hex => [1, 3, 5].map(offset => Number.parseInt(hex.slice(offset, offset + 2), 16));
function compositedTint(accent, base, opacity, rounded = false) {
  const foreground = channels(accent);
  return channels(base).map((background, index) => {
    const channel = foreground[index] * opacity + background * (1 - opacity);
    return rounded ? Math.round(channel) : channel;
  });
}
function contrastOnTint(text, tint) {
  const luminance = rgb => rgb.map(byte => byte / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  const a = luminance(channels(text));
  const b = luminance(tint);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test("five presets use the configured blue default and accept only complete RGB hex values", () => {
  assert.equal(DEFAULT_ACCENT, "#3860f4");
  assert.deepEqual(plain(ACCENT_PRESETS).map(preset => preset.name), ["Blue", "Violet", "Teal", "Amber", "Rose"]);
  assert.equal(new Set(ACCENT_PRESETS.map(preset => preset.value)).size, 5);
  for (const value of [...ACCENT_PRESETS.map(preset => preset.value), "#000000", "#FFFFFF", "#aB019F"]) {
    assert.equal(validAccent(value), true, value);
  }
  for (const value of [null, undefined, 0, {}, [], "", "red", "#fff", "#12345678", "#12345g", " #123456", "#123456 ", "#123456\n", "rgb(0,0,0)", "#123456; color:red"]) {
    assert.equal(validAccent(value), false, String(value));
  }
});

test("RGB controls round-trip channels, normalize case, and bound finite slider values", () => {
  assert.deepEqual(plain(rgbFromHex("#2F5bFF")), { r: 47, g: 91, b: 255 });
  assert.equal(hexFromRgb(-10, 127.6, 900), "#0080ff");
  for (const r of [0, 1, 47, 128, 254, 255]) {
    for (const g of [0, 1, 91, 128, 254, 255]) {
      for (const b of [0, 1, 128, 254, 255]) {
        assert.deepEqual(plain(rgbFromHex(hexFromRgb(r, g, b))), { r, g, b });
      }
    }
  }
  for (const value of ["#xyzxyz", "#fff", "transparent"]) assert.throws(() => rgbFromHex(value), /six-digit hex/);
  for (const value of [NaN, Infinity, -Infinity]) assert.throws(() => hexFromRgb(value, 0, 0), /finite numbers/);
});

test("contrast calculation matches black, white, and WCAG sRGB examples", () => {
  assert.equal(contrastRatio("#000000", "#ffffff"), 21);
  assert.equal(contrastRatio("#2f5bff", "#2f5bff"), 1);
  assert.ok(Math.abs(contrastRatio("#777777", "#ffffff") - 4.478089453577214) < 1e-10);
  assert.equal(contrastRatio("#abcdef", "#123456"), contrastRatio("#123456", "#abcdef"));
});

test("sampled RGB colors keep exact fills and readable text on base and tinted surfaces", () => {
  const candidates = new Set(ACCENT_PRESETS.map(preset => preset.value));
  for (const r of [0, 32, 64, 96, 128, 160, 192, 224, 255]) {
    for (const g of [0, 32, 64, 96, 128, 160, 192, 224, 255]) {
      for (const b of [0, 32, 64, 96, 128, 160, 192, 224, 255]) candidates.add(hexFromRgb(r, g, b));
    }
  }
  for (const selected of candidates) {
    const vars = accentVariables(selected.toUpperCase());
    assert.deepEqual(Object.keys(vars).sort(), [...ACCENT_VARIABLE_NAMES].sort());
    assert.equal(vars["--user-accent"], selected);
    assert.ok(["#000000", "#ffffff"].includes(vars["--user-accent-ink"]));
    assert.ok(contrastRatio(selected, vars["--user-accent-ink"]) >= 4.5, `fill text on ${selected}`);
    for (const [theme, surfaces, alpha] of [["dark", darkSurfaces, 0.16], ["light", lightSurfaces, 0.12]]) {
      const tints = surfaces.flatMap(surface => [compositedTint(selected, surface, alpha), compositedTint(selected, surface, alpha, true)]);
      for (const surface of surfaces) {
        assert.ok(contrastRatio(vars[`--user-accent-text-${theme}`], surface) >= 4.5, `${selected}: ${theme} text on ${surface}`);
        assert.ok(contrastRatio(vars[`--user-accent-line-${theme}`], surface) >= 3, `${selected}: ${theme} focus on ${surface}`);
      }
      for (const tint of tints) {
        assert.ok(contrastOnTint(vars[`--user-accent-text-${theme}`], tint) >= 4.5, `${selected}: ${theme} text on RGB ${tint}`);
        assert.ok(contrastOnTint(vars[`--user-accent-line-${theme}`], tint) >= 3, `${selected}: ${theme} focus on RGB ${tint}`);
      }
      if (surfaces.every(surface => contrastRatio(selected, surface) >= 4.5) && tints.every(tint => contrastOnTint(selected, tint) >= 4.5)) {
        assert.equal(vars[`--user-accent-text-${theme}`], selected, "already readable colors stay unchanged");
      }
    }
  }
});

test("derived shades retain channel ordering and neutral colors stay neutral", () => {
  for (const selected of ["#ff0000", "#00ff00", "#0000ff", "#2f5bff", "#f36c9c", "#000000", "#ffffff", "#777777"]) {
    const original = rgbFromHex(selected);
    const vars = accentVariables(selected);
    for (const theme of ["dark", "light"]) {
      const derived = rgbFromHex(vars[`--user-accent-text-${theme}`]);
      for (const a of ["r", "g", "b"]) {
        for (const b of ["r", "g", "b"]) assert.equal(Math.sign(derived[a] - derived[b]), Math.sign(original[a] - original[b]));
      }
    }
  }
  const vars = accentVariables("#2F5BFF");
  assert.equal(vars["--user-accent-soft-dark"], "rgba(47, 91, 255, 0.16)");
  assert.equal(vars["--user-accent-soft-light"], "rgba(47, 91, 255, 0.12)");
  assert.throws(() => accentVariables("#123456; color:red"), /six-digit hex/);
});
