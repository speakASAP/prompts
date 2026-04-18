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
  const response = await fetch(path, {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json" },
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

  const actions = document.createElement("div");
  actions.className = "row";
  actions.innerHTML = `
    <button type="button" data-action="edit" data-id="${item.id}">Edit</button>
    <button type="button" data-action="delete" data-id="${item.id}" class="danger">Delete</button>
  `;

  wrapper.append(headerRow, block, tagsEl, actions);
  return wrapper;
}

async function loadPrompts() {
  const search = searchInput.value.trim();
  const category = categoryFilter.value.trim();
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category) params.set("category", category);

  const payload = await api(`/api/prompts?${params.toString()}`);
  promptList.innerHTML = "";
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
  void loadPrompts();
});

categoryFilter.addEventListener("change", () => {
  void loadPrompts();
});

void ensureSession();
