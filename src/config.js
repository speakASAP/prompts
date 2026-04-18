const dotenv = require("dotenv");

dotenv.config();

function requireEnv(name, fallback = "") {
  const value = process.env[name] || fallback;
  if (value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function toNumber(value, fallback) {
  const parsed = Number.parseInt(String(value || fallback), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function loadConfig() {
  return {
    identity: {
      nodeEnv: process.env.NODE_ENV || "production",
      serviceName: process.env.SERVICE_NAME || "prompts-microservice",
      domain: process.env.DOMAIN || "prompts.alfares.cz"
    },
    network: {
      port: toNumber(process.env.PORT, 3000)
    },
    db: {
      host: requireEnv("DB_HOST", "db-server-postgres"),
      port: toNumber(process.env.DB_PORT, 5432),
      user: requireEnv("DB_USER", "dbadmin"),
      password: process.env.DB_PASSWORD || "",
      name: requireEnv("DB_NAME", "prompts_microservice")
    },
    auth: {
      serviceUrl: requireEnv("AUTH_SERVICE_URL", "http://auth-microservice:3370"),
      cookieName: process.env.AUTH_COOKIE_NAME || "prompts_auth_token"
    },
    logging: {
      serviceUrl: requireEnv("LOGGING_SERVICE_URL", "http://logging-microservice:3367"),
      apiPath: process.env.LOGGING_SERVICE_API_PATH || "/api/logs",
      enabled: (process.env.LOGGING_ENABLED || "true").toLowerCase() === "true"
    }
  };
}

module.exports = { loadConfig };
