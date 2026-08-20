interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

export function Slider({ label, value, min, max, step, unit, onChange, formatValue }: SliderProps) {
  const display = formatValue ? formatValue(value) : value.toFixed(2);
  return (
    <label className="slider">
      <div className="slider-row">
        <span className="slider-label">{label}</span>
        <span className="slider-value">
          {display}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
