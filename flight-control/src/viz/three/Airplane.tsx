import { forwardRef, useMemo } from 'react';
import { ExtrudeGeometry, Group, Shape } from 'three';
import type { AirframeVisualStyle } from '../../core/types/aircraft.ts';

export interface AirplaneGeometry {
  /** Visual wingspan (m), derived from wing area / mean chord (S = b * c-bar for a rectangular wing). */
  wingSpan: number;
  meanChord: number;
  style: AirframeVisualStyle;
}

const DEG_TO_RAD = Math.PI / 180;

/** A symmetric, tapered, swept panel spanning +-halfSpan — used for the main wing and
 * horizontal tail. Authored in (chordwise, spanwise) plane, then extruded for thickness. */
function buildSpanwisePanelGeometry(
  span: number,
  rootChord: number,
  taperRatio: number,
  sweepDeg: number,
  thickness: number,
) {
  const halfSpan = span / 2;
  const tipChord = rootChord * taperRatio;
  const sweepOffset = halfSpan * Math.tan(sweepDeg * DEG_TO_RAD);
  const shape = new Shape();
  shape.moveTo(sweepOffset, -halfSpan);
  shape.lineTo(0, 0);
  shape.lineTo(sweepOffset, halfSpan);
  shape.lineTo(sweepOffset + tipChord, halfSpan);
  shape.lineTo(rootChord, 0);
  shape.lineTo(sweepOffset + tipChord, -halfSpan);
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
  // Recenter: shape's local (x,y) become mesh (chordwise, spanwise); rotating +90deg about X
  // (applied where this geometry is used) then maps spanwise -> world Z, thickness -> world Y.
  geometry.translate(-rootChord / 2, 0, -thickness / 2);
  return geometry;
}

/** A single tapered, swept panel rising from the root — used for the vertical fin. */
function buildFinGeometry(height: number, rootChord: number, taperRatio: number, sweepDeg: number, thickness: number) {
  const tipChord = rootChord * taperRatio;
  const sweepOffset = height * Math.tan(sweepDeg * DEG_TO_RAD);
  const shape = new Shape();
  shape.moveTo(0, 0);
  shape.lineTo(sweepOffset, height);
  shape.lineTo(sweepOffset + tipChord, height);
  shape.lineTo(rootChord, 0);
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
  geometry.translate(-rootChord / 2, 0, -thickness / 2);
  return geometry;
}

/**
 * A stylized airplane built from tapered, swept-panel geometry (not a fixed 3D asset), so
 * wingspan and chord keep visibly rescaling the model as the student adjusts geometry
 * sliders. Sweep/taper/color come from the selected preset's visual style, giving the
 * General Aviation and Fighter presets distinct silhouettes.
 */
export const Airplane = forwardRef<Group, { geometry: AirplaneGeometry }>(function Airplane({ geometry }, ref) {
  const { wingSpan, meanChord, style } = geometry;
  const fuselageLength = meanChord * 6;
  const fuselageRadius = meanChord * 0.22;
  const wingThickness = meanChord * 0.08;
  const tailSpan = wingSpan * 0.35;
  const tailChord = meanChord * 0.55;
  const finHeight = meanChord * 1.1;
  const finChord = meanChord * 0.7;
  const tailX = -fuselageLength * 0.42;

  const wingGeometry = useMemo(
    () => buildSpanwisePanelGeometry(wingSpan, meanChord * 1.15, style.wingTaperRatio, style.wingSweepDeg, wingThickness),
    [wingSpan, meanChord, style.wingTaperRatio, style.wingSweepDeg, wingThickness],
  );
  const tailGeometry = useMemo(
    () => buildSpanwisePanelGeometry(tailSpan, tailChord, style.tailTaperRatio, style.tailSweepDeg, wingThickness * 0.8),
    [tailSpan, tailChord, style.tailTaperRatio, style.tailSweepDeg, wingThickness],
  );
  const finGeometry = useMemo(
    () => buildFinGeometry(finHeight, finChord, style.finTaperRatio, style.finSweepDeg, wingThickness * 0.8),
    [finHeight, finChord, style.finTaperRatio, style.finSweepDeg, wingThickness],
  );

  return (
    <group ref={ref}>
      {/* Fuselage: capsule long axis along X (nose toward +X, matching direction of travel) */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[fuselageRadius, fuselageLength - 2 * fuselageRadius, 4, 12]} />
        <meshStandardMaterial color={style.fuselageColor} roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Canopy */}
      <mesh position={[fuselageLength * 0.18, fuselageRadius * 0.7, 0]} scale={[1.4, 0.7, 0.55]}>
        <sphereGeometry args={[fuselageRadius * 0.9, 12, 8]} />
        <meshStandardMaterial color="#1a2733" roughness={0.15} metalness={0.6} transparent opacity={0.75} />
      </mesh>

      {/* Main wing */}
      <mesh geometry={wingGeometry} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={style.wingColor} roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Horizontal tail */}
      <mesh geometry={tailGeometry} rotation={[Math.PI / 2, 0, 0]} position={[tailX, 0, 0]}>
        <meshStandardMaterial color={style.tailColor} roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Vertical fin */}
      <mesh geometry={finGeometry} position={[tailX, fuselageRadius, 0]}>
        <meshStandardMaterial color={style.tailColor} roughness={0.5} metalness={0.2} />
      </mesh>
    </group>
  );
});
