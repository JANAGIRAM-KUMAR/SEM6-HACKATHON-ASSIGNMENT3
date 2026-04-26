import { memo, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatTime, isSpike } from "../../utils/medical";

function VitalsCharts({ samples }) {
  const chartData = useMemo(
    () =>
      (samples || []).slice(-30).map((sample, index, list) => ({
        ...sample,
        time: formatTime(sample.timestamp),
        hrSpike: isSpike("heartRate", sample.heartRate, list[index - 1]?.heartRate) ? sample.heartRate : null,
      })),
    [samples]
  );

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <article className="glass rounded-2xl p-4 xl:col-span-1">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">Heart Rate</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="rgba(71,85,105,0.3)" />
              <XAxis dataKey="time" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="heartRate" stroke="#38bdf8" dot={false} strokeWidth={2.5} />
              <Line type="monotone" dataKey="hrSpike" stroke="#f43f5e" dot={{ r: 3 }} strokeWidth={0} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="glass rounded-2xl p-4 xl:col-span-1">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">Temperature</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="rgba(71,85,105,0.3)" />
              <XAxis dataKey="time" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="temperature" stroke="#f97316" dot={false} strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="glass rounded-2xl p-4 xl:col-span-1">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">SpO2</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid stroke="rgba(71,85,105,0.3)" />
              <XAxis dataKey="time" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} domain={[85, 100]} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="spo2"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.18}
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}

export default memo(VitalsCharts);

