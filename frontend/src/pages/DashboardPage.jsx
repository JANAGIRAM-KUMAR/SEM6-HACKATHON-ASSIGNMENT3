import { useEffect, useMemo } from "react";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import VitalsGrid from "../components/dashboard/VitalsGrid";
import VitalsCharts from "../components/dashboard/VitalsCharts";
import AlertsPanel from "../components/dashboard/AlertsPanel";
import PatientDetails from "../components/dashboard/PatientDetails";
import { useMonitorStore } from "../store/monitorStore";
import { useAuthStore } from "../store/authStore";
import { connectSocket, subscribeToPatientRoom } from "../services/socket";
import { useRealtimeMonitor } from "../hooks/useRealtimeMonitor";

function DashboardPage() {
  const token = useAuthStore((state) => state.token);
  const {
    patients,
    selectedPatientId,
    vitalsByPatient,
    alertsByPatient,
    isLoadingPatients,
    error,
    fetchPatients,
    fetchVitals,
    fetchAlerts,
    setSelectedPatientId,
  } = useMonitorStore();

  const selectedPatient = useMemo(
    () => patients.find((patient) => String(patient.id) === String(selectedPatientId)),
    [patients, selectedPatientId]
  );

  const currentVitals = vitalsByPatient[String(selectedPatientId)] || [];
  const currentAlerts = alertsByPatient[String(selectedPatientId)] || [];

  useRealtimeMonitor(selectedPatientId);

  useEffect(() => {
    if (token) connectSocket(token);
  }, [token]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (!selectedPatientId) return;
    subscribeToPatientRoom(selectedPatientId);
    fetchVitals(selectedPatientId);
    fetchAlerts(selectedPatientId);
  }, [selectedPatientId, fetchVitals, fetchAlerts]);

  return (
    <main className="p-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[290px_1fr]">
        <Sidebar
          patients={patients}
          selectedPatientId={selectedPatientId}
          onSelectPatient={setSelectedPatientId}
        />
        <section className="min-w-0">
          <Topbar />
          {error ? (
            <div className="mb-3 rounded-xl border border-rose-500/40 bg-rose-900/20 p-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
          {isLoadingPatients && !patients.length ? (
            <div className="glass rounded-2xl p-4 text-sm text-slate-300">Loading patients...</div>
          ) : (
            <div className="space-y-4">
              <VitalsGrid samples={currentVitals} />
              <VitalsCharts samples={currentVitals} />
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
                <PatientDetails patient={selectedPatient} />
                <AlertsPanel alerts={currentAlerts} />
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default DashboardPage;

