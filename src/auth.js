function resolveUserId(userPayload) {
  if (!userPayload || typeof userPayload !== "object") {
    return null;
  }
  return userPayload.id || userPayload.userId || userPayload.sub || null;
}

function createAuthClient(authConfig, logger) {
  async function request(method, path, body) {
    const url = `${authConfig.serviceUrl}${path}`;
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const message = `Auth request failed (${response.status})`;
      throw new Error(message);
    }

    return response.json();
  }

  async function login(payload) {
    const response = await request("POST", "/auth/login", payload);
    return {
      user: response.user || null,
      accessToken: response.accessToken || response.token || null
    };
  }

  async function register(payload) {
    const response = await request("POST", "/auth/register", payload);
    return {
      user: response.user || null,
      accessToken: response.accessToken || response.token || null
    };
  }

  async function validate(token) {
    const started = Date.now();
    const validation = await request("POST", "/auth/validate", { token });
    const rawUser = validation.user || validation;
    const userId = resolveUserId(rawUser);
    if (!userId) {
      throw new Error("User identifier not found in token payload");
    }

    logger.log("info", "auth_token_validated", {
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - started,
      user_id: userId
    });

    return {
      user: {
        ...rawUser,
        id: userId
      }
    };
  }

  return {
    login,
    register,
    validate
  };
}

module.exports = { createAuthClient };
