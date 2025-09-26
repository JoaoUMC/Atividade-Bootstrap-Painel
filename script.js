// ========================= Configurações =========================
const GOAL_COURSES = 10; // meta usada na progress bar

// ========================= Utilidades =========================
function showAlert(message, type = "success") {
  const container = document.getElementById("alertContainer");
  if (!container) return;
  const wrapper = document.createElement("div");
  wrapper.className = `alert alert-${type} alert-dismissible fade show`;
  wrapper.role = "alert";
  wrapper.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
  `;
  container.appendChild(wrapper);
  setTimeout(() => {
    const alert = bootstrap.Alert.getOrCreateInstance(wrapper);
    alert.close();
  }, 3500);
}

function showToast(message, theme = "primary") {
  const template = document.getElementById("toastTemplate");
  const container = document.getElementById("toastContainer");
  if (!template || !container) return;

  const clone = template.cloneNode(true);
  const id = `toast-${Date.now()}`;
  clone.id = id;
  clone.classList.remove("hide", "show", "text-bg-primary");
  clone.classList.add(`text-bg-${theme}`);
  clone.querySelector("#toastMessage").textContent = message;

  container.appendChild(clone);
  const toast = new bootstrap.Toast(clone, { delay: 2500 });
  toast.show();
  clone.addEventListener("hidden.bs.toast", () => clone.remove());
}

function initPopovers() {
  const triggers = Array.from(
    document.querySelectorAll('[data-bs-toggle="popover"], [data-bs-toggle-second="popover"]')
  );
  triggers.forEach((el) => new bootstrap.Popover(el));
}

function updateProgressBar() {
  const current = document.querySelectorAll("#coursesList .course-item").length;
  const percent = Math.min(100, Math.round((current / GOAL_COURSES) * 100));
  const bar = document.getElementById("coursesProgress");
  const txt = document.getElementById("progressText");
  if (bar) {
    bar.style.width = percent + "%";
    bar.textContent = percent + "%";
  }
  if (txt) txt.textContent = `${current} de ${GOAL_COURSES} cursos`;
}

// ========================= Paginação =========================
let currentPage = 1;

function renderPagination(totalItems, itemsPerPage) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const ul = document.getElementById("pagination");
  if (!ul) return;

  ul.innerHTML = "";

  const mkItem = (label, page, disabled = false, active = false) => {
    const li = document.createElement("li");
    li.className = `page-item ${disabled ? "disabled" : ""} ${active ? "active" : ""}`;
    const a = document.createElement("a");
    a.className = "page-link";
    a.href = "#sec-cursos";
    a.textContent = label;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      if (!disabled) {
        currentPage = page;
        paginate();
        document.querySelector("#sec-cursos")?.scrollIntoView({ behavior: "smooth" });
      }
    });
    li.appendChild(a);
    return li;
  };

  ul.appendChild(mkItem("«", Math.max(1, currentPage - 1), currentPage === 1));
  for (let p = 1; p <= totalPages; p++) {
    ul.appendChild(mkItem(String(p), p, false, p === currentPage));
  }
  ul.appendChild(mkItem("»", Math.min(totalPages, currentPage + 1), currentPage === totalPages));
}

function paginate() {
  const list = document.getElementById("coursesList");
  if (!list) return;

  const perPage = Number(list.dataset.itemsPerPage) || 4;
  const all = Array.from(list.querySelectorAll(".course-item"));
  const filtered = all.filter((el) => el.style.display !== "none"); // só os visíveis após filtro

  const total = filtered.length;
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;

  filtered.forEach((el, idx) => {
    el.classList.toggle("d-none", !(idx >= start && idx < end));
  });

  renderPagination(total, perPage);
}

// ========================= Filtro por categoria =========================
function setupCategoryFilter() {
  const dropdown = document.getElementById("categoryDropdown");
  if (!dropdown) return;

  dropdown.addEventListener("click", (e) => {
    const btn = e.target.closest(".dropdown-item");
    if (!btn) return;

    dropdown.querySelectorAll(".dropdown-item").forEach((i) => i.classList.remove("active"));
    btn.classList.add("active");

    const cat = btn.dataset.category; // 'all' ou nome
    const items = document.querySelectorAll("#coursesList .course-item");
    items.forEach((el) => {
      const elCat = el.dataset.category;
      el.style.display = cat === "all" || elCat === cat ? "" : "none";
      el.classList.remove("d-none"); // reseta visual para a paginação controlar depois
    });

    currentPage = 1;
    paginate();
  });
}

// ========================= Interações salvar/excluir =========================
function setupSaveDelete() {
  const list = document.getElementById("coursesList");
  if (!list) return;

  list.addEventListener("click", (e) => {
    const saveBtn = e.target.closest(".btn-save");
    const delBtn = e.target.closest(".btn-delete");

    if (saveBtn) {
      const name = saveBtn.dataset.course || "Curso";
      showToast(`Curso salvo: ${name}`, "success");
      showAlert(`"${name}" foi salvo com sucesso.`, "success");
    }

    if (delBtn) {
      const cardCol = delBtn.closest(".course-item");
      const name = delBtn.dataset.course || "Curso";
      cardCol?.remove();
      showToast(`Curso excluído: ${name}`, "warning");
      showAlert(`"${name}" foi excluído.`, "warning");
      updateProgressBar();
      currentPage = 1;
      paginate();
    }
  });
}

// ========================= Formulário (validação + criação de card) =========================
function setupForm() {
  // Range
  const rangeInput = document.getElementById("range4");
  const rangeOutput = document.getElementById("rangeValue");
  if (rangeInput && rangeOutput) {
    rangeOutput.textContent = rangeInput.value + " h";
    rangeInput.addEventListener("input", function () {
      rangeOutput.textContent = this.value + " h";
    });
  }

  // Validação BS
  Array.from(document.querySelectorAll(".needs-validation")).forEach((form) => {
    form.addEventListener(
      "submit",
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add("was-validated");
      },
      false
    );
  });

  // Submit para adicionar curso
  const form = document.getElementById("newCourseForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    if (!form.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    event.preventDefault();
    const title = document.getElementById("courseTitle").value.trim();
    const cat = document.getElementById("courseType").value;
    const desc = document.getElementById("courseDescription").value.trim();

    addCourseCard({ title, category: cat, description: desc });

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("exampleModal"));
    modal.hide();

    showToast(`Curso criado: ${title}`, "primary");
    showAlert(`"${title}" foi cadastrado com sucesso.`, "success");

    form.reset();
    form.classList.remove("was-validated");
    if (rangeOutput) rangeOutput.textContent = "50 h";
  });
}

function addCourseCard({ title, category, description }) {
  const list = document.getElementById("coursesList");
  if (!list) return;

  const col = document.createElement("div");
  col.className = "col-12 col-sm-6 col-lg-3 course-item";
  col.dataset.category = category;

  const badgeClass =
    category === "Idiomas"
      ? "text-bg-primary"
      : category === "Informática"
      ? "text-bg-secondary"
      : category === "Administracao"
      ? "text-bg-info"
      : category === "Educacional"
      ? "text-bg-warning"
      : "text-bg-dark";

  const collapseId = `collapse-${Date.now()}`;

  col.innerHTML = `
    <div class="card h-100">
      <img src="https://images.unsplash.com/photo-1529078155058-5d716f45d604?q=80&w=1200&auto=format&fit=crop" class="card-img-top" alt="Capa do curso">
      <div class="card-body d-flex flex-column">
        <h5 class="card-title mb-1">${title}</h5>
        <p class="card-text small">${description}</p>
        <div class="d-flex flex-wrap gap-2 mb-2">
          <span class="badge ${badgeClass}">${category}</span>
          <span class="badge text-bg-light">Nível: Básico</span>
        </div>
        <a class="btn btn-primary btn-sm mt-1" data-bs-toggle="collapse" href="#${collapseId}" role="button" aria-expanded="false" aria-controls="${collapseId}">
          Detalhes
        </a>
        <div class="collapse mt-2" id="${collapseId}">
          <div class="card card-body">Descrição detalhada do curso "${title}".</div>
        </div>
        <div class="mt-auto d-flex gap-2">
          <button class="btn btn-success btn-sm btn-save" data-course="${title}">Salvar</button>
          <button class="btn btn-outline-danger btn-sm btn-delete" data-course="${title}">Excluir</button>
        </div>
      </div>
    </div>
  `;

  list.appendChild(col);
  updateProgressBar();
  currentPage = 1;
  paginate();
}

// ========================= Init =========================
document.addEventListener("DOMContentLoaded", () => {
  initPopovers();

  // Reativa/instancia Scrollspy caso necessário
  bootstrap.ScrollSpy.getInstance(document.body) ||
    new bootstrap.ScrollSpy(document.body, { target: "#navbarSpy", offset: 80 });

  setupCategoryFilter();
  setupSaveDelete();
  setupForm();

  updateProgressBar();
  paginate();
});
