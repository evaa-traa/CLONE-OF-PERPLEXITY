function normalizeHost(host) {
  if (typeof host !== "string") return "";
  return host.trim().replace(/\/$/, "");
}

function collectModelIndices(env) {
  const indices = new Set();
  for (const key of Object.keys(env || {})) {
    const match = /^MODEL_(\d+)_(NAME|ID|HOST)$/.exec(key);
    if (match) {
      indices.add(Number(match[1]));
    }
  }
  return Array.from(indices).filter(Number.isFinite).sort((a, b) => a - b);
}

function loadModelsFromEnvDetailed(env) {
  const indices = collectModelIndices(env);
  const models = [];
  const issues = [];

  if (indices.length === 0) {
    issues.push("No model environment variables found (MODEL_1_NAME/ID/HOST).");
    return { models, issues };
  }

  for (const index of indices) {
    const name = env[`MODEL_${index}_NAME`];
    const id = env[`MODEL_${index}_ID`];
    const host = normalizeHost(env[`MODEL_${index}_HOST`]);

    const missing = [];
    if (!name) missing.push(`MODEL_${index}_NAME`);
    if (!id) missing.push(`MODEL_${index}_ID`);
    if (!host) missing.push(`MODEL_${index}_HOST`);

    if (missing.length > 0) {
      issues.push(`Model ${index} is incomplete (missing: ${missing.join(", ")}).`);
      continue;
    }

    models.push({ name, id, host });
  }

  if (models.length === 0) {
    issues.push("No complete models found. Check MODEL_n_NAME/ID/HOST.");
  }

  return { models, issues };
}

function loadModelsFromEnv(env) {
  return loadModelsFromEnvDetailed(env).models;
}

module.exports = {
  loadModelsFromEnv,
  loadModelsFromEnvDetailed
};
