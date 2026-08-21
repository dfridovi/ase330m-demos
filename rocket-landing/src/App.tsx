import { PlaybackDriver } from './viz/PlaybackDriver.tsx';
import { RocketCanvas } from './viz/RocketCanvas.tsx';
import { ScenarioPresets } from './viz/controls/ScenarioPresets.tsx';
import { InitialConditionControls } from './viz/controls/InitialConditionControls.tsx';
import { CostWeightControls } from './viz/controls/CostWeightControls.tsx';
import { PlaybackControls } from './viz/controls/PlaybackControls.tsx';
import { EquationsPanel } from './viz/readout/EquationsPanel.tsx';
import { RocketCharts } from './viz/charts/RocketCharts.tsx';

function App() {
  return (
    <div className="app-layout">
      <PlaybackDriver />
      <header className="app-header">
        <div className="app-header-top">
          <h1>Rocket Landing: Nonlinear MPC (iLQR)</h1>
        </div>
        <p className="app-subtitle">
          A planar rocket with nonlinear thrust/attitude coupling, landed by a receding-horizon
          nonlinear MPC controller (iLQR). Drag the rocket to set it up or knock it off course
          mid-flight, and adjust the cost weights to see how the tradeoffs change the landing --
          or make it crash.
        </p>
      </header>

      <aside className="left-panel">
        <ScenarioPresets />
        <InitialConditionControls />
        <CostWeightControls />
      </aside>

      <main className="center-panel">
        <div className="scene-container">
          <RocketCanvas />
        </div>
        <PlaybackControls />
      </main>

      <section className="right-panel">
        <EquationsPanel />
      </section>

      <section className="bottom-panel">
        <RocketCharts />
      </section>
    </div>
  );
}

export default App;
