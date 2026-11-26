"use client";

import { useEffect, useRef } from "react";
import { barLevels, shouldDraw } from "@/lib/media/visualizer";

const BAR_COUNT = 24;

function readColor(el: HTMLElement, name: string, fallback: string): string {
  const value = getComputedStyle(el).getPropertyValue(name).trim();
  return value || fallback;
}

/**
 * Decorative visualizer (no audio access — the sound lives in YouTube's
 * iframe). Animates at ~30fps only while `running`; otherwise, and under
 * reduced motion, it draws one static frame. Colors come from the design
 * tokens through CSS variables on the canvas.
 */
export function Visualizer({ running, reduced, label }: { running: boolean; reduced: boolean; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext("2d");
    } catch {
      ctx = null;
    }
    if (!ctx) return;
    const context = ctx;
    const low = readColor(canvas, "--viz-low", "#2fb52f");
    const high = readColor(canvas, "--viz-high", "#f8b330");
    const animate = running && !reduced;

    function draw(levels: number[]) {
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.round(canvas!.clientWidth * dpr));
      const height = Math.max(1, Math.round(canvas!.clientHeight * dpr));
      if (canvas!.width !== width) canvas!.width = width;
      if (canvas!.height !== height) canvas!.height = height;
      context.clearRect(0, 0, width, height);
      const gap = 2 * dpr;
      const barWidth = (width - gap * (levels.length - 1)) / levels.length;
      const gradient = context.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, low);
      gradient.addColorStop(1, high);
      context.fillStyle = gradient;
      levels.forEach((level, i) => {
        const h = Math.max(2 * dpr, level * height);
        context.fillRect(i * (barWidth + gap), height - h, barWidth, h);
      });
    }

    if (!animate) {
      // Static frame: a still "spectrum" while playing under reduced motion,
      // flat bars otherwise.
      draw(running ? barLevels(0, BAR_COUNT) : new Array(BAR_COUNT).fill(0.05));
      return;
    }

    let frame = 0;
    let last = -Infinity;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (document.hidden || !shouldDraw(now, last)) return;
      last = now;
      draw(barLevels(now, BAR_COUNT));
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, reduced]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      data-visualizer={running ? (reduced ? "static" : "animated") : "idle"}
      className="block h-full w-full [--viz-high:var(--color-hot)] [--viz-low:var(--color-progress)]"
    />
  );
}
