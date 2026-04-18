const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const { Pool } = require("pg");
const { loadConfig } = require("./config");
const { createLoggingClient } = require("./logging");
const { createAuthClient } = require("./auth");
const { createPromptRepository } = require("./prompt-repository");

const config = loadConfig();
const app = express();

const dbPool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  max: 10,
  idleTimeoutMillis: 30000
});

const logger = createLoggingClient(config.logging);
const authClient = createAuthClient(config.auth, logger);
const promptRepository = createPromptRepository(dbPool);

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  express.static(path.join(__dirname, "..", "public"), {
    setHeaders(res, assetPath) {
      const base = path.basename(assetPath);
      if (base === "app.js" || base === "styles.css") {
        res.setHeader("Cache-Control", "no-cache, must-revalidate");
      }
    }
  })
);

app.use((req, res, next) => {
  const startedAt = Date.now();
  const startedIso = new Date(startedAt).toISOString();

  res.on("finish", () => {
    logger.log("info", "http_request", {
      timestamp: new Date().toISOString(),
      started_at: startedIso,
      duration_ms: Date.now() - startedAt,
      method: req.method,
      path: req.path,
      status_code: res.statusCode
    });
  });

  next();
});

function extractTokenFromRequest(req) {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }
  return req.cookies[config.auth.cookieName] || null;
}

async function authGuard(req, res, next) {
  const token = extractTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const validation = await authClient.validate(token);
    req.user = validation.user || validation;
    req.accessToken = token;
    return next();
  } catch (error) {
    logger.log("warn", "auth_guard_failed", {
      timestamp: new Date().toISOString(),
      duration_ms: 0,
      reason: error.message
    });
    return res.status(401).json({ message: "Unauthorized" });
  }
}

function normalizePromptInput(body = {}) {
  const title = String(body.title || "").trim();
  const content = String(body.content || "").trim();
  const category = String(body.category || "prompt").trim().toLowerCase();
  const tagsRaw = Array.isArray(body.tags) ? body.tags : String(body.tags || "").split(",");
  const tags = tagsRaw.map((tag) => String(tag).trim()).filter(Boolean);

  return { title, content, category, tags };
}

app.get("/api/health", async (_req, res) => {
  try {
    await dbPool.query("SELECT 1");
    return res.json({
      status: "ok",
      service: config.identity.serviceName,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.log("error", "health_check_failed", {
      timestamp: new Date().toISOString(),
      duration_ms: 0,
      error: error.message
    });
    return res.status(503).json({
      status: "error",
      message: "Database unavailable"
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const started = Date.now();
  try {
    const result = await authClient.login(req.body);
    const token = result.accessToken;

    if (!token) {
      return res.status(502).json({ message: "Auth service did not return access token" });
    }

    res.cookie(config.auth.cookieName, token, {
      httpOnly: true,
      secure: config.identity.nodeEnv === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({ user: result.user, message: "Login successful" });
  } catch (error) {
    logger.log("warn", "auth_login_failed", {
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - started,
      error: error.message
    });
    return res.status(401).json({ message: "Invalid credentials" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const started = Date.now();
  try {
    const result = await authClient.register(req.body);
    const token = result.accessToken;
    if (token) {
      res.cookie(config.auth.cookieName, token, {
        httpOnly: true,
        secure: config.identity.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
    }

    return res.status(201).json({
      user: result.user || null,
      message: "Registration successful"
    });
  } catch (error) {
    logger.log("warn", "auth_register_failed", {
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - started,
      error: error.message
    });
    return res.status(400).json({ message: "Registration failed" });
  }
});

app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie(config.auth.cookieName);
  return res.json({ message: "Logged out" });
});

app.get("/api/auth/me", authGuard, (req, res) => {
  res.json({ user: req.user });
});

app.get("/api/prompts", authGuard, async (req, res) => {
  const started = Date.now();
  try {
    const prompts = await promptRepository.listByOwner(req.user.id, {
      category: req.query.category || "",
      search: req.query.search || ""
    });
    return res.json({ items: prompts });
  } catch (error) {
    logger.log("error", "list_prompts_failed", {
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - started,
      error: error.message
    });
    return res.status(500).json({ message: "Failed to load prompts" });
  }
});

app.get("/api/prompts/:id", authGuard, async (req, res) => {
  try {
    const prompt = await promptRepository.findById(req.params.id, req.user.id);
    if (!prompt) {
      return res.status(404).json({ message: "Prompt not found" });
    }
    return res.json(prompt);
  } catch (_error) {
    return res.status(500).json({ message: "Failed to load prompt" });
  }
});

app.post("/api/prompts", authGuard, async (req, res) => {
  const started = Date.now();
  const payload = normalizePromptInput(req.body);
  if (!payload.title || !payload.content) {
    return res.status(400).json({ message: "Title and content are required" });
  }

  try {
    const created = await promptRepository.create(req.user.id, payload);
    return res.status(201).json(created);
  } catch (error) {
    logger.log("error", "create_prompt_failed", {
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - started,
      error: error.message
    });
    return res.status(500).json({ message: "Failed to create prompt" });
  }
});

app.put("/api/prompts/:id", authGuard, async (req, res) => {
  const started = Date.now();
  const payload = normalizePromptInput(req.body);
  if (!payload.title || !payload.content) {
    return res.status(400).json({ message: "Title and content are required" });
  }

  try {
    const updated = await promptRepository.update(req.params.id, req.user.id, payload);
    if (!updated) {
      return res.status(404).json({ message: "Prompt not found" });
    }
    return res.json(updated);
  } catch (error) {
    logger.log("error", "update_prompt_failed", {
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - started,
      error: error.message
    });
    return res.status(500).json({ message: "Failed to update prompt" });
  }
});

app.delete("/api/prompts/:id", authGuard, async (req, res) => {
  const started = Date.now();
  try {
    const deleted = await promptRepository.remove(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ message: "Prompt not found" });
    }
    return res.status(204).send();
  } catch (error) {
    logger.log("error", "delete_prompt_failed", {
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - started,
      error: error.message
    });
    return res.status(500).json({ message: "Failed to delete prompt" });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

async function start() {
  try {
    await promptRepository.ensureSchema();
    app.listen(config.network.port, () => {
      console.log(
        `[${new Date().toISOString()}] prompts-microservice listening on port ${config.network.port}`
      );
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] startup_failed:`, error);
    process.exit(1);
  }
}

start();
