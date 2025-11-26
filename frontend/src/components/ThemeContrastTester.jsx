import React, { useMemo, useState, useEffect } from 'react';

// ThemeContrastTester.jsx
// A11y-focused color contrast tester for a Theme Studio

// ----------------------
// Color utility functions
// ----------------------

// Parse HEX, RGB, HSL strings to an { r, g, b } object in 0–255 range.
// Returns null if parsing fails.
function parseColorToRgb(input) {
  if (!input) return null;
  const value = input.trim().toLowerCase();

  // HEX: #rgb or #rrggbb (with or without leading #)
  const hexMatch = value.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex.split('').map((ch) => ch + ch).join('');
    }
    const intVal = parseInt(hex, 16);
    return {
      r: (intVal >> 16) & 255,
      g: (intVal >> 8) & 255,
      b: intVal & 255
    };
  }

  // rgb() / rgba()
  const rgbMatch = value.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d*\.?\d+))?\s*\)$/
  );
  if (rgbMatch) {
    const r = Number(rgbMatch[1]);
    const g = Number(rgbMatch[2]);
    const b = Number(rgbMatch[3]);
    if ([r, g, b].every((v) => v >= 0 && v <= 255)) {
      return { r, g, b };
    }
    return null;
  }

  // hsl() / hsla()
  const hslMatch = value.match(
    /^hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%(?:\s*,\s*(\d*\.?\d+))?\s*\)$/
  );
  if (hslMatch) {
    const h = Number(hslMatch[1]);
    const s = Number(hslMatch[2]);
    const l = Number(hslMatch[3]);
    if (h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100) {
      return hslToRgb(h, s, l);
    }
    return null;
  }

  return null;
}

// HSL (0–360, 0–100, 0–100) -> RGB (0–255)
function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (h >= 0 && h < 60) {
    r1 = c;
    g1 = x;
    b1 = 0;
  } else if (h >= 60 && h < 120) {
    r1 = x;
    g1 = c;
    b1 = 0;
  } else if (h >= 120 && h < 180) {
    r1 = 0;
    g1 = c;
    b1 = x;
  } else if (h >= 180 && h < 240) {
    r1 = 0;
    g1 = x;
    b1 = c;
  } else if (h >= 240 && h < 300) {
    r1 = x;
    g1 = 0;
    b1 = c;
  } else {
    r1 = c;
    g1 = 0;
    b1 = x;
  }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255)
  };
}

// RGB (0–255) -> HSL (0–360, 0–100, 0–100)
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        break;
    }
    h *= 60;
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

// WCAG 2.1 relative luminance
function relativeLuminance({ r, g, b }) {
  const srgb = [r, g, b].map((v) => v / 255);

  const lin = srgb.map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );

  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

// Contrast ratio: (L1 + 0.05) / (L2 + 0.05)
function contrastRatio(fgRgb, bgRgb) {
  const L1 = relativeLuminance(fgRgb);
  const L2 = relativeLuminance(bgRgb);
  const light = Math.max(L1, L2);
  const dark = Math.min(L1, L2);
  return (light + 0.05) / (dark + 0.05);
}

// Suggest a nearby background color (via lightness tweak) that meets at least AA normal (4.5:1).
// Returns { suggestedHex, deltaL, targetRatioReached } or null if we fail.
function suggestAccessibleBackground(fgRgb, bgRgb, target = 4.5) {
  const { h, s, l } = rgbToHsl(bgRgb.r, bgRgb.g, bgRgb.b);
  const fgLum = relativeLuminance(fgRgb);
  const bgLum = relativeLuminance(bgRgb);
  const bgIsLighter = bgLum > fgLum;

  // Try adjusting lightness in small steps, up to 30% in either direction.
  const maxStep = 30;
  let best = null;

  for (let step = 1; step <= maxStep; step++) {
    const delta = step * (bgIsLighter ? 1 : -1);
    const candidateL = Math.max(0, Math.min(100, l + delta));
    const candidateRgb = hslToRgb(h, s, candidateL);
    const candidateRatio = contrastRatio(fgRgb, candidateRgb);

    if (candidateRatio >= target) {
      best = {
        suggestedHex: rgbToHex(candidateRgb),
        deltaL: candidateL - l,
        targetRatioReached: candidateRatio
      };
      break;
    }
  }

  return best;
}

// RGB -> hex string (#rrggbb)
function rgbToHex({ r, g, b }) {
  return (
    '#' +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

// ----------------------
// ARIA helper styles
// ----------------------

const srOnlyStyles = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  width: '1px'
};

// ----------------------
// Main React component
// ----------------------

export default function ThemeContrastTester({ initialFg, initialBg }) {
  const [fgInput, setFgInput] = useState(initialFg || '#1F2937');
  const [bgInput, setBgInput] = useState(initialBg || '#FFFFFF');

  const [fgTouched, setFgTouched] = useState(false);
  const [bgTouched, setBgTouched] = useState(false);

  useEffect(() => {
    if (initialFg) {
      setFgInput(initialFg);
    }
    if (initialBg) {
      setBgInput(initialBg);
    }
  }, [initialFg, initialBg]);

  const { fgRgb, bgRgb, ratio, aaNormal, aaLarge, aaaNormal, aaaLarge } = useMemo(() => {
    const fg = parseColorToRgb(fgInput);
    const bg = parseColorToRgb(bgInput);

    if (!fg || !bg) {
      return {
        fgRgb: fg,
        bgRgb: bg,
        ratio: null,
        aaNormal: false,
        aaLarge: false,
        aaaNormal: false,
        aaaLarge: false
      };
    }

    const r = contrastRatio(fg, bg);

    return {
      fgRgb: fg,
      bgRgb: bg,
      ratio: r,
      aaNormal: r >= 4.5,
      aaLarge: r >= 3,
      aaaNormal: r >= 7,
      aaaLarge: r >= 4.5
    };
  }, [fgInput, bgInput]);

  const suggestions = useMemo(() => {
    if (!fgRgb || !bgRgb || !ratio) return null;
    if (ratio >= 4.5) return null;
    return suggestAccessibleBackground(fgRgb, bgRgb, 4.5);
  }, [fgRgb, bgRgb, ratio]);

  const fgError = fgTouched && !fgRgb ? 'Enter a valid color (HEX, RGB, or HSL).' : '';
  const bgError = bgTouched && !bgRgb ? 'Enter a valid color (HEX, RGB, or HSL).' : '';

  const visualFg = fgRgb ? rgbToHex(fgRgb) : '#1F2937';
  const visualBg = bgRgb ? rgbToHex(bgRgb) : '#FFFFFF';

  const matrixBackgrounds = [
    { label: 'White', hex: '#FFFFFF' },
    { label: 'Black', hex: '#000000' },
    { label: 'Light Gray', hex: '#F3F4F6' },
    { label: 'Mid Gray', hex: '#6B7280' },
    { label: 'Dark Gray', hex: '#111827' }
  ];

  return (
    <section
      aria-labelledby="theme-contrast-heading"
      style={{
        borderRadius: '0.75rem',
        border: '1px solid #E5E7EB',
        padding: '1rem',
        marginTop: '1rem'
      }}
    >
      <h2
        id="theme-contrast-heading"
        style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}
      >
        Theme Studio Color Contrast Tester
      </h2>

      <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: '#4B5563' }}>
        Test text and background colors against WCAG 2.1 contrast requirements. Supports HEX, RGB,
        and HSL formats.
      </p>

      {/* Inputs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}
      >
        {/* Foreground input */}
        <div>
          <label
            htmlFor="fg-color-input"
            style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}
          >
            Foreground (Text) Color
          </label>
          <input
            id="fg-color-input"
            type="text"
            value={fgInput}
            onChange={(e) => setFgInput(e.target.value)}
            onBlur={() => setFgTouched(true)}
            aria-invalid={Boolean(fgError)}
            aria-errormessage={fgError ? 'fg-color-error' : undefined}
            aria-describedby="fg-color-help"
            style={{
              width: '100%',
              borderRadius: 6,
              border: `1px solid ${fgError ? '#DC2626' : '#D1D5DB'}`,
              padding: '0.35rem 0.5rem',
              fontSize: '0.9rem'
            }}
            placeholder="#1F2937, rgb(31,41,55), or hsl(210, 30%, 20%)"
          />
          {/* Small color swatch */}
          <div
            aria-hidden="true"
            style={{
              marginTop: 4,
              width: 20,
              height: 20,
              borderRadius: 4,
              border: '1px solid #D1D5DB',
              backgroundColor: visualFg
            }}
          />
          <p id="fg-color-help" style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>
            Accepts HEX, rgb(), or hsl() formats.
          </p>
          {fgError && (
            <p
              id="fg-color-error"
              role="alert"
              style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: 2 }}
            >
              {fgError}
            </p>
          )}
        </div>

        {/* Background input */}
        <div>
          <label
            htmlFor="bg-color-input"
            style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}
          >
            Background Color
          </label>
          <input
            id="bg-color-input"
            type="text"
            value={bgInput}
            onChange={(e) => setBgInput(e.target.value)}
            onBlur={() => setBgTouched(true)}
            aria-invalid={Boolean(bgError)}
            aria-errormessage={bgError ? 'bg-color-error' : undefined}
            aria-describedby="bg-color-help"
            style={{
              width: '100%',
              borderRadius: 6,
              border: `1px solid ${bgError ? '#DC2626' : '#D1D5DB'}`,
              padding: '0.35rem 0.5rem',
              fontSize: '0.9rem'
            }}
            placeholder="#FFFFFF, rgb(255,255,255), or hsl(0, 0%, 100%)"
          />
          <div
            aria-hidden="true"
            style={{
              marginTop: 4,
              width: 20,
              height: 20,
              borderRadius: 4,
              border: '1px solid #D1D5DB',
              backgroundColor: visualBg
            }}
          />
          <p id="bg-color-help" style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>
            Accepts HEX, rgb(), or hsl() formats.
          </p>
          {bgError && (
            <p
              id="bg-color-error"
              role="alert"
              style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: 2 }}
            >
              {bgError}
            </p>
          )}
        </div>
      </div>

      {/* Results + live region */}
      <div
        id="contrast-results"
        aria-live="polite" // ARIA live region so screen readers announce ratio/score updates.
        role="status" // Explicit status role for assistive tech.
        style={{
          borderRadius: 8,
          border: '1px solid #E5E7EB',
          padding: '0.75rem',
          marginBottom: '1rem',
          background: '#F9FAFB'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Contrast Ratio</p>
            <p style={{ fontSize: '1rem', fontWeight: 700 }}>
              {ratio ? `${ratio.toFixed(2)}:1` : ''}
            </p>
          </div>
          <div style={{ fontSize: '0.8rem' }}>
            <p>
              AA Normal (4.5:1):{' '}
              <strong style={{ color: aaNormal ? '#16A34A' : '#DC2626' }}>
                {aaNormal ? 'Pass' : 'Fail'}
              </strong>
            </p>
            <p>
              AA Large (3:1):{' '}
              <strong style={{ color: aaLarge ? '#16A34A' : '#DC2626' }}>
                {aaLarge ? 'Pass' : 'Fail'}
              </strong>
            </p>
          </div>
          <div style={{ fontSize: '0.8rem' }}>
            <p>
              AAA Normal (7:1):{' '}
              <strong style={{ color: aaaNormal ? '#16A34A' : '#DC2626' }}>
                {aaaNormal ? 'Pass' : 'Fail'}
              </strong>
            </p>
            <p>
              AAA Large (4.5:1):{' '}
              <strong style={{ color: aaaLarge ? '#16A34A' : '#DC2626' }}>
                {aaaLarge ? 'Pass' : 'Fail'}
              </strong>
            </p>
          </div>
        </div>

        {/* Visually hidden explanation for screen readers */}
        {ratio && (
          <span style={srOnlyStyles}>
            Contrast ratio is {ratio.toFixed(2)} to 1. AA normal text {aaNormal ? 'passes' : 'fails'},
            AA large text {aaLarge ? 'passes' : 'fails'}, AAA normal text {aaaNormal ? 'passes' : 'fails'},
            AAA large text {aaaLarge ? 'passes' : 'fails'}.
          </span>
        )}
      </div>

      {/* Suggestion engine */}
      {ratio && suggestions && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            borderRadius: 8,
            background: '#FEF3C7',
            border: '1px solid #FBBF24',
            fontSize: '0.85rem'
          }}
        >
          <strong>Suggestion:</strong>{' '}
          {suggestions.deltaL < 0
            ? `Darken background by ${Math.abs(Math.round(suggestions.deltaL))}%`
            : `Lighten background by ${Math.round(suggestions.deltaL)}%`}{' '}
          to reach at least AA normal. Suggested background: <code>{suggestions.suggestedHex}</code> (approx.
          ratio {suggestions.targetRatioReached.toFixed(2)}:1).
        </div>
      )}

      {/* Live preview card */}
      <div
        aria-label="Live preview of text on background color"
        style={{
          marginBottom: '1rem',
          borderRadius: 10,
          border: '1px solid #E5E7EB',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '1rem',
            backgroundColor: visualBg,
            color: visualFg
          }}
        >
          <p style={{ fontSize: '0.8rem', marginBottom: 4, opacity: 0.8 }}>Live Preview</p>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
            The quick brown fox jumps over the lazy dog.
          </h3>
          <p style={{ marginTop: 6, fontSize: '0.9rem' }}>
            1234567890  This preview reflects your themes text and background colors.
          </p>
          <button
            type="button"
            style={{
              marginTop: 10,
              padding: '0.4rem 0.75rem',
              borderRadius: 999,
              border: 'none',
              cursor: 'default',
              backgroundColor: visualFg,
              color: visualBg,
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            Example button
          </button>
        </div>
      </div>

      {/* Matrix view */}
      <div>
        <p
          id="contrast-matrix-heading"
          style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}
        >
          Matrix: This text color against common backgrounds
        </p>
        <div
          aria-describedby="contrast-matrix-heading"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '0.5rem'
          }}
        >
          {matrixBackgrounds.map((bg) => {
            const bgRgb = parseColorToRgb(bg.hex);
            const r = fgRgb && bgRgb ? contrastRatio(fgRgb, bgRgb) : null;
            const passAA = r && r >= 4.5;
            return (
              <div
                key={bg.label}
                style={{
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                  overflow: 'hidden',
                  fontSize: '0.8rem'
                }}
              >
                <div
                  style={{
                    padding: '0.5rem',
                    backgroundColor: bg.hex,
                    color: visualFg,
                    minHeight: 48
                  }}
                >
                  <span>{bg.label}</span>
                </div>
                <div style={{ padding: '0.35rem 0.5rem', background: '#F9FAFB' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>
                      {r ? `${r.toFixed(2)}:1` : ''}
                    </span>
                  </div>
                  <div>
                    <span
                      style={{ color: passAA ? '#16A34A' : '#DC2626', fontWeight: 600 }}
                    >
                      {passAA ? 'AA Normal: Pass' : 'AA Normal: Fail'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
