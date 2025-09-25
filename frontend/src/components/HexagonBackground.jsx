// src/components/ui/HexagonBackground.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";

/**
 * A responsive, container-sized hexagon background layer that reacts on hover.
 * - The grid sits under your content (z-0) and can be globally faded via `gridOpacity`.
 * - Hover brightens hex fill slightly; outline stays faint for readability.
 * - Content remains clickable by using pointer-events re-enable on children.
 */
const cn = (...c) => c.filter(Boolean).join(" ");

export default function HexagonBackground({
  className,
  children,
  hexagonProps,
  hexagonSize = 80,        // px (>=50 looks best)
  hexagonGap = 2,          // px visual gap between outline and fill
  intensity = 0.06,        // 0..1 base fill alpha (subtle but visible)
  outline = 0.12,          // 0..1 outline alpha
  gridOpacity = 0.22,      // 0..1 transparency for the WHOLE grid layer
  blendMode = "normal",    // 'normal' | 'soft-light' | 'overlay' | etc.
  useContainerSize = true, // use container rect instead of window for layout
  ...props
}) {
  const containerRef = useRef(null);

  // Dimensions
  const hexW = hexagonSize;
  const hexH = hexagonSize * 1.1;       // balanced height
  const rowSpacing = hexagonSize * 0.8; // honeycomb vertical spacing

  // Staggered offsets per row
  const oddRowMarginLeft = -(hexagonSize / 2);
  const evenRowMarginLeft = hexagonGap / 2;

  const [grid, setGrid] = useState({ rows: 0, cols: 0 });

  const updateGrid = useCallback(() => {
    let width, height;
    if (useContainerSize && containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      width = r.width;
      height = r.height;
    } else {
      width = window.innerWidth;
      height = window.innerHeight;
    }
    // Pad edges so you don’t see gaps during resize
    const rows = Math.ceil(height / rowSpacing) + 4;
    const cols = Math.ceil(width / hexW) + 2;
    setGrid({ rows, cols });
  }, [rowSpacing, hexW, useContainerSize]);

  useEffect(() => {
    updateGrid();
    if (useContainerSize && containerRef.current && "ResizeObserver" in window) {
      const ro = new ResizeObserver(updateGrid);
      ro.observe(containerRef.current);
      return () => ro.disconnect();
    } else {
      window.addEventListener("resize", updateGrid);
      return () => window.removeEventListener("resize", updateGrid);
    }
  }, [updateGrid, useContainerSize]);

  // Clamp alphas safely
  const outlineAlpha = Math.max(0, Math.min(1, outline));
  const fillAlpha = Math.max(0, Math.min(1, intensity));
  const layerOpacity = Math.max(0, Math.min(1, gridOpacity));

  return (
    <div
      ref={containerRef}
      data-slot="hexagon-background"
      className={cn(
        "relative w-full h-full overflow-hidden",
        // Transparent so the parent/page bg shows through behind the grid
        "bg-transparent",
        className
      )}
      style={{
        "--hex-gap": `${hexagonGap}px`,
        "--hex-outline-a": outlineAlpha,
        "--hex-fill-a": fillAlpha,
      }}
      {...props}
    >
      {/* HEX GRID (below content) */}
      <div
        className="absolute inset-0 overflow-hidden z-0"
        style={{ opacity: layerOpacity, mixBlendMode: blendMode }}
      >
        {Array.from({ length: grid.rows }).map((_, r) => (
          <div
            key={`row-${r}`}
            className="inline-flex"
            style={{
              marginTop: -Math.max(0, 0.45 * hexagonSize), // tighter vertical pack
              marginLeft: (r % 2 === 0 ? evenRowMarginLeft : oddRowMarginLeft),
              height: rowSpacing,
            }}
          >
            {Array.from({ length: grid.cols }).map((_, c) => (
              <div
                key={`hex-${r}-${c}`}
                {...hexagonProps}
                style={{
                  width: hexW,
                  height: hexH,
                  marginLeft: hexagonGap,
                  ...(hexagonProps?.style || {}),
                }}
                className={cn(
                  "relative",
                  // Hex clip
                  "[clip-path:polygon(50%_0%,_100%_25%,_100%_75%,_50%_100%,_0%_75%,_0%_25%)]",

                  // OUTER: outline ring (before)
                  "before:content-[''] before:absolute before:inset-0",
                  "before:bg-transparent",
                  // crisp inset outline; theme-aware via separate rules
                  "before:[box-shadow:inset_0_0_0_1px_rgba(0,0,0,var(--hex-outline-a))] dark:before:[box-shadow:inset_0_0_0_1px_rgba(255,255,255,var(--hex-outline-a))]",
                  "before:transition-transform before:duration-150",

                  // INNER: fill panel (after)
                  "after:content-[''] after:absolute",
                  "after:inset-[var(--hex-gap)]",
                  "after:[clip-path:inherit]",
                  // light mode: subtle dark fill; dark mode: subtle light fill
                  "after:bg-[rgba(0,0,0,var(--hex-fill-a))] dark:after:bg-[rgba(255,255,255,var(--hex-fill-a))]",
                  "after:transition-colors after:duration-150",

                  // Hover: bump fill & a tiny outline pulse
                  "hover:after:[--hex-fill-a:0.30] dark:hover:after:[--hex-fill-a:0.26]",
                  "hover:before:scale-105",

                  "will-change-transform",

                  hexagonProps?.className
                )}
              />
            ))}
          </div>
        ))}
      </div>

      {/* CONTENT (above).
          Wrapper is pointer-events-none so hexes still get hover;
          opt back in for interactive children via .pointer-events-auto */}
      <div className="relative z-10 pointer-events-none">
        {children}
      </div>
    </div>
  );
}
