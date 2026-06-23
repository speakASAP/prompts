const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const messageNode = document.getElementById("message");
const userLabel = document.getElementById("user-label");

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const promptForm = document.getElementById("prompt-form");
const promptList = document.getElementById("prompt-list");

const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");
const paginationStatus = document.getElementById("pagination-status");
const previousPageButton = document.getElementById("previous-page");
const nextPageButton = document.getElementById("next-page");
const exportPromptsButton = document.getElementById("export-prompts");
const importPromptsButton = document.getElementById("import-prompts");
const importPromptsFileInput = document.getElementById("import-prompts-file");

let promptPage = 1;
const promptPageSize = 10;

const logoutButton = document.getElementById("logout-button");
const cancelEditButton = document.getElementById("cancel-edit");
const formTitle = document.getElementById("form-title");

function showMessage(text, isError = false) {
  messageNode.textContent = text;
  messageNode.className = isError ? "message error" : "message";
}

async function copyTextToClipboard(text, feedbackButton) {
  try {
    await navigator.clipboard.writeText(text);
    showMessage("Copied to clipboard.");
    if (feedbackButton) {
      feedbackButton.classList.add("copied");
      const previous = feedbackButton.textContent;
      feedbackButton.textContent = "Copied";
      window.setTimeout(() => {
        feedbackButton.classList.remove("copied");
        feedbackButton.textContent = previous;
      }, 1600);
    }
  } catch (_err) {
    showMessage("Could not copy (clipboard permission denied).", true);
  }
}

async function api(path, options = {}) {
  const sourceMachineParts = [navigator.platform || "", navigator.userAgent || ""]
    .map((value) => String(value).trim())
    .filter(Boolean);
  const response = await fetch(path, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Source-Machine": sourceMachineParts.join(" | ").slice(0, 240)
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (!response.ok) {
    let details = "Request failed";
    try {
      const payload = await response.json();
      details = payload.message || details;
    } catch (_error) {
      // Ignore JSON parse errors on empty responses.
    }
    throw new Error(details);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

function setAuthenticated(user) {
  authSection.classList.add("hidden");
  appSection.classList.remove("hidden");
  userLabel.textContent = `Logged in as ${user.email || user.id}`;
}

function setLoggedOut() {
  authSection.classList.remove("hidden");
  appSection.classList.add("hidden");
  promptList.innerHTML = "";
}

function toFormData(form) {
  const data = new FormData(form);
  return Object.fromEntries(data.entries());
}

function resetPromptForm() {
  promptForm.reset();
  promptForm.elements.id.value = "";
  promptForm.elements.category.value = "prompt";
  formTitle.textContent = "Create prompt";
}

function buildDuplicateTitle(title) {
  const base = String(title || "Untitled prompt").trim() || "Untitled prompt";
  return `Copy of ${base}`;
}

function buildDuplicatePayload(item) {
  return {
    title: buildDuplicateTitle(item.title),
    content: item.content || "",
    tags: Array.isArray(item.tags) ? item.tags.join(", ") : "",
    category: item.category || "prompt"
  };
}

function updatePaginationControls(pagination) {
  if (!pagination || !paginationStatus || !previousPageButton || !nextPageButton) {
    return;
  }

  promptPage = pagination.page;
  paginationStatus.textContent = `Page ${pagination.page} of ${pagination.totalPages} - ${pagination.total} prompts`;
  previousPageButton.disabled = !pagination.hasPreviousPage;
  nextPageButton.disabled = !pagination.hasNextPage;
}

function resetPromptPage() {
  promptPage = 1;
}

function renderPromptItem(item) {
  const wrapper = document.createElement("article");
  wrapper.className = "prompt-item";

  const headerRow = document.createElement("div");
  headerRow.className = "row row-space";
  const titleEl = document.createElement("h3");
  titleEl.textContent = item.title;
  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = item.category;
  headerRow.append(titleEl, badge);

  const block = document.createElement("div");
  block.className = "prompt-block";

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "copy-prompt-btn";
  copyBtn.textContent = "Copy";
  copyBtn.title = "Copy prompt to clipboard";
  copyBtn.setAttribute("aria-label", "Copy prompt to clipboard");

  const pre = document.createElement("pre");
  pre.textContent = item.content;

  copyBtn.addEventListener("click", () => {
    void copyTextToClipboard(item.content ?? "", copyBtn);
  });

  block.append(copyBtn, pre);

  const tagsEl = document.createElement("p");
  tagsEl.className = "tags";
  tagsEl.textContent = (item.tags || []).map((tag) => `#${tag}`).join(" ");

  const auditEl = document.createElement("p");
  auditEl.className = "audit-meta";
  const editor = item.lastEditor || "unknown editor";
  const sourceMachine = item.sourceMachine || "unknown machine";
  const updatedAt = item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "unknown time";
  auditEl.textContent = `Last edited by ${editor} from ${sourceMachine} on ${updatedAt}`;

  const actions = document.createElement("div");
  actions.className = "row";
  actions.innerHTML = `
    <button type="button" data-action="duplicate" data-id="${item.id}">Duplicate</button>
    <button type="button" data-action="edit" data-id="${item.id}">Edit</button>
    <button type="button" data-action="delete" data-id="${item.id}" class="danger">Delete</button>
  `;

  wrapper.append(headerRow, block, tagsEl, auditEl, actions);
  return wrapper;
}

async function loadPrompts() {
  const search = searchInput.value.trim();
  const category = categoryFilter.value.trim();
  const params = new URLSearchParams();
  params.set("page", String(promptPage));
  params.set("limit", String(promptPageSize));
  if (search) params.set("search", search);
  if (category) params.set("category", category);

  const payload = await api(`/api/prompts?${params.toString()}`);
  promptList.innerHTML = "";
  updatePaginationControls(payload.pagination);
  if (!payload.items.length) {
    promptList.innerHTML = `<p>No prompts found.</p>`;
    return;
  }

  payload.items.forEach((item) => {
    promptList.appendChild(renderPromptItem(item));
  });
}

async function ensureSession() {
  try {
    const response = await api("/api/auth/me");
    setAuthenticated(response.user);
    await loadPrompts();
  } catch (_error) {
    setLoggedOut();
  }
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function parseImportPayload(text) {
  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) {
    return { prompts: parsed };
  }
  if (parsed && Array.isArray(parsed.prompts)) {
    return parsed;
  }
  throw new Error("Import file must contain a prompts array.");
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = toFormData(loginForm);
    const response = await api("/api/auth/login", { method: "POST", body: data });
    setAuthenticated(response.user);
    showMessage("Login successful.");
    await loadPrompts();
  } catch (error) {
    showMessage(error.message, true);
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = toFormData(registerForm);
    const response = await api("/api/auth/register", { method: "POST", body: data });
    if (response.user) {
      setAuthenticated(response.user);
      await loadPrompts();
    }
    showMessage("Registration successful. You can start saving prompts.");
  } catch (error) {
    showMessage(error.message, true);
  }
});

logoutButton.addEventListener("click", async () => {
  await api("/api/auth/logout", { method: "POST" });
  setLoggedOut();
  showMessage("Logged out.");
});

cancelEditButton.addEventListener("click", () => {
  resetPromptForm();
});

exportPromptsButton?.addEventListener("click", async () => {
  try {
    const payload = await api("/api/prompts/export");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadJson(`prompts-backup-${timestamp}.json`, payload);
    showMessage(`Exported ${payload.prompts?.length || 0} prompts.`);
  } catch (error) {
    showMessage(error.message, true);
  }
});

importPromptsButton?.addEventListener("click", () => {
  importPromptsFileInput?.click();
});

importPromptsFileInput?.addEventListener("change", async (event) => {
  const input = event.target;
  const file = input?.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const payload = parseImportPayload(text);
    const result = await api("/api/prompts/import", {
      method: "POST",
      body: payload
    });
    resetPromptPage();
    await loadPrompts();
    showMessage(
      `Imported ${result.importedCount} prompts${result.skippedCount ? `, skipped ${result.skippedCount}` : ""}.`
    );
  } catch (error) {
    showMessage(error.message, true);
  } finally {
    input.value = "";
  }
});

const copyFormPromptBtn = document.getElementById("copy-form-prompt");
if (copyFormPromptBtn) {
  copyFormPromptBtn.addEventListener("click", () => {
    const text = String(promptForm.elements.content?.value || "");
    void copyTextToClipboard(text, copyFormPromptBtn);
  });
}

promptForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = toFormData(promptForm);
  const payload = {
    title: data.title,
    content: data.content,
    tags: data.tags,
    category: data.category
  };

  try {
    if (data.id) {
      await api(`/api/prompts/${data.id}`, { method: "PUT", body: payload });
      showMessage("Prompt updated.");
    } else {
      await api("/api/prompts", { method: "POST", body: payload });
      showMessage("Prompt created.");
    }
    resetPromptForm();
    resetPromptPage();
    await loadPrompts();
  } catch (error) {
    showMessage(error.message, true);
  }
});

promptList.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const action = target.dataset.action;
  const id = target.dataset.id;
  if (!action || !id) {
    return;
  }

  if (action === "delete") {
    try {
      await api(`/api/prompts/${id}`, { method: "DELETE" });
      showMessage("Prompt deleted.");
      await loadPrompts();
    } catch (error) {
      showMessage(error.message, true);
    }
    return;
  }

  if (action === "duplicate") {
    const sourceNode = target.closest(".prompt-item");
    const sourceTitle = sourceNode?.querySelector("h3")?.textContent || "prompt";
    try {
      const prompt = await api(`/api/prompts/${id}`);
      await api("/api/prompts", {
        method: "POST",
        body: buildDuplicatePayload(prompt)
      });
      showMessage(`Duplicated "${sourceTitle}".`);
      resetPromptPage();
      await loadPrompts();
    } catch (error) {
      showMessage(error.message, true);
    }
    return;
  }

  if (action === "edit") {
    try {
      const prompt = await api(`/api/prompts/${id}`);
      promptForm.elements.id.value = prompt.id;
      promptForm.elements.title.value = prompt.title;
      promptForm.elements.content.value = prompt.content;
      promptForm.elements.tags.value = (prompt.tags || []).join(", ");
      promptForm.elements.category.value = prompt.category || "prompt";
      formTitle.textContent = "Edit prompt";
      showMessage("Editing prompt.");
    } catch (error) {
      showMessage(error.message, true);
    }
  }
});

searchInput.addEventListener("input", () => {
  resetPromptPage();
  void loadPrompts();
});

categoryFilter.addEventListener("change", () => {
  resetPromptPage();
  void loadPrompts();
});

previousPageButton?.addEventListener("click", () => {
  promptPage = Math.max(promptPage - 1, 1);
  void loadPrompts();
});

nextPageButton?.addEventListener("click", () => {
  promptPage += 1;
  void loadPrompts();
});

void ensureSession();
