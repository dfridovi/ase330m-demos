import { useEffect, useRef } from 'react';
import { CAPTURE_THRESHOLD_M, useRendezvousStore } from '../../store/rendezvousStore';
import { sampleTrajectory } from '../../core/sim/interpolate';
import { BURN_ARROW, CAPTURE_RING, SERIES_CURRENT, SERIES_NAIVE, SERIES_OPEN_LOOP, SERIES_TUNED, TEXT_MUTED } from '../charts/theme';

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

// A burn of METERS_SCALE_2D * |u| (m) is drawn from the chaser, in the u direction -- chosen so
// the ~0.01-0.03 m/s^2 initial burns for the default preset read as a clearly visible fraction
// of the ~1000m plot span without a custom K's much smaller steady-state corrections vanishing
// entirely (the MIN_ARROW_PX floor below handles that).
const METERS_SCALE_2D = 5000;
const MIN_ARROW_PX = 10;
const ARROWHEAD_PX = 7;

/**
 * Plots the closed-loop trajectory in the radial (x, horizontal) vs along-track (y, vertical)
 * LVLH plane, same imperative-canvas/rAF pattern as
 * cw-dynamics/src/viz/orbit/RelativeOrbitCanvas2D.tsx (a Recharts-style reactive re-render at
 * 60fps causes visible frame drops). Overlays the naive/tuned reference gains and the
 * uncontrolled (open-loop) baseline as ghost paths/markers, and draws the current burn
 * (magnitude + direction of u) as an arrow from the chaser -- the spatial complement to the
 * effort chart's "your gain vs. everyone else" comparison.
 */
export function RendezvousCanvas2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boundsRef = useRef<{ resetToken: number; bounds: Bounds } | null>(null);
  const stateSample = useRef<number[]>([0, 0, 0, 0, 0, 0]);
  const ghostSample = useRef<number[]>([0, 0, 0, 0, 0, 0]);
  const uSample = useRef<number[]>([0, 0, 0]);

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
      const { current, naive, tuned, openLoop, currentTime, resetToken } = useRendezvousStore.getState();
      const series = current.trajectory.x;

      const width = canvas.width;
      const height = canvas.height;
      if (width === 0 || height === 0) return;

      // Bounds come from the current (student) trajectory only -- the reference/open-loop
      // overlays are drawn regardless of how far they run and simply clip at the canvas edge.
      // A divergent open loop dominating the auto-scale would shrink the one trajectory a
      // student is actually trying to read down to an unreadable dot.
      if (!boundsRef.current || boundsRef.current.resetToken !== resetToken) {
        let minX = -CAPTURE_THRESHOLD_M;
        let maxX = CAPTURE_THRESHOLD_M;
        let minY = -CAPTURE_THRESHOLD_M;
        let maxY = CAPTURE_THRESHOLD_M;
        for (const s of series) {
          minX = Math.min(minX, s[0]);
          maxX = Math.max(maxX, s[0]);
          minY = Math.min(minY, s[1]);
          maxY = Math.max(maxY, s[1]);
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
      // Radial (x) on the horizontal axis, along-track (y) on the vertical axis -- screen-y
      // grows downward, so along-track is flipped.
      const toCanvas = (px: number, py: number): Point => ({ x: originX + px * scale, y: originY - py * scale });

      ctx.clearRect(0, 0, width, height);

      // Capture-threshold circle around the chief.
      const chief = toCanvas(0, 0);
      ctx.strokeStyle = CAPTURE_RING;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(chief.x, chief.y, CAPTURE_THRESHOLD_M * scale, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      const drawPath = (points: number[][], color: string, dash: number[]) => {
        if (points.length < 2) return;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash(dash);
        ctx.beginPath();
        const p0 = toCanvas(points[0][0], points[0][1]);
        ctx.moveTo(p0.x, p0.y);
        for (let i = 1; i < points.length; i++) {
          const p = toCanvas(points[i][0], points[i][1]);
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      };

      const drawGhostMarker = (trajectory: typeof current.trajectory, color: string) => {
        const sample = sampleTrajectory(trajectory, currentTime, ghostSample.current);
        const p = toCanvas(sample[0], sample[1]);
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1;
      };

      // Reference overlays first (dimmer, drawn under the current trajectory).
      drawPath(openLoop.trajectory.x, SERIES_OPEN_LOOP, [1, 4]);
      drawPath(naive.trajectory.x, SERIES_NAIVE, [6, 4]);
      drawPath(tuned.trajectory.x, SERIES_TUNED, [2, 3]);
      drawGhostMarker(openLoop.trajectory, SERIES_OPEN_LOOP);
      drawGhostMarker(naive.trajectory, SERIES_NAIVE);
      drawGhostMarker(tuned.trajectory, SERIES_TUNED);

      // The student's own trajectory, drawn solid and on top.
      drawPath(series, SERIES_CURRENT, []);

      // Chief satellite, fixed at the LVLH origin.
      ctx.fillStyle = TEXT_MUTED;
      ctx.beginPath();
      ctx.arc(chief.x, chief.y, 5, 0, 2 * Math.PI);
      ctx.fill();

      const sample = sampleTrajectory(current.trajectory, currentTime, stateSample.current);
      const p = toCanvas(sample[0], sample[1]);
      ctx.fillStyle = SERIES_CURRENT;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI);
      ctx.fill();

      // Burn vector: direction + magnitude of u, projected onto this plane.
      const u = sampleTrajectory({ t: current.trajectory.t, x: current.u }, currentTime, uSample.current);
      const uMag = Math.hypot(u[0], u[1]);
      if (uMag > 1e-12) {
        const tipPhysical = toCanvas(sample[0] + u[0] * METERS_SCALE_2D, sample[1] + u[1] * METERS_SCALE_2D);
        let dx = tipPhysical.x - p.x;
        let dy = tipPhysical.y - p.y;
        const pixelLen = Math.hypot(dx, dy);
        if (pixelLen < MIN_ARROW_PX) {
          const s = MIN_ARROW_PX / pixelLen;
          dx *= s;
          dy *= s;
        }
        const tip = { x: p.x + dx, y: p.y + dy };
        const angle = Math.atan2(dy, dx);

        ctx.strokeStyle = BURN_ARROW;
        ctx.fillStyle = BURN_ARROW;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(tip.x, tip.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(tip.x, tip.y);
        ctx.lineTo(
          tip.x - ARROWHEAD_PX * Math.cos(angle - Math.PI / 7),
          tip.y - ARROWHEAD_PX * Math.sin(angle - Math.PI / 7),
        );
        ctx.lineTo(
          tip.x - ARROWHEAD_PX * Math.cos(angle + Math.PI / 7),
          tip.y - ARROWHEAD_PX * Math.sin(angle + Math.PI / 7),
        );
        ctx.closePath();
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
