const state = {
  rows: [],
  main: null
};

function setStatus(message, type = "info") {
  const box = document.getElementById("statusBox");
  box.textContent = message;
  box.className = `status ${type}`;
}

function compact(text, max = 160) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

async function loadData() {
  setStatus("Carregando árvore estratégica...", "info");

  const { data, error } = await supabaseClient
    .from("arvore_estrategica_consolidada")
    .select("*");

  if (error) throw new Error(`Erro ao carregar dados: ${error.message}`);

  state.rows = data || [];
  state.main = state.rows[0] || null;

  renderAll();
  setStatus("Dados carregados. A trilha estratégica está pronta para o storytelling.", "success");
}

function uniqueCount(field) {
  return new Set(state.rows.map(r => r[field]).filter(Boolean)).size;
}

function renderMetrics() {
  document.getElementById("metricMissoes").textContent = uniqueCount("missao_id");
  document.getElementById("metricObjetivos").textContent = uniqueCount("objetivo_id");
  document.getElementById("metricIniciativas").textContent = uniqueCount("iniciativa_id");
}

function renderPath() {
  const container = document.getElementById("strategyPath");
  container.innerHTML = "";

  if (!state.main) {
    container.innerHTML = `<article class="path-card"><p>Nenhum dado estratégico encontrado.</p></article>`;
    return;
  }

  const row = state.main;

  const steps = [
    {
      label: "Missão",
      title: row.missao_titulo,
      description: row.missao_descricao,
      meta: ["Por que existimos?"]
    },
    {
      label: "Objetivo",
      title: row.objetivo_titulo,
      description: row.objetivo_descricao,
      meta: [`Prioridade: ${row.objetivo_prioridade || "-"}`]
    },
    {
      label: "Processo",
      title: row.processo_titulo,
      description: row.processo_descricao,
      meta: [`Área: ${row.processo_area || "-"}`]
    },
    {
      label: "Estratégia",
      title: row.estrategia_titulo,
      description: row.estrategia_descricao,
      meta: [`Tipo: ${row.estrategia_tipo || "-"}`]
    },
    {
      label: "Iniciativa",
      title: row.iniciativa_titulo,
      description: row.iniciativa_descricao,
      meta: [
        `Responsável: ${row.iniciativa_responsavel || "-"}`,
        `Horizonte: ${row.iniciativa_horizonte || "-"}`,
        `Status: ${row.iniciativa_status || "-"}`
      ]
    },
    {
      label: "Medida",
      title: row.medida_titulo,
      description: row.medida_descricao,
      meta: [
        `Tipo: ${row.medida_tipo || "-"}`,
        `Prioridade: ${row.medida_prioridade || "-"}`
      ]
    }
  ];

  steps.forEach((step, index) => {
    const card = document.createElement("article");
    card.className = "path-card";
    card.innerHTML = `
      <div class="path-step">${String(index + 1).padStart(2, "0")}<br>${step.label}</div>
      <div class="path-content">
        <h3>${step.title || "-"}</h3>
        <p>${step.description || "-"}</p>
        <div class="path-meta">
          ${step.meta.map((item, idx) => `<span class="badge ${idx % 2 ? "badge-gold" : "badge-blue"}">${item}</span>`).join("")}
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderSynthesis() {
  const row = state.main;
  const text = row
    ? `A formulação estratégica parte da missão do Ministério da Defesa frente a crises complexas e a traduz em um objetivo de fortalecimento da capacidade integrada de antecipação, monitoramento e resposta. O processo crítico identificado é a coordenação interagências, comando e controle e integração de dados. A estratégia propõe integrar capacidades de monitoramento, decisão e resposta multidomínio, organizada por uma iniciativa específica e conectada a uma medida prática. Assim, a análise prospectiva deixa de ser apenas diagnóstico e passa a orientar uma agenda de ação.`
    : "Nenhuma síntese disponível.";
  document.getElementById("synthesisText").textContent = text;
}

function renderTable() {
  const tbody = document.getElementById("strategyTableBody");
  tbody.innerHTML = "";

  state.rows.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.missao_titulo || "-"}</td>
      <td>${row.objetivo_titulo || "-"}</td>
      <td>${row.processo_titulo || "-"}</td>
      <td>${row.estrategia_titulo || "-"}</td>
      <td>${row.iniciativa_titulo || "-"}</td>
      <td>${row.medida_titulo || "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderAll() {
  renderMetrics();
  renderPath();
  renderSynthesis();
  renderTable();
}

function downloadText(filename, text, type = "text/plain") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportJson() {
  downloadText("estrategia_md2036.json", JSON.stringify(state.rows, null, 2), "application/json");
}

function exportCsv() {
  const header = ["missao", "objetivo", "processo", "estrategia", "iniciativa", "medida"];
  const lines = [header.join(";")];

  state.rows.forEach(row => {
    lines.push([
      `"${String(row.missao_titulo || "").replaceAll('"', '""')}"`,
      `"${String(row.objetivo_titulo || "").replaceAll('"', '""')}"`,
      `"${String(row.processo_titulo || "").replaceAll('"', '""')}"`,
      `"${String(row.estrategia_titulo || "").replaceAll('"', '""')}"`,
      `"${String(row.iniciativa_titulo || "").replaceAll('"', '""')}"`,
      `"${String(row.medida_titulo || "").replaceAll('"', '""')}"`
    ].join(";"));
  });

  downloadText("estrategia_md2036.csv", lines.join("\n"), "text/csv;charset=utf-8");
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("reloadBtn").addEventListener("click", () => {
    loadData().catch(err => setStatus(err.message, "error"));
  });

  document.getElementById("exportJsonBtn").addEventListener("click", exportJson);
  document.getElementById("exportCsvBtn").addEventListener("click", exportCsv);

  loadData().catch(err => {
    console.error(err);
    setStatus(err.message, "error");
  });
});
