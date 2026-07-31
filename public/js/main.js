document.getElementById("year").textContent = new Date().getFullYear();

// Mobile nav toggle
const navToggle = document.getElementById("navToggle");
const mainNav = document.getElementById("mainNav");
navToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});
mainNav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => mainNav.classList.remove("open"));
});

const tabsEl = document.getElementById("sectorTabs");
const panelsEl = document.getElementById("sectorPanels");

function projectCard(project) {
  const hasImage = Boolean(project.imageUrl);
  const hasLink = Boolean(project.link);

  const imageHtml = hasImage
    ? `<img src="${project.imageUrl}" alt="${project.name}" class="project-img" onerror="this.parentElement.innerHTML = '<div class=\\'project-img placeholder\\'><span>🖼️</span><small>تعذر تحميل الصورة</small></div>';" />`
    : `<div class="project-img placeholder"><span>🖼️</span><small>الصورة قيد الإضافة</small></div>`;

  const linkHtml = hasLink
    ? `<a href="${project.link}" target="_blank" rel="noopener" class="project-link">عرض التفاصيل ←</a>`
    : `<span class="project-link project-link-disabled">الرابط قيد الإضافة قريباً</span>`;

  return `
    <div class="project-card">
      ${imageHtml}
      <div class="project-body">
        <h4>${project.name}</h4>
        <p>${project.description || ""}</p>
        ${linkHtml}
      </div>
    </div>
  `;
}

function sectorPanel(sector, index) {
  const cards = sector.projects.length
    ? sector.projects.map(projectCard).join("")
    : `<p class="empty-state">لا توجد مشاريع مضافة بعد في هذا القطاع.</p>`;

  return `
    <div class="sector-panel ${index === 0 ? "active" : ""}" id="panel-${sector.id}" role="tabpanel">
      <p class="sector-desc">${sector.description}</p>
      <div class="projects-grid">${cards}</div>
    </div>
  `;
}

async function loadSectors() {
  try {
    const res = await fetch("/api/sectors");
    if (!res.ok) throw new Error("failed");
    const sectorsData = await res.json();

    sectorsData.forEach((sector, index) => {
      const tab = document.createElement("button");
      tab.className = "sector-tab" + (index === 0 ? " active" : "");
      tab.type = "button";
      tab.setAttribute("role", "tab");
      tab.dataset.target = `panel-${sector.id}`;
      tab.innerHTML = `<span class="sector-icon">${sector.icon}</span> ${sector.title}`;
      tabsEl.appendChild(tab);

      panelsEl.insertAdjacentHTML("beforeend", sectorPanel(sector, index));
    });
  } catch (err) {
    panelsEl.innerHTML = `<p class="empty-state">تعذر تحميل بيانات المشاريع حالياً، حاول تحديث الصفحة.</p>`;
  }
}

tabsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".sector-tab");
  if (!btn) return;

  tabsEl.querySelectorAll(".sector-tab").forEach(t => t.classList.remove("active"));
  panelsEl.querySelectorAll(".sector-panel").forEach(p => p.classList.remove("active"));

  btn.classList.add("active");
  document.getElementById(btn.dataset.target).classList.add("active");
});

loadSectors();
