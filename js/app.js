let firebaseLoaded = false;
let initializeApp, getFirestore, addDoc, collection, getDocs, serverTimestamp;

// Configura tus claves de Firebase. Si quedan en TU_..., se usa modo local/mock.
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID",
};

// Elementos comunes
const authTriggers = document.querySelectorAll('[data-target="auth"]');
const authModal = document.querySelector("#auth-modal");
const closeModalBtn = document.querySelector("#close-modal");
const authTabs = document.querySelectorAll("[data-auth-tab]");
const authViews = document.querySelectorAll("[data-auth-view]");
const navLinks = document.querySelectorAll("[data-nav]");

// Formularios
const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const matriculaForm = document.querySelector("#matricula-form");

// Contenedores de datos
const adminTableBody = document.querySelector("#admin-table-body");
const memberTableBody = document.querySelector("#member-table-body");
const perfilContent = document.querySelector("#perfil-content");

// Campos adicionales
const matTipo = document.querySelector("#mat-tipo");
const memberExtra = document.querySelector("#member-extra");

// Datos de muestra
const fakeMatriculas = [
  {
    nombre: "Valeria Fernandez",
    email: "valeria@example.com",
    telefono: "+52 55 1234 5678",
    sede: "CDMX Norte",
    frecuencia: "3 veces/semana",
    tipo: "miembro",
    estado: "pendiente",
    equipo: "Recurvo 32# - Hoyt",
    puntaje: "620/720",
    medallas: "Plata regional 2024",
    notas: "Trabajando en anclaje",
  },
  {
    nombre: "Luis Paredes",
    email: "luis@example.com",
    telefono: "+52 33 9876 1212",
    sede: "Guadalajara",
    frecuencia: "Libre",
    tipo: "taller",
    estado: "validado",
  },
  {
    nombre: "Ana Rojas",
    email: "ana@example.com",
    telefono: "+52 81 4422 7788",
    sede: "Monterrey",
    frecuencia: "2 veces/semana",
    tipo: "taller",
    estado: "rechazado",
  },
];

let db = null;
let firebaseEnabled = false;
let currentUser = null;

let localUsers = readLocal("usuarios", []);
let localMatriculas = readLocal("matriculas", []);
currentUser = readLocal("currentUser", null);

function hasFirebaseConfig() {
  return Object.values(firebaseConfig).every(
    (value) => value && !String(value).startsWith("TU_")
  );
}

function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeLocal(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("No se pudo escribir en localStorage", e);
  }
}

function showToast(message, type = "info") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 250);
  }, 2600);
}

function setActiveNav() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  const map = {
    "": "index",
    "index.html": "index",
    "matricula.html": "matricula",
    "perfil.html": "perfil",
    "admin.html": "admin",
  };
  const current = map[path] || "";
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.nav === current);
  });
}

async function initFirebase() {
  if (!hasFirebaseConfig()) {
    return null;
  }
  if (!firebaseLoaded) {
    try {
      const appModule = await import("https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js");
      const firestoreModule = await import(
        "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js"
      );
      initializeApp = appModule.initializeApp;
      getFirestore = firestoreModule.getFirestore;
      addDoc = firestoreModule.addDoc;
      collection = firestoreModule.collection;
      getDocs = firestoreModule.getDocs;
      serverTimestamp = firestoreModule.serverTimestamp;
      firebaseLoaded = true;
    } catch (err) {
      console.warn("No se pudo cargar Firebase (sin red o bloqueado). Modo local activo.", err);
      firebaseEnabled = false;
      return null;
    }
  }
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    firebaseEnabled = true;
    await loadAdminData();
    return app;
  } catch (err) {
    console.error("No se pudo inicializar Firebase:", err);
    firebaseEnabled = false;
    return null;
  }
}

function openAuthModal() {
  if (!authModal) return;
  authModal.classList.remove("hidden");
}

function closeAuthModal() {
  if (!authModal) return;
  authModal.classList.add("hidden");
}

function handleAuthTabs() {
  authTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.authTab;
      authTabs.forEach((t) => t.classList.toggle("active", t.dataset.authTab === target));
      authViews.forEach((view) =>
        view.classList.toggle("hidden", view.dataset.authView !== target)
      );
    });
  });
}

function attachModalHandlers() {
  authTriggers.forEach((btn) => btn.addEventListener("click", openAuthModal));
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeAuthModal);
  if (authModal) {
    authModal.addEventListener("click", (e) => {
      if (e.target === authModal) closeAuthModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAuthModal();
    });
  }
}

function handleTipoChange() {
  if (!matTipo || !memberExtra) return;
  memberExtra.classList.toggle("hidden", matTipo.value !== "miembro");
}

function setCurrentUserFromForm(email, telefono, nombre = "") {
  currentUser = { email, telefono, nombre: nombre || email || "Usuario" };
  writeLocal("currentUser", currentUser);
}

if (matTipo) {
  matTipo.addEventListener("change", handleTipoChange);
}

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.querySelector("#login-email").value;
    const telefono = document.querySelector("#login-phone").value;
    setCurrentUserFromForm(email, telefono, email);
    showToast("Inicio de sesion simulado.", "success");
    closeAuthModal();
    window.location.href = "matricula.html";
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      nombre: document.querySelector("#reg-name").value,
      email: document.querySelector("#reg-email").value,
      telefono: document.querySelector("#reg-phone").value,
      nacimiento: document.querySelector("#reg-birth").value,
      creadoEn: new Date().toISOString(),
    };

    setCurrentUserFromForm(data.email, data.telefono, data.nombre);

    if (firebaseEnabled && db) {
      try {
        await addDoc(collection(db, "usuarios"), {
          ...data,
          creadoEn: serverTimestamp(),
        });
        showToast("Registro guardado en Firestore.", "success");
      } catch (err) {
        console.error(err);
        showToast("No se pudo guardar en Firestore.", "error");
      }
    } else {
      localUsers.push(data);
      writeLocal("usuarios", localUsers);
      showToast("Registro guardado en local.", "success");
    }
    closeAuthModal();
    window.location.href = "matricula.html";
  });
}

if (matriculaForm) {
  matriculaForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      tipo: matTipo?.value || "taller",
      sede: document.querySelector("#mat-sede").value,
      frecuencia: document.querySelector("#mat-frecuencia").value,
      frecuenciaPersonalizada: document.querySelector("#mat-custom").value,
      notas: document.querySelector("#mat-notas").value,
      equipo: document.querySelector("#mat-equipo")?.value || "",
      flechas: document.querySelector("#mat-flechas")?.value || "",
      puntaje: document.querySelector("#mat-puntaje")?.value || "",
      medallas: document.querySelector("#mat-medallas")?.value || "",
      estado: "pendiente",
      creadoEn: new Date().toISOString(),
      nombre: currentUser?.nombre || "",
      email: currentUser?.email || "",
      telefono: currentUser?.telefono || "",
    };

    if (firebaseEnabled && db) {
      try {
        await addDoc(collection(db, "matriculas"), {
          ...data,
          creadoEn: serverTimestamp(),
        });
        showToast("Matricula guardada en Firestore.", "success");
        await loadAdminData();
      } catch (err) {
        console.error(err);
        showToast("No se pudo guardar en Firestore.", "error");
      }
    } else {
      localMatriculas.push(data);
      writeLocal("matriculas", localMatriculas);
      showToast("Matricula guardada en local.", "success");
      updateTables(localMatriculas);
    }
  });
}

function renderAdminTable(items) {
  if (!adminTableBody) return;
  adminTableBody.innerHTML = items
    .map(
      (user) => `
        <tr>
          <td>${user.nombre || "--"}</td>
          <td>${user.email || "--"}</td>
          <td>${user.telefono || "--"}</td>
          <td>${user.sede || "--"}</td>
          <td>${user.frecuencia || user.frecuenciaPersonalizada || "--"}</td>
          <td>${user.tipo || "taller"}</td>
          <td><span class="status ${user.estado || "pendiente"}">${user.estado || "pendiente"}</span></td>
        </tr>
      `
    )
    .join("");
}

function renderMemberTable(items) {
  if (!memberTableBody) return;
  const members = items.filter((item) => (item.tipo || "taller") === "miembro");
  memberTableBody.innerHTML = members
    .map(
      (m) => `
        <tr>
          <td>${m.nombre || "--"}</td>
          <td>${m.equipo || m.flechas || "--"}</td>
          <td>${m.puntaje || "--"}</td>
          <td>${m.medallas || "--"}</td>
          <td>${m.notas || "--"}</td>
        </tr>
      `
    )
    .join("");
}

function renderPerfil(items) {
  if (!perfilContent) return;
  const target =
    items.find((i) => currentUser && i.email === currentUser.email) ||
    items.find((i) => (i.tipo || "taller") === "miembro") ||
    items[0];
  if (!target) {
    perfilContent.innerHTML = "<p class='subtitle'>Aun no hay datos para mostrar.</p>";
    return;
  }
  perfilContent.innerHTML = `
    <h3>${target.nombre || "Miembro"}</h3>
    <p class="subtitle">Resumen de tu informacion guardada.</p>
    <div class="chips">
      <div class="chip">Tipo: ${target.tipo || "taller"}</div>
      <div class="chip">Sede: ${target.sede || "--"}</div>
      <div class="chip">Frecuencia: ${target.frecuencia || target.frecuenciaPersonalizada || "--"}</div>
    </div>
    <div class="grid two-col" style="margin-top: 12px;">
      <div>
        <strong>Equipo</strong>
        <p>${target.equipo || target.flechas || "No capturado"}</p>
      </div>
      <div>
        <strong>Puntaje</strong>
        <p>${target.puntaje || "Sin registrar"}</p>
      </div>
      <div>
        <strong>Medallas</strong>
        <p>${target.medallas || "Sin registrar"}</p>
      </div>
      <div>
        <strong>Notas</strong>
        <p>${target.notas || "Sin notas"}</p>
      </div>
    </div>
    <p class="subtitle">Para actualizar, guarda una nueva matricula con tus datos.</p>
  `;
}

async function loadAdminData() {
  if (!firebaseEnabled || !db) {
    const items = localMatriculas.length ? localMatriculas : fakeMatriculas;
    updateTables(items);
    return;
  }
  try {
    const snapshot = await getDocs(collection(db, "matriculas"));
    const items = [];
    snapshot.forEach((doc) => items.push(doc.data()));
    updateTables(items.length ? items : fakeMatriculas);
  } catch (err) {
    console.error("Error cargando matriculas:", err);
    updateTables(fakeMatriculas);
  }
}

function updateTables(items) {
  renderAdminTable(items);
  renderMemberTable(items);
  renderPerfil(items);
}

function init() {
  setActiveNav();
  attachModalHandlers();
  handleAuthTabs();
  handleTipoChange();
  const initial = localMatriculas.length ? localMatriculas : fakeMatriculas;
  updateTables(initial);
  initFirebase();
}

init();
