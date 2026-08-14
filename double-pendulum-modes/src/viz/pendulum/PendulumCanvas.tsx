import { useEffect, useRef } from 'react';
import { usePendulumStore } from '../../store/pendulumStore.ts';
import { sampleTrajectory } from '../../core/sim/interpolate.ts';
import { bobPositions } from '../../core/dynamics/kinematics.ts';
import { SERIES_FULL, SERIES_MODE_1, SERIES_MODE_2, TEXT_MUTED } from '../charts/theme.ts';

interface Point {
  x: number;
  y: number;
}

interface Trace {
  color: string;
  visible: boolean;
  trail: Point[];
}

const TRAIL_LENGTH = 90; // ~1.5s of trail at 60fps, enough to show the outer bob's path shape

/**
 * Draws the pendulum(s) on a 2D canvas, reading the simulation imperatively every animation
 * frame instead of subscribing through React/Zustand — a Recharts-style reactive re-render at
 * 60fps causes visible frame drops (see useThrottledTime.ts's note on the chart playhead), and
 * a canvas redraw doesn't need React's reconciliation in the first place.
 */
export function PendulumCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tracesRef = useRef<Trace[]>([
    { color: SERIES_FULL, visible: true, trail: [] },
    { color: SERIES_MODE_1, visible: true, trail: [] },
    { color: SERIES_MODE_2, visible: true, trail: [] },
  ]);

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
    let lastResetToken: number | undefined;

    const draw = () => {
      frameId = requestAnimationFrame(draw);
      const { physicalParams, modal, currentTime, showFull, showMode1, showMode2, resetToken } =
        usePendulumStore.getState();
      const traces = tracesRef.current;
      traces[0].visible = showFull;
      traces[1].visible = showMode1;
      traces[2].visible = showMode2;

      const width = canvas.width;
      const height = canvas.height;
      if (width === 0 || height === 0) return;

      if (lastResetToken !== resetToken) {
        traces.forEach((t) => (t.trail = []));
        lastResetToken = resetToken;
      }

      const { l1, l2 } = physicalParams;
      const maxReach = l1 + l2;
      const scale = Math.min(width / (2 * maxReach * 1.2), height / (maxReach * 1.35));
      const originX = width / 2;
      const originY = height * 0.12;
      const toCanvas = (x: number, y: number): Point => ({ x: originX + x * scale, y: originY - y * scale });

      ctx.clearRect(0, 0, width, height);

      const trajectories = [modal.fullResponse, ...modal.modeResponses];
      const bobPositionsByTrace = trajectories.map((trajectory) => {
        const state = sampleTrajectory(trajectory, currentTime);
        const { x1, y1, x2, y2 } = bobPositions(state[0], state[1], l1, l2);
        return { p1: toCanvas(x1, y1), p2: toCanvas(x2, y2) };
      });

      traces.forEach((trace, i) => {
        const positions = bobPositionsByTrace[i];
        if (!positions) return;
        if (trace.visible) {
          trace.trail.push(positions.p2);
          if (trace.trail.length > TRAIL_LENGTH) trace.trail.shift();
        } else if (trace.trail.length) {
          trace.trail = [];
        }
      });

      // Trails first (underneath the rods/bobs), then pivot, then rods+bobs on top.
      traces.forEach((trace) => {
        if (!trace.visible || trace.trail.length < 2) return;
        ctx.strokeStyle = trace.color;
        ctx.lineWidth = 1.5;
        for (let k = 1; k < trace.trail.length; k++) {
          ctx.globalAlpha = (k / trace.trail.length) * 0.5;
          ctx.beginPath();
          ctx.moveTo(trace.trail[k - 1].x, trace.trail[k - 1].y);
          ctx.lineTo(trace.trail[k].x, trace.trail[k].y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      });

      ctx.fillStyle = TEXT_MUTED;
      ctx.beginPath();
      ctx.arc(originX, originY, 4, 0, 2 * Math.PI);
      ctx.fill();

      traces.forEach((trace, i) => {
        if (!trace.visible) return;
        const { p1, p2 } = bobPositionsByTrace[i];

        ctx.strokeStyle = trace.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        ctx.fillStyle = trace.color;
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p2.x, p2.y, 8, 0, 2 * Math.PI);
        ctx.fill();
      });
    };

    frameId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="pendulum-canvas" />;
}
