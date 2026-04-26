import { memo, useMemo, useState } from "react";
import clsx from "clsx";

function Sidebar({ patients, selectedPatientId, onSelectPatient }) {
  const [search, setSearch] = useState("");

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return patients;
    return patients.filter((patient) => {
      return (
        patient.patientId?.toLowerCase().includes(query) ||
        patient.name?.toLowerCase().includes(query) ||
        patient.bloodGroup?.toLowerCase().includes(query)
      );
    });
  }, [patients, search]);

  return (
    <aside className="glass thin-scrollbar h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl p-4">
      <h1 className="text-base font-semibold tracking-wide text-cyan-200">Patients</h1>
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by id, name, group..."
        className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
      />

      <div className="mt-3 space-y-2">
        {filteredPatients.map((patient) => {
          const active = String(selectedPatientId) === String(patient.id);
          return (
            <button
              key={patient.id}
              type="button"
              onClick={() => onSelectPatient(patient.id)}
              className={clsx(
                "w-full rounded-xl border p-3 text-left transition",
                active
                  ? "border-cyan-400 bg-cyan-900/20"
                  : "border-slate-700/70 bg-slate-900/35 hover:border-slate-500"
              )}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-100">{patient.name}</p>
                <span
                  className={clsx(
                    "h-2.5 w-2.5 rounded-full",
                    active ? "bg-emerald-400 shadow-[0_0_8px_#10b981]" : "bg-rose-400"
                  )}
                />
              </div>
              <p className="text-xs text-slate-400">{patient.patientId}</p>
              <p className="mt-1 text-xs text-slate-400">
                {patient.gender} · {patient.bloodGroup}
              </p>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export default memo(Sidebar);

