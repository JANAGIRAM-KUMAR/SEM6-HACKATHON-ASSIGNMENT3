import { memo } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { getMetricLevel } from "../../utils/medical";

const levelStyles = {
  normal: "border-emerald-400/40 bg-emerald-900/15 text-emerald-300",
  warning: "border-amber-400/40 bg-amber-900/15 text-amber-300",
  critical: "border-rose-400/40 bg-rose-900/20 text-rose-300 critical-blink",
};

function MetricCard({ label, icon, value, unit, metric, trend, spiking }) {
  const level = getMetricLevel(metric, value);
  const trendChar = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx("glass rounded-2xl border p-4", levelStyles[level])}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm uppercase tracking-[0.16em]">{label}</p>
        <p className={clsx("text-lg", metric === "heartRate" ? "animate-pulse" : "")}>{icon}</p>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-semibold text-white">{value ?? "--"}</span>
        <span className="mb-1 text-sm text-slate-300">{unit}</span>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="rounded-md bg-slate-950/40 px-2 py-1 text-slate-300">{level.toUpperCase()}</span>
        <span className={clsx("font-semibold", spiking ? "text-rose-300" : "text-slate-300")}>
          {spiking ? "Spike " : "Trend "} {trendChar}
        </span>
      </div>
    </motion.article>
  );
}

export default memo(MetricCard);

