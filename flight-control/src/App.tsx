import { GainControls } from './viz/controls/GainControls.tsx';
import { ManeuverSelector } from './viz/controls/ManeuverSelector.tsx';
import { MatrixReadout } from './viz/controls/MatrixReadout.tsx';
import { PlaybackControls } from './viz/controls/PlaybackControls.tsx';
import { PlaybackDriver } from './viz/PlaybackDriver.tsx';
import { SceneCanvas } from './viz/three/SceneCanvas.tsx';
import { TrackingCharts } from './viz/charts/TrackingCharts.tsx';
import { PoleZeroChart } from './viz/charts/PoleZeroChart.tsx';
import { FrequencyResponseChart } from './viz/charts/FrequencyResponseChart.tsx';

function App() {
  return (
    <div className="app-layout">
      <PlaybackDriver />
      <header className="app-header">
        <div className="app-header-top">
          <h1>Flight Control: Phugoid State Feedback</h1>
        </div>
        <p className="input-hint" style={{ margin: 0 }}>
          Design u = -K·(x - x<sub>ref</sub>) to damp the General Aviation phugoid, then track a step or sinusoidal
          maneuver.
        </p>
      </header>

      <aside className="left-panel">
        <ManeuverSelector />
        <GainControls />
      </aside>

      <main className="center-panel">
        <div className="scene-container">
          <SceneCanvas />
        </div>
        <PlaybackControls />
      </main>

      <section className="right-panel">
        <PoleZeroChart />
        <MatrixReadout />
      </section>

      <section className="bottom-panel">
        <TrackingCharts />
        <FrequencyResponseChart />
      </section>
    </div>
  );
}

export default App;
