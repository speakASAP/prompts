// LogEntryDto accepts exactly these. Anything else is a 400 that the catch in
// send() would swallow, so an unrecognised level degrades to "info" and keeps
// the line rather than losing it.
const ACCEPTED_LEVELS = ["error", "warn", "info", "debug"];

function normalizeLevel(level) {
  const value = String(level || "info").toLowerCase();
  return ACCEPTED_LEVELS.includes(value) ? value : "info";
}

function createLoggingClient(config) {
  async function send(level, message, metadata) {
    if (!config.enabled) {
      return;
    }

    // Three things here are load-bearing; LogEntryDto runs forbidNonWhitelisted,
    // so getting any of them wrong makes the endpoint reject every line while the
    // catch below hides the rejection. Verified against the live endpoint:
    //   - `meta` is not a DTO field   -> 400 "property meta should not exist"
    //   - uppercased level            -> 400 "level must be one of error|warn|info|debug"
    //   - no Authorization header     -> 401 "Logging ingest credential required"
    // This service logged nothing at all between 2026-08-27 and 2026-09-04 for
    // exactly these reasons.
    const payload = {
      service: "prompts-microservice",
      level: normalizeLevel(level),
      message,
      timestamp: metadata.timestamp || new Date().toISOString(),
      metadata
    };

    const headers = { "Content-Type": "application/json" };
    if (config.token) {
      headers.Authorization = `Bearer ${config.token}`;
    }

    try {
      await fetch(`${config.serviceUrl}${config.apiPath}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(2000)
      });
    } catch (_error) {
      // Keep app resilient if logging service is unavailable.
    }
  }

  return {
    log(level, message, metadata = {}) {
      void send(level, message, metadata);
    }
  };
}

module.exports = { createLoggingClient };
