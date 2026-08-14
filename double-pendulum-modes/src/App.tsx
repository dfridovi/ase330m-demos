import { ParamSliders } from './viz/controls/ParamSliders.tsx';
import { InitialConditionControls } from './viz/controls/InitialConditionControls.tsx';
import { PlaybackControls } from './viz/controls/PlaybackControls.tsx';
import { ModeVisibilityToggle } from './viz/controls/ModeVisibilityToggle.tsx';
import { ModeTable } from './viz/controls/ModeTable.tsx';
import { PendulumCanvas } from './viz/pendulum/PendulumCanvas.tsx';
import { PlaybackDriver } from './viz/PlaybackDriver.tsx';
import { ModalCharts } from './viz/charts/ModalCharts.tsx';

function App() {
  return (
    <div className="app-layout">
      <PlaybackDriver />
      <header className="app-header">
        <div className="app-header-top">
          <h1>Double Pendulum: Normal Modes</h1>
        </div>
        <p className="app-subtitle">
          The linearized double pendulum decomposes into two independent normal modes — a slow,
          in-phase swing and a fast, anti-phase swing. Any initial condition is just a sum of the two.
        </p>
      </header>

      <aside className="left-panel">
        <ParamSliders />
        <InitialConditionControls />
      </aside>

      <main className="center-panel">
        <div className="scene-container">
          <PendulumCanvas />
        </div>
        <ModeVisibilityToggle />
        <PlaybackControls />
      </main>

      <section className="right-panel">
        <ModeTable />
      </section>

      <section className="bottom-panel">
        <ModalCharts />
      </section>
    </div>
  );
}

export default App;
