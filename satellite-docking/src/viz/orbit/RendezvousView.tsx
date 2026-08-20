import { useRendezvousStore } from '../../store/rendezvousStore';
import { RendezvousCanvas2D } from './RendezvousCanvas2D';
import { SceneCanvas } from '../three/SceneCanvas';
import { SceneLegend } from '../controls/SceneLegend';

export function RendezvousView() {
  const viewMode = useRendezvousStore((s) => s.viewMode);
  return (
    <div className="scene-view">
      {viewMode === '2d' ? <RendezvousCanvas2D /> : <SceneCanvas />}
      <SceneLegend />
    </div>
  );
}
