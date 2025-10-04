"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

const pieColors = ["#34d399", "#60a5fa", "#fbbf24", "#c084fc"];
const DEGREE_SYMBOL = String.fromCharCode(176);

function formatRatio(value) {
  return `${Math.round(value * 100)}%`;
}

function formatDelta(value, unit = "%", scaleByHundred = unit === "%") {
  if (value === 0) return `0${unit}`;
  const sign = value > 0 ? "+" : "";
  const multiplier = scaleByHundred ? 100 : 1;
  const magnitude = Math.round(Math.abs(value) * multiplier * 10) / 10;
  return `${sign}${magnitude}${unit}`;
}

export default function AnalyticsDashboard({ series, stats }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Shark Occurrence"
          value={formatRatio(stats.sharkOccurrence.value)}
          delta={formatDelta(stats.sharkOccurrence.delta)}
        />
        <SummaryCard
          label="Hotspots Found"
          value={stats.hotspotsFound.value}
          delta={formatDelta(stats.hotspotsFound.delta, "", false)}
        />
        <SummaryCard
          label="Avg. Temperature"
          value={`${stats.avgTemperature.value}${DEGREE_SYMBOL}C`}
          delta={formatDelta(stats.avgTemperature.delta, `${DEGREE_SYMBOL}C`, false)}
        />
        <SummaryCard
          label="Phytoplankton"
          value={stats.phytoplanktonLevel.label}
          delta={formatDelta(stats.phytoplanktonLevel.delta)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Ocean Temperature vs. Shark Presence" subtitle="High correlation (+15%)">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={series.sharkPresenceVsTemp}>
              <XAxis dataKey="hour" stroke="#a1a1aa" tickLine={false} />
              <YAxis stroke="#a1a1aa" tickLine={false} domain={[0, 1]} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white"
                }}
                formatter={(value, name) => {
                  if (name === "sharkPresence") {
                    return [`${Math.round(value * 100)}%`, "Shark presence"];
                  }
                  return [`${value.toFixed(1)} ${DEGREE_SYMBOL}C`, "SST"];
                }}
              />
              <Line type="monotone" dataKey="sst" stroke="#22d3ee" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="sharkPresence" stroke="#c084fc" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Hotspot Changes Over Time" subtitle="Last 7 days, +8%">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={series.hotspotTrends}>
              <XAxis dataKey="day" stroke="#a1a1aa" tickLine={false} />
              <YAxis stroke="#a1a1aa" tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white"
                }}
                formatter={(value) => [`${value}`, "Hotspots"]}
              />
              <Bar dataKey="hotspots" radius={[10, 10, 10, 10]} fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard
        title="Diet Composition Signals"
        subtitle="Derived from ECHO tags and NASA-driven prey field assimilation"
      >
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={series.dietBreakdown}
              dataKey="pct"
              nameKey="type"
              innerRadius={60}
              outerRadius={90}
            >
              {series.dietBreakdown.map((entry, index) => (
                <Cell key={entry.type} fill={pieColors[index % pieColors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "white"
              }}
              formatter={(value, name) => [`${value}%`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function SummaryCard({ label, value, delta }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 shadow-md text-white">
      <p className="text-sm text-white/60">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
      <p className="text-xs text-emerald-300 mt-2">{delta}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-3xl bg-white/5 border border-white/10 p-5 text-white shadow-lg">
      <div className="mb-4">
        <h4 className="text-lg font-semibold">{title}</h4>
        {subtitle ? (
          <p className="text-sm text-white/60 mt-1">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
