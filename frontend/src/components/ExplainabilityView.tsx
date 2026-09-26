'use client';

import React, { useState } from 'react';
import { Eye, Layers, Sparkles, Sliders, Info, ZoomIn } from 'lucide-react';

interface ExplainabilityViewProps {
  opticalUrl?: string;
  sarUrl?: string;
  heatmapUrl?: string;
  opticalLabel?: string;
  sarLabel?: string;
  title?: string;
  changePercentage?: number;
  highlightZone?: string;
  interactive?: boolean;
}

// Built-in high-fidelity satellite scenes encoded as SVGs so they render immediately
// without broken image links or external network dependencies
const DEFAULT_OPTICAL_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="100%" height="100%">
  <defs>
    <radialGradient id="vegGrad" cx="35%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#3d7e35" />
      <stop offset="50%" stop-color="#2d5e27" />
      <stop offset="100%" stop-color="#1e3f1a" />
    </radialGradient>
    <pattern id="cropPat" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
      <rect width="28" height="28" fill="#44753b" />
      <line x1="0" y1="0" x2="28" y2="0" stroke="#36612d" stroke-width="2.5" />
      <line x1="0" y1="14" x2="28" y2="14" stroke="#528847" stroke-width="1.8" />
    </pattern>
    <pattern id="soilPat" width="36" height="36" patternUnits="userSpaceOnUse" patternTransform="rotate(-25)">
      <rect width="36" height="36" fill="#80725a" />
      <rect x="0" y="0" width="18" height="18" fill="#8f8167" />
      <rect x="18" y="18" width="18" height="18" fill="#71644f" />
    </pattern>
    <filter id="optNoise">
      <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="4" result="noise" />
      <feColorMatrix type="matrix" values="0.33 0 0 0 0.15  0 0.45 0 0 0.25  0 0 0.25 0 0.1  0 0 0 0.35 0" />
      <feBlend mode="overlay" in2="SourceGraphic" />
    </filter>
  </defs>
  <rect width="320" height="240" fill="url(#vegGrad)" />
  <rect x="10" y="15" width="140" height="110" rx="4" fill="url(#cropPat)" opacity="0.9" />
  <rect x="160" y="25" width="145" height="95" rx="4" fill="url(#soilPat)" opacity="0.85" />
  <rect x="25" y="135" width="135" height="90" rx="4" fill="url(#soilPat)" opacity="0.8" />
  <rect x="170" y="130" width="135" height="95" rx="4" fill="url(#cropPat)" opacity="0.95" />
  <!-- Forest patches -->
  <circle cx="95" cy="80" r="32" fill="#1b4117" opacity="0.92" filter="blur(1px)" />
  <circle cx="230" cy="180" r="42" fill="#183d15" opacity="0.95" filter="blur(1px)" />
  <circle cx="210" cy="70" r="28" fill="#224c1e" opacity="0.88" />
  <!-- Settlements & road network -->
  <path d="M 0 115 Q 110 125 180 105 T 320 120" stroke="#d5cebd" stroke-width="4.5" fill="none" />
  <path d="M 160 0 Q 170 110 165 240" stroke="#cbc4b4" stroke-width="3.5" fill="none" />
  <path d="M 175 105 L 285 240" stroke="#beb7a6" stroke-width="2.5" fill="none" />
  <!-- Urban buildings -->
  <g fill="#c9c3b8" stroke="#878074" stroke-width="0.8">
    <rect x="145" y="98" width="12" height="9" />
    <rect x="162" y="94" width="14" height="10" />
    <rect x="178" y="101" width="10" height="12" />
    <rect x="155" y="112" width="15" height="11" fill="#df6b52" />
    <rect x="173" y="115" width="11" height="8" />
    <rect x="187" y="108" width="13" height="9" fill="#df6b52" />
  </g>
  <!-- Subtle satellite overlay texture -->
  <rect width="320" height="240" fill="none" filter="url(#optNoise)" opacity="0.6" />
  <text x="10" y="230" fill="#ffffff" font-size="9" font-family="sans-serif" font-weight="600" opacity="0.85">SENTINEL-2 RGB (10m)</text>
</svg>
`)}`;

const DEFAULT_SAR_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="100%" height="100%">
  <defs>
    <filter id="sarSpeckle">
      <feTurbulence type="fractalNoise" baseFrequency="0.25" numOctaves="3" result="speckle" />
      <feColorMatrix type="matrix" values="0.7 0.7 0.7 0 0  0.7 0.7 0.7 0 0  0.7 0.7 0.7 0 0  0 0 0 1 0" />
    </filter>
    <radialGradient id="sarBg" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#646b73" />
      <stop offset="50%" stop-color="#4a5057" />
      <stop offset="100%" stop-color="#2c3035" />
    </radialGradient>
  </defs>
  <rect width="320" height="240" fill="url(#sarBg)" />
  <rect width="320" height="240" filter="url(#sarSpeckle)" opacity="0.55" />
  
  <!-- SAR Microwave backscatter features -->
  <!-- Rough vegetation (medium diffuse return) -->
  <circle cx="95" cy="80" r="34" fill="#757c85" opacity="0.8" filter="blur(2px)" />
  <circle cx="230" cy="180" r="45" fill="#7a828c" opacity="0.85" filter="blur(2px)" />
  
  <!-- Smooth soil / road (specular, low return = dark) -->
  <path d="M 0 115 Q 110 125 180 105 T 320 120" stroke="#1f2226" stroke-width="5" fill="none" opacity="0.9" />
  <path d="M 160 0 Q 170 110 165 240" stroke="#25292e" stroke-width="4" fill="none" opacity="0.9" />
  
  <!-- Corner reflector / Double-bounce metallic & urban buildings (High Intensity = Bright White) -->
  <g fill="#ffffff" filter="drop-shadow(0 0 2px #ffffff)">
    <rect x="146" y="99" width="10" height="8" />
    <rect x="163" y="95" width="12" height="9" />
    <rect x="179" y="102" width="9" height="11" />
    <rect x="156" y="113" width="14" height="10" />
    <rect x="174" y="116" width="10" height="7" />
    <rect x="188" y="109" width="12" height="8" />
    <!-- Additional metallic structures penetrating clouds -->
    <circle cx="168" cy="142" r="3.5" />
    <circle cx="192" cy="138" r="4" />
    <circle cx="140" cy="135" r="3" />
  </g>
  <text x="10" y="230" fill="#ffffff" font-size="9" font-family="sans-serif" font-weight="600" opacity="0.85">SENTINEL-1 SAR VV (C-Band)</text>
</svg>
`)}`;

export default function ExplainabilityView({
  opticalUrl,
  sarUrl,
  heatmapUrl,
  opticalLabel = 'Optical (RGB)',
  sarLabel = 'SAR (VV)',
  title = 'EXPLAINABILITY & SAMPLE OUTPUT',
  changePercentage = 14.8,
  highlightZone = 'Industrial Expansion & Riparian Sector',
  interactive = true,
}: ExplainabilityViewProps) {
  const [opacity, setOpacity] = useState(85);
  const [baseLayer, setBaseLayer] = useState<'optical' | 'sar' | 'fused'>('optical');
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [showInspector, setShowInspector] = useState(false);

  const activeOptical = opticalUrl || DEFAULT_OPTICAL_SVG;
  const activeSar = sarUrl || DEFAULT_SAR_SVG;

  return (
    <div
      style={{
        border: '1px solid rgba(59, 130, 246, 0.4)',
        borderRadius: 10,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #111e33 0%, #0a1324 100%)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
        margin: '16px 0',
      }}
    >
      {/* ── Top Ribbon / Banner ────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 50%, #2563eb 100%)',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: 13,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '9px 16px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Sparkles size={15} />
        <span>{title}</span>
      </div>

      {/* ── Visual Processing Pipeline ───────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(220, 230, 242, 0.94) 0%, rgba(200, 214, 230, 0.92) 100%)',
          padding: '20px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(8px, 2vw, 18px)',
          flexWrap: 'nowrap',
          overflowX: 'auto',
        }}
      >
        {/* Step 1: Optical (RGB) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120, maxWidth: 170, flex: 1 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: '#1e3a5f',
              marginBottom: 6,
              letterSpacing: '0.02em',
              textAlign: 'center',
            }}
          >
            {opticalLabel}
          </div>
          <div
            style={{
              width: '100%',
              aspectRatio: '4 / 3',
              borderRadius: 8,
              overflow: 'hidden',
              border: '2px solid #ffffff',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
              position: 'relative',
              background: '#1a3020',
            }}
          >
            <img
              src={activeOptical}
              alt={opticalLabel}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 4,
                left: 4,
                padding: '2px 5px',
                borderRadius: 3,
                background: 'rgba(15, 23, 42, 0.75)',
                color: '#e2e8f0',
                fontSize: 9,
                fontWeight: 600,
              }}
            >
              RGB Visible
            </div>
          </div>
        </div>

        {/* Operator: + */}
        <div
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: '#1e3a5f',
            userSelect: 'none',
            flexShrink: 0,
            marginTop: 18,
          }}
        >
          +
        </div>

        {/* Step 2: SAR (VV) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120, maxWidth: 170, flex: 1 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: '#1e3a5f',
              marginBottom: 6,
              letterSpacing: '0.02em',
              textAlign: 'center',
            }}
          >
            {sarLabel}
          </div>
          <div
            style={{
              width: '100%',
              aspectRatio: '4 / 3',
              borderRadius: 8,
              overflow: 'hidden',
              border: '2px solid #ffffff',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
              position: 'relative',
              background: '#2d333b',
            }}
          >
            <img
              src={activeSar}
              alt={sarLabel}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 4,
                left: 4,
                padding: '2px 5px',
                borderRadius: 3,
                background: 'rgba(15, 23, 42, 0.75)',
                color: '#e2e8f0',
                fontSize: 9,
                fontWeight: 600,
              }}
            >
              Radar Backscatter
            </div>
          </div>
        </div>

        {/* Operator: ➡ */}
        <div
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: '#334155',
            userSelect: 'none',
            flexShrink: 0,
            marginTop: 18,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
            <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Step 3: Fused Heatmap Overlay */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120, maxWidth: 170, flex: 1 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: '#1e3a5f',
              marginBottom: 6,
              letterSpacing: '0.02em',
              textAlign: 'center',
            }}
          >
            Change Heatmap
          </div>
          <div
            style={{
              width: '100%',
              aspectRatio: '4 / 3',
              borderRadius: 8,
              overflow: 'hidden',
              border: '2px solid #ffffff',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.3)',
              position: 'relative',
              background: '#1a202c',
              cursor: 'crosshair',
            }}
            onMouseEnter={() => setHoveredZone('Industrial Infrastructure Sector (High Confidence)')}
            onMouseLeave={() => setHoveredZone(null)}
          >
            {/* Background base image based on toggle */}
            <img
              src={baseLayer === 'sar' ? activeSar : activeOptical}
              alt="Base scene"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                filter: baseLayer === 'fused' ? 'grayscale(40%) contrast(1.1)' : 'grayscale(15%)',
              }}
            />

            {/* Overlaid Realistic Gaussian Heatmap Layer */}
            <svg
              viewBox="0 0 320 240"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: opacity / 100,
                pointerEvents: 'none',
                mixBlendMode: 'screen',
              }}
            >
              <defs>
                <radialGradient id="heatCore" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ff0000" stopOpacity="0.95" />
                  <stop offset="35%" stopColor="#ff7700" stopOpacity="0.88" />
                  <stop offset="60%" stopColor="#ffee00" stopOpacity="0.75" />
                  <stop offset="80%" stopColor="#00ff66" stopOpacity="0.6" />
                  <stop offset="92%" stopColor="#00ccff" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#0022ff" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="heatSecondary" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ff4400" stopOpacity="0.9" />
                  <stop offset="40%" stopColor="#ffbb00" stopOpacity="0.8" />
                  <stop offset="70%" stopColor="#00e676" stopOpacity="0.55" />
                  <stop offset="95%" stopColor="#00b0ff" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0000ff" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="heatTertiary" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffaa00" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#76ff03" stopOpacity="0.5" />
                  <stop offset="85%" stopColor="#00e5ff" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2979ff" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* Primary intense change cluster */}
              <ellipse cx="170" cy="115" rx="55" ry="40" fill="url(#heatCore)" />
              {/* Adjacent expansion clusters */}
              <ellipse cx="140" cy="140" rx="42" ry="32" fill="url(#heatSecondary)" />
              <ellipse cx="205" cy="98" rx="36" ry="26" fill="url(#heatTertiary)" />
            </svg>

            {/* Change hotspot indicator */}
            <div
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                padding: '2px 5px',
                borderRadius: 3,
                background: 'rgba(239, 68, 68, 0.85)',
                color: '#ffffff',
                fontSize: 9,
                fontWeight: 700,
              }}
            >
              +{changePercentage}%
            </div>
          </div>
        </div>

        {/* Legend: Vertical Color Bar with High/Low Change */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
            marginTop: 18,
          }}
        >
          {/* Vertical Gradient Bar */}
          <div
            style={{
              width: 14,
              height: 100,
              borderRadius: 3,
              background: 'linear-gradient(to bottom, #ff0000 0%, #ff5500 20%, #ffdd00 40%, #00dd55 60%, #00ccff 80%, #0022ff 100%)',
              boxShadow: 'inset 0 0 2px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              position: 'relative',
            }}
          />

          {/* Scale Labels & Ticks */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: 100,
              fontSize: 10,
              fontWeight: 700,
              color: '#1e293b',
              lineHeight: 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 4, height: 1.5, background: '#1e293b' }} />
              <span>High Change</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 4, height: 1.5, background: '#1e293b' }} />
              <span>Low Change</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Interactive Controls & Details (SatQuery AI Enhancement) ──────── */}
      {interactive && (
        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(8, 15, 30, 0.96)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            fontSize: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Opacity Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sliders size={13} color="var(--accent-cyan)" />
              <span style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }}>Heatmap Opacity:</span>
              <input
                type="range"
                min="10"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                style={{ width: 75, cursor: 'pointer', accentColor: '#3b82f6' }}
              />
              <span style={{ color: 'var(--text-primary)', fontSize: 11, fontFamily: 'monospace', width: 32 }}>{opacity}%</span>
            </div>

            {/* Base Layer Selection */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers size={13} color="var(--accent-cyan)" />
              <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Base:</span>
              {(['optical', 'sar', 'fused'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setBaseLayer(mode)}
                  style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    background: baseLayer === mode ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                    border: baseLayer === mode ? '1px solid #3b82f6' : '1px solid var(--border)',
                    color: baseLayer === mode ? '#60a5fa' : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Info pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 11 }}>
            <Info size={13} color="var(--accent-blue)" />
            <span>
              {hoveredZone || `Target AOI: ${highlightZone} (${changePercentage}% altered)`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
