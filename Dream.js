/**
 * ARQUITETURA CENTRALIZADA DE ESTADO (AppStore)
 * Abordagem corporativa para blindagem e controle de dados estruturados.
 */
const AppStore = {
  materiais: [
    {
      id: "barraca",
      nome: "Barraca Expedition Pro",
      qtd: 8,
      manutencao: false,
      minIdeal: 3,
      icone: "🏕️",
    },
    {
      id: "mochila",
      nome: "Mochila Cargueira 50L Tactical",
      qtd: 14,
      manutencao: false,
      minIdeal: 4,
      icone: "🎒",
    },
    {
      id: "fogareiro",
      nome: "Fogareiro Industrial Camp",
      qtd: 4,
      manutencao: true,
      minIdeal: 2,
      icone: "🔥",
    },
    {
      id: "corda",
      nome: "Corda Naval Estática 20m",
      qtd: 9,
      manutencao: false,
      minIdeal: 3,
      icone: "⛓️",
    },
    {
      id: "lanterna",
      nome: "Lanterna Militar LED 1200lm",
      qtd: 11,
      manutencao: false,
      minIdeal: 3,
      icone: "🔦",
    },
  ],
  eventos: [
    {
      id: "ev_corp_1",
      nome: "Acampamento Distrital Anual",
      data: "2026-08-20",
      insumos: ["barraca", "fogareiro", "mochila"],
    },
    {
      id: "ev_corp_2",
      nome: "Operação Trilha Noturna",
      data: "2026-07-28",
      insumos: ["lanterna", "corda"],
    },
  ],
  logs: [],
  idAtividadeEmFoco: null,

  persistir() {
    localStorage.setItem(
      "enterprise_suprimentos",
      JSON.stringify(this.materiais),
    );
    localStorage.setItem("enterprise_agenda", JSON.stringify(this.eventos));
    localStorage.setItem("enterprise_auditoria", JSON.stringify(this.logs));
  },

  carregar() {
    const m = localStorage.getItem("enterprise_suprimentos");
    const e = localStorage.getItem("enterprise_agenda");
    const l = localStorage.getItem("enterprise_auditoria");
    if (m) this.materiais = JSON.parse(m);
    if (e) this.eventos = JSON.parse(e);
    if (l) this.logs = JSON.parse(l);
  },

  registrarLog(mensagem) {
    const timestamp = new Date().toLocaleTimeString("pt-BR");
    this.logs.unshift({ time: timestamp, msg: mensagem });
    if (this.logs.length > 30) this.logs.pop(); // Evita estouro de memória local
    this.persistir();
    this.renderLogs();
  },

  renderLogs() {
    const terminal = document.getElementById("terminalLogs");
    terminal.innerHTML = this.logs
      .map(
        (l) => `
                <div class="log-item"><span class="log-time">[${l.time}]</span> > ${l.msg}</div>
            `,
      )
      .join("");
  },
};

// ================= RENDERS E INTERFACE PRINCIPAL =================

function inicializarInterface() {
  AppStore.carregar();
  populateSelectors();
  renderEstoqueTable();
  renderEventosAgenda();
  AppStore.registrarLog("Núcleo de ERP Alfa inicializado com sucesso.");
}

function populateSelectors() {
  const seletor = document.getElementById("seletorMaterial");
  seletor.innerHTML = AppStore.materiais
    .map(
      (m) => `
            <option value="${m.id}">${m.icone} ${m.nome}</option>
        `,
    )
    .join("");
}

function renderEstoqueTable() {
  const tbody = document.getElementById("listaEstoqueGrid");
  tbody.innerHTML = "";

  let somaTotalUnidades = 0;
  let contagemRetidosManutencao = 0;
  let contagemAbaixoMinimo = 0;
  let sumSlaPercent = 0;

  AppStore.materiais.forEach((item) => {
    somaTotalUnidades += item.qtd;
    if (item.manutencao) contagemRetidosManutencao++;
    if (item.qtd <= item.minIdeal) contagemAbaixoMinimo++;

    // Regra de Saúde Operacional Individual
    let itemSla = Math.min(
      100,
      Math.floor((item.qtd / (item.minIdeal * 2)) * 100),
    );
    sumSlaPercent += itemSla;

    const badgeStatus = item.manutencao
      ? `<span class="badge-ent badge-danger">🔧 Manutenção Impeditiva</span>`
      : `<span class="badge-ent badge-success">✅ Disponível para Uso</span>`;

    const labelBotaoAcao = item.manutencao
      ? "Liberar Manutenção"
      : "Retirar para Reparo";

    const tr = document.createElement("tr");
    tr.innerHTML = `
                <td style="font-weight: 500;">${item.icone} ${item.nome}</td>
                <td style="font-weight: 600;">${item.qtd} unidades</td>
                <td>${badgeStatus}</td>
                <td style="text-align: right;">
                    <button class="btn-enterprise btn-secondary-ent" style="padding: 4px 10px; font-size: 0.75rem;" onclick="alternarStatusManutencao('${item.id}')">
                        ${labelBotaoAcao}
                    </button>
                </td>
            `;
    tbody.appendChild(tr);
  });

  // Atualizar KPIs Corporativos
  document.getElementById("kpiTotal").innerText = somaTotalUnidades;
  document.getElementById("kpiManutencao").innerText =
    contagemRetidosManutencao;
  document.getElementById("kpiCritico").innerText = contagemAbaixoMinimo;

  // Atualizar Barra Global de Cobertura Logística
  const mediaGlobalSla = AppStore.materiais.length
    ? Math.floor(sumSlaPercent / AppStore.materiais.length)
    : 100;
  const fill = document.getElementById("barraSaudeFill");

  document.getElementById("txtSaudePorcentagem").innerText =
    mediaGlobalSla + "%";
  fill.style.width = mediaGlobalSla + "%";

  if (mediaGlobalSla < 45) fill.style.backgroundColor = "var(--danger)";
  else if (mediaGlobalSla < 75) fill.style.backgroundColor = "var(--warning)";
  else fill.style.backgroundColor = "var(--success)";
}

function renderEventosAgenda() {
  const container = document.getElementById("gridEventos");
  container.innerHTML = "";

  if (AppStore.eventos.length === 0) {
    container.innerHTML = `<li style="text-align:center; font-size:0.875rem; padding:1rem; color:var(--txt-secundario);">Nenhuma ordem de atividade agendada.</li>`;
    return;
  }

  AppStore.eventos.forEach((ev) => {
    const dataFormatada = new Date(ev.data).toLocaleDateString("pt-BR", {
      timeZone: "UTC",
    });
    const li = document.createElement("li");
    li.className = "event-card-v2";
    li.innerHTML = `
                <div class="event-meta">
                    <h4>💼 ${ev.nome}</h4>
                    <span>Data Prevista: ${dataFormatada}</span>
                </div>
                <div style="display:flex; gap: 0.5rem;">
                    <button class="btn-enterprise btn-primary-ent" style="padding: 4px 10px; font-size: 0.75rem;" onclick="gerarRelatorioAnalise('${ev.id}')">Analisar</button>
                    <button class="btn-enterprise btn-secondary-ent" style="padding: 4px 10px; font-size: 0.75rem; border-color: var(--danger-bg); color: var(--danger);" onclick="removerEvento('${ev.id}')">Deletar</button>
                </div>
            `;
    container.appendChild(li);
  });
}

// ================= REGRAS E INTERAÇÕES DO NEGÓCIO =================

function alternarStatusManutencao(idMat) {
  const item = AppStore.materiais.find((m) => m.id === idMat);
  if (item) {
    item.manutencao = !item.manutencao;
    AppStore.registrarLog(
      `Alterado estado de manutenção do item [${item.nome}] para: ${item.manutencao}`,
    );
    AppStore.persistir();
    renderEstoqueTable();
    if (AppStore.idAtividadeEmFoco) reanalisarEventoAtivo();
  }
}

document.getElementById("btnLancar").addEventListener("click", () => {
  const idMat = document.getElementById("seletorMaterial").value;
  const tipo = document.getElementById("tipoMovimento").value;
  const qtd = parseInt(document.getElementById("quantidadeMov").value);

  if (isNaN(qtd) || qtd <= 0) {
    alert("Erro: Quantidade inválida inserida.");
    return;
  }

  const item = AppStore.materiais.find((m) => m.id === idMat);
  if (!item) return;

  if (tipo === "saida") {
    if (item.qtd < qtd) {
      alert(
        `Lançamento rejeitado: Saldo insuficiente para baixa corporativa. Saldo atual: ${item.qtd}`,
      );
      AppStore.registrarLog(
        `FALHA NA SOLICITAÇÃO: Tentativa de baixa frustrada de ${qtd} un. de [${item.nome}]`,
      );
      return;
    }
    item.qtd -= qtd;
    AppStore.registrarLog(
      `BAIXA: Retiradas ${qtd} unidades de [${item.nome}] do estoque.`,
    );
  } else {
    item.qtd += qtd;
    AppStore.registrarLog(
      `ENTRADA: Adicionadas ${qtd} unidades ao item [${item.nome}]`,
    );
  }

  AppStore.persistir();
  renderEstoqueTable();
  if (AppStore.idAtividadeEmFoco) reanalisarEventoAtivo();
});

document.getElementById("btnSalvarEvento").addEventListener("click", () => {
  const nome = document.getElementById("addNomeEvento").value.trim();
  const data = document.getElementById("addDataEvento").value;

  if (!nome || !data) {
    alert("Por favor, preencha todos os campos regulamentares do evento.");
    return;
  }

  const novoEvento = {
    id: "ev_" + Date.now(),
    nome: nome,
    data: data,
    insumos: mapearInsumosAutomaticos(nome),
  };

  AppStore.eventos.push(novoEvento);
  AppStore.registrarLog(`AGENDA: Criado evento corporativo [${nome}]`);
  AppStore.persistir();
  renderEventosAgenda();

  document.getElementById("addNomeEvento").value = "";
  document.getElementById("addDataEvento").value = "";
});

function removerEvento(idEv) {
  const evento = AppStore.eventos.find((e) => e.id === idEv);
  AppStore.eventos = AppStore.eventos.filter((e) => e.id !== idEv);
  AppStore.registrarLog(
    `AGENDA: Removido/Cancelado evento [${evento ? evento.nome : idEv}]`,
  );

  if (AppStore.idAtividadeEmFoco === idEv) {
    AppStore.idAtividadeEmFoco = null;
    document.getElementById("painelAnaliseInformativo").innerHTML =
      "Selecione uma ordem de atividade ativa para gerar o cruzamento de dados.";
  }

  AppStore.persistir();
  renderEventosAgenda();
}

function mapearInsumosAutomaticos(nome) {
  const n = nome.toLowerCase();
  if (n.includes("acampamento") || n.includes("jornada"))
    return ["barraca", "fogareiro", "mochila", "lanterna"];
  if (n.includes("trilha") || n.includes("noturna"))
    return ["lanterna", "corda", "mochila"];
  return ["barraca", "lanterna"];
}

function gerarRelatorioAnalise(idEv) {
  AppStore.idAtividadeEmFoco = idEv;
  reanalisarEventoAtivo();
}

function reanalisarEventoAtivo() {
  const evento = AppStore.eventos.find(
    (e) => e.id === AppStore.idAtividadeEmFoco,
  );
  if (!evento) return;

  let matAlertaManutencao = [];
  let matAlertaCompra = [];
  let stringMateriaisNecessarios = [];

  evento.insumos.forEach((idInsumo) => {
    const mat = AppStore.materiais.find((m) => m.id === idInsumo);
    if (mat) {
      stringMateriaisNecessarios.push(`${mat.icone} ${mat.nome}`);
      if (mat.manutencao) matAlertaManutencao.push(mat.nome);
      if (mat.qtd <= 1)
        matAlertaCompra.push(`${mat.nome} (Estoque Restante: ${mat.qtd})`);
    }
  });

  let htmlRelatorio = `
            <div style="margin-bottom: 0.75rem; font-weight:600; color: var(--primary);">📋 Ordem: ${evento.nome}</div>
            <div style="font-size: 0.85rem; margin-bottom: 0.5rem;"><strong>Insumos Vinculados:</strong> ${stringMateriaisNecessarios.join(", ")}</div>
        `;

  if (matAlertaManutencao.length > 0) {
    htmlRelatorio += `
                <div class="alert-box alert-danger">
                    <strong>⚠️ IMPEDIMENTO DE SUPRIMENTOS:</strong> Há itens retidos na manutenção indispensáveis para esta atividade: <br>
                    <em>${matAlertaManutencao.join(", ")}</em>
                </div>
            `;
  } else {
    htmlRelatorio += `
                <div class="alert-box alert-info" style="background-color: #f0fdf4; color: var(--success); border-left-color: var(--success);">
                    <strong>✓ LOGÍSTICA COMPATÍVEL:</strong> Todos os ativos vinculados encontram-se revisados e operacionais.
                </div>
            `;
  }

  if (matAlertaCompra.length > 0) {
    htmlRelatorio += `
                <div class="alert-box alert-danger" style="background-color: var(--warning-bg); border-left-color: var(--warning); color: var(--warning);">
                    <strong>🛒 SUGESTÃO DE COMPRA / ABASTECIMENTO:</strong> Nível crítico de estoque detectado para: <br>
                    <em>${matAlertaCompra.join(", ")}</em>
                </div>
            `;
  }

  document.getElementById("painelAnaliseInformativo").innerHTML = htmlRelatorio;
}

document.getElementById("btnMockData").addEventListener("click", () => {
  const mock = {
    id: "ev_mock_" + Date.now(),
    nome: "Simulação de Grande Jogo Regional",
    data: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    insumos: ["barraca", "mochila", "lanterna", "corda"],
  };
  AppStore.eventos.push(mock);
  AppStore.registrarLog(
    "MOCK DATA: Injetado evento de grande escala simulado.",
  );
  AppStore.persistir();
  renderEventosAgenda();
});

// Inicialização da Aplicação
window.onload = inicializarInterface;
