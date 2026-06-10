const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const CYAN = "#00e5c3";
const PURPLE = "#a78bfa";
const BLUE = "#60a5fa";
const SESSION_KEY = "ananditos.usuario";
const cooldowns = new Map();

let graficoFluxoPorHora = null;
let graficoVariabilidadeSemanal = null;
let graficoEntradasSaidas = null;
let graficoOcupacaoPorSetor = null;
let graficoOcupacaoDia = null;

if (window.Chart) {
  Chart.defaults.color = "#8a95a6";
  Chart.defaults.font.family = "'Space Grotesk', Arial, sans-serif";
  Chart.defaults.font.size = 11;
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, { threshold: 0.12 });

$$(".fade-up").forEach((element) => observer.observe(element));

function setStatus(element, message, type = "") {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.classList.remove("success", "error");

  if (type) {
    element.classList.add(type);
  }
}

function setButtonLoading(button, loading) {
  if (!button) {
    return;
  }

  if (loading) {
    button.dataset.label = button.textContent;
    button.textContent = "Enviando...";
    button.disabled = true;
    return;
  }

  button.textContent = button.dataset.label || button.textContent;
  button.disabled = false;
}

async function apiFetch(url, options = {}, cooldownKey = url, cooldownMs = 900) {
  const now = Date.now();
  const nextAllowedAt = cooldowns.get(cooldownKey) || 0;

  if (now < nextAllowedAt) {
    throw new Error("Aguarde alguns segundos antes de tentar novamente.");
  }

  cooldowns.set(cooldownKey, now + cooldownMs);

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const retryAfter = response.headers.get("Retry-After");
    const message = payload?.message || payload?.error || "Nao foi possivel concluir a requisicao.";
    throw new Error(retryAfter ? `${message} Tente novamente em ${retryAfter}s.` : message);
  }

  return payload;
}

function getStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function storeUser(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  renderSession();
}

function clearUser() {
  sessionStorage.removeItem(SESSION_KEY);
  renderSession();
}

function renderSession() {
  const user = getStoredUser();
  const label = $("#session-user");
  const logoutButton = $("#logout-button");

  if (!label || !logoutButton) {
    return;
  }

  if (user) {
    label.textContent = `${user.nome} (${user.email})`;
    logoutButton.hidden = false;
    return;
  }

  label.textContent = "Nenhum usuario conectado";
  logoutButton.hidden = true;
}

function bindAuthForms() {
  const loginForm = $("#login-form");
  const cadastroForm = $("#cadastro-form");
  const logoutButton = $("#logout-button");

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const button = loginForm.querySelector("button[type='submit']");
    const status = $("#login-status");
    setStatus(status, "");
    setButtonLoading(button, true);

    try {
      const user = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: $("#login-email").value.trim(),
          senha: $("#login-senha").value
        })
      }, "auth-login", 1200);

      storeUser(user);
      setStatus(status, "Login realizado com sucesso.", "success");
      loginForm.reset();
    } catch (error) {
      setStatus(status, error.message, "error");
    } finally {
      setButtonLoading(button, false);
    }
  });

  cadastroForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const button = cadastroForm.querySelector("button[type='submit']");
    const status = $("#cadastro-status");
    setStatus(status, "");
    setButtonLoading(button, true);

    try {
      const user = await apiFetch("/user", {
        method: "POST",
        body: JSON.stringify({
          nome: $("#cadastro-nome").value.trim(),
          email: $("#cadastro-email").value.trim(),
          senha: $("#cadastro-senha").value
        })
      }, "user-create", 1200);

      storeUser(user);
      setStatus(status, "Cadastro criado e sessao iniciada.", "success");
      cadastroForm.reset();
    } catch (error) {
      setStatus(status, error.message, "error");
    } finally {
      setButtonLoading(button, false);
    }
  });

  logoutButton?.addEventListener("click", () => clearUser());
}

async function carregarDadosDashboard(periodos = {}) {
  const params = new URLSearchParams({
    periodo: periodos.periodo || "hoje",
    periodoVariabilidade: periodos.periodoVariabilidade || "atual",
    periodoEntradasSaidas: periodos.periodoEntradasSaidas || "hoje",
    periodoOcupacao: periodos.periodoOcupacao || "hoje",
    periodoSetor: periodos.periodoSetor || "hoje"
  });

  return apiFetch(`/dashboard/dados?${params.toString()}`, {
    method: "GET",
    headers: {}
  }, "dashboard", 350);
}

function destroyChart(chart) {
  if (chart) {
    chart.destroy();
  }
}

function showDashboardError(message) {
  const status = $("#dashboard-status");
  if (!status) {
    return;
  }

  status.hidden = !message;
  status.textContent = message || "";
}

function setActiveButton(button, selector) {
  $$(selector).forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
}

async function criarGraficoFluxoPorHora(periodo = "hoje") {
  const dados = await carregarDadosDashboard({ periodo });
  const horas = Array.from({ length: 24 }, (_, index) => index);
  const labels = horas.map((hora) => `${hora}h`);
  const valores = horas.map((hora) => {
    const item = dados.fluxoPorHora.find((registro) => Number(registro.hora) === hora);
    return item ? Number(item.entradas) + Number(item.saidas) : 0;
  });

  destroyChart(graficoFluxoPorHora);
  graficoFluxoPorHora = new Chart($("#chart1"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Fluxo por hora",
        data: valores,
        backgroundColor: (context) => {
          const value = context.parsed.y;
          if (value > 760) return "#ff6b6b";
          if (value > 520) return CYAN;
          return "rgba(0, 229, 195, 0.45)";
        },
        borderRadius: 5,
        borderSkipped: false
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: "rgba(255, 255, 255, 0.04)" } },
        y: { beginAtZero: true, grid: { color: "rgba(255, 255, 255, 0.04)" } }
      }
    }
  });
}

async function criarGraficoVariabilidadeSemanal(periodoVariabilidade = "atual") {
  const dados = await carregarDadosDashboard({ periodoVariabilidade });
  const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
  const findDia = (dia) => dados.variabilidadeSemanal.find((item) => item.dia === dia);

  destroyChart(graficoVariabilidadeSemanal);
  graficoVariabilidadeSemanal = new Chart($("#chart2"), {
    type: "bar",
    data: {
      labels: dias,
      datasets: [
        {
          label: "Minimo",
          data: dias.map((dia) => Number(findDia(dia)?.minimo || 0)),
          backgroundColor: "rgba(0, 229, 195, 0.25)",
          borderRadius: 4
        },
        {
          label: "Medio",
          data: dias.map((dia) => Number(findDia(dia)?.media || 0)),
          backgroundColor: "rgba(0, 229, 195, 0.5)",
          borderRadius: 4
        },
        {
          label: "Maximo",
          data: dias.map((dia) => Number(findDia(dia)?.maximo || 0)),
          backgroundColor: CYAN,
          borderRadius: 4
        }
      ]
    },
    options: {
      plugins: { legend: { position: "top", labels: { boxWidth: 10, padding: 14 } } },
      scales: {
        x: { grid: { color: "rgba(255, 255, 255, 0.04)" } },
        y: { beginAtZero: true, grid: { color: "rgba(255, 255, 255, 0.04)" } }
      }
    }
  });
}

async function criarGraficoEntradasSaidasPorDia(periodoEntradasSaidas = "hoje") {
  const dados = await carregarDadosDashboard({ periodoEntradasSaidas });
  const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
  const findDia = (dia) => dados.entradasSaidasPorDia.find((item) => item.dia === dia);

  destroyChart(graficoEntradasSaidas);
  graficoEntradasSaidas = new Chart($("#chart3"), {
    type: "bar",
    data: {
      labels: dias,
      datasets: [
        {
          label: "Entradas",
          data: dias.map((dia) => Number(findDia(dia)?.entradas || 0)),
          backgroundColor: CYAN,
          borderRadius: 4
        },
        {
          label: "Saidas",
          data: dias.map((dia) => Number(findDia(dia)?.saidas || 0)),
          backgroundColor: PURPLE,
          borderRadius: 4
        }
      ]
    },
    options: {
      plugins: { legend: { position: "top", labels: { boxWidth: 10, padding: 14 } } },
      scales: {
        x: { grid: { color: "rgba(255, 255, 255, 0.04)" } },
        y: { beginAtZero: true, grid: { color: "rgba(255, 255, 255, 0.04)" } }
      }
    }
  });
}

async function criarGraficoOcupacaoPorSetor(periodoSetor = "hoje") {
  const dados = await carregarDadosDashboard({ periodoSetor });

  destroyChart(graficoOcupacaoPorSetor);
  graficoOcupacaoPorSetor = new Chart($("#chart4"), {
    type: "doughnut",
    data: {
      labels: dados.ocupacaoPorSetor.map((item) => item.setor),
      datasets: [{
        data: dados.ocupacaoPorSetor.map((item) => Number(item.ocupacao)),
        backgroundColor: [CYAN, PURPLE, BLUE, "#f59e0b", "rgba(255, 255, 255, 0.16)"],
        borderColor: "#0c0f14",
        borderWidth: 3,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: { boxWidth: 10, padding: 12, font: { size: 11 } }
        }
      },
      cutout: "65%"
    }
  });
}

async function criarGraficoOcupacaoAoLongoDoDia(periodoOcupacao = "hoje") {
  const dados = await carregarDadosDashboard({ periodoOcupacao });

  destroyChart(graficoOcupacaoDia);
  graficoOcupacaoDia = new Chart($("#chart5"), {
    type: "line",
    data: {
      labels: dados.ocupacaoAoLongoDoDia.map((item) => item.horario),
      datasets: [{
        label: "Ocupacao",
        data: dados.ocupacaoAoLongoDoDia.map((item) => Number(item.ocupacao)),
        borderColor: CYAN,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.4,
        fill: true,
        backgroundColor: (context) => {
          const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 220);
          gradient.addColorStop(0, "rgba(0, 229, 195, 0.2)");
          gradient.addColorStop(1, "rgba(0, 229, 195, 0)");
          return gradient;
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: "rgba(255, 255, 255, 0.04)" }, ticks: { maxTicksLimit: 12 } },
        y: { beginAtZero: true, grid: { color: "rgba(255, 255, 255, 0.04)" } }
      }
    }
  });
}

function bindDashboardFilters() {
  $$("#filtro-fluxo-hora .toggle-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      setActiveButton(button, "#filtro-fluxo-hora .toggle-btn");
      await reloadChart(() => criarGraficoFluxoPorHora(button.dataset.periodo));
    });
  });

  $$("#filtro-variabilidade-semanal .toggle-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      setActiveButton(button, "#filtro-variabilidade-semanal .toggle-btn");
      await reloadChart(() => criarGraficoVariabilidadeSemanal(button.dataset.periodoVariabilidade));
    });
  });

  $$("#filtro-entradas-saidas .toggle-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      setActiveButton(button, "#filtro-entradas-saidas .toggle-btn");
      await reloadChart(() => criarGraficoEntradasSaidasPorDia(button.dataset.periodoEntradasSaidas));
    });
  });

  $$("#filtro-ocupacao-setor .toggle-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      setActiveButton(button, "#filtro-ocupacao-setor .toggle-btn");
      await reloadChart(() => criarGraficoOcupacaoPorSetor(button.dataset.periodoSetor));
    });
  });

  $$("#filtro-ocupacao .toggle-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      setActiveButton(button, "#filtro-ocupacao .toggle-btn");
      await reloadChart(() => criarGraficoOcupacaoAoLongoDoDia(button.dataset.periodoOcupacao));
    });
  });
}

async function reloadChart(action) {
  try {
    showDashboardError("");
    await action();
  } catch (error) {
    showDashboardError(error.message);
  }
}

async function initDashboard() {
  if (!window.Chart) {
    showDashboardError("A biblioteca de graficos nao carregou. Verifique a conexao com a CDN do Chart.js.");
    return;
  }

  try {
    await Promise.all([
      criarGraficoFluxoPorHora("hoje"),
      criarGraficoVariabilidadeSemanal("atual"),
      criarGraficoEntradasSaidasPorDia("hoje"),
      criarGraficoOcupacaoPorSetor("hoje"),
      criarGraficoOcupacaoAoLongoDoDia("hoje")
    ]);
  } catch (error) {
    showDashboardError(error.message);
  }
}

bindAuthForms();
bindDashboardFilters();
renderSession();
initDashboard();
