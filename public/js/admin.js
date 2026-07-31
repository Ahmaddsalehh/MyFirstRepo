const TOKEN_KEY = "almohandes_admin_token";

const loginScreen = document.getElementById("loginScreen");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");

const sectorSelect = document.getElementById("sectorSelect");
const projectForm = document.getElementById("projectForm");
const projectsList = document.getElementById("projectsList");
const formTitle = document.getElementById("formTitle");
const formMessage = document.getElementById("formMessage");
const cancelEditBtn = document.getElementById("cancelEditBtn");

let sectorsCache = [];

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function showLogin() {
  localStorage.removeItem(TOKEN_KEY);
  loginScreen.classList.remove("hidden");
  dashboard.classList.add("hidden");
}

function showDashboard() {
  loginScreen.classList.add("hidden");
  dashboard.classList.remove("hidden");
  loadSectorsAndProjects();
}

async function apiFetch(url, options = {}) {
  const headers = options.headers || {};
  if (getToken()) headers["Authorization"] = `Bearer ${getToken()}`;

  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    showLogin();
    throw new Error("انتهت الجلسة، سجل الدخول مرة أخرى");
  }
  return res;
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";

  const formData = new FormData(loginForm);
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password")
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "فشل تسجيل الدخول");

    localStorage.setItem(TOKEN_KEY, data.token);
    showDashboard();
  } catch (err) {
    loginError.textContent = err.message;
  }
});

logoutBtn.addEventListener("click", showLogin);

async function loadSectorsAndProjects() {
  try {
    const res = await apiFetch("/api/sectors");
    if (!res.ok) throw new Error("تعذر تحميل البيانات من الخادم");
    sectorsCache = await res.json();
    renderSectorOptions();
    renderProjectsList();
  } catch (err) {
    // apiFetch already redirected to login on 401; anything else, show it
    if (getToken()) {
      projectsList.innerHTML = `<p class="empty-state">${err.message || "تعذر تحميل البيانات، حاول تحديث الصفحة"}</p>`;
    }
  }
}

function renderSectorOptions() {
  sectorSelect.innerHTML = sectorsCache
    .map((s) => `<option value="${s.id}">${s.icon} ${s.title}</option>`)
    .join("");
}

function renderProjectsList() {
  projectsList.innerHTML = sectorsCache
    .map(
      (sector) => `
      <div class="admin-sector-block">
        <h3>${sector.icon} ${sector.title} <span class="admin-count">(${sector.projects.length})</span></h3>
        <div class="admin-projects-grid">
          ${
            sector.projects.length
              ? sector.projects.map((p) => adminProjectCard(p, sector)).join("")
              : `<p class="empty-state">لا توجد مشاريع في هذا القطاع بعد.</p>`
          }
        </div>
      </div>
    `
    )
    .join("");

  projectsList.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => startEdit(btn.dataset.edit));
  });
  projectsList.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => deleteProject(btn.dataset.delete));
  });
}

function adminProjectCard(project, sector) {
  const imageHtml = project.imageUrl
    ? `<img src="${project.imageUrl}" alt="${project.name}" class="admin-project-img" />`
    : `<div class="admin-project-img placeholder">🖼️</div>`;

  return `
    <div class="admin-project-card">
      ${imageHtml}
      <div class="admin-project-body">
        <strong>${project.name}</strong>
        <p>${project.description || ""}</p>
        <p class="admin-link-status">${project.link ? `<a href="${project.link}" target="_blank">${project.link}</a>` : "بدون رابط بعد"}</p>
        <div class="admin-card-actions">
          <button class="btn-mini" data-edit="${project._id}" data-sector="${sector.id}">تعديل</button>
          <button class="btn-mini btn-mini-danger" data-delete="${project._id}">حذف</button>
        </div>
      </div>
    </div>
  `;
}

function findProject(id) {
  for (const sector of sectorsCache) {
    const found = sector.projects.find((p) => p._id === id);
    if (found) return found;
  }
  return null;
}

function startEdit(id) {
  const project = findProject(id);
  if (!project) return;

  projectForm.projectId.value = project._id;
  projectForm.sectorId.value = project.sectorId;
  projectForm.name.value = project.name;
  projectForm.description.value = project.description || "";
  projectForm.link.value = project.link || "";

  formTitle.textContent = `تعديل: ${project.name}`;
  cancelEditBtn.classList.remove("hidden");
  projectForm.scrollIntoView({ behavior: "smooth" });
}

cancelEditBtn.addEventListener("click", () => {
  projectForm.reset();
  projectForm.projectId.value = "";
  formTitle.textContent = "إضافة مشروع جديد";
  cancelEditBtn.classList.add("hidden");
});

async function deleteProject(id) {
  if (!confirm("هل أنت متأكد من حذف هذا المشروع؟")) return;
  try {
    const res = await apiFetch(`/api/projects/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "فشل الحذف");
    loadSectorsAndProjects();
  } catch (err) {
    alert(err.message);
  }
}

projectForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMessage.textContent = "";

  const id = projectForm.projectId.value;
  const formData = new FormData(projectForm);
  formData.delete("projectId");

  try {
    const res = await apiFetch(id ? `/api/projects/${id}` : "/api/projects", {
      method: id ? "PUT" : "POST",
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "فشل الحفظ");

    projectForm.reset();
    projectForm.projectId.value = "";
    formTitle.textContent = "إضافة مشروع جديد";
    cancelEditBtn.classList.add("hidden");
    formMessage.textContent = "تم الحفظ بنجاح.";
    loadSectorsAndProjects();
  } catch (err) {
    formMessage.textContent = err.message;
  }
});

if (getToken()) {
  showDashboard();
} else {
  showLogin();
}
