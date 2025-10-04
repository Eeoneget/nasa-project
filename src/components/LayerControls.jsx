"use client";

const timeOptions = [
  { id: "day", label: "Day" },
  { id: "night", label: "Night" },
  { id: "season", label: "Season" }
];

export default function LayerControls({
  visibility,
  onToggleLayer,
  filters,
  onUpdateFilters
}) {
  const updateRange = (type, index, value) => {
    const numericValue = Number(value);
    const currentRange = filters[type];
    const nextRange = [...currentRange];
    nextRange[index] = numericValue;
    if (nextRange[0] > nextRange[1]) {
      if (index === 0) {
        nextRange[1] = numericValue;
      } else {
        nextRange[0] = numericValue;
      }
    }
    onUpdateFilters({
      ...filters,
      [type]: nextRange
    });
  };

  const updateTimeFilter = (option) => {
    onUpdateFilters({
      ...filters,
      timeFilter: option
    });
  };

  return (
    <div className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 p-6 text-white shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Interactive Layers</h3>
      <div className="space-y-3">
        {[
          { key: "seaSurfaceTemperature", label: "Sea Surface Temperature" },
          { key: "phytoplankton", label: "Phytoplankton" },
          { key: "sharkHotspots", label: "Shark Feeding Hotspots" }
        ].map((layer) => (
          <label
            key={layer.key}
            className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-2"
          >
            <span>{layer.label}</span>
            <input
              type="checkbox"
              checked={visibility[layer.key]}
              onChange={() => onToggleLayer(layer.key)}
              className="h-5 w-5 accent-teal-400"
            />
          </label>
        ))}
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <div className="flex justify-between text-sm text-white/70 mb-2">
            <span>Depth Range (m)</span>
            <span>
              {filters.depthRange[0]} - {filters.depthRange[1]}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min={0}
              max={300}
              value={filters.depthRange[0]}
              onChange={(event) => updateRange("depthRange", 0, event.target.value)}
              className="w-full"
            />
            <input
              type="range"
              min={0}
              max={300}
              value={filters.depthRange[1]}
              onChange={(event) => updateRange("depthRange", 1, event.target.value)}
              className="w-full"
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm text-white/70 mb-2">
            <span>Temperature (degC)</span>
            <span>
              {filters.temperatureRange[0]} - {filters.temperatureRange[1]}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min={10}
              max={30}
              value={filters.temperatureRange[0]}
              onChange={(event) => updateRange("temperatureRange", 0, event.target.value)}
              className="w-full"
            />
            <input
              type="range"
              min={10}
              max={30}
              value={filters.temperatureRange[1]}
              onChange={(event) => updateRange("temperatureRange", 1, event.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm text-white/70 mb-2">Time / Season</p>
        <div className="grid grid-cols-3 gap-2">
          {timeOptions.map((option) => (
            <button
              type="button"
              key={option.id}
              onClick={() => updateTimeFilter(option.id)}
              className={`rounded-2xl px-3 py-2 text-sm transition-colors ${
                filters.timeFilter === option.id
                  ? "bg-teal-400 text-black"
                  : "bg-white/5 hover:bg-white/10"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
