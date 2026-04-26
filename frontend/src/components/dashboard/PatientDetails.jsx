import { memo, useMemo } from "react";

const getBmi = (patient) => {
  const seed = (patient?.age || 30) * 0.2 + (patient?.gender === "MALE" ? 1.2 : 0.8);
  return (20 + (seed % 8)).toFixed(1);
};

function PatientDetails({ patient }) {
  const bmi = useMemo(() => getBmi(patient), [patient]);

  if (!patient) {
    return <section className="glass rounded-2xl p-4 text-sm text-slate-300">Select a patient to inspect profile details.</section>;
  }

  return (
    <section className="glass rounded-2xl p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-200">Patient Profile</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-slate-400">
              <th className="pb-2">ID</th>
              <th className="pb-2">Name</th>
              <th className="pb-2">Age</th>
              <th className="pb-2">Gender</th>
              <th className="pb-2">Blood Group</th>
              <th className="pb-2">BMI</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-700/60 text-slate-100">
              <td className="py-2">{patient.patientId}</td>
              <td className="py-2">{patient.name}</td>
              <td className="py-2">{patient.age}</td>
              <td className="py-2">{patient.gender}</td>
              <td className="py-2">{patient.bloodGroup}</td>
              <td className="py-2">{bmi}</td>
              <td className="py-2">
                <span className="rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200">
                  MONITORED
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default memo(PatientDetails);

