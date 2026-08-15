import { useCwStore } from '../../store/cwStore';
import { RelativeOrbitCanvas2D } from './RelativeOrbitCanvas2D';
import { SceneCanvas } from '../three/SceneCanvas';

export function OrbitView() {
  const viewMode = useCwStore((s) => s.viewMode);
  return viewMode === '2d' ? <RelativeOrbitCanvas2D /> : <SceneCanvas />;
}
