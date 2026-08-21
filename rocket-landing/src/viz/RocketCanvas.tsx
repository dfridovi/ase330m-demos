import { useEffect, useRef, type PointerEvent } from 'react';
import { useRocketLandingStore } from '../store/rocketLandingStore.ts';
import { DRAG_BOUNDS, LENGTH, PAD_X, PAD_Y, TAU_MAX, T_MAX } from '../core/constants.ts';
import {
  CANVAS_BODY,
  CANVAS_CRASHED,
  CANVAS_GROUND,
  CANVAS_LANDED,
  CANVAS_PAD,
  CANVAS_PLUME,
  CANVAS_PREVIEW,
  CANVAS_RCS,
  CANVAS_TRAIL,
  TEXT_MUTED,
} from './charts/theme.ts';

const HALF_LENGTH_M = LENGTH / 2;
const HALF_WIDTH_M = LENGTH * 0.12;
const HIT_RADIUS_PX = 40;
const MAX_PLUME_PX = 60;
const MAX_RCS_PX = 22;
const MARGIN_PX = 60;
const TOP_MARGIN_PX = 40;
const BOTTOM_MARGIN_PX = 40;

// (px, py) is the rocket's center, so its tail sits HALF_LENGTH_M below py -- draw the ground and
// pad there instead of at py = PAD_Y itself, so touchdown reads as "tail resting on the pad"
// rather than the pad line cutting through the middle of the rocket.
const GROUND_OFFSET_M = HALF_LENGTH_M;
const PAD_HALF_WIDTH_M = 2.5;
const PAD_THICKNESS_PX = 10;

interface Transform {
  scale: number; // pixels per meter
  originX: number;
  groundY: number; // pixel y of world py = 0 (not the visual ground line -- see GROUND_OFFSET_M)
}

function computeTransform(width: number, height: number): Transform {
  // The visible vertical extent runs from the visual ground line (world y = -GROUND_OFFSET_M) up
  // to DRAG_BOUNDS.pyMax, so the scale has to account for that extra room below py = 0, not just
  // pyMax -- otherwise the ground/pad would be pushed at or past the bottom edge of the canvas.
  const verticalWorldSpan = DRAG_BOUNDS.pyMax + GROUND_OFFSET_M;
  const scale = Math.min(
    (height - TOP_MARGIN_PX - BOTTOM_MARGIN_PX) / verticalWorldSpan,
    (width - MARGIN_PX) / (2 * DRAG_BOUNDS.pxMax),
  );
  const groundY = height - BOTTOM_MARGIN_PX - GROUND_OFFSET_M * scale;
  return { scale, originX: width / 2, groundY };
}

function worldToPixel(t: Transform, px: number, py: number): { x: number; y: number } {
  return { x: t.originX + px * t.scale, y: t.groundY - py * t.scale };
}

function pixelToWorld(t: Transform, x: number, y: number): { px: number; py: number } {
  return { px: (x - t.originX) / t.scale, py: (t.groundY - y) / t.scale };
}

/** Rotates a body-local offset (lx along the body's "right", ly along the nose direction) into
 * a world-frame (x right, y up) offset, given theta measured from vertical -- see
 * ../core/dynamics/rocket.ts's doc comment for the same (sin theta, cos theta) nose convention. */
function bodyToWorldOffset(theta: number, lx: number, ly: number): { dx: number; dy: number } {
  return { dx: lx * Math.cos(theta) + ly * Math.sin(theta), dy: -lx * Math.sin(theta) + ly * Math.cos(theta) };
}

function drawGroundAndPad(ctx: CanvasRenderingContext2D, t: Transform, width: number) {
  const ground = worldToPixel(t, 0, -GROUND_OFFSET_M);
  ctx.strokeStyle = CANVAS_GROUND;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, ground.y);
  ctx.lineTo(width, ground.y);
  ctx.stroke();

  // A bolder platform segment, straddling the ground line, marks the pad itself against the
  // plain ground line -- noticeably wider than the rocket body so it reads as a launchpad, not
  // just a boundary marker.
  const pad = worldToPixel(t, PAD_X, PAD_Y - GROUND_OFFSET_M);
  const padHalfWidthPx = PAD_HALF_WIDTH_M * t.scale;
  ctx.fillStyle = CANVAS_PAD;
  ctx.fillRect(pad.x - padHalfWidthPx, pad.y - PAD_THICKNESS_PX * 0.7, padHalfWidthPx * 2, PAD_THICKNESS_PX);
}

function drawPath(ctx: CanvasRenderingContext2D, t: Transform, points: number[][], color: string, dashed: boolean) {
  if (points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  if (dashed) ctx.setLineDash([5, 4]);
  ctx.beginPath();
  const first = worldToPixel(t, points[0][0], points[0][1]);
  ctx.moveTo(first.x, first.y);
  for (const p of points.slice(1)) {
    const px = worldToPixel(t, p[0], p[1]);
    ctx.lineTo(px.x, px.y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawRocket(
  ctx: CanvasRenderingContext2D,
  t: Transform,
  px: number,
  py: number,
  theta: number,
  thrust: number,
  torque: number,
  color: string,
) {
  const toPixel = (lx: number, ly: number) => {
    const { dx, dy } = bodyToWorldOffset(theta, lx, ly);
    return worldToPixel(t, px + dx, py + dy);
  };

  const nose = toPixel(0, HALF_LENGTH_M);
  const tailLeft = toPixel(-HALF_WIDTH_M, -HALF_LENGTH_M);
  const tailRight = toPixel(HALF_WIDTH_M, -HALF_LENGTH_M);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(nose.x, nose.y);
  ctx.lineTo(tailLeft.x, tailLeft.y);
  ctx.lineTo(tailRight.x, tailRight.y);
  ctx.closePath();
  ctx.fill();

  // Main plume out the tail, length/opacity scaled by T/T_MAX.
  const thrustFraction = Math.max(0, Math.min(1, thrust / T_MAX));
  if (thrustFraction > 0.01) {
    const plumeLenM = (thrustFraction * MAX_PLUME_PX) / t.scale;
    const plumeTip = toPixel(0, -HALF_LENGTH_M - plumeLenM);
    const plumeLeft = toPixel(-HALF_WIDTH_M * 0.7, -HALF_LENGTH_M);
    const plumeRight = toPixel(HALF_WIDTH_M * 0.7, -HALF_LENGTH_M);
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.5 * thrustFraction;
    ctx.fillStyle = CANVAS_PLUME;
    ctx.beginPath();
    ctx.moveTo(plumeLeft.x, plumeLeft.y);
    ctx.lineTo(plumeTip.x, plumeTip.y);
    ctx.lineTo(plumeRight.x, plumeRight.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Perpendicular RCS burst near the tail, sized by |tau|/TAU_MAX, on the side matching its sign.
  const torqueFraction = Math.max(-1, Math.min(1, torque / TAU_MAX));
  if (Math.abs(torqueFraction) > 0.02) {
    const side = Math.sign(torqueFraction);
    const burstLenM = (Math.abs(torqueFraction) * MAX_RCS_PX) / t.scale;
    const base = toPixel(side * HALF_WIDTH_M, -HALF_LENGTH_M * 0.6);
    const tip = toPixel(side * (HALF_WIDTH_M + burstLenM), -HALF_LENGTH_M * 0.6);
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = CANVAS_RCS;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(base.x, base.y);
    ctx.lineTo(tip.x, tip.y);
    ctx.stroke();
    ctx.restore();
  }
}

export function RocketCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      ctx.clearRect(0, 0, width, height);

      const t = computeTransform(width, height);
      const state = useRocketLandingStore.getState();
      const [px, py, theta] = state.rti.realState;
      const [T, tau] = state.lastAppliedControl;

      drawGroundAndPad(ctx, t, width);

      const previewPoints = state.rti.nominalTrajectory.states.map((x) => [x[0], x[1]]);
      drawPath(ctx, t, previewPoints, CANVAS_PREVIEW, true);
      drawPath(
        ctx,
        t,
        state.trail.map((p) => [p.px, p.py]),
        CANVAS_TRAIL,
        false,
      );

      const bodyColor =
        state.rti.landingStatus === 'landed'
          ? CANVAS_LANDED
          : state.rti.landingStatus === 'crashed'
            ? CANVAS_CRASHED
            : CANVAS_BODY;
      const flying = state.rti.landingStatus === 'flying';
      drawRocket(ctx, t, px, py, theta, flying ? T : 0, flying ? tau : 0, bodyColor);

      if (state.rti.landingStatus !== 'flying') {
        ctx.fillStyle = state.rti.landingStatus === 'landed' ? CANVAS_LANDED : CANVAS_CRASHED;
        ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(state.rti.landingStatus === 'landed' ? 'LANDED' : 'CRASHED', width / 2, 32);
        ctx.textAlign = 'start';
      } else if (!state.isPlaying) {
        ctx.fillStyle = TEXT_MUTED;
        ctx.font = '12px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Drag the rocket or press Play', width / 2, 20);
        ctx.textAlign = 'start';
      }

      frameId = requestAnimationFrame(draw);
    };

    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const t = computeTransform(canvas.clientWidth, canvas.clientHeight);
    const [px, py] = useRocketLandingStore.getState().rti.realState;
    const rocketPixel = worldToPixel(t, px, py);
    const dist = Math.hypot(x - rocketPixel.x, y - rocketPixel.y);
    if (dist > HIT_RADIUS_PX) return;

    draggingRef.current = true;
    canvas.setPointerCapture(e.pointerId);
    useRocketLandingStore.getState().beginDrag();
  };

  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const t = computeTransform(canvas.clientWidth, canvas.clientHeight);
    const { px, py } = pixelToWorld(t, x, y);
    useRocketLandingStore.getState().dragTo(px, py);
  };

  const endDrag = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    canvasRef.current?.releasePointerCapture(e.pointerId);
    useRocketLandingStore.getState().endDrag();
  };

  return (
    <canvas
      ref={canvasRef}
      className="rocket-canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    />
  );
}
