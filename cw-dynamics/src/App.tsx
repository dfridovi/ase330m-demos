import { OrbitParamSliders } from './viz/controls/OrbitControls.tsx';
import { InitialConditionControls } from './viz/controls/InitialConditionControls.tsx';
import { PlaybackControls } from './viz/controls/PlaybackControls.tsx';
import { ModeVisibilityToggle } from './viz/controls/ModeVisibilityToggle.tsx';
import { ViewToggle } from './viz/controls/ViewToggle.tsx';
import { ModeTable } from './viz/controls/ModeTable.tsx';
import { OrbitView } from './viz/orbit/OrbitView.tsx';
import { PlaybackDriver } from './viz/PlaybackDriver.tsx';
import { RelativeOrbitCharts } from './viz/charts/RelativeOrbitCharts.tsx';

function App() {
  return (
    <div className="app-layout">
      <PlaybackDriver />
      <header className="app-header">
        <div className="app-header-top">
          <h1>Clohessy-Wiltshire: Relative Orbital Motion</h1>
          <ViewToggle />
        </div>
        <p className="app-subtitle">
          A chaser satellite's motion relative to a chief in circular orbit, linearized about the
          chief. Unless the initial along-track velocity exactly cancels the drift term, the
          relative orbit doesn't close — it drifts steadily along-track, orbit after orbit.
        </p>
      </header>

      <aside className="left-panel">
        <OrbitParamSliders />
        <InitialConditionControls />
      </aside>

      <main className="center-panel">
        <div className="scene-container">
          <OrbitView />
        </div>
        <ModeVisibilityToggle />
        <PlaybackControls />
      </main>

      <section className="right-panel">
        <ModeTable />
      </section>

      <section className="bottom-panel">
        <RelativeOrbitCharts />
      </section>
    </div>
  );
}

export default App;
