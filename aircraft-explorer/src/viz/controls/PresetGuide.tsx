import { AIRFRAME_PRESETS, GENERAL_AVIATION } from '../../core/aero/presets.ts';
import { useSimulationStore } from '../../store/simulationStore.ts';

/**
 * Persistent "what to look for" callout for the active preset — deliberately not hover-only,
 * so it stays legible during a live lecture demo without the instructor needing to mouse over
 * the preset button.
 */
export function PresetGuide() {
  const presetId = useSimulationStore((s) => s.presetId);
  const activeAxis = useSimulationStore((s) => s.activeAxis);
  const preset = AIRFRAME_PRESETS.find((p) => p.id === presetId) ?? GENERAL_AVIATION;
  const whatToLookFor = activeAxis === 'lateral' ? preset.lateral.whatToLookFor : preset.whatToLookFor;

  return (
    <p className="preset-guide">
      <span className="preset-guide-label">Look for:</span> {whatToLookFor}
    </p>
  );
}
