const fs = require("fs/promises");
const path = require("path");
const logger = require("../utils/logger");

const RULES_FILE = path.join(__dirname, "../data/rules.json");
// Small cache window avoids disk reads on every high-frequency vitals write.
const RULE_CACHE_TTL_MS = 5000;

let ruleCache = [];
let lastLoadedAt = 0;

const operatorMap = {
  ">": (a, b) => a > b,
  "<": (a, b) => a < b,
  ">=": (a, b) => a >= b,
  "<=": (a, b) => a <= b,
  "==": (a, b) => a === b,
};

const loadRules = async () => {
  const now = Date.now();

  if (now - lastLoadedAt < RULE_CACHE_TTL_MS && ruleCache.length) {
    return ruleCache;
  }

  const rawRules = await fs.readFile(RULES_FILE, "utf8");
  const parsedRules = JSON.parse(rawRules);

  ruleCache = parsedRules.filter((rule) => {
    const isValid =
      rule &&
      typeof rule.field === "string" &&
      typeof rule.operator === "string" &&
      Object.hasOwn(operatorMap, rule.operator) &&
      Object.hasOwn(rule, "value") &&
      typeof rule.alert === "string" &&
      typeof rule.severity === "string";

    if (!isValid) {
      logger.warn({ message: "Skipping invalid rule", rule });
    }

    return isValid;
  });

  lastLoadedAt = now;
  return ruleCache;
};

const evaluateRules = async (vitalsPayload) => {
  const rules = await loadRules();
  const alerts = [];

  for (const rule of rules) {
    // Each rule follows: { field, operator, value, alert, severity, message? }.
    const currentValue = vitalsPayload[rule.field];

    if (typeof currentValue === "undefined") {
      continue;
    }

    const comparator = operatorMap[rule.operator];
    const isMatched = comparator(currentValue, rule.value);

    if (!isMatched) {
      continue;
    }

    alerts.push({
      alertType: String(rule.alert).toUpperCase(),
      severity: String(rule.severity).toUpperCase(),
      message:
        rule.message ||
        `${rule.alert} triggered because ${rule.field} (${currentValue}) ${rule.operator} ${rule.value}`,
    });
  }

  return alerts;
};

module.exports = {
  evaluateRules,
};
