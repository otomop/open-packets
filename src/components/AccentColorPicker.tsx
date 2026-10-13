import { useEffect, useId, useState } from "react";
import type { CSSProperties } from "react";
import { ACCENT_PRESETS, DEFAULT_ACCENT, hexFromRgb, rgbFromHex, validAccent } from "@/lib/accent";
import "@/styles/accent-color.css";

const channels = ["r", "g", "b"] as const;
const channelNames = { r: "Red", g: "Green", b: "Blue" };
const rgbDraft = (value: string) => {
  const rgb = rgbFromHex(value);
  return { r: String(rgb.r), g: String(rgb.g), b: String(rgb.b) };
};

/** Shared by Settings and first-launch setup; incomplete input never changes the saved color. */
export function AccentColorPicker({ value, onChange, showReset = false }: {
  value: string;
  onChange: (value: string) => void;
  showReset?: boolean;
}) {
  const id = useId();
  const preset = ACCENT_PRESETS.find(color => color.value === value.toLowerCase());
  const [custom, setCustom] = useState(!preset);
  const [hex, setHex] = useState(value.toUpperCase());
  const [rgb, setRgb] = useState(() => rgbDraft(value));
  useEffect(() => {
    setHex(value.toUpperCase());
    setRgb(rgbDraft(value));
  }, [value]);
  const choose = (color: string) => {
    setHex(color.toUpperCase());
    setRgb(rgbDraft(color));
    onChange(color);
  };
  const invalidHex = !validAccent(hex);
  const invalidRgb = channels.some(channel => !/^\d{1,3}$/.test(rgb[channel]) || Number(rgb[channel]) > 255);

  return (
    <div className="accent-picker">
      <div className="accent-picker-summary">
        <span className="accent-current"><span className="accent-current-dot" aria-hidden="true" />{preset?.name ?? "Custom"}<code>{value.toUpperCase()}</code></span>
        {showReset && <button type="button" className="link small" disabled={value.toLowerCase() === DEFAULT_ACCENT} onClick={() => { setCustom(false); choose(DEFAULT_ACCENT); }}>Reset to blue</button>}
      </div>
      <div className="accent-options" role="group" aria-label="Favorite color">
        {ACCENT_PRESETS.map(color => (
          <button type="button" key={color.value} className="accent-option" aria-pressed={color.value === value.toLowerCase()} onClick={() => { setCustom(false); choose(color.value); }}>
            <span className="accent-swatch" style={{ "--swatch": color.value } as CSSProperties} aria-hidden="true" />
            <span>{color.name}</span><span className="accent-choice-check" aria-hidden="true">{color.value === value.toLowerCase() ? "✓" : ""}</span>
          </button>
        ))}
        <button type="button" className="accent-option accent-custom" aria-expanded={custom} aria-controls={`${id}-custom`} onClick={() => setCustom(!custom)}>
          <span className="accent-swatch" aria-hidden="true" /><span>Custom</span><span className="accent-choice-check" aria-hidden="true">{custom ? "−" : "+"}</span>
        </button>
      </div>
      <div id={`${id}-custom`} hidden={!custom}>
        {custom && <fieldset className="accent-manual">
          <legend>Choose any RGB color</legend>
          <div className="accent-manual-top">
            <label className="field accent-native">Color picker<input type="color" value={value} onChange={e => choose(e.target.value)} /></label>
            <label className="field accent-hex">Hex color<input className="mono" value={hex} maxLength={7} spellCheck={false} autoComplete="off" aria-invalid={invalidHex} aria-describedby={`${id}-help`} onChange={e => {
              const next = e.target.value;
              setHex(next);
              const normalized = next.startsWith("#") ? next : `#${next}`;
              if (validAccent(normalized)) choose(normalized.toLowerCase());
            }} onBlur={() => setHex(value.toUpperCase())} /></label>
          </div>
          <div className="accent-rgb">
            {channels.map(channel => <label className="field" key={channel}>{channelNames[channel]}<input type="number" min={0} max={255} step={1} inputMode="numeric" value={rgb[channel]} aria-describedby={`${id}-help`} aria-invalid={!/^\d{1,3}$/.test(rgb[channel]) || Number(rgb[channel]) > 255} onChange={e => {
              const next = { ...rgb, [channel]: e.target.value };
              setRgb(next);
              if (channels.every(c => /^\d{1,3}$/.test(next[c]) && Number(next[c]) <= 255)) {
                onChange(hexFromRgb(Number(next.r), Number(next.g), Number(next.b)));
              }
            }} onBlur={() => setRgb(rgbDraft(value))} /></label>)}
          </div>
          <p id={`${id}-help`} className="small muted">{invalidHex || invalidRgb ? "Enter six hex digits or whole RGB values from 0 to 255. Incomplete entries keep your last valid color." : "Use the picker, a hex code, or red, green and blue values from 0 to 255."}</p>
        </fieldset>}
      </div>
      <p className="small muted">Changes appear live. Buttons use your chosen color; text adjusts for readability.</p>
    </div>
  );
}
