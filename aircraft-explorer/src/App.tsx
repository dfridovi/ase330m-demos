import { PresetSelector } from './viz/controls/PresetSelector.tsx';
import { AxisToggle } from './viz/controls/AxisToggle.tsx';
import { PresetGuide } from './viz/controls/PresetGuide.tsx';
import { ParamSliders } from './viz/controls/ParamSliders.tsx';
import { InputControls } from './viz/controls/InputControls.tsx';
import { MatrixReadout } from './viz/controls/MatrixReadout.tsx';
import { PlaybackControls } from './viz/controls/PlaybackControls.tsx';
import { PlaybackDriver } from './viz/PlaybackDriver.tsx';
import { SceneCanvas } from './viz/three/SceneCanvas.tsx';
import { FullResponseCharts } from './viz/charts/FullResponseCharts.tsx';
import { ModalContributionChart } from './viz/charts/ModalContributionChart.tsx';

function App() {
  return (
    <div className="app-layout">
      <PlaybackDriver />
      <header className="app-header">
        <div className="app-header-top">
          <h1>Aircraft Dynamics Explorer</h1>
          <AxisToggle />
          <PresetSelector />
        </div>
        <PresetGuide />
      </header>

      <aside className="left-panel">
        <ParamSliders />
        <InputControls />
      </aside>

      <main className="center-panel">
        <div className="scene-container">
          <SceneCanvas />
        </div>
        <PlaybackControls />
      </main>

      <section className="right-panel">
        <MatrixReadout />
      </section>

      <section className="bottom-panel">
        <FullResponseCharts />
        <ModalContributionChart />
      </section>
    </div>
  );
}

export default App;
