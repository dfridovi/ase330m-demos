import { PresetControls } from './viz/controls/PresetControls.tsx';
import { ParamSliders } from './viz/controls/ParamSliders.tsx';
import { PlaybackControls } from './viz/controls/PlaybackControls.tsx';
import { ViewToggle } from './viz/controls/ViewToggle.tsx';
import { StateSpaceTable } from './viz/controls/StateSpaceTable.tsx';
import { CarBodyCanvas } from './viz/render/CarBodyCanvas.tsx';
import { PlaybackDriver } from './viz/PlaybackDriver.tsx';
import { ResponseCharts } from './viz/charts/ResponseCharts.tsx';

function App() {
  return (
    <div className="app-layout">
      <PlaybackDriver />
      <header className="app-header">
        <div className="app-header-top">
          <h1>Quarter-Car Forced Response</h1>
          <ViewToggle />
        </div>
        <p className="app-subtitle">
          A mechanic pushes on the hood to test the shocks: a 1DOF spring-mass-damper forced
          directly on the body. Adjust the spring stiffness and damping and see how the step,
          impulse, and steady-state frequency response all trace back to the same eigenvalues
          σ ± iω_d of the state matrix A.
        </p>
      </header>

      <aside className="left-panel">
        <PresetControls />
        <ParamSliders />
      </aside>

      <main className="center-panel">
        <div className="scene-container">
          <CarBodyCanvas />
        </div>
        <PlaybackControls />
      </main>

      <section className="right-panel">
        <StateSpaceTable />
      </section>

      <section className="bottom-panel">
        <ResponseCharts />
      </section>
    </div>
  );
}

export default App;
