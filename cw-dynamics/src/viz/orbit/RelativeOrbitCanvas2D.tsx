import { useEffect, useRef } from 'react';
import { useCwStore } from '../../store/cwStore';
import { propagate } from '../../core/dynamics/cw';
import { SERIES_DRIFT, SERIES_FULL, SERIES_IN_PLANE, TEXT_MUTED } from '../charts/theme';

interface Point {
  x: number;
  y: number;
}

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Plots the relative trajectory in the radial (x, horizontal) vs along-track (y, vertical)
 * LVLH plane — the same axes as the course's `clohessy_wiltshire.m` animatedline plot. Reads
 * the simulation imperatively every animation frame instead of subscribing through React/
 * Zustand, matching double-pendulum-modes' PendulumCanvas (a Recharts-style reactive re-render
 * at 60fps causes visible frame drops).
 */
export function RelativeOrbitCanvas2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boundsRef = useRef<{ resetToken: number; bounds: Bounds } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    let frameId: number;

    const draw = () => {
      frameId = requestAnimationFrame(draw);
      const { x0, n, currentTime, timeSeries, resetToken, showFull, showDrift, showInPlane } =
        useCwStore.getState();

      const width = canvas.width;
      const height = canvas.height;
      if (width === 0 || height === 0) return;

      if (!boundsRef.current || boundsRef.current.resetToken !== resetToken) {
        let minX = 0;
        let maxX = 0;
        let minY = 0;
        let maxY = 0;
        for (const series of [timeSeries.full, timeSeries.drift, timeSeries.inPlane]) {
          for (const s of series) {
            minX = Math.min(minX, s.x);
            maxX = Math.max(maxX, s.x);
            minY = Math.min(minY, s.y);
            maxY = Math.max(maxY, s.y);
          }
        }
        boundsRef.current = { resetToken, bounds: { minX, maxX, minY, maxY } };
      }
      const { minX, maxX, minY, maxY } = boundsRef.current.bounds;
      const spanX = Math.max(maxX - minX, 1);
      const spanY = Math.max(maxY - minY, 1);
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const scale = Math.min(width / (spanX * 1.3), height / (spanY * 1.3));
      const originX = width / 2 - centerX * scale;
      const originY = height / 2 + centerY * scale;
      // Radial (x) on the horizontal axis, along-track (y) on the vertical axis, matching the
      // MATLAB script's plot(x(:,1), x(:,2)) — screen-y grows downward, so along-track is flipped.
      const toCanvas = (px: number, py: number): Point => ({ x: originX + px * scale, y: originY - py * scale });

      ctx.clearRect(0, 0, width, height);

      const drawPath = (series: { x: number; y: number }[], color: string, dash: number[] = []) => {
        if (series.length < 2) return;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash(dash);
        ctx.beginPath();
        const p0 = toCanvas(series[0].x, series[0].y);
        ctx.moveTo(p0.x, p0.y);
        for (let i = 1; i < series.length; i++) {
          const p = toCanvas(series[i].x, series[i].y);
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      };

      if (showInPlane) drawPath(timeSeries.inPlane, SERIES_IN_PLANE, [6, 4]);
      if (showDrift) drawPath(timeSeries.drift, SERIES_DRIFT, [2, 4]);
      if (showFull) drawPath(timeSeries.full, SERIES_FULL);

      // Chief satellite, fixed at the LVLH origin.
      const chief = toCanvas(0, 0);
      ctx.fillStyle = TEXT_MUTED;
      ctx.beginPath();
      ctx.arc(chief.x, chief.y, 5, 0, 2 * Math.PI);
      ctx.fill();

      const full = propagate(x0, n, currentTime);
      if (showFull) {
        const p = toCanvas(full.x, full.y);
        ctx.fillStyle = SERIES_FULL;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI);
        ctx.fill();
      }
    };

    frameId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="orbit-canvas" />;
}
