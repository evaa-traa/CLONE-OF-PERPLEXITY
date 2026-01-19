function loadModelsFromEnv(env) {
  const models = [];
  let index = 1;
  while (true) {
    const name = env[`MODEL_${index}_NAME`];
    const id = env[`MODEL_${index}_ID`];
    const host = env[`MODEL_${index}_HOST`];
    if (!name && !id && !host) {
      break;
    }
    if (name && id && host) {
      models.push({
        name,
        id,
        host: host.replace(/\/$/, "")
      });
    }
    index += 1;
  }
  return models;
}

module.exports = {
  loadModelsFromEnv
};
