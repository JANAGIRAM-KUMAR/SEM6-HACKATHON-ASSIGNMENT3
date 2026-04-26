import { memo, useMemo } from "react";
import MetricCard from "./MetricCard";
import { getTrend, isSpike, parseBloodPressure } from "../../utils/medical";

function VitalsGrid({ samples }) {
  const latest = samples.at(-1);
  const previous = samples.at(-2);

  const bloodPressure = useMemo(
    () => parseBloodPressure(latest?.bloodPressure),
    [latest?.bloodPressure]
  );

  if (!latest) {
    return (
      <div className="glass rounded-2xl p-4 text-sm text-slate-300">
        Waiting for vitals stream...
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Heart Rate"
        icon="❤️"
        value={latest.heartRate}
        unit="bpm"
        metric="heartRate"
        trend={getTrend(latest.heartRate, previous?.heartRate)}
        spiking={isSpike("heartRate", latest.heartRate, previous?.heartRate)}
      />
      <MetricCard
        label="Temperature"
        icon="🌡"
        value={latest.temperature}
        unit="°C"
        metric="temperature"
        trend={getTrend(latest.temperature, previous?.temperature)}
        spiking={isSpike("temperature", latest.temperature, previous?.temperature)}
      />
      <MetricCard
        label="SpO2"
        icon="🫁"
        value={latest.spo2}
        unit="%"
        metric="spo2"
        trend={getTrend(latest.spo2, previous?.spo2)}
        spiking={isSpike("spo2", latest.spo2, previous?.spo2)}
      />
      <MetricCard
        label="Blood Pressure"
        icon="🩸"
        value={`${bloodPressure.systolic}/${bloodPressure.diastolic}`}
        unit="mmHg"
        metric="heartRate"
        trend={getTrend(bloodPressure.systolic, parseBloodPressure(previous?.bloodPressure).systolic)}
        spiking={Math.abs(bloodPressure.systolic - parseBloodPressure(previous?.bloodPressure).systolic) >= 12}
      />
    </section>
  );
}

export default memo(VitalsGrid);

