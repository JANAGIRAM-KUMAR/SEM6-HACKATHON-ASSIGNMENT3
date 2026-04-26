import { memo } from "react";
import { useAuthStore } from "../../store/authStore";

function Topbar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <header className="glass mb-4 flex items-center justify-between rounded-2xl px-5 py-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">ICU Live Telemetry</h2>
        <p className="text-sm text-slate-400">Real-time decision support for critical care</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right text-sm">
          <p className="font-medium text-slate-100">{user?.name || "Clinician"}</p>
          <p className="text-slate-400">{user?.role || "DOCTOR"}</p>
        </div>
        <button
          onClick={logout}
          className="rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
          type="button"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default memo(Topbar);

