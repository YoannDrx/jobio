const DEFAULT_API_URL = "https://jobio.app";

let apiUrl = DEFAULT_API_URL;
let parsedMission = null;

// DOM elements
const loginSection = document.getElementById("login-section");
const connectedSection = document.getElementById("connected-section");
const loadingSection = document.getElementById("loading-section");
const previewSection = document.getElementById("preview-section");
const successSection = document.getElementById("success-section");
const userInfo = document.getElementById("user-info");
const previewContent = document.getElementById("preview-content");
const pasteContent = document.getElementById("paste-content");

// Init
document.addEventListener("DOMContentLoaded", async () => {
  const stored = await chrome.storage.local.get(["apiUrl"]);
  if (stored.apiUrl) {
    apiUrl = stored.apiUrl;
    document.getElementById("api-url").value = apiUrl;
  }
  checkAuth();
});

// Auth check
async function checkAuth() {
  try {
    const response = await fetch(`${apiUrl}/api/auth/get-session`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Not authenticated");
    const session = await response.json();
    if (!session?.user) throw new Error("No user");

    showConnected(session.user);
  } catch {
    showLogin();
  }
}

function showLogin() {
  loginSection.classList.remove("hidden");
  connectedSection.classList.add("hidden");
}

function showConnected(user) {
  loginSection.classList.add("hidden");
  connectedSection.classList.remove("hidden");
  loadingSection.classList.add("hidden");
  previewSection.classList.add("hidden");
  successSection.classList.add("hidden");
  userInfo.textContent = user.name || user.email;
}

// Capture URL
document.getElementById("btn-capture-url").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;
  await captureFromSource("url", tab.url);
});

// Capture text
pasteContent.addEventListener("input", () => {
  document.getElementById("btn-capture-text").disabled = !pasteContent.value.trim();
});

document.getElementById("btn-capture-text").addEventListener("click", async () => {
  const text = pasteContent.value.trim();
  if (!text) return;
  await captureFromSource("text", text);
});

async function captureFromSource(source, content) {
  showLoading();
  try {
    const response = await fetch(`${apiUrl}/api/extension/capture`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, content }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Erreur ${response.status}`);
    }

    parsedMission = await response.json();

    // Store the source URL
    if (source === "url") {
      parsedMission.sourceUrl = content;
    }

    showPreview(parsedMission);
  } catch (error) {
    alert(`Erreur : ${error.message}`);
    hideLoading();
  }
}

function showLoading() {
  loadingSection.classList.remove("hidden");
  document.querySelector(".capture-options").classList.add("hidden");
}

function hideLoading() {
  loadingSection.classList.add("hidden");
  document.querySelector(".capture-options").classList.remove("hidden");
}

function showPreview(data) {
  loadingSection.classList.add("hidden");
  document.querySelector(".capture-options").classList.add("hidden");
  previewSection.classList.remove("hidden");

  let html = "";

  if (data.title) {
    html += `<div class="field"><div class="label">Titre</div><div class="value">${escapeHtml(data.title)}</div></div>`;
  }
  if (data.company) {
    html += `<div class="field"><div class="label">Entreprise</div><div class="value">${escapeHtml(data.company)}</div></div>`;
  }
  if (data.tjm) {
    html += `<div class="field"><div class="label">TJM</div><div class="value">${data.tjm}€/j</div></div>`;
  }
  if (data.duration) {
    html += `<div class="field"><div class="label">Durée</div><div class="value">${escapeHtml(data.duration)}</div></div>`;
  }
  if (data.workType) {
    html += `<div class="field"><div class="label">Mode</div><div class="value">${escapeHtml(data.workType)}</div></div>`;
  }
  if (data.location) {
    html += `<div class="field"><div class="label">Lieu</div><div class="value">${escapeHtml(data.location)}</div></div>`;
  }
  if (data.stack && data.stack.length > 0) {
    html += `<div class="field"><div class="label">Stack</div><div class="stack-tags">${data.stack.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div></div>`;
  }
  if (data.description) {
    html += `<div class="field"><div class="label">Description</div><div class="value">${escapeHtml(data.description)}</div></div>`;
  }

  previewContent.innerHTML = html;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Save mission
document.getElementById("btn-save").addEventListener("click", async () => {
  if (!parsedMission) return;

  try {
    const response = await fetch(`${apiUrl}/api/extension/missions`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: parsedMission.title,
        company: parsedMission.company,
        description: parsedMission.description,
        stack: parsedMission.stack || [],
        tjm: parsedMission.tjm,
        duration: parsedMission.duration,
        workType: parsedMission.workType,
        location: parsedMission.location,
        sourceUrl: parsedMission.sourceUrl || null,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Erreur ${response.status}`);
    }

    previewSection.classList.add("hidden");
    successSection.classList.remove("hidden");
  } catch (error) {
    alert(`Erreur : ${error.message}`);
  }
});

// Cancel
document.getElementById("btn-cancel").addEventListener("click", () => {
  previewSection.classList.add("hidden");
  document.querySelector(".capture-options").classList.remove("hidden");
  parsedMission = null;
});

// Open app
document.getElementById("btn-open-app").addEventListener("click", () => {
  const url = document.getElementById("api-url").value || DEFAULT_API_URL;
  chrome.storage.local.set({ apiUrl: url });
  apiUrl = url;
  chrome.tabs.create({ url: `${url}/auth/signin` });
});

// Check auth button
document.getElementById("btn-check-auth").addEventListener("click", () => {
  const url = document.getElementById("api-url").value || DEFAULT_API_URL;
  chrome.storage.local.set({ apiUrl: url });
  apiUrl = url;
  checkAuth();
});

// Open pipeline
document.getElementById("btn-open-pipeline").addEventListener("click", () => {
  chrome.tabs.create({ url: `${apiUrl}/app/pipeline` });
});
