import { useRendezvousStore } from './store/rendezvousStore';
import { InitialConditionControls } from './viz/controls/InitialConditionControls';
import { GainControls } from './viz/controls/GainControls';
import { ViewToggle } from './viz/controls/ViewToggle';
import { PlaybackControls } from './viz/controls/PlaybackControls';
import { MatrixReadout } from './viz/controls/MatrixReadout';
import { RendezvousView } from './viz/orbit/RendezvousView';
import { RendezvousCharts } from './viz/charts/RendezvousCharts';
import { PlaybackDriver } from './viz/PlaybackDriver';

function CaptureStatus() {
  const diverged = useRendezvousStore((s) => s.current.diverged);
  const timeToCaptureS = useRendezvousStore((s) => s.timeToCaptureS);

  if (diverged) {
    return (
      <p className="diverged-banner">
        Unstable -- the chaser diverged before this K got anywhere near the chief. Try a smaller
        |K|, or check the sign on the coupling terms.
      </p>
    );
  }
  if (timeToCaptureS !== null) {
    return <p className="diverged-banner capture-banner">Captured at t = {timeToCaptureS.toFixed(0)} s.</p>;
  }
  return <p className="diverged-banner">Stable, but not yet within the capture radius by the end of the run.</p>;
}

function App() {
  return (
    <div className="app-layout">
      <PlaybackDriver />
      <header className="app-header">
        <div className="app-header-top">
          <h1>Satellite Rendezvous: CW State Feedback</h1>
          <ViewToggle />
        </div>
        <p className="app-subtitle">
          Design a linear state-feedback controller u = -K·x for the Clohessy-Wiltshire relative
          motion equations to bring the trailing chaser to within a few meters of the chief,
          without diverging. Start in-plane (2 thrusters), then click "2. Full 3D" (top right)
          to bring the third, cross-track thruster online.
        </p>
      </header>

      <aside className="left-panel">
        <InitialConditionControls />
        <GainControls />
      </aside>

      <main className="center-panel">
        <div className="scene-container">
          <RendezvousView />
        </div>
        <CaptureStatus />
        <PlaybackControls />
      </main>

      <section className="right-panel">
        <MatrixReadout />
      </section>

      <section className="bottom-panel">
        <RendezvousCharts />
      </section>
    </div>
  );
}

export default App;
