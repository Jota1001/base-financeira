(function () {
  "use strict";

  var STORAGE_KEY = "base-financeira-periodos";
  var STORAGE_KEY_ULTIMO = "base-financeira-ultimo-periodo";

  var MESES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  var form = document.getElementById("form-lancamento");
  var inputDescricao = document.getElementById("descricao");
  var inputValor = document.getElementById("valor");
  var inputTipo = document.getElementById("tipo");
  var lista = document.getElementById("lista-lancamentos");
  var emptyState = document.getElementById("empty-state");
  var saldoEl = document.getElementById("saldo");
  var btnLimpar = document.getElementById("limpar");

  var periodoLabel = document.getElementById("periodo-atual");
  var btnAnterior = document.getElementById("periodo-anterior");
  var btnSeguinte = document.getElementById("periodo-seguinte");

  var barReceita = document.getElementById("bar-receita");
  var barDespesa = document.getElementById("bar-despesa");
  var valorReceitaEl = document.getElementById("valor-receita");
  var valorDespesaEl = document.getElementById("valor-despesa");

  var svgEvolucao = document.getElementById("grafico-evolucao");
  var evolucaoVazia = document.getElementById("evolucao-vazia");

  function carregarUltimoPeriodo() {
    try {
      var salvo = window.localStorage.getItem(STORAGE_KEY_ULTIMO);
      if (salvo) {
        var partes = JSON.parse(salvo);
        if (typeof partes.ano === "number" && typeof partes.mes === "number") {
          return partes;
        }
      }
    } catch (e) { /* segue para o padrão */ }
    var hoje = new Date();
    return { ano: hoje.getFullYear(), mes: hoje.getMonth() };
  }

  function salvarUltimoPeriodo() {
    try {
      window.localStorage.setItem(STORAGE_KEY_ULTIMO, JSON.stringify(estado));
    } catch (e) { /* sem persistência disponível, sem problema */ }
  }

  var estado = carregarUltimoPeriodo();

  function chavePeriodo(ano, mes) {
    return ano + "-" + String(mes + 1).padStart(2, "0");
  }

  function carregarTudo() {
    try {
      var salvo = window.localStorage.getItem(STORAGE_KEY);
      return salvo ? JSON.parse(salvo) : {};
    } catch (e) {
      return {};
    }
  }

  function salvarTudo(dados) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
    } catch (e) {
      /* localStorage indisponível: segue funcionando só na sessão atual */
    }
  }

  var dados = carregarTudo();

  function lancamentosDoPeriodo() {
    var chave = chavePeriodo(estado.ano, estado.mes);
    return dados[chave] || [];
  }

  function definirLancamentosDoPeriodo(lista) {
    var chave = chavePeriodo(estado.ano, estado.mes);
    if (lista.length === 0) {
      delete dados[chave];
    } else {
      dados[chave] = lista;
    }
    salvarTudo(dados);
  }

  function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function totais(lancamentos) {
    var receita = 0;
    var despesa = 0;
    lancamentos.forEach(function (item) {
      if (item.tipo === "receita") receita += item.valor;
      else despesa += item.valor;
    });
    return { receita: receita, despesa: despesa, saldo: receita - despesa };
  }

  function renderizarPeriodo() {
    periodoLabel.textContent = MESES[estado.mes] + " de " + estado.ano;
  }

  function renderizarLista() {
    var lancamentos = lancamentosDoPeriodo();
    lista.innerHTML = "";

    if (lancamentos.length === 0) {
      lista.appendChild(emptyState);
    } else {
      lancamentos.forEach(function (item, indice) {
        var li = document.createElement("li");
        li.className = "entry-row";

        var desc = document.createElement("div");
        desc.className = "entry-desc";

        var nome = document.createElement("span");
        nome.className = "nome";
        nome.textContent = item.descricao;

        var tipoLabel = document.createElement("span");
        tipoLabel.className = "tipo-label";
        tipoLabel.textContent = item.tipo === "receita" ? "Receita" : "Despesa";

        desc.appendChild(nome);
        desc.appendChild(tipoLabel);

        var valor = document.createElement("span");
        valor.className = "entry-valor " + item.tipo;
        valor.textContent = (item.tipo === "despesa" ? "− " : "+ ") + formatarMoeda(item.valor);

        var remover = document.createElement("button");
        remover.className = "entry-remove";
        remover.type = "button";
        remover.setAttribute("aria-label", "Remover lançamento: " + item.descricao);
        remover.textContent = "×";
        remover.addEventListener("click", function () {
          var atuais = lancamentosDoPeriodo();
          atuais.splice(indice, 1);
          definirLancamentosDoPeriodo(atuais);
          renderizarTudo();
        });

        li.appendChild(desc);
        li.appendChild(valor);
        li.appendChild(remover);
        lista.appendChild(li);
      });
    }

    var t = totais(lancamentos);
    saldoEl.textContent = formatarMoeda(t.saldo);
    saldoEl.classList.toggle("negativo", t.saldo < 0);
  }

  function renderizarBarras() {
    var t = totais(lancamentosDoPeriodo());
    var maior = Math.max(t.receita, t.despesa, 1);

    barReceita.style.width = (t.receita / maior * 100) + "%";
    barDespesa.style.width = (t.despesa / maior * 100) + "%";
    valorReceitaEl.textContent = formatarMoeda(t.receita);
    valorDespesaEl.textContent = formatarMoeda(t.despesa);
  }

  function renderizarEvolucao() {
    var chaves = Object.keys(dados).sort();

    if (chaves.length < 2) {
      svgEvolucao.style.display = "none";
      evolucaoVazia.style.display = "block";
      return;
    }

    svgEvolucao.style.display = "block";
    evolucaoVazia.style.display = "none";

    var pontos = chaves.map(function (chave) {
      return { chave: chave, saldo: totais(dados[chave]).saldo };
    });

    var saldos = pontos.map(function (p) { return p.saldo; });
    var min = Math.min.apply(null, saldos.concat([0]));
    var max = Math.max.apply(null, saldos.concat([0]));
    if (max === min) { max = min + 1; }

    var largura = 600;
    var altura = 160;
    var margem = 12;
    var passoX = pontos.length > 1 ? (largura - margem * 2) / (pontos.length - 1) : 0;

    function y(valor) {
      var proporcao = (valor - min) / (max - min);
      return altura - margem - proporcao * (altura - margem * 2);
    }

    var coords = pontos.map(function (p, i) {
      return { x: margem + i * passoX, y: y(p.saldo) };
    });

    var linhaZero = y(0);

    var svgNS = "http://www.w3.org/2000/svg";
    while (svgEvolucao.firstChild) svgEvolucao.removeChild(svgEvolucao.firstChild);

    var eixoZero = document.createElementNS(svgNS, "line");
    eixoZero.setAttribute("x1", margem);
    eixoZero.setAttribute("x2", largura - margem);
    eixoZero.setAttribute("y1", linhaZero);
    eixoZero.setAttribute("y2", linhaZero);
    eixoZero.setAttribute("stroke", "#333c29");
    eixoZero.setAttribute("stroke-width", "1");
    svgEvolucao.appendChild(eixoZero);

    var pathD = coords.map(function (c, i) {
      return (i === 0 ? "M" : "L") + c.x.toFixed(1) + "," + c.y.toFixed(1);
    }).join(" ");

    var path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", pathD);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#7cb37e");
    path.setAttribute("stroke-width", "2.5");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("stroke-linecap", "round");
    svgEvolucao.appendChild(path);

    coords.forEach(function (c, i) {
      var ponto = document.createElementNS(svgNS, "circle");
      ponto.setAttribute("cx", c.x);
      ponto.setAttribute("cy", c.y);
      ponto.setAttribute("r", "3.5");
      ponto.setAttribute("fill", pontos[i].saldo < 0 ? "#d9835c" : "#7cb37e");
      svgEvolucao.appendChild(ponto);

      var rotulo = document.createElementNS(svgNS, "text");
      rotulo.setAttribute("x", c.x);
      rotulo.setAttribute("y", altura - 2);
      rotulo.setAttribute("fill", "#9aa38c");
      rotulo.setAttribute("font-size", "9");
      rotulo.setAttribute("text-anchor", "middle");
      var partes = pontos[i].chave.split("-");
      rotulo.textContent = MESES[parseInt(partes[1], 10) - 1].slice(0, 3) + "/" + partes[0].slice(2);
      svgEvolucao.appendChild(rotulo);
    });
  }

  function renderizarTudo() {
    renderizarPeriodo();
    renderizarLista();
    renderizarBarras();
    renderizarEvolucao();
  }

  form.addEventListener("submit", function (evento) {
    evento.preventDefault();

    var descricao = inputDescricao.value.trim();
    var valor = parseFloat(inputValor.value);
    var tipo = inputTipo.value;

    if (!descricao || isNaN(valor) || valor <= 0) return;

    var atuais = lancamentosDoPeriodo();
    atuais.push({ descricao: descricao, valor: valor, tipo: tipo });
    definirLancamentosDoPeriodo(atuais);
    renderizarTudo();

    form.reset();
    inputDescricao.focus();
  });

  btnLimpar.addEventListener("click", function () {
    if (lancamentosDoPeriodo().length === 0) return;
    if (window.confirm("Remover todos os lançamentos deste mês?")) {
      definirLancamentosDoPeriodo([]);
      renderizarTudo();
    }
  });

  btnAnterior.addEventListener("click", function () {
    estado.mes -= 1;
    if (estado.mes < 0) { estado.mes = 11; estado.ano -= 1; }
    salvarUltimoPeriodo();
    renderizarTudo();
  });

  btnSeguinte.addEventListener("click", function () {
    estado.mes += 1;
    if (estado.mes > 11) { estado.mes = 0; estado.ano += 1; }
    salvarUltimoPeriodo();
    renderizarTudo();
  });

  renderizarTudo();
})();
