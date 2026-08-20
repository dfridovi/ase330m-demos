import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { Trajectory } from '../../core/sim/rk4';
import { toRenderPosition } from './coords';

interface TrajectoryPathProps {
  trajectory: Trajectory;
  color: string;
  dashed?: boolean;
  opacity?: number;
}

/** A static full-path line for one trajectory, matching the 2D view's "show the whole path,
 * not just recent history" approach -- recomputed only when the trajectory itself changes, not
 * per animation frame. */
export function TrajectoryPath({ trajectory, color, dashed = false, opacity = 0.8 }: TrajectoryPathProps) {
  const points = useMemo(
    () => trajectory.x.map((s): [number, number, number] => toRenderPosition(s[0], s[1], s[2])),
    [trajectory],
  );
  if (points.length < 2) return null;
  return (
    <Line
      points={points}
      color={color}
      lineWidth={1.5}
      dashed={dashed}
      dashSize={0.3}
      gapSize={0.2}
      transparent
      opacity={opacity}
    />
  );
}
