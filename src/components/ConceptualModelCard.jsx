export default function ConceptualModelCard({ model }) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 p-6 text-white space-y-4 shadow-xl">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-teal-300">Conceptual Tag Model</p>
        <h3 className="text-2xl font-semibold mt-2">{model.name}</h3>
        <p className="text-sm text-white/70 mt-2 leading-relaxed">{model.description}</p>
      </div>
      <div>
        <p className="text-sm font-semibold text-teal-200">Innovations</p>
        <ul className="mt-2 space-y-2 list-disc list-inside text-sm text-white/70">
          {model.innovations.map((innovation) => (
            <li key={innovation}>{innovation}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
        <p className="text-sm font-semibold text-teal-200">New Satellite Metric</p>
        <h4 className="text-lg font-semibold mt-1">{model.newSatelliteMetric.name}</h4>
        <p className="text-sm text-white/70 mt-2 leading-relaxed">
          {model.newSatelliteMetric.definition}
        </p>
        <p className="text-xs uppercase tracking-[0.2em] text-white/50 mt-3">Required Inputs</p>
        <ul className="mt-2 space-y-1 text-sm text-white/70 list-disc list-inside">
          {model.newSatelliteMetric.inputs.map((input) => (
            <li key={input}>{input}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
