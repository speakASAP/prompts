function createLoggingClient(config) {
  async function send(level, message, metadata) {
    if (!config.enabled) {
      return;
    }

    const payload = {
      service: "prompts-microservice",
      level: String(level || "info").toUpperCase(),
      message,
      timestamp: metadata.timestamp || new Date().toISOString(),
      meta: metadata
    };

    try {
      await fetch(`${config.serviceUrl}${config.apiPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
