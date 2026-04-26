import { memo, useEffect, useRef } from "react";
import clsx from "clsx";
import { formatTime } from "../../utils/medical";

const severityStyles = {
  LOW: "bg-blue-500/20 text-blue-200",
  MEDIUM: "bg-amber-500/20 text-amber-200",
  HIGH: "bg-rose-500/20 text-rose-200 critical-blink",
};

function AlertsPanel({ alerts }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [alerts.length]);

  return (
    <section className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Live Alerts</h3>
        <span className="rounded-md bg-slate-950/50 px-2 py-1 text-xs text-slate-400">
          {alerts.length} recent
        </span>
      </div>
      <div ref={scrollRef} className="thin-scrollbar h-64 space-y-2 overflow-y-auto pr-1">
        {alerts.length ? (
          alerts.map((alert) => (
            <article key={alert.id || `${alert.timestamp}-${alert.message}`} className="rounded-xl border border-slate-700 bg-slate-900/55 p-3">
              <div className="flex items-center justify-between">
                <span className={clsx("rounded px-2 py-1 text-xs font-semibold", severityStyles[alert.severity])}>
                  {alert.severity}
                </span>
                <span className="text-xs text-slate-400">{formatTime(alert.timestamp)}</span>
              </div>
              <p className="mt-2 text-sm text-slate-200">{alert.message}</p>
              <p className="mt-1 text-xs text-slate-400">{alert.alertType}</p>
            </article>
          ))
        ) : (
          <p className="text-sm text-slate-400">No alerts for this patient.</p>
        )}
      </div>
    </section>
  );
}

export default memo(AlertsPanel);

