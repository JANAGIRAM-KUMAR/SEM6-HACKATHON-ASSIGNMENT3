export const LIMITS = {
  heartRate: { warningLow: 55, warningHigh: 105, criticalLow: 45, criticalHigh: 130 },
  temperature: { warningLow: 36, warningHigh: 37.8, criticalLow: 35.2, criticalHigh: 39 },
  spo2: { warningLow: 93, warningHigh: 100, criticalLow: 89, criticalHigh: 100 },
};

export const MAX_LIVE_POINTS = 50;

export const getMetricLevel = (metric, value) => {
  const limit = LIMITS[metric];
  if (!limit || value === undefined || value === null) return "normal";
  if (value <= limit.criticalLow || value >= limit.criticalHigh) return "critical";
  if (value <= limit.warningLow || value >= limit.warningHigh) return "warning";
  return "normal";
};

export const getTrend = (current, previous) => {
  if (current === undefined || previous === undefined || current === previous) return "flat";
  return current > previous ? "up" : "down";
};

export const parseBloodPressure = (bp = "0/0") => {
  const [systolic = "0", diastolic = "0"] = bp.split("/");
  return {
    systolic: Number(systolic),
    diastolic: Number(diastolic),
  };
};

export const isSpike = (metric, current, previous) => {
  if (current === undefined || previous === undefined) return false;
  const deltas = {
    heartRate: 12,
    temperature: 0.8,
    spo2: 3,
  };
  return Math.abs(current - previous) >= (deltas[metric] || Infinity);
};

export const formatTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

