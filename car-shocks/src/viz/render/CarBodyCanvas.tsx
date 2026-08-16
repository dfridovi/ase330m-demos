import { useEffect, useRef } from 'react';
import { useCarShocksStore } from '../../store/carShocksStore.ts';
import { sampleSeriesAt } from '../sampleSeries.ts';
import { SLIDER_RANGES } from '../../core/constants.ts';
import {
  CANVAS_BODY,
  CANVAS_DASHPOT,
  CANVAS_FORCE,
  CANVAS_GROUND,
  CANVAS_SPRING,
  CANVAS_WHEEL,
  TEXT_MUTED,
} from '../charts/theme.ts';

// Dynamic spring extension is on the order of centimeters; scale it up so the bounce is
// visible against the fixed wheel/ground geometry below.
const PIXELS_PER_METER = 400;

// Half-length, in pixels, of the force bar at the slider's max magnitude.
const FORCE_BAR_SCALE_PX = 60;
const FORCE_BAR_WIDTH = 10;
// The impulse itself has no finite instantaneous value (it's a Dirac delta) — instead, flash
// the bar at (near) full height for a brief window right after t=0 to depict "the whack",
// sized relative to the impulse magnitude I rather than a force in Newtons.
const IMPULSE_FLASH_DURATION = 0.08;

function drawForceBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  baselineY: number,
  value: number,
  maxMagnitude: number,
  label: string,
) {
  const fraction = Math.max(-1, Math.min(1, value / maxMagnitude));
  const length = fraction * FORCE_BAR_SCALE_PX;

  ctx.strokeStyle = TEXT_MUTED;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 10, baselineY);
  ctx.lineTo(x + 10, baselineY);
  ctx.stroke();

  ctx.fillStyle = CANVAS_FORCE;
  const barTop = length >= 0 ? baselineY : baselineY + length;
  ctx.fillRect(x - FORCE_BAR_WIDTH / 2, barTop, FORCE_BAR_WIDTH, Math.abs(length));

  ctx.fillStyle = TEXT_MUTED;
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, baselineY + FORCE_BAR_SCALE_PX + 16);
  ctx.textAlign = 'start';
}

function drawZigzag(
  ctx: CanvasRenderingContext2D,
  x: number,
  yTop: number,
  yBottom: number,
  coils: number,
  amplitude: number,
) {
  const length = yBottom - yTop;
  const step = length / (coils * 2);
  ctx.beginPath();
  ctx.moveTo(x, yTop);
  for (let i = 0; i <= coils * 2; i++) {
    const y = yTop + i * step;
    const dx = i % 2 === 0 ? -amplitude : amplitude;
    ctx.lineTo(x + dx, y);
  }
  ctx.lineTo(x, yBottom);
  ctx.stroke();
}

function drawDashpot(ctx: CanvasRenderingContext2D, x: number, yTop: number, yBottom: number) {
  const cylinderHeight = (yBottom - yTop) * 0.55;
  const cylinderTop = yTop + (yBottom - yTop) * 0.2;
  const halfWidth = 8;

  // Rod from the body down into the cylinder.
  ctx.beginPath();
  ctx.moveTo(x, yTop);
  ctx.lineTo(x, cylinderTop + cylinderHeight * 0.4);
  ctx.stroke();

  // Cylinder body.
  ctx.strokeRect(x - halfWidth, cylinderTop, halfWidth * 2, cylinderHeight);

  // Rod from the cylinder down to the wheel.
  ctx.beginPath();
  ctx.moveTo(x, cylinderTop + cylinderHeight);
  ctx.lineTo(x, yBottom);
  ctx.stroke();
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  x: number,
  force: { value: number; maxMagnitude: number; label: string } | null,
) {
  const groundY = height - 36;
  const wheelRadius = 22;
  const wheelCenterX = width / 2;
  const wheelCenterY = groundY - wheelRadius;
  const bodyWidth = Math.min(180, width * 0.5);
  const bodyHeight = 46;
  const bodyEquilibriumTopY = height * 0.3;
  const bodyTopY = bodyEquilibriumTopY + PIXELS_PER_METER * x;
  const bodyBottomY = bodyTopY + bodyHeight;
  const linkTopY = bodyBottomY;
  const linkBottomY = wheelCenterY - wheelRadius;

  // Ground.
  ctx.strokeStyle = CANVAS_GROUND;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(wheelCenterX - 150, groundY);
  ctx.lineTo(wheelCenterX + 150, groundY);
  ctx.stroke();

  // Wheel.
  ctx.fillStyle = CANVAS_WHEEL;
  ctx.beginPath();
  ctx.arc(wheelCenterX, wheelCenterY, wheelRadius, 0, Math.PI * 2);
  ctx.fill();

  // Spring (left of center).
  ctx.strokeStyle = CANVAS_SPRING;
  ctx.lineWidth = 2;
  drawZigzag(ctx, wheelCenterX - 32, linkTopY, linkBottomY, 6, 10);

  // Dashpot (right of center).
  ctx.strokeStyle = CANVAS_DASHPOT;
  ctx.lineWidth = 2;
  drawDashpot(ctx, wheelCenterX + 32, linkTopY, linkBottomY);

  // Car body.
  ctx.fillStyle = CANVAS_BODY;
  ctx.fillRect(wheelCenterX - bodyWidth / 2, bodyTopY, bodyWidth, bodyHeight);

  // Applied force (left of the spring/dashpot/body group), baselined at the body's
  // equilibrium center so it reads relative to the car's resting height.
  if (force) {
    const barX = Math.max(30, wheelCenterX - bodyWidth / 2 - 45);
    const baselineY = bodyEquilibriumTopY + bodyHeight / 2;
    drawForceBar(ctx, barX, baselineY, force.value, force.maxMagnitude, force.label);
  }
}

export function CarBodyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;

    const draw = () => {
      const state = useCarShocksStore.getState();
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      ctx.clearRect(0, 0, width, height);

      if (state.activeTab === 'frequency') {
        // Frozen at equilibrium — the caption explaining why lives in PlaybackControls,
        // which renders in this tab's place in the layout below the canvas.
        drawScene(ctx, width, height, 0, null);
      } else if (state.activeTab === 'impulse') {
        const point = sampleSeriesAt(state.impulseSeries, state.currentTime);
        // The impulse has no finite instantaneous force — flash the bar near-full-height
        // for a brief window right after t=0 to depict "the whack" instead.
        const flashValue =
          state.currentTime < IMPULSE_FLASH_DURATION ? state.I : 0;
        drawScene(ctx, width, height, point.x, {
          value: flashValue,
          maxMagnitude: SLIDER_RANGES.I.max,
          label: flashValue !== 0 ? `impulse! I = ${state.I.toFixed(0)} N·s` : 'f(t)',
        });
      } else {
        const series = state.activeTab === 'periodic' ? state.periodicSeries : state.stepSeries;
        const point = sampleSeriesAt(series, state.currentTime);
        drawScene(ctx, width, height, point.x, {
          value: point.f,
          maxMagnitude: SLIDER_RANGES.f0.max,
          label: `f(t) = ${point.f.toFixed(0)} N`,
        });
      }

      frameId = requestAnimationFrame(draw);
    };

    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return <canvas ref={canvasRef} className="car-canvas" />;
}
